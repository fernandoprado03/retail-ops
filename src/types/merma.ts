export interface ItemMerma {
  id?: string
  fecha?: string // YYYY-MM-DD o texto de fecha
  tienda: string // ej: "103", "107", "110", etc.
  nombreTienda?: string // ej: "Mega Plaza"
  sku?: string // Código de producto
  descripcion?: string // Nombre / Descripción de producto
  seccion?: string // Jerarquía 1 (ej. PGC, Perecibles, Carnes, etc.)
  departamento?: string // Jerarquía 2
  categoria?: string // Jerarquía 3
  subcategoria?: string // Jerarquía 4
  motivo?: string // ej: "Vencimiento", "Merma Operativa", "Rotura", "Desconocida"
  mermaSoles: number
  ventaSoles?: number
  costoSoles?: number
  porcentajeMerma?: number
  unidades?: number
  semana?: string // ej: "Semana 40", "Semana 41", "Semana 42", "Semana 43", etc.
  mes?: string // ej: "Octubre 2024"
  loteId?: string
}

export interface ItemVenta {
  id?: string
  fecha?: string
  tienda: string
  nombreTienda?: string
  sku: string
  descripcion?: string
  seccion?: string
  departamento?: string
  categoria?: string
  subcategoria?: string
  ventaSoles: number
  unidades?: number
  semana?: string
  mes?: string
  loteId?: string
}

export interface ObjetivoJerarquia {
  id: string
  tienda: string // 'TODAS' o código de tienda específico (ej. '103')
  nombreTienda?: string
  jerarquia: string // Nombre de sección, departamento o categoría (ej. 'CARNES', 'PGC', 'ZONA B')
  metaRatio: number // Ratio objetivo en % (ej. 4.84, 3.20)
  comentario?: string
}

export interface CargaMermaLote {
  id: string
  nombreLote: string // ej. "Octubre 2024 (Mes Completo)", "Semana 43 - Octubre"
  tipo: 'mes' | 'semana' | 'diario'
  periodo: string // ej. "Octubre 2024" o "Semana 43"
  fechaCarga: string
  totalRegistros: number
  totalMermaSoles: number
  totalVentaSoles: number
  porcentajeMerma: number
  usuarioCarga?: string
  items: ItemMerma[]
}

export interface CargaVentaLote {
  id: string
  nombreLote: string // ej. "Ventas Octubre 2024 (Día por Día)"
  tipo: 'mes' | 'semana' | 'diario'
  periodo: string
  fechaCarga: string
  totalRegistros: number
  totalVentaSoles: number
  totalUnidades?: number
  items: ItemVenta[]
}

export interface BaseDatosMermaZonaB {
  id?: string
  version: number
  metaZonaB: number // Por defecto 0.98% (MC Oficial Octubre)
  lotes: CargaMermaLote[]
  lotesVentas: CargaVentaLote[]
  objetivos: ObjetivoJerarquia[]
  itemsConsolidados: ItemMerma[]
  ventasConsolidadas: ItemVenta[]
  ultimaActualizacion: string
}

export interface CruceSkuAnalisis {
  sku: string
  descripcion: string
  tienda: string
  nombreTienda: string
  seccion: string
  departamento?: string
  categoria?: string
  mermaSoles: number // Costo extendido total
  costoExtendido?: number // Costo extendido equivalente
  costoUnitario?: number // Costo unitario
  ventaSoles: number
  unidadesMerma: number // Unidades mermadas
  unidadesVenta: number
  ratioMermaVenta: number // (mermaSoles / ventaSoles) * 100
  mermaMayorQueVenta: boolean // mermaSoles > ventaSoles
  diferenciaSoles: number // mermaSoles - ventaSoles
  metaRatio?: number
  dentroDeRatio?: boolean // ratioMermaVenta <= metaRatio
  desvioPuntos?: number // ratioMermaVenta - metaRatio
  fecha?: string
}

export const TIENDAS_ZONA_B_INFO: { codigo: string; nombre: string; lider: string; metaMC: number }[] = [
  { codigo: '103', nombre: '103 - Megaplaza', lider: 'Ronny Mario Colque Sanchez', metaMC: 0.96 },
  { codigo: '107', nombre: '107 - Atocongo', lider: 'Edgar Wuffarden', metaMC: 1.09 },
  { codigo: '110', nombre: '110 - Huaylas', lider: 'Gerson Pichi Javier', metaMC: 1.45 },
  { codigo: '118', nombre: '118 - Bellavista', lider: 'Miguel Vernales Sanchez', metaMC: 1.23 },
  { codigo: '155', nombre: '155 - Santa Anita', lider: 'Oneida rojas castro', metaMC: 0.94 },
  { codigo: '175', nombre: '175 - Lima Sur', lider: 'Líder Zona B', metaMC: 0.95 },
  { codigo: '193', nombre: '193 - Puruchuco', lider: 'Líder Zona B', metaMC: 0.94 },
  { codigo: '311', nombre: '311 - Trujillo 1', lider: 'Líder Zona B', metaMC: 0.80 },
  { codigo: '314', nombre: '314 - Trujillo 2', lider: 'Líder Zona B', metaMC: 0.87 },
  { codigo: '335', nombre: '335 - Chimbote', lider: 'Líder Zona B', metaMC: 1.05 },
  { codigo: '357', nombre: '357 - Cuzco La cultura', lider: 'Líder Zona B', metaMC: 0.95 },
]

export function normalizarCodigoTienda(raw: any): string {
  if (!raw) return '103'
  const str = String(raw).trim()
  
  // 1. Coincidencia directa por código numérico de 3 dígitos
  const match = str.match(/\b(103|107|110|118|155|175|193|311|314|335|357)\b/)
  if (match) return match[1]

  // 2. Coincidencia por texto / descripción del local (local desc)
  const lower = str.toLowerCase()
  if (lower.includes('mega') || lower.includes('plaza')) return '103'
  if (lower.includes('atocongo')) return '107'
  if (lower.includes('huaylas')) return '110'
  if (lower.includes('bellavista centro') || (lower.includes('bella') && lower.includes('centro'))) return '193'
  if (lower.includes('bellavista') || lower.includes('bella')) return '118'
  if (lower.includes('santa anita') || lower.includes('anita')) return '155'
  if (lower.includes('lima sur') || lower.includes('san juan') || lower.includes('miraflores') || lower.includes('sjm')) return '175'
  if (lower.includes('puruchuco')) return '193'
  if (lower.includes('trujillo 1') || lower.includes('trujillo1') || lower.includes('chorrillos')) return '311'
  if (lower.includes('trujillo 2') || lower.includes('trujillo2') || lower.includes('isidro')) return '314'
  if (lower.includes('chimbote') || lower.includes('fontana')) return '335'
  if (lower.includes('cuzco') || lower.includes('cusco') || lower.includes('cultura') || lower.includes('santa maría') || lower.includes('santa maria')) return '357'

  return str
}

/**
 * Función flexible para hacer match entre una jerarquía de objetivo (ej. "J04 - FRUTAS Y VERDURAS" o "J04")
 * y una sección/departamento de un SKU o resumen
 */
export function matchJerarquia(jerarquiaObj: string, seccionItem: string): boolean {
  if (!jerarquiaObj || !seccionItem) return false
  const a = jerarquiaObj.toUpperCase().trim()
  const b = seccionItem.toUpperCase().trim()
  if (a === b) return true
  
  // Comparar código J (J01, J02, ..., J99)
  const codeA = a.match(/\b(J\d{2})\b/)?.[1]
  const codeB = b.match(/\b(J\d{2})\b/)?.[1]
  if (codeA && codeB && codeA === codeB) return true
  if (codeA && b.includes(codeA)) return true
  if (codeB && a.includes(codeB)) return true
  
  // Comparar texto limpio sin el prefijo "Jxx - "
  const cleanA = a.replace(/^J\d{2}\s*[-_]?\s*/, '').trim()
  const cleanB = b.replace(/^J\d{2}\s*[-_]?\s*/, '').trim()
  if (cleanA.length >= 3 && cleanB.length >= 3) {
    if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true
  }
  return false
}

/**
 * Metas oficiales de Merma Conocida (MC) extraídas para el mes de Octubre (Mes 10)
 */
export const OBJETIVOS_OCTUBRE_OFICIALES: ObjetivoJerarquia[] = [
  // Metas Globales / Por Tienda (Totales HT de Zona B)
  { id: 'meta-oct-global', tienda: 'TODAS', nombreTienda: 'Toda la Zona B', jerarquia: 'TOTAL ZONA B', metaRatio: 0.98 },
  { id: 'meta-oct-103', tienda: '103', nombreTienda: 'Megaplaza', jerarquia: 'TOTAL', metaRatio: 0.96 },
  { id: 'meta-oct-107', tienda: '107', nombreTienda: 'Atocongo', jerarquia: 'TOTAL', metaRatio: 1.09 },
  { id: 'meta-oct-110', tienda: '110', nombreTienda: 'Huaylas', jerarquia: 'TOTAL', metaRatio: 1.45 },
  { id: 'meta-oct-118', tienda: '118', nombreTienda: 'Bellavista', jerarquia: 'TOTAL', metaRatio: 1.23 },
  { id: 'meta-oct-155', tienda: '155', nombreTienda: 'Santa Anita', jerarquia: 'TOTAL', metaRatio: 0.94 },
  { id: 'meta-oct-175', tienda: '175', nombreTienda: 'Lima Sur', jerarquia: 'TOTAL', metaRatio: 0.95 },
  { id: 'meta-oct-193', tienda: '193', nombreTienda: 'Puruchuco', jerarquia: 'TOTAL', metaRatio: 0.94 },
  { id: 'meta-oct-311', tienda: '311', nombreTienda: 'Trujillo 1', jerarquia: 'TOTAL', metaRatio: 0.80 },
  { id: 'meta-oct-314', tienda: '314', nombreTienda: 'Trujillo 2', jerarquia: 'TOTAL', metaRatio: 0.87 },
  { id: 'meta-oct-335', tienda: '335', nombreTienda: 'Chimbote', jerarquia: 'TOTAL', metaRatio: 1.05 },
  { id: 'meta-oct-357', tienda: '357', nombreTienda: 'Cuzco La cultura', jerarquia: 'TOTAL', metaRatio: 0.95 },

  // LOCAL 103 - MEGAPLAZA por Jerarquía (MC)
  { id: 'oct-103-j01', tienda: '103', nombreTienda: 'Megaplaza', jerarquia: 'J01 - PGC COMESTIBLE', metaRatio: 0.46 },
  { id: 'oct-103-j02', tienda: '103', nombreTienda: 'Megaplaza', jerarquia: 'J02 - PGC NO COMESTIBLE', metaRatio: 0.34 },
  { id: 'oct-103-j03', tienda: '103', nombreTienda: 'Megaplaza', jerarquia: 'J03 - CARNES Y PESCADOS', metaRatio: 3.19 },
  { id: 'oct-103-j04', tienda: '103', nombreTienda: 'Megaplaza', jerarquia: 'J04 - FRUTAS Y VERDURAS', metaRatio: 7.51 },
  { id: 'oct-103-j05', tienda: '103', nombreTienda: 'Megaplaza', jerarquia: 'J05 - FLC', metaRatio: 1.02 },
  { id: 'oct-103-j06', tienda: '103', nombreTienda: 'Megaplaza', jerarquia: 'J06 - PANADERIA Y PASTELERIA', metaRatio: 3.74 },
  { id: 'oct-103-j07', tienda: '103', nombreTienda: 'Megaplaza', jerarquia: 'J07 - PLATOS PREPARADOS', metaRatio: 5.50 },
  { id: 'oct-103-j08', tienda: '103', nombreTienda: 'Megaplaza', jerarquia: 'J08 - VESTUARIO', metaRatio: 0.07 },
  { id: 'oct-103-j09', tienda: '103', nombreTienda: 'Megaplaza', jerarquia: 'J09 - HOGAR', metaRatio: 0.22 },
  { id: 'oct-103-j10', tienda: '103', nombreTienda: 'Megaplaza', jerarquia: 'J10 - BAZAR', metaRatio: 0.62 },
  { id: 'oct-103-j11', tienda: '103', nombreTienda: 'Megaplaza', jerarquia: 'J11 - ELECTROHOGAR', metaRatio: 0.06 },
  { id: 'oct-103-j12', tienda: '103', nombreTienda: 'Megaplaza', jerarquia: 'J12 - INSTITUCIONALES', metaRatio: 0.00 },
  { id: 'oct-103-j99', tienda: '103', nombreTienda: 'Megaplaza', jerarquia: 'J99 - ADMINISTRATIVA', metaRatio: 0.00 },

  // LOCAL 107 - ATOCONGO por Jerarquía (MC)
  { id: 'oct-107-j01', tienda: '107', nombreTienda: 'Atocongo', jerarquia: 'J01 - PGC COMESTIBLE', metaRatio: 0.68 },
  { id: 'oct-107-j02', tienda: '107', nombreTienda: 'Atocongo', jerarquia: 'J02 - PGC NO COMESTIBLE', metaRatio: 0.42 },
  { id: 'oct-107-j03', tienda: '107', nombreTienda: 'Atocongo', jerarquia: 'J03 - CARNES Y PESCADOS', metaRatio: 5.12 },
  { id: 'oct-107-j04', tienda: '107', nombreTienda: 'Atocongo', jerarquia: 'J04 - FRUTAS Y VERDURAS', metaRatio: 9.13 },
  { id: 'oct-107-j05', tienda: '107', nombreTienda: 'Atocongo', jerarquia: 'J05 - FLC', metaRatio: 1.70 },
  { id: 'oct-107-j06', tienda: '107', nombreTienda: 'Atocongo', jerarquia: 'J06 - PANADERIA Y PASTELERIA', metaRatio: 6.39 },
  { id: 'oct-107-j07', tienda: '107', nombreTienda: 'Atocongo', jerarquia: 'J07 - PLATOS PREPARADOS', metaRatio: 5.27 },
  { id: 'oct-107-j08', tienda: '107', nombreTienda: 'Atocongo', jerarquia: 'J08 - VESTUARIO', metaRatio: 0.08 },
  { id: 'oct-107-j09', tienda: '107', nombreTienda: 'Atocongo', jerarquia: 'J09 - HOGAR', metaRatio: 0.22 },
  { id: 'oct-107-j10', tienda: '107', nombreTienda: 'Atocongo', jerarquia: 'J10 - BAZAR', metaRatio: 0.68 },
  { id: 'oct-107-j11', tienda: '107', nombreTienda: 'Atocongo', jerarquia: 'J11 - ELECTROHOGAR', metaRatio: 0.07 },
  { id: 'oct-107-j12', tienda: '107', nombreTienda: 'Atocongo', jerarquia: 'J12 - INSTITUCIONALES', metaRatio: 0.00 },
  { id: 'oct-107-j99', tienda: '107', nombreTienda: 'Atocongo', jerarquia: 'J99 - ADMINISTRATIVA', metaRatio: 0.00 },

  // LOCAL 110 - HUAYLAS por Jerarquía (MC)
  { id: 'oct-110-j01', tienda: '110', nombreTienda: 'Huaylas', jerarquia: 'J01 - PGC COMESTIBLE', metaRatio: 0.65 },
  { id: 'oct-110-j02', tienda: '110', nombreTienda: 'Huaylas', jerarquia: 'J02 - PGC NO COMESTIBLE', metaRatio: 0.41 },
  { id: 'oct-110-j03', tienda: '110', nombreTienda: 'Huaylas', jerarquia: 'J03 - CARNES Y PESCADOS', metaRatio: 5.21 },
  { id: 'oct-110-j04', tienda: '110', nombreTienda: 'Huaylas', jerarquia: 'J04 - FRUTAS Y VERDURAS', metaRatio: 9.19 },
  { id: 'oct-110-j05', tienda: '110', nombreTienda: 'Huaylas', jerarquia: 'J05 - FLC', metaRatio: 1.91 },
  { id: 'oct-110-j06', tienda: '110', nombreTienda: 'Huaylas', jerarquia: 'J06 - PANADERIA Y PASTELERIA', metaRatio: 6.76 },
  { id: 'oct-110-j07', tienda: '110', nombreTienda: 'Huaylas', jerarquia: 'J07 - PLATOS PREPARADOS', metaRatio: 4.19 },
  { id: 'oct-110-j08', tienda: '110', nombreTienda: 'Huaylas', jerarquia: 'J08 - VESTUARIO', metaRatio: 0.08 },
  { id: 'oct-110-j09', tienda: '110', nombreTienda: 'Huaylas', jerarquia: 'J09 - HOGAR', metaRatio: 0.47 },
  { id: 'oct-110-j10', tienda: '110', nombreTienda: 'Huaylas', jerarquia: 'J10 - BAZAR', metaRatio: 1.11 },
  { id: 'oct-110-j11', tienda: '110', nombreTienda: 'Huaylas', jerarquia: 'J11 - ELECTROHOGAR', metaRatio: 0.10 },
  { id: 'oct-110-j12', tienda: '110', nombreTienda: 'Huaylas', jerarquia: 'J12 - INSTITUCIONALES', metaRatio: 0.00 },
  { id: 'oct-110-j99', tienda: '110', nombreTienda: 'Huaylas', jerarquia: 'J99 - ADMINISTRATIVA', metaRatio: 0.00 },

  // LOCAL 118 - BELLAVISTA por Jerarquía (MC)
  { id: 'oct-118-j01', tienda: '118', nombreTienda: 'Bellavista', jerarquia: 'J01 - PGC COMESTIBLE', metaRatio: 0.62 },
  { id: 'oct-118-j02', tienda: '118', nombreTienda: 'Bellavista', jerarquia: 'J02 - PGC NO COMESTIBLE', metaRatio: 0.36 },
  { id: 'oct-118-j03', tienda: '118', nombreTienda: 'Bellavista', jerarquia: 'J03 - CARNES Y PESCADOS', metaRatio: 4.30 },
  { id: 'oct-118-j04', tienda: '118', nombreTienda: 'Bellavista', jerarquia: 'J04 - FRUTAS Y VERDURAS', metaRatio: 8.15 },
  { id: 'oct-118-j05', tienda: '118', nombreTienda: 'Bellavista', jerarquia: 'J05 - FLC', metaRatio: 1.66 },
  { id: 'oct-118-j06', tienda: '118', nombreTienda: 'Bellavista', jerarquia: 'J06 - PANADERIA Y PASTELERIA', metaRatio: 5.92 },
  { id: 'oct-118-j07', tienda: '118', nombreTienda: 'Bellavista', jerarquia: 'J07 - PLATOS PREPARADOS', metaRatio: 3.55 },
  { id: 'oct-118-j08', tienda: '118', nombreTienda: 'Bellavista', jerarquia: 'J08 - VESTUARIO', metaRatio: 0.07 },
  { id: 'oct-118-j09', tienda: '118', nombreTienda: 'Bellavista', jerarquia: 'J09 - HOGAR', metaRatio: 0.26 },
  { id: 'oct-118-j10', tienda: '118', nombreTienda: 'Bellavista', jerarquia: 'J10 - BAZAR', metaRatio: 0.53 },
  { id: 'oct-118-j11', tienda: '118', nombreTienda: 'Bellavista', jerarquia: 'J11 - ELECTROHOGAR', metaRatio: 0.07 },
  { id: 'oct-118-j12', tienda: '118', nombreTienda: 'Bellavista', jerarquia: 'J12 - INSTITUCIONALES', metaRatio: 0.00 },
  { id: 'oct-118-j99', tienda: '118', nombreTienda: 'Bellavista', jerarquia: 'J99 - ADMINISTRATIVA', metaRatio: 0.00 },
]

