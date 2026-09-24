import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Shield, User } from 'lucide-react'
import ActivarUsuarioBoton from './ActivarUsuarioBoton'

export const revalidate = 0

export default async function AdminUsuarios() {
  const supabase = await createClient()
  
  // 1. Check if current user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
    
  const { data: perfilActual } = await supabase
    .from('perfiles')
    .select('rol, activo')
    .eq('id', user.id)
    .single()

  if (!perfilActual || perfilActual.rol !== 'admin' || !perfilActual.activo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Acceso Denegado</h1>
        <p className="text-slate-500">No tienes permisos de Administrador para ver esta página.</p>
      </div>
    )
  }

  // 2. Get all users
  const { data: usuarios } = await supabase
    .from('perfiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-green-600" />
          Módulo Administrativo
        </h1>
        <p className="text-sm text-slate-500">Gestiona quién puede entrar a la aplicación.</p>
      </div>

      <div className="space-y-4">
        {usuarios?.map((u) => (
          <Card key={u.id} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm leading-none mb-1">
                      {u.nombre_completo || 'Sin nombre'}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2">{u.email}</p>
                    <Badge variant="outline" className={u.rol === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-600'}>
                      {u.rol === 'admin' ? 'Admin' : 'Jefe de Área'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {u.activo ? (
                    <Badge className="bg-green-100 text-green-700 border-0 flex items-center gap-1 shadow-none">
                      <CheckCircle2 className="w-3 h-3" /> Activo
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 border-0 flex items-center gap-1 shadow-none">
                      <XCircle className="w-3 h-3" /> Bloqueado
                    </Badge>
                  )}
                  
                  {/* Client component for the toggle button */}
                  <ActivarUsuarioBoton 
                    usuarioId={u.id} 
                    estadoActual={u.activo} 
                    isSelf={u.id === user.id}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
