const fs = require('fs')
let content = fs.readFileSync('src/app/horarios-pro/page.tsx', 'utf8')

// Add formatTime and handleHorarioChange/updateEmpleado logic
const utils = `
const formatTime = (fraction: number): string => {
  if (isNaN(fraction)) return '00:00'
  const h = Math.floor(fraction) % 24
  const m = Math.round((fraction - Math.floor(fraction)) * 60)
  return \`\${h.toString().padStart(2, '0')}:\${m.toString().padStart(2, '0')}\`
}

const timeToFraction = (timeStr: string): number => {
  try {
    const [h, m] = timeStr.split(':').map(Number)
    const result = h + (m || 0) / 60
    return isNaN(result) ? 0 : result
  } catch {
    return 0
  }
}
`

if (!content.includes('formatTime')) {
  // Add formatTime above processFiles or outside component
  content = content.replace("const timeToFraction", utils.trim() + "\n//")
  // Remove the old timeToFraction
  content = content.replace("const timeToFraction = (timeStr: string): number => {\n  const [h, m] = timeStr.split(':').map(Number)\n  return h + (m || 0) / 60\n}\n", "")
}

const updateFuncs = `
  const updateEmpleado = (diaIndex: number, empId: string, updates: Partial<TurnoEmpleado>) => {
    const newReporte = [...reporte]
    const emp = newReporte[diaIndex].empleados.find(e => e.id === empId)
    if (emp) {
      Object.assign(emp, updates)
      setReporte(newReporte)
    }
  }

  const handleHorarioChange = (diaIndex: number, empId: string, val: string) => {
    const parts = val.split('-').map(s => s.trim())
    if (parts.length === 2) {
      const inicio = timeToFraction(parts[0])
      let fin = timeToFraction(parts[1])
      if (fin < inicio) fin += 24
      updateEmpleado(diaIndex, empId, { inicio, fin })
    }
  }
`

if (!content.includes('updateEmpleado')) {
  content = content.replace("  const toggleSCO = (diaIndex: number, empId: string) => {", updateFuncs + "\n  const toggleSCO = (diaIndex: number, empId: string) => {")
}

// Add Caja logic in processFiles
const cajaLogic = `
        const poolCajas = ['13', '12', '11', '9', '7', '5', '3', '1', '10', '8', '6', '2']
        let cajaIndex = 0
        empleados.sort((a, b) => a.inicio - b.inicio).forEach(emp => {
          if (!emp.isSCO && !emp.isMultifuncional && emp.rol !== 'Soporte Automático') {
            emp.caja = poolCajas[cajaIndex % poolCajas.length]
            cajaIndex++
          }
        })

        reportes.push({
`
content = content.replace("        // Ordenamos los empleados originales por hora de inicio\n        empleados.sort((a, b) => a.inicio - b.inicio)\n\n        reportes.push({", cajaLogic)

// Update widths
content = content.replace(/w-64/g, 'w-[360px]')

// Update rendering of employee
const newEmpRender = `
                                <div className="flex flex-col overflow-hidden flex-1">
                                  <input 
                                    className={\`text-xs font-bold truncate cursor-text bg-transparent border-none p-0 outline-none focus:ring-1 focus:ring-slate-300 rounded \${emp.isSCO ? 'text-purple-700' : 'text-slate-800'} \${emp.isMultifuncional ? 'text-amber-700' : ''}\`}
                                    value={emp.nombre}
                                    title={emp.nombre}
                                    onChange={(e) => updateEmpleado(idx, emp.id, { nombre: e.target.value })}
                                  />
                                  <span className="text-[10px] text-slate-500 truncate">
                                    {emp.isSCO ? 'Autoservicio (SCO)' : emp.rol}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 items-end shrink-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-medium text-slate-400">CAJA</span>
                                  <input 
                                    className="w-8 text-xs font-bold text-center bg-slate-100 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-slate-400"
                                    value={emp.caja || ''}
                                    onChange={(e) => updateEmpleado(idx, emp.id, { caja: e.target.value })}
                                  />
                                </div>
                                <input 
                                  className="w-20 text-[10px] font-medium text-center bg-slate-100 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-slate-400"
                                  defaultValue={\`\${formatTime(emp.inicio)} - \${formatTime(emp.fin > 24 ? emp.fin - 24 : emp.fin)}\`}
                                  onBlur={(e) => handleHorarioChange(idx, emp.id, e.target.value)}
                                />
                              </div>
`
content = content.replace(/<div className="flex flex-col overflow-hidden">[\s\S]*?<\/div>\s*<\/div>/, newEmpRender)

fs.writeFileSync('src/app/horarios-pro/page.tsx', content)
