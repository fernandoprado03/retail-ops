'use client'

import { useState } from 'react'
import { Upload, FileSpreadsheet, Calculator, Users, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

// ----- TIPOS -----
interface TurnoEmpleado {
  nombre: string
  rol: string
  inicio: number
  fin: number
  breakInicio?: number
  breakFin?: number
}

interface ReporteDia {
  fecha: string
  requeridoPorHora: Record<number, number>
  programadoPorHora: Record<number, number>
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
      // 1. LEER DEMANDA
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

      // 2. LEER MALLA
      const mallaBuffer = await mallaFile.arrayBuffer()
      const wbMalla = XLSX.read(mallaBuffer, { type: 'array' })
      
      const reportes: ReporteDia[] = []
      const timeRegex = /^\d{2}:\d{2}$/

      for (const [fechaDemanda, requeridoMap] of Object.entries(demandaMap)) {
        // Encontrar pestaña de malla
        const sheetName = wbMalla.SheetNames.find(s => {
          const norm = s.toLowerCase().replace('lunes', 'lun.').replace('martes', 'mar.').replace('miércoles', 'mié.').replace('jueves', 'jue.').replace('viernes', 'vie.').replace('sábado', 'sáb.').replace('domingo', 'dom.')
          return norm.includes(fechaDemanda.split(' ')[0]) && norm.includes(fechaDemanda.split(' ')[2])
        })

        if (!sheetName) continue

        const sheet = wbMalla.Sheets[sheetName]
        const dataMalla = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 })
        
        const empleados: TurnoEmpleado[] = []
        const programadoPorHora: Record<number, number> = {}
        HORAS_MOSTRAR.forEach(h => programadoPorHora[h] = 0)

        for (const row of dataMalla) {
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
                nombre: row[0].trim(),
                rol: typeof row[2] === 'string' ? row[2] : 'Cajero',
                inicio: startHour,
                fin: endHour,
                breakInicio: breakStartHour,
                breakFin: breakEndHour
              })

              for (let h = startHour; h < endHour; h++) {
                if (breakStartHour && breakEndHour && h >= breakStartHour && h < breakEndHour) continue
                if (programadoPorHora[h] !== undefined) programadoPorHora[h] += 1
              }
            }
          }
        }

        reportes.push({
          fecha: fechaDemanda.toUpperCase(),
          requeridoPorHora: requeridoMap,
          programadoPorHora,
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

  return (
    <div className="pb-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Programación Visual Pro</h1>
        <p className="text-sm text-slate-500">Visualiza la cobertura de personal frente a la demanda por horas.</p>
      </div>

      {reporte.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Requerimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <input type="file" accept=".xlsx" onChange={e => setDemandaFile(e.target.files?.[0] || null)} className="w-full text-sm" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Malla Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <input type="file" accept=".xlsx" onChange={e => setMallaFile(e.target.files?.[0] || null)} className="w-full text-sm" />
            </CardContent>
          </Card>
          <Button onClick={processFiles} disabled={isProcessing || !demandaFile || !mallaFile} className="md:col-span-2">
            {isProcessing ? 'Procesando...' : 'Analizar Visualmente'}
          </Button>
        </div>
      ) : (
        <div className="space-y-12 animate-in fade-in duration-500">
          <Button variant="outline" onClick={() => setReporte([])}>Volver a subir</Button>
          
          {reporte.map((dia, idx) => (
            <Card key={idx} className="overflow-hidden shadow-sm border-slate-200">
              <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center">
                <h3 className="font-bold">{dia.fecha}</h3>
              </div>
              
              <div className="p-0 overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* HEADER DE HORAS */}
                  <div className="flex bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <div className="w-48 shrink-0 p-3 border-r border-slate-200">Personal / Horas</div>
                    {HORAS_MOSTRAR.map(h => (
                      <div key={h} className="flex-1 text-center py-3 border-r border-slate-200 last:border-0">{h}:00</div>
                    ))}
                  </div>

                  {/* MATRIZ DE REQUERIMIENTOS Y BRECHA */}
                  <div className="flex border-b-2 border-slate-300 bg-blue-50/50">
                    <div className="w-48 shrink-0 p-3 border-r border-slate-200 flex flex-col justify-center">
                      <span className="text-xs font-bold text-slate-700">Demanda (Req)</span>
                      <span className="text-[10px] font-medium text-slate-500">Vs Programado</span>
                    </div>
                    {HORAS_MOSTRAR.map(h => {
                      const req = dia.requeridoPorHora[h] || 0
                      const prog = dia.programadoPorHora[h] || 0
                      const falta = req - prog
                      
                      return (
                        <div key={h} className="flex-1 border-r border-slate-200 flex flex-col items-center justify-center p-1">
                          <div className="text-sm font-bold text-slate-800">{req}</div>
                          {falta > 0 && (
                            <div className="mt-1 bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                              Faltan {falta}
                            </div>
                          )}
                          {falta < 0 && (
                            <div className="mt-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Sobran {Math.abs(falta)}
                            </div>
                          )}
                          {falta === 0 && req > 0 && (
                            <div className="mt-1 bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              OK
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* EMPLEADOS PROGRAMADOS (GANTT CHART) */}
                  <div className="divide-y divide-slate-100 bg-white">
                    {dia.empleados.map((emp, i) => (
                      <div key={i} className="flex hover:bg-slate-50 transition-colors">
                        <div className="w-48 shrink-0 p-2 border-r border-slate-200 flex flex-col justify-center">
                          <span className="text-xs font-bold text-slate-800 truncate" title={emp.nombre}>{emp.nombre}</span>
                          <span className="text-[10px] text-slate-500 truncate">{emp.rol}</span>
                        </div>
                        {HORAS_MOSTRAR.map(h => {
                          const isWorking = h >= emp.inicio && h < emp.fin
                          const isBreak = emp.breakInicio && emp.breakFin && h >= emp.breakInicio && h < emp.breakFin
                          
                          let bg = ''
                          if (isBreak) bg = 'bg-yellow-200/50 border-yellow-300'
                          else if (isWorking) bg = 'bg-green-500 border-green-600 shadow-sm'
                          
                          return (
                            <div key={h} className={`flex-1 border-r border-slate-100 p-1`}>
                              {isWorking && (
                                <div className={`w-full h-full min-h-[24px] rounded-sm border ${bg} flex items-center justify-center`}>
                                  {isBreak && <span className="text-[10px] font-medium text-yellow-800">BRK</span>}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                    {dia.empleados.length === 0 && (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        No se encontró personal programado para esta fecha en la malla.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
