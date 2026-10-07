'use client'

import { useState, useMemo } from 'react'
import { Upload, FileSpreadsheet, Calculator, Users, Plus, Edit2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

// ----- TIPOS -----
interface TurnoEmpleado {
  id: string
  nombre: string
  rol: string
  inicio: number
  fin: number
  breakInicio?: number
  breakFin?: number
  isSCO?: boolean
  isMultifuncional?: boolean
}

interface ReporteDia {
  fecha: string
  requeridoPorHora: Record<number, number>
  empleados: TurnoEmpleado[]
}

const HORAS_MOSTRAR = Array.from({ length: 15 }, (_, i) => i + 8) // 8:00 a 22:00

export default function HorariosPro() {
  const [demandaFile, setDemandaFile] = useState<File | null>(null)
  const [mallaFile, setMallaFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [reporte, setReporte] = useState<ReporteDia[]>([])

  const processFiles = async () => {
    if (!demandaFile || !mallaFile) return
    setIsProcessing(true)
    
    try {
      const demandaBuffer = await demandaFile.arrayBuffer()
      const wbDemanda = XLSX.read(demandaBuffer, { type: 'array' })
      const dataDemanda = XLSX.utils.sheet_to_json<any[]>(wbDemanda.Sheets[wbDemanda.SheetNames[0]], { header: 1 })
      
      const demandaMap: Record<string, Record<number, number>> = {}
      let currentDate = ''

      for (const row of dataDemanda) {
        if (!row || row.length === 0) continue
        if (typeof row[0] === 'string' && row[0].includes('.')) {
          currentDate = row[0].trim().toLowerCase()
          demandaMap[currentDate] = {}
        } else if (typeof row[0] === 'number' && currentDate) {
          const totalHours = Math.round(row[0] * 24)
          const hour = totalHours % 24
          const requerido = row[3] ? Number(row[3]) : 0
          demandaMap[currentDate][hour] = Math.ceil(requerido)
        }
      }

      const mallaBuffer = await mallaFile.arrayBuffer()
      const wbMalla = XLSX.read(mallaBuffer, { type: 'array' })
      const reportes: ReporteDia[] = []
      const timeRegex = /^\d{2}:\d{2}$/

      for (const [fechaDemanda, requeridoMap] of Object.entries(demandaMap)) {
        const sheetName = wbMalla.SheetNames.find(s => {
          const norm = s.toLowerCase().replace('lunes', 'lun.').replace('martes', 'mar.').replace('miércoles', 'mié.').replace('jueves', 'jue.').replace('viernes', 'vie.').replace('sábado', 'sáb.').replace('domingo', 'dom.')
          return norm.includes(fechaDemanda.split(' ')[0]) && norm.includes(fechaDemanda.split(' ')[2])
        })

        if (!sheetName) continue

        const sheet = wbMalla.Sheets[sheetName]
        const dataMalla = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 })
        const empleados: TurnoEmpleado[] = []

        for (let i = 0; i < dataMalla.length; i++) {
          const row = dataMalla[i]
          if (!row || row.length === 0) continue
          
          if (typeof row[0] === 'string' && row[0].trim().length > 5 && !row[0].toLowerCase().includes('tienda') && !row[0].toLowerCase().includes('seguimiento')) {
            const times: string[] = []
            for (const cell of row) {
              if (typeof cell === 'string' && timeRegex.test(cell.trim())) {
                times.push(cell.trim())
              }
            }

            if (times.length >= 2) {
              const startHour = parseInt(times[0].split(':')[0])
              const endHour = parseInt(times[times.length - 1].split(':')[0])
              let breakStartHour, breakEndHour
              
              if (times.length === 4) {
                breakStartHour = parseInt(times[1].split(':')[0])
                breakEndHour = parseInt(times[2].split(':')[0])
              }

              empleados.push({
                id: `${fechaDemanda}-${i}`,
                nombre: row[0].trim(),
                rol: typeof row[2] === 'string' ? row[2] : 'Cajero',
                inicio: startHour,
                fin: endHour,
                breakInicio: breakStartHour,
                breakFin: breakEndHour,
                isSCO: false
              })
            }
          }
        }

        reportes.push({
          fecha: fechaDemanda.toUpperCase(),
          requeridoPorHora: requeridoMap,
          empleados
        })
      }

      setReporte(reportes)
      toast.success('Archivos procesados correctamente')
    } catch (e) {
      console.error(e)
      toast.error('Error procesando archivos')
    } finally {
      setIsProcessing(false)
    }
  }

  // Interacciones
  const toggleSCO = (diaIndex: number, empId: string) => {
    const newReporte = [...reporte]
    const emp = newReporte[diaIndex].empleados.find(e => e.id === empId)
    if (emp) emp.isSCO = !emp.isSCO
    setReporte(newReporte)
  }

  const moveBreak = (diaIndex: number, empId: string, newBreakStart: number) => {
    const newReporte = [...reporte]
    const emp = newReporte[diaIndex].empleados.find(e => e.id === empId)
    if (emp && emp.breakInicio !== undefined) {
      emp.breakInicio = newBreakStart
      emp.breakFin = newBreakStart + 1
    }
    setReporte(newReporte)
  }

  const addMultifuncional = (diaIndex: number) => {
    const newReporte = [...reporte]
    newReporte[diaIndex].empleados.push({
      id: `multi-${Date.now()}`,
      nombre: 'Vacante Multifuncional',
      rol: 'Apoyo',
      inicio: 9,
      fin: 13,
      isMultifuncional: true
    })
    setReporte(newReporte)
  }

  const autoFillGaps = (diaIndex: number) => {
    const dia = reporte[diaIndex]
    const prog = calculateProgramado(dia.empleados)
    
    let faltantes = false
    const newReporte = [...reporte]
    
    // Crear multifuncionales automáticamente para las horas donde falta gente
    for (const h of HORAS_MOSTRAR) {
      const req = dia.requeridoPorHora[h] || 0
      const actual = prog[h] || 0
      if (req > actual) {
        faltantes = true
        newReporte[diaIndex].empleados.push({
          id: `auto-${Date.now()}-${h}`,
          nombre: 'Soporte Automático',
          rol: 'Multifuncional',
          inicio: h,
          fin: h + 1,
          isMultifuncional: true
        })
      }
    }
    
    if (faltantes) {
      setReporte(newReporte)
      toast.success('Se agregaron horas de multifuncionales automáticamente')
    } else {
      toast.info('No hay brechas que cubrir')
    }
  }

  const calculateProgramado = (empleados: TurnoEmpleado[]) => {
    const prog: Record<number, number> = {}
    HORAS_MOSTRAR.forEach(h => prog[h] = 0)
    
    empleados.forEach(emp => {
      if (emp.isSCO) return
      for (let h = emp.inicio; h < emp.fin; h++) {
        if (emp.breakInicio && emp.breakFin && h >= emp.breakInicio && h < emp.breakFin) continue
        prog[h] += 1
      }
    })
    return prog
  }

  return (
    <div className="pb-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Programación Visual Pro</h1>
        <p className="text-sm text-slate-500">Haz clic en el cuadro de un empleado para marcarlo como SCO, o haz clic en sus horas para mover su Break.</p>
      </div>

      {reporte.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Requerimiento</CardTitle></CardHeader>
            <CardContent>
              <input type="file" accept=".xlsx" onChange={e => setDemandaFile(e.target.files?.[0] || null)} className="w-full text-sm" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Malla Actual</CardTitle></CardHeader>
            <CardContent>
              <input type="file" accept=".xlsx" onChange={e => setMallaFile(e.target.files?.[0] || null)} className="w-full text-sm" />
            </CardContent>
          </Card>
          <Button onClick={processFiles} disabled={isProcessing || !demandaFile || !mallaFile} className="md:col-span-2 h-12 bg-slate-900">
            {isProcessing ? 'Procesando...' : 'Generar Mapa de Horarios'}
          </Button>
        </div>
      ) : (
        <div className="space-y-12 animate-in fade-in duration-500">
          <Button variant="outline" onClick={() => setReporte([])}>Volver a subir archivos</Button>
          
          {reporte.map((dia, idx) => {
            const prog = calculateProgramado(dia.empleados)
            
            return (
              <Card key={idx} className="overflow-hidden shadow-sm border-slate-200">
                <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center">
                  <h3 className="font-bold">{dia.fecha}</h3>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => autoFillGaps(idx)} className="h-8 text-xs bg-slate-700 hover:bg-slate-600 text-white border-none">
                      Cubrir Brechas Automáticamente
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => addMultifuncional(idx)} className="h-8 text-xs bg-green-600 hover:bg-green-500 text-white border-none">
                      <Plus className="w-4 h-4 mr-1" /> Añadir Multifuncional
                    </Button>
                  </div>
                </div>
                
                <div className="p-0 overflow-x-auto">
                  <div className="min-w-[800px]">
                    {/* HEADER DE HORAS */}
                    <div className="flex bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                      <div className="w-56 shrink-0 p-3 border-r border-slate-200">Personal / Horas</div>
                      {HORAS_MOSTRAR.map(h => (
                        <div key={h} className="flex-1 text-center py-3 border-r border-slate-200 last:border-0">{h}:00</div>
                      ))}
                    </div>

                    {/* MATRIZ DE REQUERIMIENTOS Y BRECHA */}
                    <div className="flex border-b-2 border-slate-300 bg-slate-100">
                      <div className="w-56 shrink-0 p-3 border-r border-slate-200 flex flex-col justify-center">
                        <span className="text-xs font-bold text-slate-700">Demanda (Cajas Lineal)</span>
                        <span className="text-[10px] font-medium text-slate-500">Proyección vs Real</span>
                      </div>
                      {HORAS_MOSTRAR.map(h => {
                        const req = dia.requeridoPorHora[h] || 0
                        const actual = prog[h] || 0
                        const falta = req - actual
                        
                        return (
                          <div key={h} className="flex-1 border-r border-slate-200 flex flex-col items-center justify-center p-1 bg-white/50">
                            <div className="text-sm font-bold text-slate-800">{req}</div>
                            {falta > 0 && (
                              <div className="mt-1 bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                Faltan {falta}
                              </div>
                            )}
                            {falta < 0 && (
                              <div className="mt-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                Sobran {Math.abs(falta)}
                              </div>
                            )}
                            {falta === 0 && req > 0 && (
                              <div className="mt-1 bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                                OK
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* EMPLEADOS PROGRAMADOS */}
                    <div className="divide-y divide-slate-100 bg-white">
                      {dia.empleados.map((emp) => (
                        <div key={emp.id} className={`flex hover:bg-slate-50 transition-colors ${emp.isSCO ? 'bg-purple-50/30' : ''} ${emp.isMultifuncional ? 'bg-amber-50/30' : ''}`}>
                          <div className="w-56 shrink-0 p-2 border-r border-slate-200 flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                checked={emp.isSCO} 
                                onCheckedChange={() => toggleSCO(idx, emp.id)}
                                id={`sco-${emp.id}`}
                              />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <label htmlFor={`sco-${emp.id}`} className={`text-xs font-bold truncate cursor-pointer ${emp.isSCO ? 'text-purple-700' : 'text-slate-800'} ${emp.isMultifuncional ? 'text-amber-700' : ''}`}>
                                {emp.nombre}
                              </label>
                              <span className="text-[10px] text-slate-500 truncate">
                                {emp.isSCO ? 'Autoservicio (SCO)' : emp.rol}
                              </span>
                            </div>
                          </div>
                          
                          {HORAS_MOSTRAR.map(h => {
                            const isWorking = h >= emp.inicio && h < emp.fin
                            const isBreak = emp.breakInicio && emp.breakFin && h >= emp.breakInicio && h < emp.breakFin
                            
                            let bg = ''
                            if (isBreak) bg = 'bg-yellow-200 border-yellow-400 text-yellow-800'
                            else if (emp.isSCO && isWorking) bg = 'bg-purple-400 border-purple-500 text-white'
                            else if (emp.isMultifuncional && isWorking) bg = 'bg-amber-400 border-amber-500 text-amber-900'
                            else if (isWorking) bg = 'bg-green-500 border-green-600 text-white'
                            
                            return (
                              <div 
                                key={h} 
                                className="flex-1 border-r border-slate-100 p-1 cursor-pointer relative group"
                                onClick={() => {
                                  if (isWorking && emp.breakInicio !== undefined) moveBreak(idx, emp.id, h)
                                }}
                              >
                                {isWorking && (
                                  <div className={`w-full h-full min-h-[28px] rounded-sm border ${bg} shadow-sm flex items-center justify-center transition-all hover:opacity-80`}>
                                    {isBreak && <span className="text-[10px] font-bold">BRK</span>}
                                    {!isBreak && emp.isSCO && <span className="text-[9px] font-medium opacity-80">SCO</span>}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
