export function parseExcelTime(excelFraction: number): string {
  const totalHours = Math.round(excelFraction * 24);
  const hour = totalHours % 24;
  return `${hour.toString().padStart(2, '0')}:00`;
}

export function extractTimesFromRow(row: any[]): string[] {
  const times: string[] = [];
  const timeRegex = /^\d{2}:\d{2}$/;
  for (const cell of row) {
    if (typeof cell === 'string' && timeRegex.test(cell.trim())) {
      times.push(cell.trim());
    } else if (typeof cell === 'number') {
      // Sometimes excel parses times as fractions even in standard text cells if formatted wrong
      if (cell > 0 && cell < 1) {
        // We only extract if it's explicitly formatted as time, but if it's a number we might skip it or parse it
        // In the malla, times seem to be strings '08:00', '14:00'.
      }
    }
  }
  return times;
}

export function parseDemanda(data: any[][]) {
  const result: Record<string, Record<string, number>> = {};
  let currentDate = '';

  for (const row of data) {
    if (row.length === 0) continue;
    
    // Check if it's a date row (e.g. 'lun. 12 oct' or 'lun. 5 oct')
    if (typeof row[0] === 'string' && row[0].includes('.')) {
      currentDate = row[0].trim().toLowerCase();
      result[currentDate] = {};
    } else if (typeof row[0] === 'number' && currentDate) {
      // It's a time row
      const timeStr = parseExcelTime(row[0]);
      const requerido = row[3] ? Number(row[3]) : 0;
      result[currentDate][timeStr] = Math.ceil(requerido);
    }
  }
  return result;
}

export function parseMalla(workbook: any) {
  const result: Record<string, Record<string, number>> = {};

  for (const sheetName of workbook.SheetNames) {
    const sheetDate = sheetName.trim().toLowerCase(); // e.g. 'lunes 5 - oct'
    // Normalize date name to match demanda 'lun. 5 oct'
    const normalizedDate = sheetDate.replace('lunes', 'lun.').replace('martes', 'mar.').replace('miércoles', 'mié.').replace('jueves', 'jue.').replace('viernes', 'vie.').replace('sábado', 'sáb.').replace('domingo', 'dom.').replace(' -', '');
    
    result[normalizedDate] = {};
    for (let h = 6; h <= 23; h++) {
      result[normalizedDate][`${h.toString().padStart(2, '0')}:00`] = 0;
    }

    const data = workbook.Sheets[sheetName];
    // using a custom parser instead of sheet_to_json to get raw arrays
  }
  return result;
}
