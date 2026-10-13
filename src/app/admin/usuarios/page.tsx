import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Shield, User } from 'lucide-react'
import ActivarUsuarioBoton from './ActivarUsuarioBoton'
import AgregarUsuarioModal from './AgregarUsuarioModal'
import GestionarPermisosModal from './GestionarPermisosModal'
import { normalizarPermisos } from '@/types/permisos'

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

  // 3. Get all areas for the modal
  const { data: areas } = await supabase
    .from('areas')
    .select('id, nombre_area')
    .order('nombre_area')

  return (
    <div className="pb-12">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-600" />
            Módulo Administrativo
          </h1>
          <p className="text-sm text-slate-500">Gestiona usuarios y asigna qué módulos pueden ver y editar.</p>
        </div>
        <AgregarUsuarioModal areas={areas || []} />
      </div>

      <div className="space-y-4">
        {usuarios?.map((u) => {
          const perms = normalizarPermisos(u.permisos, u.rol)

          return (
            <Card key={u.id} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 text-sm leading-none">
                          {u.nombre_completo || 'Sin nombre'}
                        </h3>
                        <Badge variant="outline" className={u.rol === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200 text-[10px]' : 'bg-slate-50 text-slate-600 text-[10px]'}>
                          {u.rol === 'admin' ? 'Admin' : 'Jefe de Área'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mb-2 font-mono">{u.email}</p>
                      
                      {/* Resumen de permisos asignados */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[11px] font-medium text-slate-400 mr-1">Módulos:</span>
                        {u.rol === 'admin' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                            ⚡ Acceso Total (Admin)
                          </span>
                        ) : (
                          <>
                            {perms.boletin_j06.ver && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                📊 Boletín J06 {perms.boletin_j06.editar ? '(Ver+Editar)' : '(Lectura)'}
                              </span>
                            )}
                            {perms.horarios_pro.ver && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                📅 Malla Pro {perms.horarios_pro.editar ? '(Ver+Editar)' : '(Lectura)'}
                              </span>
                            )}
                            {perms.apoyo.ver && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                👥 Malla Apoyo {perms.apoyo.editar ? '(Ver+Editar)' : '(Lectura)'}
                              </span>
                            )}
                            {perms.kpis.ver && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                📈 KPIs
                              </span>
                            )}
                            {perms.incidencias.ver && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                                🎫 Incidencias {perms.incidencias.editar ? '(Ver+Editar)' : '(Lectura)'}
                              </span>
                            )}
                            {!perms.boletin_j06.ver && !perms.horarios_pro.ver && !perms.apoyo.ver && !perms.kpis.ver && !perms.incidencias.ver && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                                🚫 Sin módulos asignados
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div>
                      {u.activo ? (
                        <Badge className="bg-green-100 text-green-700 border-0 flex items-center gap-1 shadow-none">
                          <CheckCircle2 className="w-3 h-3" /> Activo
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border-0 flex items-center gap-1 shadow-none">
                          <XCircle className="w-3 h-3" /> Bloqueado
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <GestionarPermisosModal usuario={u} />
                      <ActivarUsuarioBoton 
                        usuarioId={u.id} 
                        estadoActual={u.activo} 
                        isSelf={u.id === user.id}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
