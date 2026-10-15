import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MermaAdminClient from './MermaAdminClient'
import { Shield } from 'lucide-react'

export const metadata = {
  title: 'Gestión de Merma Zona B - Retail Ops',
  description: 'Módulo de administración y consolidación de reportes de merma para Zona B',
}

export const revalidate = 0

export default async function MermaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, activo')
    .eq('id', user.id)
    .single()

  // Solo Fernando / Administrador puede acceder a la carga y configuración de merma
  if (!perfil || perfil.rol !== 'admin' || !perfil.activo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Acceso Denegado</h1>
        <p className="text-slate-500 max-w-sm">
          Este módulo está reservado exclusivamente para el Administrador del sistema.
        </p>
      </div>
    )
  }

  return <MermaAdminClient />
}
