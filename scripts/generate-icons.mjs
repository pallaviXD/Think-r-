/**
 * Generate PWA icons as SVG-based PNG placeholders.
 * Uses the sharp-free approach: write valid SVG files as .svg,
 * and copy the 192 icon for 512 too (Vite PWA accepts same file for both).
 * 
 * Actually — just copy the 192 to 512 since it's a raster scale-up.
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dir, '..', 'public', 'icons')
mkdirSync(iconsDir, { recursive: true })

const icon192 = join(iconsDir, 'icon-192.png')
const icon512 = join(iconsDir, 'icon-512.png')

// 192 already exists from previous run — copy it to 512
try {
  copyFileSync(icon192, icon512)
  console.log('✓ Copied icon-192.png -> icon-512.png')
} catch {
  console.log('icon-192 not found, writing a minimal 1x1 PNG placeholder...')
  // Minimal valid 1x1 orange PNG
  const minPng = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
    '2e0000000c4944415408d7636088ff670000000bfff300000000049454e44ae426082',
    'hex'
  )
  writeFileSync(icon192, minPng)
  writeFileSync(icon512, minPng)
  console.log('✓ Wrote minimal PNG placeholders')
}

console.log('Icons ready.')
