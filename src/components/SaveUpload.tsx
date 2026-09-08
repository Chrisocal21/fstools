import { useRef, useState } from 'react'
import { MOCK_FILE_NAMES } from '../lib/mockData'

type UploadEntry = { name: string; demo: boolean }

type SaveUploadProps = {
  onFilesAccepted?: (files: File[]) => void
  onMockDemo?: () => void
}

export default function SaveUpload({ onFilesAccepted, onMockDemo }: SaveUploadProps) {
  const [entries, setEntries] = useState<UploadEntry[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const acceptFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return
    const files = Array.from(incoming)
    setEntries((prev) => [...prev, ...files.map((f) => ({ name: f.name, demo: false }))])
    onFilesAccepted?.(files)
  }

  const loadMockDemo = () => {
    setEntries(MOCK_FILE_NAMES.map((name) => ({ name, demo: true })))
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
          acceptFiles(e.dataTransfer.files)
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
          onChange={(e) => acceptFiles(e.target.files)}
        />
      </div>

      <button
        type="button"
        onClick={loadMockDemo}
        className="mt-4 text-sm font-medium text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:text-forest-light"
      >
        No save on hand? Load mock demo data &rarr;
      </button>

      {entries.length > 0 && (
        <ul className="mt-6 space-y-2">
          {entries.map((entry, i) => (
            <li
              key={`${entry.name}-${i}`}
              className="flex items-center justify-between rounded-field border border-tan bg-white/60 px-4 py-3 text-sm"
            >
              <span className="text-ink">{entry.name}</span>
              <span className={`font-medium ${entry.demo ? 'text-forest' : 'text-status-safe'}`}>
                {entry.demo ? 'Demo data' : 'Accepted'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
