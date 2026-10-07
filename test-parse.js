const cell1 = 0.3333333333333333; // 8:00
const totalMinutes = Math.round(cell1 * 24 * 60);
const h = Math.floor(totalMinutes / 60);
const m = totalMinutes % 60;
console.log(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
