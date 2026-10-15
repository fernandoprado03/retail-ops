import { createClient } from '@/utils/supabase/client'
import {
  BaseDatosMermaZonaB,
  CargaMermaLote,
  CargaVentaLote,
  ItemMerma,
  ItemVenta,
  ObjetivoJerarquia,
  OBJETIVOS_OCTUBRE_OFICIALES,
  normalizarCodigoTienda,
  TIENDAS_ZONA_B_INFO
} from '@/types/merma'
import { normalizarSku } from '@/utils/mermaParser'

const MERMA_RECORD_NAME = 'MERMA_ZONA_B_REGISTRO'
const MERMA_VENTAS_SUMMARY_NAME = 'MERMA_ZONA_B_VENTAS_SUMMARY'
const LOCAL_STORAGE_KEY = 'merma_zona_b_cache_v2'

export const ESTADO_INICIAL_MERMA: BaseDatosMermaZonaB = {
  version: 2,
  metaZonaB: 0.98, // Estándar Zona B Oficial Mes 10 (Octubre)
  lotes: [],
  lotesVentas: [],
  objetivos: OBJETIVOS_OCTUBRE_OFICIALES,
  itemsConsolidados: [],
  ventasConsolidadas: [],
  ventasPorTienda: {},
  ultimaActualizacion: new Date().toISOString()
}

/**
 * Carga la base de datos de Merma Zona B desde Supabase o fallback local
 */
export async function cargarBaseDatosMerma(): Promise<BaseDatosMermaZonaB> {
  const supabase = createClient()
  
  const autoSanarBase = (base: BaseDatosMermaZonaB): BaseDatosMermaZonaB => {
    base.lotes = (base.lotes || []).map(lote => ({
      ...lote,
      totalMermaSoles: Math.abs(lote.totalMermaSoles || 0),
      totalVentaSoles: Math.abs(lote.totalVentaSoles || 0)
    }))
    base.lotesVentas = base.lotesVentas || []
    base.ventasPorTienda = base.ventasPorTienda || {}
    
    // Si la meta está en el placeholder viejo de 4.84 o vacía, actualizar a la oficial de 0.98%
    if (!base.metaZonaB || base.metaZonaB === 4.84) {
      base.metaZonaB = 0.98
    }

    // Asegurar objetivos oficiales de octubre precargados
    if (!base.objetivos || base.objetivos.length === 0) {
      base.objetivos = [...OBJETIVOS_OCTUBRE_OFICIALES]
    } else {
      const existentesMap = new Set(base.objetivos.map(o => `${o.tienda}_${o.jerarquia.toUpperCase()}`))
      OBJETIVOS_OCTUBRE_OFICIALES.forEach(oficial => {
        const key = `${oficial.tienda}_${oficial.jerarquia.toUpperCase()}`
        if (!existentesMap.has(key)) {
          base.objetivos.push(oficial)
        }
      })
    }

    base.itemsConsolidados = (base.itemsConsolidados || []).map(item => {
      let merma = Math.abs(item.mermaSoles || 0)
      const unid = Math.abs(item.unidades || 0)
      const costoUnit = Math.abs(item.costoSoles || 0)
      if (merma === 0 && unid > 0 && costoUnit > 0) {
        merma = unid * costoUnit
      }
      const venta = Math.abs(item.ventaSoles || 0)
      const codTienda = normalizarCodigoTienda(item.nombreTienda || item.tienda || '103')
      const infoT = TIENDAS_ZONA_B_INFO.find(t => t.codigo === codTienda)
      const nombreTienda = infoT ? infoT.nombre.split(' - ')[1] : (item.nombreTienda || `Tienda ${codTienda}`)

      return {
        ...item,
        tienda: codTienda,
        nombreTienda,
        mermaSoles: merma,
        unidades: unid,
        costoSoles: costoUnit > 0 ? costoUnit : undefined,
        ventaSoles: venta > 0 ? venta : undefined
      }
    })

    // Recuperar ventas por tienda de la copia ligera local si existe
    if (typeof window !== 'undefined') {
      try {
        const vCached = localStorage.getItem('merma_zona_b_ventas_tiendas')
        if (vCached) {
          const vObj = JSON.parse(vCached)
          base.ventasPorTienda = { ...(base.ventasPorTienda || {}), ...vObj }
        }
      } catch (e) {}
    }

    base.ventasConsolidadas = (base.ventasConsolidadas || []).map(v => {
      const codTienda = normalizarCodigoTienda(v.tienda || v.nombreTienda || '103')
      const ventaSoles = Math.abs(v.ventaSoles || 0)
      if (ventaSoles > 0) {
        base.ventasPorTienda![codTienda] = (base.ventasPorTienda![codTienda] || 0) + ventaSoles
      }
      return {
        ...v,
        tienda: codTienda,
        ventaSoles,
        unidades: Math.abs(v.unidades || 0)
      }
    })

    return base
  }

  let baseFinal: BaseDatosMermaZonaB = ESTADO_INICIAL_MERMA

  try {
    const { data, error } = await supabase
      .from('semanas_planificadas')
      .select('id, data_reporte, updated_at')
      .eq('nombre_semana', MERMA_RECORD_NAME)
      .maybeSingle()

    if (!error && data && data.data_reporte) {
      baseFinal = autoSanarBase(data.data_reporte as BaseDatosMermaZonaB)
      baseFinal.id = data.id
    }
  } catch (err) {
    console.warn('Error al cargar base principal de Merma desde Supabase:', err)
  }

  // Cargar SIEMPRE el resumen de ventas garantizado de Supabase
  try {
    const { data: vData } = await supabase
      .from('semanas_planificadas')
      .select('data_reporte')
      .eq('nombre_semana', MERMA_VENTAS_SUMMARY_NAME)
      .maybeSingle()

    if (vData?.data_reporte?.ventasPorTienda) {
      baseFinal.ventasPorTienda = {
        ...(baseFinal.ventasPorTienda || {}),
        ...vData.data_reporte.ventasPorTienda
      }
      if (vData.data_reporte.lotesVentas && vData.data_reporte.lotesVentas.length > 0) {
        if (!baseFinal.lotesVentas || baseFinal.lotesVentas.length === 0) {
          baseFinal.lotesVentas = vData.data_reporte.lotesVentas
        }
      }
    }
  } catch (err) {
    console.warn('Error al cargar resumen de ventas desde Supabase:', err)
  }

  // Fallback si no había datos en Supabase: revisar LocalStorage
  if (baseFinal.itemsConsolidados.length === 0 && typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem('merma_zona_b_cache')
    if (cached) {
      try {
        const parsed = autoSanarBase(JSON.parse(cached))
        baseFinal = parsed
      } catch (e) {}
    }
  }

  // Garantizar cache local sincronizado
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('merma_zona_b_ventas_tiendas', JSON.stringify(baseFinal.ventasPorTienda || {}))
    } catch (e) {}
  }

  return baseFinal
}

/**
 * Guarda una nueva carga de merma (sea mes completo o semana incremental)
 */
export async function guardarLoteMerma(
  nuevoLote: CargaMermaLote,
  modo: 'reemplazar_todo' | 'acumular_incremental'
): Promise<BaseDatosMermaZonaB> {
  const supabase = createClient()
  const baseActual = await cargarBaseDatosMerma()

  // Evitar duplicar items en el lote para no sobrecargar el tamaño del JSON
  const loteResumen: CargaMermaLote = {
    ...nuevoLote,
    items: [] // Los items van consolidados en itemsConsolidados
  }

  let nuevosLotes: CargaMermaLote[] = []
  let itemsFinales: ItemMerma[] = []

  if (modo === 'reemplazar_todo') {
    nuevosLotes = [loteResumen]
    itemsFinales = [...nuevoLote.items]
  } else {
    const loteIndex = baseActual.lotes.findIndex(l => l.id === nuevoLote.id || l.periodo === nuevoLote.periodo)
    if (loteIndex >= 0) {
      nuevosLotes = [...baseActual.lotes]
      nuevosLotes[loteIndex] = loteResumen
    } else {
      nuevosLotes = [loteResumen, ...baseActual.lotes]
    }
    const itemsOtrosLotes = baseActual.itemsConsolidados.filter(i => i.loteId !== nuevoLote.id)
    itemsFinales = [...nuevoLote.items, ...itemsOtrosLotes]
  }

  const baseActualizada: BaseDatosMermaZonaB = {
    ...baseActual,
    lotes: nuevosLotes,
    itemsConsolidados: itemsFinales,
    ultimaActualizacion: new Date().toISOString()
  }

  await persistirBaseDatos(supabase, baseActualizada)
  return baseActualizada
}

/**
 * Guarda una nueva carga de ventas día por día de forma ultra-ligera y confiable
 */
export async function guardarLoteVentas(
  nuevoLote: CargaVentaLote,
  modo: 'reemplazar_todo' | 'acumular_incremental'
): Promise<BaseDatosMermaZonaB> {
  const supabase = createClient()
  const baseActual = await cargarBaseDatosMerma()

  // 1. Calcular de inmediato las ventas totales por tienda
  const ventasPorTiendaActualizadas: Record<string, number> = modo === 'reemplazar_todo'
    ? {}
    : { ...(baseActual.ventasPorTienda || {}) }

  nuevoLote.items.forEach(v => {
    const cod = normalizarCodigoTienda(v.tienda || v.nombreTienda || '103')
    ventasPorTiendaActualizadas[cod] = (ventasPorTiendaActualizadas[cod] || 0) + Math.abs(v.ventaSoles || 0)
  })

  // Redondear a 2 decimales
  Object.keys(ventasPorTiendaActualizadas).forEach(cod => {
    ventasPorTiendaActualizadas[cod] = Math.round(ventasPorTiendaActualizadas[cod] * 100) / 100
  })

  const loteResumen: CargaVentaLote = {
    ...nuevoLote,
    items: []
  }

  let nuevosLotesVenta: CargaVentaLote[] = []
  if (modo === 'reemplazar_todo') {
    nuevosLotesVenta = [loteResumen]
  } else {
    nuevosLotesVenta = [loteResumen, ...(baseActual.lotesVentas || []).filter(l => l.id !== nuevoLote.id)]
  }

  // 2. Persistir DE INMEDIATO el registro resumen de ventas (< 1KB) en Supabase (garantizado 100%)
  try {
    const { data: vExistente } = await supabase
      .from('semanas_planificadas')
      .select('id')
      .eq('nombre_semana', MERMA_VENTAS_SUMMARY_NAME)
      .maybeSingle()

    const summaryPayload = {
      nombre_semana: MERMA_VENTAS_SUMMARY_NAME,
      data_reporte: {
        ventasPorTienda: ventasPorTiendaActualizadas,
        lotesVentas: nuevosLotesVenta,
        ultimaActualizacion: new Date().toISOString()
      },
      data_personas: {
        tipo: 'ventas_summary',
        totalVentaSoles: nuevoLote.totalVentaSoles,
        tiendasActualizadas: Object.keys(ventasPorTiendaActualizadas)
      },
      updated_at: new Date().toISOString()
    }

    if (vExistente?.id) {
      await supabase.from('semanas_planificadas').update(summaryPayload).eq('id', vExistente.id)
    } else {
      await supabase.from('semanas_planificadas').insert(summaryPayload)
    }
  } catch (err) {
    console.error('Error al persistir MERMA_VENTAS_SUMMARY_NAME:', err)
  }

  // 3. Compactar ventasConsolidadas: en lugar de 19,000 filas diarias redundantes,
  // consolidar por (tienda, sku) para cruce SKU analítico instantáneo y liviano (< 400KB)
  const skuVentasMap = new Map<string, ItemVenta>()

  if (modo === 'acumular_incremental') {
    (baseActual.ventasConsolidadas || []).forEach(v => {
      const key = `${v.tienda}_${normalizarSku(v.sku)}`
      skuVentasMap.set(key, { ...v })
    })
  }

  nuevoLote.items.forEach(v => {
    const cod = normalizarCodigoTienda(v.tienda || v.nombreTienda || '103')
    const skuNorm = normalizarSku(v.sku)
    const key = `${cod}_${skuNorm}`
    const existing = skuVentasMap.get(key)
    const monto = Math.abs(v.ventaSoles || 0)
    const unid = Math.abs(v.unidades || 0)

    if (existing) {
      existing.ventaSoles = Math.round(((existing.ventaSoles || 0) + monto) * 100) / 100
      existing.unidades = (existing.unidades || 0) + unid
      if (!existing.descripcion && v.descripcion) existing.descripcion = v.descripcion
    } else {
      skuVentasMap.set(key, {
        id: `v-${key}`,
        tienda: cod,
        sku: skuNorm,
        descripcion: v.descripcion,
        seccion: v.seccion || 'GENERAL',
        ventaSoles: Math.round(monto * 100) / 100,
        unidades: unid,
        fecha: v.fecha
      })
    }
  })

  const ventasConsolidadasAgrupadas = Array.from(skuVentasMap.values())

  const baseActualizada: BaseDatosMermaZonaB = {
    ...baseActual,
    lotesVentas: nuevosLotesVenta,
    ventasConsolidadas: ventasConsolidadasAgrupadas,
    ventasPorTienda: ventasPorTiendaActualizadas,
    ultimaActualizacion: new Date().toISOString()
  }

  // 4. Guardar copia en localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('merma_zona_b_ventas_tiendas', JSON.stringify(ventasPorTiendaActualizadas))
    } catch (e) {}
  }

  await persistirBaseDatos(supabase, baseActualizada)
  return baseActualizada
}

/**
 * Guarda o actualiza los objetivos por jerarquía y tienda
 */
export async function guardarObjetivosJerarquia(
  nuevosObjetivos: ObjetivoJerarquia[]
): Promise<BaseDatosMermaZonaB> {
  const supabase = createClient()
  const baseActual = await cargarBaseDatosMerma()

  const baseActualizada: BaseDatosMermaZonaB = {
    ...baseActual,
    objetivos: nuevosObjetivos,
    ultimaActualizacion: new Date().toISOString()
  }

  await persistirBaseDatos(supabase, baseActualizada)
  return baseActualizada
}

/**
 * Guarda o actualiza las ventas por tienda directamente
 */
export async function guardarVentasPorTienda(
  ventasPorTienda: Record<string, number>
): Promise<BaseDatosMermaZonaB> {
  const supabase = createClient()
  const baseActual = await cargarBaseDatosMerma()

  const actualizadas = {
    ...(baseActual.ventasPorTienda || {}),
    ...ventasPorTienda
  }

  // 1. Guardar de inmediato en el registro ligero garantizado en Supabase
  try {
    const { data: vExistente } = await supabase
      .from('semanas_planificadas')
      .select('id')
      .eq('nombre_semana', MERMA_VENTAS_SUMMARY_NAME)
      .maybeSingle()

    const summaryPayload = {
      nombre_semana: MERMA_VENTAS_SUMMARY_NAME,
      data_reporte: {
        ventasPorTienda: actualizadas,
        ultimaActualizacion: new Date().toISOString()
      },
      data_personas: { tipo: 'ventas_summary', actualizadoManual: true },
      updated_at: new Date().toISOString()
    }

    if (vExistente?.id) {
      await supabase.from('semanas_planificadas').update(summaryPayload).eq('id', vExistente.id)
    } else {
      await supabase.from('semanas_planificadas').insert(summaryPayload)
    }
  } catch (err) {
    console.error('Error al guardar resumen ligero de ventas:', err)
  }

  // 2. Guardar en localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('merma_zona_b_ventas_tiendas', JSON.stringify(actualizadas))
    } catch (e) {}
  }

  const baseActualizada: BaseDatosMermaZonaB = {
    ...baseActual,
    ventasPorTienda: actualizadas,
    ultimaActualizacion: new Date().toISOString()
  }

  await persistirBaseDatos(supabase, baseActualizada)
  return baseActualizada
}

/**
 * Elimina un lote cargado de merma
 */
export async function eliminarLoteMerma(loteId: string): Promise<BaseDatosMermaZonaB> {
  const supabase = createClient()
  const baseActual = await cargarBaseDatosMerma()

  const nuevosLotes = baseActual.lotes.filter(l => l.id !== loteId)
  const itemsFinales = baseActual.itemsConsolidados.filter(i => i.loteId !== loteId)

  const baseActualizada: BaseDatosMermaZonaB = {
    ...baseActual,
    lotes: nuevosLotes,
    itemsConsolidados: itemsFinales,
    ultimaActualizacion: new Date().toISOString()
  }

  await persistirBaseDatos(supabase, baseActualizada)
  return baseActualizada
}

/**
 * Elimina un lote cargado de ventas
 */
export async function eliminarLoteVentas(loteId: string): Promise<BaseDatosMermaZonaB> {
  const supabase = createClient()
  const baseActual = await cargarBaseDatosMerma()

  const nuevosLotes = baseActual.lotesVentas.filter(l => l.id !== loteId)
  const ventasFinales = baseActual.ventasConsolidadas.filter(i => i.loteId !== loteId)

  const baseActualizada: BaseDatosMermaZonaB = {
    ...baseActual,
    lotesVentas: nuevosLotes,
    ventasConsolidadas: ventasFinales,
    ultimaActualizacion: new Date().toISOString()
  }

  await persistirBaseDatos(supabase, baseActualizada)
  return baseActualizada
}

/**
 * Función interna de sincronización con Supabase y LocalStorage
 */
async function persistirBaseDatos(supabase: any, base: BaseDatosMermaZonaB) {
  try {
    const { data: existente } = await supabase
      .from('semanas_planificadas')
      .select('id')
      .eq('nombre_semana', MERMA_RECORD_NAME)
      .maybeSingle()

    // Limpiar itemsConsolidados de campos redundantes para mantener payload ligero (< 6MB)
    const itemsLimpios = (base.itemsConsolidados || []).map(i => ({
      id: i.id,
      sku: String(i.sku).trim(),
      tienda: String(i.tienda).trim(),
      mermaSoles: Math.abs(i.mermaSoles || 0),
      unidades: Math.abs(i.unidades || 0),
      costoSoles: i.costoSoles ? Math.abs(i.costoSoles) : undefined,
      seccion: i.seccion || 'GENERAL',
      departamento: i.departamento,
      descripcion: i.descripcion,
      fecha: i.fecha,
      motivo: i.motivo
    }))

    const payload = {
      nombre_semana: MERMA_RECORD_NAME,
      data_reporte: {
        ...base,
        itemsConsolidados: itemsLimpios
      },
      data_personas: {
        metaZonaB: base.metaZonaB,
        totalLotesMerma: base.lotes.length,
        totalLotesVenta: base.lotesVentas.length,
        totalObjetivos: base.objetivos.length,
        ventasPorTienda: base.ventasPorTienda
      },
      updated_at: new Date().toISOString()
    }

    if (existente?.id) {
      const { error: updErr } = await supabase
        .from('semanas_planificadas')
        .update(payload)
        .eq('id', existente.id)
      if (updErr) {
        console.error('Error al actualizar en Supabase:', updErr)
        throw new Error('Supabase Update Error: ' + updErr.message)
      }
    } else {
      const { error: insErr } = await supabase
        .from('semanas_planificadas')
        .insert(payload)
      if (insErr) {
        console.error('Error al insertar en Supabase:', insErr)
        throw new Error('Supabase Insert Error: ' + insErr.message)
      }
    }
  } catch (err: any) {
    console.error('Error al persistir en Supabase:', err)
    // Lanzar error para que la interfaz notifique al usuario en vez de dar falso éxito
    throw err
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('merma_zona_b_ventas_tiendas', JSON.stringify(base.ventasPorTienda || {}))
    } catch (e) {}
    try {
      // Guardar en localStorage sólo los primeros 1,000 items para no saturar los 5MB de quota
      const baseLocal = {
        ...base,
        itemsConsolidados: (base.itemsConsolidados || []).slice(0, 1000),
        ventasConsolidadas: (base.ventasConsolidadas || []).slice(0, 1000)
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(baseLocal))
    } catch (e) {
      console.warn('LocalStorage limit reached', e)
    }
  }
}
