/**
 * Thinkr PDF Pipeline
 *
 * Flow:
 *  1. pdf.js extracts text from each page (text-based PDFs)
 *  2. If a page has <50 chars, Tesseract.js OCR runs (English + Hindi)
 *  3. Text is chunked to 300–500 words with page numbers
 *  4. Thumbnail generated from page 1 via offscreen canvas
 *
 * Privacy: files never leave the device — processing is 100% in-browser.
 */

import * as pdfjs from 'pdfjs-dist'
import type { TextChunk } from './db'

// Set up pdf.js worker — must point to the bundled worker file
// Using import.meta.url so Vite resolves the asset correctly at build time
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

export interface ProcessedPDF {
  pageCount: number
  chunks: Omit<TextChunk, 'id' | 'docId'>[]
  thumbnail: string | null // base64 JPEG
  fullText: string
}

/**
 * Process a PDF file: extract text, OCR if needed, chunk, thumbnail.
 * @param file   The PDF File object from the browser
 * @param onProgress  Called with human-readable status updates
 */
export async function processPDF(
  file: File,
  onProgress: (msg: string) => void
): Promise<ProcessedPDF> {
  onProgress('Loading PDF...')

  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise

  const pageCount = pdfDoc.numPages
  const pageTexts: string[] = []
  let thumbnail: string | null = null

  // ── Step 1 & 2: Extract text per page, OCR if needed ──────────────────
  // We lazily initialize Tesseract only if at least one page needs OCR
  let tesseractWorker: import('tesseract.js').Worker | null = null

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    onProgress(`Reading page ${pageNum} of ${pageCount}...`)

    const page = await pdfDoc.getPage(pageNum)

    // Generate thumbnail from page 1
    if (pageNum === 1) {
      thumbnail = await renderPageThumbnail(page)
    }

    // Extract text layer
    const textContent = await page.getTextContent()
    const rawText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .trim()

    if (rawText.length >= 50) {
      // Enough text — no OCR needed
      pageTexts.push(rawText)
    } else {
      // Page is scanned/image — run OCR
      onProgress(`Reading page ${pageNum} of ${pageCount} (OCR)...`)

      if (!tesseractWorker) {
        tesseractWorker = await initTesseractWorker()
      }

      const ocrText = await ocrPage(page, tesseractWorker)
      pageTexts.push(ocrText || rawText) // fall back to raw if OCR yields nothing
    }
  }

  // Clean up Tesseract worker if used
  if (tesseractWorker) {
    await tesseractWorker.terminate()
  }

  onProgress('Chunking text...')

  // ── Step 3: Chunk text ────────────────────────────────────────────────
  const chunks = chunkPages(pageTexts)

  const fullText = pageTexts.join('\n\n')

  onProgress('Done!')

  return { pageCount, chunks, thumbnail, fullText }
}

// ── Internal helpers ──────────────────────────────────────────────────────

/**
 * Render a PDF page to an offscreen canvas and return a base64 JPEG thumbnail.
 */
async function renderPageThumbnail(
  page: pdfjs.PDFPageProxy
): Promise<string | null> {
  try {
    const viewport = page.getViewport({ scale: 0.5 })
    const canvas = new OffscreenCanvas(viewport.width, viewport.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise

    // OffscreenCanvas.convertToBlob → base64
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.6 })
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/**
 * Initialize Tesseract.js worker with English + Hindi language packs.
 * This is expensive (~2–4s) so we do it at most once per PDF.
 */
async function initTesseractWorker() {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(['eng', 'hin'])
  return worker
}

/**
 * Run Tesseract OCR on a single PDF page by rendering it to a canvas first.
 */
async function ocrPage(
  page: pdfjs.PDFPageProxy,
  worker: import('tesseract.js').Worker
): Promise<string> {
  try {
    const viewport = page.getViewport({ scale: 1.5 }) // higher scale = better OCR
    const canvas = new OffscreenCanvas(viewport.width, viewport.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise

    const blob = await canvas.convertToBlob({ type: 'image/png' })
    const result = await worker.recognize(blob)
    return result.data.text
  } catch {
    return ''
  }
}

/**
 * Chunk page texts into 300–500 word segments, preserving page number references.
 * Keeps chunks small so we never send huge payloads to the LLM.
 */
function chunkPages(
  pageTexts: string[]
): Omit<TextChunk, 'id' | 'docId'>[] {
  const TARGET_WORDS = 400
  const MAX_WORDS = 500

  const chunks: Omit<TextChunk, 'id' | 'docId'>[] = []
  let chunkIndex = 0

  for (let pageIdx = 0; pageIdx < pageTexts.length; pageIdx++) {
    const pageNumber = pageIdx + 1
    const words = pageTexts[pageIdx].split(/\s+/).filter(Boolean)

    // Split page text into ~400-word segments
    for (let start = 0; start < words.length; start += TARGET_WORDS) {
      const slice = words.slice(start, start + MAX_WORDS)
      if (slice.length === 0) continue

      chunks.push({
        pageNumber,
        text: slice.join(' '),
        wordCount: slice.length,
        chunkIndex: chunkIndex++,
      })
    }
  }

  return chunks
}
