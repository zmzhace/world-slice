import React from 'react'
import { MessageSquare } from 'lucide-react'
import type { WorldSlice } from '@/domain/world'
import { ChatInput } from './chat-input'
import { MessageList } from './message-list'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ChatResponse = {
  reply: string
  worldSummary: string
  world?: WorldSlice
  error?: string
}

type ChatShellProps = {
  world?: WorldSlice | null
  onWorldUpdate?: (world: WorldSlice) => void
}

export function ChatShell({ world, onWorldUpdate }: ChatShellProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [summary, setSummary] = React.useState<string>('')
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async () => {
    if (!input.trim() || loading) return
    const content = input.trim()
    setMessages((prev) => [...prev, { role: 'user', content }])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, world: world ?? undefined }),
      })
      const data: ChatResponse = await response.json()

      if (data.error) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${data.error}` }])
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
        setSummary(data.worldSummary)
        if (data.world && onWorldUpdate) {
          onWorldUpdate(data.world)
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${(error as Error).message}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <MessageSquare className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-semibold text-slate-800">Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />
      </div>

      <div className="border-t border-slate-200 p-3">
        <ChatInput value={input} onChange={setInput} onSubmit={handleSubmit} disabled={loading} />
      </div>

      {summary ? (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="font-medium text-slate-500">World Summary:</span>{' '}
          {summary}
        </div>
      ) : null}
    </section>
  )
}
