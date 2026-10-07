'use client'

import { useState } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ChevronRight, Calculator } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

// ----- TIPOS -----
type RequerimientoDia = Record<string, number> // { "08:00": 3, "09:00": 5 }
type ProgramacionDia = Record<string, number> // { "08:00": 2, "09:00": 5 }

interface ReporteDia {
  fecha: string
  horas: Array<{
    hora: string
    requerido: number
    programado: number
    brecha: number // requerido - programado (Positivo = Falta gente, Negativo = Sobra gente)
  }>
}

export default function HorariosPro() {
  const [demandaFile, setDemandaFile] = useState<File | null>(null)
  const [mallaFile, setMallaFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [reporte, setReporte] = useState<ReporteDia[]>([])

  const handleDemandaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setDemandaFile(e.target.files[0])
  }

  const handleMallaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setMallaFile(e.target.files[0])
  }

  const parseExcelTime = (excelFraction: number): string => {
    const totalHours = Math.round(excelFraction * 24)
    const hour = totalHours % 24
    return `${hour.toString().padStart(2, '0')}:00`
  }

  const parseDemanda = (data: any[][]) => {
    const result: Record<string, RequerimientoDia> = {}
    let currentDate = ''

    for (const row of data) {
      if (row.length === 0) continue
      
      // Buscar la fecha (ej: 'lun. 12 oct')
      if (typeof row[0] === 'string' && row[0].includes('.')) {
        currentDate = row[0].trim().toLowerCase()
        result[currentDate] = {}
      } else if (typeof row[0] === 'number' && currentDate) {
        // Es una fila de hora
        const timeStr = parseExcelTime(row[0])
        const requerido = row[3] ? Number(row[3]) : 0
        result[currentDate][timeStr] = Math.ceil(requerido)
      }
    }
    return result
  }

  const parseMalla = (workbook: XLSX.WorkBook) => {
    const result: Record<string, ProgramacionDia> = {}
    const timeRegex = /^\d{2}:\d{2}$/

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 })
      
      // Normalizar nombre de la pestaña para que cruce con demanda
      // Ej: 'lunes 5 - oct' -> 'lun. 5 oct'
      let normalizedDate = sheetName.trim().toLowerCase()
      normalizedDate = normalizedDate
        .replace('lunes', 'lun.')
        .replace('martes', 'mar.')
        .replace('miércoles', 'mié.')
        .replace('jueves', 'jue.')
        .replace('viernes', 'vie.')
        .replace('sábado', 'sáb.')
        .replace('domingo', 'dom.')
        .replace(' - ', ' ')
        
      result[normalizedDate] = {}
      // Inicializar las horas del día de 06:00 a 23:00
      for (let h = 6; h <= 23; h++) {
        result[normalizedDate][`${h.toString().padStart(2, '0')}:00`] = 0
      }

      for (const row of data) {
        if (!row || row.length === 0) continue
        
        // Verificar si es un empleado (tiene nombre en la primera celda)
        if (typeof row[0] === 'string' && row[0].trim().length > 5 && !row[0].includes('Tienda') && !row[0].includes('Seguimiento')) {
          
          // Extraer todas las horas de la fila
          const times: string[] = []
          for (const cell of row) {
            if (typeof cell === 'string' && timeRegex.test(cell.trim())) {
              times.push(cell.trim())
            }
          }

          if (times.length >= 2) {
            const startHour = parseInt(times[0].split(':')[0])
            const endHour = parseInt(times[times.length - 1].split(':')[0])
            
            let breakStartHour = -1
            let breakEndHour = -1
            
            if (times.length === 4) {
              breakStartHour = parseInt(times[1].split(':')[0])
              breakEndHour = parseInt(times[2].split(':')[0])
            }

            for (let h = startHour; h < endHour; h++) {
              // Si es hora de break, no suma
              if (h >= breakStartHour && h < breakEndHour) continue
              
              const timeStr = `${h.toString().padStart(2, '0')}:00`
              if (result[normalizedDate][timeStr] !== undefined) {
                result[normalizedDate][timeStr] += 1
              }
            }
          }
        }
      }
    }
    return result
  }

  const processFiles = async () => {
    if (!demandaFile || !mallaFile) {
      toast.error('Debes subir ambos archivos para continuar.')
      return
    }

    setIsProcessing(true)
    try {
      // 1. LEER DEMANDA
      const demandaBuffer = await demandaFile.arrayBuffer()
      const workbookDemanda = XLSX.read(demandaBuffer, { type: 'array' })
      const dataDemanda = XLSX.utils.sheet_to_json<any[]>(workbookDemanda.Sheets[workbookDemanda.SheetNames[0]], { header: 1 })
      const demandaParseada = parseDemanda(dataDemanda)

      // 2. LEER MALLA
      const mallaBuffer = await mallaFile.arrayBuffer()
      const workbookMalla = XLSX.read(mallaBuffer, { type: 'array' })
      const mallaParseada = parseMalla(workbookMalla)

      // 3. CRUZAR DATOS Y GENERAR REPORTE
      const reportesGenerados: ReporteDia[] = []

      for (const [fecha, horasRequeridas] of Object.entries(demandaParseada)) {
        // Encontrar la fecha correspondiente en la malla (puede haber variaciones mínimas de espacios)
        const fechaMalla = Object.keys(mallaParseada).find(f => f.includes(fecha) || fecha.includes(f))
        
        if (fechaMalla) {
          const programacion = mallaParseada[fechaMalla]
          const detalleHoras = []

          // Solo evaluar desde las 08:00 hasta las 22:00
          for (let h = 8; h <= 22; h++) {
            const timeStr = `${h.toString().padStart(2, '0')}:00`
            const requerido = horasRequeridas[timeStr] || 0
            const programado = programacion[timeStr] || 0
            
            detalleHoras.push({
              hora: timeStr,
              requerido,
              programado,
              brecha: requerido - programado
            })
          }

          reportesGenerados.push({
            fecha: fechaMalla.toUpperCase(),
            horas: detalleHoras
          })
        }
      }

      setReporte(reportesGenerados)
      toast.success('¡Análisis completado en tiempo récord!')
      
    } catch (error) {
      console.error(error)
      toast.error('Ocurrió un error leyendo los archivos. Asegúrate de usar los formatos correctos.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Horarios Modo Pro</h1>
        <p className="text-sm text-slate-500">Optimiza la programación de cajeros analizando el requerimiento vs la malla real.</p>
      </div>

      {reporte.length === 0 ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" /> 
                1. Requerimiento (Proyección)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <input type="file" accept=".xlsx, .xls" className="hidden" id="file-demanda" onChange={handleDemandaUpload} />
                <label htmlFor="file-demanda" className={`flex-1 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${demandaFile ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                  {demandaFile ? <CheckCircle2 className="w-8 h-8 text-blue-500 mb-2" /> : <Upload className="w-8 h-8 text-slate-400 mb-2" />}
                  <span className="text-sm font-medium text-slate-700 text-center">
                    {demandaFile ? demandaFile.name : 'Subir REQUERIMIENTO CAJEROS.xlsx'}
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-600" /> 
                2. Malla (Programación Actual)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <input type="file" accept=".xlsx, .xls" className="hidden" id="file-malla" onChange={handleMallaUpload} />
                <label htmlFor="file-malla" className={`flex-1 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${mallaFile ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:bg-slate-50'}`}>
                  {mallaFile ? <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" /> : <Upload className="w-8 h-8 text-slate-400 mb-2" />}
                  <span className="text-sm font-medium text-slate-700 text-center">
                    {mallaFile ? mallaFile.name : 'Subir MALLA DEL...xlsx'}
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={processFiles}
            disabled={!demandaFile || !mallaFile || isProcessing}
            className="w-full h-14 text-lg bg-slate-900 hover:bg-slate-800 shadow-lg relative overflow-hidden group"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2"><Calculator className="animate-spin" /> Procesando Excel...</span>
            ) : (
              <span className="flex items-center gap-2">Analizar Brechas <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Resultados del Análisis</h2>
            <Button variant="outline" size="sm" onClick={() => setReporte([])}>
              Analizar otros archivos
            </Button>
          </div>

          {reporte.map((dia, index) => (
            <Card key={index} className="border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-3">
                <h3 className="font-bold text-slate-800 capitalize">{dia.fecha}</h3>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50/50 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Hora</th>
                      <th className="px-4 py-3 font-semibold text-center">Requerido</th>
                      <th className="px-4 py-3 font-semibold text-center">Programado</th>
                      <th className="px-4 py-3 font-semibold text-center">Brecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dia.horas.map((h, i) => {
                      const isFalta = h.brecha > 0
                      const isSobra = h.brecha < 0
                      const isPerfecto = h.brecha === 0

                      return (
                        <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-700">{h.hora}</td>
                          <td className="px-4 py-3 text-center font-medium text-slate-600">{h.requerido}</td>
                          <td className="px-4 py-3 text-center font-medium text-slate-600">{h.programado}</td>
                          <td className="px-4 py-3 text-center">
                            {isFalta && (
                              <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 border border-red-200 shadow-sm">
                                Faltan {h.brecha}
                              </span>
                            )}
                            {isSobra && (
                              <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">
                                Sobran {Math.abs(h.brecha)}
                              </span>
                            )}
                            {isPerfecto && (
                              <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 border border-green-200 shadow-sm">
                                Cubierto
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
