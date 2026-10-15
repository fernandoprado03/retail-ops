import { createClient } from '@/utils/supabase/client'
import {
  BaseDatosMermaZonaB,
  CargaMermaLote,
  CargaVentaLote,
  ItemMerma,
  ItemVenta,
  ObjetivoJerarquia,
  OBJETIVOS_OCTUBRE_OFICIALES
} from '@/types/merma'

const MERMA_RECORD_NAME = 'MERMA_ZONA_B_REGISTRO'
const LOCAL_STORAGE_KEY = 'merma_zona_b_cache_v2'

export const ESTADO_INICIAL_MERMA: BaseDatosMermaZonaB = {
  version: 2,
  metaZonaB: 0.98, // Estándar Zona B Oficial Mes 10 (Octubre)
  lotes: [],
  lotesVentas: [],
  objetivos: OBJETIVOS_OCTUBRE_OFICIALES,
  itemsConsolidados: [],
  ventasConsolidadas: [],
  ultimaActualizacion: new Date().toISOString()
}

/**
 * Carga la base de datos de Merma Zona B desde Supabase o fallback local
 */
export async function cargarBaseDatosMerma(): Promise<BaseDatosMermaZonaB> {
  const supabase = createClient()
  
  const autoSanarBase = (base: BaseDatosMermaZonaB): BaseDatosMermaZonaB => {
    base.lotes = base.lotes || []
    base.lotesVentas = base.lotesVentas || []
    
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
      let merma = item.mermaSoles || 0
      const unid = item.unidades || 0
      const costoUnit = item.costoSoles || 0
      if (merma === 0 && unid > 0 && costoUnit > 0) {
        merma = unid * costoUnit
      }
      return {
        ...item,
        mermaSoles: merma
      }
    })
    base.ventasConsolidadas = base.ventasConsolidadas || []
    return base
  }

  try {
    const { data, error } = await supabase
      .from('semanas_planificadas')
      .select('id, data_reporte, updated_at')
      .eq('nombre_semana', MERMA_RECORD_NAME)
      .maybeSingle()

    if (!error && data && data.data_reporte) {
      const baseRemota = autoSanarBase(data.data_reporte as BaseDatosMermaZonaB)
      baseRemota.id = data.id

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(baseRemota))
        } catch (storageErr) {
          console.warn('LocalStorage lleno, manteniendo datos en memoria', storageErr)
        }
      }
      return baseRemota
    }
  } catch (err) {
    console.warn('No se pudo conectar a Supabase para cargar Merma, revisando caché local:', err)
  }

  // Fallback a localStorage (v2 o v1)
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem('merma_zona_b_cache')
    if (cached) {
      try {
        const parsed = autoSanarBase(JSON.parse(cached))
        return parsed
      } catch (e) {}
    }
  }

  return ESTADO_INICIAL_MERMA
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
    // Filtrar items previos del mismo lote si existía y sumar los nuevos
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
 * Guarda una nueva carga de ventas día por día
 */
export async function guardarLoteVentas(
  nuevoLote: CargaVentaLote,
  modo: 'reemplazar_todo' | 'acumular_incremental'
): Promise<BaseDatosMermaZonaB> {
  const supabase = createClient()
  const baseActual = await cargarBaseDatosMerma()

  const loteResumen: CargaVentaLote = {
    ...nuevoLote,
    items: [] // Los items van consolidados en ventasConsolidadas
  }

  let nuevosLotesVenta: CargaVentaLote[] = []
  let ventasFinales: ItemVenta[] = []

  if (modo === 'reemplazar_todo') {
    nuevosLotesVenta = [loteResumen]
    ventasFinales = [...nuevoLote.items]
  } else {
    const loteIndex = baseActual.lotesVentas.findIndex(l => l.id === nuevoLote.id || l.periodo === nuevoLote.periodo)
    if (loteIndex >= 0) {
      nuevosLotesVenta = [...baseActual.lotesVentas]
      nuevosLotesVenta[loteIndex] = loteResumen
    } else {
      nuevosLotesVenta = [loteResumen, ...baseActual.lotesVentas]
    }
    const ventasOtrosLotes = baseActual.ventasConsolidadas.filter(i => i.loteId !== nuevoLote.id)
    ventasFinales = [...nuevoLote.items, ...ventasOtrosLotes]
  }

  const baseActualizada: BaseDatosMermaZonaB = {
    ...baseActual,
    lotesVentas: nuevosLotesVenta,
    ventasConsolidadas: ventasFinales,
    ultimaActualizacion: new Date().toISOString()
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

    const payload = {
      nombre_semana: MERMA_RECORD_NAME,
      data_reporte: base,
      data_personas: {
        metaZonaB: base.metaZonaB,
        totalLotesMerma: base.lotes.length,
        totalLotesVenta: base.lotesVentas.length,
        totalObjetivos: base.objetivos.length
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
        throw new Error(updErr.message)
      }
    } else {
      const { error: insErr } = await supabase
        .from('semanas_planificadas')
        .insert(payload)
      if (insErr) {
        console.error('Error al insertar en Supabase:', insErr)
        throw new Error(insErr.message)
      }
    }
  } catch (err: any) {
    console.error('Error al persistir en Supabase:', err)
    // No silenciar si es error fatal para que el caller pueda notificar
    if (typeof window === 'undefined') {
      throw err
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(base))
    } catch (e) {
      console.warn('LocalStorage limit reached', e)
    }
  }
}
