const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target) {
  console.error("No target file specified");
  process.exit(1);
}

let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data, 'utf8');
  console.log(`Wrote ${data.length} bytes to ${target}`);
});
