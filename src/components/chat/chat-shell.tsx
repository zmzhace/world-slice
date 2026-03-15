import React from 'react'
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
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Chat</h2>
      <MessageList messages={messages} />
      <ChatInput value={input} onChange={setInput} onSubmit={handleSubmit} disabled={loading} />
      {summary ? <div className="rounded border p-3">World Summary: {summary}</div> : null}
    </section>
  )
}
