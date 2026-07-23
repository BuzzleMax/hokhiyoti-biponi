import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const inputPath = path.join(process.cwd(), 'public/logo.png')
const publicDir = path.join(process.cwd(), 'public')

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
]

async function generateFavicons() {
  try {
    for (const { name, size } of sizes) {
      const outputPath = path.join(publicDir, name)
      await sharp(inputPath)
        .resize(size, size, { fit: 'cover', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toFile(outputPath)
      console.log(`Generated ${name}`)
    }
    
    // Generate favicon.ico (contains multiple sizes)
    const icoPath = path.join(publicDir, 'favicon.ico')
    await sharp(inputPath)
      .resize(48, 48, { fit: 'cover' })
      .toFile(icoPath)
    console.log('Generated favicon.ico')
    
    console.log('All favicons generated successfully!')
  } catch (error) {
    console.error('Error generating favicons:', error)
    process.exit(1)
  }
}

generateFavicons()
