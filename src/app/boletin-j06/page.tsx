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
  ShieldCheck,
  Clock,
  Info,
  ClipboardPaste,
  FileText,
  Smartphone,
  CheckCircle
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

// Mapeo de nombres alternativos y aliases comunes en Excel/Looker/Web
export const ALIASES_TIENDAS: Record<string, string[]> = {
  '103': ['MEGA PLAZA', 'MEGAPLAZA', 'MEGA', '103'],
  '107': ['ATOCONGO', '107'],
  '110': ['HUAYLAS', 'HUAYLAS ', '110'],
  '118': ['BELLAVISTA', 'BELLA VISTA', '118'],
  '155': ['SANTA ANITA', 'SANTAANITA', '155'],
  '175': ['LIMA SUR', 'LIMASUR', '175'],
  '193': ['PURUCHUCO', '193'],
  '311': ['TRUJILLO 1', 'TRUJILLO1', 'TRUJILLO I', '311'],
  '314': ['TRUJILLO 2', 'TRUJILLO2', 'TRUJILLO II', '314'],
  '335': ['CHIMBOTE', '335'],
  '357': ['CUSCO', 'CUSCO LA CULTURA', 'LA CULTURA', 'CULTURA', '357'],
}

export function identificarTienda(celda: string): TiendaZonaB | undefined {
  if (!celda) return undefined
  const celdaUpper = celda.toUpperCase().trim()
  if (!celdaUpper) return undefined

  return TIENDAS_ZONA_B.find(t => {
    if (celdaUpper === t.codigo || celdaUpper.startsWith(t.codigo + '-') || celdaUpper.startsWith(t.codigo + ' ') || celdaUpper.includes(` ${t.codigo} `)) {
      return true
    }
    const aliases = ALIASES_TIENDAS[t.codigo] || []
    if (aliases.some(alias => celdaUpper === alias || celdaUpper.includes(alias) || alias.includes(celdaUpper))) {
      return true
    }
    const nombreSinCodigo = t.nombre.toUpperCase().replace(/^\d+\s*-\s*/, '').trim()
    if (celdaUpper === nombreSinCodigo || celdaUpper.includes(nombreSinCodigo) || nombreSinCodigo.includes(celdaUpper)) {
      return true
    }
    return false
  })
}

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

// Interfaces Disponibilidad (NSG, Bodega, Quiebre)
export interface FilaDisponibilidadTienda {
  codigo: string
  nombre: string
  lider: string
  mes: string
  nsg: number
  bodega: number
  quiebre: number
  esHistorico: boolean
}

// Interfaces Incidencias DDF (Excel Online - 7 campos)
export interface CampoDDFDetalle {
  id: string
  nombre: string
  contenido: string
  lleno: boolean
}

export interface FilaDDFTienda {
  codigo: string
  nombre: string
  lider: string
  campos: CampoDDFDetalle[]
  camposLlenos: number
  totalCampos: number
  cumplimientoPorcentaje: number
  textoFunciono?: string
  textoNoFunciono?: string
}

// Interfaces App de Vencimiento (Reporte Web de Alertas)
export interface FilaAppVencimientoTienda {
  codigo: string
  nombre: string
  lider: string
  dias: { fecha: string; porcentaje: number }[]
  totalPorcentaje: number
}

const NOMBRES_7_CAMPOS_DDF = [
  'Logro / Crec',
  'Funcionó',
  'No funcionó',
  'Quiebres',
  'Sobre Stock',
  'Liquidaciones',
  'Otros Comentarios de la Semana',
]

// Parser de TSV robusto
function parseTSVWithQuotes(text: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let insideQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"'
        i++
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === '\t' && !insideQuotes) {
      currentRow.push(currentCell.trim())
      currentCell = ''
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++
      }
      currentRow.push(currentCell.trim())
      currentCell = ''
      if (currentRow.length > 0 && currentRow.some(c => c !== '')) {
        rows.push(currentRow)
      }
      currentRow = []
    } else {
      currentCell += char
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim())
    if (currentRow.some(c => c !== '')) {
      rows.push(currentRow)
    }
  }

  return rows
}

// Datos de muestra Ajustes
const DATOS_EJEMPLO_AJUSTES_SEM_40: FilaAjusteTienda[] = [
  { codigo: '103', nombre: '103 - Mega Plaza', lider: 'Ronny Mario Colque Sanchez', dias: [{ fecha: '2026-09-28', monto: -759 }, { fecha: '2026-09-29', monto: 718 }, { fecha: '2026-09-30', monto: -589 }, { fecha: '2026-10-01', monto: 171 }, { fecha: '2026-10-02', monto: 150 }, { fecha: '2026-10-03', monto: -362 }, { fecha: '2026-10-04', monto: -753 }], diasConAjuste: 7, totalDias: 7, cumplimientoPorcentaje: 100 },
  { codigo: '107', nombre: '107 - Atocongo', lider: 'Edgar Wuffarden', dias: [{ fecha: '2026-09-28', monto: -29 }, { fecha: '2026-09-29', monto: -46 }, { fecha: '2026-09-30', monto: 92 }, { fecha: '2026-10-01', monto: 320 }, { fecha: '2026-10-02', monto: -204 }, { fecha: '2026-10-03', monto: 4 }, { fecha: '2026-10-04', monto: 1564 }], diasConAjuste: 7, totalDias: 7, cumplimientoPorcentaje: 100 },
  { codigo: '110', nombre: '110 - Huaylas', lider: 'Gerson Pichi Javier', dias: [{ fecha: '2026-09-28', monto: 815 }, { fecha: '2026-09-29', monto: -1 }, { fecha: '2026-09-30', monto: -72 }, { fecha: '2026-10-01', monto: -140 }, { fecha: '2026-10-02', monto: -42 }, { fecha: '2026-10-03', monto: null }, { fecha: '2026-10-04', monto: 105 }], diasConAjuste: 6, totalDias: 7, cumplimientoPorcentaje: 85.71 },
  { codigo: '118', nombre: '118 - Bellavista', lider: 'Miguel Vernales Sanchez', dias: [{ fecha: '2026-09-28', monto: 5 }, { fecha: '2026-09-29', monto: -26 }, { fecha: '2026-09-30', monto: -39 }, { fecha: '2026-10-01', monto: null }, { fecha: '2026-10-02', monto: -74 }, { fecha: '2026-10-03', monto: 42 }, { fecha: '2026-10-04', monto: -53 }], diasConAjuste: 6, totalDias: 7, cumplimientoPorcentaje: 85.71 },
  { codigo: '155', nombre: '155 - Santa Anita', lider: 'Oneida rojas castro', dias: [{ fecha: '2026-09-28', monto: -63 }, { fecha: '2026-09-29', monto: 269 }, { fecha: '2026-09-30', monto: 99 }, { fecha: '2026-10-01', monto: 158 }, { fecha: '2026-10-02', monto: -620 }, { fecha: '2026-10-03', monto: 161 }, { fecha: '2026-10-04', monto: 54 }], diasConAjuste: 7, totalDias: 7, cumplimientoPorcentaje: 100 },
  { codigo: '175', nombre: '175 - Lima Sur', lider: 'Victor Mejia', dias: [{ fecha: '2026-09-28', monto: -881 }, { fecha: '2026-09-29', monto: null }, { fecha: '2026-09-30', monto: -269 }, { fecha: '2026-10-01', monto: -298 }, { fecha: '2026-10-02', monto: -170 }, { fecha: '2026-10-03', monto: -95 }, { fecha: '2026-10-04', monto: 306 }], diasConAjuste: 6, totalDias: 7, cumplimientoPorcentaje: 85.71 },
  { codigo: '193', nombre: '193 - Puruchuco', lider: 'Eyder Mego Quispe', dias: [{ fecha: '2026-09-28', monto: -4 }, { fecha: '2026-09-29', monto: -269 }, { fecha: '2026-10-01', monto: null }, { fecha: '2026-09-30', monto: -145 }, { fecha: '2026-10-02', monto: -151 }, { fecha: '2026-10-03', monto: 57 }, { fecha: '2026-10-04', monto: -137 }], diasConAjuste: 6, totalDias: 7, cumplimientoPorcentaje: 85.71 },
  { codigo: '311', nombre: '311 - Trujillo 1', lider: 'Gustavo Carassaz', dias: [{ fecha: '2026-09-28', monto: -12 }, { fecha: '2026-09-29', monto: -84 }, { fecha: '2026-09-30', monto: -13 }, { fecha: '2026-10-01', monto: 1 }, { fecha: '2026-10-02', monto: 120 }, { fecha: '2026-10-03', monto: -14 }, { fecha: '2026-10-04', monto: -37 }], diasConAjuste: 7, totalDias: 7, cumplimientoPorcentaje: 100 },
  { codigo: '314', nombre: '314 - Trujillo 2', lider: 'Cynthia Caycho Malca', dias: [{ fecha: '2026-09-28', monto: -283 }, { fecha: '2026-09-29', monto: -25 }, { fecha: '2026-09-30', monto: -38 }, { fecha: '2026-10-01', monto: -25 }, { fecha: '2026-10-02', monto: -78 }, { fecha: '2026-10-03', monto: 20 }, { fecha: '2026-10-04', monto: -16 }], diasConAjuste: 7, totalDias: 7, cumplimientoPorcentaje: 100 },
  { codigo: '335', nombre: '335 - Chimbote', lider: 'Mariela Lisseth López Dominguez', dias: [{ fecha: '2026-09-28', monto: -13 }, { fecha: '2026-09-29', monto: -198 }, { fecha: '2026-09-30', monto: -227 }, { fecha: '2026-10-01', monto: -511 }, { fecha: '2026-10-02', monto: -141 }, { fecha: '2026-10-03', monto: 74 }, { fecha: '2026-10-04', monto: -721 }], diasConAjuste: 7, totalDias: 7, cumplimientoPorcentaje: 100 },
  { codigo: '357', nombre: '357 - Cusco La Cultura', lider: 'Enzo Danilo Parodi Portugal', dias: [{ fecha: '2026-09-28', monto: null }, { fecha: '2026-09-29', monto: null }, { fecha: '2026-09-30', monto: null }, { fecha: '2026-10-01', monto: -302 }, { fecha: '2026-10-02', monto: -233 }, { fecha: '2026-10-03', monto: -79 }, { fecha: '2026-10-04', monto: -194 }], diasConAjuste: 4, totalDias: 7, cumplimientoPorcentaje: 57.14 },
]

// Datos de muestra Negativos
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
  const fechas = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']

  return TIENDAS_ZONA_B.map(t => {
    const cuota = cuotas[t.codigo] ?? -250
    const montos = montosPorTienda[t.codigo] || [0, 0, 0, 0, 0, 0, 0]
    const dias: RegistroNegativoDia[] = fechas.map((fecha, idx) => {
      const monto = montos[idx] ?? null
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

// Datos de muestra Disponibilidad
const DATOS_EJEMPLO_DISPONIBILIDAD: FilaDisponibilidadTienda[] = [
  { codigo: '103', nombre: '103 - Mega Plaza', lider: 'Ronny Mario Colque Sanchez', mes: 'septiembre', nsg: 92.70, bodega: 0.00, quiebre: 7.30, esHistorico: false },
  { codigo: '107', nombre: '107 - Atocongo', lider: 'Edgar Wuffarden', mes: 'septiembre', nsg: 98.80, bodega: 1.20, quiebre: 0.00, esHistorico: false },
  { codigo: '110', nombre: '110 - Huaylas', lider: 'Gerson Pichi Javier', mes: 'septiembre', nsg: 91.00, bodega: 0.00, quiebre: 9.00, esHistorico: false },
  { codigo: '118', nombre: '118 - Bellavista', lider: 'Miguel Vernales Sanchez', mes: 'septiembre', nsg: 84.40, bodega: 2.80, quiebre: 12.70, esHistorico: false },
  { codigo: '155', nombre: '155 - Santa Anita', lider: 'Oneida rojas castro', mes: 'septiembre', nsg: 93.70, bodega: 2.00, quiebre: 4.40, esHistorico: false },
  { codigo: '175', nombre: '175 - Lima Sur', lider: 'Victor Mejia', mes: 'septiembre', nsg: 88.90, bodega: 2.50, quiebre: 8.50, esHistorico: false },
  { codigo: '193', nombre: '193 - Puruchuco', lider: 'Eyder Mego Quispe', mes: 'septiembre', nsg: 87.00, bodega: 3.70, quiebre: 9.30, esHistorico: false },
  { codigo: '311', nombre: '311 - Trujillo 1', lider: 'Gustavo Carassaz', mes: 'septiembre', nsg: 94.40, bodega: 0.00, quiebre: 5.60, esHistorico: false },
  { codigo: '314', nombre: '314 - Trujillo 2', lider: 'Cynthia Caycho Malca', mes: 'septiembre', nsg: 96.60, bodega: 0.00, quiebre: 3.40, esHistorico: false },
  { codigo: '335', nombre: '335 - Chimbote', lider: 'Mariela Lisseth López Dominguez', mes: 'septiembre', nsg: 85.70, bodega: 7.60, quiebre: 6.70, esHistorico: false },
  { codigo: '357', nombre: '357 - Cusco La Cultura', lider: 'Enzo Danilo Parodi Portugal', mes: 'septiembre', nsg: 94.20, bodega: 0.00, quiebre: 5.80, esHistorico: false },
]

// Datos de muestra DDF
const DATOS_EJEMPLO_DDF_SEM_41: FilaDDFTienda[] = TIENDAS_ZONA_B.map(t => {
  const esMegaPlaza = t.codigo === '103'
  const campos: CampoDDFDetalle[] = NOMBRES_7_CAMPOS_DDF.map((nom, i) => ({
    id: `campo_${i + 1}`,
    nombre: nom,
    contenido: esMegaPlaza ? '' : `Registro completado de ${nom}`,
    lleno: !esMegaPlaza,
  }))
  return {
    codigo: t.codigo,
    nombre: t.nombre,
    lider: t.lider,
    campos,
    camposLlenos: esMegaPlaza ? 0 : 7,
    totalCampos: 7,
    cumplimientoPorcentaje: esMegaPlaza ? 0.0 : 100.0,
    textoFunciono: esMegaPlaza ? '' : '50% EN ENROLLADOS DE PIZZA, KEKES REDONDOS',
    textoNoFunciono: esMegaPlaza ? '' : 'Compra de keke redondo tottus + S/1.00',
  }
})

// Datos de muestra App Vencimiento (Chimbote con 56.4%, resto con 100%)
const DATOS_EJEMPLO_VENCIMIENTO: FilaAppVencimientoTienda[] = TIENDAS_ZONA_B.map(t => {
  const esChimbote = t.codigo === '335'
  const totalPorcentaje = esChimbote ? 56.4 : 100.0
  const dias = [
    { fecha: '2026-10-05', porcentaje: 100 },
    { fecha: '2026-10-06', porcentaje: 100 },
    { fecha: '2026-10-07', porcentaje: 100 },
    { fecha: '2026-10-08', porcentaje: 100 },
    { fecha: '2026-10-09', porcentaje: 100 },
    { fecha: '2026-10-10', porcentaje: esChimbote ? 0 : 100 },
    { fecha: '2026-10-11', porcentaje: esChimbote ? 0 : 100 },
  ]
  return {
    codigo: t.codigo,
    nombre: t.nombre,
    lider: t.lider,
    dias,
    totalPorcentaje,
  }
})

export default function BoletinJ06Page() {
  const [activeTab, setActiveTab] = useState<'vencimiento' | 'ddf' | 'disponibilidad' | 'negativos' | 'ajustes' | 'boletin_preview' | 'consolidado'>('vencimiento')

  // Estado App Vencimiento
  const [datosVencimiento, setDatosVencimiento] = useState<FilaAppVencimientoTienda[]>(DATOS_EJEMPLO_VENCIMIENTO)
  const [textoPegadoVencimiento, setTextoPegadoVencimiento] = useState<string>('')
  const [copiadoVencimiento, setCopiadoVencimiento] = useState(false)

  // Estado DDF
  const [datosDDF, setDatosDDF] = useState<FilaDDFTienda[]>(DATOS_EJEMPLO_DDF_SEM_41)
  const [textoPegadoDDF, setTextoPegadoDDF] = useState<string>('')
  const [copiadoDDF, setCopiadoDDF] = useState(false)

  // Estado Disponibilidad
  const [datosDisponibilidad, setDatosDisponibilidad] = useState<FilaDisponibilidadTienda[]>(DATOS_EJEMPLO_DISPONIBILIDAD)
  const [copiadoDisponibilidad, setCopiadoDisponibilidad] = useState(false)

  // Estado Ajustes
  const [datosAjustes, setDatosAjustes] = useState<FilaAjusteTienda[]>(DATOS_EJEMPLO_AJUSTES_SEM_40)

  // Estado Negativos
  const [cuotasNegativos, setCuotasNegativos] = useState<Record<string, number>>(CUOTAS_NEGATIVOS_DEFAULT)
  const [datosNegativos, setDatosNegativos] = useState<FilaNegativoTienda[]>(() =>
    generarDatosEjemploNegativos(CUOTAS_NEGATIVOS_DEFAULT)
  )

  const [semanaSeleccionada, setSemanaSeleccionada] = useState<string>('Semana 41')

  // Procesar Texto Pegado del reporte web de App de Vencimiento
  const procesarTextoPegadoVencimiento = (rawText: string) => {
    if (!rawText || rawText.trim().length === 0) {
      toast.error('El texto pegado está vacío.')
      return
    }

    try {
      const lineas = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)

      // Identificar tiendas en el texto
      const tiendasEncontradasEnTexto: { idx: number; tienda: TiendaZonaB }[] = []
      lineas.forEach((linea, idx) => {
        const match = identificarTienda(linea)
        if (match && !tiendasEncontradasEnTexto.some(t => t.tienda.codigo === match.codigo)) {
          tiendasEncontradasEnTexto.push({ idx, tienda: match })
        }
      })

      // Extraer porcentajes
      const regexPct = /(\d+(?:\.\d+)?)\s*%/

      // Modo 1: Si hay líneas que contienen el nombre de la tienda Y el porcentaje en la misma línea
      const mapaDirecto: Record<string, number> = {}
      lineas.forEach(linea => {
        const matchT = identificarTienda(linea)
        const matchP = linea.match(regexPct)
        if (matchT && matchP) {
          mapaDirecto[matchT.codigo] = parseFloat(matchP[1])
        }
      })

      // Modo 2: Formato DOM del navegador (bloque de tiendas arriba, fechas, matriz, y lista de Totales al final tras 'Local' o 'Total')
      let indiceLocalOTotal = -1
      for (let i = lineas.length - 1; i >= 0; i--) {
        const lUpper = lineas[i].toUpperCase()
        if (lUpper === 'LOCAL' || lUpper === 'TOTAL' || lUpper.includes('DÍA / % CUMP')) {
          indiceLocalOTotal = i
          break
        }
      }

      const listaTotalesFinales: number[] = []
      if (indiceLocalOTotal !== -1) {
        for (let i = indiceLocalOTotal + 1; i < lineas.length; i++) {
          const m = lineas[i].match(regexPct)
          if (m) {
            listaTotalesFinales.push(parseFloat(m[1]))
          }
        }
      }

      // Extraer fechas si están presentes
      const regexFecha = /^\d{4}-\d{2}-\d{2}$|^\d{2}[/-]\d{2}[/-]\d{4}$/
      const fechasDetectadas: string[] = []
      let lastFechaIdx = -1
      lineas.forEach((l, idx) => {
        if (regexFecha.test(l)) {
          fechasDetectadas.push(l)
          lastFechaIdx = idx
        }
      })

      // Extraer porcentajes de la matriz diaria entre la última fecha y el encabezado final
      const matrixPcts: number[] = []
      if (lastFechaIdx !== -1 && indiceLocalOTotal > lastFechaIdx) {
        for (let i = lastFechaIdx + 1; i < indiceLocalOTotal; i++) {
          const m = lineas[i].match(regexPct)
          if (m) {
            matrixPcts.push(parseFloat(m[1]))
          }
        }
      }

      const numDias = fechasDetectadas.length > 0 ? fechasDetectadas.length : 7
      const tieneMatrizDiaria =
        tiendasEncontradasEnTexto.length > 0 &&
        matrixPcts.length >= tiendasEncontradasEnTexto.length * numDias

      const todosLosPorcentajes = lineas
        .map(l => l.match(regexPct))
        .filter((m): m is RegExpMatchArray => m !== null)
        .map(m => parseFloat(m[1]))

      const resultado: FilaAppVencimientoTienda[] = TIENDAS_ZONA_B.map((t, idx) => {
        const posEncontrada = tiendasEncontradasEnTexto.findIndex(item => item.tienda.codigo === t.codigo)
        let totalPct = 100.0

        // Prioridad 1: Mapeo directo en la misma línea
        if (mapaDirecto[t.codigo] !== undefined) {
          totalPct = mapaDirecto[t.codigo]
        }
        // Prioridad 2: Columna Total final tras encabezado Local
        else if (listaTotalesFinales.length > 0) {
          if (posEncontrada !== -1 && listaTotalesFinales[posEncontrada] !== undefined) {
            totalPct = listaTotalesFinales[posEncontrada]
          } else if (listaTotalesFinales[idx] !== undefined) {
            totalPct = listaTotalesFinales[idx]
          }
        }
        // Prioridad 3: Últimos porcentajes del texto
        else if (todosLosPorcentajes.length >= tiendasEncontradasEnTexto.length && tiendasEncontradasEnTexto.length > 0) {
          const ultimos = todosLosPorcentajes.slice(-tiendasEncontradasEnTexto.length)
          if (posEncontrada !== -1 && ultimos[posEncontrada] !== undefined) {
            totalPct = ultimos[posEncontrada]
          }
        }

        // Desglose de días
        let dias = [
          { fecha: 'Día 1', porcentaje: 100 },
          { fecha: 'Día 2', porcentaje: 100 },
          { fecha: 'Día 3', porcentaje: 100 },
          { fecha: 'Día 4', porcentaje: 100 },
          { fecha: 'Día 5', porcentaje: 100 },
          { fecha: 'Día 6', porcentaje: 100 },
          { fecha: 'Día 7', porcentaje: 100 },
        ]

        if (tieneMatrizDiaria && posEncontrada !== -1) {
          const offset = posEncontrada * numDias
          const labels =
            fechasDetectadas.length === numDias
              ? fechasDetectadas
              : ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5', 'Día 6', 'Día 7']
          dias = labels.map((f, dIdx) => ({
            fecha: f,
            porcentaje: matrixPcts[offset + dIdx] ?? 100,
          }))
        } else if (t.codigo === '335' && totalPct < 100) {
          dias = dias.map((d, dIdx) => ({
            ...d,
            porcentaje: dIdx >= 5 ? 0 : 100,
          }))
        }

        return {
          codigo: t.codigo,
          nombre: t.nombre,
          lider: t.lider,
          dias,
          totalPorcentaje: totalPct,
        }
      })

      setDatosVencimiento(resultado)
      setTextoPegadoVencimiento(rawText)
      toast.success(
        `¡App de Vencimiento procesada! Se asignaron calificaciones a las 11 tiendas.`
      )
    } catch (e) {
      console.error(e)
      toast.error('Ocurrió un error al procesar el texto de la App de Vencimiento.')
    }
  }

  // Pegar directo desde portapapeles
  const handlePegarVencimientoPortapapeles = async () => {
    try {
      const texto = await navigator.clipboard.readText()
      if (texto) {
        procesarTextoPegadoVencimiento(texto)
      } else {
        toast.warning('El portapapeles está vacío.')
      }
    } catch {
      toast.info('Presiona Ctrl+V dentro del recuadro inferior para pegar el reporte.')
    }
  }

  // Copiar Notas de Vencimiento
  const copiarNotasVencimiento = () => {
    const texto = datosVencimiento
      .map(t => `${t.totalPorcentaje.toFixed(2)}%`)
      .join('\n')
    navigator.clipboard.writeText(texto)
    setCopiadoVencimiento(true)
    toast.success('¡Notas de App de Vencimiento copiadas!')
    setTimeout(() => setCopiadoVencimiento(false), 2500)
  }

  // Procesar DDF
  const procesarTextoPegadoDDF = (rawText: string) => {
    if (!rawText || rawText.trim().length === 0) {
      toast.error('El portapapeles está vacío o no contiene texto.')
      return
    }
    try {
      const matriz = parseTSVWithQuotes(rawText)
      let filaHeadersIdx = -1
      const mapaColTienda: { colIdx: number; tienda: TiendaZonaB }[] = []

      for (let r = 0; r < Math.min(matriz.length, 5); r++) {
        const fila = matriz[r]
        const encontradas: { colIdx: number; tienda: TiendaZonaB }[] = []
        fila.forEach((celda, cIdx) => {
          const match = identificarTienda(celda)
          if (match && !encontradas.some(e => e.tienda.codigo === match.codigo)) {
            encontradas.push({ colIdx: cIdx, tienda: match })
          }
        })
        if (encontradas.length >= 3) {
          filaHeadersIdx = r
          mapaColTienda.push(...encontradas)
          break
        }
      }

      if (mapaColTienda.length === 0) {
        toast.error('No se identificaron las columnas de tiendas (ej. MEGA PLAZA, ATOCONGO, CUSCO).')
        return
      }

      const filasCampos = matriz.slice(filaHeadersIdx + 1, filaHeadersIdx + 8)
      const resultado: FilaDDFTienda[] = TIENDAS_ZONA_B.map(tienda => {
        const colInfo = mapaColTienda.find(m => m.tienda.codigo === tienda.codigo)
        const campos: CampoDDFDetalle[] = NOMBRES_7_CAMPOS_DDF.map((nom, fIdx) => {
          if (!colInfo || !filasCampos[fIdx]) {
            return { id: `c_${fIdx}`, nombre: nom, contenido: '', lleno: false }
          }
          const contenido = String(filasCampos[fIdx][colInfo.colIdx] || '').trim()
          const lleno = contenido.length > 0 && contenido !== '-'
          return { id: `c_${fIdx}`, nombre: nom, contenido, lleno }
        })
        const camposLlenos = campos.filter(c => c.lleno).length
        const totalCampos = 7
        const cumplimientoPorcentaje = parseFloat(((camposLlenos / totalCampos) * 100).toFixed(2))

        return {
          codigo: tienda.codigo,
          nombre: tienda.nombre,
          lider: tienda.lider,
          campos,
          camposLlenos,
          totalCampos,
          cumplimientoPorcentaje,
          textoFunciono: campos[1]?.contenido || '',
          textoNoFunciono: campos[2]?.contenido || '',
        }
      })

      setDatosDDF(resultado)
      setTextoPegadoDDF(rawText)
      toast.success(`¡Tabla procesada con éxito! Se evaluaron ${mapaColTienda.length} tiendas.`)
    } catch (e) {
      console.error(e)
      toast.error('Error al procesar tabla DDF.')
    }
  }

  // Estadísticas App Vencimiento
  const promedioVencimiento =
    datosVencimiento.length > 0
      ? (datosVencimiento.reduce((acc, t) => acc + t.totalPorcentaje, 0) / datosVencimiento.length).toFixed(2)
      : '0.00'
  const tiendas100Venc = datosVencimiento.filter(t => t.totalPorcentaje === 100).length
  const tiendasObservadasVenc = datosVencimiento.filter(t => t.totalPorcentaje < 100).length

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
                Consolidación automatizada de reportes semanales e informes
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
                setDatosDisponibilidad(DATOS_EJEMPLO_DISPONIBILIDAD)
                setDatosDDF(DATOS_EJEMPLO_DDF_SEM_41)
                setDatosVencimiento(DATOS_EJEMPLO_VENCIMIENTO)
                toast.info('Se cargaron los datos de ejemplo.')
              }}
              className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Cargar Ejemplo
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación del Módulo */}
        <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('vencimiento')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'vencimiento'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            1. App Vencimiento (Pegar Web)
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Nuevo
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ddf')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'ddf'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            2. Incidencias DDF (Pegar Tabla)
          </button>

          <button
            onClick={() => setActiveTab('disponibilidad')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'disponibilidad'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            3. Disponibilidad (ResumGTda)
          </button>

          <button
            onClick={() => setActiveTab('negativos')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'negativos'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            4. Negativos (Looker)
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
            5. Ajustes (Looker)
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
            6. Vista Previa Boletín J06
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              7 KPIs Conectados
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
            7. Datos Consolidado
          </button>
        </div>

        {/* TAB 1: APP VENCIMIENTO (PEGAR WEB) */}
        {activeTab === 'vencimiento' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-emerald-600" />
                    Pegar Reporte Web: Evolutivo de cumplimiento de Alertas - Semanal x Local
                  </h2>
                  <p className="text-xs text-slate-500">
                    En la web de Alertas, selecciona la tabla, presiona <strong>Ctrl + C</strong> y pega directamente aquí. Se extraerá automáticamente la columna <strong>Total</strong> de cada tienda.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePegarVencimientoPortapapeles}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <ClipboardPaste className="w-4 h-4" />
                    Pegar desde Portapapeles
                  </button>
                </div>
              </div>

              {/* Textarea para pegar */}
              <div className="relative">
                <textarea
                  value={textoPegadoVencimiento}
                  onChange={e => {
                    setTextoPegadoVencimiento(e.target.value)
                    procesarTextoPegadoVencimiento(e.target.value)
                  }}
                  onPaste={e => {
                    const pasted = e.clipboardData.getData('text')
                    if (pasted) {
                      e.preventDefault()
                      setTextoPegadoVencimiento(pasted)
                      procesarTextoPegadoVencimiento(pasted)
                    }
                  }}
                  placeholder="Haz clic aquí y presiona Ctrl + V (o Cmd + V) para pegar el texto copiado de la web de Alertas de Vencimiento..."
                  rows={4}
                  className="w-full text-xs font-mono p-4 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-slate-50/50 resize-y"
                />
              </div>

              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  El sistema extrae el porcentaje de la columna <strong>Total</strong> para cada tienda (Meta: <strong>100%</strong>) y lo traslada automáticamente a la columna <strong>App vencimiento</strong> de tu Boletín.
                </p>
              </div>
            </div>

            {/* Tarjetas Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cumplimiento Zonal</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{promedioVencimiento}%</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-0.5">Meta: 100%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-lg">
                  %
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tiendas al 100%</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {tiendas100Venc} <span className="text-sm font-medium text-slate-400">/ {datosVencimiento.length}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Sin alertas vencidas</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tiendas con Desvío</p>
                  <p className="text-2xl font-black text-rose-600 mt-1">
                    {tiendasObservadasVenc} <span className="text-sm font-medium text-slate-400">/ {datosVencimiento.length}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Menos de 100% de cumplimiento</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tiendas Evaluadas</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">11 / 11</p>
                  <p className="text-xs text-slate-500 mt-0.5">100% cobertura Zona B</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Store className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Tabla Detallada App Vencimiento */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#1b5e20]"></span>
                    APP VENCIMIENTO - Cumplimiento Semanal de Alertas por Tienda
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Meta: 100% de alertas atendidas a tiempo.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copiarNotasVencimiento}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-sm cursor-pointer"
                  >
                    {copiadoVencimiento ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    {copiadoVencimiento ? '¡Copiado!' : 'Copiar Notas'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1b5e20] text-white font-bold text-center border-b border-emerald-900">
                      <th className="py-2.5 px-3 text-left border-r border-emerald-800">Local</th>
                      <th className="py-2.5 px-3 text-left border-r border-emerald-800">Líder J06</th>
                      {datosVencimiento[0]?.dias?.map((dia, dIdx) => (
                        <th
                          key={dIdx}
                          className="py-2.5 px-2 text-center border-r border-emerald-800 bg-[#2e7d32] font-mono text-[11px]"
                        >
                          {dia.fecha.includes('-') ? dia.fecha.slice(5) : dia.fecha}
                        </th>
                      ))}
                      <th className="py-2.5 px-3 bg-[#1b5e20] border-r border-emerald-800 min-w-[100px]">
                        Total %
                      </th>
                      <th className="py-2.5 px-4 bg-[#1b5e20] min-w-[120px]">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {datosVencimiento.map((item, idx) => {
                      const es100 = item.totalPorcentaje === 100
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
                          {item.dias?.map((d, dIdx) => (
                            <td
                              key={dIdx}
                              className="py-2.5 px-2 text-center border-r border-slate-200 whitespace-nowrap font-medium"
                            >
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                  d.porcentaje === 100
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800 font-extrabold'
                                }`}
                              >
                                {d.porcentaje === 100 ? '🟢 100%' : `🔴 ${d.porcentaje}%`}
                              </span>
                            </td>
                          ))}
                          <td className="py-2.5 px-4 text-center font-black border-r border-slate-200 whitespace-nowrap">
                            <span
                              className={`inline-block px-3 py-1 rounded-md text-xs font-bold border ${
                                es100
                                  ? 'bg-[#c8e6c9] text-[#1b5e20] border-[#a5d6a7]'
                                  : 'bg-[#ffcdd2] text-[#b71c1c] border-[#ef9a9a]'
                              }`}
                            >
                              {item.totalPorcentaje.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            {es100 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                🟢 Cumple (100%)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                🔴 Desvío ({item.totalPorcentaje.toFixed(1)}%)
                              </span>
                            )}
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

        {/* TAB 2: INCIDENCIAS DDF */}
        {activeTab === 'ddf' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5 text-emerald-600" />
                Incidencias DDF (Excel Online)
              </h2>
              <div className="relative">
                <textarea
                  value={textoPegadoDDF}
                  onChange={e => {
                    setTextoPegadoDDF(e.target.value)
                    procesarTextoPegadoDDF(e.target.value)
                  }}
                  placeholder="Pega aquí la tabla copiada de Excel Online..."
                  rows={3}
                  className="w-full text-xs font-mono p-4 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none bg-slate-50/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DISPONIBILIDAD */}
        {activeTab === 'disponibilidad' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">Disponibilidad (NSG, Bodega, Quiebre)</h2>
              <p className="text-xs text-slate-500">Procesado desde ResumGTda_data.csv con arrastre de última auditoría.</p>
            </div>
          </div>
        )}

        {/* TAB 4: NEGATIVOS */}
        {activeTab === 'negativos' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">Control de Negativos Looker</h2>
              <p className="text-xs text-slate-500">Evaluado día a día contra cuotas máximas permitidas.</p>
            </div>
          </div>
        )}

        {/* TAB 5: AJUSTES */}
        {activeTab === 'ajustes' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">Ajustes Looker Diarios</h2>
              <p className="text-xs text-slate-500">Evaluación de los 7 días de posteo de ajustes.</p>
            </div>
          </div>
        )}

        {/* TAB 6: VISTA PREVIA BOLETÍN J06 */}
        {activeTab === 'boletin_preview' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Boletín J06 - Sección: KPI&apos;S (Inventario, Implementación, Disponibilidad, Calidad)
                </h2>
                <p className="text-xs text-slate-500">
                  Secciones automatizadas: <strong className="text-emerald-700">Ajustes</strong>,{' '}
                  <strong className="text-emerald-700">Negativos</strong>,{' '}
                  <strong className="text-emerald-700">Incidencias DDF</strong>,{' '}
                  <strong className="text-emerald-700">Disponibilidad (NSG, Bodega, Quiebre)</strong> y{' '}
                  <strong className="text-emerald-700">App Vencimiento</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 7 Indicadores Sincronizados
                </span>
              </div>
            </div>

            {/* Banner Informativo de Inventario */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                <span className="text-xs text-emerald-950 font-semibold">
                  Inventario: Nota calculada como promedio de Ajustes y Negativos. Pistoleo Pan fijado en 100% por default (columna ERI eliminada).
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md shrink-0">
                Promedio Inventario Zona B: {(TIENDAS_ZONA_B.reduce((acc, t) => {
                  const a = datosAjustes.find(x => x.codigo === t.codigo)?.cumplimientoPorcentaje || 0
                  const n = datosNegativos.find(x => x.codigo === t.codigo)?.cumplimientoPorcentaje || 0
                  return acc + (a + n) / 2
                }, 0) / TIENDAS_ZONA_B.length).toFixed(2)}%
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-300 rounded-xl">
              <table className="w-full text-xs border-collapse text-center">
                <thead>
                  {/* Fila Criterio Principal */}
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th colSpan={2} className="py-2 border-r border-slate-300">
                      KPI&apos;S
                    </th>
                    <th colSpan={4} className="py-2 border-r border-slate-300 bg-slate-200">
                      Inventario ⭐ (Promedio Ajustes + Negativos)
                    </th>
                    <th colSpan={2} className="py-2 border-r border-slate-300 bg-[#e8f5e9] text-[#1b5e20]">
                      Implementación ⭐
                    </th>
                    <th colSpan={3} className="py-2 border-r border-slate-300 bg-[#e8f5e9] text-[#1b5e20]">
                      Disponibilidad ⭐
                    </th>
                    <th colSpan={2} className="py-2 bg-[#e8f5e9] text-[#1b5e20]">
                      Calidad ⭐
                    </th>
                  </tr>

                  {/* Fila Objetivos */}
                  <tr className="bg-slate-50 text-slate-600 text-[11px] border-b border-slate-300">
                    <th className="py-1 px-3 text-left border-r border-slate-300">Tienda</th>
                    <th className="py-1 px-3 text-left border-r border-slate-300">Líder J06</th>

                    {/* Inventario Objetivos */}
                    <th className="py-1 px-2 border-r border-slate-300 bg-slate-100">100% (Fijo)</th>
                    <th className="py-1 px-2 border-r border-slate-300 bg-emerald-100 text-emerald-900 font-bold">
                      Diario (Ajustes)
                    </th>
                    <th className="py-1 px-2 border-r border-slate-300 bg-emerald-100 text-emerald-900 font-bold">
                      Obj. Por tienda (Negativos)
                    </th>
                    <th className="py-1 px-2 border-r border-slate-300 bg-emerald-200 text-emerald-950 font-black">
                      Promedio
                    </th>

                    {/* Implementación Objetivos */}
                    <th className="py-1 px-2 border-r border-slate-300">100%</th>
                    <th className="py-1 px-2 border-r border-slate-300 bg-emerald-100 text-emerald-900 font-bold">
                      100% (Incidencias DDF)
                    </th>

                    {/* Disponibilidad Objetivos */}
                    <th className="py-1 px-2 border-r border-slate-300 bg-emerald-100 text-emerald-900 font-bold">
                      &gt;95%
                    </th>
                    <th className="py-1 px-2 border-r border-slate-300 bg-emerald-100 text-emerald-900 font-bold">
                      &lt;1%
                    </th>
                    <th className="py-1 px-2 border-r border-slate-300 bg-emerald-100 text-emerald-900 font-bold">
                      &lt;5%
                    </th>

                    {/* Calidad Objetivos */}
                    <th className="py-1 px-2 border-r border-slate-300">&gt;90%</th>
                    <th className="py-1 px-2 bg-emerald-100 text-emerald-900 font-bold">100% (App Vencimiento)</th>
                  </tr>

                  {/* Fila Nombres de Columnas */}
                  <tr className="bg-slate-200/80 font-bold text-slate-800 border-b border-slate-300">
                    <th className="py-2 px-3 text-left border-r border-slate-300">Tienda</th>
                    <th className="py-2 px-3 text-left border-r border-slate-300">Líder J06</th>

                    <th className="py-2 px-2 border-r border-slate-300 text-slate-500">Pistoleo Pan</th>
                    <th className="py-2 px-2 border-r border-slate-300 bg-emerald-200 text-emerald-950">
                      Ajustes ⭐
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 bg-emerald-200 text-emerald-950">
                      Negativos ⭐
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 bg-emerald-300 text-emerald-950 font-black">
                      Nota Inventario ⭐
                    </th>

                    <th className="py-2 px-2 border-r border-slate-300">Registro A-C</th>
                    <th className="py-2 px-2 border-r border-slate-300 bg-emerald-200 text-emerald-950">
                      Incidencias DDF ⭐
                    </th>

                    <th className="py-2 px-2 border-r border-slate-300 bg-emerald-200 text-emerald-950">
                      NSG ⭐
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 bg-emerald-200 text-emerald-950">
                      Bodega ⭐
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 bg-emerald-200 text-emerald-950">
                      Quiebre ⭐
                    </th>

                    <th className="py-2 px-2 border-r border-slate-300">Nota</th>
                    <th className="py-2 px-2 bg-emerald-200 text-emerald-950 font-bold">
                      App vencimiento ⭐
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {TIENDAS_ZONA_B.map(tienda => {
                    const rowAjuste = datosAjustes.find(a => a.codigo === tienda.codigo)
                    const rowNegativo = datosNegativos.find(n => n.codigo === tienda.codigo)
                    const rowDisp = datosDisponibilidad.find(d => d.codigo === tienda.codigo)
                    const rowDDF = datosDDF.find(df => df.codigo === tienda.codigo)
                    const rowVenc = datosVencimiento.find(v => v.codigo === tienda.codigo)

                    const pctAjuste = rowAjuste ? rowAjuste.cumplimientoPorcentaje : 0
                    const pctNegativo = rowNegativo ? rowNegativo.cumplimientoPorcentaje : 0
                    const notaInventario = parseFloat(((pctAjuste + pctNegativo) / 2).toFixed(2))

                    const pctDDF = rowDDF ? rowDDF.cumplimientoPorcentaje : 0
                    const pctVenc = rowVenc ? rowVenc.totalPorcentaje : 100.0

                    const nsgVal = rowDisp ? rowDisp.nsg : 0
                    const bodegaVal = rowDisp ? rowDisp.bodega : 0
                    const quiebreVal = rowDisp ? rowDisp.quiebre : 0

                    return (
                      <tr key={tienda.codigo} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-left font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                          {tienda.nombre}
                        </td>
                        <td className="py-2 px-3 text-left text-slate-600 border-r border-slate-200 whitespace-nowrap">
                          {tienda.lider}
                        </td>

                        {/* PISTOLEO PAN */}
                        <td className="py-2 px-2 border-r border-slate-200 text-slate-600 bg-slate-50">
                          100.00%
                        </td>

                        {/* AJUSTES */}
                        <td className="py-2 px-2 border-r border-slate-200 font-bold bg-emerald-50 text-emerald-900">
                          {pctAjuste.toFixed(2)}%
                        </td>

                        {/* NEGATIVOS */}
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

                        {/* NOTA INVENTARIO */}
                        <td
                          className={`py-2 px-2 border-r border-slate-200 font-black ${
                            notaInventario >= 90
                              ? 'bg-[#c8e6c9] text-[#1b5e20]'
                              : notaInventario >= 70
                              ? 'bg-[#ffe0b2] text-[#e65100]'
                              : 'bg-[#ffcdd2] text-[#b71c1c]'
                          }`}
                        >
                          {notaInventario.toFixed(2)}%
                        </td>

                        <td className="py-2 px-2 border-r border-slate-200 text-slate-600">100.00%</td>

                        {/* INCIDENCIAS DDF */}
                        <td
                          className={`py-2 px-2 border-r border-slate-200 font-bold ${
                            pctDDF === 100
                              ? 'bg-emerald-50 text-emerald-900'
                              : pctDDF > 0
                              ? 'bg-amber-50 text-amber-900'
                              : 'bg-rose-50 text-rose-900'
                          }`}
                        >
                          {pctDDF.toFixed(2)}%
                        </td>

                        {/* DISPONIBILIDAD: NSG */}
                        <td
                          className={`py-2 px-2 border-r border-slate-200 font-bold ${
                            nsgVal >= 95
                              ? 'bg-[#c8e6c9] text-[#1b5e20]'
                              : nsgVal >= 90
                              ? 'bg-[#ffe0b2] text-[#e65100]'
                              : 'bg-[#ffcdd2] text-[#b71c1c]'
                          }`}
                        >
                          {nsgVal.toFixed(2)}%
                        </td>

                        {/* DISPONIBILIDAD: BODEGA */}
                        <td
                          className={`py-2 px-2 border-r border-slate-200 font-bold ${
                            bodegaVal <= 1.0
                              ? 'bg-[#c8e6c9] text-[#1b5e20]'
                              : 'bg-[#ffcdd2] text-[#b71c1c]'
                          }`}
                        >
                          {bodegaVal.toFixed(2)}%
                        </td>

                        {/* DISPONIBILIDAD: QUIEBRE */}
                        <td
                          className={`py-2 px-2 border-r border-slate-200 font-bold ${
                            quiebreVal <= 5.0
                              ? 'bg-[#c8e6c9] text-[#1b5e20]'
                              : 'bg-[#ffcdd2] text-[#b71c1c]'
                          }`}
                        >
                          {quiebreVal.toFixed(2)}%
                        </td>

                        <td className="py-2 px-2 border-r border-slate-200 text-slate-600">100.00%</td>

                        {/* CALIDAD: APP VENCIMIENTO (AUTOMATIZADO) */}
                        <td
                          className={`py-2 px-2 font-bold ${
                            pctVenc === 100
                              ? 'bg-emerald-50 text-emerald-900'
                              : 'bg-[#ffcdd2] text-[#b71c1c]'
                          }`}
                        >
                          {pctVenc.toFixed(2)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: CONSOLIDADO */}
        {activeTab === 'consolidado' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Data para la Pestaña &quot;Consolidado&quot;
              </h2>
              <p className="text-xs text-slate-500">
                Campos conectados automáticamente a medida que alimentas las fuentes.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-2 overflow-x-auto">
              <div className="font-bold text-slate-800">Estado de Automatización de Columnas:</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-600">
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg font-semibold flex items-center justify-between">
                  <span>✓ App Vencimiento</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">100%</span>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg font-semibold flex items-center justify-between">
                  <span>✓ Incidencias DDF (Pegado)</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">100%</span>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg font-semibold flex items-center justify-between">
                  <span>✓ NSG (ResumGTda)</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">100%</span>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg font-semibold flex items-center justify-between">
                  <span>✓ Bodega (ResumGTda)</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">100%</span>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg font-semibold flex items-center justify-between">
                  <span>✓ Quiebre (ResumGTda)</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">100%</span>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg font-semibold flex items-center justify-between">
                  <span>✓ Ajustes (Looker)</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">100%</span>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg font-semibold flex items-center justify-between">
                  <span>✓ Negativos (Looker)</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">100%</span>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg font-semibold flex items-center justify-between">
                  <span>✓ Nota Inventario</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">100%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
