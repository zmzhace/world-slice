import React from 'react'
import { Send } from 'lucide-react'

type ChatInputProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
}

export function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  return (
    <div className="flex items-end gap-2">
      <textarea
        className="flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            onSubmit()
          }
        }}
        placeholder="Say something..."
        rows={1}
      />
      <button
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600"
        onClick={onSubmit}
        disabled={disabled}
        aria-label="Send message"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  )
}
