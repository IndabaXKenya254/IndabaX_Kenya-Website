// Image optimization script - 800x600 landscape format
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const images = [
  '/home/de-coder/Downloads/indaba/2022indaba.png',
  '/home/de-coder/Downloads/indaba/2023indaba.png',
  '/home/de-coder/Downloads/indaba/2024indaba.png',
  '/home/de-coder/Downloads/indaba/2025indaba.png'
];

const outputDir = path.join(__dirname, '../public/images/events');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function optimizeImage(inputPath) {
  const fileName = path.basename(inputPath);
  const outputPath = path.join(outputDir, fileName);

  console.log(`Optimizing ${fileName} to 800x600...`);

  try {
    const metadata = await sharp(inputPath).metadata();
    console.log(`  Original: ${metadata.width}x${metadata.height}, ${metadata.format}`);

    // Resize to exactly 800x600 landscape
    // Using 'cover' fit to fill the entire space (crops if needed)
    await sharp(inputPath)
      .resize(800, 600, {
        fit: 'cover',
        position: 'center'
      })
      .png({
        quality: 85,
        compressionLevel: 9,
        adaptiveFiltering: true
      })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    const originalStats = fs.statSync(inputPath);
    const savings = ((1 - stats.size / originalStats.size) * 100).toFixed(1);

    console.log(`  Output: 800x600 → ${outputPath}`);
    console.log(`  Size: ${(originalStats.size / 1024).toFixed(0)}KB → ${(stats.size / 1024).toFixed(0)}KB (${savings}% smaller)`);
    console.log(`  ✓ Done\n`);
  } catch (error) {
    console.error(`  ✗ Error optimizing ${fileName}:`, error.message);
  }
}

async function main() {
  console.log('Starting image optimization to 800x600 landscape format...\n');

  for (const imagePath of images) {
    await optimizeImage(imagePath);
  }

  console.log('All images optimized to 800x600 successfully!');
}

main().catch(console.error);
