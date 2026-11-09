export { cn } from "cn"

export function calcularNumeroSemana(fechaStr?: string): number | null {
  if (!fechaStr) return null
  const raw = fechaStr.toLowerCase()
  const matchNum = raw.match(/(\d{1,2})/)
  if (!matchNum) return null
  const day = parseInt(matchNum[1], 10)
  
  let month = 9 // 0-indexed: default October (9)
  if (raw.includes('ene')) month = 0
  else if (raw.includes('feb')) month = 1
  else if (raw.includes('mar') && !raw.includes('martes') && !raw.startsWith('ma.')) month = 2
  else if (raw.includes('abr')) month = 3
  else if (raw.includes('may')) month = 4
  else if (raw.includes('jun')) month = 5
  else if (raw.includes('jul')) month = 6
  else if (raw.includes('ago')) month = 7
  else if (raw.includes('sep') || raw.includes('set')) month = 8
  else if (raw.includes('oct')) month = 9
  else if (raw.includes('nov')) month = 10
  else if (raw.includes('dic')) month = 11

  const year = 2026 // año operativo
  const target = new Date(year, month, day)
  const dayNr = (target.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
  return isNaN(weekNum) ? null : weekNum
}
