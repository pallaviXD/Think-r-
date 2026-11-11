/**
 * Library page — PDF upload, processing pipeline, file management.
 * Files NEVER leave the device — pdf.js + Tesseract run entirely in browser.
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Trash2, Tag, Shield, AlertCircle,
  CheckCircle2, Loader2, BookOpen, FileQuestion, GraduationCap, Receipt
} from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { processPDF } from '../lib/pdf'
import { useAppStore } from '../store/appStore'
import { DEMO_DATA } from '../data/demo'
import type { PDFDocument } from '../lib/db'

const DOC_TYPES = [
  { value: 'textbook', label: 'Textbook', icon: BookOpen },
  { value: 'notes', label: 'Notes', icon: FileText },
  { value: 'question_paper', label: 'Question Paper', icon: FileQuestion },
  { value: 'marks_card', label: 'Marks Card', icon: Receipt },
] as const

type DocType = typeof DOC_TYPES[number]['value']

function PDFCard({ doc, onDelete }: { doc: PDFDocument; onDelete: (id: string) => void }) {
  const TypeIcon = DOC_TYPES.find(t => t.value === doc.type)?.icon ?? FileText

  const statusColors = {
    ready: 'text-success bg-success/10',
    processing: 'text-warning bg-warning/10',
    error: 'text-danger bg-danger/10',
  }

  const statusLabels = {
    ready: 'Ready',
    processing: 'Processing…',
    error: 'Error',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-surface border border-border rounded-card p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Thumbnail or icon */}
      <div className="w-full aspect-[3/2] bg-elevated rounded-xl mb-3 flex items-center justify-center overflow-hidden">
        {doc.thumbnail ? (
          <img src={doc.thumbnail} alt={doc.name} className="w-full h-full object-cover" />
        ) : (
          <TypeIcon className="w-10 h-10 text-primary/40" />
        )}
      </div>

      <div className="space-y-1.5">
        <h3 className="font-semibold text-sm text-text truncate" title={doc.name}>{doc.name}</h3>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs bg-primary-soft text-primary px-2 py-0.5 rounded-full font-semibold capitalize">
            {doc.subject}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[doc.status]}`}>
            {doc.status === 'processing' && <Loader2 className="w-2.5 h-2.5 inline animate-spin mr-1" />}
            {statusLabels[doc.status]}
          </span>
        </div>

        {doc.chapter && (
          <p className="text-xs text-text-muted truncate">{doc.chapter}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-text-muted">{doc.pageCount} pages</span>
          <button
            onClick={() => onDelete(doc.id)}
            className="text-text-muted hover:text-danger transition-colors p-1 rounded"
            aria-label={`Delete ${doc.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function UploadModal({
  onClose,
  onUpload,
}: {
  onClose: () => void
  onUpload: (file: File, subject: string, chapter: string, type: DocType) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [subject, setSubject] = useState('')
  const [chapter, setChapter] = useState('')
  const [type, setType] = useState<DocType>('textbook')
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type === 'application/pdf') setFile(f)
  }

  const handleSubmit = () => {
    if (!file || !subject.trim()) return
    onUpload(file, subject.trim(), chapter.trim(), type)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-surface border border-border rounded-card p-6 w-full max-w-md shadow-xl"
      >
        <h2 className="font-heading font-bold text-lg text-text mb-4">Upload PDF</h2>

        {/* Privacy notice */}
        <div className="flex items-start gap-2 bg-success/10 border border-success/20 rounded-xl p-3 mb-4">
          <Shield className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
          <p className="text-xs text-success font-medium">Files never leave your device. All processing happens in your browser.</p>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => document.getElementById('pdf-file-input')?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4 ${dragOver ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary/40'}`}
        >
          <input
            id="pdf-file-input"
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
          <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
          {file ? (
            <p className="text-sm font-semibold text-primary">{file.name}</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-text">Drop PDF here or click to browse</p>
              <p className="text-xs text-text-muted mt-1">PDF or image files supported</p>
            </>
          )}
        </div>

        {/* Type selector */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {DOC_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setType(value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-semibold transition-all ${type === value ? 'border-primary bg-primary-soft text-primary' : 'border-border text-text-muted hover:border-primary/30'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Subject (e.g. Science) *"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary mb-3"
        />
        <input
          type="text"
          placeholder="Chapter (optional)"
          value={chapter}
          onChange={e => setChapter(e.target.value)}
          className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary mb-4"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-elevated border border-border text-text font-semibold py-2.5 rounded-btn hover:bg-border transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || !subject.trim()}
            className="flex-1 bg-gradient-brand text-white font-semibold py-2.5 rounded-btn shadow hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Upload
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function Library() {
  const demoMode = useAppStore(s => s.demoMode)
  const docs = useLiveQuery(() => db.pdfDocuments.toArray()) ?? []
  const [showUpload, setShowUpload] = useState(false)
  const [progress, setProgress] = useState<{ docId: string; msg: string } | null>(null)

  const displayDocs = demoMode ? DEMO_DATA.pdfDocuments as PDFDocument[] : docs

  const handleUpload = useCallback(async (file: File, subject: string, chapter: string, type: 'textbook' | 'notes' | 'question_paper' | 'marks_card') => {
    const docId = `doc-${Date.now()}`
    const docRecord: PDFDocument = {
      id: docId,
      name: file.name.replace('.pdf', ''),
      subject,
      chapter,
      type,
      status: 'processing',
      pageCount: 0,
      fileSize: file.size,
      thumbnail: null,
      uploadedAt: new Date().toISOString(),
    }

    await db.pdfDocuments.add(docRecord)
    setProgress({ docId, msg: 'Loading PDF…' })

    try {
      const result = await processPDF(file, msg => setProgress({ docId, msg }))

      // Save chunks
      const chunks = result.chunks.map((c, i) => ({
        id: `chunk-${docId}-${i}`,
        docId,
        ...c,
      }))
      await db.textChunks.bulkAdd(chunks)

      // Update document record
      await db.pdfDocuments.update(docId, {
        status: 'ready',
        pageCount: result.pageCount,
        thumbnail: result.thumbnail,
      })
    } catch (err) {
      await db.pdfDocuments.update(docId, { status: 'error' })
    } finally {
      setProgress(null)
    }
  }, [])

  const handleDelete = async (id: string) => {
    if (demoMode) return
    await db.pdfDocuments.delete(id)
    await db.textChunks.where('docId').equals(id).delete()
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-text">Library</h1>
          <p className="text-text-muted text-sm mt-0.5">{displayDocs.length} document{displayDocs.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-gradient-brand text-white text-sm font-semibold px-4 py-2.5 rounded-btn shadow hover:opacity-90 transition-opacity"
        >
          <Upload className="w-4 h-4" />
          Upload PDF
        </button>
      </div>

      {/* Privacy banner */}
      <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded-xl px-4 py-3 mb-6">
        <Shield className="w-4 h-4 text-success flex-shrink-0" />
        <p className="text-xs text-success font-medium">Your files never leave your device. PDF processing and OCR run entirely in your browser.</p>
      </div>

      {/* Processing status */}
      {progress && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-warning animate-spin flex-shrink-0" />
          <p className="text-sm text-warning font-medium">{progress.msg}</p>
        </div>
      )}

      {/* Empty state */}
      {displayDocs.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-primary-soft flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-heading font-bold text-xl text-text mb-2">No PDFs yet</h2>
          <p className="text-text-muted text-sm mb-6 max-w-xs mx-auto">Upload your textbooks, notes, or question papers to start chatting with them.</p>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-gradient-brand text-white font-semibold px-6 py-3 rounded-btn shadow hover:opacity-90 transition-opacity"
          >
            Upload your first PDF
          </button>
        </div>
      )}

      {/* PDF grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {displayDocs.map(doc => (
            <PDFCard key={doc.id} doc={doc} onDelete={handleDelete} />
          ))}
        </AnimatePresence>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUpload={handleUpload} />
      )}
    </div>
  )
}
