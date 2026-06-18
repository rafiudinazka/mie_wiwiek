const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, 'public', 'images');

async function convert() {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
      const ext = path.extname(file);
      const name = path.basename(file, ext);
      const inputPath = path.join(dir, file);
      const outputPath = path.join(dir, `${name}.webp`);
      
      console.log(`Converting ${file} to ${name}.webp...`);
      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);
        
      console.log(`Deleting ${file}...`);
      fs.unlinkSync(inputPath);
    }
  }
  console.log('Conversion complete!');
}

convert().catch(console.error);
