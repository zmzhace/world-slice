import React from 'react'
import {
  Globe,
  Sparkles,
  Users,
  BookOpen,
  PartyPopper,
  Clapperboard,
  Skull,
  RefreshCw,
  Timer,
  MessageCircle,
  Drama,
  Star,
  Pin,
  Activity,
} from 'lucide-react'
import type { WorldSlice } from '@/domain/world'

type EventsPanelProps = {
  world: WorldSlice
}

const eventConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  world_created: { icon: Globe, label: 'World Created', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  world_initialized: { icon: Sparkles, label: 'World Initialized', color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  agents_created: { icon: Users, label: 'Agents Created', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  narrative_emerged: { icon: BookOpen, label: 'Narrative Emerged', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  narrative_concluded: { icon: PartyPopper, label: 'Narrative Concluded', color: 'bg-green-500/15 text-green-400 border-green-500/20' },
  story_arc_detected: { icon: Clapperboard, label: 'Story Arc Detected', color: 'bg-pink-500/15 text-pink-400 border-pink-500/20' },
  agent_death: { icon: Skull, label: 'Agent Death', color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  agent_reincarnation: { icon: RefreshCw, label: 'Reincarnation', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' },
  tick: { icon: Timer, label: 'Tick', color: 'bg-slate-500/15 text-slate-400 border-slate-500/20' },
  user_message: { icon: MessageCircle, label: 'User Message', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  micro: { icon: Drama, label: 'Agent Action', color: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  macro: { icon: Star, label: 'Major Event', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
}

const defaultEventConfig = { icon: Pin, label: '', color: 'bg-slate-500/15 text-slate-400 border-slate-500/20' }

export function EventsPanel({ world }: EventsPanelProps) {
  const recentEvents = world.events.slice(-20).reverse()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-100">Event Log</h2>
        </div>
        <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-xs text-slate-400">
          Tick {world.tick}
        </span>
      </div>

      <div className="space-y-1.5">
        {recentEvents.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No events yet</p>
        ) : (
          recentEvents.map((event) => {
            const payload = event.payload || {}
            const summary = payload.summary ? String(payload.summary) : null
            const message = payload.message ? String(payload.message) : null
            const count = payload.count !== undefined ? String(payload.count) : null
            const agentNames = payload.agent_names && Array.isArray(payload.agent_names)
              ? (payload.agent_names as string[]).join(', ')
              : null
            const narrativeTitle = payload.narrative_title ? String(payload.narrative_title) : null
            const narrativeType = payload.narrative_type ? String(payload.narrative_type) : null
            const agentName = payload.agent_name ? String(payload.agent_name) : null
            const cause = payload.cause ? String(payload.cause) : null
            const oldName = payload.old_name ? String(payload.old_name) : null
            const newName = payload.new_name ? String(payload.new_name) : null

            const config = eventConfig[event.type] || { ...defaultEventConfig, label: event.type }
            const IconComponent = config.icon

            return (
              <div
                key={event.id}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 text-sm transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${config.color}`}>
                      <IconComponent className="h-3 w-3" />
                      {config.label}
                    </span>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {Object.keys(payload).length > 0 && (
                  <div className="mt-2 space-y-1 text-xs text-slate-400">
                    {summary && <div>{summary}</div>}
                    {message && <div>{message}</div>}
                    {count && (
                      <div className="text-slate-500">
                        Count: {count}
                      </div>
                    )}
                    {agentNames && (
                      <div className="text-slate-500">
                        Agents: {agentNames}
                      </div>
                    )}
                    {narrativeTitle && <div>{narrativeTitle}</div>}
                    {narrativeType && (
                      <div className="text-slate-500">
                        Type: {narrativeType}
                      </div>
                    )}
                    {agentName && event.type === 'agent_death' && cause && (
                      <div className="flex items-center gap-1.5 text-red-400/80">
                        <Skull className="h-3 w-3" />
                        {agentName} - {cause}
                      </div>
                    )}
                    {oldName && event.type === 'agent_reincarnation' && newName && (
                      <div className="flex items-center gap-1.5 text-cyan-400/80">
                        <RefreshCw className="h-3 w-3" />
                        {oldName} → {newName}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
