'use client'

import { useState, useEffect } from 'react'
import { Upload, FileSpreadsheet, Plus, Trash2, ArrowUp, ArrowDown, Eraser, Download, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as htmlToImage from 'html-to-image'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase'
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
  customRoles?: Record<number, 'SCO' | 'CAJA'>
  area?: string
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
  const [mounted, setMounted] = useState(false)
  
  const [semanasGuardadas, setSemanasGuardadas] = useState<{id: string, nombre_semana: string}[]>([])
  const [semanaCargando, setSemanaCargando] = useState(false)
  const [currentSemanaId, setCurrentSemanaId] = useState<string | null>(null)

  const cargarSemanas = async () => {
    try {
      const { data } = await supabase.from('semanas_planificadas').select('id, nombre_semana').order('created_at', { ascending: false })
      if (data) setSemanasGuardadas(data)
    } catch(e) {}
  }

  useEffect(() => {
    setMounted(true)
    cargarSemanas()
    const saved = localStorage.getItem('horarios_pro_reporte')
    if (saved) {
      try {
        setReporte(JSON.parse(saved))
      } catch (e) {}
    }
    const savedId = localStorage.getItem('horarios_pro_current_semana_id')
    if (savedId) {
      setCurrentSemanaId(savedId)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (reporte.length > 0) {
      localStorage.setItem('horarios_pro_reporte', JSON.stringify(reporte))
    } else {
      localStorage.removeItem('horarios_pro_reporte')
    }
    if (currentSemanaId) {
      localStorage.setItem('horarios_pro_current_semana_id', currentSemanaId)
    } else {
      localStorage.removeItem('horarios_pro_current_semana_id')
    }
  }, [reporte, currentSemanaId, mounted])


  const processFiles = async () => {
    if (!demandaFile || !mallaFile) return
    setIsProcessing(true)
    setCurrentSemanaId(null)
    
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
        

        // Ordenamos los empleados originales por hora de inicio
        empleados.sort((a, b) => a.inicio - b.inicio)

        const poolCajas = ['13', '12', '11', '9', '7', '5', '3', '1', '10', '8', '6', '2']
        const validEmps = empleados.filter(emp => !emp.isSCO && !emp.isMultifuncional && emp.rol !== 'Soporte Automático')
        
        let left = 0
        let right = validEmps.length - 1
        let cajaIndex = 0
        
        while (left <= right) {
          if (left === right) {
            validEmps[left].caja = poolCajas[cajaIndex % poolCajas.length]
            break
          }
          validEmps[left].caja = poolCajas[cajaIndex % poolCajas.length]
          cajaIndex++
          
          validEmps[right].caja = poolCajas[cajaIndex % poolCajas.length]
          cajaIndex++
          
          left++
          right--
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

  const toggleCustomRole = (diaIndex: number, empId: string, t: number) => {
    const newReporte = [...reporte]
    const emp = newReporte[diaIndex].empleados.find(e => e.id === empId)
    if (!emp) return
    
    if (!emp.customRoles) emp.customRoles = {}
    
    const defaultRole = emp.isSCO ? 'SCO' : 'CAJA'
    const currentRole = emp.customRoles[t] || defaultRole
    const newRole = currentRole === 'SCO' ? 'CAJA' : 'SCO'
    
    if (newRole === defaultRole) {
      delete emp.customRoles[t]
    } else {
      emp.customRoles[t] = newRole
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

    // FASE 0: Asegurar Cobertura Continua de Cajas Críticas (Pref y SCO)
    let prog = calculateProgramado(newReporte[diaIndex].empleados)
    
    const criticalGroups = [
      (e: TurnoEmpleado) => e.caja?.trim() === '13' || e.caja?.trim() === '12',
      (e: TurnoEmpleado) => !!e.isSCO
    ]

    for (const isCritical of criticalGroups) {
      for (let pass = 0; pass < 2; pass++) {
        for (const h of HORAS_ENTERAS) {
          for (const q of CUARTOS_DE_HORA) {
            const t = h + q
            if (t >= 22.5) continue
            
            const isGap = !newReporte[diaIndex].empleados.some(e => 
              isCritical(e) &&
              t >= e.inicio && t < e.fin &&
              !(e.breakInicio !== undefined && e.breakFin !== undefined && t >= e.breakInicio && t < e.breakFin)
            )

            if (isGap) {
              const onBreak = newReporte[diaIndex].empleados.find(e => 
                isCritical(e) &&
                e.breakInicio !== undefined && e.breakFin !== undefined && t >= e.breakInicio && t < e.breakFin
              )

              if (onBreak) {
                let bestNewBreak = -1
                let minDamage = 999
                const breakLength = onBreak.breakFin! - onBreak.breakInicio!
                
                const minBuffer = 1; // 1 hour minimum before and after break
                const maxStart = onBreak.fin - breakLength - minBuffer;
                const minStart = onBreak.inicio + minBuffer;
                
                for (let start = minStart; start <= maxStart; start += 0.25) {
                  let canMove = true
                  let shortageCaused = 0
                  
                  for (let bt = start; bt < start + breakLength; bt += 0.25) {
                    const otherIsOpen = newReporte[diaIndex].empleados.some(other => 
                      other.id !== onBreak.id && 
                      isCritical(other) &&
                      bt >= other.inicio && bt < other.fin &&
                      !(other.breakInicio !== undefined && other.breakFin !== undefined && bt >= other.breakInicio && bt < other.breakFin)
                    )
                    
                    // Si al mover el break aquí causamos un gap en esta área crítica, no podemos moverlo aquí
                    const anyoneScheduled = newReporte[diaIndex].empleados.some(other => isCritical(other) && bt >= other.inicio && bt < other.fin)
                    if (anyoneScheduled && !otherIsOpen) {
                      canMove = false
                      break
                    }
                    
                    const h_bt = Math.floor(bt)
                    const req_bt = dia.requeridoPorHora[h_bt] || 0
                    const isOldBreak = bt >= onBreak.breakInicio! && bt < onBreak.breakFin!
                    const newProg = prog[bt] - (isOldBreak ? 0 : 1)
                    if (!onBreak.isSCO && newProg < req_bt) {
                      shortageCaused += (req_bt - newProg)
                    }
                  }
                  
                  if (canMove && shortageCaused < minDamage) {
                    minDamage = shortageCaused
                    bestNewBreak = start
                  }
                }
                
                if (bestNewBreak !== -1 && bestNewBreak !== onBreak.breakInicio) {
                  onBreak.breakInicio = bestNewBreak
                  onBreak.breakFin = bestNewBreak + breakLength
                  prog = calculateProgramado(newReporte[diaIndex].empleados)
                }
              }
            }
          }
        }
      }
    }


    // FASE 1: Optimización Inteligente de Breaks (General)
    let breaksMovidos = false

    for (let pass = 0; pass < 3; pass++) {
      let movedInPass = false
      for (const h of HORAS_ENTERAS) {
        for (const q of CUARTOS_DE_HORA) {
          const t = h + q
          const req = dia.requeridoPorHora[h] || 0
          
          if (prog[t] < req) {
            let candidatosBreak = newReporte[diaIndex].empleados.filter(
              e => !e.isSCO && e.breakInicio !== undefined && e.breakFin !== undefined && t >= e.breakInicio && t < e.breakFin
            )
            
            for (const emp of candidatosBreak) {
              let bestNewBreak = -1
              let maxExcess = -999
              const breakLength = emp.breakFin! - emp.breakInicio!
              
              const minBuffer = 1;
              const maxStart = emp.fin - breakLength - minBuffer;
              const minStart = emp.inicio + minBuffer;
              
              for (let start = minStart; start <= maxStart; start += 0.25) {
                let canMove = true
                let minExcess = 999
                
                for (let bt = start; bt < start + breakLength; bt += 0.25) {
                  // If it's a preferencial, do not let it move to a spot that breaks preferencial coverage
                  if (emp.caja?.trim() === '13' || emp.caja?.trim() === '12') {
                    const otherPrefIsOpen = newReporte[diaIndex].empleados.some(other => 
                      other.id !== emp.id && 
                      (other.caja?.trim() === '13' || other.caja?.trim() === '12') &&
                      bt >= other.inicio && bt < other.fin &&
                      !(other.breakInicio !== undefined && other.breakFin !== undefined && bt >= other.breakInicio && bt < other.breakFin)
                    )
                    if (!otherPrefIsOpen) {
                      canMove = false
                      break
                    }
                  }

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
    
    // FASE 1.5: Reasignar exceso de SCO a CAJA para cubrir brechas
    let scoReasignados = false
    for (const h of HORAS_ENTERAS) {
      for (const q of CUARTOS_DE_HORA) {
        const t = h + q
        if (t >= 22.5) continue
        
        let req = dia.requeridoPorHora[h] || 0
        prog = calculateProgramado(newReporte[diaIndex].empleados)
        
        if (prog[t] < req) {
          const scosDisponibles = newReporte[diaIndex].empleados.filter(e => 
            e.isSCO && 
            t >= e.inicio && t < e.fin &&
            !(e.breakInicio !== undefined && e.breakFin !== undefined && t >= e.breakInicio && t < e.breakFin) &&
            (!e.customRoles || e.customRoles[t] !== 'CAJA')
          )
          
          if (scosDisponibles.length > 1) {
            let extras = scosDisponibles.length - 1
            for (const emp of scosDisponibles) {
              if (extras > 0 && prog[t] < req) {
                if (!emp.customRoles) emp.customRoles = {}
                emp.customRoles[t] = 'CAJA'
                prog = calculateProgramado(newReporte[diaIndex].empleados)
                extras--
                scoReasignados = true
              }
            }
          }
        }
      }
    }

    // FASE 2: Rellenar Brechas Restantes (Crear multifuncionales)
    for (const h of HORAS_ENTERAS) {
      for (const q of CUARTOS_DE_HORA) {
        const t = h + q
        // El usuario solicitó no llenar demanda a las 22:45 (22.5)
        const req = t >= 22.5 ? 0 : (dia.requeridoPorHora[h] || 0)
        
        prog = calculateProgramado(newReporte[diaIndex].empleados)
        
        while (prog[t] < req) {
          faltantes = true
          
          let inicio = t
          let fin = t
          
          while (fin < 22.5 && (fin - inicio) < 4.5) {
            const h_fin = Math.floor(fin)
            const req_fin = fin >= 22.5 ? 0 : (dia.requeridoPorHora[h_fin] || 0)
            
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

          if (fin > 22.5) {
            fin = 22.5
            inicio = Math.max(8, 22.5 - 1.5)
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
    
    // FASE 3: Fusionar bloques automáticos cercanos (<= 0.5 horas de diferencia)
    const autoEmpleados = newReporte[diaIndex].empleados.filter(e => e.id.startsWith('auto-'))
    const manualEmpleados = newReporte[diaIndex].empleados.filter(e => !e.id.startsWith('auto-'))
    
    autoEmpleados.sort((a, b) => a.inicio - b.inicio)
    const mergedAuto: TurnoEmpleado[] = []
    
    for (const emp of autoEmpleados) {
      let merged = false
      // Intentamos fusionar con algún bloque automático anterior
      for (const last of mergedAuto) {
        if (emp.inicio >= last.fin && (emp.inicio - last.fin) <= 0.5 && (emp.fin - last.inicio) <= 4.5) {
          last.fin = emp.fin
          merged = true
          break
        }
      }
      if (!merged) {
        mergedAuto.push(emp)
      }
    }
    
    newReporte[diaIndex].empleados = [...manualEmpleados, ...mergedAuto]
    
    if (faltantes || breaksMovidos || scoReasignados) {
      newReporte[diaIndex].empleados.sort((a, b) => a.inicio - b.inicio)
      setReporte(newReporte)
      if (scoReasignados && !faltantes && !breaksMovidos) {
         toast.success('Se reasignaron SCOs excedentes a Caja para cubrir la demanda')
      } else if (breaksMovidos && !faltantes) {
         toast.success('Se optimizaron los breaks para cubrir todo sin apoyo extra')
      } else {
         toast.success('Brechas cubiertas exitosamente')
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
      for (let t = emp.inicio; t < emp.fin; t += 0.25) {
        if (emp.breakInicio !== undefined && emp.breakFin !== undefined && t >= emp.breakInicio && t < emp.breakFin) continue
        
        const currentRole = emp.customRoles?.[t] || (emp.isSCO ? 'SCO' : 'CAJA')
        if (currentRole === 'SCO') continue // Morado no cuenta
        
        if (prog[t] !== undefined) prog[t] += 1
      }
    })
    return prog
  }

  const [isExporting, setIsExporting] = useState<number | null>(null)

  const exportToPDF = (idx: number, fecha: string) => {
    setIsExporting(idx)
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })
      
      const dia = reporte[idx]
      
      // Construir cabeceras
      const headRow1: any[] = [
        { content: 'Personal', rowSpan: 1, styles: { halign: 'left', valign: 'middle', cellWidth: 55 } },
        { content: 'Caja', rowSpan: 1, styles: { halign: 'center', valign: 'middle', cellWidth: 10 } }
      ]
      
      HORAS_ENTERAS.forEach(h => {
        headRow1.push({ content: `${h}:00`, colSpan: 4, styles: { halign: 'center', fillColor: [241, 245, 249], textColor: [15, 23, 42] } })
      })
      
      const prog = calculateProgramado(dia.empleados)
      
      const headRow3: any[] = [{ content: 'Demanda (Cajas Lineal)', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], halign: 'right' } }]
      HORAS_ENTERAS.forEach(h => {
        const req = dia.requeridoPorHora[h] || 0
        headRow3.push({ content: req.toString(), colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] } })
      })
      
      const headRow4: any[] = [{ content: 'Proyección vs Real', colSpan: 2, styles: { fontStyle: 'italic', fontSize: 6, fillColor: [248, 250, 252], halign: 'right' } }]
      HORAS_ENTERAS.forEach(h => {
        CUARTOS_DE_HORA.forEach(q => {
          const t = h + q
          const req = (t >= 22.5) ? 0 : (dia.requeridoPorHora[h] || 0)
          const actual = prog[t] || 0
          const diff = actual - req
          let text = diff === 0 ? ' ' : (diff > 0 ? `+${diff}` : `${diff}`)
          let color = diff === 0 ? [34, 197, 94] : (diff > 0 ? [59, 130, 246] : [239, 68, 68])
          
          headRow4.push({ 
            content: text, 
            styles: { halign: 'center', textColor: color, fontSize: 6, fontStyle: 'bold', fillColor: [248, 250, 252] } 
          })
        })
      })

      // Construir cuerpo
      const body = dia.empleados.map(emp => {
        const rowData: any[] = []
        const displayName = emp.area ? `${emp.nombre} (${emp.area})` : emp.nombre
        rowData.push(`${displayName}\n `)
        rowData.push({ content: emp.caja || (emp.isSCO ? 'SCO' : ''), styles: { halign: 'center', valign: 'middle', fontStyle: 'bold' } })
        
        HORAS_ENTERAS.forEach(h => {
          CUARTOS_DE_HORA.forEach(q => {
            const t = h + q
            const isWorking = t >= emp.inicio && t < emp.fin
            const isBreak = emp.breakInicio !== undefined && emp.breakFin !== undefined && t >= emp.breakInicio && t < emp.breakFin
            
            if (isBreak) rowData.push('B')
            else if (isWorking) {
              const currentRole = emp.customRoles?.[t] || (emp.isSCO ? 'SCO' : 'CAJA')
              if (currentRole === 'SCO') rowData.push('S')
              else if (emp.isMultifuncional) rowData.push('M')
              else rowData.push('R')
            } else {
              rowData.push('')
            }
          })
        })
        return rowData
      })

      pdf.setFontSize(14)
      pdf.text(`Programación de Cajas - ${fecha}`, 10, 15)

      const breakTextsToDraw: { text: string, x: number, y: number }[] = []

      autoTable(pdf, {
        startY: 20,
        margin: { top: 20, bottom: 20, left: 10, right: 10 },
        head: [headRow1, headRow3, headRow4],
        body: body,
        theme: 'grid',
        styles: {
          fontSize: 5,
          cellPadding: 0.5,
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [100, 116, 139],
          fontSize: 6,
          fontStyle: 'bold'
        },
        didParseCell: function (data: any) {
          if (data.section === 'body') {
            if (data.column.index === 0) {
              data.cell.styles.fontSize = 7
              data.cell.styles.fontStyle = 'bold'
            } else if (data.column.index === 1) {
              data.cell.styles.fontSize = 8
              data.cell.styles.fontStyle = 'bold'
            }
          }
          if (data.section === 'body' && data.column.index > 1) {
            const val = data.cell.raw
            data.cell.text = [''] // Ocultar texto
            if (val === 'B') data.cell.styles.fillColor = [253, 224, 71] // yellow-300
            else if (val === 'S') data.cell.styles.fillColor = [192, 132, 252] // purple-400
            else if (val === 'M') data.cell.styles.fillColor = [251, 191, 36] // amber-400
            else if (val === 'R') data.cell.styles.fillColor = [34, 197, 94] // green-500
          }
        },
        didDrawCell: function (data: any) {
          if (data.section === 'head' && data.row.index === 2 && data.column.index > 1) {
            if (data.cell.raw === ' ') {
              const doc = data.doc;
              doc.setDrawColor(34, 197, 94); // Verde para el check
              doc.setLineWidth(0.4);
              const cx = data.cell.x + data.cell.width / 2;
              const cy = data.cell.y + data.cell.height / 2;
              doc.line(cx - 0.8, cy + 0.2, cx - 0.2, cy + 1);
              doc.line(cx - 0.2, cy + 1, cx + 1, cy - 0.8);
            }
          }
          if (data.section === 'body' && data.column.index === 0) {
            const emp = dia.empleados[data.row.index]
            if (emp) {
              const doc = data.doc
              doc.setFontSize(7)
              doc.setFont("helvetica", "bold")
              doc.setTextColor(0, 0, 0)
              
              const timeText = `${formatTime(emp.inicio)} - ${formatTime(emp.fin > 24 ? emp.fin - 24 : emp.fin)}`
              const timeX = data.cell.x + data.cell.width - 1
              const timeY = data.cell.y + data.cell.height - 1.5
              doc.text(timeText, timeX, timeY, { align: 'right', baseline: 'bottom' })
            }
          }
          if (data.section === 'body' && data.column.index > 1) {
            if (data.cell.raw === 'B') {
              const prevCell = data.row.cells[data.column.index - 1]
              if (!prevCell || prevCell.raw !== 'B') {
                const emp = dia.empleados[data.row.index]
                if (emp && emp.breakInicio !== undefined && emp.breakFin !== undefined) {
                  const numCells = (emp.breakFin - emp.breakInicio) * 4
                  const breakText = `${formatTime(emp.breakInicio)} - ${formatTime(emp.breakFin > 24 ? emp.breakFin - 24 : emp.breakFin)}`
                  const totalWidth = data.cell.width * numCells
                  const startX = data.cell.x + totalWidth / 2
                  const startY = data.cell.y + data.cell.height / 2
                  breakTextsToDraw.push({ text: breakText, x: startX, y: startY })
                }
              }
            }
          }
        }
      })
      
      pdf.setFontSize(6.5)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(0, 0, 0)
      breakTextsToDraw.forEach(item => {
        pdf.text(item.text, item.x, item.y, { align: 'center', baseline: 'middle' })
      })
      
      pdf.save(`Programacion_Cajas_${fecha.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
      toast.success("PDF exportado en formato tabla con éxito")
    } catch (err) {
      console.error('Error generating PDF table:', err)
      toast.error("Hubo un error al generar la tabla PDF")
      setIsExporting(null)
    }
  }

  const guardarSemana = async () => {
    let nombre = ''
    if (!currentSemanaId) {
      const resp = prompt('¿Qué nombre le quieres dar a esta semana nueva? (Ej: Semana 42)')
      if (!resp) return
      nombre = resp
    }
    setSemanaCargando(true)
    try {
      const personasStr = localStorage.getItem('apoyo_personas_area')
      let personasObj = {}
      if (personasStr) {
        try { personasObj = JSON.parse(personasStr) } catch(e){}
      }
      
      if (currentSemanaId) {
        const { error } = await supabase.from('semanas_planificadas').update({
          data_reporte: reporte,
          data_personas: personasObj,
          updated_at: new Date().toISOString()
        }).eq('id', currentSemanaId)
        if (error) throw error
        toast.success('Semana sobreescrita y guardada con éxito')
      } else {
        const { data, error } = await supabase.from('semanas_planificadas').insert({
          nombre_semana: nombre,
          data_reporte: reporte,
          data_personas: personasObj
        }).select().single()
        if (error) throw error
        if (data) setCurrentSemanaId(data.id)
        toast.success('Nueva semana guardada con éxito')
      }
      cargarSemanas()
    } catch (e: any) {
      toast.error('Error al guardar semana: ' + e.message)
    } finally {
      setSemanaCargando(false)
    }
  }

  const cargarSemana = async (id: string) => {
    if (!id) return
    if (!confirm('¿Estás seguro? Si no has guardado tu avance actual, se perderá.')) return
    setSemanaCargando(true)
    try {
      const { data, error } = await supabase.from('semanas_planificadas').select('*').eq('id', id).single()
      if (error) throw error
      if (data) {
        setReporte(data.data_reporte)
        setCurrentSemanaId(data.id)
        if (data.data_personas) {
          localStorage.setItem('apoyo_personas_area', JSON.stringify(data.data_personas))
        }
        toast.success('Semana cargada exitosamente')
      }
    } catch (e: any) {
      toast.error('Error al cargar semana')
    } finally {
      setSemanaCargando(false)
    }
  }

  return (
    <div className="pb-12 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Programación Visual Pro (15 Min)</h1>
          <p className="text-sm text-slate-500">Diseño ajustado a bloques de 15 minutos exactos según el archivo original.</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="text-sm border border-slate-300 rounded-md px-3 py-2 h-10 bg-white min-w-[200px]"
            onChange={(e) => {
              if (e.target.value) cargarSemana(e.target.value)
              e.target.value = ''
            }}
            value=""
            disabled={semanaCargando}
          >
            <option value="">Cargar guardado...</option>
            {semanasGuardadas.map(s => (
              <option key={s.id} value={s.id}>{s.nombre_semana}</option>
            ))}
          </select>
          {reporte.length > 0 && (
            <Button onClick={guardarSemana} disabled={semanaCargando} variant="outline" className="border-slate-300 h-10 bg-white">
              {semanaCargando ? 'Guardando...' : (currentSemanaId ? 'Guardar Cambios' : 'Guardar Nueva Semana')}
            </Button>
          )}
        </div>
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
              <Card key={idx} id={`reporte-card-${idx}`} className="overflow-hidden shadow-sm border-slate-200">
                <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center">
                  <h3 className="font-bold">{dia.fecha}</h3>
                  <div className="flex gap-2" data-html2canvas-ignore="true">
                    <Button variant="outline" size="sm" onClick={() => exportToPDF(idx, dia.fecha)} disabled={isExporting === idx} className="h-8 text-xs bg-white text-slate-900 border-none hover:bg-slate-200">
                      <Download className="w-4 h-4 mr-1" /> {isExporting === idx ? "Exportando..." : "Exportar PDF"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => clearMultifuncionales(idx)} className="h-8 text-xs border-none" title="Limpiar todos los apoyos agregados">
                      <Eraser className="w-4 h-4 mr-1" /> Limpiar
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => autoFillGaps(idx)} className="h-8 text-xs bg-slate-700 hover:bg-slate-600 text-white border-none">
                      Cubrir Brechas (v3)
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
                              const req = t >= 22.5 ? 0 : (dia.requeridoPorHora[h] || 0)
                              const actual = progPorCuarto[t] || 0
                              const falta = req - actual
                              
                              return (
                                <div key={q} className="flex-1 border-r border-slate-200/50 flex flex-col items-center justify-start py-1 bg-white/50 last:border-r-0">
                                  <div className={`text-[11px] font-bold ${t >= 22.5 ? 'text-slate-400' : 'text-slate-800'}`}>{req}</div>
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
                                  <span className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                    {emp.isSCO ? 'Autoservicio (SCO)' : emp.rol}
                                    {emp.area && <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-medium">{emp.area}</span>}
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
                                if (isBreak) {
                                  bg = 'bg-yellow-300 border-yellow-400 z-10 shadow-sm'
                                } else if (isWorking) {
                                  const currentRole = emp.customRoles?.[t] || (emp.isSCO ? 'SCO' : 'CAJA')
                                  if (currentRole === 'SCO') bg = 'bg-purple-400 border-purple-500'
                                  else if (emp.isMultifuncional) bg = 'bg-amber-400 border-amber-500'
                                  else bg = 'bg-green-500 border-green-600'
                                }
                                
                                return (
                                  <div 
                                    key={q} 
                                    className="flex-1 border-r border-slate-100/50 p-[1px] cursor-pointer relative group last:border-r-0"
                                    onClick={() => {
                                      if (isWorking && emp.breakInicio !== undefined) moveBreak(idx, emp.id, t)
                                    }}
                                    onContextMenu={(e) => {
                                      e.preventDefault()
                                      if (isWorking && !isBreak) toggleCustomRole(idx, emp.id, t)
                                    }}
                                  >
                                    {isWorking && (
                                      <div title="Click izq: Mover break | Click der: Cambiar rol (Caja / SCO)" className={`w-full h-full min-h-[24px] rounded-sm border-t border-b ${bg} ${q === 0 || t === emp.inicio ? 'border-l rounded-l-sm' : 'border-l-0 rounded-l-none'} ${q === 0.75 || t === emp.fin - 0.25 ? 'border-r rounded-r-sm' : 'border-r-0 rounded-r-none'} flex items-center justify-center transition-all hover:opacity-80`}>
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
