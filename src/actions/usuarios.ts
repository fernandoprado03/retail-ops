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
