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
  metaZonaB: number // Por defecto 4.84%
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

export const TIENDAS_ZONA_B_INFO: { codigo: string; nombre: string; lider: string }[] = [
  { codigo: '103', nombre: '103 - Mega Plaza', lider: 'Ronny Mario Colque Sanchez' },
  { codigo: '107', nombre: '107 - Atocongo', lider: 'Edgar Wuffarden' },
  { codigo: '110', nombre: '110 - Huaylas', lider: 'Gerson Pichi Javier' },
  { codigo: '118', nombre: '118 - Bellavista', lider: 'Miguel Vernales Sanchez' },
  { codigo: '155', nombre: '155 - Santa Anita', lider: 'Oneida rojas castro' },
  { codigo: '175', nombre: '175 - San Juan de Miraflores', lider: 'Líder Zona B' },
  { codigo: '193', nombre: '193 - Bellavista Centro', lider: 'Líder Zona B' },
  { codigo: '311', nombre: '311 - Chorrillos', lider: 'Líder Zona B' },
  { codigo: '314', nombre: '314 - San Isidro', lider: 'Líder Zona B' },
  { codigo: '335', nombre: '335 - Fontana', lider: 'Líder Zona B' },
  { codigo: '357', nombre: '357 - Santa María', lider: 'Líder Zona B' },
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
  if (lower.includes('san juan') || lower.includes('miraflores') || lower.includes('sjm')) return '175'
  if (lower.includes('chorrillos')) return '311'
  if (lower.includes('san isidro') || lower.includes('isidro')) return '314'
  if (lower.includes('fontana')) return '335'
  if (lower.includes('santa maria') || lower.includes('santa maría') || lower.includes('maria')) return '357'

  return str
}
