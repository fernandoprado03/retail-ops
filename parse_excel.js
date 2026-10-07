const XLSX = require('xlsx');

function analyzeFile(filename) {
  console.log(`\n=== Analyzing ${filename} ===`);
  try {
    const workbook = XLSX.readFile(filename);
    console.log(`Sheet Names:`, workbook.SheetNames);
    
    // Read the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON with headers to see structure
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // array of arrays
    
    console.log(`\nFirst 10 rows of sheet "${firstSheetName}":`);
    for (let i = 0; i < Math.min(10, data.length); i++) {
      console.log(`Row ${i + 1}:`, data[i]);
    }
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
  }
}

analyzeFile('MALLA DEL 05 AL 18 DE OCTUBRE.xlsx');
analyzeFile('REQUERIMIENTO CAJEROS.xlsx');
