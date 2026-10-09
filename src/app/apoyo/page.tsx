'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, CalendarRange } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

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
  'ASISTENTE': 'bg-white border-slate-300 text-slate-800'
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

export default function ApoyoModule() {
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

  // load from local storage
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('horarios_pro_reporte')
    if (saved) {
      try {
        setReporte(JSON.parse(saved))
      } catch (e) {}
    }
    const savedPersonas = localStorage.getItem('apoyo_personas_area')
    if (savedPersonas) {
      try {
        setPersonasArea(JSON.parse(savedPersonas))
      } catch (e) {}
    }

    const currentId = localStorage.getItem('horarios_pro_current_semana_id')
    if (currentId) setCurrentSemanaId(currentId)

    const fetchSemanas = async () => {
      try {
        const { data } = await supabase.from('semanas_planificadas').select('id, nombre_semana').order('created_at', { ascending: false })
        if (data) setSemanas(data)
      } catch (e) {}
    }
    fetchSemanas()
  }, [])

  // save to local storage
  useEffect(() => {
    if (mounted && reporte.length > 0) {
      localStorage.setItem('horarios_pro_reporte', JSON.stringify(reporte))
    }
    if (mounted) {
      localStorage.setItem('apoyo_personas_area', JSON.stringify(personasArea))
    }
    if (mounted && currentSemanaId) {
      localStorage.setItem('horarios_pro_current_semana_id', currentSemanaId)
    }
  }, [reporte, personasArea, currentSemanaId, mounted])

  const updateEmpleado = (diaIndex: number, empId: string, updates: Partial<TurnoEmpleado>) => {
    const newReporte = [...reporte]
    const emp = newReporte[diaIndex].empleados.find(e => e.id === empId)
    if (emp) {
      Object.assign(emp, updates)
      setReporte(newReporte)
    }
  }

  const loadSemana = async (id: string) => {
    if (!id) return
    setCurrentSemanaId(id)
    setCargandoSemana(true)
    try {
      const { data, error } = await supabase.from('semanas_planificadas').select('data_reporte, data_personas').eq('id', id).single()
      if (error) throw error
      if (data) {
        if (data.data_reporte) setReporte(data.data_reporte)
        if (data.data_personas) setPersonasArea(data.data_personas)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCargandoSemana(false)
    }
  }

  const addBloque = (diaIndex: number) => {
    const newReporte = [...reporte]
    newReporte[diaIndex].empleados.push({
      id: `manual-apoyo-${Date.now()}`,
      nombre: '',
      rol: 'Multifuncional',
      inicio: 9,
      fin: 13,
      isMultifuncional: true,
      area: ''
    })
    setReporte(newReporte)
  }

  const deleteBloque = (diaIndex: number, empId: string) => {
    const newReporte = [...reporte]
    newReporte[diaIndex].empleados = newReporte[diaIndex].empleados.filter(e => e.id !== empId)
    setReporte(newReporte)
  }

  if (!mounted) return null 

  if (reporte.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <CalendarRange className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">No hay malla generada</h1>
        <p className="text-slate-500 mb-6 max-w-md">
          Para asignar áreas y nombres a los apoyos, primero debes subir tus archivos y generar la cuadrícula en el módulo Malla Pro.
        </p>
        <Link href="/horarios-pro">
          <Button className="bg-slate-900">Ir a Malla Pro</Button>
        </Link>
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

  return (
    <div className="pb-12 space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Distribución de Horas {currentSemanaName ? `- ${currentSemanaName}` : ''}
          </h1>
          <p className="text-sm text-slate-500">Los bloques de soporte automático se sincronizan desde Malla Pro.</p>
        </div>
        
        <select 
          className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white shadow-sm outline-none cursor-pointer text-slate-700 min-w-[200px]"
          value={currentSemanaId}
          onChange={(e) => loadSemana(e.target.value)}
          disabled={cargandoSemana}
        >
          <option value="" disabled>Consultar semana anterior...</option>
          {semanas.map(s => (
            <option key={s.id} value={s.id}>{s.nombre_semana}</option>
          ))}
        </select>
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

                      const areaColor = b.area && AREAS_COLORS[b.area] ? AREAS_COLORS[b.area] : AREAS_COLORS['ASISTENTE']

                      return (
                        <div key={b.id} className="flex border border-black/20">
                          {/* Columna Horario y Nombre */}
                          <div className={`flex flex-col flex-1 p-1 ${areaColor} border-r border-black/10 relative group`}>
                            {!String(b.id).startsWith('auto-') && (
                              <button onClick={() => deleteBloque(diaIndex, b.id)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden group-hover:block shadow-md">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                            <div className="flex items-center text-[9px] mb-0.5 font-mono">
                              <input 
                                type="text" 
                                value={formatHours(b.inicio)} 
                                onChange={e => {
                                  const val = e.target.value; 
                                  if (val.length <= 5) {
                                    const frac = timeToFraction(val)
                                    if (frac > 0 || val.replace(':','') === '0000') updateEmpleado(diaIndex, b.id, { inicio: frac })
                                  }
                                }} 
                                className="w-10 bg-transparent border-none p-0 outline-none placeholder:text-black/50" 
                                placeholder="09:00" 
                                maxLength={5}
                              />
                              <span className="mx-0.5">A</span>
                              <input 
                                type="text" 
                                value={formatHours(b.fin)} 
                                onChange={e => {
                                  const val = e.target.value; 
                                  if (val.length <= 5) {
                                    const frac = timeToFraction(val)
                                    if (frac > 0 || val.replace(':','') === '0000') updateEmpleado(diaIndex, b.id, { fin: frac })
                                  }
                                }} 
                                className="w-10 bg-transparent border-none p-0 outline-none placeholder:text-black/50" 
                                placeholder="13:30" 
                                maxLength={5}
                              />
                            </div>
                            <input 
                              value={b.nombre === 'Soporte Automático' ? '' : b.nombre}
                              placeholder="NOMBRE..."
                              onChange={e => updateEmpleado(diaIndex, b.id, { nombre: e.target.value || 'Soporte Automático' })}
                              className="w-full text-[11px] font-bold uppercase bg-transparent border-none p-0 outline-none placeholder:text-black/30"
                            />
                            <select 
                              value={b.area || ''}
                              onChange={e => updateEmpleado(diaIndex, b.id, { area: e.target.value })}
                              className="text-[8px] font-semibold bg-white/30 border border-black/10 p-0 outline-none w-full mt-1 appearance-none rounded-none text-black cursor-pointer"
                            >
                              <option value="">- Vacío -</option>
                              <option value="PGC">PGC</option>
                              <option value="NON FOOD">NON FOOD</option>
                              <option value="NO PROC">NO PROC</option>
                              <option value="ASISTENTE">ASISTENTE</option>
                            </select>
                          </div>
                          {/* Columna Horas totales */}
                          <div className="w-[38px] shrink-0 bg-white flex items-center justify-center p-1 text-[9px] font-mono text-slate-700 font-medium">
                            {durStr}
                          </div>
                        </div>
                      )
                    })}
                    
                    <button onClick={() => addBloque(diaIndex)} className="w-full flex items-center justify-center gap-1 py-1 text-[10px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-dashed border-slate-300 transition-colors">
                      <Plus className="w-3 h-3" /> Añadir
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RESUMEN DE HORAS */}
        <Card className="w-full xl:w-[220px] shrink-0 border-black/20 shadow-sm rounded-none">
          <div className="bg-[#ffff00] px-2 py-1 border-b border-black/20">
            <h3 className="text-[12px] font-bold text-black tracking-wide">DISTRIBUCION DE HORAS</h3>
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
                        value={personasArea[area] || ''} 
                        onChange={e => setPersonasArea({ ...personasArea, [area]: parseInt(e.target.value) || 0 })}
                        className="w-full h-full text-[10px] font-bold text-center outline-none bg-transparent"
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
