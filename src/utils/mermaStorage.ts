import { createClient } from '@/utils/supabase/client'
import {
  BaseDatosMermaZonaB,
  CargaMermaLote,
  CargaVentaLote,
  ItemMerma,
  ItemVenta,
  ObjetivoJerarquia
} from '@/types/merma'

const MERMA_RECORD_NAME = 'MERMA_ZONA_B_REGISTRO'
const LOCAL_STORAGE_KEY = 'merma_zona_b_cache_v2'

export const ESTADO_INICIAL_MERMA: BaseDatosMermaZonaB = {
  version: 2,
  metaZonaB: 4.84, // Estándar Zona B
  lotes: [],
  lotesVentas: [],
  objetivos: [],
  itemsConsolidados: [],
  ventasConsolidadas: [],
  ultimaActualizacion: new Date().toISOString()
}

/**
 * Carga la base de datos de Merma Zona B desde Supabase o fallback local
 */
export async function cargarBaseDatosMerma(): Promise<BaseDatosMermaZonaB> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('semanas_planificadas')
      .select('id, data_reporte, updated_at')
      .eq('nombre_semana', MERMA_RECORD_NAME)
      .maybeSingle()

    if (!error && data && data.data_reporte) {
      const baseRemota = data.data_reporte as BaseDatosMermaZonaB
      baseRemota.id = data.id
      // Asegurar arrays no nulos
      baseRemota.lotes = baseRemota.lotes || []
      baseRemota.lotesVentas = baseRemota.lotesVentas || []
      baseRemota.objetivos = baseRemota.objetivos || []
      baseRemota.itemsConsolidados = baseRemota.itemsConsolidados || []
      baseRemota.ventasConsolidadas = baseRemota.ventasConsolidadas || []

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

  // Fallback a localStorage
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        parsed.lotes = parsed.lotes || []
        parsed.lotesVentas = parsed.lotesVentas || []
        parsed.objetivos = parsed.objetivos || []
        parsed.itemsConsolidados = parsed.itemsConsolidados || []
        parsed.ventasConsolidadas = parsed.ventasConsolidadas || []
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

  let nuevosLotes: CargaMermaLote[] = []
  let itemsFinales: ItemMerma[] = []

  if (modo === 'reemplazar_todo') {
    nuevosLotes = [nuevoLote]
    itemsFinales = [...nuevoLote.items]
  } else {
    const loteIndex = baseActual.lotes.findIndex(l => l.id === nuevoLote.id || l.periodo === nuevoLote.periodo)
    if (loteIndex >= 0) {
      nuevosLotes = [...baseActual.lotes]
      nuevosLotes[loteIndex] = nuevoLote
    } else {
      nuevosLotes = [nuevoLote, ...baseActual.lotes]
    }
    itemsFinales = nuevosLotes.flatMap(l => l.items)
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

  let nuevosLotesVenta: CargaVentaLote[] = []
  let ventasFinales: ItemVenta[] = []

  if (modo === 'reemplazar_todo') {
    nuevosLotesVenta = [nuevoLote]
    ventasFinales = [...nuevoLote.items]
  } else {
    const loteIndex = baseActual.lotesVentas.findIndex(l => l.id === nuevoLote.id || l.periodo === nuevoLote.periodo)
    if (loteIndex >= 0) {
      nuevosLotesVenta = [...baseActual.lotesVentas]
      nuevosLotesVenta[loteIndex] = nuevoLote
    } else {
      nuevosLotesVenta = [nuevoLote, ...baseActual.lotesVentas]
    }
    ventasFinales = nuevosLotesVenta.flatMap(l => l.items)
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
  const itemsFinales = nuevosLotes.flatMap(l => l.items)

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
  const ventasFinales = nuevosLotes.flatMap(l => l.items)

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
      await supabase
        .from('semanas_planificadas')
        .update(payload)
        .eq('id', existente.id)
    } else {
      await supabase
        .from('semanas_planificadas')
        .insert(payload)
    }
  } catch (err) {
    console.error('Error al persistir en Supabase:', err)
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(base))
    } catch (e) {
      console.warn('LocalStorage limit reached', e)
    }
  }
}
