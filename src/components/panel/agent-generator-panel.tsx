import React from 'react'
import type { PersonalAgentState, WorldSlice } from '@/domain/world'
import {
  UserPlus,
  Users,
  Info,
  CheckCircle2,
  Sparkles,
  Loader2,
  Mic,
  Lightbulb,
  Quote,
  Zap,
  HeartPulse,
  Brain,
  ChevronDown,
  ChevronUp,
  Target,
  Award,
} from 'lucide-react'

type AgentGeneratorPanelProps = {
  worldId: string
  world: WorldSlice
  onWorldUpdate?: (world: WorldSlice) => void
}

export function AgentGeneratorPanel({ worldId, world, onWorldUpdate }: AgentGeneratorPanelProps) {
  const [prompt, setPrompt] = React.useState('')
  const [generating, setGenerating] = React.useState(false)
  const [createdName, setCreatedName] = React.useState<string | null>(null)
  const [expandedAgent, setExpandedAgent] = React.useState<string | null>(null)

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
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
          <UserPlus className="h-5 w-5 text-zinc-400" />
          Agent Creator
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Create personalized agents via LLM. During world initialization, agents are auto-generated. You can also manually add more agents.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-blue-900/40 bg-blue-950/30 p-3 text-sm">
        <Info className="h-4 w-4 shrink-0 text-blue-400" />
        <div>
          <p className="font-medium text-blue-300">Agents in world: {world.agents.npcs.length}</p>
          {world.agents.npcs.length === 0 ? (
            <p className="mt-0.5 text-blue-400/70">Core agents will be auto-generated during world initialization.</p>
          ) : (
            <p className="mt-0.5 text-blue-400/70">You can add more agents to enrich the world.</p>
          )}
        </div>
      </div>

      {createdName && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-800/50 bg-emerald-950/30 p-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          Created: <span className="font-semibold">{createdName}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="agent-prompt" className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
            Character Description
          </label>
          <textarea
            id="agent-prompt"
            rows={3}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700"
            placeholder="Describe a character to create..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
          />
        </div>

        <button
          onClick={handleGenerate}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600"
          disabled={generating || !prompt.trim()}
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate
            </>
          )}
        </button>
      </div>

      {world.agents.npcs.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Users className="h-4 w-4 text-zinc-500" />
            Agents ({world.agents.npcs.length})
          </h3>
          {world.agents.npcs.map((agent, index) => {
            const isExpanded = expandedAgent === agent.genetics.seed
            return (
              <div key={index} className="rounded-lg border border-zinc-800 bg-zinc-900/60 transition-colors">
                <button
                  onClick={() => setExpandedAgent(isExpanded ? null : agent.genetics.seed)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <div>
                    <h4 className="font-semibold text-zinc-200">{agent.identity.name}</h4>
                    {agent.occupation && (
                      <p className="mt-0.5 text-xs text-zinc-500">{agent.occupation}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${
                      agent.life_status === 'alive'
                        ? 'border border-emerald-800/50 bg-emerald-950/40 text-emerald-400'
                        : agent.life_status === 'dead'
                        ? 'border border-zinc-700 bg-zinc-800 text-zinc-500'
                        : 'border border-violet-800/50 bg-violet-950/40 text-violet-400'
                    }`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                        agent.life_status === 'alive' ? 'bg-emerald-400'
                        : agent.life_status === 'dead' ? 'bg-zinc-500'
                        : 'bg-violet-400'
                      }`} />
                      {agent.life_status}
                    </span>
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4 text-zinc-500" />
                      : <ChevronDown className="h-4 w-4 text-zinc-500" />
                    }
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-zinc-800 px-4 pb-4 pt-3">
                    {(agent.voice || agent.approach || agent.core_belief) && (
                      <div className="mb-3 space-y-1.5 rounded-md bg-zinc-800/50 p-3 text-xs">
                        {agent.voice && (
                          <div className="flex items-start gap-2">
                            <Mic className="mt-0.5 h-3 w-3 shrink-0 text-zinc-500" />
                            <span className="text-zinc-400">{agent.voice}</span>
                          </div>
                        )}
                        {agent.approach && (
                          <div className="flex items-start gap-2">
                            <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-zinc-500" />
                            <span className="text-zinc-400">{agent.approach}</span>
                          </div>
                        )}
                        {agent.core_belief && (
                          <div className="flex items-start gap-2">
                            <Quote className="mt-0.5 h-3 w-3 shrink-0 text-zinc-500" />
                            <span className="italic text-zinc-400">{agent.core_belief}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {agent.expertise && agent.expertise.length > 0 && (
                      <div className="mb-3">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                          <Award className="h-3 w-3" />
                          Expertise
                        </span>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {agent.expertise.map((skill, i) => (
                            <span key={i} className="rounded-md border border-blue-900/50 bg-blue-950/40 px-2 py-0.5 text-xs text-blue-300">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                          <Brain className="h-3 w-3" />
                          Persona
                        </span>
                        <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-400">
                          <div className="flex justify-between">
                            <span>Openness</span>
                            <span className="text-zinc-300">{(agent.persona.openness * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Stability</span>
                            <span className="text-zinc-300">{(agent.persona.stability * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Attachment</span>
                            <span className="text-zinc-300">{(agent.persona.attachment * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Agency</span>
                            <span className="text-zinc-300">{(agent.persona.agency * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Empathy</span>
                            <span className="text-zinc-300">{(agent.persona.empathy * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                          <HeartPulse className="h-3 w-3" />
                          Vitals
                        </span>
                        <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-400">
                          <div className="flex justify-between">
                            <span>Energy</span>
                            <span className="text-emerald-400">{(agent.vitals.energy * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Stress</span>
                            <span className="text-red-400">{(agent.vitals.stress * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sleep debt</span>
                            <span className="text-zinc-300">{(agent.vitals.sleep_debt * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Focus</span>
                            <span className="text-blue-400">{(agent.vitals.focus * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Aging</span>
                            <span className="text-zinc-300">{(agent.vitals.aging_index * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-500">Emotion</span>
                        <span className="text-xs text-zinc-300">
                          {agent.emotion.label}
                        </span>
                        <span className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                          {(agent.emotion.intensity * 100).toFixed(0)}%
                        </span>
                      </div>

                      {agent.goals.length > 0 && (
                        <div>
                          <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                            <Target className="h-3 w-3" />
                            Goals
                          </span>
                          <ul className="mt-1.5 space-y-1">
                            {agent.goals.map((goal, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-zinc-800 text-[10px] font-medium text-zinc-500">
                                  {i + 1}
                                </span>
                                {goal}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
