const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = path.join(__dirname, '../nextjs-app/public/icons');
fs.mkdirSync(outDir, { recursive: true });

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#FF9933');
  grad.addColorStop(1, '#e8882d');
  ctx.fillStyle = grad;
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();
  
  // "JS" text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.4}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JS', size / 2, size / 2);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outDir, `icon-${size}x${size}.png`), buffer);
  console.log(`Generated ${size}x${size}`);
});
