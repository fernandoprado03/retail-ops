'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  SlidersHorizontal,
  X,
  Check,
  Eye,
  Edit3,
  Shield,
  FileSpreadsheet,
  CalendarRange,
  Users,
  BarChart3,
  ClipboardList,
  Sparkles,
  Lock,
  CalendarDays
} from 'lucide-react'
import { PermisosUsuario, normalizarPermisos } from '@/types/permisos'
import { actualizarPermisosUsuario } from '@/actions/usuarios'

interface Props {
  usuario: {
    id: string
    nombre_completo?: string | null
    email: string
    rol: string
    permisos?: any
  }
}

export default function GestionarPermisosModal({ usuario }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [permisos, setPermisos] = useState<PermisosUsuario>(() =>
    normalizarPermisos(usuario.permisos, usuario.rol)
  )

  const handleOpen = () => {
    setPermisos(normalizarPermisos(usuario.permisos, usuario.rol))
    setIsOpen(true)
  }

  const handleGuardar = async () => {
    setIsLoading(true)
    const res = await actualizarPermisosUsuario(usuario.id, permisos)
    if (res.success) {
      setIsOpen(false)
    } else {
      alert('Error al guardar permisos: ' + res.error)
    }
    setIsLoading(false)
  }

  const aplicarPreset = (tipo: 'todo' | 'lectura' | 'solo_boletin' | 'solo_horarios') => {
    if (tipo === 'todo') {
      setPermisos({
        boletin_j06: { ver: true, editar: true },
        horarios_pro: { ver: true, editar: true },
        malla_multifuncional: { ver: true, editar: true },
        horario_comercial: { ver: true, editar: true },
        apoyo: { ver: true, editar: true },
        kpis: { ver: true, editar: false },
        incidencias: { ver: false, editar: false }
      })
    } else if (tipo === 'lectura') {
      setPermisos({
        boletin_j06: { ver: true, editar: false },
        horarios_pro: { ver: true, editar: false },
        malla_multifuncional: { ver: true, editar: false },
        horario_comercial: { ver: true, editar: false },
        apoyo: { ver: true, editar: false },
        kpis: { ver: true, editar: false },
        incidencias: { ver: false, editar: false }
      })
    } else if (tipo === 'solo_boletin') {
      setPermisos({
        boletin_j06: { ver: true, editar: true },
        horarios_pro: { ver: false, editar: false },
        malla_multifuncional: { ver: false, editar: false },
        horario_comercial: { ver: false, editar: false },
        apoyo: { ver: false, editar: false },
        kpis: { ver: false, editar: false },
        incidencias: { ver: false, editar: false }
      })
    } else if (tipo === 'solo_horarios') {
      setPermisos({
        boletin_j06: { ver: false, editar: false },
        horarios_pro: { ver: true, editar: true },
        malla_multifuncional: { ver: true, editar: true },
        horario_comercial: { ver: true, editar: true },
        apoyo: { ver: true, editar: true },
        kpis: { ver: false, editar: false },
        incidencias: { ver: false, editar: false }
      })
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="h-7 text-xs flex items-center gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700 shadow-none font-medium"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
        Permisos
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            onClick={() => !isLoading && setIsOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Permisos de Módulos
                  </h2>
                  <p className="text-xs text-slate-500">
                    {usuario.nombre_completo || 'Usuario'} •{' '}
                    <span className="font-mono text-slate-400">{usuario.email}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {usuario.rol === 'admin' && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-start gap-3">
                  <Lock className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-purple-900">
                    <p className="font-semibold mb-0.5">Rol de Administrador</p>
                    <p className="text-purple-700">
                      Este usuario tiene rol de Administrador. Por defecto posee acceso total a todos los módulos y configuración general.
                    </p>
                  </div>
                </div>
              )}

              {/* Botones de configuración rápida */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Configuración Rápida
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => aplicarPreset('todo')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors text-center"
                  >
                    ⚡ Acceso Total
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPreset('lectura')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors text-center"
                  >
                    👀 Solo Lectura
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPreset('solo_boletin')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors text-center"
                  >
                    📊 Solo Boletín J06
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPreset('solo_horarios')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors text-center"
                  >
                    📅 Solo Mallas
                  </button>
                </div>
              </div>

              {/* Lista de módulos */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Permisos Individuales por Módulo
                </label>

                {/* 1. BOLETÍN J06 */}
                <div
                  className={`border rounded-xl p-3.5 transition-all ${
                    permisos.boletin_j06.ver
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-slate-200 bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 text-sm">
                            Boletín Semanal J06
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">/boletin-j06</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Consolidado, Scorecard, Ventas, Auditoría y Réplica Oficial de Excel
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 select-none">
                        <input
                          type="checkbox"
                          checked={permisos.boletin_j06.ver}
                          onChange={(e) => {
                            const val = e.target.checked
                            setPermisos((prev) => ({
                              ...prev,
                              boletin_j06: {
                                ver: val,
                                editar: val ? prev.boletin_j06.editar : false
                              }
                            }))
                          }}
                          className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
                        />
                        <span>Ver</span>
                      </label>

                      <label
                        className={`flex items-center gap-1.5 text-xs font-medium select-none ${
                          permisos.boletin_j06.ver
                            ? 'cursor-pointer text-slate-700'
                            : 'cursor-not-allowed text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!permisos.boletin_j06.ver}
                          checked={permisos.boletin_j06.editar}
                          onChange={(e) => {
                            setPermisos((prev) => ({
                              ...prev,
                              boletin_j06: {
                                ...prev.boletin_j06,
                                editar: e.target.checked
                              }
                            }))
                          }}
                          className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300 disabled:opacity-50"
                        />
                        <span>Editar</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 2. MALLA HORARIOS PRO */}
                <div
                  className={`border rounded-xl p-3.5 transition-all ${
                    permisos.horarios_pro.ver
                      ? 'border-indigo-200 bg-indigo-50/20'
                      : 'border-slate-200 bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                        <CalendarRange className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 text-sm">
                            Malla Horarios Pro
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">/horarios-pro</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Planificación semanal, turnos de cajeros y exportación de programación
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 select-none">
                        <input
                          type="checkbox"
                          checked={permisos.horarios_pro.ver}
                          onChange={(e) => {
                            const val = e.target.checked
                            setPermisos((prev) => ({
                              ...prev,
                              horarios_pro: {
                                ver: val,
                                editar: val ? prev.horarios_pro.editar : false
                              }
                            }))
                          }}
                          className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
                        />
                        <span>Ver</span>
                      </label>

                      <label
                        className={`flex items-center gap-1.5 text-xs font-medium select-none ${
                          permisos.horarios_pro.ver
                            ? 'cursor-pointer text-slate-700'
                            : 'cursor-not-allowed text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!permisos.horarios_pro.ver}
                          checked={permisos.horarios_pro.editar}
                          onChange={(e) => {
                            setPermisos((prev) => ({
                              ...prev,
                              horarios_pro: {
                                ...prev.horarios_pro,
                                editar: e.target.checked
                              }
                            }))
                          }}
                          className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300 disabled:opacity-50"
                        />
                        <span>Editar</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3. MALLA MULTIFUNCIONAL */}
                <div
                  className={`border rounded-xl p-3.5 transition-all ${
                    (permisos.malla_multifuncional?.ver ?? permisos.apoyo?.ver)
                      ? 'border-blue-200 bg-blue-50/20'
                      : 'border-slate-200 bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 text-sm">
                            Malla Multifuncional
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">/malla-multifuncional</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Asignación y cobertura de personal multifuncional por áreas (PGC, Non Food, No Proc, Asistente)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 select-none">
                        <input
                          type="checkbox"
                          checked={permisos.malla_multifuncional?.ver ?? permisos.apoyo?.ver ?? false}
                          onChange={(e) => {
                            const val = e.target.checked
                            setPermisos((prev) => ({
                              ...prev,
                              malla_multifuncional: {
                                ver: val,
                                editar: val ? (prev.malla_multifuncional?.editar ?? prev.apoyo?.editar ?? false) : false
                              },
                              apoyo: {
                                ver: val,
                                editar: val ? (prev.malla_multifuncional?.editar ?? prev.apoyo?.editar ?? false) : false
                              }
                            }))
                          }}
                          className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
                        />
                        <span>Ver</span>
                      </label>

                      <label
                        className={`flex items-center gap-1.5 text-xs font-medium select-none ${
                          (permisos.malla_multifuncional?.ver ?? permisos.apoyo?.ver)
                            ? 'cursor-pointer text-slate-700'
                            : 'cursor-not-allowed text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!(permisos.malla_multifuncional?.ver ?? permisos.apoyo?.ver)}
                          checked={permisos.malla_multifuncional?.editar ?? permisos.apoyo?.editar ?? false}
                          onChange={(e) => {
                            const val = e.target.checked
                            setPermisos((prev) => ({
                              ...prev,
                              malla_multifuncional: {
                                ...(prev.malla_multifuncional || prev.apoyo),
                                editar: val
                              },
                              apoyo: {
                                ...(prev.malla_multifuncional || prev.apoyo),
                                editar: val
                              }
                            }))
                          }}
                          className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300 disabled:opacity-50"
                        />
                        <span>Editar</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 4. HORARIO COMERCIAL */}
                <div
                  className={`border rounded-xl p-3.5 transition-all ${
                    (permisos.horario_comercial?.ver ?? true)
                      ? 'border-teal-200 bg-teal-50/20'
                      : 'border-slate-200 bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 text-sm">
                            Horario Comercial
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">/horario-comercial</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Matriz interactiva tipo Excel para editar turnos por colaborador y pasillo
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 select-none">
                        <input
                          type="checkbox"
                          checked={permisos.horario_comercial?.ver ?? true}
                          onChange={(e) => {
                            const val = e.target.checked
                            setPermisos((prev) => ({
                              ...prev,
                              horario_comercial: {
                                ver: val,
                                editar: val ? (prev.horario_comercial?.editar ?? true) : false
                              }
                            }))
                          }}
                          className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
                        />
                        <span>Ver</span>
                      </label>

                      <label
                        className={`flex items-center gap-1.5 text-xs font-medium select-none ${
                          (permisos.horario_comercial?.ver ?? true)
                            ? 'cursor-pointer text-slate-700'
                            : 'cursor-not-allowed text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!(permisos.horario_comercial?.ver ?? true)}
                          checked={permisos.horario_comercial?.editar ?? true}
                          onChange={(e) => {
                            const val = e.target.checked
                            setPermisos((prev) => ({
                              ...prev,
                              horario_comercial: {
                                ...(prev.horario_comercial || { ver: true }),
                                editar: val
                              }
                            }))
                          }}
                          className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300 disabled:opacity-50"
                        />
                        <span>Editar</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 5. KPIS */}
                <div
                  className={`border rounded-xl p-3.5 transition-all ${
                    permisos.kpis.ver
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-slate-200 bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 text-sm">
                            KPIs Operativos
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">/kpis</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Métricas globales de cumplimiento y hallazgos en tienda
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 select-none">
                        <input
                          type="checkbox"
                          checked={permisos.kpis.ver}
                          onChange={(e) => {
                            setPermisos((prev) => ({
                              ...prev,
                              kpis: { ver: e.target.checked }
                            }))
                          }}
                          className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
                        />
                        <span>Ver</span>
                      </label>
                      <span className="text-xs text-slate-400 italic px-2">Solo lectura</span>
                    </div>
                  </div>
                </div>

                {/* 5. INCIDENCIAS */}
                <div
                  className={`border rounded-xl p-3.5 transition-all ${
                    permisos.incidencias.ver
                      ? 'border-rose-200 bg-rose-50/20'
                      : 'border-slate-200 bg-slate-50/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900 text-sm">
                            Incidencias en Piso
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">/ , /nueva</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Registro de tickets fotográficos y subsanación de observaciones
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 select-none">
                        <input
                          type="checkbox"
                          checked={permisos.incidencias.ver}
                          onChange={(e) => {
                            const val = e.target.checked
                            setPermisos((prev) => ({
                              ...prev,
                              incidencias: {
                                ver: val,
                                editar: val ? prev.incidencias.editar : false
                              }
                            }))
                          }}
                          className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300"
                        />
                        <span>Ver</span>
                      </label>

                      <label
                        className={`flex items-center gap-1.5 text-xs font-medium select-none ${
                          permisos.incidencias.ver
                            ? 'cursor-pointer text-slate-700'
                            : 'cursor-not-allowed text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!permisos.incidencias.ver}
                          checked={permisos.incidencias.editar}
                          onChange={(e) => {
                            setPermisos((prev) => ({
                              ...prev,
                              incidencias: {
                                ...prev.incidencias,
                                editar: e.target.checked
                              }
                            }))
                          }}
                          className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-slate-300 disabled:opacity-50"
                        />
                        <span>Editar</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Los cambios se aplican de inmediato en la sesión del usuario.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="h-9 px-4 text-xs font-medium"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGuardar}
                  disabled={isLoading}
                  className="h-9 px-5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center gap-1.5"
                >
                  {isLoading ? (
                    'Guardando...'
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Guardar Permisos
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
