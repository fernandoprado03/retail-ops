'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import webpush from 'web-push'

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:contacto@tottus.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function crearIncidencia(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
        reportado_por_id: user?.id || null
      }
    ])
    .select()

  if (error) {
    console.error("Error inserting incidencia:", error)
    return { success: false, error: error.message }
  }

  // Notificación Push
  try {
    const { data: areaData } = await supabase
      .from('areas')
      .select('jefe_responsable_id')
      .eq('id', area_id)
      .single()

    if (areaData?.jefe_responsable_id && process.env.VAPID_PRIVATE_KEY) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', areaData.jefe_responsable_id)

      if (subs && subs.length > 0) {
        const payload = JSON.stringify({
          title: '🚨 Nuevo Ticket Asignado',
          body: `${tipo_incidencia}: ${descripcion}`,
          url: `/ticket/${data[0].id}`
        })
        
        for (const s of subs) {
          try {
            await webpush.sendNotification(s.subscription, payload)
          } catch (e) {
            console.error('Error sending push to specific sub:', e)
          }
        }
      }
    }
  } catch (err) {
    console.error('Push notification failed:', err)
  }

  revalidatePath('/')
  revalidatePath('/pendientes')
  revalidatePath('/kpis')
  return { success: true, data }
}

export async function subsanarIncidencia(formData: FormData) {
  const supabase = await createClient()
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
  const supabase = await createClient()
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
