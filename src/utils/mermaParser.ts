import * as XLSX from 'xlsx'
import { ItemMerma, normalizarCodigoTienda, TIENDAS_ZONA_B_INFO } from '@/types/merma'

export interface ResultadoParseoMerma {
  exito: boolean
  mensaje?: string
  items: ItemMerma[]
  totalFilas: number
  totalMermaSoles: number
  totalVentaSoles: number
  porcentajeMermaCalculado: number
  tiendasDetectadas: string[]
  columnasMapeadas: Record<string, string>
  muestraPreview: ItemMerma[]
}

function limpiarNumero(val: any): number {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  const str = String(val)
    .replace(/S\/\.?/gi, '')
    .replace(/,/g, '')
    .replace(/%/g, '')
    .trim()
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}

function encontrarHeader(headers: string[], regexes: RegExp[]): string | undefined {
  for (const regex of regexes) {
    const found = headers.find(h => regex.test(h))
    if (found) return found
  }
  return undefined
}

export function parsearArchivoMerma(
  arrayBuffer: ArrayBuffer,
  periodoNombre: string
): ResultadoParseoMerma {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const primerNombreHoja = workbook.SheetNames[0]
    const hoja = workbook.Sheets[primerNombreHoja]

    // Convertir hoja a JSON crudo
    const filasJson = XLSX.utils.sheet_to_json<Record<string, any>>(hoja, { defval: '' })

    if (!filasJson || filasJson.length === 0) {
      return {
        exito: false,
        mensaje: 'El archivo Excel no contiene filas con datos legibles.',
        items: [],
        totalFilas: 0,
        totalMermaSoles: 0,
        totalVentaSoles: 0,
        porcentajeMermaCalculado: 0,
        tiendasDetectadas: [],
        columnasMapeadas: {},
        muestraPreview: []
      }
    }

    // Identificar encabezados disponibles
    const primerFila = filasJson[0]
    const headers = Object.keys(primerFila)

    // Mapeo inteligente de columnas
    const colTienda = encontrarHeader(headers, [/tienda/i, /local/i, /centro/i, /unidad/i, /sucursal/i, /cod.*tienda/i])
    const colMerma = encontrarHeader(headers, [/merma.*s/i, /merma.*sol/i, /monto.*merma/i, /merma.*total/i, /^merma$/i, /valoriz/i, /merma.*real/i])
    const colVenta = encontrarHeader(headers, [/venta.*s/i, /venta.*sol/i, /venta.*neta/i, /venta.*total/i, /^venta$/i, /presupuesto/i])
    const colPorc = encontrarHeader(headers, [/%/i, /porc/i, /ratio/i])
    const colSeccion = encontrarHeader(headers, [/secci[oó]n/i, /area/i, /[aá]rea/i, /rubro/i, /departamento/i, /divisi[oó]n/i, /categor[ií]a/i])
    const colMotivo = encontrarHeader(headers, [/motivo/i, /causa/i, /tipo.*merma/i, /concepto/i, /raz[oó]n/i])
    const colSku = encontrarHeader(headers, [/sku/i, /material/i, /art[ií]culo/i, /c[oó]digo/i, /cod.*prod/i])
    const colDescripcion = encontrarHeader(headers, [/descripci[oó]n/i, /producto/i, /nombre.*prod/i, /detalle/i])
    const colSemana = encontrarHeader(headers, [/semana/i, /sem/i, /wk/i])
    const colFecha = encontrarHeader(headers, [/fecha/i, /date/i, /dia/i, /d[ií]a/i])

    const columnasMapeadas: Record<string, string> = {
      tienda: colTienda || '(No detectada)',
      mermaSoles: colMerma || '(No detectada)',
      ventaSoles: colVenta || '(Opcional)',
      seccion: colSeccion || '(Opcional)',
      motivo: colMotivo || '(Opcional)',
      sku: colSku || '(Opcional)',
      descripcion: colDescripcion || '(Opcional)'
    }

    const items: ItemMerma[] = []
    const tiendasSet = new Set<string>()
    let acumuladoMerma = 0
    let acumuladoVenta = 0

    filasJson.forEach((row, idx) => {
      // Extraer valor de tienda
      const rawTienda = colTienda ? row[colTienda] : ''
      const codTienda = normalizarCodigoTienda(rawTienda || '103')
      tiendasSet.add(codTienda)

      // Buscar nombre oficial de tienda
      const tiendaInfo = TIENDAS_ZONA_B_INFO.find(t => t.codigo === codTienda)
      const nombreTienda = tiendaInfo ? tiendaInfo.nombre.split(' - ')[1] : `Tienda ${codTienda}`

      const mermaVal = colMerma ? limpiarNumero(row[colMerma]) : 0
      const ventaVal = colVenta ? limpiarNumero(row[colVenta]) : 0
      const porcVal = colPorc ? limpiarNumero(row[colPorc]) : (ventaVal > 0 ? (mermaVal / ventaVal) * 100 : undefined)

      acumuladoMerma += mermaVal
      acumuladoVenta += ventaVal

      items.push({
        id: `item-${Date.now()}-${idx}`,
        tienda: codTienda,
        nombreTienda,
        seccion: colSeccion ? String(row[colSeccion]).trim() : 'General',
        motivo: colMotivo ? String(row[colMotivo]).trim() : 'Merma General',
        sku: colSku ? String(row[colSku]).trim() : undefined,
        descripcion: colDescripcion ? String(row[colDescripcion]).trim() : undefined,
        mermaSoles: mermaVal,
        ventaSoles: ventaVal > 0 ? ventaVal : undefined,
        porcentajeMerma: porcVal,
        semana: colSemana ? String(row[colSemana]).trim() : periodoNombre,
        mes: colFecha ? String(row[colFecha]).trim() : periodoNombre
      })
    })

    const porcentajeGlobal = acumuladoVenta > 0 ? (acumuladoMerma / acumuladoVenta) * 100 : 0

    return {
      exito: true,
      items,
      totalFilas: items.length,
      totalMermaSoles: acumuladoMerma,
      totalVentaSoles: acumuladoVenta,
      porcentajeMermaCalculado: porcentajeGlobal,
      tiendasDetectadas: Array.from(tiendasSet),
      columnasMapeadas,
      muestraPreview: items.slice(0, 10)
    }
  } catch (error: any) {
    return {
      exito: false,
      mensaje: 'Error al procesar el archivo Excel: ' + (error?.message || 'Formato desconocido'),
      items: [],
      totalFilas: 0,
      totalMermaSoles: 0,
      totalVentaSoles: 0,
      porcentajeMermaCalculado: 0,
      tiendasDetectadas: [],
      columnasMapeadas: {},
      muestraPreview: []
    }
  }
}
