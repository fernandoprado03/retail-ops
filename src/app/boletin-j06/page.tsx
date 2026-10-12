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
  TrendingDown,
  Calendar,
  Store,
  FileCheck,
  Edit3,
  Sliders
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

// Cuotas predeterminadas de Negativos por tienda (Soles negativos)
export const CUOTAS_NEGATIVOS_DEFAULT: Record<string, number> = {
  '103': -750,
  '107': -400,
  '110': -400,
  '118': -250,
  '155': -250,
  '175': -500,
  '193': -400,
  '311': -500,
  '314': -250,
  '335': -100,
  '357': -250,
}

// Interfaces Ajustes
export interface RegistroAjusteDia {
  fecha: string
  monto: number | null
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

// Interfaces Negativos
export interface RegistroNegativoDia {
  fecha: string
  monto: number | null
  cumple: boolean
}

export interface FilaNegativoTienda {
  codigo: string
  nombre: string
  lider: string
  cuota: number
  dias: RegistroNegativoDia[]
  diasCumplidos: number
  totalDias: number
  cumplimientoPorcentaje: number
}

// Función auxiliar para parsear montos de Looker (soporta notación miles con punto ej -2.009 y decimales)
function parseMontoLooker(val: unknown): number | null {
  if (val === null || val === undefined || val === '' || val === '∅' || val === '-') return null
  let str = String(val).trim()
  str = str.replace(/[S\/$\s]/g, '')
  // Caso de miles en español: -2.009 -> -2009
  if (/^-?\d{1,3}\.\d{3}$/.test(str)) {
    str = str.replace('.', '')
  } else {
    str = str.replace(',', '.')
  }
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

// Datos de muestra Semana 40 - Ajustes
const DATOS_EJEMPLO_AJUSTES_SEM_40: FilaAjusteTienda[] = [
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

// Datos de muestra Semana 40 - Negativos (basado en la captura real del usuario)
function generarDatosEjemploNegativos(cuotas: Record<string, number>): FilaNegativoTienda[] {
  const montosPorTienda: Record<string, number[]> = {
    '103': [-527, -771, -944, -1748, -1572, -714, -444],
    '107': [-97, -130, -51, -225, -8, -97, -236],
    '110': [-144, -459, -156, -395, -156, -325, -510],
    '118': [-55, -47, -65, -194, -63, -113, -161],
    '155': [-83, -295, -324, -187, -25, -242, -176],
    '175': [-280, -200, -296, -336, -124, -27, -140],
    '193': [-434, -171, -59, -147, -224, -137, -221],
    '311': [-453, -1431, -1407, -240, -364, -328, -606],
    '314': [-42, -90, -96, -79, -158, -57, -84],
    '335': [-213, -228, -486, -113, -154, -721, -123],
    '357': [-253, -311, -363, -236, -89, -184, -105],
  }

  const fechas = [
    '2026-09-28',
    '2026-09-29',
    '2026-09-30',
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
    '2026-10-04',
  ]

  return TIENDAS_ZONA_B.map(t => {
    const cuota = cuotas[t.codigo] ?? -250
    const montos = montosPorTienda[t.codigo] || [0, 0, 0, 0, 0, 0, 0]

    const dias: RegistroNegativoDia[] = fechas.map((fecha, idx) => {
      const monto = montos[idx] ?? null
      // Regla: si el monto es null o >= 0, no generó negativo => cumple (true).
      // Si el monto es negativo, cumple si monto >= cuota (ej -527 >= -750 es true; -771 >= -750 es false).
      const cumple = monto === null || monto >= cuota
      return { fecha, monto, cumple }
    })

    const diasCumplidos = dias.filter(d => d.cumple).length
    const totalDias = dias.length
    const cumplimientoPorcentaje = parseFloat(((diasCumplidos / totalDias) * 100).toFixed(2))

    return {
      codigo: t.codigo,
      nombre: t.nombre,
      lider: t.lider,
      cuota,
      dias,
      diasCumplidos,
      totalDias,
      cumplimientoPorcentaje,
    }
  })
}

export default function BoletinJ06Page() {
  const [activeTab, setActiveTab] = useState<'ajustes' | 'negativos' | 'boletin_preview' | 'consolidado'>('negativos')
  
  // Estado Ajustes
  const [archivoAjustes, setArchivoAjustes] = useState<File | null>(null)
  const [datosAjustes, setDatosAjustes] = useState<FilaAjusteTienda[]>(DATOS_EJEMPLO_AJUSTES_SEM_40)
  const [fechasAjustes, setFechasAjustes] = useState<string[]>([
    '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04',
  ])

  // Estado Negativos
  const [cuotasNegativos, setCuotasNegativos] = useState<Record<string, number>>(CUOTAS_NEGATIVOS_DEFAULT)
  const [archivoNegativos, setArchivoNegativos] = useState<File | null>(null)
  const [datosNegativos, setDatosNegativos] = useState<FilaNegativoTienda[]>(() =>
    generarDatosEjemploNegativos(CUOTAS_NEGATIVOS_DEFAULT)
  )
  const [fechasNegativos, setFechasNegativos] = useState<string[]>([
    '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04',
  ])

  const [semanaSeleccionada, setSemanaSeleccionada] = useState<string>('Semana 40')
  const [isDraggingAjustes, setIsDraggingAjustes] = useState(false)
  const [isDraggingNegativos, setIsDraggingNegativos] = useState(false)
  const [copiadoAjustes, setCopiadoAjustes] = useState(false)
  const [copiadoNegativos, setCopiadoNegativos] = useState(false)

  // Recalcular cumplimiento de negativos cuando se cambie alguna cuota
  const actualizarCuotaTienda = (codigo: string, nuevaCuota: number) => {
    const updatedCuotas = { ...cuotasNegativos, [codigo]: nuevaCuota }
    setCuotasNegativos(updatedCuotas)

    setDatosNegativos(prev =>
      prev.map(t => {
        if (t.codigo !== codigo) return t
        const cuota = nuevaCuota
        const dias = t.dias.map(d => ({
          ...d,
          cumple: d.monto === null || d.monto >= cuota,
        }))
        const diasCumplidos = dias.filter(d => d.cumple).length
        const totalDias = dias.length
        const cumplimientoPorcentaje = parseFloat(((diasCumplidos / totalDias) * 100).toFixed(2))

        return {
          ...t,
          cuota,
          dias,
          diasCumplidos,
          totalDias,
          cumplimientoPorcentaje,
        }
      })
    )
    toast.success(`Cuota de tienda ${codigo} actualizada a S/ ${nuevaCuota}`)
  }

  // Procesar archivo Excel/CSV de Ajustes Looker
  const procesarArchivoAjustes = async (file: File) => {
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | null | undefined)[][]

      if (!rawRows || rawRows.length === 0) {
        toast.error('El archivo de ajustes está vacío.')
        return
      }

      let filaFechasIndex = -1
      let columnasFechas: { index: number; fecha: string }[] = []

      for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
        const row = rawRows[r]
        if (!row) continue
        const fechasEncontradas: { index: number; fecha: string }[] = []
        row.forEach((cell, colIdx) => {
          if (cell !== null && cell !== undefined) {
            const cellStr = String(cell).trim()
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

      let colLocalIndex = 0
      for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
        const row = rawRows[r]
        if (!row) continue
        row.forEach((cell, colIdx) => {
          const str = String(cell || '').toLowerCase()
          if (str.includes('local') || str.includes('tienda')) colLocalIndex = colIdx
        })
      }

      if (columnasFechas.length > 0) {
        setFechasAjustes(columnasFechas.map(c => c.fecha))
        const resultado: FilaAjusteTienda[] = TIENDAS_ZONA_B.map(tienda => {
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
            const numVal = parseMontoLooker(val)
            return { fecha, monto: numVal }
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
        setArchivoAjustes(file)
        toast.success(`Ajustes procesados con éxito (${resultado.length} tiendas).`)
      } else {
        toast.warning('No se detectaron cabeceras de fechas en el archivo de Ajustes.')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al procesar el archivo de Ajustes.')
    }
  }

  // Procesar archivo Excel/CSV de Negativos Looker
  const procesarArchivoNegativos = async (file: File) => {
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | null | undefined)[][]

      if (!rawRows || rawRows.length === 0) {
        toast.error('El archivo de negativos está vacío.')
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

      // Buscar columna de Local
      let colLocalIndex = 0
      for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
        const row = rawRows[r]
        if (!row) continue
        row.forEach((cell, colIdx) => {
          const str = String(cell || '').toLowerCase()
          if (str.includes('local') || str.includes('tienda') || str.includes('organizaci')) {
            colLocalIndex = colIdx
          }
        })
      }

      if (columnasFechas.length > 0) {
        const fechasDetectadas = columnasFechas.map(c => c.fecha)
        setFechasNegativos(fechasDetectadas)

        const resultado: FilaNegativoTienda[] = TIENDAS_ZONA_B.map(tienda => {
          const cuota = cuotasNegativos[tienda.codigo] ?? -250

          const filaTienda = rawRows.find((row, idx) => {
            if (idx <= filaFechasIndex || !row) return false
            const celdaLocal = String(row[colLocalIndex] || '')
            return (
              celdaLocal.includes(tienda.codigo) ||
              celdaLocal.toLowerCase().includes(tienda.nombre.toLowerCase().replace(/^\d+\s*-\s*/, ''))
            )
          })

          const dias: RegistroNegativoDia[] = columnasFechas.map(({ index: colIdx, fecha }) => {
            if (!filaTienda) {
              // Sin registro de negativo = dentro de cuota (0 negativo)
              return { fecha, monto: null, cumple: true }
            }
            const val = filaTienda[colIdx]
            const monto = parseMontoLooker(val)
            // Regla: si no hay monto o monto >= 0, cumple. Si es negativo, cumple si monto >= cuota (ej -527 >= -750 es true)
            const cumple = monto === null || monto >= cuota
            return { fecha, monto, cumple }
          })

          const diasCumplidos = dias.filter(d => d.cumple).length
          const totalDias = dias.length > 0 ? dias.length : 7
          const cumplimientoPorcentaje = parseFloat(((diasCumplidos / totalDias) * 100).toFixed(2))

          return {
            codigo: tienda.codigo,
            nombre: tienda.nombre,
            lider: tienda.lider,
            cuota,
            dias,
            diasCumplidos,
            totalDias,
            cumplimientoPorcentaje,
          }
        })

        setDatosNegativos(resultado)
        setArchivoNegativos(file)
        toast.success(`Negativos procesados con éxito (${resultado.length} tiendas).`)
      } else {
        toast.warning('No se detectaron cabeceras de fechas en el archivo de Negativos.')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error al procesar el archivo de Negativos.')
    }
  }

  // Copiar notas de Negativos
  const copiarNotasNegativos = () => {
    const texto = datosNegativos
      .map(t => `${t.cumplimientoPorcentaje.toFixed(2)}%`)
      .join('\n')
    navigator.clipboard.writeText(texto)
    setCopiadoNegativos(true)
    toast.success('¡Porcentajes de Negativos copiados al portapapeles!')
    setTimeout(() => setCopiadoNegativos(false), 2500)
  }

  // Exportar Excel de Negativos
  const exportarNegativosExcel = () => {
    const dataAExportar = datosNegativos.map(t => {
      const fila: Record<string, string | number> = {
        'Local': t.nombre,
        'Líder J06': t.lider,
        'CUOTA DIARIA': `S/ ${t.cuota}`,
      }
      t.dias.forEach((d, i) => {
        fila[`Día ${i + 1} (${d.fecha})`] = d.monto !== null ? d.monto : 0
      })
      fila['Días Cumplidos'] = `${t.diasCumplidos} / ${t.totalDias}`
      fila['Cumplimiento %'] = `${t.cumplimientoPorcentaje.toFixed(2)}%`
      return fila
    })

    const worksheet = XLSX.utils.json_to_sheet(dataAExportar)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Negativos Looker')
    XLSX.writeFile(workbook, `Negativos_Looker_${semanaSeleccionada.replace(/\s+/g, '_')}.xlsx`)
    toast.success('Archivo Excel de Negativos descargado correctamente.')
  }

  // Estadísticas Negativos
  const totalTiendasNeg = datosNegativos.length
  const tiendas100Neg = datosNegativos.filter(t => t.cumplimientoPorcentaje === 100).length
  const tiendasCeroNeg = datosNegativos.filter(t => t.cumplimientoPorcentaje === 0).length
  const promedioZonaNeg =
    totalTiendasNeg > 0
      ? (datosNegativos.reduce((acc, t) => acc + t.cumplimientoPorcentaje, 0) / totalTiendasNeg).toFixed(2)
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
                Automatización de informes semanales: Ajustes y Negativos de Looker
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
                setDatosAjustes(DATOS_EJEMPLO_AJUSTES_SEM_40)
                setDatosNegativos(generarDatosEjemploNegativos(cuotasNegativos))
                toast.info('Se cargaron los datos de ejemplo de la Semana 40 para Ajustes y Negativos.')
              }}
              className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Cargar Ejemplo Sem 40
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación del Módulo */}
        <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('negativos')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'negativos'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            2. Negativos (Looker)
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              Nuevo
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ajustes')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'ajustes'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            1. Ajustes (Looker)
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
              Listo
            </span>
          </button>

          <button
            onClick={() => setActiveTab('boletin_preview')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'boletin_preview'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            3. Vista Previa Boletín J06
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              2 KPIs Conectados
            </span>
          </button>

          <button
            onClick={() => setActiveTab('consolidado')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'consolidado'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            4. Datos Consolidado
          </button>
        </div>

        {/* TAB 2: NEGATIVOS (LOOKER) */}
        {activeTab === 'negativos' && (
          <div className="space-y-6">
            {/* Zona de Arrastre de Archivo Looker Negativos */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    Cargar Reporte de Looker: Negativos j06 boletin
                  </h2>
                  <p className="text-xs text-slate-500">
                    Sube el archivo Excel o CSV exportado desde Looker con el filtro: <em>Unidades Inventario Disponible &lt; 0</em> y <em>Zonal Desc = Zona B</em>.
                  </p>
                </div>

                {archivoNegativos && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold truncate max-w-xs">{archivoNegativos.name}</span>
                  </div>
                )}
              </div>

              <div
                onDragOver={e => {
                  e.preventDefault()
                  setIsDraggingNegativos(true)
                }}
                onDragLeave={() => setIsDraggingNegativos(false)}
                onDrop={e => {
                  e.preventDefault()
                  setIsDraggingNegativos(false)
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    procesarArchivoNegativos(e.dataTransfer.files[0])
                  }
                }}
                onClick={() => document.getElementById('looker-negativos-input')?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDraggingNegativos
                    ? 'border-emerald-500 bg-emerald-50/60'
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50'
                }`}
              >
                <input
                  id="looker-negativos-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      procesarArchivoNegativos(e.target.files[0])
                    }
                  }}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Arrastra tu archivo de Negativos o{' '}
                      <span className="text-emerald-600 underline">haz clic para examinar</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Filtros en Looker: <em>Semana Comercial = 202641</em>, <em>Unidades &lt; 0</em>, <em>División = J06</em>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjetas Resumen de Negativos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cumplimiento Negativos</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{promedioZonaNeg}%</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-0.5">Promedio Zona B</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-lg">
                  %
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tiendas al 100% (7/7)</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {tiendas100Neg} <span className="text-sm font-medium text-slate-400">/ {totalTiendasNeg}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Dentro de cuota todos los días</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tiendas con Desvío</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {totalTiendasNeg - tiendas100Neg - tiendasCeroNeg}{' '}
                    <span className="text-sm font-medium text-slate-400">/ {totalTiendasNeg}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Superaron cuota algún día</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tiendas en 0%</p>
                  <p className="text-2xl font-black text-rose-600 mt-1">
                    {tiendasCeroNeg} <span className="text-sm font-medium text-slate-400">/ {totalTiendasNeg}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Excedieron cuota los 7 días</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Tabla Detallada de Negativos */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#1b5e20]"></span>
                    NEGATIVOS (LOOKER) - Control Diario vs Cuota Máxima
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fórmula exacta: Si Costo Diario &gt;= Cuota (dentro del rango permitido), suma 1 punto. Nota = (Días cumplidos / 7)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copiarNotasNegativos}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-sm cursor-pointer"
                    title="Copiar columna de notas para pegar en Excel"
                  >
                    {copiadoNegativos ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    {copiadoNegativos ? '¡Copiado!' : 'Copiar Notas'}
                  </button>

                  <button
                    onClick={exportarNegativosExcel}
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
                      {fechasNegativos.map((f, i) => (
                        <th key={i} className="py-2.5 px-2 border-r border-emerald-800 min-w-[95px]">
                          <div>Día {i + 1}</div>
                          <div className="text-[10px] font-normal opacity-90">{f}</div>
                        </th>
                      ))}
                      <th className="py-2.5 px-3 bg-[#2e7d32] border-r border-emerald-800 min-w-[90px]">
                        CUOTA DIARIA
                      </th>
                      <th className="py-2.5 px-3 bg-[#1b5e20] border-r border-emerald-800 min-w-[75px]">
                        Días OK
                      </th>
                      <th className="py-2.5 px-4 bg-[#1b5e20] min-w-[110px]">
                        Cumplimiento
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {datosNegativos.map((item, idx) => {
                      const es100 = item.cumplimientoPorcentaje === 100
                      const esCero = item.cumplimientoPorcentaje === 0
                      const esMedio = !es100 && !esCero
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
                                !d.cumple
                                  ? 'bg-rose-50 text-rose-800 font-bold'
                                  : 'text-slate-800'
                              }`}
                            >
                              {d.monto !== null ? (
                                <span title={!d.cumple ? `Excedió la cuota de S/ ${item.cuota}` : 'Dentro de cuota'}>
                                  -S/ {Math.abs(d.monto).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-sans">
                                  S/ 0
                                </span>
                              )}
                            </td>
                          ))}
                          
                          {/* CUOTA DIARIA CONFIGURABLE */}
                          <td className="py-2 px-3 text-center border-r border-slate-200 bg-emerald-50/40 font-bold text-slate-800">
                            <div className="flex items-center justify-center gap-1">
                              <span>-S/ {Math.abs(item.cuota)}</span>
                            </div>
                          </td>

                          {/* DÍAS CUMPLIDOS */}
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800 border-r border-slate-200 bg-slate-50">
                            {item.diasCumplidos} / {item.totalDias}
                          </td>

                          {/* CUMPLIMIENTO % */}
                          <td className="py-2.5 px-4 text-center font-black whitespace-nowrap">
                            <span
                              className={`inline-block px-3 py-1 rounded-md text-xs font-bold border ${
                                es100
                                  ? 'bg-[#c8e6c9] text-[#1b5e20] border-[#a5d6a7]'
                                  : esMedio
                                  ? 'bg-[#ffe0b2] text-[#e65100] border-[#ffcc80]'
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

        {/* TAB 1: AJUSTES (LOOKER) */}
        {activeTab === 'ajustes' && (
          <div className="space-y-6">
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

                {archivoAjustes && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold truncate max-w-xs">{archivoAjustes.name}</span>
                  </div>
                )}
              </div>

              <div
                onDragOver={e => {
                  e.preventDefault()
                  setIsDraggingAjustes(true)
                }}
                onDragLeave={() => setIsDraggingAjustes(false)}
                onDrop={e => {
                  e.preventDefault()
                  setIsDraggingAjustes(false)
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    procesarArchivoAjustes(e.dataTransfer.files[0])
                  }
                }}
                onClick={() => document.getElementById('looker-ajustes-input')?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDraggingAjustes
                    ? 'border-emerald-500 bg-emerald-50/60'
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50'
                }`}
              >
                <input
                  id="looker-ajustes-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      procesarArchivoAjustes(e.target.files[0])
                    }
                  }}
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

            {/* Tarjetas Resumen Ajustes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cumplimiento Zona B</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {(datosAjustes.reduce((acc, t) => acc + t.cumplimientoPorcentaje, 0) / datosAjustes.length).toFixed(2)}%
                  </p>
                  <p className="text-xs text-emerald-600 font-semibold mt-0.5">Meta diaria: 100%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-lg">
                  %
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tiendas al 100% (7/7)</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {datosAjustes.filter(t => t.cumplimientoPorcentaje === 100).length}{' '}
                    <span className="text-sm font-medium text-slate-400">/ {datosAjustes.length}</span>
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
                    {datosAjustes.filter(t => t.cumplimientoPorcentaje < 100).length}{' '}
                    <span className="text-sm font-medium text-slate-400">/ {datosAjustes.length}</span>
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

            {/* Tabla Detallada Ajustes */}
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
                    onClick={() => {
                      const texto = datosAjustes.map(t => `${t.cumplimientoPorcentaje.toFixed(2)}%`).join('\n')
                      navigator.clipboard.writeText(texto)
                      setCopiadoAjustes(true)
                      toast.success('¡Porcentajes de Ajustes copiados!')
                      setTimeout(() => setCopiadoAjustes(false), 2500)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-sm cursor-pointer"
                  >
                    {copiadoAjustes ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    {copiadoAjustes ? '¡Copiado!' : 'Copiar Notas'}
                  </button>

                  <button
                    onClick={() => {
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
                      toast.success('Archivo Excel descargado.')
                    }}
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
                      {fechasAjustes.map((f, i) => (
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
                                <span>
                                  {d.monto < 0
                                    ? `-S/ ${Math.abs(d.monto).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                                    : `S/ ${d.monto.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
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

        {/* TAB 3: VISTA PREVIA BOLETÍN J06 (INVENTARIO) */}
        {activeTab === 'boletin_preview' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Boletín J06 - Sección: KPI&apos;S (Inventario, Implementación, Disponibilidad, Calidad)
                </h2>
                <p className="text-xs text-slate-500">
                  Las columnas <strong className="text-emerald-700">Ajustes</strong> y{' '}
                  <strong className="text-emerald-700">Negativos</strong> ahora se alimentan automáticamente desde tus reportes de Looker.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ajustes y Negativos Conectados
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
                    <th className="py-1 px-2 border-r border-slate-300 font-semibold text-slate-700">
                      Objetivo &gt;98% (ERI)
                    </th>

                    <th className="py-1 px-2 border-r border-slate-300 bg-slate-100">100%</th>
                    <th className="py-1 px-2 border-r border-slate-300 bg-emerald-100 text-emerald-900 font-bold">
                      Diario (Ajustes)
                    </th>
                    <th className="py-1 px-2 border-r border-slate-300 bg-emerald-100 text-emerald-900 font-bold">
                      Obj. Por tienda (Negativos)
                    </th>

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
                    <th className="py-2 px-2 border-r border-slate-300 bg-emerald-200 text-emerald-950">
                      Negativos ⭐
                    </th>

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
                  {TIENDAS_ZONA_B.map(tienda => {
                    const rowAjuste = datosAjustes.find(a => a.codigo === tienda.codigo)
                    const rowNegativo = datosNegativos.find(n => n.codigo === tienda.codigo)

                    const pctAjuste = rowAjuste ? rowAjuste.cumplimientoPorcentaje : 0
                    const pctNegativo = rowNegativo ? rowNegativo.cumplimientoPorcentaje : 0

                    return (
                      <tr key={tienda.codigo} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-left font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                          {tienda.nombre}
                        </td>
                        <td className="py-2 px-3 text-left text-slate-600 border-r border-slate-200 whitespace-nowrap">
                          {tienda.lider}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 text-slate-500">0.00%</td>
                        <td className="py-2 px-2 border-r border-slate-200 text-emerald-700 bg-emerald-50/40">100.00%</td>

                        {/* COLUMNA AJUSTES (LOOKER AUTOMATIZADO) */}
                        <td className="py-2 px-2 border-r border-slate-200 font-bold bg-emerald-50 text-emerald-900">
                          {pctAjuste.toFixed(2)}%
                        </td>

                        {/* COLUMNA NEGATIVOS (LOOKER AUTOMATIZADO) */}
                        <td
                          className={`py-2 px-2 border-r border-slate-200 font-bold ${
                            pctNegativo === 100
                              ? 'bg-emerald-50 text-emerald-900'
                              : pctNegativo > 0
                              ? 'bg-amber-50 text-amber-900'
                              : 'bg-rose-50 text-rose-900'
                          }`}
                        >
                          {pctNegativo.toFixed(2)}%
                        </td>

                        <td className="py-2 px-2 border-r border-slate-200 text-slate-600">100.00%</td>
                        <td className="py-2 px-2 border-r border-slate-200 text-slate-600">100.00%</td>
                        <td className="py-2 px-2 border-r border-slate-200 text-slate-600">92.70%</td>
                        <td className="py-2 px-2 border-r border-slate-200 text-slate-600">0.00%</td>
                        <td className="py-2 px-2 border-r border-slate-200 text-slate-600">7.30%</td>
                        <td className="py-2 px-2 border-r border-slate-200 text-slate-600">100.00%</td>
                        <td className="py-2 px-2 text-slate-600">100.00%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CONSOLIDADO */}
        {activeTab === 'consolidado' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Data para la Pestaña &quot;Consolidado&quot;
              </h2>
              <p className="text-xs text-slate-500">
                A medida que carguemos los archivos, los campos se sincronizan de forma directa y automática.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-2 overflow-x-auto">
              <div className="font-bold text-slate-800">Estado de Automatización de Columnas:</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-600">
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg font-semibold flex items-center justify-between">
                  <span>✓ Ajustes (Looker)</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">100%</span>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg font-semibold flex items-center justify-between">
                  <span>✓ Negativos (Looker)</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">100%</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                  <span>⏳ Pistoleo Pan</span>
                  <span className="text-[10px] text-slate-400">Pendiente</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                  <span>⏳ Registro A-C</span>
                  <span className="text-[10px] text-slate-400">Pendiente</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                  <span>⏳ Incidencias DDF</span>
                  <span className="text-[10px] text-slate-400">Pendiente</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                  <span>⏳ Venta / Crecimiento</span>
                  <span className="text-[10px] text-slate-400">Pendiente</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                  <span>⏳ Merma / Quiebre</span>
                  <span className="text-[10px] text-slate-400">Pendiente</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                  <span>⏳ Calidad / Auditoría</span>
                  <span className="text-[10px] text-slate-400">Pendiente</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
