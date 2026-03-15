import React from 'react'
import type { PersonalAgentState, WorldSlice } from '@/domain/world'

type AgentGeneratorPanelProps = {
  worldId: string
  world: WorldSlice
  onWorldUpdate?: (world: WorldSlice) => void
}

export function AgentGeneratorPanel({ worldId, world, onWorldUpdate }: AgentGeneratorPanelProps) {
  const [prompt, setPrompt] = React.useState('')
  const [generating, setGenerating] = React.useState(false)
  const [createdName, setCreatedName] = React.useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return

    setGenerating(true)
    setCreatedName(null)
    try {
      // Extract world context
      const genesisEvent = world.events.find(e => e.type === 'world_created')
      const worldContext = {
        environment: world.environment,
        social_context: world.social_context,
        narrative_seed: genesisEvent?.payload?.narrative_seed,
      }

      // Build existing agents list for relationship generation
      const existingAgents = world.agents.npcs.map((a: PersonalAgentState) => ({
        seed: a.genetics.seed,
        name: a.identity.name,
        occupation: a.occupation,
      }))

      const response = await fetch('/api/agents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          worldContext,
          existingAgents,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate agent')
      }

      const data = await response.json()
      const newAgent: PersonalAgentState = data.agent
      console.log('Agent generated:', newAgent.identity.name)

      // Add generated agent to world
      const updatedWorld: WorldSlice = {
        ...world,
        agents: {
          ...world.agents,
          npcs: [...world.agents.npcs, newAgent],
        },
        events: [
          ...world.events,
          {
            id: `creator-${world.tick}-${Date.now()}`,
            type: 'agent_created',
            timestamp: new Date().toISOString(),
            payload: {
              agent_name: newAgent.identity.name,
              prompt,
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

      setCreatedName(newAgent.identity.name)
      setPrompt('')

      // Clear success message after 4 seconds
      setTimeout(() => setCreatedName(null), 4000)
    } catch (error) {
      console.error('Failed to generate agent:', error)
      alert('Failed to generate agent: ' + (error as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Agent Creator</h2>
      <p className="text-sm text-slate-600">
        Create personalized agents via LLM. During world initialization, agents are auto-generated. You can also manually add more agents.
      </p>

      <div className="rounded-lg border bg-blue-50 p-3 text-sm">
        <p className="font-medium text-blue-900">Agents in world: {world.agents.npcs.length}</p>
        {world.agents.npcs.length === 0 ? (
          <p className="mt-1 text-blue-700">Core agents will be auto-generated during world initialization.</p>
        ) : (
          <p className="mt-1 text-blue-700">You can add more agents to enrich the world.</p>
        )}
      </div>

      {createdName && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Created: <span className="font-semibold">{createdName}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="agent-prompt" className="block text-sm font-medium">
            Character Description
          </label>
          <textarea
            id="agent-prompt"
            rows={3}
            className="mt-2 w-full rounded border px-3 py-2 text-sm"
            placeholder="Describe a character to create..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
          />
        </div>

        <button
          onClick={handleGenerate}
          className="w-full rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={generating || !prompt.trim()}
        >
          {generating ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {world.agents.npcs.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Agents ({world.agents.npcs.length})</h3>
          {world.agents.npcs.map((agent, index) => (
            <div key={index} className="rounded-lg border p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{agent.identity.name}</h4>
                  {agent.occupation && (
                    <p className="text-xs text-slate-600">{agent.occupation}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
                    agent.life_status === 'alive' ? 'bg-green-100 text-green-800' :
                    agent.life_status === 'dead' ? 'bg-gray-100 text-gray-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {agent.life_status}
                  </span>
                </div>
              </div>

              {(agent.voice || agent.approach || agent.core_belief) && (
                <div className="mb-3 space-y-1 rounded bg-slate-50 p-2 text-xs">
                  {agent.voice && (
                    <div><span className="font-medium">Voice: </span>{agent.voice}</div>
                  )}
                  {agent.approach && (
                    <div><span className="font-medium">Approach: </span>{agent.approach}</div>
                  )}
                  {agent.core_belief && (
                    <div><span className="font-medium">Core belief: </span>{agent.core_belief}</div>
                  )}
                </div>
              )}

              {agent.expertise && agent.expertise.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs font-medium text-slate-600">Expertise:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {agent.expertise.map((skill, i) => (
                      <span key={i} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-slate-600">Persona:</span>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <div>Openness: {(agent.persona.openness * 100).toFixed(0)}%</div>
                    <div>Stability: {(agent.persona.stability * 100).toFixed(0)}%</div>
                    <div>Attachment: {(agent.persona.attachment * 100).toFixed(0)}%</div>
                    <div>Agency: {(agent.persona.agency * 100).toFixed(0)}%</div>
                    <div>Empathy: {(agent.persona.empathy * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-slate-600">Vitals:</span>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <div>Energy: {(agent.vitals.energy * 100).toFixed(0)}%</div>
                    <div>Stress: {(agent.vitals.stress * 100).toFixed(0)}%</div>
                    <div>Sleep debt: {(agent.vitals.sleep_debt * 100).toFixed(0)}%</div>
                    <div>Focus: {(agent.vitals.focus * 100).toFixed(0)}%</div>
                    <div>Aging: {(agent.vitals.aging_index * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-slate-600">Emotion:</span>
                  <span className="ml-2">
                    {agent.emotion.label} ({(agent.emotion.intensity * 100).toFixed(0)}%)
                  </span>
                </div>

                {agent.goals.length > 0 && (
                  <div>
                    <span className="font-medium text-slate-600">Goals:</span>
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
