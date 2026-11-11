/**
 * Thinkr Voice Module — Web Speech API wrapper.
 *
 * Uses browser-native speech recognition and synthesis (no paid API needed).
 * Supports English-India (en-IN) and Hindi (hi-IN).
 * All functions are graceful no-ops when the API is unavailable.
 *
 * TypeScript note: SpeechRecognition is not in lib.dom.d.ts in many TS versions,
 * so we use the global ambient declarations below and cast via `any` where needed.
 */

export type VoiceLanguage = 'en-IN' | 'hi-IN'

// ── Web Speech API ambient declarations ──────────────────────────────────
// These types exist in modern browsers but are missing from older TS dom libs.
// Declared here so the rest of the codebase doesn't need a separate .d.ts file.

type AnyWindow = Window & typeof globalThis & Record<string, unknown>

function getSpeechRecognitionConstructor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null
  const w = window as AnyWindow
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (w['SpeechRecognition'] ?? w['webkitSpeechRecognition'] ?? null) as any
}

// ── Speech-to-Text ────────────────────────────────────────────────────────

// Use `any` for the recognition object to avoid missing-type issues across TS versions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let activeRecognition: any = null

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null
}

/**
 * Start speech-to-text recognition.
 * Calls onResult with partial and final transcripts.
 */
export function startSTT(
  lang: VoiceLanguage,
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (error: string) => void
): void {
  const SpeechRecognitionAPI = getSpeechRecognitionConstructor()
  if (!SpeechRecognitionAPI) {
    onError('Speech recognition not supported in this browser.')
    return
  }

  stopSTT() // stop any existing session

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognition: any = new SpeechRecognitionAPI()
  recognition.lang = lang
  recognition.continuous = false
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    const result = event.results[event.resultIndex]
    const transcript: string = result[0].transcript
    const isFinal: boolean = result.isFinal
    onResult(transcript, isFinal)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (event: any) => {
    onError(event.error as string)
  }

  recognition.onend = () => {
    activeRecognition = null
  }

  recognition.start()
  activeRecognition = recognition
}

/**
 * Stop the active speech recognition session.
 */
export function stopSTT(): void {
  if (activeRecognition) {
    try {
      activeRecognition.stop()
    } catch {
      // Ignore errors from stopping an already-stopped session
    }
    activeRecognition = null
  }
}

// ── Text-to-Speech ────────────────────────────────────────────────────────

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

let activeSpeech: SpeechSynthesisUtterance | null = null

/**
 * Read text aloud using the browser's speech synthesis.
 * @param text           Text to speak (plain text, not markdown)
 * @param lang           Language: 'en-IN' or 'hi-IN'
 * @param rate           Speech rate: 0.5–2.0 (default 0.95)
 * @param onWordBoundary Called with charIndex and word as speech progresses (for highlighting)
 * @param onEnd          Called when speech completes
 */
export function speak(
  text: string,
  lang: VoiceLanguage = 'en-IN',
  rate = 0.95,
  onWordBoundary?: (charIndex: number, word: string) => void,
  onEnd?: () => void
): void {
  if (!isSpeechSynthesisSupported()) return

  stopSpeaking()

  // Strip markdown for cleaner TTS output
  const cleanText = stripMarkdown(text)

  const utterance = new SpeechSynthesisUtterance(cleanText)
  utterance.lang = lang
  utterance.rate = rate
  utterance.pitch = 1.0

  // Pick the best available Indian English or Hindi voice
  const voices = window.speechSynthesis.getVoices()
  const preferredVoice = voices.find((v) =>
    lang === 'hi-IN' ? v.lang === 'hi-IN' : v.lang === 'en-IN' || v.lang.startsWith('en')
  )
  if (preferredVoice) {
    utterance.voice = preferredVoice
  }

  if (onWordBoundary) {
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const word = cleanText.slice(event.charIndex).split(/\s+/)[0] ?? ''
        onWordBoundary(event.charIndex, word)
      }
    }
  }

  if (onEnd) {
    utterance.onend = onEnd
  }

  activeSpeech = utterance
  window.speechSynthesis.speak(utterance)
}

/**
 * Stop any currently active speech synthesis.
 */
export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel()
    activeSpeech = null
  }
}

export function isSpeaking(): boolean {
  return isSpeechSynthesisSupported() && window.speechSynthesis.speaking
}

/**
 * Get available voices for a given language.
 * Returns empty array if synthesis not supported.
 */
export function getVoices(lang: VoiceLanguage): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return []
  return window.speechSynthesis.getVoices().filter((v) => v.lang === lang)
}

// ── Utilities ──────────────────────────────────────────────────────────────

/**
 * Strip basic markdown formatting for clean TTS output.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1') // italic
    .replace(/`(.*?)`/g, '$1') // inline code
    .replace(/#{1,6}\s/g, '') // headings
    .replace(/\$\$[\s\S]*?\$\$/g, 'math expression') // block LaTeX
    .replace(/\$(.*?)\$/g, 'math expression') // inline LaTeX
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^[-*+]\s/gm, '') // list bullets
    .trim()
}

// Export active speech reference for components that need to check it
export { activeSpeech }
