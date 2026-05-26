const fs = require('fs');
const content = fs.readFileSync('src/views/OrdersAndMaintenance.tsx', 'utf8');

let stack = [];
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // simple matching
  let divOpens = (line.match(/<div(\s|>)/g) || []).length;
  let divCloses = (line.match(/<\/div>/g) || []).length;
  
  for(let j=0; j<divOpens; j++) stack.push(i + 1);
  for(let j=0; j<divCloses; j++) {
    let openedAt = stack.pop();
    if(openedAt === 1221 || openedAt === 1222 || openedAt === 1223 || openedAt === 1226 || openedAt === 1228) {
      console.log(`div opened at ${openedAt} closed at ${i + 1}`);
    }
  }
}
if (stack.length > 0) {
  console.log("Unclosed divs opened at:", stack);
} else {
  console.log("All divs closed properly (syntactically).");
}
