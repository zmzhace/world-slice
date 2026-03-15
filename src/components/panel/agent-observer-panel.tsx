'use client'

import React from 'react'
import type { WorldSlice, PersonalAgentState } from '@/domain/world'
import {
  User,
  Briefcase,
  Shield,
  Sprout,
  HeartPulse,
  Brain,
  Eye,
  Hourglass,
  Compass,
  Anchor,
  Zap,
  Heart,
  Target,
  Star,
  Users,
  BarChart3,
  Mic,
  Lightbulb,
  Quote,
  Award,
  ChevronDown,
  AlertCircle,
} from 'lucide-react'

type AgentObserverPanelProps = {
  world: WorldSlice
}

export function AgentObserverPanel({ world }: AgentObserverPanelProps) {
  const [selectedSeed, setSelectedSeed] = React.useState<string | null>(null)

  // 选择第一个 agent 作为默认
  React.useEffect(() => {
    if (world.agents.npcs.length > 0 && !selectedSeed) {
      setSelectedSeed(world.agents.npcs[0].genetics.seed)
    }
  }, [world.agents.npcs, selectedSeed])

  // 从当前 world 中获取最新的 agent 状态
  const selectedAgent = selectedSeed
    ? world.agents.npcs.find(a => a.genetics.seed === selectedSeed) ?? null
    : null

  if (world.agents.npcs.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">Agent Observer</h2>
        <div className="flex items-center gap-3 rounded-lg border border-amber-900/40 bg-amber-950/30 p-4">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-200/80">
            No agents yet. Please initialize the world or create agents first.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
      <h2 className="mb-1 text-lg font-semibold text-zinc-100">Agent Observer</h2>
      <p className="mb-5 text-sm text-zinc-500">
        Switch between agents and inspect their state
      </p>

      {/* Agent selector */}
      <div className="mb-6">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
          Select Agent
        </label>
        <div className="relative">
          <select
            value={selectedAgent?.genetics.seed || ''}
            onChange={(e) => {
              const agent = world.agents.npcs.find(a => a.genetics.seed === e.target.value)
              setSelectedSeed(agent?.genetics.seed ?? null)
            }}
            className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 pr-10 text-sm text-zinc-200 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700"
          >
            {world.agents.npcs.map((agent) => (
              <option key={agent.genetics.seed} value={agent.genetics.seed}>
                {agent.identity.name} ({agent.occupation || 'Unknown'})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        </div>
      </div>

      {/* Agent details */}
      {selectedAgent && (
        <div className="space-y-4">
          {/* Identity */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-zinc-100">
              <User className="h-4 w-4 text-zinc-400" />
              {selectedAgent.identity.name}
            </h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-zinc-500">Occupation</span>
                <span className="ml-auto text-zinc-300">{selectedAgent.occupation || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-zinc-500">Role</span>
                <span className="ml-auto rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                  NPC
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HeartPulse className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-zinc-500">Status</span>
                <span className={`ml-auto inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs ${
                  selectedAgent.life_status === 'alive'
                    ? 'border border-emerald-800/50 bg-emerald-950/40 text-emerald-400'
                    : 'border border-zinc-700 bg-zinc-800 text-zinc-500'
                }`}>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                    selectedAgent.life_status === 'alive' ? 'bg-emerald-400' : 'bg-zinc-500'
                  }`} />
                  {selectedAgent.life_status === 'alive' ? 'Alive' : 'Deceased'}
                </span>
              </div>
            </div>
          </div>

          {/* Personality traits */}
          {(selectedAgent.voice || selectedAgent.approach || selectedAgent.core_belief) && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <Brain className="h-4 w-4 text-zinc-500" />
                Personality
              </h4>
              <div className="space-y-2.5 text-sm">
                {selectedAgent.voice && (
                  <div className="flex items-start gap-2">
                    <Mic className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                    <span className="text-zinc-500">Voice</span>
                    <span className="ml-2 text-zinc-300">{selectedAgent.voice}</span>
                  </div>
                )}
                {selectedAgent.approach && (
                  <div className="flex items-start gap-2">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                    <span className="text-zinc-500">Approach</span>
                    <span className="ml-2 text-zinc-300">{selectedAgent.approach}</span>
                  </div>
                )}
                {selectedAgent.core_belief && (
                  <div className="flex items-start gap-2">
                    <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
                    <span className="text-zinc-500">Core belief</span>
                    <span className="ml-2 italic text-zinc-400">"{selectedAgent.core_belief}"</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expertise */}
          {selectedAgent.expertise && selectedAgent.expertise.length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <Award className="h-4 w-4 text-zinc-500" />
                Expertise
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedAgent.expertise.map((skill, i) => (
                  <span key={i} className="rounded-md border border-blue-900/50 bg-blue-950/40 px-2.5 py-1 text-xs text-blue-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          {selectedAgent.goals.length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <Target className="h-4 w-4 text-zinc-500" />
                Current Goals
              </h4>
              <ol className="space-y-1.5 text-sm">
                {selectedAgent.goals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-zinc-800 text-xs font-medium text-zinc-400">
                      {i + 1}
                    </span>
                    <span className="text-zinc-300">{goal}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Vitals */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <HeartPulse className="h-4 w-4 text-zinc-500" />
              Vitals
            </h4>
            <div className="space-y-3">
              <VitalBar
                icon={<Zap className="h-3.5 w-3.5 text-emerald-500" />}
                label="Energy"
                value={selectedAgent.vitals.energy}
                color="bg-emerald-500"
              />
              <VitalBar
                icon={<HeartPulse className="h-3.5 w-3.5 text-red-500" />}
                label="Stress"
                value={selectedAgent.vitals.stress}
                color="bg-red-500"
              />
              <VitalBar
                icon={<Eye className="h-3.5 w-3.5 text-blue-500" />}
                label="Focus"
                value={selectedAgent.vitals.focus}
                color="bg-blue-500"
              />
              <VitalBar
                icon={<Hourglass className="h-3.5 w-3.5 text-zinc-400" />}
                label="Aging"
                value={selectedAgent.vitals.aging_index}
                color="bg-zinc-500"
              />
            </div>
          </div>

          {/* Persona traits */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <Compass className="h-4 w-4 text-zinc-500" />
              Persona Traits
            </h4>
            <div className="space-y-3">
              <TraitBar
                icon={<Compass className="h-3.5 w-3.5 text-violet-400" />}
                label="Openness"
                value={selectedAgent.persona.openness}
                color="bg-violet-500"
              />
              <TraitBar
                icon={<Anchor className="h-3.5 w-3.5 text-cyan-400" />}
                label="Stability"
                value={selectedAgent.persona.stability}
                color="bg-cyan-500"
              />
              <TraitBar
                icon={<Heart className="h-3.5 w-3.5 text-pink-400" />}
                label="Attachment"
                value={selectedAgent.persona.attachment}
                color="bg-pink-500"
              />
              <TraitBar
                icon={<Zap className="h-3.5 w-3.5 text-amber-400" />}
                label="Agency"
                value={selectedAgent.persona.agency}
                color="bg-amber-500"
              />
              <TraitBar
                icon={<Heart className="h-3.5 w-3.5 text-rose-400" />}
                label="Empathy"
                value={selectedAgent.persona.empathy}
                color="bg-rose-500"
              />
            </div>
          </div>

          {/* Emotion */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <Star className="h-4 w-4 text-zinc-500" />
              Current Emotion
            </h4>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium text-zinc-200">{selectedAgent.emotion.label}</span>
              <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                {Math.round(selectedAgent.emotion.intensity * 100)}%
              </span>
            </div>
          </div>

          {/* Relations */}
          {Object.keys(selectedAgent.relations).length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <Users className="h-4 w-4 text-zinc-500" />
                Relations
              </h4>
              <div className="space-y-2 text-sm">
                {Object.entries(selectedAgent.relations).map(([name, value]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-zinc-300">{name}</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                      value > 0
                        ? 'border border-emerald-800/50 bg-emerald-950/40 text-emerald-400'
                        : value < 0
                        ? 'border border-red-800/50 bg-red-950/40 text-red-400'
                        : 'border border-zinc-700 bg-zinc-800 text-zinc-400'
                    }`}>
                      {value > 0 ? '+' : ''}{Math.round(value * 100)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success metrics */}
          {selectedAgent.success_metrics && Object.keys(selectedAgent.success_metrics).length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <BarChart3 className="h-4 w-4 text-zinc-500" />
                Success Metrics
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(selectedAgent.success_metrics).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-md bg-zinc-800/50 px-3 py-1.5">
                    <span className="capitalize text-zinc-500">{key}</span>
                    <span className="font-medium text-zinc-300">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function VitalBar({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {icon}
      <span className="w-16 text-zinc-500">{label}</span>
      <div className="flex flex-1 items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-zinc-800">
          <div
            className={`h-1.5 rounded-full ${color} transition-all`}
            style={{ width: `${value * 100}%` }}
          />
        </div>
        <span className="w-10 text-right text-xs tabular-nums text-zinc-400">
          {Math.round(value * 100)}%
        </span>
      </div>
    </div>
  )
}

function TraitBar({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {icon}
      <span className="w-20 text-zinc-500">{label}</span>
      <div className="flex flex-1 items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-zinc-800">
          <div
            className={`h-1.5 rounded-full ${color} transition-all`}
            style={{ width: `${value * 100}%` }}
          />
        </div>
        <span className="w-10 text-right text-xs tabular-nums text-zinc-400">
          {Math.round(value * 100)}%
        </span>
      </div>
    </div>
  )
}
