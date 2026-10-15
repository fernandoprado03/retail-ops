export interface ItemMerma {
  id?: string
  tienda: string // ej: "103", "107", "110", etc.
  nombreTienda?: string // ej: "Mega Plaza"
  seccion?: string // ej: "PGC", "Perecibles", "Carnes", "Fiambres", etc.
  categoria?: string
  motivo?: string // ej: "Vencimiento", "Merma Operativa", "Rotura", "Desconocida"
  sku?: string
  descripcion?: string
  mermaSoles: number
  ventaSoles?: number
  costoSoles?: number
  porcentajeMerma?: number
  unidades?: number
  fecha?: string
  semana?: string // ej: "Semana 40", "Semana 41", "Semana 42", "Semana 43", etc.
  mes?: string // ej: "Octubre 2024"
  loteId?: string
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

export interface BaseDatosMermaZonaB {
  id?: string
  version: number
  metaZonaB: number // Por defecto 4.84% (según el estándar del boletín J06)
  lotes: CargaMermaLote[]
  itemsConsolidados: ItemMerma[]
  ultimaActualizacion: string
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
  const match = str.match(/\b(103|107|110|118|155|175|193|311|314|335|357)\b/)
  if (match) return match[1]
  return str
}
