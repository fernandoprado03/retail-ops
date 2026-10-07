'use client'

import { useState } from 'react'
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

export default function HorariosPro() {
  const [demandaFile, setDemandaFile] = useState<File | null>(null)
  const [mallaFile, setMallaFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDemandaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDemandaFile(e.target.files[0])
    }
  }

  const handleMallaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMallaFile(e.target.files[0])
    }
  }

  const processFiles = async () => {
    if (!demandaFile || !mallaFile) {
      toast.error('Debes subir ambos archivos para continuar.')
      return
    }

    setIsProcessing(true)
    try {
      // PROCESAR DEMANDA
      const demandaBuffer = await demandaFile.arrayBuffer()
      const workbookDemanda = XLSX.read(demandaBuffer, { type: 'array' })
      const firstSheetDemanda = workbookDemanda.Sheets[workbookDemanda.SheetNames[0]]
      const dataDemanda = XLSX.utils.sheet_to_json(firstSheetDemanda)
      console.log('Datos Demanda Raw:', dataDemanda)

      // PROCESAR MALLA
      const mallaBuffer = await mallaFile.arrayBuffer()
      const workbookMalla = XLSX.read(mallaBuffer, { type: 'array' })
      const dataMalla: Record<string, any[]> = {}
      
      // Leemos todas las pestañas (días) de la malla
      workbookMalla.SheetNames.forEach(sheetName => {
        const sheet = workbookMalla.Sheets[sheetName]
        dataMalla[sheetName] = XLSX.utils.sheet_to_json(sheet)
      })
      console.log('Datos Malla Raw:', dataMalla)

      toast.success('Archivos leídos con éxito. Revisa la consola.')
      // Aquí se implementará la lógica de comparación una vez veamos la estructura.
      
    } catch (error) {
      console.error(error)
      toast.error('Error al procesar los archivos de Excel.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Horarios Modo Pro</h1>
        <p className="text-sm text-slate-500">Optimiza la programación de cajeros (1 a 5 horas) analizando requerimientos vs malla actual.</p>
      </div>

      <div className="space-y-6">
        {/* Subida de Demanda */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" /> 
              1. Proyección Requerida (Demanda)
            </CardTitle>
            <CardDescription>Archivo Excel con la columna "Requerido" por fecha y hora.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                id="file-demanda"
                onChange={handleDemandaUpload}
              />
              <label 
                htmlFor="file-demanda" 
                className="flex-1 border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-700">
                  {demandaFile ? demandaFile.name : 'Subir archivo Requerimiento'}
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Subida de Malla */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" /> 
              2. Malla Actual (Oferta)
            </CardTitle>
            <CardDescription>Archivo Excel con las pestañas por día y la programación de los cajeros.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                id="file-malla"
                onChange={handleMallaUpload}
              />
              <label 
                htmlFor="file-malla" 
                className="flex-1 border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-700">
                  {mallaFile ? mallaFile.name : 'Subir archivo Malla'}
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={processFiles}
          disabled={!demandaFile || !mallaFile || isProcessing}
          className="w-full h-14 text-lg bg-slate-900 hover:bg-slate-800"
        >
          {isProcessing ? 'Procesando...' : 'Generar Brechas de Horarios'}
        </Button>
        
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg border border-yellow-200 text-sm flex gap-3 mt-4">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>
            <strong>Paso 1 completado:</strong> Sube los archivos en el chat para que la IA lea la estructura de las columnas y construya el algoritmo final.
          </p>
        </div>

      </div>
    </div>
  )
}
