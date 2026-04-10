// Raaga Icon Generator
// Uses canvas (npm install canvas) to generate icon PNGs
// Fallback: ImageMagick commands in comments below

try {
  const { createCanvas } = require('canvas');
  const fs = require('fs');

  function generateIcon(size, filename) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, size, size);
    
    // Gradient circle
    const gradient = ctx.createRadialGradient(size/2, size/2, size*0.1, size/2, size/2, size*0.4);
    gradient.addColorStop(0, '#8B5CF6');
    gradient.addColorStop(1, '#4C1D95');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size*0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // "R" letter
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${size * 0.4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('R', size/2, size/2);
    
    // Sound wave lines
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = size * 0.015;
    for (let i = 1; i <= 3; i++) {
      const radius = size * 0.35 + (i * size * 0.05);
      ctx.beginPath();
      ctx.arc(size/2, size/2, radius, -Math.PI/4, Math.PI/4);
      ctx.stroke();
    }
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filename, buffer);
    console.log(`Generated ${filename} (${size}x${size})`);
  }

  generateIcon(1024, 'assets/icon.png');
  generateIcon(1024, 'assets/adaptive-icon.png');
  generateIcon(512, 'assets/splash-icon.png');

} catch (e) {
  console.log('canvas not available. Use ImageMagick fallback:');
  console.log('convert -size 1024x1024 xc:"#0A0A0A" -fill "#8B5CF6" -draw "circle 512,512 512,155" -fill white -font Helvetica-Bold -pointsize 420 -gravity center -draw "text 0,0 \'R\'" assets/icon.png');
}
