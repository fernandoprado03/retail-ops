'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function crearIncidencia(formData: FormData) {
  const area_id = formData.get('area_id') as string
  const tipo_incidencia = formData.get('tipo_incidencia') as string
  const descripcion = formData.get('descripcion') as string
  const prioridad = formData.get('prioridad') as string
  const fotoUrl = formData.get('fotoUrl') as string

  const { data, error } = await supabase
    .from('observaciones')
    .insert([
      {
        area_id,
        tipo_incidencia,
        descripcion,
        prioridad,
        foto_antes_url: fotoUrl,
        estado: 'Pendiente',
        reportado_por_id: null // In MVP we might not have a signed-in user or we just default it
      }
    ])
    .select()

  if (error) {
    console.error("Error inserting incidencia:", error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/pendientes')
  revalidatePath('/kpis')
  return { success: true, data }
}

export async function subsanarIncidencia(formData: FormData) {
  const id = formData.get('id') as string
  const comentario = formData.get('comentario') as string
  const fotoDespuesUrl = formData.get('fotoUrl') as string

  const { data, error } = await supabase
    .from('observaciones')
    .update({
      estado: 'Subsanado',
      comentario_subsanacion: comentario,
      foto_despues_url: fotoDespuesUrl,
      fecha_subsanacion: new Date().toISOString()
    })
    .eq('id', id)
    .select()

  if (error) {
    console.error("Error updating incidencia:", error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/pendientes')
  revalidatePath('/kpis')
  return { success: true, data }
}

export async function validarIncidencia(id: string, accion: 'aprobar' | 'rechazar', comentarioGerencia?: string) {
  const nuevoEstado = accion === 'aprobar' ? 'Aprobado' : 'Rechazado'
  
  const updateData: any = { estado: nuevoEstado }
  if (comentarioGerencia) {
    updateData.comentario_gerencia = comentarioGerencia
  }

  const { data, error } = await supabase
    .from('observaciones')
    .update(updateData)
    .eq('id', id)
    .select()

  if (error) {
    console.error("Error validating incidencia:", error)
    return { success: false, error: error.message }
  }

  revalidatePath('/')
  revalidatePath('/pendientes')
  revalidatePath('/kpis')
  return { success: true, data }
}
