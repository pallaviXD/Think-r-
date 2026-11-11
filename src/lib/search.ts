/**
 * Thinkr BM25 search index via MiniSearch.
 *
 * We keep the index in memory only (not persisted to IndexedDB) because:
 *  - MiniSearch index is fast to rebuild from stored chunks (~50ms for 500 chunks)
 *  - Stored as a serialized JSON blob it would be very large
 *
 * Usage:
 *   const index = buildIndex(chunks)
 *   const topChunks = searchChunks('photosynthesis process', index, 4)
 */

import MiniSearch from 'minisearch'
import type { TextChunk } from './db'

export type SearchableChunk = TextChunk

/**
 * Build a BM25 full-text search index from an array of text chunks.
 * Index is built on the 'text' field; 'docId' and 'pageNumber' are stored fields.
 */
export function buildIndex(chunks: TextChunk[]): MiniSearch<SearchableChunk> {
  const index = new MiniSearch<SearchableChunk>({
    idField: 'id',
    fields: ['text'], // fields to index for full-text search
    storeFields: ['id', 'docId', 'pageNumber', 'text', 'wordCount', 'chunkIndex'],
    searchOptions: {
      boost: { text: 1 },
      fuzzy: 0.2, // slight fuzzy matching for typos
      prefix: true,
    },
  })

  if (chunks.length > 0) {
    index.addAll(chunks)
  }

  return index
}

/**
 * Search the index and return the top-K most relevant chunks.
 * We cap results at 4 by default to stay within the ~1200-token budget
 * per LLM request (each chunk is ~300–500 words ≈ 400–600 tokens).
 */
export function searchChunks(
  query: string,
  index: MiniSearch<SearchableChunk>,
  topK = 4
): TextChunk[] {
  if (!query.trim() || index.documentCount === 0) {
    return []
  }

  const results = index.search(query).slice(0, topK)

  // MiniSearch search() returns objects with the stored fields
  return results.map((r) => ({
    id: r.id as string,
    docId: r.docId as string,
    pageNumber: r.pageNumber as number,
    text: r.text as string,
    wordCount: r.wordCount as number,
    chunkIndex: r.chunkIndex as number,
  }))
}
