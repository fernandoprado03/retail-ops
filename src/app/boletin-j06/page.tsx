'use client'

import { useState } from 'react'
import { FileSpreadsheet, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

export default function BoletinJ06Page() {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files)
      setFiles(prev => [...prev, ...selected])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      const dropped = Array.from(e.dataTransfer.files)
      setFiles(prev => [...prev, ...dropped])
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Boletín J06</h1>
              <p className="text-sm text-slate-500">
                Consolidación automatizada de reportes semanales e informes
              </p>
            </div>
          </div>
        </div>

        {/* Upload Card */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Cargar Documentos Semanales</h2>
            <p className="text-sm text-slate-500">
              Sube los archivos descargados para procesar y consolidar la información automáticamente.
            </p>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <input
              id="file-upload-input"
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-base font-medium text-slate-800">
                  Arrastra tus archivos aquí o <span className="text-emerald-600 underline">haz clic para explorar</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">Soporta archivos Excel (.xlsx, .xls) y CSV</p>
              </div>
            </div>
          </div>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Archivos seleccionados ({files.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="font-medium text-slate-700 truncate">{file.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Informational Banner */}
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 space-y-1">
            <p className="font-semibold">Módulo en configuración</p>
            <p>
              Estamos listos para implementar las reglas de lectura de tus archivos y el formato exacto de tu pestaña <strong>Consolidado</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
