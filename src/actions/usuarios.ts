'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

import { PermisosUsuario, PERMISOS_DEFAULT_JEFE } from '@/types/permisos'

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

  // Usar admin client si service_role key existe, de lo contrario cliente autenticado
  const dbClient = createAdminClient() || supabase

  // Ejecutar el update
  const { error } = await dbClient
    .from('perfiles')
    .update({ activo: nuevoEstado })
    .eq('id', id)
    
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function actualizarPermisosUsuario(id: string, permisos: PermisosUsuario) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }
  
  const { data: adminPerfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()
    
  if (adminPerfil?.rol !== 'admin') {
    return { success: false, error: 'No autorizado para cambiar permisos' }
  }

  const dbClient = createAdminClient() || supabase

  const { error } = await dbClient
    .from('perfiles')
    .update({ permisos })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/usuarios')
  revalidatePath('/boletin-j06')
  revalidatePath('/horarios-pro')
  revalidatePath('/apoyo')
  revalidatePath('/kpis')
  return { success: true }
}

export async function agregarUsuario(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }
  
  const { data: adminPerfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (adminPerfil?.rol !== 'admin') return { success: false, error: 'No autorizado' }

  const nombre_completo = formData.get('nombre') as string
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const area_id = formData.get('area_id') as string

  if (!email || !nombre_completo) return { success: false, error: 'Datos incompletos' }

  const id = crypto.randomUUID()

  // Usar admin client si service_role key existe para omitir RLS, de lo contrario cliente autenticado
  const dbClient = createAdminClient() || supabase

  const { error } = await dbClient.from('perfiles').insert({
    id,
    email,
    nombre_completo,
    rol: 'jefe_area',
    activo: true,
    permisos: PERMISOS_DEFAULT_JEFE
  })

  if (error) {
    if (error.code === '23505') return { success: false, error: 'El correo ya existe' }
    return { success: false, error: error.message }
  }

  if (area_id) {
    await dbClient.from('areas').update({ jefe_responsable_id: id }).eq('id', area_id)
  }

  revalidatePath('/admin/usuarios')
  return { success: true }
}

