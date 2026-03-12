import React from 'react'
import type { WorldSlice } from '@/domain/world'

type AgentPanelProps = {
  world: WorldSlice
}

type ObservationState = {
  summary: string
  loading: boolean
  error: string | null
}

type AgentOption = {
  id: string
  label: string
}

export function AgentPanel({ world }: AgentPanelProps) {
  const [agents, setAgents] = React.useState<AgentOption[]>([])
  const [selectedId, setSelectedId] = React.useState<string>('')
  const [prompt, setPrompt] = React.useState('')
  const [observation, setObservation] = React.useState<ObservationState>({
    summary: '',
    loading: false,
    error: null,
  })

  const handleGenerateAgents = async () => {
    if (!prompt.trim()) return
    setObservation((prev) => ({ ...prev, error: null }))

    const response = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      setObservation((prev) => ({ ...prev, error: '生成失败，请重试。' }))
      return
    }

    const data = await response.json()
    const nextAgents: AgentOption[] = (data.agents ?? []).map((agent: { genetics?: { seed?: string } }) => ({
      id: agent.genetics?.seed ?? '',
      label: agent.genetics?.seed ?? 'agent',
    }))

    setAgents(nextAgents)
    if (nextAgents.length && !selectedId) {
      setSelectedId(nextAgents[0].id)
    }
  }

  const handleRefreshSummary = async () => {
    if (!selectedId) {
      setObservation((prev) => ({ ...prev, error: '请先选择一个 personal agent。' }))
      return
    }

    setObservation({ summary: '', loading: true, error: null })

    const response = await fetch('/api/observations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: `观察 ${selectedId}`, world }),
    })

    if (!response.ok) {
      setObservation({ summary: '', loading: false, error: '生成失败，请重试。' })
      return
    }

    const data = await response.json()
    setObservation({ summary: data.summary ?? '', loading: false, error: null })
  }

  return (
    <section className="rounded border p-4 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Agent Observation Desk</h3>
        <div className="text-sm text-slate-600">切换 personal agent 并查看世界观察。</div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">生成 Personal Agents</label>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded border px-3 py-2 text-sm"
            placeholder="描述你想要的个人 agent..."
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <button
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
            onClick={handleGenerateAgents}
          >
            生成
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Personal Agent</label>
        <select
          className="w-full rounded border px-3 py-2 text-sm"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          <option value="">选择一个 agent</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">观察摘要</label>
          <button
            className="rounded border px-3 py-1.5 text-sm"
            onClick={handleRefreshSummary}
          >
            刷新摘要
          </button>
        </div>
        <div className="rounded border bg-slate-50 p-3 text-sm text-slate-700 min-h-[120px]">
          {observation.loading && <div>生成中...</div>}
          {observation.error && <div className="text-red-600">{observation.error}</div>}
          {!observation.loading && !observation.error && observation.summary && (
            <div>{observation.summary}</div>
          )}
          {!observation.loading && !observation.error && !observation.summary && (
            <div className="text-slate-400">暂无摘要</div>
          )}
        </div>
      </div>

      <div className="rounded border p-3 text-sm text-slate-600">
        <div>Tick: {world.tick}</div>
        <div>Time: {world.time}</div>
      </div>
    </section>
  )
}
