import ExcelJS from 'exceljs'
import demoDataRaw from './malla_demo_data.json'

export interface TurnoDiaCajero {
  diaNombre: string
  fechaStr: string
  inicio?: number
  fin?: number
  breakInicio?: number
  breakFin?: number
  isSCO?: boolean
  actividad?: string
  isLibre?: boolean
}

export interface CajeroSemanal {
  nombre: string
  codigo: string
  contrato: string
  tienda: string
  unidadTrabajo: string
  dias: TurnoDiaCajero[]
}

export interface SemanaMallaData {
  tituloSemana: string
  cajeros: CajeroSemanal[]
  diasSemana: { diaNombre: string; fechaStr: string }[]
}

export const CATALOGO_CAJEROS_DEFAULT: Record<string, { nombre: string; dni: string; contrato: string }> = {
  'Achaquihui Mamani Rocio': { nombre: 'Achaquihui Mamani Rocio', dni: '72639352', contrato: 'FT' },
  'Ayala Mirano Natalia': { nombre: 'Ayala Mirano Natalia', dni: '77476064', contrato: 'FT' },
  'Castro Calvo Ruth Maruxa': { nombre: 'Castro Calvo Ruth Maruxa', dni: '75853354', contrato: 'FT' },
  'Cuadros Ccopa Yhozzolee Mayumy': { nombre: 'Cuadros Ccopa Yhozzolee Mayumy', dni: '47335435', contrato: 'FT' },
  'Guzman Lazarte Rosmery': { nombre: 'Guzman Lazarte Rosmery', dni: '48250447', contrato: 'FT' },
  'Inchicsana Vargas Flor Nathalie': { nombre: 'Inchicsana Vargas Flor Nathalie', dni: '76257520', contrato: 'FT' },
  'Macedo Bravo Nohemi': { nombre: 'Macedo Bravo Nohemi', dni: '77658554', contrato: 'FT' },
  'Machaca Mamani Sheyla Melani': { nombre: 'Machaca Mamani Sheyla Melani', dni: '72948858', contrato: 'FT' },
  'Mañaccasa Quispe Lizbeth': { nombre: 'Mañaccasa Quispe Lizbeth', dni: '77216619', contrato: 'FT' },
  'Pando Suca Lady Evelyn': { nombre: 'Pando Suca Lady Evelyn', dni: '48385094', contrato: 'FT' },
  'Quinto Huaraka Lizeth': { nombre: 'Quinto Huaraka Lizeth', dni: '75363037', contrato: 'FT' },
  'Tinco Cortez Celeste Brygith': { nombre: 'Tinco Cortez Celeste Brygith', dni: '76047683', contrato: 'FT' },
  'Yañez Cavides Barbara Fransheska': { nombre: 'Yañez Cavides Barbara Fransheska', dni: '72900098', contrato: 'FT' },
  'Arenas Villavicencio Shadai Zaza': { nombre: 'Arenas Villavicencio Shadai Zaza', dni: '75059550', contrato: 'PT' },
  'Arias Pantigoso Katherina Azusena': { nombre: 'Arias Pantigoso Katherina Azusena', dni: '70409111', contrato: 'PT' },
  'Cconchoy Soncco Flor Gimena': { nombre: 'Cconchoy Soncco Flor Gimena', dni: '76540563', contrato: 'PT' },
  'Noalcca Machacca Eliana': { nombre: 'Noalcca Machacca Eliana', dni: '76594463', contrato: 'PT' },
  'Rimachi Escobedo Alessandra': { nombre: 'Rimachi Escobedo Alessandra', dni: '74883409', contrato: 'PT' },
  'Rimasca Roque Jimena Maricielo': { nombre: 'Rimasca Roque Jimena Maricielo', dni: '73029814', contrato: 'PT' },
}

export const MALLA_DEMO_DATA = demoDataRaw as any[]

export function formatTime(fraction?: number): string {
  if (fraction === undefined || isNaN(fraction)) return '00:00'
  const h = Math.floor(fraction) % 24
  const m = Math.round((fraction - Math.floor(fraction)) * 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function parseFechaReporte(fechaRaw: string, index = 0): { diaNombre: string; fechaStr: string } {
  const raw = (fechaRaw || '').trim().toLowerCase()
  let diaNombre = 'lunes'
  const dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

  if (raw.includes('lun')) diaNombre = 'lunes'
  else if (raw.includes('mar')) diaNombre = 'martes'
  else if (raw.includes('mié') || raw.includes('mie')) diaNombre = 'miércoles'
  else if (raw.includes('jue')) diaNombre = 'jueves'
  else if (raw.includes('vie')) diaNombre = 'viernes'
  else if (raw.includes('sáb') || raw.includes('sab')) diaNombre = 'sábado'
  else if (raw.includes('dom')) diaNombre = 'domingo'
  else diaNombre = dias[index % 7]

  let fechaStr = fechaRaw
  const matchNum = raw.match(/(\d{1,2})/)
  if (matchNum) {
    const dayNum = matchNum[1].padStart(2, '0')
    const year = 2026
    let month = '10'
    if (raw.includes('sep') || raw.includes('set')) month = '09'
    if (raw.includes('nov')) month = '11'
    if (raw.includes('dic')) month = '12'
    if (raw.includes('/')) {
      fechaStr = fechaRaw
    } else {
      fechaStr = `${dayNum}/${month}/${year}`
    }
  }
  return { diaNombre, fechaStr }
}

export function timeToCol(fraction: number): number {
  const h = Math.floor(fraction)
  const q = Math.round((fraction - h) * 4)
  if (h < 6) return Math.max(3, 3 + Math.round(fraction * 4))
  return Math.min(102, 30 + (h - 6) * 4 + q)
}

export function agruparMallaPorCajero(reporte: any[], semanaOffset = 0): SemanaMallaData {
  const dataset = (reporte && reporte.length > 0) ? reporte : MALLA_DEMO_DATA
  const sliceStart = semanaOffset * 7
  const sliceEnd = Math.min(sliceStart + 7, dataset.length)
  const diasSeleccionados = dataset.slice(sliceStart, sliceEnd)

  const diasSemana = diasSeleccionados.map((d, i) => parseFechaReporte(d.fecha, i))

  const fechaIni = diasSemana[0]?.fechaStr || '05/10/2026'
  const fechaFin = diasSemana[diasSemana.length - 1]?.fechaStr || '11/10/2026'
  const tituloSemana = `Malla de turnos desde el ${fechaIni} al ${fechaFin}`

  // Reunir todos los cajeros únicos
  const mapCajeros: Record<string, CajeroSemanal> = {}

  diasSeleccionados.forEach((dia, diaIdx) => {
    const { diaNombre, fechaStr } = diasSemana[diaIdx]
    const empleados = dia.empleados || []

    empleados.forEach((emp: any) => {
      if (!emp || !emp.nombre) return
      const nombre = emp.nombre.trim()
      if (nombre.length < 3) return

      if (!mapCajeros[nombre]) {
        const cat = CATALOGO_CAJEROS_DEFAULT[nombre]
        mapCajeros[nombre] = {
          nombre,
          codigo: emp.codigo || cat?.dni || '72000000',
          contrato: emp.contrato || cat?.contrato || 'FT',
          tienda: emp.tienda || '357-Cuzco La Cultura',
          unidadTrabajo: emp.unidadTrabajo || 'Unidad de trabajo Cajas',
          dias: diasSemana.map(ds => ({
            diaNombre: ds.diaNombre,
            fechaStr: ds.fechaStr,
            isLibre: true
          }))
        }
      }

      // Asignar el turno para este día
      const diaCajero = mapCajeros[nombre].dias[diaIdx]
      if (diaCajero) {
        diaCajero.inicio = emp.inicio
        diaCajero.fin = emp.fin
        diaCajero.breakInicio = emp.breakInicio
        diaCajero.breakFin = emp.breakFin
        diaCajero.isSCO = emp.isSCO
        diaCajero.actividad = emp.actividad || (emp.isSCO ? '713 Cajas SelfCheckout' : '701 Cajas Lineal')
        diaCajero.isLibre = false
      }
    })
  })

  const cajeros = Object.values(mapCajeros)

  // Ordenar alfabéticamente por nombre
  cajeros.sort((a, b) => a.nombre.localeCompare(b.nombre))

  return {
    tituloSemana,
    cajeros,
    diasSemana
  }
}

export async function exportarMallaSemanalExcel(semanaData: SemanaMallaData, fechaGeneracion?: string): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Retail Ops'
  wb.created = new Date()

  const ws = wb.addWorksheet('Malla_Semanal', {
    views: [{ showGridLines: true }]
  })

  // Ancho de columnas para máxima fidelidad visual
  ws.getColumn(1).width = 11 // Día
  ws.getColumn(2).width = 12 // Fecha
  for (let c = 3; c <= 29; c++) ws.getColumn(c).width = 2.2 // 00:00 a 05:45
  for (let c = 30; c <= 101; c++) ws.getColumn(c).width = 2.4 // 06:00 a 23:45
  ws.getColumn(102).width = 3.5 // 24:00

  let r = 1

  // Fila 1: Título general
  ws.mergeCells(r, 1, r, 102)
  const title = ws.getCell(r, 1)
  title.value = semanaData.tituloSemana
  title.font = { name: 'Arial', size: 12, bold: true }
  title.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(r).height = 24
  r += 2

  const thinBorder = {
    top: { style: 'thin' as const, color: { argb: 'FFD9D9D9' } },
    left: { style: 'thin' as const, color: { argb: 'FFD9D9D9' } },
    bottom: { style: 'thin' as const, color: { argb: 'FFD9D9D9' } },
    right: { style: 'thin' as const, color: { argb: 'FFD9D9D9' } }
  }

  const blueFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } }
  const orangeFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC55A11' } }
  const blackFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } }

  const fechaGen = fechaGeneracion || new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // Iterar por cada cajero
  for (const cajero of semanaData.cajeros) {
    // 1. Fila de Encabezado del Trabajador
    ws.getRow(r).height = 20
    ws.getCell(r, 1).value = 'Trabajador'
    ws.getCell(r, 1).font = { name: 'Arial', size: 9, bold: true }
    ws.getCell(r, 1).alignment = { vertical: 'middle' }

    ws.mergeCells(r, 2, r, 6)
    const nCell = ws.getCell(r, 2)
    nCell.value = cajero.nombre
    nCell.font = { name: 'Arial', size: 9, bold: true }
    nCell.alignment = { vertical: 'middle' }

    ws.getCell(r, 8).value = 'Código'
    ws.getCell(r, 8).font = { name: 'Arial', size: 9, bold: true }
    ws.getCell(r, 8).alignment = { vertical: 'middle' }

    ws.mergeCells(r, 9, r, 11)
    const cCell = ws.getCell(r, 9)
    cCell.value = cajero.codigo
    cCell.font = { name: 'Arial', size: 9, bold: true }
    cCell.alignment = { vertical: 'middle' }

    ws.getCell(r, 13).value = 'Contrato :'
    ws.getCell(r, 13).font = { name: 'Arial', size: 9, bold: true }
    ws.getCell(r, 13).alignment = { vertical: 'middle' }

    ws.getCell(r, 14).value = cajero.contrato
    ws.getCell(r, 14).font = { name: 'Arial', size: 9, bold: true }
    ws.getCell(r, 14).alignment = { vertical: 'middle' }

    ws.getCell(r, 16).value = 'Tienda'
    ws.getCell(r, 16).font = { name: 'Arial', size: 9, bold: true }
    ws.getCell(r, 16).alignment = { vertical: 'middle' }

    ws.mergeCells(r, 17, r, 22)
    const tCell = ws.getCell(r, 17)
    tCell.value = cajero.tienda
    tCell.font = { name: 'Arial', size: 9, bold: true }
    tCell.alignment = { vertical: 'middle' }

    ws.mergeCells(r, 24, r, 32)
    const uCell = ws.getCell(r, 24)
    uCell.value = cajero.unidadTrabajo
    uCell.font = { name: 'Arial', size: 9, bold: true }
    uCell.alignment = { vertical: 'middle' }
    r++

    // 2. Fila de Regla Horaria (Horas arriba)
    ws.getRow(r).height = 16
    ws.getCell(r, 3).value = '00:00'
    ws.getCell(r, 3).font = { name: 'Arial', size: 7, bold: true }
    ws.getCell(r, 3).alignment = { vertical: 'middle' }

    for (let h = 6; h <= 23; h++) {
      const col = 30 + (h - 6) * 4
      ws.getCell(r, col).value = `${h.toString().padStart(2, '0')}:00`
      ws.getCell(r, col).font = { name: 'Arial', size: 7, bold: true }
      ws.getCell(r, col).alignment = { vertical: 'middle' }
    }
    ws.getCell(r, 102).value = '24:00'
    ws.getCell(r, 102).font = { name: 'Arial', size: 7, bold: true }
    ws.getCell(r, 102).alignment = { vertical: 'middle' }
    r++

    // 3. Filas de los 7 Días de la Semana
    for (const dia of cajero.dias) {
      ws.getRow(r).height = 18
      ws.getCell(r, 1).value = dia.diaNombre
      ws.getCell(r, 1).font = { name: 'Arial', size: 8 }
      ws.getCell(r, 1).alignment = { vertical: 'middle' }

      ws.getCell(r, 2).value = dia.fechaStr
      ws.getCell(r, 2).font = { name: 'Arial', size: 8 }
      ws.getCell(r, 2).alignment = { vertical: 'middle', horizontal: 'center' }

      // Cuadrícula con bordes tenues para todos los cuartos de hora
      for (let c = 1; c <= 102; c++) {
        ws.getCell(r, c).border = thinBorder
      }

      // Si no es libre y tiene turno programado
      if (!dia.isLibre && dia.inicio !== undefined && dia.fin !== undefined) {
        const startCol = timeToCol(dia.inicio)
        const endCol = timeToCol(dia.fin)
        const shiftFill = dia.isSCO ? orangeFill : blueFill

        if (dia.breakInicio !== undefined && dia.breakFin !== undefined) {
          const bStartCol = timeToCol(dia.breakInicio)
          const bEndCol = timeToCol(dia.breakFin)

          // Segmento 1: Antes del refrigerio
          if (bStartCol > startCol) {
            for (let c = startCol; c < bStartCol; c++) ws.getCell(r, c).fill = shiftFill
            if (bStartCol - 1 > startCol) ws.mergeCells(r, startCol, r, bStartCol - 1)
            const c1 = ws.getCell(r, startCol)
            c1.value = `${formatTime(dia.inicio)}  ${dia.actividad}`
            c1.font = { name: 'Arial', color: { argb: 'FFFFFFFF' }, size: 7.5, bold: true }
            c1.alignment = { horizontal: 'center', vertical: 'middle' }
          }

          // Segmento 2: Refrigerio (Barra Negra con texto blanco)
          if (bEndCol > bStartCol) {
            for (let c = bStartCol; c < bEndCol; c++) ws.getCell(r, c).fill = blackFill
            if (bEndCol - 1 > bStartCol) ws.mergeCells(r, bStartCol, r, bEndCol - 1)
            const cb = ws.getCell(r, bStartCol)
            cb.value = 'Refrigerio'
            cb.font = { name: 'Arial', color: { argb: 'FFFFFFFF' }, size: 7, bold: true }
            cb.alignment = { horizontal: 'center', vertical: 'middle' }
          }

          // Segmento 3: Después del refrigerio
          if (endCol > bEndCol) {
            for (let c = bEndCol; c < endCol; c++) ws.getCell(r, c).fill = shiftFill
            if (endCol - 1 > bEndCol) ws.mergeCells(r, bEndCol, r, endCol - 1)
            const c2 = ws.getCell(r, bEndCol)
            c2.value = formatTime(dia.fin)
            c2.font = { name: 'Arial', color: { argb: 'FFFFFFFF' }, size: 7.5, bold: true }
            c2.alignment = { horizontal: 'right', vertical: 'middle' }
          }
        } else {
          // Turno corrido sin refrigerio
          if (endCol > startCol) {
            for (let c = startCol; c < endCol; c++) ws.getCell(r, c).fill = shiftFill
            if (endCol - 1 > startCol) ws.mergeCells(r, startCol, r, endCol - 1)
            const cSingle = ws.getCell(r, startCol)
            cSingle.value = `${formatTime(dia.inicio)}  ${dia.actividad}  ${formatTime(dia.fin)}`
            cSingle.font = { name: 'Arial', color: { argb: 'FFFFFFFF' }, size: 7.5, bold: true }
            cSingle.alignment = { horizontal: 'center', vertical: 'middle' }
          }
        }
      }
      r++
    }

    // 4. Fila de Firmas y Fecha de Generación
    r++
    ws.getRow(r).height = 18
    ws.mergeCells(r, 3, r, 7)
    const fj = ws.getCell(r, 3)
    fj.value = 'Firma jefe'
    fj.font = { name: 'Arial', size: 8 }
    fj.border = { top: { style: 'thin' as const } }
    fj.alignment = { horizontal: 'center', vertical: 'top' }

    ws.mergeCells(r, 11, r, 16)
    const ft = ws.getCell(r, 11)
    ft.value = 'Firma trabajador'
    ft.font = { name: 'Arial', size: 8 }
    ft.border = { top: { style: 'thin' as const } }
    ft.alignment = { horizontal: 'center', vertical: 'top' }

    ws.mergeCells(r, 22, r, 25)
    const fgLabel = ws.getCell(r, 22)
    fgLabel.value = 'Fecha de generación:'
    fgLabel.font = { name: 'Arial', size: 8 }
    fgLabel.alignment = { horizontal: 'right', vertical: 'middle' }

    ws.mergeCells(r, 26, r, 29)
    const fgVal = ws.getCell(r, 26)
    fgVal.value = fechaGen
    fgVal.font = { name: 'Arial', size: 8, bold: true }
    fgVal.alignment = { horizontal: 'left', vertical: 'middle' }

    r += 2 // Espacio entre trabajadores
  }

  // Generar y descargar archivo en el cliente
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Malla_Semanal_Cajeros_${semanaData.tituloSemana.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
