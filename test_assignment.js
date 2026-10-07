const poolCajas = ['13', '12', '11', '9', '7', '5', '3', '1', '10', '8', '6', '2'];
const emp = [
  {id: 1, inicio: 8, rol: 'C'},
  {id: 2, inicio: 9, rol: 'C'},
  {id: 3, inicio: 10, rol: 'C'},
  {id: 4, inicio: 12, rol: 'C'},
  {id: 5, inicio: 13.25, rol: 'C'},
  {id: 6, inicio: 13.25, rol: 'C'},
  {id: 7, inicio: 13.75, rol: 'C'},
  {id: 8, inicio: 13.75, rol: 'C'},
  {id: 9, inicio: 13.75, rol: 'C'}
];

let left = 0;
let right = emp.length - 1;
let cajaIndex = 0;

while (left <= right) {
  if (left === right) {
    emp[left].caja = poolCajas[cajaIndex % poolCajas.length];
    break;
  }
  
  emp[left].caja = poolCajas[cajaIndex % poolCajas.length];
  cajaIndex++;
  
  emp[right].caja = poolCajas[cajaIndex % poolCajas.length];
  cajaIndex++;
  
  left++;
  right--;
}

console.log(emp.map(e => \`\${e.inicio}: Caja \${e.caja}\`).join('\\n'));
