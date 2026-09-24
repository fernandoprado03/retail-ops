'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleUsuarioActivo(id: string, nuevoEstado: boolean) {
  const supabase = await createClient()
  
  // Verificar si el usuario que ejecuta la acción es admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }
  
  const { data: adminPerfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()
    
  if (adminPerfil?.rol !== 'admin') {
    return { success: false, error: 'No autorizado' }
  }

  // Ejecutar el update
  const { error } = await supabase
    .from('perfiles')
    .update({ activo: nuevoEstado })
    .eq('id', id)
    
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function agregarUsuario(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }
  
  const { data: adminPerfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (adminPerfil?.rol !== 'admin') return { success: false, error: 'No autorizado' }

  const nombre_completo = formData.get('nombre') as string
  const email = formData.get('email') as string
  const area_id = formData.get('area_id') as string

  if (!email || !nombre_completo) return { success: false, error: 'Datos incompletos' }

  const id = crypto.randomUUID()

  const { error } = await supabase.from('perfiles').insert({
    id,
    email,
    nombre_completo,
    rol: 'jefe_area',
    activo: true
  })

  if (error) {
    if (error.code === '23505') return { success: false, error: 'El correo ya existe' }
    return { success: false, error: error.message }
  }

  if (area_id) {
    await supabase.from('areas').update({ jefe_responsable_id: id }).eq('id', area_id)
  }

  revalidatePath('/admin/usuarios')
  return { success: true }
}
