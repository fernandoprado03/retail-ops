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
  CheckCircle,
  Award,
  Camera,
  CheckCheck,
  Minus,
  Plus,
  RotateCcw,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  X,
  ChevronRight,
  DollarSign
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

const PALABRAS_EXCLUIDAS_TIENDA = new Set([
  'SI',
  'NO',
  'SÍ',
  'APERTURA',
  'CIERRE',
  'TOTAL',
  'CUMPLIMIENTO',
  'FECHA',
  'DIA',
  'DÍA',
  'EVIDENCIA',
  'FOTOGRÁFICA',
  'FOTOGRAFICA',
  'LOCAL',
  'TIENDA',
])

export function identificarTienda(celda: string): TiendaZonaB | undefined {
  if (!celda) return undefined
  const celdaUpper = celda.toUpperCase().trim()
  if (!celdaUpper || PALABRAS_EXCLUIDAS_TIENDA.has(celdaUpper)) return undefined

  return TIENDAS_ZONA_B.find(t => {
    if (celdaUpper === t.codigo || celdaUpper.startsWith(t.codigo + '-') || celdaUpper.startsWith(t.codigo + ' ') || celdaUpper.includes(` ${t.codigo} `)) {
      return true
    }
    const aliases = ALIASES_TIENDAS[t.codigo] || []
    if (aliases.some(alias => celdaUpper === alias || (celdaUpper.length >= 4 && celdaUpper.includes(alias)) || (alias.length >= 4 && alias.includes(celdaUpper)))) {
      return true
    }
    const nombreSinCodigo = t.nombre.toUpperCase().replace(/^\d+\s*-\s*/, '').trim()
    if (celdaUpper === nombreSinCodigo || (celdaUpper.length >= 4 && celdaUpper.includes(nombreSinCodigo)) || (nombreSinCodigo.length >= 4 && nombreSinCodigo.includes(celdaUpper))) {
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

// Métricas base de scorecard de líderes Zona B
export const METRICAS_LIDERES_BASE: Record<
  string,
  { dotacion: number; produccion: number; merma: number; reporte: number; equipo: number; amabilidad: number }
> = {
  '103': { dotacion: 7.0, produccion: 99.00, merma: 99.84, reporte: 100.0, equipo: 100.0, amabilidad: 100.0 },
  '107': { dotacion: 3.0, produccion: 85.00, merma: 98.37, reporte: 100.0, equipo: 100.0, amabilidad: 101.0 },
  '110': { dotacion: 3.0, produccion: 90.00, merma: 92.48, reporte: 50.0,  equipo: 100.0, amabilidad: 106.0 },
  '118': { dotacion: 3.0, produccion: 92.00, merma: 98.09, reporte: 100.0, equipo: 100.0, amabilidad: 104.0 },
  '155': { dotacion: 3.0, produccion: 92.00, merma: 96.73, reporte: 100.0, equipo: 100.0, amabilidad: 103.0 },
  '175': { dotacion: 4.0, produccion: 92.00, merma: 98.49, reporte: 100.0, equipo: 100.0, amabilidad: 98.0 },
  '193': { dotacion: 4.0, produccion: 95.00, merma: 101.12, reporte: 100.0, equipo: 100.0, amabilidad: 102.0 },
  '311': { dotacion: 4.0, produccion: 92.00, merma: 95.34, reporte: 100.0, equipo: 100.0, amabilidad: 102.0 },
  '314': { dotacion: 2.0, produccion: 92.00, merma: 97.68, reporte: 100.0, equipo: 100.0, amabilidad: 105.0 },
  '335': { dotacion: 2.5, produccion: 66.00, merma: 92.29, reporte: 100.0, equipo: 100.0, amabilidad: 93.0 },
  '357': { dotacion: 3.0, produccion: 96.00, merma: 92.22, reporte: 100.0, equipo: 100.0, amabilidad: 108.0 },
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

// Interfaces Calidad Auditoría (Excel Online)
export interface FilaCalidadAuditoriaTienda {
  codigo: string
  nombre: string
  lider: string
  nota: number
  mesEvaluado: string
  esArrastre: boolean
  otrosComentarios?: string
}

// Interfaces Registro A-C (Evidencia Fotográfica Apertura y Cierre)
export interface SlotRegistroAC {
  fecha: string
  tipo: 'Apertura' | 'Cierre'
  cumple: boolean
}

export interface FilaRegistroACTienda {
  codigo: string
  nombre: string
  lider: string
  slots: SlotRegistroAC[]
  registrosCumplidos: number
  totalRegistros: number
  cumplimientoPorcentaje: number
}

// Interfaces Ventas Semanales (% Logro y % Crecimiento)
export interface FilaVentaTienda {
  codigo: string
  nombre: string
  lider: string
  ventaSoles: number
  metaSoles?: number
  logroPorcentaje: number
  crecimientoPorcentaje: number
  observaciones?: string
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

// Datos de muestra DDF (100% por default para todas las tiendas, con comentarios reales de la Semana 41)
const CONTENIDOS_DDF_DEFAULT: Record<
  string,
  { logro: string; funciono: string; noFunciono: string; quiebres: string; stock: string; liquidaciones: string; otros: string }
> = {
  '103': {
    logro: 'Logro 91.89% Crecimiento -3.23%',
    funciono: 'Táctico de fin de semana en enrollados de pizza y 2x1 en porciones',
    noFunciono: 'Promoción keke + gaseosa 1.5L tuvo baja rotación por precio',
    quiebres: 'Sin quiebres críticos reportados',
    stock: 'Sobre stock leve en kekes de naranja',
    liquidaciones: 'Liquidaciones al día aprobadas',
    otros: 'Solicitud de refuerzo de masa en panadería',
  },
  '107': {
    logro: 'Logro 130.1% Crecimiento 12%',
    funciono: 'FUNCIONO TODOS LOS TACTICOS DEL DIA DE PIZZA Y 2X1 DE FIN DE SEMANA',
    noFunciono: 'TODO OK con promociones de vitrina',
    quiebres: 'PAN MINI OCH',
    stock: 'SOBRE STOCK DE KEKES RECTANGULARES NARANJA, PLATANO, MARMOLEADO',
    liquidaciones: 'EN EL CASO DE LOS KEKES EL PRECIO FUE ATRACTIVO',
    otros: 'DISPONEMOS DE BUEN STOCK EN DONUTS',
  },
  '110': {
    logro: 'Logro 81.4% Crecimiento -9%',
    funciono: 'Kekes rectangulares 3x2, tortas, porciones de tortas',
    noFunciono: 'Combo torta + gaseosa 1.5L S/19.90',
    quiebres: 'Panes a granel salados, dulces y ciabatta',
    stock: 'Croissant, baguette clásico, enrollado de hot dog',
    liquidaciones: 'Se aprobaron liquidaciones solicitadas',
    otros: 'Revisar las cantidades de tortas con fechas cortas',
  },
  '118': {
    logro: 'Logro 89% Crecimiento -0.5%',
    funciono: 'Kekes x2 segundo por 40% en panes de la casa integral/multigrano',
    noFunciono: 'TORTA TRES LECHE MEDIANA DE CHOCOLATE/VAINILLA/LUCUMA',
    quiebres: 'Harina sin preparar blanca y premezcla',
    stock: 'CROISSANT X 6 UND, MINI CROISSANT X 12 UND',
    liquidaciones: 'Si fueron aprobados pero el precio no fue bueno',
    otros: 'Revisar el envío de panes embolsados por sobre stock',
  },
  '155': {
    logro: 'Logro 85% Crecimiento -16.1%',
    funciono: '162 en kekes rectangulares de fin de semana',
    noFunciono: 'CHOCOLATE/VAINILLA/LUCUMA + GASEOSA INKA 1.5L S/19.9 CON CMR S/17.9',
    quiebres: 'PREQUIEBRO EN PAN FRANCES, PAN INTEGRAL, CIABATTA',
    stock: 'HOY NOS LLEGO 22 MASA DE PITIPAN Y YA TENIAMOS 15 JABAS',
    liquidaciones: 'SI FUERON APROBADAS LAS SOLICITADAS',
    otros: 'SOLO TENEMOS UNA MAQUINARIA DE CORTE',
  },
  '175': {
    logro: 'Logro 91.20% Crecimiento -4.90%',
    funciono: 'Pan ciabatta y baguette en horas punta de tarde',
    noFunciono: 'Kekes redondos de plátano con baja salida',
    quiebres: 'Premezcla para keke marmoleado',
    stock: 'Pan de molde integral con fechas cortas',
    liquidaciones: 'Liquidaciones ejecutadas a tiempo',
    otros: 'Buena respuesta del público en fin de semana',
  },
  '193': {
    logro: 'Logro 100.85% Crecimiento 11.99%',
    funciono: 'PROMOCIONES DE KEKES RECTANGULARES Y ENROLLADOS DE HOT DOG',
    noFunciono: 'PROMOCION PANES DE LA CASA SE TUVO QUE LIQUIDAR',
    quiebres: 'ENROLLADO DE HOT DOG, PALETA CARAMELO',
    stock: 'TORTA RED VELVET, TORTA VAINILLA Y GRANDE REAL',
    liquidaciones: 'SI FUERON APROBADAS Y MOVILIZADAS',
    otros: 'VIENE SOLICITANDO QUE SUBAN LAS CANTIDADES DE TORTAS',
  },
  '311': {
    logro: 'Logro 84.79% Crecimiento -9.79%',
    funciono: '3X2 EN KEKES RECTANGULARES DE MARACUYA, FRESA Y CHOCOLATE',
    noFunciono: 'SEGUNDO POR 40% EN PAN DE LA CASA INTEGRAL',
    quiebres: 'PAN FRANCES, PAN CIABATTA, PAN CARIOCA',
    stock: 'SOBRESTOCK EN COMBO VASOS MANGA 8 OZ',
    liquidaciones: 'APOYARON CON LAS LIQUIDACIONES SOLICITADAS',
    otros: 'NOS ESTAN ENVIANDO SOBRE STOCK DE EMPAQUES',
  },
  '314': {
    logro: 'Logro 95.84% Crecimiento -0.95%',
    funciono: '3X2 EN KEKES RECTANGULARES, SEGUNDO POR 40% EN PANES DE LA CASA',
    noFunciono: '2X1 EN BEBIDAS DE MARACUYA Y CHOCOLATE',
    quiebres: 'PAN CIABATTA CLASICO, ALFAJORES X 10 U',
    stock: 'BAGUETTE ARTESANO X 1 UN, PAN CIABATTA',
    liquidaciones: 'TODAS SE APROBARON EN TIEMPO',
    otros: 'VALIDAR EL ENVIO Y SOBRE STOCK DE PITIPAN',
  },
  '335': {
    logro: 'Logro 51.4% Crecimiento -9%',
    funciono: '3 X 2 EN KEKES RECTANGULARES 2 X 1 EN PORCIONES DE TORTA',
    noFunciono: 'No funcionó el 40% dcto en panes de la casa',
    quiebres: 'Torta de piña, torta de maracuyá, tartaleta de fresa',
    stock: 'Jaba de pan yema, pan carioca, pan hot dog embolsado',
    liquidaciones: 'Durante la semana no fueron aprobadas todas las que se pidieron',
    otros: 'Controlar el abastecimiento de pan laminados y kekes',
  },
  '357': {
    logro: 'Logro 104.8% Crecimiento 7.6%',
    funciono: '3 X 2 EN KEKES RECTANGULARES 2 X 1 EN PORCIONES DE TORTA',
    noFunciono: 'TORTA TRES LECHE MEDIANA DE CHOCOLATE/VAINILLA/LUCUMA + GASEOSA',
    quiebres: 'Pan Congelado embolsado x 6 und, pan ciabatta, pan carioca',
    stock: 'Croissant, baguette clásico, pan carioca, pan hot dog embolsado',
    liquidaciones: 'No se aprobaron todas las liquidaciones',
    otros: 'El tiempo de vida útil de los productos enviados a tienda es muy corto',
  },
}

const DATOS_EJEMPLO_DDF_SEM_41: FilaDDFTienda[] = TIENDAS_ZONA_B.map(t => {
  const c = CONTENIDOS_DDF_DEFAULT[t.codigo] || {
    logro: 'Logro 100% Crecimiento 0%',
    funciono: 'Tácticos de fin de semana y porciones de torta',
    noFunciono: 'Promociones combo con bebida',
    quiebres: 'Sin quiebres críticos',
    stock: 'Control de inventario al día',
    liquidaciones: 'Liquidaciones autorizadas',
    otros: 'Operación en panadería y pastelería conforme',
  }
  const campos: CampoDDFDetalle[] = [
    { id: 'c_0', nombre: NOMBRES_7_CAMPOS_DDF[0], contenido: c.logro, lleno: true },
    { id: 'c_1', nombre: NOMBRES_7_CAMPOS_DDF[1], contenido: c.funciono, lleno: true },
    { id: 'c_2', nombre: NOMBRES_7_CAMPOS_DDF[2], contenido: c.noFunciono, lleno: true },
    { id: 'c_3', nombre: NOMBRES_7_CAMPOS_DDF[3], contenido: c.quiebres, lleno: true },
    { id: 'c_4', nombre: NOMBRES_7_CAMPOS_DDF[4], contenido: c.stock, lleno: true },
    { id: 'c_5', nombre: NOMBRES_7_CAMPOS_DDF[5], contenido: c.liquidaciones, lleno: true },
    { id: 'c_6', nombre: NOMBRES_7_CAMPOS_DDF[6], contenido: c.otros, lleno: true },
  ]
  return {
    codigo: t.codigo,
    nombre: t.nombre,
    lider: t.lider,
    campos,
    camposLlenos: 7,
    totalCampos: 7,
    cumplimientoPorcentaje: 100.0,
    textoFunciono: c.funciono,
    textoNoFunciono: c.noFunciono,
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

// Datos de muestra Calidad Auditoría (Valores del reporte Excel de Septiembre con arrastre a Octubre)
const DATOS_EJEMPLO_CALIDAD_AUDITORIA: FilaCalidadAuditoriaTienda[] = [
  { codigo: '103', nombre: '103 - Mega Plaza', lider: 'Ronny Mario Colque Sanchez', nota: 100.0, mesEvaluado: 'Septiembre (Arrastre)', esArrastre: true },
  { codigo: '107', nombre: '107 - Atocongo', lider: 'Edgar Wuffarden', nota: 87.0, mesEvaluado: 'Septiembre (Arrastre)', esArrastre: true, otrosComentarios: '22 de Setiembre Inventario de Perecibles' },
  { codigo: '110', nombre: '110 - Huaylas', lider: 'Gerson Pichi Javier', nota: 94.74, mesEvaluado: 'Septiembre (Arrastre)', esArrastre: true },
  { codigo: '118', nombre: '118 - Bellavista', lider: 'Miguel Vernales Sanchez', nota: 100.0, mesEvaluado: 'Septiembre (Arrastre)', esArrastre: true },
  { codigo: '155', nombre: '155 - Santa Anita', lider: 'Oneida rojas castro', nota: 87.01, mesEvaluado: 'Septiembre (Arrastre)', esArrastre: true },
  { codigo: '175', nombre: '175 - Lima Sur', lider: 'Victor Mejia', nota: 95.0, mesEvaluado: 'Septiembre (Arrastre)', esArrastre: true },
  { codigo: '193', nombre: '193 - Puruchuco', lider: 'Eyder Mego Quispe', nota: 99.0, mesEvaluado: 'Septiembre (Arrastre)', esArrastre: true },
  { codigo: '311', nombre: '311 - Trujillo 1', lider: 'Gustavo Carassaz', nota: 88.0, mesEvaluado: 'Septiembre (Arrastre)', esArrastre: true, otrosComentarios: '22 - 23 de septiembre Inventario de Perecibles' },
  { codigo: '314', nombre: '314 - Trujillo 2', lider: 'Cynthia Caycho Malca', nota: 78.0, mesEvaluado: 'Septiembre (Arrastre)', esArrastre: true },
  { codigo: '335', nombre: '335 - Chimbote', lider: 'Mariela Lisseth López Dominguez', nota: 88.0, mesEvaluado: 'Septiembre (Arrastre)', esArrastre: true },
  { codigo: '357', nombre: '357 - Cusco La Cultura', lider: 'Enzo Danilo Parodi Portugal', nota: 96.0, mesEvaluado: 'Septiembre (Arrastre)', esArrastre: true },
]

// Fechas y generador para Registro A-C (Apertura y Cierre)
const FECHAS_REGISTRO_AC_DEFAULT = [
  '5-Oct',
  '6-Oct',
  '7-Oct',
  '8-Oct',
  '9-Oct',
  '10-Oct',
  '11-Oct',
]

function generarSlotsACDefault(todasCumplen = true): SlotRegistroAC[] {
  const slots: SlotRegistroAC[] = []
  FECHAS_REGISTRO_AC_DEFAULT.forEach(fecha => {
    slots.push({ fecha, tipo: 'Apertura', cumple: todasCumplen })
    slots.push({ fecha, tipo: 'Cierre', cumple: todasCumplen })
  })
  return slots
}

// Datos de muestra Registro A-C (100% por default con 14 registros completos para todas las tiendas)
const DATOS_EJEMPLO_REGISTRO_AC: FilaRegistroACTienda[] = TIENDAS_ZONA_B.map(t => {
  const slots = generarSlotsACDefault(true)
  return {
    codigo: t.codigo,
    nombre: t.nombre,
    lider: t.lider,
    slots,
    registrosCumplidos: 14,
    totalRegistros: 14,
    cumplimientoPorcentaje: 100.0,
  }
})

// Datos de muestra Ventas Semanales (Semana 41 / Detalle KPI's oficial)
export const DATOS_EJEMPLO_VENTA: FilaVentaTienda[] = [
  { codigo: '103', nombre: '103 - Mega Plaza', lider: 'Ronny Mario Colque Sanchez', ventaSoles: 88096, metaSoles: 88651, logroPorcentaje: 99.4, crecimientoPorcentaje: 4.5 },
  { codigo: '107', nombre: '107 - Atocongo', lider: 'Edgar Wuffarden', ventaSoles: 41662, metaSoles: 36450, logroPorcentaje: 114.3, crecimientoPorcentaje: 17.0 },
  { codigo: '110', nombre: '110 - Huaylas', lider: 'Gerson Pichi Javier', ventaSoles: 36135, metaSoles: 34664, logroPorcentaje: 104.2, crecimientoPorcentaje: 7.1 },
  { codigo: '118', nombre: '118 - Bellavista', lider: 'Miguel Vernales Sanchez', ventaSoles: 44840, metaSoles: 49168, logroPorcentaje: 91.2, crecimientoPorcentaje: -0.2 },
  { codigo: '155', nombre: '155 - Santa Anita', lider: 'Oneida rojas castro', ventaSoles: 54145, metaSoles: 63872, logroPorcentaje: 84.8, crecimientoPorcentaje: -13.2 },
  { codigo: '175', nombre: '175 - Lima Sur', lider: 'Victor Mejia', ventaSoles: 69596, metaSoles: 72818, logroPorcentaje: 95.6, crecimientoPorcentaje: -1.0 },
  { codigo: '193', nombre: '193 - Puruchuco', lider: 'Eyder Mego Quispe', ventaSoles: 57233, metaSoles: 55337, logroPorcentaje: 103.4, crecimientoPorcentaje: 0.2 },
  { codigo: '311', nombre: '311 - Trujillo 1', lider: 'Gustavo Carassaz', ventaSoles: 49028, metaSoles: 56313, logroPorcentaje: 87.1, crecimientoPorcentaje: -11.9 },
  { codigo: '314', nombre: '314 - Trujillo 2', lider: 'Cynthia Caycho Malca', ventaSoles: 30385, metaSoles: 32643, logroPorcentaje: 93.1, crecimientoPorcentaje: -6.5 },
  { codigo: '335', nombre: '335 - Chimbote', lider: 'Mariela Lisseth López Dominguez', ventaSoles: 22900, metaSoles: 27594, logroPorcentaje: 83.0, crecimientoPorcentaje: -10.4 },
  { codigo: '357', nombre: '357 - Cusco La Cultura', lider: 'Enzo Danilo Parodi Portugal', ventaSoles: 28283, metaSoles: 26331, logroPorcentaje: 107.4, crecimientoPorcentaje: 7.7 },
]

export default function BoletinJ06Page() {
  const [activeTab, setActiveTab] = useState<
    'ventas' | 'vencimiento' | 'calidad_auditoria' | 'registro_ac' | 'ddf' | 'disponibilidad' | 'negativos' | 'ajustes' | 'boletin_preview' | 'consolidado'
  >('ventas')

  // Estado Ventas (% Logro y % Crecimiento)
  const [datosVenta, setDatosVenta] = useState<FilaVentaTienda[]>(DATOS_EJEMPLO_VENTA)
  const [textoPegadoVenta, setTextoPegadoVenta] = useState<string>('')
  const [copiadoVenta, setCopiadoVenta] = useState(false)
  const [ventaTotalBannerManual, setVentaTotalBannerManual] = useState<number>(522302)
  const [usarTotalBannerManual, setUsarTotalBannerManual] = useState<boolean>(true)
  const [cumplimientoBannerManual, setCumplimientoBannerManual] = useState<number>(96.0)
  const [crecimientoBannerManual, setCrecimientoBannerManual] = useState<number>(-1.2)

  // Estado App Vencimiento
  const [datosVencimiento, setDatosVencimiento] = useState<FilaAppVencimientoTienda[]>(DATOS_EJEMPLO_VENCIMIENTO)
  const [textoPegadoVencimiento, setTextoPegadoVencimiento] = useState<string>('')
  const [copiadoVencimiento, setCopiadoVencimiento] = useState(false)

  // Estado Calidad Auditoría
  const [datosCalidadAuditoria, setDatosCalidadAuditoria] = useState<FilaCalidadAuditoriaTienda[]>(DATOS_EJEMPLO_CALIDAD_AUDITORIA)
  const [textoPegadoCalidad, setTextoPegadoCalidad] = useState<string>('')
  const [copiadoCalidad, setCopiadoCalidad] = useState(false)
  const [mesObjetivoAuditoria, setMesObjetivoAuditoria] = useState<string>('octubre')

  // Estado Registro A-C (Evidencia Fotográfica Apertura y Cierre)
  const [datosRegistroAC, setDatosRegistroAC] = useState<FilaRegistroACTienda[]>(DATOS_EJEMPLO_REGISTRO_AC)
  const [fechasAC, setFechasAC] = useState<string[]>(FECHAS_REGISTRO_AC_DEFAULT)
  const [textoPegadoAC, setTextoPegadoAC] = useState<string>('')
  const [copiadoAC, setCopiadoAC] = useState(false)

  // Estado DDF
  const [datosDDF, setDatosDDF] = useState<FilaDDFTienda[]>(DATOS_EJEMPLO_DDF_SEM_41)
  const [textoPegadoDDF, setTextoPegadoDDF] = useState<string>('')
  const [copiadoDDF, setCopiadoDDF] = useState(false)
  const [tiendaDDFDetalle, setTiendaDDFDetalle] = useState<FilaDDFTienda | null>(null)
  const [copiadoSintesisDDF, setCopiadoSintesisDDF] = useState(false)

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

  // Procesar Texto Pegado de Auditoría de Calidad (Excel Online)
  const procesarTextoPegadoCalidad = (rawText: string, mesTarget?: string) => {
    if (!rawText || rawText.trim().length === 0) {
      toast.error('El portapapeles está vacío o no contiene texto.')
      return
    }

    try {
      const mesObjetivo = (mesTarget || mesObjetivoAuditoria || 'octubre').toLowerCase()
      const MESES_LISTA = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ]
      const targetMesIdx = MESES_LISTA.indexOf(mesObjetivo) !== -1 ? MESES_LISTA.indexOf(mesObjetivo) : 9

      const rows = parseTSVWithQuotes(rawText)
      const isTSV = rows.length > 1 && rows[0].length >= 2

      if (isTSV) {
        let headerRowIdx = -1
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          const rowText = rows[i].join(' ').toLowerCase()
          if (rowText.includes('tienda') || rowText.includes('calidad') || rowText.includes('septiembre') || rowText.includes('setiembre')) {
            headerRowIdx = i
            break
          }
        }

        const headerRow = headerRowIdx !== -1 ? rows[headerRowIdx] : []
        const colMap: Record<string, { notaCol: number; otrosCol: number }> = {}

        if (headerRow.length > 0) {
          headerRow.forEach((h, colIdx) => {
            const hLower = h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            MESES_LISTA.forEach(mes => {
              const mesNorm = mes === 'septiembre' ? '(?:septiembre|setiembre)' : mes
              const re = new RegExp(`\\b${mesNorm}\\b`, 'i')
              if (re.test(hLower)) {
                if (!colMap[mes]) {
                  colMap[mes] = { notaCol: colIdx, otrosCol: -1 }
                }
              }
            })
            if (hLower.includes('otros')) {
              const prevMes = Object.keys(colMap).reverse().find(m => colMap[m].otrosCol === -1)
              if (prevMes) {
                colMap[prevMes].otrosCol = colIdx
              }
            }
          })
        }

        const resultado: FilaCalidadAuditoriaTienda[] = TIENDAS_ZONA_B.map(t => {
          const storeRow = rows.find(r => r.some(c => identificarTienda(c)?.codigo === t.codigo))
          if (!storeRow) {
            const defaultItem = DATOS_EJEMPLO_CALIDAD_AUDITORIA.find(d => d.codigo === t.codigo)
            return defaultItem || {
              codigo: t.codigo,
              nombre: t.nombre,
              lider: t.lider,
              nota: 100,
              mesEvaluado: 'Sin Datos',
              esArrastre: false,
            }
          }

          let notaFinal: number | null = null
          let mesFinal = ''
          let esArrastre = false
          let otros = ''

          if (Object.keys(colMap).length > 0) {
            for (let i = targetMesIdx; i >= 0; i--) {
              const mes = MESES_LISTA[i]
              const cfg = colMap[mes]
              if (cfg && cfg.notaCol !== undefined && storeRow[cfg.notaCol]) {
                const cellVal = storeRow[cfg.notaCol].replace('%', '').replace(',', '.').trim()
                const val = parseFloat(cellVal)
                if (!isNaN(val) && val > 0) {
                  notaFinal = val
                  mesFinal = mes.charAt(0).toUpperCase() + mes.slice(1)
                  esArrastre = (mes !== mesObjetivo)
                  if (cfg.otrosCol !== -1 && storeRow[cfg.otrosCol]) {
                    otros = storeRow[cfg.otrosCol].trim()
                  }
                  break
                }
              }
            }
          }

          if (notaFinal === null) {
            for (let c = 1; c < storeRow.length; c++) {
              const cellVal = storeRow[c].replace('%', '').replace(',', '.').trim()
              const val = parseFloat(cellVal)
              if (!isNaN(val) && val > 0 && val <= 100) {
                notaFinal = val
                mesFinal = 'Septiembre'
                esArrastre = true
                if (storeRow[c + 1] && isNaN(parseFloat(storeRow[c + 1]))) {
                  otros = storeRow[c + 1].trim()
                }
                break
              }
            }
          }

          return {
            codigo: t.codigo,
            nombre: t.nombre,
            lider: t.lider,
            nota: notaFinal !== null ? notaFinal : 100,
            mesEvaluado: mesFinal ? (esArrastre ? `${mesFinal} (Arrastre)` : mesFinal) : 'Sin Datos',
            esArrastre,
            otrosComentarios: otros,
          }
        })

        setDatosCalidadAuditoria(resultado)
        setTextoPegadoCalidad(rawText)
        const arrastresCount = resultado.filter(r => r.esArrastre).length
        toast.success(
          `¡Calidad procesada! 11 tiendas sincronizadas (${arrastresCount} con arrastre).`
        )
        return
      }

      // Si no es TSV, procesar como texto plano multilínea
      const lineas = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
      const tiendasEncontradas: { idx: number; tienda: TiendaZonaB }[] = []
      lineas.forEach((l, idx) => {
        const match = identificarTienda(l)
        if (match && !tiendasEncontradas.some(item => item.tienda.codigo === match.codigo)) {
          tiendasEncontradas.push({ idx, tienda: match })
        }
      })

      if (tiendasEncontradas.length > 0) {
        const resultado: FilaCalidadAuditoriaTienda[] = TIENDAS_ZONA_B.map(t => {
          const matchIdx = tiendasEncontradas.findIndex(item => item.tienda.codigo === t.codigo)
          if (matchIdx === -1) {
            const def = DATOS_EJEMPLO_CALIDAD_AUDITORIA.find(d => d.codigo === t.codigo)
            return def || {
              codigo: t.codigo,
              nombre: t.nombre,
              lider: t.lider,
              nota: 100,
              mesEvaluado: 'Sin Datos',
              esArrastre: false,
            }
          }

          const currentStore = tiendasEncontradas[matchIdx]
          const nextStoreIdx = matchIdx < tiendasEncontradas.length - 1 ? tiendasEncontradas[matchIdx + 1].idx : lineas.length
          const chunk = lineas.slice(currentStore.idx + 1, nextStoreIdx)

          let nota = 100
          let otros = ''
          for (const item of chunk) {
            const clean = item.replace('%', '').replace(',', '.').trim()
            const num = parseFloat(clean)
            if (!isNaN(num) && num > 0 && num <= 100) {
              nota = num
            } else if (item.toLowerCase().includes('inventario') || item.toLowerCase().includes('perecible') || item.length > 5) {
              otros = item
            }
          }

          return {
            codigo: t.codigo,
            nombre: t.nombre,
            lider: t.lider,
            nota,
            mesEvaluado: 'Septiembre (Arrastre)',
            esArrastre: true,
            otrosComentarios: otros,
          }
        })

        setDatosCalidadAuditoria(resultado)
        setTextoPegadoCalidad(rawText)
        toast.success(`¡Calidad procesada correctamente desde texto copiado!`)
      } else {
        toast.error('No se reconocieron tiendas en el texto pegado.')
      }
    } catch (e) {
      console.error(e)
      toast.error('Error al procesar el texto de calidad.')
    }
  }

  // Pegar directo desde portapapeles para Calidad
  const handlePegarCalidadPortapapeles = async () => {
    try {
      const texto = await navigator.clipboard.readText()
      if (texto) {
        procesarTextoPegadoCalidad(texto)
      } else {
        toast.warning('El portapapeles está vacío.')
      }
    } catch {
      toast.info('Presiona Ctrl+V dentro del recuadro inferior para pegar el reporte de Calidad.')
    }
  }

  // Copiar Notas de Calidad
  const copiarNotasCalidad = () => {
    const texto = datosCalidadAuditoria
      .map(item => `${item.nombre}\t${item.nota.toFixed(2)}%\t${item.mesEvaluado}\t${item.otrosComentarios || ''}`)
      .join('\n')
    navigator.clipboard.writeText(`Local\tNota Calidad\tMes\tOtros\n${texto}`)
    setCopiadoCalidad(true)
    toast.success('¡Notas de Calidad copiadas al portapapeles!')
    setTimeout(() => setCopiadoCalidad(false), 2500)
  }

  // Procesar Texto Pegado de Registro A-C (Evidencia Fotográfica Apertura y Cierre)
  const procesarTextoPegadoRegistroAC = (rawText: string) => {
    if (!rawText || rawText.trim().length === 0) {
      toast.error('El portapapeles está vacío o no contiene texto.')
      return
    }

    try {
      const rows = parseTSVWithQuotes(rawText)
      const isTSV = rows.length > 1 && rows.some(r => r.length >= 3)

      if (isTSV) {
        // Detectar si en las filas iniciales hay fechas
        const filaFechas = rows.find(r => r.filter(c => /\d{1,2}-[A-Za-z]{3}|\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}/i.test(c)).length >= 5)
        let fechasDetectadas = [...fechasAC]
        if (filaFechas) {
          const extraidas = filaFechas.filter(c => /\d{1,2}-[A-Za-z]{3}|\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2}/i.test(c))
          if (extraidas.length >= 7) {
            fechasDetectadas = extraidas.slice(0, 7)
            setFechasAC(fechasDetectadas)
          }
        }

        const resultado: FilaRegistroACTienda[] = TIENDAS_ZONA_B.map(t => {
          const storeRow = rows.find(r => r.some(c => identificarTienda(c)?.codigo === t.codigo))
          if (!storeRow) {
            const def = datosRegistroAC.find(d => d.codigo === t.codigo)
            return def || {
              codigo: t.codigo,
              nombre: t.nombre,
              lider: t.lider,
              slots: generarSlotsACDefault(true),
              registrosCumplidos: 14,
              totalRegistros: 14,
              cumplimientoPorcentaje: 100.0,
            }
          }

          const storeColIdx = storeRow.findIndex(c => identificarTienda(c)?.codigo === t.codigo)
          const cellsAfterStore = storeRow.slice(storeColIdx + 1)

          const slots: SlotRegistroAC[] = []
          let cumplidos = 0

          for (let d = 0; d < 7; d++) {
            const f = fechasDetectadas[d] || FECHAS_REGISTRO_AC_DEFAULT[d] || `Día ${d + 1}`
            const apVal = (cellsAfterStore[d * 2] || '').trim().toLowerCase()
            const ciVal = (cellsAfterStore[d * 2 + 1] || '').trim().toLowerCase()

            const apCumple = apVal === 'si' || apVal === 'sí' || apVal === '1' || apVal === 'x' || apVal === 'ok'
            const ciCumple = ciVal === 'si' || ciVal === 'sí' || ciVal === '1' || ciVal === 'x' || ciVal === 'ok'

            if (apCumple) cumplidos++
            if (ciCumple) cumplidos++

            slots.push({ fecha: f, tipo: 'Apertura', cumple: apCumple })
            slots.push({ fecha: f, tipo: 'Cierre', cumple: ciCumple })
          }

          // Si vino celda de porcentaje explícita al final (ej 100%)
          const lastCell = cellsAfterStore[cellsAfterStore.length - 1] || ''
          const matchPct = lastCell.match(/(\d+(?:\.\d+)?)\s*%/)
          let pct = parseFloat(((cumplidos / 14) * 100).toFixed(2))
          if (cumplidos === 0 && matchPct) {
            pct = parseFloat(matchPct[1])
            cumplidos = Math.round((pct / 100) * 14)
          }

          return {
            codigo: t.codigo,
            nombre: t.nombre,
            lider: t.lider,
            slots,
            registrosCumplidos: cumplidos,
            totalRegistros: 14,
            cumplimientoPorcentaje: pct,
          }
        })

        setDatosRegistroAC(resultado)
        setTextoPegadoAC(rawText)
        toast.success('¡Registro A-C procesado exitosamente desde la tabla pegada!')
        return
      }

      // Si no es TSV, procesar como texto plano
      const lineas = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
      const resultado: FilaRegistroACTienda[] = TIENDAS_ZONA_B.map(t => {
        const line = lineas.find(l => identificarTienda(l)?.codigo === t.codigo)
        if (!line) {
          const def = datosRegistroAC.find(d => d.codigo === t.codigo)
          return def || {
            codigo: t.codigo,
            nombre: t.nombre,
            lider: t.lider,
            slots: generarSlotsACDefault(true),
            registrosCumplidos: 14,
            totalRegistros: 14,
            cumplimientoPorcentaje: 100.0,
          }
        }

        const palabras = line.split(/\s+/).map(p => p.toLowerCase())
        const conteoSi = palabras.filter(p => p === 'si' || p === 'sí' || p === '1' || p === 'x').length
        const cumplidos = Math.min(14, conteoSi > 0 ? conteoSi : 14)
        const pct = parseFloat(((cumplidos / 14) * 100).toFixed(2))

        const slots = generarSlotsACDefault(false).map((s, idx) => ({
          ...s,
          cumple: idx < cumplidos,
        }))

        return {
          codigo: t.codigo,
          nombre: t.nombre,
          lider: t.lider,
          slots,
          registrosCumplidos: cumplidos,
          totalRegistros: 14,
          cumplimientoPorcentaje: pct,
        }
      })

      setDatosRegistroAC(resultado)
      setTextoPegadoAC(rawText)
      toast.success('¡Registro A-C procesado desde texto copiado!')
    } catch (e) {
      console.error(e)
      toast.error('Error al procesar el texto de Registro A-C.')
    }
  }

  // Pegar directo desde portapapeles para Registro A-C
  const handlePegarACPortapapeles = async () => {
    try {
      const texto = await navigator.clipboard.readText()
      if (texto) {
        procesarTextoPegadoRegistroAC(texto)
      } else {
        toast.warning('El portapapeles está vacío.')
      }
    } catch {
      toast.info('Presiona Ctrl+V dentro del recuadro inferior para pegar el reporte de Registro A-C.')
    }
  }

  // Copiar Notas de Registro A-C
  const copiarNotasAC = () => {
    const texto = datosRegistroAC
      .map(item => `${item.nombre}\t${item.registrosCumplidos}/14\t${item.cumplimientoPorcentaje.toFixed(2)}%`)
      .join('\n')
    navigator.clipboard.writeText(`Local\tRegistros Cumplidos\tCumplimiento\n${texto}`)
    setCopiadoAC(true)
    toast.success('¡Notas de Registro A-C copiadas al portapapeles!')
    setTimeout(() => setCopiadoAC(false), 2500)
  }

  // Confirmar o restablecer todas las tiendas a 100%
  const confirmarTodas100AC = () => {
    setDatosRegistroAC(prev =>
      prev.map(t => ({
        ...t,
        registrosCumplidos: 14,
        cumplimientoPorcentaje: 100.0,
        slots: t.slots.map(s => ({ ...s, cumple: true })),
      }))
    )
    toast.success('¡Todas las tiendas confirmadas al 100% (14/14 registros)!')
  }

  // Modificar cumplimiento de una tienda específica
  const actualizarCumplidosTiendaAC = (codigo: string, nuevosCumplidos: number) => {
    const val = Math.max(0, Math.min(14, nuevosCumplidos))
    setDatosRegistroAC(prev =>
      prev.map(t => {
        if (t.codigo !== codigo) return t
        const pct = parseFloat(((val / 14) * 100).toFixed(2))
        const nuevosSlots = t.slots.map((s, idx) => ({
          ...s,
          cumple: idx < val,
        }))
        return {
          ...t,
          registrosCumplidos: val,
          cumplimientoPorcentaje: pct,
          slots: nuevosSlots,
        }
      })
    )
  }

  // Alternar slot individual (Apertura o Cierre)
  const toggleSlotAC = (codigo: string, slotIdx: number) => {
    setDatosRegistroAC(prev =>
      prev.map(t => {
        if (t.codigo !== codigo) return t
        const nuevosSlots = [...t.slots]
        nuevosSlots[slotIdx] = {
          ...nuevosSlots[slotIdx],
          cumple: !nuevosSlots[slotIdx].cumple,
        }
        const cumplidos = nuevosSlots.filter(s => s.cumple).length
        const pct = parseFloat(((cumplidos / 14) * 100).toFixed(2))
        return {
          ...t,
          slots: nuevosSlots,
          registrosCumplidos: cumplidos,
          cumplimientoPorcentaje: pct,
        }
      })
    )
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
        if (!colInfo) {
          const def = datosDDF.find(d => d.codigo === tienda.codigo)
          return (
            def || {
              codigo: tienda.codigo,
              nombre: tienda.nombre,
              lider: tienda.lider,
              campos: NOMBRES_7_CAMPOS_DDF.map((nom, fIdx) => ({
                id: `c_${fIdx}`,
                nombre: nom,
                contenido: '',
                lleno: true,
              })),
              camposLlenos: 7,
              totalCampos: 7,
              cumplimientoPorcentaje: 100.0,
              textoFunciono: '',
              textoNoFunciono: '',
            }
          )
        }

        const campos: CampoDDFDetalle[] = NOMBRES_7_CAMPOS_DDF.map((nom, fIdx) => {
          if (!filasCampos[fIdx]) {
            return { id: `c_${fIdx}`, nombre: nom, contenido: '', lleno: false }
          }
          const contenido = String(filasCampos[fIdx][colInfo.colIdx] || '').trim()
          const lleno =
            contenido.length > 0 &&
            contenido !== '-' &&
            contenido.toLowerCase() !== 'ninguno' &&
            contenido !== '.'
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
      toast.success(`¡Tabla DDF procesada con éxito! Se evaluaron ${mapaColTienda.length} tiendas.`)
    } catch (e) {
      console.error(e)
      toast.error('Error al procesar tabla DDF.')
    }
  }

  // Confirmar todas las tiendas de DDF al 100%
  const confirmarTodas100DDF = () => {
    setDatosDDF(prev =>
      prev.map(t => ({
        ...t,
        camposLlenos: 7,
        cumplimientoPorcentaje: 100.0,
        campos: t.campos.map(c => ({
          ...c,
          lleno: true,
          contenido: c.contenido || `Completado por ${t.nombre}`,
        })),
      }))
    )
    toast.success('¡Todas las tiendas confirmadas al 100% en Incidencias DDF (7/7 campos)!')
  }

  // Pegar directo desde portapapeles para DDF
  const handlePegarDDFPortapapeles = async () => {
    try {
      const texto = await navigator.clipboard.readText()
      if (texto) {
        procesarTextoPegadoDDF(texto)
      } else {
        toast.warning('El portapapeles está vacío.')
      }
    } catch {
      toast.info('Presiona Ctrl+V dentro del recuadro inferior para pegar la tabla DDF.')
    }
  }

  // Copiar Notas de DDF
  const copiarNotasDDF = () => {
    const texto = datosDDF
      .map(item => `${item.nombre}\t${item.camposLlenos}/7\t${item.cumplimientoPorcentaje.toFixed(2)}%`)
      .join('\n')
    navigator.clipboard.writeText(`Local\tCampos Llenos\tCumplimiento\n${texto}`)
    setCopiadoDDF(true)
    toast.success('¡Notas de Incidencias DDF copiadas al portapapeles!')
    setTimeout(() => setCopiadoDDF(false), 2500)
  }

  // Copiar Síntesis de Funcionó / No Funcionó para el Boletín
  const copiarSintesisDDF = () => {
    const funcionoList = datosDDF
      .filter(t => t.textoFunciono && t.textoFunciono.trim().length > 0)
      .map(t => `• ${t.nombre}: ${t.textoFunciono}`)
      .join('\n')
    const noFuncionoList = datosDDF
      .filter(t => t.textoNoFunciono && t.textoNoFunciono.trim().length > 0)
      .map(t => `• ${t.nombre}: ${t.textoNoFunciono}`)
      .join('\n')
    const texto = `=== RESUMEN EJECUTIVO DDF - ZONA B ===\n\n[FUNCIONÓ]\n${funcionoList || 'Sin registros'}\n\n[NO FUNCIONÓ]\n${noFuncionoList || 'Sin registros'}`
    navigator.clipboard.writeText(texto)
    setCopiadoSintesisDDF(true)
    toast.success('¡Síntesis de Funcionó / No Funcionó copiada al portapapeles!')
    setTimeout(() => setCopiadoSintesisDDF(false), 2500)
  }

  // Alternar campo individual de DDF (1 a 7)
  const toggleCampoDDF = (codigo: string, campoIdx: number) => {
    setDatosDDF(prev =>
      prev.map(t => {
        if (t.codigo !== codigo) return t
        const nuevosCampos = [...t.campos]
        const estabaLleno = nuevosCampos[campoIdx].lleno
        nuevosCampos[campoIdx] = {
          ...nuevosCampos[campoIdx],
          lleno: !estabaLleno,
          contenido: !estabaLleno ? (nuevosCampos[campoIdx].contenido || 'Registro manual') : '',
        }
        const llenos = nuevosCampos.filter(c => c.lleno).length
        const pct = parseFloat(((llenos / 7) * 100).toFixed(2))
        return {
          ...t,
          campos: nuevosCampos,
          camposLlenos: llenos,
          cumplimientoPorcentaje: pct,
          textoFunciono: nuevosCampos[1]?.contenido || '',
          textoNoFunciono: nuevosCampos[2]?.contenido || '',
        }
      })
    )
  }

  // Modificar contador de campos llenos de DDF
  const actualizarCamposLlenosTiendaDDF = (codigo: string, nuevosLlenos: number) => {
    const val = Math.max(0, Math.min(7, nuevosLlenos))
    setDatosDDF(prev =>
      prev.map(t => {
        if (t.codigo !== codigo) return t
        const pct = parseFloat(((val / 7) * 100).toFixed(2))
        const nuevosCampos = t.campos.map((c, idx) => ({
          ...c,
          lleno: idx < val,
        }))
        return {
          ...t,
          campos: nuevosCampos,
          camposLlenos: val,
          cumplimientoPorcentaje: pct,
        }
      })
    )
  }

  // Estadísticas DDF
  const promedioDDF =
    datosDDF.length > 0
      ? (datosDDF.reduce((acc, t) => acc + t.cumplimientoPorcentaje, 0) / datosDDF.length).toFixed(2)
      : '0.00'
  const tiendas100DDF = datosDDF.filter(t => t.cumplimientoPorcentaje === 100).length
  const tiendasObservadasDDF = datosDDF.filter(t => t.cumplimientoPorcentaje < 100).length
  const totalCamposLlenosDDF = datosDDF.reduce((acc, t) => acc + t.camposLlenos, 0)

  // Estadísticas App Vencimiento
  const promedioVencimiento =
    datosVencimiento.length > 0
      ? (datosVencimiento.reduce((acc, t) => acc + t.totalPorcentaje, 0) / datosVencimiento.length).toFixed(2)
      : '0.00'
  const tiendas100Venc = datosVencimiento.filter(t => t.totalPorcentaje === 100).length
  const tiendasObservadasVenc = datosVencimiento.filter(t => t.totalPorcentaje < 100).length

  // Estadísticas Calidad Auditoría
  const promedioCalidad =
    datosCalidadAuditoria.length > 0
      ? (datosCalidadAuditoria.reduce((acc, t) => acc + t.nota, 0) / datosCalidadAuditoria.length).toFixed(2)
      : '0.00'
  const tiendasCumplenCalidad = datosCalidadAuditoria.filter(t => t.nota >= 90).length
  const tiendasDesvioCalidad = datosCalidadAuditoria.filter(t => t.nota < 90).length
  const tiendasArrastreCalidad = datosCalidadAuditoria.filter(t => t.esArrastre).length

  // Estadísticas Registro A-C
  const promedioAC =
    datosRegistroAC.length > 0
      ? (datosRegistroAC.reduce((acc, t) => acc + t.cumplimientoPorcentaje, 0) / datosRegistroAC.length).toFixed(2)
      : '0.00'
  const tiendas100AC = datosRegistroAC.filter(t => t.cumplimientoPorcentaje === 100).length
  const tiendasObservadasAC = datosRegistroAC.filter(t => t.cumplimientoPorcentaje < 100).length
  const totalRegistrosCompletados = datosRegistroAC.reduce((acc, t) => acc + t.registrosCumplidos, 0)

  // Ingesta y Procesamiento de Ventas (% Logro y % Crecimiento)
  const procesarTextoPegadoVentas = (rawText: string) => {
    if (!rawText || rawText.trim().length === 0) {
      toast.error('El texto pegado está vacío.')
      return
    }

    try {
      const lineas = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
      let actualizados = 0
      const nuevosDatos = [...datosVenta]

      // MODO 1: DETECCIÓN DE REPORTE WEB BI (Detalle KPI's con lista de tiendas y bloques de 5 métricas secuenciales)
      const tiendasDetectadas: { tienda: TiendaZonaB; lineIdx: number }[] = []
      let ultimoIdxTienda = -1

      for (let i = 0; i < lineas.length; i++) {
        const l = lineas[i]
        // Identificar tiendas en líneas individuales (ej: "103 - Mega Plaza" o "107 - Atocongo")
        const match = identificarTienda(l)
        if (match && /^(103|107|110|118|155|175|193|311|314|335|357)/.test(l)) {
          tiendasDetectadas.push({ tienda: match, lineIdx: i })
          ultimoIdxTienda = Math.max(ultimoIdxTienda, i)
        }
      }

      if (tiendasDetectadas.length >= 8 && ultimoIdxTienda > 0) {
        // Funciones auxiliares de detección numérica para formato BI
        const isAmount = (str: string) => {
          if (str.includes('%') || str.includes('PP')) return false
          return /^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(str) || /^-?\d+([,\.]\d+)?$/.test(str)
        }
        const isPercent = (str: string) => /^-?\d+([,\.]\d+)?\s*%$/.test(str)
        const parseMonto = (str: string) => {
          if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
            return parseInt(str.replace(/\./g, ''), 10)
          }
          const limpio = str.replace(/\./g, '').replace(',', '.')
          return Math.round(parseFloat(limpio))
        }
        const parsePct = (str: string) => {
          const limpio = str.replace('%', '').trim().replace(',', '.')
          return parseFloat(parseFloat(limpio).toFixed(2))
        }

        // Buscar tuplas de 5 métricas iniciales por tienda: [Venta, Plan Venta, Logro, Venta AP, Crec Venta]
        const tuplas: { venta: number; plan: number; logro: number; ventaAP: number; crec: number }[] = []
        for (let i = ultimoIdxTienda + 1; i < lineas.length - 4; i++) {
          const [l0, l1, l2, l3, l4] = [lineas[i], lineas[i+1], lineas[i+2], lineas[i+3], lineas[i+4]]
          if (isAmount(l0) && isAmount(l1) && isPercent(l2) && isAmount(l3) && isPercent(l4)) {
            tuplas.push({
              venta: parseMonto(l0),
              plan: parseMonto(l1),
              logro: parsePct(l2),
              ventaAP: parseMonto(l3),
              crec: parsePct(l4),
            })
          }
        }

        if (tuplas.length >= tiendasDetectadas.length) {
          tiendasDetectadas.forEach((item, idx) => {
            const tupla = tuplas[idx]
            const indexDato = nuevosDatos.findIndex(t => t.codigo === item.tienda.codigo)
            if (indexDato !== -1 && tupla) {
              nuevosDatos[indexDato] = {
                ...nuevosDatos[indexDato],
                ventaSoles: tupla.venta,
                metaSoles: tupla.plan,
                logroPorcentaje: tupla.logro,
                crecimientoPorcentaje: tupla.crec,
              }
              actualizados++
            }
          })

          // Si viene la fila "Total", sincronizar los totales del banner
          const totalLineIdx = lineas.findIndex(l => /^total$/i.test(l))
          if (totalLineIdx !== -1 && totalLineIdx + 5 < lineas.length) {
            const vTot = parseMonto(lineas[totalLineIdx + 1])
            const lTot = parsePct(lineas[totalLineIdx + 3])
            const cTot = parsePct(lineas[totalLineIdx + 5])
            if (!isNaN(vTot)) {
              setVentaTotalBannerManual(vTot)
              setUsarTotalBannerManual(true)
            }
            if (!isNaN(lTot)) setCumplimientoBannerManual(lTot)
            if (!isNaN(cTot)) setCrecimientoBannerManual(cTot)
          } else if (tuplas.length > tiendasDetectadas.length) {
            const tuplaTotal = tuplas[tiendasDetectadas.length]
            setVentaTotalBannerManual(tuplaTotal.venta)
            setUsarTotalBannerManual(true)
            setCumplimientoBannerManual(tuplaTotal.logro)
            setCrecimientoBannerManual(tuplaTotal.crec)
          }
        }
      }

      // MODO 2: FALLBACK TABULAR LÍNEA POR LÍNEA (Excel / Google Sheets / TSV)
      if (actualizados === 0) {
        for (const linea of lineas) {
          if (
            /^(tienda|local|codigo|código|venta|logro|crecimiento|semana)/i.test(linea) &&
            !identificarTienda(linea)
          ) {
            continue
          }

          const partes = linea.includes('\t')
            ? linea.split('\t').map(p => p.trim())
            : linea.includes(';')
            ? linea.split(';').map(p => p.trim())
            : linea.split(/\s{2,}/).map(p => p.trim())

          let tiendaMatch: TiendaZonaB | undefined = undefined
          for (let i = 0; i < partes.length; i++) {
            const match = identificarTienda(partes[i])
            if (match) {
              tiendaMatch = match
              break
            }
          }
          if (!tiendaMatch) {
            tiendaMatch = identificarTienda(linea)
          }

          if (tiendaMatch) {
            const limpiarNumero = (valStr: string): number | null => {
              const limpio = valStr
                .replace(/S\/\.?/gi, '')
                .replace(/\$/g, '')
                .replace(/%/g, '')
                .replace(/,/g, '')
                .trim()
              const num = parseFloat(limpio)
              return isNaN(num) ? null : num
            }

            let ventaVal: number | null = null
            let logroVal: number | null = null
            let crecVal: number | null = null

            if (partes.length >= 3) {
              const colsNumericas = partes
                .map(limpiarNumero)
                .filter((v): v is number => v !== null)

              if (colsNumericas.length >= 3) {
                ventaVal = colsNumericas[0]
                logroVal = colsNumericas[1]
                crecVal = colsNumericas[2]
              } else if (colsNumericas.length === 2) {
                if (colsNumericas[0] > 1000) {
                  ventaVal = colsNumericas[0]
                  logroVal = colsNumericas[1]
                } else {
                  logroVal = colsNumericas[0]
                  crecVal = colsNumericas[1]
                }
              }
            }

            if (ventaVal === null || logroVal === null || crecVal === null) {
              const matchVenta = linea.match(/(?:S\/\s*)?([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]+)?|[0-9]{4,7}(?:\.[0-9]+)?)/)
              if (matchVenta && ventaVal === null) {
                ventaVal = parseFloat(matchVenta[1].replace(/,/g, ''))
              }

              const matchesPct = Array.from(linea.matchAll(/([+\-]?\d+(?:\.\d+)?)\s*%/g))
              if (matchesPct.length >= 2) {
                if (logroVal === null) logroVal = parseFloat(matchesPct[0][1])
                if (crecVal === null) crecVal = parseFloat(matchesPct[1][1])
              } else if (matchesPct.length === 1) {
                const val = parseFloat(matchesPct[0][1])
                if (val < 0) {
                  if (crecVal === null) crecVal = val
                } else {
                  if (logroVal === null) logroVal = val
                }
              }
            }

            const idx = nuevosDatos.findIndex(t => t.codigo === tiendaMatch!.codigo)
            if (idx !== -1) {
              nuevosDatos[idx] = {
                ...nuevosDatos[idx],
                ventaSoles: ventaVal !== null ? Math.round(ventaVal) : nuevosDatos[idx].ventaSoles,
                logroPorcentaje: logroVal !== null ? parseFloat(logroVal.toFixed(2)) : nuevosDatos[idx].logroPorcentaje,
                crecimientoPorcentaje: crecVal !== null ? parseFloat(crecVal.toFixed(2)) : nuevosDatos[idx].crecimientoPorcentaje,
              }
              actualizados++
            }
          }
        }
      }

      if (actualizados > 0) {
        setDatosVenta(nuevosDatos)
        toast.success(`¡Se actualizaron con éxito las ventas de ${actualizados} tiendas!`)
      } else {
        toast.error('No se pudo identificar tiendas o números en el texto pegado.')
      }
    } catch {
      toast.error('Error al procesar el texto pegado de ventas.')
    }
  }

  const pegarDesdePortapapelesVentas = async () => {
    try {
      const texto = await navigator.clipboard.readText()
      if (texto && texto.trim().length > 0) {
        setTextoPegadoVenta(texto)
        procesarTextoPegadoVentas(texto)
      } else {
        toast.warning('El portapapeles está vacío.')
      }
    } catch {
      toast.info('Pega el texto directamente en el recuadro inferior con Ctrl+V.')
    }
  }

  const copiarTablaVentas = () => {
    const encabezado = 'Tienda\tLíder\tVenta (S/)\t% Logro\t% Crecimiento'
    const filas = datosVenta
      .map(
        t =>
          `${t.nombre}\t${t.lider}\t${t.ventaSoles}\t${t.logroPorcentaje.toFixed(2)}%\t${t.crecimientoPorcentaje >= 0 ? '+' : ''}${t.crecimientoPorcentaje.toFixed(2)}%`
      )
      .join('\n')
    navigator.clipboard.writeText(`${encabezado}\n${filas}`)
    setCopiadoVenta(true)
    toast.success('¡Tabla de Ventas copiada en formato TSV/Excel!')
    setTimeout(() => setCopiadoVenta(false), 2500)
  }

  const restablecerVentasDefault = () => {
    setDatosVenta(DATOS_EJEMPLO_VENTA)
    toast.info('Valores de venta restablecidos a los de referencia (S40).')
  }

  const actualizarCampoVenta = (
    codigo: string,
    campo: 'ventaSoles' | 'logroPorcentaje' | 'crecimientoPorcentaje',
    valor: number
  ) => {
    setDatosVenta(prev =>
      prev.map(t => (t.codigo === codigo ? { ...t, [campo]: valor } : t))
    )
  }

  // Estadísticas de Ventas
  const totalVentaCalculada = datosVenta.reduce((acc, t) => acc + t.ventaSoles, 0)
  const promedioLogroVenta =
    datosVenta.length > 0
      ? (datosVenta.reduce((acc, t) => acc + t.logroPorcentaje, 0) / datosVenta.length).toFixed(2)
      : '0.00'
  const promedioCrecimientoVenta =
    datosVenta.length > 0
      ? (datosVenta.reduce((acc, t) => acc + t.crecimientoPorcentaje, 0) / datosVenta.length).toFixed(2)
      : '0.00'
  const tiendasCumplenMetaVenta = datosVenta.filter(t => t.logroPorcentaje >= 100).length
  const tiendasFocoVenta = datosVenta.filter(t => t.crecimientoPorcentaje < 0 || t.logroPorcentaje < 90)

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
                onChange={e => {
                  const s = e.target.value
                  setSemanaSeleccionada(s)
                  if (s.includes('40') || s.includes('41') || s.includes('42') || s.includes('43')) {
                    setMesObjetivoAuditoria('octubre')
                  }
                }}
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
                setDatosCalidadAuditoria(DATOS_EJEMPLO_CALIDAD_AUDITORIA)
                setDatosRegistroAC(DATOS_EJEMPLO_REGISTRO_AC)
                setDatosVenta(DATOS_EJEMPLO_VENTA)
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
            onClick={() => setActiveTab('ventas')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'ventas'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            1. Ventas (% Logro / Crec.)
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Nuevo
            </span>
          </button>

          <button
            onClick={() => setActiveTab('vencimiento')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'vencimiento'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            2. App Vencimiento (Pegar Web)
          </button>

          <button
            onClick={() => setActiveTab('calidad_auditoria')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'calidad_auditoria'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            3. Calidad Auditoría (Pegar Excel)
          </button>

          <button
            onClick={() => setActiveTab('registro_ac')}
            className={`py-3.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'registro_ac'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            4. Registro A-C (Apertura/Cierre)
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              100% Default
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
            5. Incidencias DDF-Tácticos
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              100% Default
            </span>
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
            6. Disponibilidad (ResumGTda)
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
            7. Negativos (Looker)
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
            8. Ajustes (Looker)
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
            9. Vista Previa Boletín J06
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              Completo
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
            10. Datos Consolidado
          </button>
        </div>

        {/* TAB 1: VENTAS (% LOGRO Y % CRECIMIENTO) */}
        {activeTab === 'ventas' && (
          <div className="space-y-6">
            {/* Panel de Ingesta y Copiado */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Ventas Semanales: Venta (S/), % Logro y % Crecimiento
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Copia y pega la tabla de ventas directamente desde Excel, Google Sheets o Looker. El sistema reconoce automáticamente tiendas (incluyendo códigos y nombres como Cusco 357, Trujillo 1 y 2), montos en Soles y porcentajes de logro y crecimiento.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={pegarDesdePortapapelesVentas}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <ClipboardPaste className="w-4 h-4" />
                    Pegar Portapapeles
                  </button>
                  <button
                    onClick={copiarTablaVentas}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
                  >
                    {copiadoVenta ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copiadoVenta ? '¡Copiado!' : 'Copiar Tabla TSV'}
                  </button>
                  <button
                    onClick={restablecerVentasDefault}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
                    title="Restablecer valores oficiales de referencia"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Valores S40 Ref.
                  </button>
                </div>
              </div>

              {/* Métricas Resumen Zona B */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Venta Suma Tiendas</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    S/ {totalVentaCalculada.toLocaleString('es-PE')}
                  </div>
                  <div className="text-[10px] text-slate-500">11 tiendas Zona B</div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-emerald-800 font-medium">
                    <span>% Logro Zona B</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-lg font-bold text-emerald-950">
                    {promedioLogroVenta}%
                  </div>
                  <div className="text-[10px] text-emerald-700">Meta: ≥ 100.0%</div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-amber-800 font-medium">
                    <span>% Crecimiento Prom.</span>
                    <TrendingDown className="w-4 h-4 text-amber-600" />
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      parseFloat(promedioCrecimientoVenta) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {parseFloat(promedioCrecimientoVenta) >= 0 ? '+' : ''}
                    {promedioCrecimientoVenta}%
                  </div>
                  <div className="text-[10px] text-slate-500">vs semana/año anterior</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Tiendas en Meta</span>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {tiendasCumplenMetaVenta} <span className="text-xs text-slate-400 font-normal">/ 11</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {((tiendasCumplenMetaVenta / 11) * 100).toFixed(1)}% de cumplimiento
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-rose-800 font-medium">
                    <span>Tiendas Foco Semana</span>
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-lg font-bold text-rose-900">
                    {tiendasFocoVenta.length} <span className="text-xs text-rose-400 font-normal">/ 11</span>
                  </div>
                  <div className="text-[10px] text-rose-700">Crec. negativo o logro &lt;90%</div>
                </div>
              </div>

              {/* Ajuste de Banner Institucional Zona B */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Banner General Zona B:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={usarTotalBannerManual}
                      onChange={e => setUsarTotalBannerManual(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Usar monto institucional en encabezado (S/ {ventaTotalBannerManual.toLocaleString('es-PE')})</span>
                  </label>
                </div>
                {usarTotalBannerManual && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Monto Banner S/:</span>
                    <input
                      type="number"
                      value={ventaTotalBannerManual}
                      onChange={e => setVentaTotalBannerManual(parseFloat(e.target.value) || 0)}
                      className="w-28 px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 font-mono font-bold text-right"
                    />
                    <span className="text-slate-500 ml-1">Cumpl%:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={cumplimientoBannerManual}
                      onChange={e => setCumplimientoBannerManual(parseFloat(e.target.value) || 0)}
                      className="w-16 px-1.5 py-1 bg-white border border-slate-300 rounded text-slate-900 font-mono font-bold text-right"
                    />
                    <span className="text-slate-500 ml-1">Crec%:</span>
                    <input
                      type="number"
                      step="0.1"
                      value={crecimientoBannerManual}
                      onChange={e => setCrecimientoBannerManual(parseFloat(e.target.value) || 0)}
                      className="w-16 px-1.5 py-1 bg-white border border-slate-300 rounded text-slate-900 font-mono font-bold text-right"
                    />
                  </div>
                )}
              </div>

              {/* Área de Texto para Pegar */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Pegar tabla o reporte de ventas (Excel / Looker / TSV):
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder={`Ejemplo de formato soportado:\n103 - Mega Plaza\tS/ 88,692\t91.89%\t-3.23%\n107 - Atocongo\tS/ 38,643\t97.96%\t-0.13%\n110 - Huaylas\tS/ 37,596\t100.32%\t+5.09%`}
                    value={textoPegadoVenta}
                    onChange={e => setTextoPegadoVenta(e.target.value)}
                    className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  {textoPegadoVenta && (
                    <button
                      onClick={() => setTextoPegadoVenta('')}
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 bg-white rounded-md shadow-sm border border-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    💡 Formatos: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Tienda [tab] Venta [tab] % Logro [tab] % Crec</code>
                  </span>
                  <button
                    onClick={() => procesarTextoPegadoVentas(textoPegadoVenta)}
                    disabled={!textoPegadoVenta.trim()}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Procesar Texto Pegado
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla Interactiva de Ventas */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tabla de Ventas Semanal por Tienda ({semanaSeleccionada})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Edita directamente cualquier valor en la tabla si necesitas ajustar cifras manuales.
                  </p>
                </div>
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                  11 Tiendas Zona B
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                      <th className="py-2.5 px-3 border-r border-slate-200">Tienda</th>
                      <th className="py-2.5 px-3 border-r border-slate-200">Líder J06</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-right">Venta (S/)</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-right">Meta Estimada</th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-center">
                        % Logro (Meta &gt;100%)
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-center">
                        % Crecimiento
                      </th>
                      <th className="py-2.5 px-3 text-center">Diagnóstico / Foco</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {datosVenta.map(tienda => {
                      const metaCalc = Math.round((tienda.ventaSoles / (tienda.logroPorcentaje / 100)) || 0)
                      const cumpleMeta = tienda.logroPorcentaje >= 100
                      const esCercaMeta = tienda.logroPorcentaje >= 90 && tienda.logroPorcentaje < 100
                      const esCritico = tienda.logroPorcentaje < 90 || tienda.crecimientoPorcentaje < -5

                      return (
                        <tr key={tienda.codigo} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                            <span className="font-mono text-slate-500 mr-1.5">{tienda.codigo}</span>
                            {tienda.nombre.replace(/^\d+\s*-\s*/, '')}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 whitespace-nowrap">
                            {tienda.lider}
                          </td>

                          {/* Venta Soles */}
                          <td className="py-2.5 px-3 border-r border-slate-200 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-slate-400 text-[11px]">S/</span>
                              <input
                                type="number"
                                value={tienda.ventaSoles}
                                onChange={e =>
                                  actualizarCampoVenta(
                                    tienda.codigo,
                                    'ventaSoles',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-24 px-1.5 py-0.5 text-right font-mono font-semibold text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded focus:border-emerald-500 focus:outline-none"
                              />
                            </div>
                          </td>

                          {/* Meta Estimada */}
                          <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono text-slate-500">
                            S/ {metaCalc.toLocaleString('es-PE')}
                          </td>

                          {/* % Logro */}
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={tienda.logroPorcentaje}
                                onChange={e =>
                                  actualizarCampoVenta(
                                    tienda.codigo,
                                    'logroPorcentaje',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className={`w-20 px-1.5 py-0.5 text-center font-mono font-bold rounded border focus:outline-none ${
                                  cumpleMeta
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                    : esCercaMeta
                                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                                    : 'bg-rose-50 text-rose-900 border-rose-300'
                                }`}
                              />
                              <span className="text-[11px] font-semibold text-slate-500">%</span>
                            </div>
                          </td>

                          {/* % Crecimiento */}
                          <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={tienda.crecimientoPorcentaje}
                                onChange={e =>
                                  actualizarCampoVenta(
                                    tienda.codigo,
                                    'crecimientoPorcentaje',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className={`w-20 px-1.5 py-0.5 text-center font-mono font-bold rounded border focus:outline-none ${
                                  tienda.crecimientoPorcentaje >= 0
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                    : 'bg-rose-50 text-rose-900 border-rose-300'
                                }`}
                              />
                              <span className="text-[11px] font-semibold text-slate-500">%</span>
                            </div>
                          </td>

                          {/* Diagnóstico */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {cumpleMeta ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle className="w-3 h-3" /> Meta Superada
                              </span>
                            ) : esCritico ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                <AlertCircle className="w-3 h-3" /> Foco Crítico
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Cerca a Meta
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td colSpan={2} className="py-2.5 px-3 text-left">
                        Total / Promedio Zona B:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-900">
                        S/ {totalVentaCalculada.toLocaleString('es-PE')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        S/{' '}
                        {datosVenta
                          .reduce((acc, t) => acc + Math.round((t.ventaSoles / (t.logroPorcentaje / 100)) || 0), 0)
                          .toLocaleString('es-PE')}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-800 bg-emerald-50">
                        {promedioLogroVenta}%
                      </td>
                      <td
                        className={`py-2.5 px-3 text-center font-mono ${
                          parseFloat(promedioCrecimientoVenta) >= 0
                            ? 'text-emerald-800 bg-emerald-50'
                            : 'text-rose-800 bg-rose-50'
                        }`}
                      >
                        {parseFloat(promedioCrecimientoVenta) >= 0 ? '+' : ''}
                        {promedioCrecimientoVenta}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] text-slate-600 font-medium">
                          {tiendasCumplenMetaVenta} de 11 cumplen meta
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Panel Foco Semana: Síntesis Ejecutiva */}
            <div className="bg-gradient-to-br from-rose-50/50 via-white to-amber-50/30 rounded-2xl border border-rose-200 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    !
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Foco de la Semana - Tiendas con Alerta de Ventas ({semanaSeleccionada})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Listado automático para la presentación del Boletín Semanal J06 (Zona B).
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const textoFoco = `Foco Semana (${semanaSeleccionada}) - Zona B:\n` +
                      tiendasFocoVenta
                        .sort((a, b) => a.crecimientoPorcentaje - b.crecimientoPorcentaje)
                        .map(
                          t =>
                            `- ${t.nombre.replace(/^\d+\s*-\s*/, '')}: Crec. ${t.crecimientoPorcentaje >= 0 ? '+' : ''}${t.crecimientoPorcentaje.toFixed(2)}% | Logro: ${t.logroPorcentaje.toFixed(2)}%`
                        )
                        .join('\n')
                    navigator.clipboard.writeText(textoFoco)
                    toast.success('¡Síntesis de Foco Semana copiada!')
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-800 hover:bg-rose-50 text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Foco Semana
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tiendasFocoVenta
                  .sort((a, b) => a.crecimientoPorcentaje - b.crecimientoPorcentaje)
                  .map(t => (
                    <div
                      key={t.codigo}
                      className="p-3 bg-white rounded-xl border border-rose-100 shadow-sm flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{t.nombre}</div>
                        <div className="text-[11px] text-slate-500">{t.lider}</div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-mono font-bold text-xs ${
                            t.crecimientoPorcentaje < 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {t.crecimientoPorcentaje >= 0 ? '+' : ''}
                          {t.crecimientoPorcentaje.toFixed(2)}%
                        </div>
                        <div className="text-[10px] text-slate-400">Logro: {t.logroPorcentaje.toFixed(2)}%</div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="p-3 bg-white/80 rounded-xl border border-slate-200 text-xs text-slate-600">
                <strong className="text-slate-800 font-semibold">Resumen para Boletín:</strong>{' '}
                {tiendasFocoVenta
                  .sort((a, b) => a.crecimientoPorcentaje - b.crecimientoPorcentaje)
                  .map(t => `${t.nombre.replace(/^\d+\s*-\s*/, '')}: ${t.crecimientoPorcentaje.toFixed(1)}%`)
                  .join(' | ')}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: APP VENCIMIENTO (PEGAR WEB) */}
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

        {/* TAB 2: CALIDAD AUDITORÍA (PEGAR EXCEL ONLINE) */}
        {activeTab === 'calidad_auditoria' && (
          <div className="space-y-6">
            {/* Panel de Ingesta */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    Auditoría de Calidad (Excel Online)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Copia la tabla desde el archivo online de Calidad. Si la tienda aún no tiene nota en el mes evaluado (<strong>{mesObjetivoAuditoria.toUpperCase()}</strong>), el sistema aplicará automáticamente la última nota auditada (<strong>Septiembre</strong>) como arrastre.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                    <span>Mes a Evaluar:</span>
                    <select
                      value={mesObjetivoAuditoria}
                      onChange={e => {
                        const nuevoMes = e.target.value
                        setMesObjetivoAuditoria(nuevoMes)
                        if (textoPegadoCalidad) {
                          procesarTextoPegadoCalidad(textoPegadoCalidad, nuevoMes)
                        }
                      }}
                      className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
                    >
                      <option value="septiembre">Septiembre</option>
                      <option value="octubre">Octubre</option>
                      <option value="noviembre">Noviembre</option>
                      <option value="diciembre">Diciembre</option>
                    </select>
                  </div>

                  <button
                    onClick={handlePegarCalidadPortapapeles}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <ClipboardPaste className="w-4 h-4" />
                    Pegar desde Portapapeles
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={textoPegadoCalidad}
                  onChange={e => {
                    setTextoPegadoCalidad(e.target.value)
                    procesarTextoPegadoCalidad(e.target.value)
                  }}
                  onPaste={e => {
                    const pasted = e.clipboardData.getData('text')
                    if (pasted) {
                      e.preventDefault()
                      setTextoPegadoCalidad(pasted)
                      procesarTextoPegadoCalidad(pasted)
                    }
                  }}
                  placeholder="Haz clic aquí y presiona Ctrl + V (o Cmd + V) para pegar la tabla copiada del Excel Online de Calidad..."
                  rows={3}
                  className="w-full text-xs font-mono p-4 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-50/50 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Lógica de Arrastre Inteligente:</strong> Para la {semanaSeleccionada} (Octubre), si la tienda no tiene evaluación aún, el sistema rescata la calificación de Septiembre y la marca con la etiqueta <span className="inline-block bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-semibold text-[10px]">Arrastre</span> en el Boletín. La meta de calidad es <strong>&gt;90%</strong>.
                </div>
              </div>
            </div>

            {/* Tarjetas KPI de Calidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Promedio Zona B</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{promedioCalidad}%</p>
                  <p className="text-xs text-slate-500 mt-0.5">Meta mensual: &gt;90%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cumplen Meta (≥90%)</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {tiendasCumplenCalidad} <span className="text-sm font-medium text-slate-400">/ {datosCalidadAuditoria.length}</span>
                  </p>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                    {datosCalidadAuditoria.length > 0 ? ((tiendasCumplenCalidad / datosCalidadAuditoria.length) * 100).toFixed(1) : 0}% efectividad
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">En Desvío (&lt;90%)</p>
                  <p className="text-2xl font-black text-rose-600 mt-1">
                    {tiendasDesvioCalidad} <span className="text-sm font-medium text-slate-400">/ {datosCalidadAuditoria.length}</span>
                  </p>
                  <p className="text-xs text-rose-600 font-medium mt-0.5">Requieren plan de acción</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Con Arrastre</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {tiendasArrastreCalidad} <span className="text-sm font-medium text-slate-400">/ {datosCalidadAuditoria.length}</span>
                  </p>
                  <p className="text-xs text-amber-700 font-medium mt-0.5">Provenientes de Septiembre</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Tabla Detallada Calidad Auditoría */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#1b5e20]"></span>
                    CALIDAD AUDITORÍA - Evaluaciones de Tiendas Zona B
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Meta: &gt;90% de calificación en auditoría de perecibles / calidad.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copiarNotasCalidad}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-sm cursor-pointer"
                  >
                    {copiadoCalidad ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    {copiadoCalidad ? '¡Copiado!' : 'Copiar Notas'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1b5e20] text-white font-bold text-center border-b border-emerald-900">
                      <th className="py-2.5 px-3 text-left border-r border-emerald-800">Local</th>
                      <th className="py-2.5 px-3 text-left border-r border-emerald-800">Líder J06 / Jefe Comercial</th>
                      <th className="py-2.5 px-3 bg-[#2e7d32] border-r border-emerald-800 min-w-[110px]">
                        Nota Auditoría
                      </th>
                      <th className="py-2.5 px-3 bg-[#2e7d32] border-r border-emerald-800 min-w-[140px]">
                        Mes de Origen
                      </th>
                      <th className="py-2.5 px-3 text-left border-r border-emerald-800 min-w-[200px]">
                        Otros / Observaciones
                      </th>
                      <th className="py-2.5 px-4 bg-[#1b5e20] min-w-[120px]">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {datosCalidadAuditoria.map((item, idx) => {
                      const cumple = item.nota >= 90
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
                          <td className="py-2.5 px-4 text-center font-black border-r border-slate-200 whitespace-nowrap">
                            <span
                              className={`inline-block px-3 py-1 rounded-md text-xs font-bold border ${
                                cumple
                                  ? 'bg-[#c8e6c9] text-[#1b5e20] border-[#a5d6a7]'
                                  : 'bg-[#ffcdd2] text-[#b71c1c] border-[#ef9a9a]'
                              }`}
                            >
                              {item.nota.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                            {item.esArrastre ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3" />
                                {item.mesEvaluado}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle className="w-3 h-3" />
                                {item.mesEvaluado}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 text-xs">
                            {item.otrosComentarios || <span className="text-slate-300 italic">Sin observaciones</span>}
                          </td>
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            {cumple ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                🟢 Cumple (&gt;90%)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                🔴 Desvío (&lt;90%)
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

        {/* TAB 3: REGISTRO A-C (EVIDENCIA FOTOGRÁFICA APERTURA Y CIERRE) */}
        {activeTab === 'registro_ac' && (
          <div className="space-y-6">
            {/* Panel de Ingesta y Control */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-600" />
                    Registro A-C (Evidencia Fotográfica Apertura y Cierre)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Control semanal de 14 registros fotográficos por tienda (Apertura y Cierre de 7 días). Meta: <strong>100%</strong> (14/14 registros). Cada registro faltante reduce la nota proporcionalmente hasta llegar a <strong>0%</strong> si no llenan nada.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={confirmarTodas100AC}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Confirmar Todas al 100%
                  </button>

                  <button
                    onClick={handlePegarACPortapapeles}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors border border-slate-300 cursor-pointer whitespace-nowrap"
                  >
                    <ClipboardPaste className="w-4 h-4 text-emerald-700" />
                    Pegar desde Portapapeles
                  </button>

                  <button
                    onClick={copiarNotasAC}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    {copiadoAC ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    {copiadoAC ? '¡Copiado!' : 'Copiar Notas'}
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={textoPegadoAC}
                  onChange={e => {
                    setTextoPegadoAC(e.target.value)
                    procesarTextoPegadoRegistroAC(e.target.value)
                  }}
                  onPaste={e => {
                    const pasted = e.clipboardData.getData('text')
                    if (pasted) {
                      e.preventDefault()
                      setTextoPegadoAC(pasted)
                      procesarTextoPegadoRegistroAC(pasted)
                    }
                  }}
                  placeholder="Pega aquí la tabla copiada desde Excel con las 14 columnas de Apertura y Cierre (7 días) o el consolidado de cumplimiento..."
                  rows={3}
                  className="w-full text-xs font-mono p-4 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-50/50 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Regla de Evaluación de Registro A-C:</strong> Cada tienda cuenta con 14 casillas de control (Apertura y Cierre de Lunes a Domingo). La calificación se calcula como <code>(Registros Cumplidos / 14) × 100%</code>. Con 14/14 = <strong>100%</strong>; 13/14 = <strong>92.86%</strong>; 10/14 = <strong>71.43%</strong>; 7/14 = <strong>50.00%</strong>; y con 0 registros = <strong>0%</strong>. Por defecto todas inician en <strong>100%</strong> para que puedas confirmar rápidamente con un clic o ajustar individualmente.
                </div>
              </div>
            </div>

            {/* Tarjetas KPI de Registro A-C */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Promedio Zona B</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{promedioAC}%</p>
                  <p className="text-xs text-slate-500 mt-0.5">Meta semanal: 100%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cumplen al 100% (14/14)</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {tiendas100AC} <span className="text-sm font-medium text-slate-400">/ {datosRegistroAC.length}</span>
                  </p>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                    {datosRegistroAC.length > 0 ? ((tiendas100AC / datosRegistroAC.length) * 100).toFixed(1) : 0}% de cumplimiento
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Con Observaciones (&lt;100%)</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {tiendasObservadasAC} <span className="text-sm font-medium text-slate-400">/ {datosRegistroAC.length}</span>
                  </p>
                  <p className="text-xs text-amber-600 font-medium mt-0.5">Faltan evidencias de A o C</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Evidencias</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {totalRegistrosCompletados} <span className="text-sm font-medium text-slate-400">/ {datosRegistroAC.length * 14}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Aperturas y Cierres validados</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileCheck className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Tabla Detallada Registro A-C */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#1b5e20]"></span>
                    REGISTRO A-C - Evidencias Fotográficas Apertura y Cierre
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Haz clic en cualquier casilla [si] o [no] para alternar su estado, o ajusta directamente el contador de registros.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={confirmarTodas100AC}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Todas a 100%
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    {/* Fila 1: Fechas agrupadas */}
                    <tr className="bg-[#1b5e20] text-white font-bold text-center border-b border-emerald-900">
                      <th rowSpan={2} className="py-2.5 px-3 text-left border-r border-emerald-800 min-w-[140px]">
                        Tienda
                      </th>
                      <th rowSpan={2} className="py-2.5 px-3 text-left border-r border-emerald-800 min-w-[140px]">
                        Líder J06
                      </th>
                      {fechasAC.map((fecha, idx) => (
                        <th key={idx} colSpan={2} className="py-1 px-2 border-r border-emerald-800 bg-[#2e7d32] text-center text-[11px]">
                          {fecha}
                        </th>
                      ))}
                      <th rowSpan={2} className="py-2.5 px-3 bg-[#1b5e20] border-r border-emerald-800 min-w-[110px] text-center">
                        Cumplidos
                      </th>
                      <th rowSpan={2} className="py-2.5 px-3 bg-[#2e7d32] border-r border-emerald-800 min-w-[110px] text-center">
                        Cumplimiento
                      </th>
                      <th rowSpan={2} className="py-2.5 px-3 bg-[#1b5e20] min-w-[110px] text-center">
                        Acción Rápida
                      </th>
                    </tr>

                    {/* Fila 2: Sub-cabeceras Apertura (A) y Cierre (C) */}
                    <tr className="bg-[#2e7d32] text-emerald-100 font-semibold text-center border-b border-emerald-900 text-[10px]">
                      {fechasAC.map((_, idx) => (
                        <span key={idx} className="contents">
                          <th className="py-1 px-1.5 border-r border-emerald-800 text-center">Ap</th>
                          <th className="py-1 px-1.5 border-r border-emerald-800 text-center">Ci</th>
                        </span>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {datosRegistroAC.map((item, idx) => {
                      const es100 = item.cumplimientoPorcentaje === 100
                      const esDesvio = item.cumplimientoPorcentaje < 70
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
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 whitespace-nowrap text-[11px]">
                            {item.lider}
                          </td>

                          {/* 14 Slots interactivos (Apertura y Cierre) */}
                          {item.slots.map((slot, sIdx) => (
                            <td
                              key={sIdx}
                              className="py-1 px-1 text-center border-r border-slate-200"
                              title={`${slot.fecha} - ${slot.tipo}: ${slot.cumple ? 'Cumple (clic para alternar)' : 'No cumple (clic para alternar)'}`}
                            >
                              <button
                                onClick={() => toggleSlotAC(item.codigo, sIdx)}
                                className={`w-6 h-6 rounded text-[10px] font-black transition-transform hover:scale-110 cursor-pointer flex items-center justify-center mx-auto border ${
                                  slot.cumple
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                    : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                                }`}
                              >
                                {slot.cumple ? 'si' : 'no'}
                              </button>
                            </td>
                          ))}

                          {/* Registros Cumplidos con Stepper */}
                          <td className="py-2 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => actualizarCumplidosTiendaAC(item.codigo, item.registrosCumplidos - 1)}
                                disabled={item.registrosCumplidos <= 0}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 cursor-pointer text-xs"
                                title="Restar 1 registro"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-bold text-slate-800 text-xs min-w-[42px]">
                                {item.registrosCumplidos}/14
                              </span>
                              <button
                                onClick={() => actualizarCumplidosTiendaAC(item.codigo, item.registrosCumplidos + 1)}
                                disabled={item.registrosCumplidos >= 14}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 cursor-pointer text-xs"
                                title="Sumar 1 registro"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Porcentaje Cumplimiento */}
                          <td className="py-2.5 px-3 text-center font-black border-r border-slate-200 whitespace-nowrap">
                            <span
                              className={`inline-block px-3 py-1 rounded-md text-xs font-bold border ${
                                es100
                                  ? 'bg-[#c8e6c9] text-[#1b5e20] border-[#a5d6a7]'
                                  : esDesvio
                                  ? 'bg-[#ffcdd2] text-[#b71c1c] border-[#ef9a9a]'
                                  : 'bg-[#ffe0b2] text-[#e65100] border-[#ffcc80]'
                              }`}
                            >
                              {item.cumplimientoPorcentaje.toFixed(2)}%
                            </span>
                          </td>

                          {/* Acciones Rápidas */}
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => actualizarCumplidosTiendaAC(item.codigo, 14)}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer"
                                title="Marcar 14/14 (100%)"
                              >
                                100%
                              </button>
                              <button
                                onClick={() => actualizarCumplidosTiendaAC(item.codigo, 0)}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-800 border border-slate-300 transition-colors cursor-pointer"
                                title="Marcar 0/14 (0%)"
                              >
                                0%
                              </button>
                            </div>
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

        {/* TAB 4: INCIDENCIAS DDF (TÁCTICOS) */}
        {activeTab === 'ddf' && (
          <div className="space-y-6">
            {/* Panel de Ingesta y Control */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ClipboardPaste className="w-5 h-5 text-emerald-600" />
                    Incidencias DDF-Tácticos (Excel Online - Formulario Semanal)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Evaluación de 7 campos obligatorios por tienda. Meta: <strong>100%</strong> (7/7 campos completados). Cada campo faltante reduce la nota proporcionalmente (7/7 = 100%, 6/7 = 85.71%, 5/7 = 71.43%, ..., 0/7 = 0%). Todas las tiendas inician al <strong>100% por default</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={confirmarTodas100DDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Confirmar Todas al 100%
                  </button>

                  <button
                    onClick={handlePegarDDFPortapapeles}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors border border-slate-300 cursor-pointer whitespace-nowrap"
                  >
                    <ClipboardPaste className="w-4 h-4 text-emerald-700" />
                    Pegar desde Portapapeles
                  </button>

                  <button
                    onClick={copiarNotasDDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    {copiadoDDF ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                    {copiadoDDF ? '¡Copiado!' : 'Copiar Notas'}
                  </button>

                  <button
                    onClick={copiarSintesisDDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                    title="Copiar texto consolidado de lo que funcionó y no funcionó en Zona B"
                  >
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    {copiadoSintesisDDF ? '¡Síntesis Copiada!' : 'Copiar Síntesis Semanal'}
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={textoPegadoDDF}
                  onChange={e => {
                    setTextoPegadoDDF(e.target.value)
                    procesarTextoPegadoDDF(e.target.value)
                  }}
                  onPaste={e => {
                    const pasted = e.clipboardData.getData('text')
                    if (pasted) {
                      e.preventDefault()
                      setTextoPegadoDDF(pasted)
                      procesarTextoPegadoDDF(pasted)
                    }
                  }}
                  placeholder="Pega aquí la tabla copiada del Excel Online de Incidencias DDF (pestaña S41 u otra)..."
                  rows={3}
                  className="w-full text-xs font-mono p-4 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-slate-50/50 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>7 Campos Auditados en Incidencias DDF:</strong> (1) Logro / Crec, (2) Funcionó, (3) No funcionó, (4) Quiebres, (5) Sobre Stock, (6) Liquidaciones, (7) Otros Comentarios. La nota se calcula como <code>(Campos Llenados / 7) × 100%</code>. Con 7/7 = <strong>100%</strong>; 6/7 = <strong>85.71%</strong>; 5/7 = <strong>71.43%</strong>; 4/7 = <strong>57.14%</strong>; y 0/7 = <strong>0%</strong>. Todas inician en 100% para validar directamente o ajustar novedades.
                </div>
              </div>
            </div>

            {/* Tarjetas KPI de Incidencias DDF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Promedio Zona B</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{promedioDDF}%</p>
                  <p className="text-xs text-slate-500 mt-0.5">Meta semanal: 100%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ClipboardPaste className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cumplen al 100% (7/7)</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {tiendas100DDF} <span className="text-sm font-medium text-slate-400">/ {datosDDF.length}</span>
                  </p>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                    {datosDDF.length > 0 ? ((tiendas100DDF / datosDDF.length) * 100).toFixed(1) : 0}% efectividad
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Con Observaciones (&lt;100%)</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {tiendasObservadasDDF} <span className="text-sm font-medium text-slate-400">/ {datosDDF.length}</span>
                  </p>
                  <p className="text-xs text-amber-600 font-medium mt-0.5">Faltan campos por llenar</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Campos Completados</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {totalCamposLlenosDDF} <span className="text-sm font-medium text-slate-400">/ {datosDDF.length * 7}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Total respuestas recibidas</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileCheck className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Tabla Detallada Incidencias DDF */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#1b5e20]"></span>
                    INCIDENCIAS DDF-TÁCTICOS - Evaluación de 7 Campos Semanales
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Haz clic en cualquier campo [✓] o [✗] para alternar su cumplimiento, o en &quot;Detalle&quot; para leer las notas de la tienda.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={confirmarTodas100DDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Todas a 100%
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1b5e20] text-white font-bold text-center border-b border-emerald-900">
                      <th className="py-2.5 px-3 text-left border-r border-emerald-800 min-w-[140px]">Tienda</th>
                      <th className="py-2.5 px-3 text-left border-r border-emerald-800 min-w-[140px]">Líder J06</th>
                      <th className="py-2.5 px-1.5 bg-[#2e7d32] border-r border-emerald-800 text-center min-w-[65px]" title="1. Logro / Crecimiento">
                        1. Logro
                      </th>
                      <th className="py-2.5 px-1.5 bg-[#2e7d32] border-r border-emerald-800 text-center min-w-[75px]" title="2. Códigos que Funcionaron">
                        2. Funcionó
                      </th>
                      <th className="py-2.5 px-1.5 bg-[#2e7d32] border-r border-emerald-800 text-center min-w-[75px]" title="3. Códigos que No Funcionaron">
                        3. No Func.
                      </th>
                      <th className="py-2.5 px-1.5 bg-[#2e7d32] border-r border-emerald-800 text-center min-w-[70px]" title="4. Quiebres reportados">
                        4. Quiebres
                      </th>
                      <th className="py-2.5 px-1.5 bg-[#2e7d32] border-r border-emerald-800 text-center min-w-[75px]" title="5. Sobre Stock">
                        5. SobreStk
                      </th>
                      <th className="py-2.5 px-1.5 bg-[#2e7d32] border-r border-emerald-800 text-center min-w-[70px]" title="6. Liquidaciones">
                        6. Liquidac.
                      </th>
                      <th className="py-2.5 px-1.5 bg-[#2e7d32] border-r border-emerald-800 text-center min-w-[65px]" title="7. Otros Comentarios">
                        7. Otros
                      </th>
                      <th className="py-2.5 px-3 bg-[#1b5e20] border-r border-emerald-800 min-w-[110px] text-center">
                        Campos
                      </th>
                      <th className="py-2.5 px-3 bg-[#2e7d32] border-r border-emerald-800 min-w-[100px] text-center">
                        Cumplimiento
                      </th>
                      <th className="py-2.5 px-3 bg-[#1b5e20] min-w-[160px] text-center">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {datosDDF.map((item, idx) => {
                      const es100 = item.cumplimientoPorcentaje === 100
                      const esDesvio = item.cumplimientoPorcentaje < 70
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
                          <td className="py-2.5 px-3 text-slate-600 border-r border-slate-200 whitespace-nowrap text-[11px]">
                            {item.lider}
                          </td>

                          {/* 7 Campos Interactivos */}
                          {item.campos.map((campo, cIdx) => (
                            <td
                              key={cIdx}
                              className="py-1 px-1 text-center border-r border-slate-200"
                              title={`${campo.nombre}: ${campo.contenido || (campo.lleno ? 'Completado' : 'Vacío')} (clic para alternar)`}
                            >
                              <button
                                onClick={() => toggleCampoDDF(item.codigo, cIdx)}
                                className={`w-6 h-6 rounded text-[10px] font-black transition-transform hover:scale-110 cursor-pointer flex items-center justify-center mx-auto border ${
                                  campo.lleno
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                    : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                                }`}
                              >
                                {campo.lleno ? '✓' : '✗'}
                              </button>
                            </td>
                          ))}

                          {/* Stepper de Campos Llenos */}
                          <td className="py-2 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => actualizarCamposLlenosTiendaDDF(item.codigo, item.camposLlenos - 1)}
                                disabled={item.camposLlenos <= 0}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 cursor-pointer text-xs"
                                title="Restar 1 campo"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-bold text-slate-800 text-xs min-w-[36px]">
                                {item.camposLlenos}/7
                              </span>
                              <button
                                onClick={() => actualizarCamposLlenosTiendaDDF(item.codigo, item.camposLlenos + 1)}
                                disabled={item.camposLlenos >= 7}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 cursor-pointer text-xs"
                                title="Sumar 1 campo"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Porcentaje Cumplimiento */}
                          <td className="py-2.5 px-3 text-center font-black border-r border-slate-200 whitespace-nowrap">
                            <span
                              className={`inline-block px-3 py-1 rounded-md text-xs font-bold border ${
                                es100
                                  ? 'bg-[#c8e6c9] text-[#1b5e20] border-[#a5d6a7]'
                                  : esDesvio
                                  ? 'bg-[#ffcdd2] text-[#b71c1c] border-[#ef9a9a]'
                                  : 'bg-[#ffe0b2] text-[#e65100] border-[#ffcc80]'
                              }`}
                            >
                              {item.cumplimientoPorcentaje.toFixed(2)}%
                            </span>
                          </td>

                          {/* Acciones */}
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setTiendaDDFDetalle(item)}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1"
                                title="Ver comentarios completos de la tienda"
                              >
                                <Eye className="w-3 h-3 text-slate-500" />
                                Detalle
                              </button>
                              <button
                                onClick={() => actualizarCamposLlenosTiendaDDF(item.codigo, 7)}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer"
                                title="Marcar 7/7 (100%)"
                              >
                                100%
                              </button>
                              <button
                                onClick={() => actualizarCamposLlenosTiendaDDF(item.codigo, 0)}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-800 border border-slate-300 transition-colors cursor-pointer"
                                title="Marcar 0/7 (0%)"
                              >
                                0%
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal / Visor de Comentarios de Tienda Seleccionada */}
            {tiendaDDFDetalle && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        <h3 className="font-bold text-slate-900 text-base">{tiendaDDFDetalle.nombre}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            tiendaDDFDetalle.cumplimientoPorcentaje === 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {tiendaDDFDetalle.cumplimientoPorcentaje.toFixed(2)}% ({tiendaDDFDetalle.camposLlenos}/7 campos)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Líder: {tiendaDDFDetalle.lider}</p>
                    </div>
                    <button
                      onClick={() => setTiendaDDFDetalle(null)}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-3 divide-y divide-slate-100">
                    {tiendaDDFDetalle.campos.map((campo, cIdx) => (
                      <div key={cIdx} className={`pt-3 first:pt-0 ${campo.lleno ? '' : 'opacity-60'}`}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${campo.lleno ? 'bg-emerald-500' : 'bg-rose-400'}`}></span>
                            {campo.nombre}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              campo.lleno ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {campo.lleno ? 'Completado' : 'Sin contenido'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono whitespace-pre-wrap">
                          {campo.contenido || <span className="italic text-slate-400">Sin registro ingresado</span>}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Semana: {semanaSeleccionada}</span>
                    <button
                      onClick={() => setTiendaDDFDetalle(null)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cerrar Detalle
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Panel de Síntesis Ejecutiva Zona B ("Funcionó" y "No Funcionó") */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-600" />
                    ¿Qué Funcionó en Zona B? (Tácticos de Éxito)
                  </h4>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {datosDDF.filter(t => t.textoFunciono && t.textoFunciono.trim().length > 0).length} tiendas
                  </span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs text-slate-700">
                  {datosDDF.map(t => {
                    if (!t.textoFunciono) return null
                    return (
                      <div key={t.codigo} className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100/80">
                        <strong className="text-emerald-950 font-bold block mb-0.5">{t.nombre}:</strong>
                        <span className="text-slate-700">{t.textoFunciono}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4 text-rose-600" />
                    ¿Qué No Funcionó en Zona B? (Desvíos y Oportunidades)
                  </h4>
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                    {datosDDF.filter(t => t.textoNoFunciono && t.textoNoFunciono.trim().length > 0).length} tiendas
                  </span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs text-slate-700">
                  {datosDDF.map(t => {
                    if (!t.textoNoFunciono) return null
                    return (
                      <div key={t.codigo} className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-100/80">
                        <strong className="text-rose-950 font-bold block mb-0.5">{t.nombre}:</strong>
                        <span className="text-slate-700">{t.textoNoFunciono}</span>
                      </div>
                    )
                  })}
                </div>
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

        {/* TAB 7: VISTA PREVIA BOLETÍN J06 */}
        {activeTab === 'boletin_preview' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Boletín Semanal J06 ({semanaSeleccionada}) - Consolidado Zona B
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualización consolidada de todos los indicadores clave: Ventas, Scorecard de Líderes y Detalle de KPI&apos;s operativos.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 10 Indicadores Sincronizados
                </span>
              </div>
            </div>

            {/* BANNER GENERAL INSTITUCIONAL ZONA B (COMO EN LA PLANTILLA OFICIAL) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-black text-slate-700 tracking-wider uppercase">
                  Zona B - Indicadores Clave
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">{semanaSeleccionada}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 text-center text-xs">
                {/* Venta */}
                <div className="p-2 rounded-lg bg-[#e8f5e9] border border-[#c8e6c9]">
                  <div className="text-[10px] text-[#2e7d32] font-semibold">Venta</div>
                  <div className="font-bold text-[#1b5e20] text-xs">
                    {usarTotalBannerManual
                      ? `S/ ${ventaTotalBannerManual.toLocaleString('es-PE')}`
                      : `S/ ${totalVentaCalculada.toLocaleString('es-PE')}`}
                  </div>
                </div>

                {/* Cumplimiento Venta */}
                <div className="p-2 rounded-lg bg-[#e8f5e9] border border-[#c8e6c9]">
                  <div className="text-[10px] text-[#2e7d32] font-semibold">Cumpl.%</div>
                  <div className="font-bold text-[#1b5e20] text-xs">
                    {usarTotalBannerManual ? `${cumplimientoBannerManual}%` : `${promedioLogroVenta}%`}
                  </div>
                </div>

                {/* Crecimiento Venta */}
                <div className="p-2 rounded-lg bg-[#e8f5e9] border border-[#c8e6c9]">
                  <div className="text-[10px] text-[#2e7d32] font-semibold">Crec.%</div>
                  <div
                    className={`font-bold text-xs ${
                      (usarTotalBannerManual ? crecimientoBannerManual : parseFloat(promedioCrecimientoVenta)) >= 0
                        ? 'text-[#1b5e20]'
                        : 'text-rose-700'
                    }`}
                  >
                    {usarTotalBannerManual
                      ? `${crecimientoBannerManual >= 0 ? '+' : ''}${crecimientoBannerManual}%`
                      : `${parseFloat(promedioCrecimientoVenta) >= 0 ? '+' : ''}${promedioCrecimientoVenta}%`}
                  </div>
                </div>

                {/* Merma */}
                <div className="p-2 rounded-lg bg-[#fff9c4] border border-[#fff59d]">
                  <div className="text-[10px] text-amber-900 font-semibold">Merma</div>
                  <div className="font-bold text-amber-950 text-xs">4.29%</div>
                  <div className="text-[9px] text-amber-700">obj. 4.84%</div>
                </div>

                {/* Amabilidad */}
                <div className="p-2 rounded-lg bg-[#ffe0b2] border border-[#ffcc80]">
                  <div className="text-[10px] text-[#e65100] font-semibold">Amabilidad *</div>
                  <div className="font-bold text-[#e65100] text-xs">101.90%</div>
                  <div className="text-[9px] text-orange-700">&gt;91%</div>
                </div>

                {/* MOP */}
                <div className="p-2 rounded-lg bg-[#e8f5e9] border border-[#c8e6c9]">
                  <div className="text-[10px] text-[#2e7d32] font-semibold">MOP *</div>
                  <div className="font-bold text-[#1b5e20] text-xs">102.00%</div>
                  <div className="text-[9px] text-emerald-700">&gt;100%</div>
                </div>

                {/* Productividad */}
                <div className="p-2 rounded-lg bg-[#e8f5e9] border border-[#c8e6c9]">
                  <div className="text-[10px] text-[#2e7d32] font-semibold">Productividad *</div>
                  <div className="font-bold text-[#1b5e20] text-xs">105%</div>
                  <div className="text-[9px] text-emerald-700">&gt;100%</div>
                </div>

                {/* NSG */}
                <div className="p-2 rounded-lg bg-[#fff9c4] border border-[#fff59d]">
                  <div className="text-[10px] text-amber-900 font-semibold">NSG</div>
                  <div className="font-bold text-amber-950 text-xs">91.82%</div>
                  <div className="text-[9px] text-amber-700">Obj. 95%</div>
                </div>

                {/* Calidad */}
                <div className="p-2 rounded-lg bg-[#fff9c4] border border-[#fff59d]">
                  <div className="text-[10px] text-amber-900 font-semibold">Calidad</div>
                  <div className="font-bold text-amber-950 text-xs">{promedioCalidad}%</div>
                  <div className="text-[9px] text-amber-700">&gt;90%</div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 1: TABLA DE VENTAS, ACUMULADO, FOCO DE LA SEMANA Y FEEDBACK */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Tabla de Ventas Semanal (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="font-bold text-xs text-slate-800">
                    Ventas Semanales ({semanaSeleccionada})
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    S/ {totalVentaCalculada.toLocaleString('es-PE')}
                  </span>
                </div>
                <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-[11px] text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300">
                        <th className="py-1.5 px-2 text-left border-r border-slate-300">Tienda</th>
                        <th className="py-1.5 px-2 border-r border-slate-300 text-right">Venta</th>
                        <th className="py-1.5 px-2 border-r border-slate-300 bg-emerald-50 text-emerald-900">
                          % Logro
                        </th>
                        <th className="py-1.5 px-2">% Crec.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {datosVenta.map(t => (
                        <tr key={t.codigo} className="hover:bg-slate-50">
                          <td className="py-1 px-2 text-left font-semibold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                            {t.nombre}
                          </td>
                          <td className="py-1 px-2 text-right font-mono text-slate-700 border-r border-slate-200 whitespace-nowrap">
                            S/ {t.ventaSoles.toLocaleString('es-PE')}
                          </td>
                          <td
                            className={`py-1 px-2 font-bold border-r border-slate-200 ${
                              t.logroPorcentaje >= 100
                                ? 'bg-[#c8e6c9] text-[#1b5e20]'
                                : t.logroPorcentaje >= 90
                                ? 'bg-[#ffe0b2] text-[#e65100]'
                                : 'bg-[#ffcdd2] text-[#b71c1c]'
                            }`}
                          >
                            {t.logroPorcentaje.toFixed(2)}%
                          </td>
                          <td
                            className={`py-1 px-2 font-bold ${
                              t.crecimientoPorcentaje >= 0
                                ? 'bg-[#c8e6c9] text-[#1b5e20]'
                                : 'bg-[#ffcdd2] text-[#b71c1c]'
                            }`}
                          >
                            {t.crecimientoPorcentaje >= 0 ? '+' : ''}
                            {t.crecimientoPorcentaje.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Acumulado MOP y Productividad (lg:col-span-2) */}
              <div className="lg:col-span-2 space-y-2">
                <div className="pb-1 border-b border-slate-200">
                  <span className="font-bold text-xs text-slate-800">Acumulado *</span>
                </div>
                <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-[11px] text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300">
                        <th className="py-1.5 px-2 border-r border-slate-300 bg-[#e8f5e9] text-[#1b5e20]">MOP</th>
                        <th className="py-1.5 px-2 bg-[#e8f5e9] text-[#1b5e20]">Productividad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {TIENDAS_ZONA_B.map(t => (
                        <tr key={t.codigo} className="hover:bg-slate-50">
                          <td className="py-1 px-2 border-r border-slate-200 font-mono text-slate-600 bg-emerald-50/20">
                            0.00%
                          </td>
                          <td className="py-1 px-2 font-mono text-slate-600 bg-emerald-50/20">
                            0.00%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Foco de la Semana y Categoría (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Resumen Panadería / Pastelería */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                    <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                      {semanaSeleccionada}
                    </div>
                    <div className="text-slate-700 space-y-1">
                      <div>
                        <span className="font-semibold text-slate-800">- Panadería:</span>{' '}
                        <span className="font-mono text-emerald-800 font-bold">Cump: 88.6%</span>{' '}
                        <span className="font-mono text-rose-700 font-bold">Crec: -5.9%</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">- Pastelería:</span>{' '}
                        <span className="font-mono text-emerald-800 font-bold">Cump: 94.7%</span>{' '}
                        <span className="font-mono text-rose-700 font-bold">Crec: -2.1%</span>
                      </div>
                    </div>
                  </div>

                  {/* Foco Semana */}
                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5 text-xs">
                    <div className="font-bold text-rose-950 flex items-center justify-between border-b border-rose-200 pb-1">
                      <span>Foco Semana</span>
                      <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 rounded font-bold">
                        {tiendasFocoVenta.length}
                      </span>
                    </div>
                    <div className="space-y-0.5 text-slate-700 max-h-24 overflow-y-auto pr-1">
                      {tiendasFocoVenta
                        .sort((a, b) => a.crecimientoPorcentaje - b.crecimientoPorcentaje)
                        .map(t => (
                          <div key={t.codigo} className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-800">- {t.nombre.replace(/^\d+\s*-\s*/, '')}:</span>
                            <span className="font-mono font-bold text-rose-700">
                              {t.crecimientoPorcentaje >= 0 ? '+' : ''}{t.crecimientoPorcentaje.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Qué Funcionó y No Funcionó */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1 text-xs">
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5 border-b border-emerald-200 pb-0.5">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Funcionó</span>
                    </div>
                    <div className="text-[10px] text-slate-700 max-h-16 overflow-y-auto leading-relaxed">
                      {datosDDF.find(t => t.textoFunciono && t.textoFunciono.trim().length > 0)?.textoFunciono ||
                        '50% en enrollados de pizza, queso y hot dog x un, keke redondo tottus + s/1.00 gaseosa Inka/Coca 1.5Lt'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1 text-xs">
                    <div className="font-bold text-rose-950 flex items-center gap-1.5 border-b border-rose-200 pb-0.5">
                      <ThumbsDown className="w-3.5 h-3.5 text-rose-700" />
                      <span>No funcionó</span>
                    </div>
                    <div className="text-[10px] text-slate-700 max-h-16 overflow-y-auto leading-relaxed">
                      {datosDDF.find(t => t.textoNoFunciono && t.textoNoFunciono.trim().length > 0)?.textoNoFunciono ||
                        'Compra de keke redondo tottus + S/1.00 agreg una gaseosa inka cola o coca cola x 1.5Lt'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: DESEMPEÑO DE INDICADORES LÍDERES (SCORECARD PONDERADO) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Desempeño de Indicadores Líderes
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">
                  Evaluación Ponderada de 9 Criterios (Total 100%)
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-[11px] border-collapse text-center">
                  <thead>
                    {/* Fila Metas */}
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[10px]">
                      <th colSpan={3} className="py-1 px-2 border-r border-slate-300 text-left">Objetivo</th>
                      <th className="py-1 px-1 border-r border-slate-300 bg-emerald-50 text-emerald-900 font-black">&gt;100%</th>
                      <th className="py-1 px-1 border-r border-slate-300">&gt;100%</th>
                      <th className="py-1 px-1 border-r border-slate-300 bg-emerald-100 text-emerald-950 font-black">&gt;95%</th>
                      <th className="py-1 px-1 border-r border-slate-300">100%</th>
                      <th className="py-1 px-1 border-r border-slate-300">100%</th>
                      <th className="py-1 px-1 border-r border-slate-300">100%</th>
                      <th className="py-1 px-1 border-r border-slate-300">100%</th>
                      <th className="py-1 px-1 border-r border-slate-300 bg-emerald-50 text-emerald-900 font-black">&gt;90%</th>
                      <th className="py-1 px-1 border-r border-slate-300">&gt;90.3%</th>
                      <th className="py-1 px-1 bg-slate-200 text-slate-900 font-black">Total</th>
                    </tr>
                    {/* Fila Pesos */}
                    <tr className="bg-slate-200/80 text-slate-700 font-bold border-b border-slate-300 text-[10px]">
                      <th colSpan={3} className="py-1 px-2 border-r border-slate-300 text-right pr-3">Peso</th>
                      <th className="py-1 px-1 border-r border-slate-300 bg-emerald-100 text-emerald-950 font-black">5%</th>
                      <th className="py-1 px-1 border-r border-slate-300">10%</th>
                      <th className="py-1 px-1 border-r border-slate-300 bg-emerald-200 text-emerald-950 font-black">20%</th>
                      <th className="py-1 px-1 border-r border-slate-300">10%</th>
                      <th className="py-1 px-1 border-r border-slate-300">5%</th>
                      <th className="py-1 px-1 border-r border-slate-300">5%</th>
                      <th className="py-1 px-1 border-r border-slate-300">5%</th>
                      <th className="py-1 px-1 border-r border-slate-300 bg-emerald-100 text-emerald-950 font-black">10%</th>
                      <th className="py-1 px-1 border-r border-slate-300">30%</th>
                      <th className="py-1 px-1 bg-slate-300 text-slate-900 font-black">100%</th>
                    </tr>
                    {/* Fila Encabezados de Columna */}
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                      <th className="py-2 px-3 text-left border-r border-slate-300">Tienda</th>
                      <th className="py-2 px-3 text-left border-r border-slate-300">Líder J06</th>
                      <th className="py-2 px-2 border-r border-slate-300 text-center">Dotación</th>
                      <th className="py-2 px-2 border-r border-slate-300 bg-emerald-100 text-emerald-950">Venta ⭐</th>
                      <th className="py-2 px-2 border-r border-slate-300">producción</th>
                      <th className="py-2 px-2 border-r border-slate-300 bg-emerald-200 text-emerald-950 font-black">Inventario ⭐</th>
                      <th className="py-2 px-2 border-r border-slate-300">d (Disp) ⭐</th>
                      <th className="py-2 px-2 border-r border-slate-300">Merma</th>
                      <th className="py-2 px-2 border-r border-slate-300">Reporte</th>
                      <th className="py-2 px-2 border-r border-slate-300">Equipo</th>
                      <th className="py-2 px-2 border-r border-slate-300 bg-emerald-100 text-emerald-950">Calidad ⭐</th>
                      <th className="py-2 px-2 border-r border-slate-300">Amabilidad</th>
                      <th className="py-2 px-2 bg-slate-200 text-slate-950 font-black">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {TIENDAS_ZONA_B.map(tienda => {
                      const rowVenta = datosVenta.find(v => v.codigo === tienda.codigo)
                      const rowAjuste = datosAjustes.find(a => a.codigo === tienda.codigo)
                      const rowNegativo = datosNegativos.find(n => n.codigo === tienda.codigo)
                      const rowDisp = datosDisponibilidad.find(d => d.codigo === tienda.codigo)
                      const rowCalidad = datosCalidadAuditoria.find(c => c.codigo === tienda.codigo)
                      const base = METRICAS_LIDERES_BASE[tienda.codigo] || {
                        dotacion: 3.0, produccion: 90.0, merma: 95.0, reporte: 100.0, equipo: 100.0, amabilidad: 100.0
                      }

                      const pctAjuste = rowAjuste ? rowAjuste.cumplimientoPorcentaje : 0
                      const pctNegativo = rowNegativo ? rowNegativo.cumplimientoPorcentaje : 0
                      const notaInventario = parseFloat(((pctAjuste + pctNegativo) / 2).toFixed(2))

                      const valVenta = rowVenta ? rowVenta.logroPorcentaje : 100.0
                      const valProd = base.produccion
                      const valDisp = rowDisp ? rowDisp.nsg : 95.0
                      const valMerma = base.merma
                      const valReporte = base.reporte
                      const valEquipo = base.equipo
                      const valCalidad = rowCalidad ? rowCalidad.nota : 100.0
                      const valAmabilidad = base.amabilidad

                      const totalScore = parseFloat((
                        (valVenta * 0.05) +
                        (valProd * 0.10) +
                        (notaInventario * 0.20) +
                        (valDisp * 0.10) +
                        (valMerma * 0.05) +
                        (valReporte * 0.05) +
                        (valEquipo * 0.05) +
                        (valCalidad * 0.10) +
                        (valAmabilidad * 0.30)
                      ).toFixed(2))

                      return (
                        <tr key={tienda.codigo} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 text-left font-semibold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                            {tienda.nombre}
                          </td>
                          <td className="py-1.5 px-3 text-left text-slate-600 border-r border-slate-200 whitespace-nowrap">
                            {tienda.lider}
                          </td>
                          <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono text-slate-700 bg-amber-50/60">
                            {base.dotacion.toFixed(1)}
                          </td>
                          {/* Venta (5%) */}
                          <td className={`py-1.5 px-2 border-r border-slate-200 font-bold ${
                            valVenta >= 100 ? 'bg-emerald-50 text-emerald-900' : valVenta >= 90 ? 'bg-amber-50 text-amber-900' : 'bg-rose-50 text-rose-900'
                          }`}>
                            {valVenta.toFixed(2)}%
                          </td>
                          {/* Producción (10%) */}
                          <td className="py-1.5 px-2 border-r border-slate-200 text-slate-700">
                            {valProd.toFixed(2)}%
                          </td>
                          {/* Inventario (20%) */}
                          <td className={`py-1.5 px-2 border-r border-slate-200 font-bold ${
                            notaInventario >= 90 ? 'bg-emerald-100 text-emerald-950' : 'bg-amber-50 text-amber-900'
                          }`}>
                            {notaInventario.toFixed(2)}%
                          </td>
                          {/* Disponibilidad (10%) */}
                          <td className="py-1.5 px-2 border-r border-slate-200 text-slate-700">
                            {valDisp.toFixed(2)}%
                          </td>
                          {/* Merma (5%) */}
                          <td className="py-1.5 px-2 border-r border-slate-200 text-slate-700">
                            {valMerma.toFixed(2)}%
                          </td>
                          {/* Reporte (5%) */}
                          <td className="py-1.5 px-2 border-r border-slate-200 text-slate-700">
                            {valReporte.toFixed(2)}%
                          </td>
                          {/* Equipo (5%) */}
                          <td className="py-1.5 px-2 border-r border-slate-200 text-slate-700">
                            {valEquipo.toFixed(2)}%
                          </td>
                          {/* Calidad (10%) */}
                          <td className={`py-1.5 px-2 border-r border-slate-200 font-bold ${
                            valCalidad >= 90 ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'
                          }`}>
                            {valCalidad.toFixed(2)}%
                          </td>
                          {/* Amabilidad (30%) */}
                          <td className="py-1.5 px-2 border-r border-slate-200 text-slate-700">
                            {valAmabilidad.toFixed(2)}%
                          </td>
                          {/* Total Ponderado (100%) */}
                          <td className={`py-1.5 px-2 font-black ${
                            totalScore >= 95
                              ? 'bg-[#c8e6c9] text-[#1b5e20]'
                              : totalScore >= 90
                              ? 'bg-[#e8f5e9] text-[#2e7d32]'
                              : totalScore >= 85
                              ? 'bg-[#ffe0b2] text-[#e65100]'
                              : 'bg-[#ffcdd2] text-[#b71c1c]'
                          }`}>
                            {totalScore.toFixed(2)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN 3: KPI'S DETALLADOS (INVENTARIO, IMPLEMENTACIÓN, DISPONIBILIDAD, CALIDAD) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">
                  Detalle de KPI&apos;S Operativos (Inventario, Implementación, Disponibilidad, Calidad)
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">
                  Valores operativos directos
                </span>
              </div>
            </div>

            {/* Banner Informativo de Inventario */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                <span className="text-xs text-emerald-950 font-semibold">
                  Inventario: Nota calculada como promedio de Ajustes y Negativos. Pistoleo Pan fijado en 100% por default (columna ERI eliminada). Registro A-C evaluado sobre 14 registros (100% default).
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
                    <th className="py-1 px-2 border-r border-slate-300 bg-emerald-100 text-emerald-900 font-bold">
                      100% (Registro A-C)
                    </th>
                    <th className="py-1 px-2 border-r border-slate-300 bg-emerald-100 text-emerald-900 font-bold">
                      100% (Incidencias DDF-Tácticos)
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
                    <th className="py-1 px-2 border-r border-slate-300 bg-emerald-100 text-emerald-900 font-bold">
                      &gt;90% (Auditoría)
                    </th>
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

                    <th className="py-2 px-2 border-r border-slate-300 bg-emerald-200 text-emerald-950 font-bold">
                      Registro A-C ⭐
                    </th>
                    <th className="py-2 px-2 border-r border-slate-300 bg-emerald-200 text-emerald-950 font-bold">
                      Incidencias DDF-Tácticos ⭐
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

                    <th className="py-2 px-2 border-r border-slate-300 bg-emerald-200 text-emerald-950 font-bold">
                      Nota Auditoría ⭐
                    </th>
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
                    const rowCalidad = datosCalidadAuditoria.find(c => c.codigo === tienda.codigo)
                    const rowAC = datosRegistroAC.find(a => a.codigo === tienda.codigo)

                    const pctAjuste = rowAjuste ? rowAjuste.cumplimientoPorcentaje : 0
                    const pctNegativo = rowNegativo ? rowNegativo.cumplimientoPorcentaje : 0
                    const notaInventario = parseFloat(((pctAjuste + pctNegativo) / 2).toFixed(2))

                    const pctAC = rowAC ? rowAC.cumplimientoPorcentaje : 100.0
                    const pctDDF = rowDDF ? rowDDF.cumplimientoPorcentaje : 0
                    const pctVenc = rowVenc ? rowVenc.totalPorcentaje : 100.0
                    const notaAuditoria = rowCalidad ? rowCalidad.nota : 100.0
                    const esArrastreAuditoria = rowCalidad ? rowCalidad.esArrastre : false
                    const mesCalidad = rowCalidad ? rowCalidad.mesEvaluado : 'Octubre'

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

                        {/* REGISTRO A-C */}
                        <td
                          className={`py-2 px-2 border-r border-slate-200 font-bold ${
                            pctAC === 100
                              ? 'bg-emerald-50 text-emerald-900'
                              : pctAC >= 70
                              ? 'bg-amber-50 text-amber-900'
                              : 'bg-rose-50 text-rose-900'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span>{pctAC.toFixed(2)}%</span>
                            {rowAC && rowAC.registrosCumplidos < 14 && (
                              <span className="text-[9px] font-semibold text-amber-800 bg-amber-100 px-1 rounded leading-tight mt-0.5">
                                {rowAC.registrosCumplidos}/14
                              </span>
                            )}
                          </div>
                        </td>

                        {/* INCIDENCIAS DDF-TÁCTICOS */}
                        <td
                          className={`py-2 px-2 border-r border-slate-200 font-bold ${
                            pctDDF === 100
                              ? 'bg-emerald-50 text-emerald-900'
                              : pctDDF >= 70
                              ? 'bg-amber-50 text-amber-900'
                              : 'bg-rose-50 text-rose-900'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span>{pctDDF.toFixed(2)}%</span>
                            {rowDDF && rowDDF.camposLlenos < 7 && (
                              <span className="text-[9px] font-semibold text-amber-800 bg-amber-100 px-1 rounded leading-tight mt-0.5">
                                {rowDDF.camposLlenos}/7
                              </span>
                            )}
                          </div>
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

                        {/* CALIDAD: NOTA AUDITORÍA (AUTOMATIZADO) */}
                        <td
                          className={`py-2 px-2 border-r border-slate-200 font-bold ${
                            notaAuditoria >= 90
                              ? 'bg-emerald-50 text-emerald-900'
                              : 'bg-[#ffcdd2] text-[#b71c1c]'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span>{notaAuditoria.toFixed(2)}%</span>
                            {esArrastreAuditoria && (
                              <span
                                title={`Arrastre: ${mesCalidad}`}
                                className="text-[9px] font-semibold text-amber-800 bg-amber-100 px-1 rounded leading-tight mt-0.5"
                              >
                                Arrastre
                              </span>
                            )}
                          </div>
                        </td>

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

        {/* TAB 8: CONSOLIDADO */}
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
                  <span>✓ Calidad Auditoría</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">100%</span>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg font-semibold flex items-center justify-between">
                  <span>✓ App Vencimiento</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">100%</span>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg font-semibold flex items-center justify-between">
                  <span>✓ Incidencias DDF-Tácticos (Excel)</span>
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
                  <span>✓ Registro A-C (Apertura/Cierre)</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">100%</span>
                </div>
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg font-semibold flex items-center justify-between">
                  <span>✓ Ventas (% Logro / Crec.)</span>
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
