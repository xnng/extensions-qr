const sharp = require('sharp');
const path = require('path');

const sizes = [16, 48, 128];
const inputFile = path.join(__dirname, '../public/assets/icon.svg');

async function generateIcons() {
  try {
    for (const size of sizes) {
      const outputFile = path.join(__dirname, `../public/assets/icon${size}.png`);
      await sharp(inputFile)
        .resize(size, size)
        .png()
        .toFile(outputFile);
      console.log(`Generated icon${size}.png`);
    }
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
