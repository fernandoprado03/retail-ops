'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, CalendarRange, Lock, Eye, Wifi } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { normalizarPermisos } from '@/types/permisos'
import { toast } from 'sonner'

type Area = 'PGC' | 'NON FOOD' | 'NO PROC' | 'ASISTENTE'

interface TurnoEmpleado {
  id: string
  nombre: string
  rol: string
  inicio: number
  fin: number
  isMultifuncional?: boolean
  area?: string
}

interface ReporteDia {
  fecha: string
  empleados: TurnoEmpleado[]
}

const AREAS_COLORS: Record<string, string> = {
  'PGC': 'bg-[#8eaadb] border-[#7992be] text-blue-900', 
  'NON FOOD': 'bg-[#8fce61] border-[#7ab352] text-green-900', 
  'NO PROC': 'bg-[#f4b084] border-[#d29771] text-orange-900', 
  'ASISTENTE': 'bg-[#df9ee0] border-[#c68bc7] text-fuchsia-900'
}

const formatHours = (hours: number) => {
  if (isNaN(hours)) return '00:00'
  const h = Math.floor(hours) % 24
  const m = Math.round((hours - Math.floor(hours)) * 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

const timeToFraction = (timeStr: string): number => {
  if (!timeStr) return 0
  const clean = timeStr.replace(':', '')
  if (clean.length !== 4) return 0
  const h = parseInt(clean.slice(0, 2))
  const m = parseInt(clean.slice(2, 4))
  return h + m / 60
}

export default function MallaMultifuncionalPage() {
  const [permisoVer, setPermisoVer] = useState<boolean>(true)
  const [permisoEditar, setPermisoEditar] = useState<boolean>(true)
  const [cargandoPermisos, setCargandoPermisos] = useState<boolean>(true)

  const [reporte, setReporte] = useState<ReporteDia[]>([])
  const [mounted, setMounted] = useState(false)
  const [personasArea, setPersonasArea] = useState<Record<string, number>>({
    'PGC': 0,
    'NON FOOD': 0,
    'NO PROC': 0,
    'ASISTENTE': 0
  })
  
  const [semanas, setSemanas] = useState<{id: string, nombre_semana: string}[]>([])
  const [currentSemanaId, setCurrentSemanaId] = useState<string>('')
  const [cargandoSemana, setCargandoSemana] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced')
  const [activeUsersCount, setActiveUsersCount] = useState<number>(1)

  // Referencias para sincronización en tiempo real sin recarga ni rebotes
  const channelRef = useRef<any>(null)
  const clientId = useRef<string>('')
  if (!clientId.current && typeof window !== 'undefined') {
    clientId.current = `client-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  }
  const isReceivingRemote = useRef<boolean>(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const broadcastTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const reporteRef = useRef(reporte)
  const personasAreaRef = useRef(personasArea)
  const currentSemanaIdRef = useRef(currentSemanaId)

  useEffect(() => {
    reporteRef.current = reporte
  }, [reporte])

  useEffect(() => {
    personasAreaRef.current = personasArea
  }, [personasArea])

  useEffect(() => {
    currentSemanaIdRef.current = currentSemanaId
  }, [currentSemanaId])

  useEffect(() => {
    const checkPermisos = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: perfil } = await supabase
            .from('perfiles')
            .select('rol, permisos')
            .eq('id', user.id)
            .single()
          
          if (perfil) {
            if (perfil.rol === 'admin') {
              setPermisoVer(true)
              setPermisoEditar(true)
            } else {
              const p = normalizarPermisos(perfil.permisos, perfil.rol)
              setPermisoVer(p.malla_multifuncional.ver)
              setPermisoEditar(p.malla_multifuncional.editar)
            }
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setCargandoPermisos(false)
      }
    }
    checkPermisos()
  }, [])

  // Cargar datos al montar
  useEffect(() => {
    setMounted(true)
    let localReporteCargado = false
    const saved = localStorage.getItem('horarios_pro_reporte')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReporte(parsed)
          localReporteCargado = true
        }
      } catch (e) {}
    }
    const savedPersonas = localStorage.getItem('multifuncional_personas_area') || localStorage.getItem('apoyo_personas_area')
    if (savedPersonas) {
      try {
        setPersonasArea(JSON.parse(savedPersonas))
      } catch (e) {}
    }

    const currentId = localStorage.getItem('horarios_pro_current_semana_id')
    if (currentId) setCurrentSemanaId(currentId)

    // Consultar semanas planificadas desde Supabase
    const fetchSemanas = async () => {
      setCargandoSemana(true)
      try {
        const { data } = await supabase
          .from('semanas_planificadas')
          .select('id, nombre_semana')
          .order('created_at', { ascending: false })
        
        if (data && data.length > 0) {
          setSemanas(data)
          const targetId = (currentId && data.some(s => s.id === currentId)) ? currentId : data[0].id
          
          // Si el usuario no tiene datos en su localStorage (ej. entra por primera vez o en su celular),
          // auto-cargar la semana más reciente preparada (Semana 43)
          if (!localReporteCargado) {
            await loadSemana(targetId)
          } else {
            setCurrentSemanaId(targetId)
          }
        }
      } catch (e) {
        console.error('Error cargando semanas de Supabase:', e)
      } finally {
        setCargandoSemana(false)
      }
    }
    fetchSemanas()
  }, [])

  // Suscripción en tiempo real a Supabase Realtime para la semana activa
  useEffect(() => {
    if (!currentSemanaId) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase.channel(`malla-semana-${currentSemanaId}`, {
      config: {
        broadcast: { self: false }
      }
    })

    channel
      .on('broadcast', { event: 'sync_malla' }, ({ payload }) => {
        if (!payload || payload.senderId === clientId.current) return
        
        // Recibido en vivo desde otro dispositivo (ej. celular de Álvaro o computadora de Fernando)
        isReceivingRemote.current = true
        if (payload.reporte) {
          setReporte(payload.reporte)
          try { localStorage.setItem('horarios_pro_reporte', JSON.stringify(payload.reporte)) } catch(e){}
        }
        if (payload.personasArea) {
          setPersonasArea(payload.personasArea)
          try { 
            localStorage.setItem('multifuncional_personas_area', JSON.stringify(payload.personasArea))
            localStorage.setItem('apoyo_personas_area', JSON.stringify(payload.personasArea))
          } catch(e){}
        }
        setSyncStatus('synced')

        setTimeout(() => {
          isReceivingRemote.current = false
        }, 80)
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'semanas_planificadas',
          filter: `id=eq.${currentSemanaId}`
        },
        (payload) => {
          const newRecord = payload.new as any
          if (newRecord && !isReceivingRemote.current) {
            if (newRecord.data_reporte) {
              setReporte(newRecord.data_reporte)
              try { localStorage.setItem('horarios_pro_reporte', JSON.stringify(newRecord.data_reporte)) } catch(e){}
            }
            if (newRecord.data_personas) {
              setPersonasArea(newRecord.data_personas)
              try {
                localStorage.setItem('multifuncional_personas_area', JSON.stringify(newRecord.data_personas))
                localStorage.setItem('apoyo_personas_area', JSON.stringify(newRecord.data_personas))
              } catch(e){}
            }
            setSyncStatus('synced')
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        try {
          const presences = channel.presenceState()
          const count = Object.keys(presences).length
          setActiveUsersCount(Math.max(1, count))
        } catch (e) {}
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.track({
              online_at: new Date().toISOString(),
              client_id: clientId.current
            })
          } catch (e) {}
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [currentSemanaId])

  // Función interna para persistir en Supabase
  const persistToSupabase = async (rep: ReporteDia[], pers: Record<string, number>, semId: string) => {
    if (!semId) return
    setSyncStatus('saving')
    try {
      const { error } = await supabase.from('semanas_planificadas').update({
        data_reporte: rep,
        data_personas: pers,
        updated_at: new Date().toISOString()
      }).eq('id', semId)

      if (error) {
        console.error('Error auto-guardando en Supabase:', error)
        setSyncStatus('error')
      } else {
        setSyncStatus('synced')
      }
    } catch (err) {
      console.error('Error auto-guardando:', err)
      setSyncStatus('error')
    }
  }

  // Broadcast instantáneo a todos los demás dispositivos conectados a la página
  const broadcastChange = (rep: ReporteDia[], pers: Record<string, number>) => {
    if (!channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'sync_malla',
      payload: {
        senderId: clientId.current,
        reporte: rep,
        personasArea: pers,
        timestamp: Date.now()
      }
    })
  }

  // Sincronización general: actualiza local + broadcast en milisegundos + guarda en Supabase
  const sincronizar = (
    newReporte: ReporteDia[], 
    newPersonas: Record<string, number>, 
    immediate: boolean = false
  ) => {
    if (isReceivingRemote.current) return

    setReporte(newReporte)
    setPersonasArea(newPersonas)
    try {
      localStorage.setItem('horarios_pro_reporte', JSON.stringify(newReporte))
      localStorage.setItem('multifuncional_personas_area', JSON.stringify(newPersonas))
      localStorage.setItem('apoyo_personas_area', JSON.stringify(newPersonas))
    } catch (e) {}

    // 1. Broadcast instantáneo por WebSocket a otros dispositivos
    if (immediate) {
      if (broadcastTimeoutRef.current) clearTimeout(broadcastTimeoutRef.current)
      broadcastChange(newReporte, newPersonas)
    } else {
      if (broadcastTimeoutRef.current) clearTimeout(broadcastTimeoutRef.current)
      broadcastTimeoutRef.current = setTimeout(() => {
        broadcastChange(newReporte, newPersonas)
      }, 50)
    }

    // 2. Guardado persistente en la base de datos Supabase
    const targetSemId = currentSemanaIdRef.current
    if (!targetSemId) return

    if (immediate) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      persistToSupabase(newReporte, newPersonas, targetSemId)
    } else {
      setSyncStatus('saving')
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        persistToSupabase(newReporte, newPersonas, targetSemId)
      }, 350)
    }
  }

  const flushSync = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
      persistToSupabase(reporteRef.current, personasAreaRef.current, currentSemanaIdRef.current)
    }
    if (broadcastTimeoutRef.current) {
      clearTimeout(broadcastTimeoutRef.current)
      broadcastTimeoutRef.current = null
      broadcastChange(reporteRef.current, personasAreaRef.current)
    }
  }

  const updateEmpleado = (
    diaIndex: number, 
    empId: string, 
    updates: Partial<TurnoEmpleado>, 
    immediate: boolean = false
  ) => {
    if (!permisoEditar) return
    const newReporte = reporte.map((dia, idx) => {
      if (idx !== diaIndex) return dia
      return {
        ...dia,
        empleados: dia.empleados.map(emp => {
          if (emp.id !== empId) return emp
          return { ...emp, ...updates }
        })
      }
    })
    sincronizar(newReporte, personasArea, immediate)
  }

  const handlePersonasAreaChange = (area: string, val: number) => {
    if (!permisoEditar) return
    const newPersonas = { ...personasArea, [area]: val }
    sincronizar(reporte, newPersonas, true)
  }

  const loadSemana = async (id: string) => {
    if (!id) return
    setCurrentSemanaId(id)
    setCargandoSemana(true)
    try {
      const { data, error } = await supabase
        .from('semanas_planificadas')
        .select('data_reporte, data_personas')
        .eq('id', id)
        .single()
      if (error) throw error
      if (data) {
        if (data.data_reporte) setReporte(data.data_reporte)
        if (data.data_personas) setPersonasArea(data.data_personas)
        localStorage.setItem('horarios_pro_current_semana_id', id)
      }
    } catch (e) {
      console.error('Error cargando semana:', e)
      toast.error('No se pudo cargar la semana seleccionada')
    } finally {
      setCargandoSemana(false)
    }
  }

  const addBloque = (diaIndex: number) => {
    if (!permisoEditar) return
    const newReporte = reporte.map((dia, idx) => {
      if (idx !== diaIndex) return dia
      return {
        ...dia,
        empleados: [
          ...dia.empleados,
          {
            id: `manual-multi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            nombre: '',
            rol: 'Multifuncional',
            inicio: 9,
            fin: 13,
            isMultifuncional: true,
            area: ''
          }
        ]
      }
    })
    sincronizar(newReporte, personasArea, true)
  }

  const deleteBloque = (diaIndex: number, empId: string) => {
    if (!permisoEditar) return
    const newReporte = reporte.map((dia, idx) => {
      if (idx !== diaIndex) return dia
      return {
        ...dia,
        empleados: dia.empleados.filter(e => e.id !== empId)
      }
    })
    sincronizar(newReporte, personasArea, true)
  }

  if (!mounted) return null 

  if (cargandoSemana && reporte.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-1">Cargando Malla Planificada...</h2>
        <p className="text-sm text-slate-500">Sincronizando los datos de la semana desde el servidor.</p>
      </div>
    )
  }

  if (reporte.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <CalendarRange className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {semanas.length > 0 ? "Selecciona una Semana Planificada" : "No hay malla generada"}
        </h1>
        <p className="text-slate-500 mb-6 max-w-md text-sm">
          {semanas.length > 0 
            ? "Hay semanas preparadas disponibles en el sistema. Selecciona la semana que deseas gestionar para comenzar a asignar multifuncionales:"
            : "Para asignar áreas y nombres a los multifuncionales, primero debes subir tus archivos y generar la cuadrícula en el módulo Malla Pro."}
        </p>
        {semanas.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
            <select
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white shadow-sm outline-none"
              value={currentSemanaId}
              onChange={(e) => loadSemana(e.target.value)}
            >
              <option value="" disabled>Elegir semana...</option>
              {semanas.map(s => (
                <option key={s.id} value={s.id}>{s.nombre_semana}</option>
              ))}
            </select>
            <Button 
              onClick={() => loadSemana(semanas[0].id)} 
              className="w-full sm:w-auto bg-slate-900 shrink-0"
            >
              Cargar {semanas[0].nombre_semana}
            </Button>
          </div>
        ) : (
          <Link href="/horarios-pro">
            <Button className="bg-slate-900">Ir a Malla Pro</Button>
          </Link>
        )}
      </div>
    )
  }

  // Calculate totals
  const totalesArea: Record<string, number> = {
    'PGC': 0,
    'NON FOOD': 0,
    'NO PROC': 0,
    'ASISTENTE': 0
  }
  let totalSemana = 0

  reporte.forEach(dia => {
    dia.empleados.forEach(b => {
      if (b.isMultifuncional) {
        let duration = b.fin - b.inicio
        if (duration < 0) duration += 24
        if (!isNaN(duration)) {
          totalSemana += duration
          if (b.area) {
            if (!totalesArea[b.area]) totalesArea[b.area] = 0
            totalesArea[b.area] += duration
          }
        }
      }
    })
  })

  const AREAS_VALIDAS = ['PGC', 'NON FOOD', 'NO PROC', 'ASISTENTE']
  const totalPersonas = AREAS_VALIDAS.reduce((a, b) => a + (Number(personasArea[b]) || 0), 0)
  const currentSemanaName = semanas.find(s => s.id === currentSemanaId)?.nombre_semana || ''

  if (!cargandoPermisos && !permisoVer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4 border border-red-100">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Acceso Restringido</h1>
        <p className="text-slate-500 max-w-md">
          Tu cuenta no tiene permisos para ver el módulo de Malla Multifuncional. Contacta a un Administrador para habilitar el acceso.
        </p>
      </div>
    )
  }

  return (
    <div className="pb-12 space-y-6 animate-in fade-in">
      {!cargandoPermisos && !permisoEditar && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between text-amber-900 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs font-medium">
              <strong>Modo Solo Lectura:</strong> Puedes visualizar la distribución de horas y cobertura de multifuncionales por área. La asignación y edición está reservada al Administrador.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 px-2 py-0.5 rounded text-amber-800 shrink-0">
            Solo Lectura
          </span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Malla Multifuncional {currentSemanaName ? `- ${currentSemanaName}` : ''}
          </h1>
          <p className="text-sm text-slate-500">Distribución de horas y cobertura multifuncional sincronizada desde Malla Pro.</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <select 
            className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white shadow-sm outline-none cursor-pointer text-slate-700 min-w-[200px]"
            value={currentSemanaId}
            onChange={(e) => loadSemana(e.target.value)}
            disabled={cargandoSemana}
          >
            <option value="" disabled>Seleccionar semana...</option>
            {semanas.map(s => (
              <option key={s.id} value={s.id}>{s.nombre_semana}</option>
            ))}
          </select>

          {reporte.length > 0 && (
            <div className="flex items-center gap-2">
              {syncStatus === 'saving' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold shadow-xs transition-all">
                  <div className="w-2.5 h-2.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  <span>Guardando en la nube...</span>
                </div>
              )}
              {syncStatus === 'synced' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs transition-all">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span>En vivo</span>
                    {activeUsersCount > 1 && (
                      <span className="bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded text-[10px] font-bold">
                        {activeUsersCount} activos
                      </span>
                    )}
                    <span className="hidden sm:inline">• Guardado automático</span>
                  </span>
                </div>
              )}
              {syncStatus === 'error' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-rose-600"></span>
                  <span>Reintentando conexión...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* GRID SEMANAL */}
        <div className="flex-1 w-full overflow-x-auto bg-white border border-slate-200 shadow-sm">
          <div className="flex min-w-[1000px]">
            {reporte.map((dia, diaIndex) => {
              const bloques = dia.empleados.filter(e => e.isMultifuncional)
              let totalDia = 0
              bloques.forEach(b => {
                let d = b.fin - b.inicio
                if (d < 0) d += 24
                if (!isNaN(d)) totalDia += d
              })

              const [diaName, numDate] = dia.fecha.split(' ')

              return (
                <div key={diaIndex} className="flex-1 min-w-[150px] border-r last:border-r-0 border-slate-300 flex flex-col">
                  {/* Header Día */}
                  <div className="bg-[#4472c4] text-white flex flex-col items-center justify-center border-b border-slate-300">
                    <div className="text-[11px] font-bold tracking-wider py-1">{diaName || dia.fecha}</div>
                    <div className="bg-[#a5a5a5] w-full text-center text-[11px] py-0.5 border-t border-slate-400 font-medium">
                      {numDate || (diaIndex + 1)} 
                    </div>
                  </div>
                  
                  {/* Grid de bloques */}
                  <div className="p-1 space-y-1 flex-1 bg-white">
                    {bloques.map(b => {
                      let dur = b.fin - b.inicio
                      if (dur < 0) dur += 24
                      const durStr = isNaN(dur) ? '00:00' : formatHours(dur)

                      const areaColor = b.area && AREAS_COLORS[b.area] ? AREAS_COLORS[b.area] : 'bg-white border-slate-300 text-slate-800'

                      return (
                        <div key={b.id} className="flex border border-black/20">
                          {/* Columna Horario y Nombre */}
                          <div className={`flex flex-col flex-1 p-1 ${areaColor} border-r border-black/10 relative group`}>
                            {!String(b.id).startsWith('auto-') && permisoEditar && (
                              <button onClick={() => deleteBloque(diaIndex, b.id)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden group-hover:block shadow-md">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                            <div className="flex items-center text-[9px] mb-0.5 font-mono font-bold">
                              <input 
                                type="text" 
                                disabled={!permisoEditar}
                                value={formatHours(b.inicio)} 
                                onChange={e => {
                                  const val = e.target.value; 
                                  if (val.length <= 5) {
                                    const frac = timeToFraction(val)
                                    if (frac > 0 || val.replace(':','') === '0000') updateEmpleado(diaIndex, b.id, { inicio: frac }, false)
                                  }
                                }} 
                                onBlur={() => flushSync()}
                                className="w-10 bg-transparent border-none p-0 outline-none placeholder:text-black/50 font-bold disabled:cursor-not-allowed" 
                                placeholder="09:00" 
                                maxLength={5}
                              />
                              <span className="mx-0.5">A</span>
                              <input 
                                type="text" 
                                disabled={!permisoEditar}
                                value={formatHours(b.fin)} 
                                onChange={e => {
                                  const val = e.target.value; 
                                  if (val.length <= 5) {
                                    const frac = timeToFraction(val)
                                    if (frac > 0 || val.replace(':','') === '0000') updateEmpleado(diaIndex, b.id, { fin: frac }, false)
                                  }
                                }} 
                                onBlur={() => flushSync()}
                                className="w-10 bg-transparent border-none p-0 outline-none placeholder:text-black/50 font-bold disabled:cursor-not-allowed" 
                                placeholder="13:30" 
                                maxLength={5}
                              />
                            </div>
                            <input 
                              disabled={!permisoEditar}
                              value={b.nombre === 'Soporte Automático' ? '' : b.nombre}
                              placeholder="NOMBRE..."
                              onChange={e => updateEmpleado(diaIndex, b.id, { nombre: e.target.value || 'Soporte Automático' }, false)}
                              onBlur={() => flushSync()}
                              className="w-full text-[11px] font-bold uppercase bg-transparent border-none p-0 outline-none placeholder:text-black/30 disabled:cursor-not-allowed"
                            />
                            <select 
                              disabled={!permisoEditar}
                              value={b.area || ''}
                              onChange={e => updateEmpleado(diaIndex, b.id, { area: e.target.value }, true)}
                              className="text-[8px] font-semibold bg-white/30 border border-black/10 p-0 outline-none w-full mt-1 appearance-none rounded-none text-black cursor-pointer disabled:cursor-not-allowed"
                            >
                              <option value="">- Vacío -</option>
                              <option value="PGC">PGC</option>
                              <option value="NON FOOD">NON FOOD</option>
                              <option value="NO PROC">NO PROC</option>
                              <option value="ASISTENTE">ASISTENTE</option>
                            </select>
                          </div>
                          <div className="w-[38px] shrink-0 bg-white flex items-center justify-center p-1 text-[9px] font-mono text-slate-900 font-bold">
                            {durStr}
                          </div>
                        </div>
                      )
                    })}
                    
                    {permisoEditar && (
                      <button onClick={() => addBloque(diaIndex)} className="w-full flex items-center justify-center gap-1 py-1 text-[10px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-dashed border-slate-300 transition-colors">
                        <Plus className="w-3 h-3" /> Añadir
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RESUMEN DE HORAS */}
        <Card className="w-full xl:w-[220px] shrink-0 border-black/20 shadow-sm rounded-none">
          <div className="bg-[#ffff00] px-2 py-1 border-b border-black/20">
            <h3 className="text-[12px] font-bold text-black tracking-wide">DISTRIBUCIÓN DE HORAS</h3>
          </div>
          <div className="flex h-6 bg-[#ffff00] border-b border-black/20">
            <div className="w-[35px] border-r border-black/20 flex items-center justify-center text-[7px] font-bold text-black leading-tight text-center">
              Dot.
            </div>
            <div className="w-[80px] border-r border-black/20 flex items-center justify-center text-[8px] font-bold text-black">
              ÁREA
            </div>
            <div className="w-[50px] border-r border-black/20 flex items-center justify-center text-[9px] font-bold text-black">
              META
            </div>
            <div className="flex-1 flex items-center justify-center text-[9px] font-bold text-black">
              AVANCE
            </div>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-black/20">
              {['PGC', 'NON FOOD', 'NO PROC', 'ASISTENTE'].map(area => {
                const targetHoras = totalPersonas > 0 ? (totalSemana * ((Number(personasArea[area]) || 0) / totalPersonas)) : 0
                return (
                  <div key={area} className="flex h-8">
                    <div className="w-[35px] border-r border-black/20 bg-white">
                      <input 
                        type="number" 
                        disabled={!permisoEditar}
                        value={personasArea[area] || ''} 
                        onChange={e => handlePersonasAreaChange(area, parseInt(e.target.value) || 0)}
                        className="w-full h-full text-[10px] font-bold text-center outline-none bg-transparent disabled:cursor-not-allowed"
                        placeholder="0"
                      />
                    </div>
                    <div className={`w-[80px] px-2 py-1 text-[9px] font-bold flex items-center border-r border-black/20 ${AREAS_COLORS[area]}`}>
                      {area}
                    </div>
                    <div className="w-[50px] px-2 py-1 text-[11px] font-bold flex items-center justify-center bg-white border-r border-black/20">
                      {targetHoras > 0 ? targetHoras.toFixed(1) : ''}
                    </div>
                    <div className="flex-1 px-2 py-1 text-[11px] font-bold text-black bg-white flex items-center justify-center">
                      {(totalesArea[area] && totalesArea[area] > 0) ? totalesArea[area].toFixed(1) : ''}
                    </div>
                  </div>
                )
              })}
              <div className="flex h-8 bg-white border-t border-black/20">
                <div className="w-[115px] px-2 py-1 text-[10px] font-bold text-black flex items-center justify-end border-r border-black/20">
                  TOTAL
                </div>
                <div className="w-[50px] px-2 py-1 text-[11px] font-bold text-black flex items-center justify-center bg-slate-50 border-r border-black/20">
                  {totalSemana.toFixed(1)}
                </div>
                <div className="flex-1 px-2 py-1 text-[11px] font-bold text-black flex items-center justify-center bg-slate-50">
                  {Object.values(totalesArea).reduce((a,b) => a+b, 0).toFixed(1)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
