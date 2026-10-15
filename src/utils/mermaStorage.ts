import { createClient } from '@/utils/supabase/client'
import { BaseDatosMermaZonaB, CargaMermaLote, ItemMerma } from '@/types/merma'

const MERMA_RECORD_NAME = 'MERMA_ZONA_B_REGISTRO'
const LOCAL_STORAGE_KEY = 'merma_zona_b_cache_v1'

export const ESTADO_INICIAL_MERMA: BaseDatosMermaZonaB = {
  version: 1,
  metaZonaB: 4.84, // Estándar Zona B
  lotes: [],
  itemsConsolidados: [],
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
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(baseRemota))
      }
      return baseRemota
    }
  } catch (err) {
    console.warn('No se pudo conectar a Supabase para cargar Merma, revisando caché local:', err)
  }

  // Fallback a localStorage si Supabase no responde o es primera vez
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (cached) {
      try {
        return JSON.parse(cached)
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
    // Si ya existía un lote con el mismo período o ID, lo actualizamos; sino agregamos
    const loteIndex = baseActual.lotes.findIndex(l => l.id === nuevoLote.id || l.periodo === nuevoLote.periodo)
    if (loteIndex >= 0) {
      nuevosLotes = [...baseActual.lotes]
      nuevosLotes[loteIndex] = nuevoLote
    } else {
      nuevosLotes = [nuevoLote, ...baseActual.lotes]
    }

    // Reconstruir lista de items consolidados a partir de todos los lotes
    itemsFinales = nuevosLotes.flatMap(l => l.items)
  }

  const baseActualizada: BaseDatosMermaZonaB = {
    ...baseActual,
    lotes: nuevosLotes,
    itemsConsolidados: itemsFinales,
    ultimaActualizacion: new Date().toISOString()
  }

  // Guardar en Supabase
  try {
    const { data: existente } = await supabase
      .from('semanas_planificadas')
      .select('id')
      .eq('nombre_semana', MERMA_RECORD_NAME)
      .maybeSingle()

    if (existente?.id) {
      await supabase
        .from('semanas_planificadas')
        .update({
          data_reporte: baseActualizada,
          data_personas: { metaZonaB: baseActualizada.metaZonaB, totalLotes: nuevosLotes.length },
          updated_at: new Date().toISOString()
        })
        .eq('id', existente.id)
    } else {
      await supabase
        .from('semanas_planificadas')
        .insert({
          nombre_semana: MERMA_RECORD_NAME,
          data_reporte: baseActualizada,
          data_personas: { metaZonaB: baseActualizada.metaZonaB, totalLotes: nuevosLotes.length }
        })
    }
  } catch (err) {
    console.error('Error al persistir en Supabase:', err)
  }

  // Guardar en localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(baseActualizada))
  }

  return baseActualizada
}

/**
 * Elimina un lote cargado por ID
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

  try {
    const { data: existente } = await supabase
      .from('semanas_planificadas')
      .select('id')
      .eq('nombre_semana', MERMA_RECORD_NAME)
      .maybeSingle()

    if (existente?.id) {
      await supabase
        .from('semanas_planificadas')
        .update({
          data_reporte: baseActualizada,
          data_personas: { metaZonaB: baseActualizada.metaZonaB, totalLotes: nuevosLotes.length },
          updated_at: new Date().toISOString()
        })
        .eq('id', existente.id)
    }
  } catch (err) {
    console.error('Error al eliminar lote en Supabase:', err)
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(baseActualizada))
  }

  return baseActualizada
}
