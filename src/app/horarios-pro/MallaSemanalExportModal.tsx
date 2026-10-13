'use client'

import { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  X,
  User,
  Calendar,
  Building2,
  Clock,
  Sparkles,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  agruparMallaPorCajero,
  exportarMallaSemanalExcel,
  formatTime,
  CajeroSemanal
} from '@/lib/mallaSemanalExport'

interface MallaSemanalExportModalProps {
  isOpen: boolean
  onClose: () => void
  reporte: any[]
}

const HORAS_DISPLAY = Array.from({ length: 18 }, (_, i) => i + 6) // 06:00 a 23:00

export default function MallaSemanalExportModal({
  isOpen,
  onClose,
  reporte
}: MallaSemanalExportModalProps) {
  const [semanaOffset, setSemanaOffset] = useState<number>(0)
  const [busqueda, setBusqueda] = useState<string>('')
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false)

  // Determinar cuántas semanas hay disponibles si reporte tiene más de 7 días
  const totalSemanas = useMemo(() => {
    const totalDias = reporte && reporte.length > 0 ? reporte.length : 7
    return Math.max(1, Math.ceil(totalDias / 7))
  }, [reporte])

  // Datos agrupados por cajero para la semana seleccionada
  const semanaData = useMemo(() => {
    return agruparMallaPorCajero(reporte, semanaOffset)
  }, [reporte, semanaOffset])

  // Filtrado de cajeros por búsqueda
  const cajerosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return semanaData.cajeros
    const q = busqueda.toLowerCase().trim()
    return semanaData.cajeros.filter(
      c => c.nombre.toLowerCase().includes(q) || c.codigo.includes(q)
    )
  }, [semanaData.cajeros, busqueda])

  const handleDescargarExcel = async () => {
    try {
      setIsExportingExcel(true)
      toast.info('Generando archivo Excel con barras y formato visual...')
      await exportarMallaSemanalExcel(semanaData)
      toast.success('¡Excel de Malla Semanal descargado exitosamente!')
    } catch (err) {
      console.error(err)
      toast.error('Ocurrió un error al generar el archivo Excel')
    } finally {
      setIsExportingExcel(false)
    }
  }

  const handleImprimir = () => {
    window.print()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:max-h-none print:border-none print:shadow-none">
        
        {/* HEADER MODAL (Se oculta al imprimir) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Malla Semanal de Cajeros</h2>
                <Badge className="bg-emerald-600/30 text-emerald-300 border-emerald-500/40 text-xs">
                  {semanaData.cajeros.length} Cajeros
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                {semanaData.tituloSemana} — Visualización oficial con barras de turno y refrigerio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Selector de semana si hay más de 1 semana */}
            {totalSemanas > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-xs text-slate-300">
                <span>Semana:</span>
                <select
                  value={semanaOffset}
                  onChange={e => setSemanaOffset(Number(e.target.value))}
                  className="bg-slate-900 text-white rounded px-2 py-0.5 border border-slate-600 text-xs focus:outline-none"
                >
                  {Array.from({ length: totalSemanas }, (_, i) => (
                    <option key={i} value={i}>
                      Semana {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botón Descargar Excel */}
            <Button
              onClick={handleDescargarExcel}
              disabled={isExportingExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-9 shadow-sm gap-1.5"
            >
              <Download className="w-4 h-4" />
              {isExportingExcel ? 'Generando Excel...' : 'Descargar Excel (.xlsx)'}
            </Button>

            {/* Botón Imprimir / PDF */}
            <Button
              variant="outline"
              onClick={handleImprimir}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs h-9 gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </Button>

            {/* Cerrar */}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BARRA DE FILTRO Y BÚSQUEDA (Se oculta al imprimir) */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between gap-4 print:hidden shrink-0">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por colaborador o DNI..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none placeholder:text-slate-400 text-slate-800"
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#0070c0]"></span>
              <span>701 Cajas Lineal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#c55a11]"></span>
              <span>713 Cajas SelfCheckout</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-black"></span>
              <span className="font-semibold text-slate-700">Refrigerio</span>
            </div>
          </div>
        </div>

        {/* CUERPO CON LAS GRILLAS DE CAJEROS (Scrollable en pantalla, limpia para imprimir) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 bg-slate-100/60 print:bg-white print:p-0 print:space-y-6">
          
          {/* TÍTULO OFICIAL EN MODO IMPRESIÓN */}
          <div className="hidden print:block text-center mb-4">
            <h1 className="text-base font-bold text-slate-900">{semanaData.tituloSemana}</h1>
          </div>

          {cajerosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No se encontraron cajeros con el filtro ingresado.
            </div>
          ) : (
            cajerosFiltrados.map((cajero, cIdx) => (
              <div
                key={cIdx}
                className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden print:shadow-none print:border print:border-slate-400 print:break-inside-avoid print:mb-6"
              >
                {/* 1. ENCABEZADO DEL TRABAJADOR */}
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-700 gap-y-1">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <span className="font-semibold text-slate-500 mr-1.5">Trabajador:</span>
                      <strong className="text-slate-900 text-sm font-bold">{cajero.nombre}</strong>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500 mr-1">Código:</span>
                      <strong className="text-slate-900 font-mono">{cajero.codigo}</strong>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500 mr-1">Contrato:</span>
                      <strong className="text-slate-900">{cajero.contrato}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <span className="font-semibold text-slate-500 mr-1">Tienda:</span>
                      <strong className="text-slate-900">{cajero.tienda}</strong>
                    </div>
                    <div>
                      <strong className="text-slate-900 font-medium">{cajero.unidadTrabajo}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. GRILLA HORARIA TIPO GANTT */}
                <div className="overflow-x-auto">
                  <div className="min-w-[950px] text-[11px]">
                    
                    {/* Fila de horas superior (06:00 a 24:00) */}
                    <div className="flex border-b border-slate-300 bg-slate-100/90 text-slate-600 font-semibold text-[10px] select-none">
                      <div className="w-20 shrink-0 px-2 py-1.5 border-r border-slate-300">Día</div>
                      <div className="w-24 shrink-0 px-2 py-1.5 border-r border-slate-300 text-center">Fecha</div>
                      <div className="flex-1 flex">
                        {HORAS_DISPLAY.map(h => (
                          <div
                            key={h}
                            className="flex-1 text-center py-1.5 border-r border-slate-300 font-mono text-[10px]"
                          >
                            {h.toString().padStart(2, '0')}:00
                          </div>
                        ))}
                        <div className="w-8 shrink-0 text-center py-1.5 font-mono text-[10px]">24:00</div>
                      </div>
                    </div>

                    {/* Filas de los 7 días */}
                    {cajero.dias.map((dia, dIdx) => {
                      const totalMinutosDia = (24 - 6) * 60 // de 06:00 a 24:00 = 1080 min

                      // Calcular posiciones en porcentaje para la barra visual
                      let shiftLeftPct = 0
                      let shiftWidthPct = 0
                      let breakLeftPct = 0
                      let breakWidthPct = 0
                      let hasBreak = false

                      if (!dia.isLibre && dia.inicio !== undefined && dia.fin !== undefined) {
                        const startMin = Math.max(0, (dia.inicio - 6) * 60)
                        const endMin = Math.min(totalMinutosDia, (dia.fin - 6) * 60)
                        shiftLeftPct = (startMin / totalMinutosDia) * 100
                        shiftWidthPct = Math.max(0, ((endMin - startMin) / totalMinutosDia) * 100)

                        if (dia.breakInicio !== undefined && dia.breakFin !== undefined) {
                          hasBreak = true
                          const bStartMin = Math.max(startMin, (dia.breakInicio - 6) * 60)
                          const bEndMin = Math.min(endMin, (dia.breakFin - 6) * 60)
                          breakLeftPct = ((bStartMin - startMin) / (endMin - startMin)) * 100
                          breakWidthPct = Math.max(0, ((bEndMin - bStartMin) / (endMin - startMin)) * 100)
                        }
                      }

                      const barBgColor = dia.isSCO ? '#c55a11' : '#0070c0'

                      return (
                        <div
                          key={dIdx}
                          className="flex border-b border-slate-200 h-9 items-center hover:bg-slate-50/50 transition-colors"
                        >
                          {/* Columna Día */}
                          <div className="w-20 shrink-0 px-2 capitalize font-medium text-slate-800 border-r border-slate-200 h-full flex items-center">
                            {dia.diaNombre}
                          </div>
                          {/* Columna Fecha */}
                          <div className="w-24 shrink-0 px-2 font-mono text-slate-600 text-center border-r border-slate-200 h-full flex items-center justify-center">
                            {dia.fechaStr}
                          </div>

                          {/* Línea de tiempo Gantt */}
                          <div className="flex-1 h-full relative flex items-center bg-slate-50/30">
                            
                            {/* Cuadrícula de fondo para cada hora */}
                            <div className="absolute inset-0 flex pointer-events-none">
                              {HORAS_DISPLAY.map(h => (
                                <div key={h} className="flex-1 border-r border-slate-200/60 h-full"></div>
                              ))}
                              <div className="w-8 shrink-0 h-full"></div>
                            </div>

                            {/* Si tiene turno: renderizar la barra del turno */}
                            {!dia.isLibre && dia.inicio !== undefined && dia.fin !== undefined ? (
                              <div
                                className="absolute h-6 rounded-sm flex items-center text-white overflow-hidden shadow-xs z-10 transition-all select-none"
                                style={{
                                  left: `${shiftLeftPct}%`,
                                  width: `${shiftWidthPct}%`,
                                  backgroundColor: barBgColor
                                }}
                              >
                                {hasBreak ? (
                                  <>
                                    {/* Segmento 1: Antes del refrigerio */}
                                    <div
                                      className="h-full flex items-center justify-between px-2 text-[10px] font-bold overflow-hidden whitespace-nowrap"
                                      style={{ width: `${breakLeftPct}%` }}
                                    >
                                      <span>{formatTime(dia.inicio)}</span>
                                      <span className="truncate mx-1 font-semibold">{dia.actividad}</span>
                                    </div>

                                    {/* Segmento 2: Refrigerio (Barra Negra con texto blanco) */}
                                    <div
                                      className="h-full bg-black text-white flex items-center justify-center px-1 font-bold text-[9px] shrink-0 border-x border-slate-900 shadow-inner"
                                      style={{ width: `${breakWidthPct}%` }}
                                      title={`Refrigerio: ${formatTime(dia.breakInicio)} a ${formatTime(dia.breakFin)}`}
                                    >
                                      Refrigerio
                                    </div>

                                    {/* Segmento 3: Después del refrigerio */}
                                    <div
                                      className="h-full flex items-center justify-end px-2 text-[10px] font-bold overflow-hidden whitespace-nowrap flex-1"
                                    >
                                      <span>{formatTime(dia.fin)}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-between px-2 text-[10px] font-bold">
                                    <span>{formatTime(dia.inicio)}</span>
                                    <span className="truncate mx-1">{dia.actividad}</span>
                                    <span>{formatTime(dia.fin)}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full text-center text-slate-300 text-[10px] italic">
                                LIBRE
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 3. PIE DE FIRMAS DEL TRABAJADOR */}
                <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-4">
                  <div className="flex items-center gap-12 flex-wrap">
                    <div className="text-center">
                      <div className="w-40 border-b border-slate-400 mb-1"></div>
                      <span className="text-[11px] font-medium text-slate-500">Firma jefe</span>
                    </div>
                    <div className="text-center">
                      <div className="w-40 border-b border-slate-400 mb-1"></div>
                      <span className="text-[11px] font-medium text-slate-500">Firma trabajador</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="text-[11px]">Fecha de generación:</span>
                    <strong className="font-mono text-slate-800">
                      {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER DEL MODAL (Se oculta al imprimir) */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500 print:hidden shrink-0">
          <span>
            Mostrando {cajerosFiltrados.length} de {semanaData.cajeros.length} colaboradores
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
              Cerrar
            </Button>
            <Button
              size="sm"
              onClick={handleDescargarExcel}
              disabled={isExportingExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-8 gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar Excel
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
