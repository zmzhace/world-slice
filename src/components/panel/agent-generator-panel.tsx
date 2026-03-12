import React from 'react'
import type { PersonalAgentState, WorldSlice } from '@/domain/world'

type AgentGeneratorPanelProps = {
  worldId: string
  world: WorldSlice
  onWorldUpdate?: (world: WorldSlice) => void
}

export function AgentGeneratorPanel({ worldId, world, onWorldUpdate }: AgentGeneratorPanelProps) {
  const [prompt, setPrompt] = React.useState('')
  const [count, setCount] = React.useState(3)
  const [generating, setGenerating] = React.useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return

    setGenerating(true)
    try {
      // 提取世界背景信息
      const genesisEvent = world.events.find(e => e.type === 'world_created')
      const worldContext = {
        environment: world.environment,
        social_context: world.social_context,
        narrative_seed: genesisEvent?.payload?.narrative_seed,
      }

      const response = await fetch('/api/agents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          count,
          worldContext,  // 传递世界背景
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate agents')
      }

      const data = await response.json()
      console.log('Agents generated:', data.agents)
      
      // Add generated agents to world
      const updatedWorld: WorldSlice = {
        ...world,
        agents: {
          ...world.agents,
          npcs: [...world.agents.npcs, ...data.agents],
        },
        events: [
          ...world.events,
          {
            id: `nuwa-${world.tick}-${Date.now()}`,
            type: 'agents_created',
            timestamp: new Date().toISOString(),
            payload: {
              count: data.agents.length,
              prompt,
              agent_names: data.agents.map((a: PersonalAgentState) => a.identity.name),
            },
          },
        ],
      }
      
      // Save to localStorage
      localStorage.setItem(`world_${worldId}`, JSON.stringify(updatedWorld))
      
      // Update parent component
      if (onWorldUpdate) {
        onWorldUpdate(updatedWorld)
      }
      
      alert(`成功生成 ${data.agents.length} 个 agent！`)
      setPrompt('')
    } catch (error) {
      console.error('Failed to generate agents:', error)
      alert('生成人物失败: ' + (error as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">女娲造人</h2>
      <p className="text-sm text-slate-600">
        描述你想要创建的人物，女娲将根据世界背景生成符合设定的 agent。这些 agent 会自主行动，推动世界发展。
      </p>

      <div className="rounded-lg border bg-blue-50 p-3 text-sm">
        <p className="font-medium text-blue-900">当前世界中的 Agents: {world.agents.npcs.length}</p>
        <p className="mt-1 text-blue-700">建议生成 3-5 个核心 agent 来推动主要剧情</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="agent-prompt" className="block text-sm font-medium">
            人物描述
          </label>
          <textarea
            id="agent-prompt"
            rows={3}
            className="mt-2 w-full rounded border px-3 py-2 text-sm"
            placeholder="例如：一个在南疆山寨长大的年轻蛊师，天资聪颖但性格孤僻..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
          />
        </div>

        <div>
          <label htmlFor="agent-count" className="block text-sm font-medium">
            生成数量
          </label>
          <input
            id="agent-count"
            type="number"
            min="1"
            max="10"
            className="mt-2 w-full rounded border px-3 py-2 text-sm"
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
            disabled={generating}
          />
        </div>

        <button
          onClick={handleGenerate}
          className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={generating || !prompt.trim()}
        >
          {generating ? '生成中...' : '生成 Agents'}
        </button>
      </div>

      {world.agents.npcs.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">世界中的 Agents ({world.agents.npcs.length})</h3>
          {world.agents.npcs.map((agent, index) => (
            <div key={index} className="rounded-lg border p-4">
              <h4 className="mb-2 font-semibold">{agent.identity.name}</h4>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-slate-600">性格特质：</span>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <div>开放性: {(agent.persona.openness * 100).toFixed(0)}%</div>
                    <div>稳定性: {(agent.persona.stability * 100).toFixed(0)}%</div>
                    <div>依恋性: {(agent.persona.attachment * 100).toFixed(0)}%</div>
                    <div>主动性: {(agent.persona.agency * 100).toFixed(0)}%</div>
                    <div>共情力: {(agent.persona.empathy * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-slate-600">生命状态：</span>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <div>能量: {(agent.vitals.energy * 100).toFixed(0)}%</div>
                    <div>压力: {(agent.vitals.stress * 100).toFixed(0)}%</div>
                    <div>睡眠债: {(agent.vitals.sleep_debt * 100).toFixed(0)}%</div>
                    <div>专注: {(agent.vitals.focus * 100).toFixed(0)}%</div>
                    <div>衰老: {(agent.vitals.aging_index * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-slate-600">情绪：</span>
                  <span className="ml-2">
                    {agent.emotion.label} (强度: {(agent.emotion.intensity * 100).toFixed(0)}%)
                  </span>
                </div>

                {agent.goals.length > 0 && (
                  <div>
                    <span className="font-medium text-slate-600">目标：</span>
                    <ul className="mt-1 list-inside list-disc">
                      {agent.goals.map((goal, i) => (
                        <li key={i}>{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
