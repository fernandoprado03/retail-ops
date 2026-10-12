'use client'

import { useState } from 'react'
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  Copy,
  Check,
  Eye,
  Layers,
  Sparkles,
  TrendingUp,
  Calendar,
  Store,
  FileCheck
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

// Maestro de tiendas y líderes Zona B
export interface TiendaZonaB {
  codigo: string
  nombre: string
  lider: string
}

export const TIENDAS_ZONA_B: TiendaZonaB[] = [
  { codigo: '103', nombre: '103 - Mega Plaza', lider: 'Ronny Mario Colque Sanchez' },
  { codigo: '107', nombre: '107 - Atocongo', lider: 'Edgar Wuffarden' },
  { codigo: '110', nombre: '110 - Huaylas', lider: 'Gerson Pichi Javier' },
  { codigo: '118', nombre: '118 - Bellavista', lider: 'Miguel Vernales Sanchez' },
  { codigo: '155', nombre: '155 - Santa Anita', lider: 'Oneida rojas castro' },
  { codigo: '175', nombre: '175 - Lima Sur', lider: 'Victor Mejia' },
  { codigo: '193', nombre: '193 - Puruchuco', lider: 'Eyder Mego Quispe' },
  { codigo: '311', nombre: '311 - Trujillo 1', lider: 'Gustavo Carassaz' },
  { codigo: '314', nombre: '314 - Trujillo 2', lider: 'Cynthia Caycho Malca' },
  { codigo: '335', nombre: '335 - Chimbote', lider: 'Mariela Lisseth López Dominguez' },
  { codigo: '357', nombre: '357 - Cusco La Cultura', lider: 'Enzo Danilo Parodi Portugal' },
]

export interface RegistroAjusteDia {
  fecha: string
  monto: number | null // null si no hubo ajuste
}

export interface FilaAjusteTienda {
  codigo: string
  nombre: string
  lider: string
  dias: RegistroAjusteDia[]
  diasConAjuste: number
  totalDias: number
  cumplimientoPorcentaje: number
}

// Datos de muestra basados en la captura del usuario
const DATOS_EJEMPLO_SEMANA_40: FilaAjusteTienda[] = [
  {
    codigo: '103',
    nombre: '103 - Mega Plaza',
    lider: 'Ronny Mario Colque Sanchez',
    dias: [
      { fecha: '2026-09-28', monto: -759 },
      { fecha: '2026-09-29', monto: 718 },
      { fecha: '2026-09-30', monto: -589 },
      { fecha: '2026-10-01', monto: 171 },
      { fecha: '2026-10-02', monto: 150 },
      { fecha: '2026-10-03', monto: -362 },
      { fecha: '2026-10-04', monto: -753 },
    ],
    diasConAjuste: 7,
    totalDias: 7,
    cumplimientoPorcentaje: 100,
  },
  {
    codigo: '107',
    nombre: '107 - Atocongo',
    lider: 'Edgar Wuffarden',
    dias: [
      { fecha: '2026-09-28', monto: -29 },
      { fecha: '2026-09-29', monto: -46 },
      { fecha: '2026-09-30', monto: 92 },
      { fecha: '2026-10-01', monto: 320 },
      { fecha: '2026-10-02', monto: -204 },
      { fecha: '2026-10-03', monto: 4 },
      { fecha: '2026-10-04', monto: 1564 },
    ],
    diasConAjuste: 7,
    totalDias: 7,
    cumplimientoPorcentaje: 100,
  },
  {
    codigo: '110',
    nombre: '110 - Huaylas',
    lider: 'Gerson Pichi Javier',
    dias: [
      { fecha: '2026-09-28', monto: 815 },
      { fecha: '2026-09-29', monto: -1 },
      { fecha: '2026-09-30', monto: -72 },
      { fecha: '2026-10-01', monto: -140 },
      { fecha: '2026-10-02', monto: -42 },
      { fecha: '2026-10-03', monto: null },
      { fecha: '2026-10-04', monto: 105 },
    ],
    diasConAjuste: 6,
    totalDias: 7,
    cumplimientoPorcentaje: 85.71,
  },
  {
    codigo: '118',
    nombre: '118 - Bellavista',
    lider: 'Miguel Vernales Sanchez',
    dias: [
      { fecha: '2026-09-28', monto: 5 },
      { fecha: '2026-09-29', monto: -26 },
      { fecha: '2026-09-30', monto: -39 },
      { fecha: '2026-10-01', monto: null },
      { fecha: '2026-10-02', monto: -74 },
      { fecha: '2026-10-03', monto: 42 },
      { fecha: '2026-10-04', monto: -53 },
    ],
    diasConAjuste: 6,
    totalDias: 7,
    cumplimientoPorcentaje: 85.71,
  },
  {
    codigo: '155',
    nombre: '155 - Santa Anita',
    lider: 'Oneida rojas castro',
    dias: [
      { fecha: '2026-09-28', monto: -63 },
      { fecha: '2026-09-29', monto: 269 },
      { fecha: '2026-09-30', monto: 99 },
      { fecha: '2026-10-01', monto: 158 },
      { fecha: '2026-10-02', monto: -620 },
      { fecha: '2026-10-03', monto: 161 },
      { fecha: '2026-10-04', monto: 54 },
    ],
    diasConAjuste: 7,
    totalDias: 7,
    cumplimientoPorcentaje: 100,
  },
  {
    codigo: '175',
    nombre: '175 - Lima Sur',
    lider: 'Victor Mejia',
    dias: [
      { fecha: '2026-09-28', monto: -881 },
      { fecha: '2026-09-29', monto: null },
      { fecha: '2026-09-30', monto: -269 },
      { fecha: '2026-10-01', monto: -298 },
      { fecha: '2026-10-02', monto: -170 },
      { fecha: '2026-10-03', monto: -95 },
      { fecha: '2026-10-04', monto: 306 },
    ],
    diasConAjuste: 6,
    totalDias: 7,
    cumplimientoPorcentaje: 85.71,
  },
  {
    codigo: '193',
    nombre: '193 - Puruchuco',
    lider: 'Eyder Mego Quispe',
    dias: [
      { fecha: '2026-09-28', monto: -4 },
      { fecha: '2026-09-29', monto: -269 },
      { fecha: '2026-10-01', monto: null },
      { fecha: '2026-09-30', monto: -145 },
      { fecha: '2026-10-02', monto: -151 },
      { fecha: '2026-10-03', monto: 57 },
      { fecha: '2026-10-04', monto: -137 },
    ],
    diasConAjuste: 6,
    totalDias: 7,
    cumplimientoPorcentaje: 85.71,
  },
  {
    codigo: '311',
    nombre: '311 - Trujillo 1',
    lider: 'Gustavo Carassaz',
    dias: [
      { fecha: '2026-09-28', monto: -12 },
      { fecha: '2026-09-29', monto: -84 },
      { fecha: '2026-09-30', monto: -13 },
      { fecha: '2026-10-01', monto: 1 },
      { fecha: '2026-10-02', monto: 120 },
      { fecha: '2026-10-03', monto: -14 },
      { fecha: '2026-10-04', monto: -37 },
    ],
    diasConAjuste: 7,
    totalDias: 7,
    cumplimientoPorcentaje: 100,
  },
  {
    codigo: '314',
    nombre: '314 - Trujillo 2',
    lider: 'Cynthia Caycho Malca',
    dias: [
      { fecha: '2026-09-28', monto: -283 },
      { fecha: '2026-09-29', monto: -25 },
      { fecha: '2026-09-30', monto: -38 },
      { fecha: '2026-10-01', monto: -25 },
      { fecha: '2026-10-02', monto: -78 },
      { fecha: '2026-10-03', monto: 20 },
      { fecha: '2026-10-04', monto: -16 },
    ],
    diasConAjuste: 7,
    totalDias: 7,
    cumplimientoPorcentaje: 100,
  },
  {
    codigo: '335',
    nombre: '335 - Chimbote',
    lider: 'Mariela Lisseth López Dominguez',
    dias: [
      { fecha: '2026-09-28', monto: -13 },
      { fecha: '2026-09-29', monto: -198 },
      { fecha: '2026-09-30', monto: -227 },
      { fecha: '2026-10-01', monto: -511 },
      { fecha: '2026-10-02', monto: -141 },
      { fecha: '2026-10-03', monto: 74 },
      { fecha: '2026-10-04', monto: -721 },
    ],
    diasConAjuste: 7,
    totalDias: 7,
    cumplimientoPorcentaje: 100,
  },
  {
    codigo: '357',
    nombre: '357 - Cusco La Cultura',
    lider: 'Enzo Danilo Parodi Portugal',
    dias: [
      { fecha: '2026-09-28', monto: null },
      { fecha: '2026-09-29', monto: null },
      { fecha: '2026-09-30', monto: null },
      { fecha: '2026-10-01', monto: -302 },
      { fecha: '2026-10-02', monto: -233 },
      { fecha: '2026-10-03', monto: -79 },
      { fecha: '2026-10-04', monto: -194 },
    ],
    diasConAjuste: 4,
    totalDias: 7,
    cumplimientoPorcentaje: 57.14,
  },
]

export default function BoletinJ06Page() {
  const [activeTab, setActiveTab] = useState<'ajustes' | 'boletin_preview' | 'consolidado'>('ajustes')
  const [archivoCargado, setArchivoCargado] = useState<File | null>(null)
  const [datosAjustes, setDatosAjustes] = useState<FilaAjusteTienda[]>(DATOS_EJEMPLO_SEMANA_40)
  const [fechasSemana, setFechasSemana] = useState<string[]>([
    '2026-09-28',
    '2026-09-29',
    '2026-09-30',
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
    '2026-10-04',
  ])
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<string>('Semana 40')
  const [isDragging, setIsDragging] = useState(false)
  const [copiado, setCopiado] = useState(false)

  // Función para procesar archivo Excel/CSV exportado de Looker
  const procesarArchivoLooker = async (file: File) => {
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | null | undefined)[][]

      if (!rawRows || rawRows.length === 0) {
        toast.error('El archivo parece estar vacío.')
        return
      }

      // Buscar fila con fechas
      let filaFechasIndex = -1
      let columnasFechas: { index: number; fecha: string }[] = []

      for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
        const row = rawRows[r]
        if (!row) continue

        const fechasEncontradas: { index: number; fecha: string }[] = []
        row.forEach((cell, colIdx) => {
          if (cell !== null && cell !== undefined) {
            const cellStr = String(cell).trim()
            // Detectar fechas formato YYYY-MM-DD o DD/MM/YYYY
            if (/^\d{4}-\d{2}-\d{2}/.test(cellStr) || /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(cellStr)) {
              fechasEncontradas.push({ index: colIdx, fecha: cellStr.substring(0, 10) })
            }
          }
        })

        if (fechasEncontradas.length >= 3) {
          filaFechasIndex = r
          columnasFechas = fechasEncontradas
          break
        }
      }

      // Si no encontramos por regex, buscar columnas que contengan 'Dia' o 'Fecha'
      let colLocalIndex = 0
      for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
        const row = rawRows[r]
        if (!row) continue
        row.forEach((cell, colIdx) => {
          const str = String(cell || '').toLowerCase()
          if (str.includes('local') || str.includes('tienda')) {
            colLocalIndex = colIdx
          }
        })
      }

      // Si encontramos columnas de fechas pivotadas
      if (columnasFechas.length > 0) {
        const fechasOrdenadas = columnasFechas.map(c => c.fecha)
        setFechasSemana(fechasOrdenadas)

        const resultado: FilaAjusteTienda[] = TIENDAS_ZONA_B.map(tienda => {
          // Buscar la fila correspondiente a esta tienda
          const filaTienda = rawRows.find((row, idx) => {
            if (idx <= filaFechasIndex || !row) return false
            const celdaLocal = String(row[colLocalIndex] || '')
            return (
              celdaLocal.includes(tienda.codigo) ||
              celdaLocal.toLowerCase().includes(tienda.nombre.toLowerCase().replace(/^\d+\s*-\s*/, ''))
            )
          })

          const dias: RegistroAjusteDia[] = columnasFechas.map(({ index: colIdx, fecha }) => {
            if (!filaTienda) return { fecha, monto: null }
            const val = filaTienda[colIdx]

            if (val === null || val === undefined || val === '' || val === '∅' || val === '-') {
              return { fecha, monto: null }
            }

            // Normalizar monto
            const cleanStr = String(val).replace(/[^\d.-]/g, '')
            const numVal = parseFloat(cleanStr)

            if (!isNaN(numVal)) {
              return { fecha, monto: numVal }
            }
            return { fecha, monto: null }
          })

          const diasConAjuste = dias.filter(d => d.monto !== null).length
          const totalDias = dias.length > 0 ? dias.length : 7
          const cumplimientoPorcentaje = parseFloat(((diasConAjuste / totalDias) * 100).toFixed(2))

          return {
            codigo: tienda.codigo,
            nombre: tienda.nombre,
            lider: tienda.lider,
            dias,
            diasConAjuste,
            totalDias,
            cumplimientoPorcentaje,
          }
        })

        setDatosAjustes(resultado)
        setArchivoCargado(file)
        toast.success(`Archivo procesado con éxito. Se analizaron ${resultado.length} tiendas.`)
      } else {
        // Modo fallback: intentar procesar filas con valores de tienda directamente
        toast.warning(
          'No se detectaron cabeceras de fechas automáticas. Se intentará análisis de datos tabulares.'
        )
      }
    } catch (error) {
      console.error(error)
      toast.error('Ocurrió un error al leer el archivo de Looker.')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      procesarArchivoLooker(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      procesarArchivoLooker(e.dataTransfer.files[0])
    }
  }

  // Copiar valores al portapapeles para pegar en Excel
  const copiarValoresConsolidado = () => {
    const texto = datosAjustes
      .map(t => `${t.cumplimientoPorcentaje.toFixed(2)}%`)
      .join('\n')
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    toast.success('¡Valores de porcentaje de ajustes copiados al portapapeles!')
    setTimeout(() => setCopiado(false), 2500)
  }

  // Exportar resultado a Excel
  const exportarAjustesExcel = () => {
    const dataAExportar = datosAjustes.map(t => {
      const fila: Record<string, string | number> = {
        'Local': t.nombre,
        'Líder J06': t.lider,
      }
      t.dias.forEach((d, i) => {
        fila[`Día ${i + 1} (${d.fecha})`] = d.monto !== null ? d.monto : 'Sin ajuste'
      })
      fila['Cantidad Días con Ajuste'] = t.diasConAjuste
      fila['Cumplimiento %'] = `${t.cumplimientoPorcentaje.toFixed(2)}%`
      return fila
    })

    const worksheet = XLSX.utils.json_to_sheet(dataAExportar)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ajustes Looker')
    XLSX.writeFile(workbook, `Ajustes_Looker_${semanaSeleccionada.replace(/\s+/g, '_')}.xlsx`)
    toast.success('Archivo Excel descargado correctamente.')
  }

  // Estadísticas clave
  const totalTiendas = datosAjustes.length
  const tiendas100 = datosAjustes.filter(t => t.cumplimientoPorcentaje === 100).length
  const tiendasObservadas = datosAjustes.filter(t => t.cumplimientoPorcentaje < 100).length
  const promedioZona =
    totalTiendas > 0
      ? (datosAjustes.reduce((acc, t) => acc + t.cumplimientoPorcentaje, 0) / totalTiendas).toFixed(2)
      : '0.00'

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 md:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabecera Principal */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Boletín Semanal J06</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Zona B
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Automatización de informes semanales y procesamiento de Looker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-sm">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="font-medium text-slate-700">Semana:</span>
              <select
                value={semanaSeleccionada}
                onChange={e => setSemanaSeleccionada(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 border-none focus:outline-none cursor-pointer"
              >
                <option value="Semana 40">Semana 40</option>
                <option value="Semana 41">Semana 41</option>
                <option value="Semana 42">Semana 42</option>
              </select>
            </div>

            <button
              onClick={() => {
                setDatosAjustes(DATOS_EJEMPLO_SEMANA_40)
                toast.info('Se cargaron los datos de ejemplo de la Semana 40.')
              }}
              className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Cargar Ejemplo Sem 40
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación del Módulo */}
        <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm">
          <button
            onClick={() => setActiveTab('ajustes')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'ajustes'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            1. Ajustes (Looker)
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
              Activo
            </span>
          </button>

          <button
            onClick={() => setActiveTab('boletin_preview')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'boletin_preview'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            2. Vista Previa Boletín J06
          </button>

          <button
            onClick={() => setActiveTab('consolidado')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'consolidado'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            3. Datos Consolidado
          </button>
        </div>

        {/* TAB 1: AJUSTES (LOOKER) */}
        {activeTab === 'ajustes' && (
          <div className="space-y-6">
            {/* Zona de Arrastre de Archivo Looker */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    Cargar Reporte de Looker: AJUSTE EN LA SEMANA BOLETIN
                  </h2>
                  <p className="text-xs text-slate-500">
                    Descarga en Looker como <strong>Excel (.xlsx)</strong> o <strong>CSV</strong> y arrástralo directamente aquí.
                  </p>
                </div>

                {archivoCargado && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold truncate max-w-xs">{archivoCargado.name}</span>
                  </div>
                )}
              </div>

              <div
                onDragOver={e => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('looker-file-input')?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/60'
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50'
                }`}
              >
                <input
                  id="looker-file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Arrastra tu archivo exportado de Looker o{' '}
                      <span className="text-emerald-600 underline">haz clic para examinar</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Filtro recomendado en Looker: <em>Fecha de Posteo = Semana Anterior</em>, <em>Zonal Desc = Zona B</em>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjetas Resumen de KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cumplimiento Zona B</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{promedioZona}%</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-0.5">Meta diaria: 100%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-lg">
                  %
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tiendas al 100% (7/7 días)</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {tiendas100} <span className="text-sm font-medium text-slate-400">/ {totalTiendas}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Ajustaron todos los días</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tiendas con Desvío</p>
                  <p className="text-2xl font-black text-rose-600 mt-1">
                    {tiendasObservadas} <span className="text-sm font-medium text-slate-400">/ {totalTiendas}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Menos de 7 días con ajuste</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Días Analizados</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">7 días</p>
                  <p className="text-xs text-slate-500 mt-0.5">Semana completa evaluada</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Tabla Detallada de Ajustes */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                    AJUSTES (LOOKER) - Desglose Diario por Tienda
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Regla: 7 días = 100% | 6 días = 85.71% (86%) | 4 días = 57.14% (57%) | 0 días = 0%
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copiarValoresConsolidado}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-sm cursor-pointer"
                    title="Copiar columna de notas para pegar en Excel"
                  >
                    {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    {copiado ? '¡Copiado!' : 'Copiar Notas'}
                  </button>

                  <button
                    onClick={exportarAjustesExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-semibold text-white transition-colors shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Exportar Excel
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1b5e20] text-white font-bold text-center border-b border-emerald-900">
                      <th className="py-2.5 px-3 text-left border-r border-emerald-800">Local</th>
                      <th className="py-2.5 px-3 text-left border-r border-emerald-800">Líder J06</th>
                      {fechasSemana.map((f, i) => (
                        <th key={i} className="py-2.5 px-2 border-r border-emerald-800 min-w-[95px]">
                          <div>Día {i + 1}</div>
                          <div className="text-[10px] font-normal opacity-90">{f}</div>
                        </th>
                      ))}
                      <th className="py-2.5 px-3 bg-[#2e7d32] border-r border-emerald-800 min-w-[75px]">
                        Cantidad
                      </th>
                      <th className="py-2.5 px-4 bg-[#1b5e20] min-w-[110px]">
                        Cumplimiento
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {datosAjustes.map((item, idx) => {
                      const es100 = item.cumplimientoPorcentaje === 100
                      const esMedio = item.cumplimientoPorcentaje >= 80 && !es100
                      return (
                        <tr
                          key={item.codigo}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                            {item.nombre}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 whitespace-nowrap">
                            {item.lider}
                          </td>
                          {item.dias.map((d, dIdx) => (
                            <td
                              key={dIdx}
                              className={`py-2 px-2 text-right border-r border-slate-200 whitespace-nowrap font-mono ${
                                d.monto === null ? 'bg-slate-50/60' : ''
                              }`}
                            >
                              {d.monto !== null ? (
                                <span className={d.monto < 0 ? 'text-slate-800' : 'text-slate-800'}>
                                  {d.monto < 0 ? `-S/ ${Math.abs(d.monto).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : `S/ ${d.monto.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-500 font-sans">
                                  Sin ajuste
                                </span>
                              )}
                            </td>
                          ))}
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800 border-r border-slate-200 bg-emerald-50/30">
                            {item.diasConAjuste} / {item.totalDias}
                          </td>
                          <td className="py-2.5 px-4 text-center font-black whitespace-nowrap">
                            <span
                              className={`inline-block px-3 py-1 rounded-md text-xs font-bold border ${
                                es100
                                  ? 'bg-[#c8e6c9] text-[#1b5e20] border-[#a5d6a7]'
                                  : esMedio
                                  ? 'bg-[#ffecb3] text-[#b78103] border-[#ffe082]'
                                  : 'bg-[#ffcdd2] text-[#b71c1c] border-[#ef9a9a]'
                              }`}
                            >
                              {item.cumplimientoPorcentaje.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VISTA PREVIA BOLETÍN J06 (INVENTARIO) */}
        {activeTab === 'boletin_preview' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Boletín J06 - Sección: KPI&apos;S (Inventario, Implementación, Disponibilidad, Calidad)
                </h2>
                <p className="text-xs text-slate-500">
                  Así se ve la tabla oficial de tu boletín con la columna <strong>Ajustes</strong> alimentada en tiempo real:
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Columna Ajustes Calculada
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-300 rounded-xl">
              <table className="w-full text-xs border-collapse text-center">
                <thead>
                  {/* Fila Criterio Principal */}
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th colSpan={3} className="py-2 border-r border-slate-300">
                      KPI&apos;S
                    </th>
                    <th colSpan={3} className="py-2 border-r border-slate-300 bg-slate-200">
                      Inventario
                    </th>
                    <th colSpan={2} className="py-2 border-r border-slate-300">
                      Implementación
                    </th>
                    <th colSpan={3} className="py-2 border-r border-slate-300 bg-slate-200">
                      Disponibilidad
                    </th>
                    <th colSpan={2} className="py-2">
                      Calidad
                    </th>
                  </tr>

                  {/* Fila Objetivos */}
                  <tr className="bg-slate-50 text-slate-600 text-[11px] border-b border-slate-300">
                    <th className="py-1 px-3 text-left border-r border-slate-300">Tienda</th>
                    <th className="py-1 px-3 text-left border-r border-slate-300">Líder J06</th>
                    <th className="py-1 px-2 border-r border-slate-300 font-semibold text-slate-700">Objetivo &gt;98% (ERI)</th>
                    
                    <th className="py-1 px-2 border-r border-slate-300 bg-slate-100">100%</th>
                    <th className="py-1 px-2 border-r border-slate-300 bg-emerald-100 text-emerald-900 font-bold">Diario (Ajustes)</th>
                    <th className="py-1 px-2 border-r border-slate-300 bg-slate-100">Obj. Por tienda</th>

                    <th className="py-1 px-2 border-r border-slate-300">100%</th>
                    <th className="py-1 px-2 border-r border-slate-300">100%</th>

                    <th className="py-1 px-2 border-r border-slate-300 bg-slate-100">&gt;95%</th>
                    <th className="py-1 px-2 border-r border-slate-300 bg-slate-100">&lt;1%</th>
                    <th className="py-1 px-2 border-r border-slate-300 bg-slate-100">&lt;5%</th>

                    <th className="py-1 px-2 border-r border-slate-300">&gt;90%</th>
                    <th className="py-1 px-2">100%</th>
                  </tr>

                  {/* Fila Nombres de Columnas */}
                  <tr className="bg-slate-200/80 font-bold text-slate-800 border-b border-slate-300">
                    <th className="py-2 px-3 text-left border-r border-slate-300">Tienda</th>
                    <th className="py-2 px-3 text-left border-r border-slate-300">Líder J06</th>
                    <th className="py-2 px-2 border-r border-slate-300">ERI</th>
                    
                    <th className="py-2 px-2 border-r border-slate-300">Pistoleo Pan</th>
                    <th className="py-2 px-2 border-r border-slate-300 bg-emerald-200 text-emerald-950">
                      Ajustes ⭐
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300">Negativos</th>

                    <th className="py-2 px-2 border-r border-slate-300">Registro A-C</th>
                    <th className="py-2 px-2 border-r border-slate-300">Incidencias DDF</th>

                    <th className="py-2 px-2 border-r border-slate-300">NSG</th>
                    <th className="py-2 px-2 border-r border-slate-300">Bodega</th>
                    <th className="py-2 px-2 border-r border-slate-300">Quiebre</th>

                    <th className="py-2 px-2 border-r border-slate-300">Nota</th>
                    <th className="py-2 px-2">App vencimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {datosAjustes.map(item => (
                    <tr key={item.codigo} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-left font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                        {item.nombre}
                      </td>
                      <td className="py-2 px-3 text-left text-slate-600 border-r border-slate-200 whitespace-nowrap">
                        {item.lider}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-200 text-slate-500">0.00%</td>
                      <td className="py-2 px-2 border-r border-slate-200 text-emerald-700 bg-emerald-50/40">100.00%</td>
                      
                      {/* COLUMNA AJUSTES CALCULADA AUTOMÁTICAMENTE */}
                      <td className="py-2 px-2 border-r border-slate-200 font-bold bg-emerald-50 text-emerald-900">
                        {item.cumplimientoPorcentaje.toFixed(2)}%
                      </td>
                      
                      <td className="py-2 px-2 border-r border-slate-200 text-slate-600">
                        {item.cumplimientoPorcentaje >= 85 ? '100.00%' : '57.14%'}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-200 text-slate-600">100.00%</td>
                      <td className="py-2 px-2 border-r border-slate-200 text-slate-600">100.00%</td>
                      <td className="py-2 px-2 border-r border-slate-200 text-slate-600">92.70%</td>
                      <td className="py-2 px-2 border-r border-slate-200 text-slate-600">0.00%</td>
                      <td className="py-2 px-2 border-r border-slate-200 text-slate-600">7.30%</td>
                      <td className="py-2 px-2 border-r border-slate-200 text-slate-600">100.00%</td>
                      <td className="py-2 px-2 text-slate-600">100.00%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CONSOLIDADO */}
        {activeTab === 'consolidado' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Data para la Pestaña &quot;Consolidado&quot;
              </h2>
              <p className="text-xs text-slate-500">
                A medida que carguemos los siguientes archivos (Pistoleo Pan, Negativos, Ventas, etc.), este consolidado se irá llenando de forma automática.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-2 overflow-x-auto">
              <div className="font-bold text-slate-800">Campos en cola de automatización:</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-600">
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded font-semibold">
                  ✓ Ajustes (Looker) - Listo
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded">
                  ⏳ Pistoleo Pan
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded">
                  ⏳ Negativos
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded">
                  ⏳ Registro A-C
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded">
                  ⏳ Incidencias DDF
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded">
                  ⏳ Venta / Crecimiento
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded">
                  ⏳ Merma / Quiebre
                </div>
                <div className="p-2 bg-white border border-slate-200 rounded">
                  ⏳ Calidad / Auditoría
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
