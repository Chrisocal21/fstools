import { useRef, useState } from 'react'
import { MOCK_FILE_NAMES } from '../lib/mockData'
import { classifyFile, parseSaveFiles, type SaveDocs } from '../lib/parseSave'
import type { SaveData, SaveFileStatus } from '../lib/saveModel'

type UploadEntry = { name: string; status: SaveFileStatus | 'demo'; note: string }

type SaveUploadProps = {
  onFilesAccepted?: (files: File[]) => void
  onSaveParsed?: (save: SaveData, docs: SaveDocs) => void
  onMockDemo?: () => void
}

const STATUS_STYLES: Record<UploadEntry['status'], string> = {
  parsed: 'text-status-safe',
  passthrough: 'text-ink/50',
  unrecognized: 'text-status-attention',
  demo: 'text-forest',
}

const STATUS_LABELS: Record<UploadEntry['status'], string> = {
  parsed: 'Accepted',
  passthrough: 'Passed through',
  unrecognized: 'Mod content',
  demo: 'Demo data',
}

export default function SaveUpload({
  onFilesAccepted,
  onSaveParsed,
  onMockDemo,
}: SaveUploadProps) {
  const [entries, setEntries] = useState<UploadEntry[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const acceptFiles = async (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return
    const files = Array.from(incoming)

    // Confirm each file the moment it lands, before any parsing work.
    setEntries((prev) => [
      ...prev,
      ...files.map((f) => ({ name: f.name, ...classifyFile(f.name) })),
    ])
    onFilesAccepted?.(files)

    if (!onSaveParsed) return
    setIsParsing(true)
    try {
      const { save, docs } = await parseSaveFiles(files)
      setEntries((prev) => {
        const byName = new Map(save.files.map((f) => [f.name, f]))
        return prev.map((entry) => {
          const parsed = byName.get(entry.name)
          return parsed ? { name: entry.name, status: parsed.status, note: parsed.note } : entry
        })
      })
      onSaveParsed(save, docs)
    } finally {
      setIsParsing(false)
    }
  }

  const loadMockDemo = () => {
    setEntries(
      MOCK_FILE_NAMES.map((name) => ({
        name,
        status: 'demo' as const,
        note: 'Representative values',
      })),
    )
    onMockDemo?.()
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          void acceptFiles(e.dataTransfer.files)
        }}
        className={`cursor-pointer rounded-field border-2 border-dashed p-12 text-center transition-colors ${
          isDragging ? 'border-forest bg-forest/5' : 'border-tan bg-white/40 hover:border-forest/60'
        }`}
      >
        <p className="font-display text-lg font-medium text-ink">
          Drop save files here, or click to browse
        </p>
        <p className="mt-2 text-sm text-ink/60">
          Accepts the XML files from your Farming Simulator savegame folder. One at
          a time or several at once — no zip required.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xml"
          multiple
          className="hidden"
          onChange={(e) => void acceptFiles(e.target.files)}
        />
      </div>

      <button
        type="button"
        onClick={loadMockDemo}
        className="mt-4 text-sm font-medium text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:text-forest-light"
      >
        No save on hand? Load mock demo data &rarr;
      </button>

      {isParsing && <p className="mt-4 text-sm text-ink/60">Reading your save…</p>}

      {entries.length > 0 && (
        <ul className="mt-6 space-y-2">
          {entries.map((entry, i) => (
            <li
              key={`${entry.name}-${i}`}
              className="flex items-center justify-between gap-4 rounded-field border border-tan bg-white/60 px-4 py-3 text-sm"
            >
              <span className="truncate text-ink">{entry.name}</span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-ink/40">{entry.note}</span>
                <span className={`font-medium ${STATUS_STYLES[entry.status]}`}>
                  {STATUS_LABELS[entry.status]}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
