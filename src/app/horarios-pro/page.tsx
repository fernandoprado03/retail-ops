'use client'

import { useState } from 'react'
import { Upload, FileSpreadsheet, Plus, Trash2, ArrowUp, ArrowDown, Eraser } from 'lucide-react'
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
  inicio: number // Fracción de hora (ej: 8.25 = 08:15)
  fin: number
  breakInicio?: number
  breakFin?: number
  isSCO?: boolean
  isMultifuncional?: boolean
  caja?: string
}

interface ReporteDia {
  fecha: string
  requeridoPorHora: Record<number, number>
  empleados: TurnoEmpleado[]
}

const HORAS_ENTERAS = Array.from({ length: 15 }, (_, i) => i + 8) // 8 a 22
const CUARTOS_DE_HORA = [0, 0.25, 0.5, 0.75]

const formatTime = (fraction: number): string => {
  if (isNaN(fraction)) return '00:00'
  const h = Math.floor(fraction) % 24
  const m = Math.round((fraction - Math.floor(fraction)) * 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

const timeToFraction = (timeStr: string): number => {
  try {
    const [h, m] = timeStr.split(':').map(Number)
    const result = h + (m || 0) / 60
    return isNaN(result) ? 0 : result
  } catch {
    return 0
  }
}


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
            const times: number[] = []
            for (const cell of row) {
              if (typeof cell === 'string' && timeRegex.test(cell.trim())) {
                times.push(timeToFraction(cell.trim()))
              } else if (typeof cell === 'number' && cell > 0 && cell < 1) {
                // Excel time fraction. 0.3333 -> 8.0
                const fraction = cell * 24
                // Redondeamos al cuarto de hora más cercano (0, 0.25, 0.5, 0.75) para evitar errores de precisión flotante
                const roundedFraction = Math.round(fraction * 4) / 4
                times.push(roundedFraction)
              }
            }

            if (times.length >= 2) {
              // Ordenamos los tiempos cronológicamente en caso vengan desordenados
              times.sort((a, b) => a - b)

              let start = times[0]
              let end = times[times.length - 1]
              let breakStart, breakEnd
              
              if (times.length === 4) {
                breakStart = times[1]
                breakEnd = times[2]
              }

              if (end < start) end += 24

              // Ignoramos turnos de cero horas (ej. "00:00" a "00:00") 
              // O turnos que están completamente fuera de la vista de 8:00 a 23:00
              if (end === start) continue
              if (end <= 8 || start >= 23) continue

              let isSCO = false
              const rowStr = row.join(' ').toLowerCase()
              if (rowStr.includes('sco') || rowStr.includes('selfcheckout') || rowStr.includes('self checkout')) {
                isSCO = true
              }

              empleados.push({
                id: `${fechaDemanda}-${i}`,
                nombre: row[0].trim(),
                rol: typeof row[2] === 'string' ? row[2] : 'Cajero',
                inicio: start,
                fin: end,
                breakInicio: breakStart,
                breakFin: breakEnd,
                isSCO
              })
            }
          }
        }
        

        const poolCajas = ['13', '12', '11', '9', '7', '5', '3', '1', '10', '8', '6', '2']
        let cajaIndex = 0
        empleados.sort((a, b) => a.inicio - b.inicio).forEach(emp => {
          if (!emp.isSCO && !emp.isMultifuncional && emp.rol !== 'Soporte Automático') {
            emp.caja = poolCajas[cajaIndex % poolCajas.length]
            cajaIndex++
          }
        })

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


  const updateEmpleado = (diaIndex: number, empId: string, updates: Partial<TurnoEmpleado>) => {
    const newReporte = [...reporte]
    const emp = newReporte[diaIndex].empleados.find(e => e.id === empId)
    if (emp) {
      Object.assign(emp, updates)
      setReporte(newReporte)
    }
  }

  const handleHorarioChange = (diaIndex: number, empId: string, val: string) => {
    const parts = val.split('-').map(s => s.trim())
    if (parts.length === 2) {
      const inicio = timeToFraction(parts[0])
      let fin = timeToFraction(parts[1])
      if (fin < inicio) fin += 24
      updateEmpleado(diaIndex, empId, { inicio, fin })
    }
  }

  const toggleSCO = (diaIndex: number, empId: string) => {
    const newReporte = [...reporte]
    const emp = newReporte[diaIndex].empleados.find(e => e.id === empId)
    if (emp) emp.isSCO = !emp.isSCO
    setReporte(newReporte)
  }

  const moveBreak = (diaIndex: number, empId: string, newBreakStartFraction: number) => {
    const newReporte = [...reporte]
    const emp = newReporte[diaIndex].empleados.find(e => e.id === empId)
    if (emp && emp.breakInicio !== undefined) {
      emp.breakInicio = newBreakStartFraction
      emp.breakFin = newBreakStartFraction + 1
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
    
    // Sort again to place the new empty row in the right spot based on its start time
    newReporte[diaIndex].empleados.sort((a, b) => a.inicio - b.inicio)
    setReporte(newReporte)
  }
  
  const removeEmpleado = (diaIndex: number, empId: string) => {
    const newReporte = [...reporte]
    newReporte[diaIndex].empleados = newReporte[diaIndex].empleados.filter(e => e.id !== empId)
    setReporte(newReporte)
    toast.success('Turno eliminado')
  }

  const clearMultifuncionales = (diaIndex: number) => {
    const newReporte = [...reporte]
    newReporte[diaIndex].empleados = newReporte[diaIndex].empleados.filter(e => !e.isMultifuncional)
    setReporte(newReporte)
    toast.success('Se eliminaron todos los turnos de apoyo')
  }

  const moveEmpleadoOrder = (diaIndex: number, empId: string, direction: 'up' | 'down') => {
    const newReporte = [...reporte]
    const empIndex = newReporte[diaIndex].empleados.findIndex(e => e.id === empId)
    if (empIndex < 0) return
    
    if (direction === 'up' && empIndex > 0) {
      const temp = newReporte[diaIndex].empleados[empIndex - 1]
      newReporte[diaIndex].empleados[empIndex - 1] = newReporte[diaIndex].empleados[empIndex]
      newReporte[diaIndex].empleados[empIndex] = temp
    } else if (direction === 'down' && empIndex < newReporte[diaIndex].empleados.length - 1) {
      const temp = newReporte[diaIndex].empleados[empIndex + 1]
      newReporte[diaIndex].empleados[empIndex + 1] = newReporte[diaIndex].empleados[empIndex]
      newReporte[diaIndex].empleados[empIndex] = temp
    }
    setReporte(newReporte)
  }

  const autoFillGaps = (diaIndex: number) => {
    const dia = reporte[diaIndex]
    const newReporte = [...reporte]
    let faltantes = false

    // FASE 1: Optimización Inteligente de Breaks
    // Movemos los breaks a zonas de "exceso" de personal antes de contratar apoyo.
    let prog = calculateProgramado(newReporte[diaIndex].empleados)
    let breaksMovidos = false

    for (let pass = 0; pass < 3; pass++) {
      let movedInPass = false
      for (const h of HORAS_ENTERAS) {
        for (const q of CUARTOS_DE_HORA) {
          const t = h + q
          const req = dia.requeridoPorHora[h] || 0
          
          if (prog[t] < req) {
            // Falta gente. Buscamos cajeros que estén en break justo en este momento.
            const candidatosBreak = newReporte[diaIndex].empleados.filter(
              e => !e.isSCO && e.breakInicio !== undefined && e.breakFin !== undefined && t >= e.breakInicio && t < e.breakFin
            )
            
            for (const emp of candidatosBreak) {
              let bestNewBreak = -1
              let maxExcess = -999
              const breakLength = emp.breakFin! - emp.breakInicio!
              
              for (let start = emp.inicio; start <= emp.fin - breakLength; start += 0.25) {
                let canMove = true
                let minExcess = 999
                
                for (let bt = start; bt < start + breakLength; bt += 0.25) {
                  const h_bt = Math.floor(bt)
                  const req_bt = dia.requeridoPorHora[h_bt] || 0
                  
                  const isOldBreak = bt >= emp.breakInicio! && bt < emp.breakFin!
                  const newProg = prog[bt] - (isOldBreak ? 0 : 1)
                  
                  if (newProg < req_bt) {
                    canMove = false
                    break
                  }
                  
                  const excess = newProg - req_bt
                  if (excess < minExcess) minExcess = excess
                }
                
                if (canMove && minExcess > maxExcess) {
                  maxExcess = minExcess
                  bestNewBreak = start
                }
              }
              
              if (bestNewBreak !== -1 && bestNewBreak !== emp.breakInicio) {
                emp.breakInicio = bestNewBreak
                emp.breakFin = bestNewBreak + breakLength
                prog = calculateProgramado(newReporte[diaIndex].empleados)
                movedInPass = true
                breaksMovidos = true
                break 
              }
            }
          }
        }
      }
      if (!movedInPass) break
    }

    // FASE 2: Rellenar Brechas Restantes (Crear multifuncionales)
    for (const h of HORAS_ENTERAS) {
      for (const q of CUARTOS_DE_HORA) {
        const t = h + q
        // El usuario solicitó no llenar demanda a las 22:45 (22.75)
        const req = t >= 22.75 ? 0 : (dia.requeridoPorHora[h] || 0)
        
        prog = calculateProgramado(newReporte[diaIndex].empleados)
        
        while (prog[t] < req) {
          faltantes = true
          
          let inicio = t
          let fin = t
          
          while (fin < 22.75 && (fin - inicio) < 4.5) {
            const h_fin = Math.floor(fin)
            const req_fin = fin >= 22.75 ? 0 : (dia.requeridoPorHora[h_fin] || 0)
            
            if (prog[fin] < req_fin) {
              fin += 0.25
            } else {
              if (fin - inicio < 1.5) {
                fin += 0.25
              } else {
                break
              }
            }
          }
          
          if (fin - inicio < 1.5) {
            fin = inicio + 1.5
          }

          if (fin > 22.75) {
            fin = 22.75
            inicio = Math.max(8, 22.75 - 1.5)
          }

          newReporte[diaIndex].empleados.push({
            id: `auto-${Date.now()}-${Math.random()}`,
            nombre: 'Soporte Automático',
            rol: 'Multifuncional',
            inicio: inicio,
            fin: fin,
            isMultifuncional: true
          })
          
          prog = calculateProgramado(newReporte[diaIndex].empleados)
        }
      }
    }
    
    if (faltantes || breaksMovidos) {
      newReporte[diaIndex].empleados.sort((a, b) => a.inicio - b.inicio)
      setReporte(newReporte)
      if (breaksMovidos && !faltantes) {
         toast.success('Se optimizaron los breaks para cubrir todo sin apoyo extra')
      } else {
         toast.success('Breaks optimizados y apoyos generados (min 1.5h, máx 4.5h)')
      }
    } else {
      toast.info('No hay brechas que cubrir')
    }
  }

  const calculateProgramado = (empleados: TurnoEmpleado[]) => {
    const prog: Record<number, number> = {}
    HORAS_ENTERAS.forEach(h => {
      CUARTOS_DE_HORA.forEach(q => prog[h + q] = 0)
    })
    
    empleados.forEach(emp => {
      if (emp.isSCO) return
      
      for (let t = emp.inicio; t < emp.fin; t += 0.25) {
        if (emp.breakInicio !== undefined && emp.breakFin !== undefined && t >= emp.breakInicio && t < emp.breakFin) continue
        if (prog[t] !== undefined) prog[t] += 1
      }
    })
    return prog
  }

  return (
    <div className="pb-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Programación Visual Pro (15 Min)</h1>
        <p className="text-sm text-slate-500">Diseño ajustado a bloques de 15 minutos exactos según el archivo original.</p>
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
            const progPorCuarto = calculateProgramado(dia.empleados)
            
            return (
              <Card key={idx} className="overflow-hidden shadow-sm border-slate-200">
                <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center">
                  <h3 className="font-bold">{dia.fecha}</h3>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={() => clearMultifuncionales(idx)} className="h-8 text-xs border-none" title="Limpiar todos los apoyos agregados">
                      <Eraser className="w-4 h-4 mr-1" /> Limpiar
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => autoFillGaps(idx)} className="h-8 text-xs bg-slate-700 hover:bg-slate-600 text-white border-none">
                      Cubrir Brechas Automáticamente
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => addMultifuncional(idx)} className="h-8 text-xs bg-green-600 hover:bg-green-500 text-white border-none">
                      <Plus className="w-4 h-4 mr-1" /> Añadir Multifuncional
                    </Button>
                  </div>
                </div>
                
                <div className="p-0 overflow-x-auto">
                  <div className="min-w-[1200px]">
                    {/* HEADER DE HORAS */}
                    <div className="flex bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                      <div className="w-[360px] shrink-0 p-3 border-r border-slate-200">Personal / Horas</div>
                      {HORAS_ENTERAS.map(h => (
                        <div key={h} className="flex-1 text-center py-2 border-r border-slate-200 last:border-0 border-l-2 border-l-slate-300">
                          {h}:00
                        </div>
                      ))}
                    </div>

                    {/* MATRIZ DE REQUERIMIENTOS Y BRECHA (Por cuarto de hora) */}
                    <div className="flex border-b-2 border-slate-300 bg-slate-100">
                      <div className="w-[360px] shrink-0 p-3 border-r border-slate-200 flex flex-col justify-center">
                        <span className="text-xs font-bold text-slate-700">Demanda (Cajas Lineal)</span>
                        <span className="text-[10px] font-medium text-slate-500">Proyección vs Real</span>
                      </div>
                      
                      {HORAS_ENTERAS.map(h => {
                        return (
                          <div key={h} className="flex-1 flex border-r border-slate-200 border-l-2 border-l-slate-300">
                            {CUARTOS_DE_HORA.map(q => {
                              const t = h + q
                              const req = t >= 22.75 ? 0 : (dia.requeridoPorHora[h] || 0)
                              const actual = progPorCuarto[t] || 0
                              const falta = req - actual
                              
                              return (
                                <div key={q} className="flex-1 border-r border-slate-200/50 flex flex-col items-center justify-start py-1 bg-white/50 last:border-r-0">
                                  <div className={`text-[11px] font-bold ${t >= 22.75 ? 'text-slate-400' : 'text-slate-800'}`}>{req}</div>
                                  {falta > 0 && (
                                    <div className="mt-1 w-full bg-red-100 text-red-700 text-[9px] font-bold py-0.5 text-center shadow-sm" title={`Faltan ${falta}`}>
                                      -{falta}
                                    </div>
                                  )}
                                  {falta < 0 && (
                                    <div className="mt-1 w-full bg-blue-100 text-blue-700 text-[9px] font-bold py-0.5 text-center shadow-sm" title={`Sobran ${Math.abs(falta)}`}>
                                      +{Math.abs(falta)}
                                    </div>
                                  )}
                                  {falta === 0 && req > 0 && (
                                    <div className="mt-1 w-full bg-green-100 text-green-700 text-[9px] font-bold py-0.5 text-center shadow-sm">
                                      OK
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>

                    {/* EMPLEADOS PROGRAMADOS */}
                    <div className="divide-y divide-slate-100 bg-white">
                      {dia.empleados.map((emp) => (
                        <div key={emp.id} className={`flex hover:bg-slate-50 transition-colors group/row ${emp.isSCO ? 'bg-purple-50/30' : ''} ${emp.isMultifuncional ? 'bg-amber-50/30' : ''}`}>
                          <div className="w-[360px] shrink-0 p-2 border-r border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                              <Checkbox 
                                checked={emp.isSCO} 
                                onCheckedChange={() => toggleSCO(idx, emp.id)}
                                id={`sco-${emp.id}`}
                              />
                              
                                <div className="flex flex-col overflow-hidden flex-1">
                                  <input 
                                    className={`text-xs font-bold truncate cursor-text bg-transparent border-none p-0 outline-none focus:ring-1 focus:ring-slate-300 rounded ${emp.isSCO ? 'text-purple-700' : 'text-slate-800'} ${emp.isMultifuncional ? 'text-amber-700' : ''}`}
                                    value={emp.nombre}
                                    title={emp.nombre}
                                    onChange={(e) => updateEmpleado(idx, emp.id, { nombre: e.target.value })}
                                  />
                                  <span className="text-[10px] text-slate-500 truncate">
                                    {emp.isSCO ? 'Autoservicio (SCO)' : emp.rol}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 items-end shrink-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-medium text-slate-400">CAJA</span>
                                  <input 
                                    className="w-8 text-xs font-bold text-center bg-slate-100 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-slate-400"
                                    value={emp.caja || ''}
                                    onChange={(e) => updateEmpleado(idx, emp.id, { caja: e.target.value })}
                                  />
                                </div>
                                <input 
                                  className="w-20 text-[10px] font-medium text-center bg-slate-100 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-slate-400"
                                  defaultValue={`${formatTime(emp.inicio)} - ${formatTime(emp.fin > 24 ? emp.fin - 24 : emp.fin)}`}
                                  onBlur={(e) => handleHorarioChange(idx, emp.id, e.target.value)}
                                />
                              </div>

                            {/* Actions (Reorder and Delete) visible on hover */}
                            <div className="flex flex-col opacity-0 group-hover/row:opacity-100 transition-opacity gap-1">
                              <div className="flex gap-1">
                                <button onClick={() => moveEmpleadoOrder(idx, emp.id, 'up')} className="p-0.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded">
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button onClick={() => moveEmpleadoOrder(idx, emp.id, 'down')} className="p-0.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded">
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                              <button onClick={() => removeEmpleado(idx, emp.id)} className="p-0.5 text-red-400 hover:text-red-600 bg-red-50 rounded flex justify-center">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          {HORAS_ENTERAS.map(h => (
                            <div key={h} className="flex-1 flex border-r border-slate-200 border-l-2 border-l-slate-300">
                              {CUARTOS_DE_HORA.map(q => {
                                const t = h + q
                                const isWorking = t >= emp.inicio && t < emp.fin
                                const isBreak = emp.breakInicio !== undefined && emp.breakFin !== undefined && t >= emp.breakInicio && t < emp.breakFin
                                
                                let bg = ''
                                if (isBreak) bg = 'bg-yellow-300 border-yellow-400 z-10 shadow-sm'
                                else if (emp.isSCO && isWorking) bg = 'bg-purple-400 border-purple-500'
                                else if (emp.isMultifuncional && isWorking) bg = 'bg-amber-400 border-amber-500'
                                else if (isWorking) bg = 'bg-green-500 border-green-600'
                                
                                return (
                                  <div 
                                    key={q} 
                                    className="flex-1 border-r border-slate-100/50 p-[1px] cursor-pointer relative group last:border-r-0"
                                    onClick={() => {
                                      if (isWorking && emp.breakInicio !== undefined) moveBreak(idx, emp.id, t)
                                    }}
                                  >
                                    {isWorking && (
                                      <div className={`w-full h-full min-h-[24px] rounded-sm border-t border-b ${bg} ${q === 0 || t === emp.inicio ? 'border-l rounded-l-sm' : 'border-l-0 rounded-l-none'} ${q === 0.75 || t === emp.fin - 0.25 ? 'border-r rounded-r-sm' : 'border-r-0 rounded-r-none'} flex items-center justify-center transition-all hover:opacity-80`}>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ))}
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
