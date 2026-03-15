import React from 'react'
import { User, Bot } from 'lucide-react'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type MessageListProps = {
  messages: ChatMessage[]
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-3">
      {messages.map((message, index) => {
        const isUser = message.role === 'user'
        return (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-[80%] gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  isUser ? 'bg-blue-600/20' : 'bg-white/[0.06]'
                }`}
              >
                {isUser ? (
                  <User className="h-3.5 w-3.5 text-blue-400" />
                ) : (
                  <Bot className="h-3.5 w-3.5 text-slate-400" />
                )}
              </div>
              <div>
                <div
                  className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : 'border border-white/[0.08] bg-white/[0.03] text-slate-300'
                  }`}
                >
                  {message.content}
                </div>
                <div
                  className={`mt-1 text-[10px] text-slate-500 ${
                    isUser ? 'text-right' : 'text-left'
                  }`}
                >
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
