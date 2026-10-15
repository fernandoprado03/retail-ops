import * as XLSX from 'xlsx'
import {
  ItemMerma,
  ItemVenta,
  ObjetivoJerarquia,
  CruceSkuAnalisis,
  normalizarCodigoTienda,
  TIENDAS_ZONA_B_INFO
} from '@/types/merma'

export interface ResultadoParseoMerma {
  exito: boolean
  mensaje?: string
  items: ItemMerma[]
  totalFilas: number
  totalMermaSoles: number
  totalVentaSoles: number
  porcentajeMermaCalculado: number
  tiendasDetectadas: string[]
  skusDetectados: number
  columnasMapeadas: Record<string, string>
  muestraPreview: ItemMerma[]
}

export interface ResultadoParseoVenta {
  exito: boolean
  mensaje?: string
  items: ItemVenta[]
  totalFilas: number
  totalVentaSoles: number
  totalUnidades: number
  tiendasDetectadas: string[]
  skusDetectados: number
  columnasMapeadas: Record<string, string>
  muestraPreview: ItemVenta[]
}

export interface ResultadoParseoObjetivos {
  exito: boolean
  mensaje?: string
  objetivos: ObjetivoJerarquia[]
  totalFilas: number
  tiendasDetectadas: string[]
  jerarquiasDetectadas: string[]
  muestraPreview: ObjetivoJerarquia[]
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

function formatearFechaExcel(val: any): string {
  if (!val) return ''
  if (typeof val === 'number') {
    // Serial number de Excel
    try {
      const date = new Date(Math.round((val - (25567 + 2)) * 86400 * 1000))
      return date.toISOString().slice(0, 10)
    } catch (e) {
      return String(val)
    }
  }
  return String(val).trim()
}

function encontrarHeader(headers: string[], regexes: RegExp[]): string | undefined {
  for (const regex of regexes) {
    const found = headers.find(h => regex.test(h))
    if (found) return found
  }
  return undefined
}

/**
 * Parsea el archivo de Merma Día por Día
 */
export function parsearArchivoMerma(
  arrayBuffer: ArrayBuffer,
  periodoNombre: string
): ResultadoParseoMerma {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const primerNombreHoja = workbook.SheetNames[0]
    const hoja = workbook.Sheets[primerNombreHoja]
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
        skusDetectados: 0,
        columnasMapeadas: {},
        muestraPreview: []
      }
    }

    const headers = Object.keys(filasJson[0])

    const colTienda = encontrarHeader(headers, [/tienda/i, /local/i, /centro/i, /unidad/i, /sucursal/i, /cod.*tienda/i])
    const colFecha = encontrarHeader(headers, [/fecha/i, /date/i, /d[ií]a/i])
    const colSku = encontrarHeader(headers, [/sku/i, /material/i, /art[ií]culo/i, /c[oó]digo.*prod/i, /^c[oó]digo$/i])
    const colDescripcion = encontrarHeader(headers, [/descripci[oó]n/i, /producto/i, /nombre.*prod/i, /detalle/i, /denominaci[oó]n/i])
    const colSeccion = encontrarHeader(headers, [/secci[oó]n/i, /divisi[oó]n/i, /negocio/i, /gerencia/i])
    const colDepto = encontrarHeader(headers, [/departamento/i, /depto/i, /categor[ií]a/i, /rubro/i])
    const colCat = encontrarHeader(headers, [/subcategor[ií]a/i, /subrubro/i, /clase/i, /l[ií]nea/i])
    const colMotivo = encontrarHeader(headers, [/motivo/i, /causa/i, /tipo.*merma/i, /concepto/i, /raz[oó]n/i])
    const colMerma = encontrarHeader(headers, [/merma.*s/i, /merma.*sol/i, /monto.*merma/i, /merma.*total/i, /^merma$/i, /valoriz/i, /merma.*real/i, /importe/i])
    const colVenta = encontrarHeader(headers, [/venta.*s/i, /venta.*sol/i, /venta.*neta/i, /venta.*total/i, /^venta$/i])
    const colUnidades = encontrarHeader(headers, [/unidades/i, /cantidad/i, /cant/i, /cant.*merma/i, /piezas/i])

    const columnasMapeadas: Record<string, string> = {
      tienda: colTienda || '(No detectada)',
      fecha: colFecha || '(Opcional)',
      sku: colSku || '(Opcional)',
      descripcion: colDescripcion || '(Opcional)',
      seccion: colSeccion || '(Opcional)',
      departamento: colDepto || '(Opcional)',
      categoria: colCat || '(Opcional)',
      motivo: colMotivo || '(Opcional)',
      mermaSoles: colMerma || '(No detectada)',
      ventaSoles: colVenta || '(Opcional)',
      unidades: colUnidades || '(Opcional)'
    }

    const items: ItemMerma[] = []
    const tiendasSet = new Set<string>()
    const skusSet = new Set<string>()
    let acumuladoMerma = 0
    let acumuladoVenta = 0

    filasJson.forEach((row, idx) => {
      const rawTienda = colTienda ? row[colTienda] : ''
      const codTienda = normalizarCodigoTienda(rawTienda || '103')
      tiendasSet.add(codTienda)

      const tiendaInfo = TIENDAS_ZONA_B_INFO.find(t => t.codigo === codTienda)
      const nombreTienda = tiendaInfo ? tiendaInfo.nombre.split(' - ')[1] : `Tienda ${codTienda}`

      const mermaVal = colMerma ? limpiarNumero(row[colMerma]) : 0
      const ventaVal = colVenta ? limpiarNumero(row[colVenta]) : 0
      const unidadesVal = colUnidades ? limpiarNumero(row[colUnidades]) : undefined
      const skuVal = colSku ? String(row[colSku]).trim() : `SKU-${idx}`
      if (skuVal) skusSet.add(skuVal)

      acumuladoMerma += mermaVal
      acumuladoVenta += ventaVal

      const fechaVal = colFecha ? formatearFechaExcel(row[colFecha]) : undefined

      items.push({
        id: `m-${Date.now()}-${idx}`,
        fecha: fechaVal,
        tienda: codTienda,
        nombreTienda,
        sku: skuVal,
        descripcion: colDescripcion ? String(row[colDescripcion]).trim() : undefined,
        seccion: colSeccion ? String(row[colSeccion]).trim().toUpperCase() : 'GENERAL',
        departamento: colDepto ? String(row[colDepto]).trim().toUpperCase() : undefined,
        categoria: colCat ? String(row[colCat]).trim().toUpperCase() : undefined,
        motivo: colMotivo ? String(row[colMotivo]).trim() : 'Merma General',
        mermaSoles: mermaVal,
        ventaSoles: ventaVal > 0 ? ventaVal : undefined,
        unidades: unidadesVal,
        mes: periodoNombre
      })
    })

    const ratioGlobal = acumuladoVenta > 0 ? (acumuladoMerma / acumuladoVenta) * 100 : 0

    return {
      exito: true,
      items,
      totalFilas: items.length,
      totalMermaSoles: acumuladoMerma,
      totalVentaSoles: acumuladoVenta,
      porcentajeMermaCalculado: ratioGlobal,
      tiendasDetectadas: Array.from(tiendasSet),
      skusDetectados: skusSet.size,
      columnasMapeadas,
      muestraPreview: items.slice(0, 10)
    }
  } catch (error: any) {
    return {
      exito: false,
      mensaje: 'Error al procesar el archivo Excel de Merma: ' + (error?.message || 'Formato desconocido'),
      items: [],
      totalFilas: 0,
      totalMermaSoles: 0,
      totalVentaSoles: 0,
      porcentajeMermaCalculado: 0,
      tiendasDetectadas: [],
      skusDetectados: 0,
      columnasMapeadas: {},
      muestraPreview: []
    }
  }
}

/**
 * Parsea el archivo de Ventas Día por Día
 */
export function parsearArchivoVentas(
  arrayBuffer: ArrayBuffer,
  periodoNombre: string
): ResultadoParseoVenta {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const primerNombreHoja = workbook.SheetNames[0]
    const hoja = workbook.Sheets[primerNombreHoja]
    const filasJson = XLSX.utils.sheet_to_json<Record<string, any>>(hoja, { defval: '' })

    if (!filasJson || filasJson.length === 0) {
      return {
        exito: false,
        mensaje: 'El archivo Excel de ventas no contiene filas con datos legibles.',
        items: [],
        totalFilas: 0,
        totalVentaSoles: 0,
        totalUnidades: 0,
        tiendasDetectadas: [],
        skusDetectados: 0,
        columnasMapeadas: {},
        muestraPreview: []
      }
    }

    const headers = Object.keys(filasJson[0])

    const colTienda = encontrarHeader(headers, [/tienda/i, /local/i, /centro/i, /unidad/i, /sucursal/i, /cod.*tienda/i])
    const colFecha = encontrarHeader(headers, [/fecha/i, /date/i, /d[ií]a/i])
    const colSku = encontrarHeader(headers, [/sku/i, /material/i, /art[ií]culo/i, /c[oó]digo.*prod/i, /^c[oó]digo$/i])
    const colDescripcion = encontrarHeader(headers, [/descripci[oó]n/i, /producto/i, /nombre.*prod/i, /detalle/i, /denominaci[oó]n/i])
    const colSeccion = encontrarHeader(headers, [/secci[oó]n/i, /divisi[oó]n/i, /negocio/i, /gerencia/i])
    const colDepto = encontrarHeader(headers, [/departamento/i, /depto/i, /categor[ií]a/i, /rubro/i])
    const colCat = encontrarHeader(headers, [/subcategor[ií]a/i, /subrubro/i, /clase/i, /l[ií]nea/i])
    const colVenta = encontrarHeader(headers, [/venta.*s/i, /venta.*sol/i, /venta.*neta/i, /venta.*total/i, /^venta$/i, /monto/i, /importe/i])
    const colUnidades = encontrarHeader(headers, [/unidades/i, /cantidad/i, /cant/i, /piezas/i, /volumen/i])

    const columnasMapeadas: Record<string, string> = {
      tienda: colTienda || '(No detectada)',
      fecha: colFecha || '(Opcional)',
      sku: colSku || '(No detectada)',
      descripcion: colDescripcion || '(Opcional)',
      ventaSoles: colVenta || '(No detectada)',
      unidades: colUnidades || '(Opcional)',
      seccion: colSeccion || '(Opcional)'
    }

    const items: ItemVenta[] = []
    const tiendasSet = new Set<string>()
    const skusSet = new Set<string>()
    let totalVentas = 0
    let totalUnidades = 0

    filasJson.forEach((row, idx) => {
      const rawTienda = colTienda ? row[colTienda] : ''
      const codTienda = normalizarCodigoTienda(rawTienda || '103')
      tiendasSet.add(codTienda)

      const tiendaInfo = TIENDAS_ZONA_B_INFO.find(t => t.codigo === codTienda)
      const nombreTienda = tiendaInfo ? tiendaInfo.nombre.split(' - ')[1] : `Tienda ${codTienda}`

      const ventaVal = colVenta ? limpiarNumero(row[colVenta]) : 0
      const unidadesVal = colUnidades ? limpiarNumero(row[colUnidades]) : 0
      const skuVal = colSku ? String(row[colSku]).trim() : `SKU-${idx}`
      if (skuVal) skusSet.add(skuVal)

      totalVentas += ventaVal
      totalUnidades += unidadesVal

      const fechaVal = colFecha ? formatearFechaExcel(row[colFecha]) : undefined

      items.push({
        id: `v-${Date.now()}-${idx}`,
        fecha: fechaVal,
        tienda: codTienda,
        nombreTienda,
        sku: skuVal,
        descripcion: colDescripcion ? String(row[colDescripcion]).trim() : undefined,
        seccion: colSeccion ? String(row[colSeccion]).trim().toUpperCase() : 'GENERAL',
        departamento: colDepto ? String(row[colDepto]).trim().toUpperCase() : undefined,
        categoria: colCat ? String(row[colCat]).trim().toUpperCase() : undefined,
        ventaSoles: ventaVal,
        unidades: unidadesVal,
        mes: periodoNombre
      })
    })

    return {
      exito: true,
      items,
      totalFilas: items.length,
      totalVentaSoles: totalVentas,
      totalUnidades,
      tiendasDetectadas: Array.from(tiendasSet),
      skusDetectados: skusSet.size,
      columnasMapeadas,
      muestraPreview: items.slice(0, 10)
    }
  } catch (error: any) {
    return {
      exito: false,
      mensaje: 'Error al procesar el archivo Excel de Ventas: ' + (error?.message || 'Formato desconocido'),
      items: [],
      totalFilas: 0,
      totalVentaSoles: 0,
      totalUnidades: 0,
      tiendasDetectadas: [],
      skusDetectados: 0,
      columnasMapeadas: {},
      muestraPreview: []
    }
  }
}

/**
 * Parsea el archivo de Objetivos / Metas por Tienda y Jerarquía
 */
export function parsearArchivoObjetivos(
  arrayBuffer: ArrayBuffer
): ResultadoParseoObjetivos {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const primerNombreHoja = workbook.SheetNames[0]
    const hoja = workbook.Sheets[primerNombreHoja]
    const filasJson = XLSX.utils.sheet_to_json<Record<string, any>>(hoja, { defval: '' })

    if (!filasJson || filasJson.length === 0) {
      return {
        exito: false,
        mensaje: 'El archivo Excel de objetivos no contiene filas con datos legibles.',
        objetivos: [],
        totalFilas: 0,
        tiendasDetectadas: [],
        jerarquiasDetectadas: [],
        muestraPreview: []
      }
    }

    const headers = Object.keys(filasJson[0])

    const colTienda = encontrarHeader(headers, [/tienda/i, /local/i, /centro/i, /sucursal/i, /cod.*tienda/i])
    const colJerarquia = encontrarHeader(headers, [/jerarqu[ií]a/i, /secci[oó]n/i, /rubro/i, /departamento/i, /categor[ií]a/i, /divisi[oó]n/i, /área/i, /area/i])
    const colRatio = encontrarHeader(headers, [/ratio/i, /meta/i, /objetivo/i, /%/i, /target/i, /presupuesto/i])

    const objetivos: ObjetivoJerarquia[] = []
    const tiendasSet = new Set<string>()
    const jerarquiasSet = new Set<string>()

    filasJson.forEach((row, idx) => {
      const rawTienda = colTienda ? row[colTienda] : 'TODAS'
      const codTienda = rawTienda && String(rawTienda).toLowerCase() !== 'todas' && String(rawTienda).toLowerCase() !== 'zona b'
        ? normalizarCodigoTienda(rawTienda)
        : 'TODAS'
      tiendasSet.add(codTienda)

      const rawJerarquia = colJerarquia ? String(row[colJerarquia]).trim().toUpperCase() : 'GENERAL'
      jerarquiasSet.add(rawJerarquia)

      const metaRatioVal = colRatio ? limpiarNumero(row[colRatio]) : 4.84

      const tiendaInfo = codTienda !== 'TODAS' ? TIENDAS_ZONA_B_INFO.find(t => t.codigo === codTienda) : undefined
      const nombreTienda = codTienda === 'TODAS' ? 'Toda la Zona B' : (tiendaInfo ? tiendaInfo.nombre.split(' - ')[1] : `Tienda ${codTienda}`)

      objetivos.push({
        id: `obj-${idx}`,
        tienda: codTienda,
        nombreTienda,
        jerarquia: rawJerarquia,
        metaRatio: metaRatioVal
      })
    })

    return {
      exito: true,
      objetivos,
      totalFilas: objetivos.length,
      tiendasDetectadas: Array.from(tiendasSet),
      jerarquiasDetectadas: Array.from(jerarquiasSet),
      muestraPreview: objetivos.slice(0, 10)
    }
  } catch (error: any) {
    return {
      exito: false,
      mensaje: 'Error al procesar el archivo de objetivos: ' + (error?.message || 'Formato desconocido'),
      objetivos: [],
      totalFilas: 0,
      tiendasDetectadas: [],
      jerarquiasDetectadas: [],
      muestraPreview: []
    }
  }
}

/**
 * Cruce inteligente de Merma y Ventas por SKU, Tienda y Jerarquía
 */
export function generarCruceMermaVentas(
  mermas: ItemMerma[],
  ventas: ItemVenta[],
  objetivos: ObjetivoJerarquia[] = []
): CruceSkuAnalisis[] {
  // Mapa de Ventas por clave compuesta (Tienda_SKU)
  const ventasMap = new Map<string, { ventaSoles: number; unidades: number; desc?: string; seccion?: string; depto?: string; cat?: string }>()

  ventas.forEach(v => {
    const key = `${v.tienda}_${v.sku}`
    const existing = ventasMap.get(key) || { ventaSoles: 0, unidades: 0 }
    ventasMap.set(key, {
      ventaSoles: existing.ventaSoles + v.ventaSoles,
      unidades: existing.unidades + (v.unidades || 0),
      desc: v.descripcion || existing.desc,
      seccion: v.seccion || existing.seccion,
      depto: v.departamento || existing.depto,
      cat: v.categoria || existing.cat
    })
  })

  // Agrupación de Merma por clave compuesta (Tienda_SKU)
  const mermasMap = new Map<string, { mermaSoles: number; unidades: number; tienda: string; nombreTienda: string; sku: string; desc?: string; seccion?: string; depto?: string; cat?: string }>()

  mermas.forEach(m => {
    const key = `${m.tienda}_${m.sku || 'SIN_SKU'}`
    const existing = mermasMap.get(key) || {
      mermaSoles: 0,
      unidades: 0,
      tienda: m.tienda,
      nombreTienda: m.nombreTienda || `Tienda ${m.tienda}`,
      sku: m.sku || 'SIN_SKU'
    }

    mermasMap.set(key, {
      ...existing,
      mermaSoles: existing.mermaSoles + m.mermaSoles,
      unidades: existing.unidades + (m.unidades || 0),
      desc: m.descripcion || existing.desc,
      seccion: m.seccion || existing.seccion,
      depto: m.departamento || existing.depto,
      cat: m.categoria || existing.cat
    })
  })

  // Generar lista consolidada cruzada
  const resultado: CruceSkuAnalisis[] = []

  mermasMap.forEach((mermaData, key) => {
    const ventaData = ventasMap.get(key)
    const ventaSoles = ventaData?.ventaSoles || 0
    const unidadesVenta = ventaData?.unidades || 0
    const ratio = ventaSoles > 0 ? (mermaData.mermaSoles / ventaSoles) * 100 : (mermaData.mermaSoles > 0 ? 100 : 0)

    const seccionFinal = mermaData.seccion || ventaData?.seccion || 'GENERAL'
    const descripcionFinal = mermaData.desc || ventaData?.desc || `Producto SKU ${mermaData.sku}`

    // Buscar objetivo específico para esta tienda y jerarquía
    const objEspecifico = objetivos.find(o => 
      (o.tienda === mermaData.tienda || o.tienda === 'TODAS') &&
      o.jerarquia.toUpperCase() === seccionFinal.toUpperCase()
    )
    const metaRatio = objEspecifico ? objEspecifico.metaRatio : 4.84
    const dentroDeRatio = ventaSoles > 0 ? ratio <= metaRatio : false
    const desvioPuntos = ratio - metaRatio

    resultado.push({
      sku: mermaData.sku,
      descripcion: descripcionFinal,
      tienda: mermaData.tienda,
      nombreTienda: mermaData.nombreTienda,
      seccion: seccionFinal,
      departamento: mermaData.depto || ventaData?.depto,
      categoria: mermaData.cat || ventaData?.cat,
      mermaSoles: mermaData.mermaSoles,
      ventaSoles,
      unidadesMerma: mermaData.unidades,
      unidadesVenta,
      ratioMermaVenta: ratio,
      mermaMayorQueVenta: mermaData.mermaSoles > ventaSoles,
      diferenciaSoles: mermaData.mermaSoles - ventaSoles,
      metaRatio,
      dentroDeRatio,
      desvioPuntos
    })
  })

  // Ordenar por mayor merma en soles
  return resultado.sort((a, b) => b.mermaSoles - a.mermaSoles)
}
