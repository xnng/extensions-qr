import sharp from 'sharp';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [16, 48, 128];
const sourceIcon = join(__dirname, '../public/assets/icon.svg');
const targetDir = join(__dirname, '../public/assets');

async function generateIcons() {
  for (const size of sizes) {
    const targetPath = join(targetDir, `icon${size}.png`);
    await sharp(sourceIcon)
      .resize(size, size)
      .toFile(targetPath);
    console.log(`Generated icon${size}.png`);
  }
}

generateIcons().catch(console.error);
