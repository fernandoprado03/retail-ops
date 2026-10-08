'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

type Area = 'FOOD' | 'NON FOOD' | 'NO PROCES' | 'ASISTENTE'

interface BloqueApoyo {
  id: string
  inicio: string // HH:MM
  fin: string    // HH:MM
  nombre: string
  area: Area
}

const DIAS = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO']
const AREAS_COLORS: Record<Area, string> = {
  'FOOD': 'bg-[#8fce61] border-[#7ab352] text-green-900', // Excel green
  'NON FOOD': 'bg-[#8eaadb] border-[#7992be] text-blue-900', // Excel blue
  'NO PROCES': 'bg-[#f4b084] border-[#d29771] text-orange-900', // Excel orange
  'ASISTENTE': 'bg-slate-100 border-slate-300 text-slate-800'
}

const parseTime = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h + (m || 0) / 60
}

const formatHours = (hours: number) => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export default function ApoyoModule() {
  const [semana, setSemana] = useState<Record<string, BloqueApoyo[]>>(() => {
    return DIAS.reduce((acc, d) => ({ ...acc, [d]: [] }), {})
  })
  const [mounted, setMounted] = useState(false)

  // load from local storage
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('apoyo_malla')
    if (saved) {
      try {
        setSemana(JSON.parse(saved))
      } catch (e) {}
    }
  }, [])

  // save to local storage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('apoyo_malla', JSON.stringify(semana))
    }
  }, [semana, mounted])

  const addBloque = (dia: string) => {
    const newBloque: BloqueApoyo = {
      id: Math.random().toString(),
      inicio: '09:00',
      fin: '13:00',
      nombre: '',
      area: 'FOOD'
    }
    setSemana(prev => ({
      ...prev,
      [dia]: [...prev[dia], newBloque]
    }))
  }

  const updateBloque = (dia: string, id: string, data: Partial<BloqueApoyo>) => {
    setSemana(prev => ({
      ...prev,
      [dia]: prev[dia].map(b => b.id === id ? { ...b, ...data } : b)
    }))
  }

  const deleteBloque = (dia: string, id: string) => {
    setSemana(prev => ({
      ...prev,
      [dia]: prev[dia].filter(b => b.id !== id)
    }))
  }

  if (!mounted) return null // Prevent hydration mismatch

  // Calculate totals
  const totalesArea = {
    'FOOD': 0,
    'NON FOOD': 0,
    'NO PROCES': 0,
    'ASISTENTE': 0
  }
  let totalSemana = 0

  Object.values(semana).forEach(bloques => {
    bloques.forEach(b => {
      let duration = parseTime(b.fin) - parseTime(b.inicio)
      if (duration < 0) duration += 24
      if (!isNaN(duration)) {
        totalesArea[b.area] += duration
        totalSemana += duration
      }
    })
  })

  return (
    <div className="pb-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Distribución de Horas</h1>
        <p className="text-sm text-slate-500">Planificador semanal de asignación para apoyos y multifuncionales.</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* GRID SEMANAL */}
        <div className="flex-1 w-full overflow-x-auto bg-white border border-slate-200 shadow-sm">
          <div className="flex min-w-[1000px]">
            {DIAS.map((dia, idx) => {
              const bloques = semana[dia]
              let totalDia = 0
              bloques.forEach(b => {
                let d = parseTime(b.fin) - parseTime(b.inicio)
                if (d < 0) d += 24
                if (!isNaN(d)) totalDia += d
              })

              return (
                <div key={dia} className="flex-1 min-w-[150px] border-r last:border-r-0 border-slate-300 flex flex-col">
                  {/* Header Día */}
                  <div className="bg-[#4472c4] text-white flex flex-col items-center justify-center border-b border-slate-300">
                    <div className="text-[11px] font-bold tracking-wider py-1">{dia}</div>
                    <div className="bg-[#a5a5a5] w-full text-center text-[11px] py-0.5 border-t border-slate-400 font-medium">
                      {idx + 5} {/* Emulando los numeros de la foto */}
                    </div>
                  </div>
                  
                  {/* Grid de bloques */}
                  <div className="p-1 space-y-1 flex-1 bg-white">
                    {bloques.map(b => {
                      let dur = parseTime(b.fin) - parseTime(b.inicio)
                      if (dur < 0) dur += 24
                      const durStr = isNaN(dur) ? '00:00:00' : formatHours(dur) + ':00'

                      return (
                        <div key={b.id} className="flex border border-black/20">
                          {/* Columna Horario y Nombre */}
                          <div className={`flex flex-col flex-1 p-1 ${AREAS_COLORS[b.area]} border-r border-black/10 relative group`}>
                            <button onClick={() => deleteBloque(dia, b.id)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden group-hover:block">
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <div className="flex items-center text-[9px] mb-0.5 font-mono">
                              <input type="text" value={b.inicio.replace(':','')} onChange={e => {
                                const val = e.target.value; 
                                if (val.length <= 4) updateBloque(dia, b.id, { inicio: val.length === 4 ? `${val.slice(0,2)}:${val.slice(2,4)}` : val })
                              }} className="w-8 bg-transparent border-none p-0 outline-none placeholder:text-black/50" placeholder="0900" />
                              <span className="mx-0.5">A</span>
                              <input type="text" value={b.fin.replace(':','')} onChange={e => {
                                const val = e.target.value; 
                                if (val.length <= 4) updateBloque(dia, b.id, { fin: val.length === 4 ? `${val.slice(0,2)}:${val.slice(2,4)}` : val })
                              }} className="w-8 bg-transparent border-none p-0 outline-none placeholder:text-black/50" placeholder="1330" />
                            </div>
                            <input 
                              value={b.nombre}
                              placeholder="NOMBRE..."
                              onChange={e => updateBloque(dia, b.id, { nombre: e.target.value })}
                              className="w-full text-[11px] font-bold uppercase bg-transparent border-none p-0 outline-none"
                            />
                            <select 
                              value={b.area}
                              onChange={e => updateBloque(dia, b.id, { area: e.target.value as Area })}
                              className="text-[8px] font-semibold bg-white/30 border border-black/10 p-0 outline-none w-full mt-1 appearance-none rounded-none"
                            >
                              <option value="FOOD">FOOD</option>
                              <option value="NON FOOD">NON FOOD</option>
                              <option value="NO PROCES">NO PROCES</option>
                              <option value="ASISTENTE">ASISTENTE</option>
                            </select>
                          </div>
                          {/* Columna Horas totales */}
                          <div className="w-[45px] shrink-0 bg-white flex items-center justify-center p-1 text-[9px] font-mono text-slate-700">
                            {durStr}
                          </div>
                        </div>
                      )
                    })}
                    
                    <button onClick={() => addBloque(dia)} className="w-full flex items-center justify-center gap-1 py-1 text-[10px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-dashed border-slate-300 transition-colors">
                      <Plus className="w-3 h-3" /> Añadir
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* RESUMEN DE HORAS */}
        <Card className="w-full xl:w-[350px] shrink-0 border-black/20 shadow-sm rounded-none">
          <div className="bg-[#ffff00] px-2 py-1 border-b border-black/20">
            <h3 className="text-[12px] font-bold text-black tracking-wide">DISTRIBUCION DE HORAS</h3>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-black/20">
              {Object.entries(totalesArea).map(([area, horas]) => (
                <div key={area} className="flex h-8">
                  <div className={`w-[90px] px-2 py-1 text-[10px] font-bold flex items-center border-r border-black/20 ${AREAS_COLORS[area as Area]}`}>
                    {area}
                  </div>
                  <div className="w-[60px] px-2 py-1 text-[11px] font-bold flex items-center justify-end bg-white border-r border-black/20">
                    {horas > 0 ? horas : ''}
                  </div>
                  <div className="flex-1 px-2 py-1 text-[10px] text-black bg-[#fce4d6] flex items-center">
                    Distribuir entre el total de colaboradores
                  </div>
                </div>
              ))}
              <div className="flex h-12 bg-white">
                <div className="w-[150px] px-2 py-1 text-[12px] font-bold text-black flex flex-col justify-end border-r border-black/20 pb-2">
                  <span className="text-[10px] absolute -mt-4 text-center w-[150px] right-0 mr-[200px]">127.5</span> {/* hardcode for testing similar to excel */}
                </div>
                <div className="flex-1 px-2 py-1"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
