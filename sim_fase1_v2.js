const HORAS_ENTERAS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
const CUARTOS_DE_HORA = [0, 0.25, 0.5, 0.75]

// Based on Screenshot 1
const empleados = [
  { id: 1, inicio: 8, fin: 17, breakInicio: 14.00, breakFin: 15.00, caja: '13', isSCO: false },
  { id: 10, inicio: 13.75, fin: 22.75, breakInicio: 15.00, breakFin: 16.00, caja: '12', isSCO: false }
]

// Simulate prog array where at 15:00 there's a shortage
// Wait, why would they move? They move because prog[t] < req
let prog = {}
let req_por_hora = {}
for (let h = 8; h <= 22; h+=0.25) {
  prog[h] = 8;
  req_por_hora[Math.floor(h)] = 5;
}

// Let's create a shortage at 14:00 (for Caja 13 to want to move)
req_por_hora[14] = 10; // High requirement at 14:00, forcing Caja 13 to move!
// Let's create an excess at 15:00 (so Caja 13 wants to move to 15:00)
req_por_hora[15] = 2;

// FASE 1
for (let pass = 0; pass < 3; pass++) {
  let movedInPass = false;
  for (const h of HORAS_ENTERAS) {
    for (const q of CUARTOS_DE_HORA) {
      const t = h + q
      if (t >= 22.75) continue;
      
      const req = req_por_hora[h] || 0
      
      if (prog[t] < req) {
        let candidatosBreak = empleados.filter(
          e => !e.isSCO && e.breakInicio !== undefined && e.breakFin !== undefined && t >= e.breakInicio && t < e.breakFin
        )
        
        for (const emp of candidatosBreak) {
          let bestNewBreak = -1
          let maxExcess = -999
          const breakLength = emp.breakFin - emp.breakInicio
          
          for (let start = emp.inicio; start <= emp.fin - breakLength; start += 0.25) {
            let canMove = true
            let minExcess = 999
            
            for (let bt = start; bt < start + breakLength; bt += 0.25) {
              if (emp.caja === '13' || emp.caja === '12') {
                const otherPrefIsOpen = empleados.some(other => 
                  other.id !== emp.id && 
                  (other.caja === '13' || other.caja === '12') &&
                  bt >= other.inicio && bt < other.fin &&
                  !(other.breakInicio !== undefined && bt >= other.breakInicio && bt < other.breakFin)
                )

                if (!otherPrefIsOpen) {
                  canMove = false
                  break
                }
              }

              const isOldBreak = bt >= emp.breakInicio && bt < emp.breakFin
              const newProg = prog[bt] - (isOldBreak ? 0 : 1)
              const req_bt = req_por_hora[Math.floor(bt)] || 0
              
              if (newProg < req_bt) {
                canMove = false
                break
              }
              
              const excess = newProg - req_bt
              if (excess < minExcess) minExcess = excess
            }
            
            if (canMove && minExcess > maxExcess) {
              maxExcess = minExcess
              bestNewBreak = start
            }
          }
          
          if (bestNewBreak !== -1 && bestNewBreak !== emp.breakInicio) {
            console.log(`Moved emp ${emp.id} break to ${bestNewBreak}`);
            emp.breakInicio = bestNewBreak
            emp.breakFin = bestNewBreak + breakLength
            movedInPass = true
            break 
          }
        }
      }
    }
  }
}

console.log(empleados);
