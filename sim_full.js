const HORAS_ENTERAS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
const CUARTOS_DE_HORA = [0, 0.25, 0.5, 0.75]

let empleados = [
  { id: 1, inicio: 8, fin: 17, breakInicio: 14.00, breakFin: 15.00, caja: '13', isSCO: false },
  { id: 10, inicio: 13.75, fin: 22.75, breakInicio: 15.00, breakFin: 16.00, caja: '12', isSCO: false }
]

function calculateProgramado(emps) {
  let p = {};
  for(let i=8; i<=22.75; i+=0.25) {
    p[i] = emps.filter(e => e.inicio <= i && e.fin > i && !(e.breakInicio <= i && e.breakFin > i)).length;
  }
  return p;
}

let prog = calculateProgramado(empleados);
let req_por_hora = {}
for (let h = 8; h <= 22; h++) req_por_hora[h] = 0; // zero demand to avoid general shortage moving them

// Force a gap manually to see if FASE 0 works
empleados[0].breakInicio = 15; empleados[0].breakFin = 16;
empleados[1].breakInicio = 15; empleados[1].breakFin = 16;
prog = calculateProgramado(empleados);

for (let pass = 0; pass < 2; pass++) {
  for (const h of HORAS_ENTERAS) {
    for (const q of CUARTOS_DE_HORA) {
      const t = h + q
      if (t >= 22.75) continue
      
      const isPrefGap = !empleados.some(e => 
        (e.caja?.trim() === '13' || e.caja?.trim() === '12') &&
        t >= e.inicio && t < e.fin &&
        !(e.breakInicio !== undefined && t >= e.breakInicio && t < e.breakFin)
      )

      if (isPrefGap) {
        console.log(`FASE 0: GAP AT ${t}`);
        const prefOnBreak = empleados.find(e => 
          (e.caja?.trim() === '13' || e.caja?.trim() === '12') &&
          e.breakInicio !== undefined && t >= e.breakInicio && t < e.breakFin
        )

        if (prefOnBreak) {
          let bestNewBreak = -1
          let minDamage = 999
          const breakLength = prefOnBreak.breakFin - prefOnBreak.breakInicio
          
          for (let start = prefOnBreak.inicio; start <= prefOnBreak.fin - breakLength; start += 0.25) {
            let canMove = true
            let shortageCaused = 0
            
            for (let bt = start; bt < start + breakLength; bt += 0.25) {
              const otherPrefIsOpen = empleados.some(other => 
                other.id !== prefOnBreak.id && 
                (other.caja?.trim() === '13' || other.caja?.trim() === '12') &&
                bt >= other.inicio && bt < other.fin &&
                !(other.breakInicio !== undefined && bt >= other.breakInicio && bt < other.breakFin)
              )
              if (!otherPrefIsOpen) {
                canMove = false
                break
              }
            }
            
            if (canMove && shortageCaused < minDamage) {
              minDamage = shortageCaused
              bestNewBreak = start
            }
          }
          
          if (bestNewBreak !== -1 && bestNewBreak !== prefOnBreak.breakInicio) {
            console.log(`FASE 0 MOVED ${prefOnBreak.id} from ${prefOnBreak.breakInicio} to ${bestNewBreak}`);
            prefOnBreak.breakInicio = bestNewBreak
            prefOnBreak.breakFin = bestNewBreak + breakLength
            prog = calculateProgramado(empleados)
          } else {
             console.log(`FASE 0 COULD NOT MOVE ${prefOnBreak.id}`);
          }
        }
      }
    }
  }
}
console.log(empleados);
