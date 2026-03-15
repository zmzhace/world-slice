'use client'

import React from 'react'
import type { WorldSlice } from '@/domain/world'
import {
  Sprout,
  Skull,
  RefreshCw,
  Clock,
  Heart,
  Activity,
  Target,
  BookOpen,
  CircleDot,
} from 'lucide-react'

type HoutuPanelProps = {
  world: WorldSlice
}

export function HoutuPanel({ world }: HoutuPanelProps) {
  const aliveAgents = world.agents.npcs.filter(a => a.life_status === 'alive')
  const deadAgents = world.agents.npcs.filter(a => a.life_status === 'dead')
  const reincarnatedAgents = world.agents.npcs.filter(a =>
    a.genetics.seed.includes('-reborn-')
  )

  const deathEvents = world.events.filter(e => e.type === 'agent_death')
  const reincarnationEvents = world.events.filter(e => e.type === 'agent_reincarnation')

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Activity className="h-5 w-5 text-slate-500" />
          Life Cycle
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Birth, death, and rebirth of agents
        </p>
      </div>

      {/* Stats overview */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-2xl font-bold tabular-nums text-emerald-600">{aliveAgents.length}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-500">
            <Sprout className="h-3 w-3" />
            Alive
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="text-2xl font-bold tabular-nums text-slate-500">{deadAgents.length}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
            <Skull className="h-3 w-3" />
            Deceased
          </div>
        </div>
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
          <div className="text-2xl font-bold tabular-nums text-violet-600">{reincarnatedAgents.length}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-violet-500">
            <RefreshCw className="h-3 w-3" />
            Reborn
          </div>
        </div>
      </div>

      {/* Alive agents */}
      {aliveAgents.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            <Sprout className="h-3.5 w-3.5" />
            Alive
          </h3>
          <div className="space-y-2">
            {aliveAgents.map((agent) => (
              <div
                key={agent.genetics.seed}
                className="rounded-lg border border-slate-200 bg-slate-50 shadow-sm p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-medium text-slate-800">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      {agent.identity.name}
                      {agent.genetics.seed.includes('-reborn-') && (
                        <span className="inline-flex items-center gap-1 rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] text-violet-600">
                          <RefreshCw className="h-2.5 w-2.5" />
                          Reborn
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        Aging {Math.floor(agent.vitals.aging_index * 100)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Stress {Math.floor(agent.vitals.stress * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                {agent.goals.length > 0 && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-400">
                    <Target className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{agent.goals.slice(0, 2).join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dead agents */}
      {deadAgents.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            <Skull className="h-3.5 w-3.5" />
            Deceased
          </h3>
          <div className="space-y-2">
            {deadAgents.map((agent) => (
              <div
                key={agent.genetics.seed}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-medium text-slate-500">
                      <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                      {agent.identity.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {agent.cause_of_death || 'Unknown cause'}
                      {agent.death_tick && (
                        <span className="ml-2 text-slate-300">Tick {agent.death_tick}</span>
                      )}
                    </div>
                  </div>
                </div>
                {agent.legacy && agent.legacy.length > 0 && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-400">
                    <BookOpen className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>Legacy: {agent.legacy.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Death events */}
      {deathEvents.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            <CircleDot className="h-3.5 w-3.5" />
            Death Records
          </h3>
          <div className="space-y-2">
            {deathEvents.slice(-5).reverse().map((event) => (
              <div
                key={event.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
              >
                <div className="flex items-start gap-2.5">
                  <Skull className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div className="flex-1">
                    <div className="font-medium text-slate-600">
                      {event.payload?.agent_name as string}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {event.payload?.cause as string}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reincarnation events */}
      {reincarnationEvents.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            <RefreshCw className="h-3.5 w-3.5" />
            Rebirth Records
          </h3>
          <div className="space-y-2">
            {reincarnationEvents.slice(-5).reverse().map((event) => (
              <div
                key={event.id}
                className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm"
              >
                <div className="flex items-start gap-2.5">
                  <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                  <div className="flex-1">
                    <div className="font-medium text-slate-600">
                      {event.payload?.old_name as string}
                      <span className="mx-2 text-slate-400">&rarr;</span>
                      <span className="text-violet-600">{event.payload?.new_name as string}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {event.payload?.old_role as string}
                      <span className="mx-1 text-slate-300">&rarr;</span>
                      {event.payload?.new_role as string}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {aliveAgents.length === 0 && deadAgents.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-400">
          No agents yet. Please initialize the world first.
        </div>
      )}
    </div>
  )
}
