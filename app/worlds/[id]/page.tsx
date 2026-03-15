'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChatShell } from '@/components/chat/chat-shell'
import { PanelShell } from '@/components/panel/panel-shell'
import { AgentGeneratorPanel } from '@/components/panel/agent-generator-panel'
import { EventsPanel } from '@/components/panel/events-panel'
import { NarrativePanel } from '@/components/panel/narrative-panel'
import { SocialNetworkPanel } from '@/components/panel/social-network-panel'
import { NarrativeTimelinePanel } from '@/components/panel/narrative-timeline-panel'
import { HoutuPanel } from '@/components/panel/houtu-panel'
import { AgentObserverPanel } from '@/components/panel/agent-observer-panel'
import { SystemStatsPanel } from '@/components/panel/system-stats-panel'
import { createInitialWorldSlice } from '@/domain/world'
import { getWorld } from '@/store/worlds'
import { runWorldTick } from '@/engine/orchestrator'
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  Clock,
  Globe,
  Users,
  UserPlus,
  BookOpen,
  Share2,
  Calendar,
  RefreshCw,
  Scroll,
  BarChart3,
} from 'lucide-react'

const TABS = [
  { key: 'world', label: 'World', icon: Globe },
  { key: 'observer', label: 'Agents', icon: Users },
  { key: 'agents', label: 'Create', icon: UserPlus },
  { key: 'narratives', label: 'Narrative', icon: BookOpen },
  { key: 'social', label: 'Network', icon: Share2 },
  { key: 'timeline', label: 'Timeline', icon: Calendar },
  { key: 'houtu', label: 'Life Cycle', icon: RefreshCw },
  { key: 'events', label: 'Events', icon: Scroll },
  { key: 'stats', label: 'Stats', icon: BarChart3 },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function WorldDetailPage() {
  const params = useParams()
  const router = useRouter()
  const worldId = params.id as string

  const [worldRecord, setWorldRecord] = React.useState<ReturnType<typeof getWorld> | undefined>(undefined)
  const [world, setWorld] = React.useState<ReturnType<typeof createInitialWorldSlice> | null>(null)
  const [activeTab, setActiveTab] = React.useState<TabKey>('world')
  const [advancing, setAdvancing] = React.useState(false)
  const [autoAdvancing, setAutoAdvancing] = React.useState(false)
  const [autoAdvanceTicks, setAutoAdvanceTicks] = React.useState<number>(10)

  React.useEffect(() => {
    setWorldRecord(getWorld(worldId))
  }, [worldId])

  React.useEffect(() => {
    if (worldRecord) {
      const savedWorld = localStorage.getItem(`world_${worldId}`)
      if (savedWorld) {
        try {
          const world = JSON.parse(savedWorld)
          setWorld(world)
          console.log('Loaded world from localStorage:', world)
        } catch (error) {
          console.error('Failed to parse saved world:', error)
          const initialWorld = createInitialWorldSlice()
          initialWorld.world_id = worldId
          setWorld(initialWorld)
        }
      } else {
        const initialWorld = createInitialWorldSlice()
        initialWorld.world_id = worldId
        setWorld(initialWorld)
      }
    }
  }, [worldId, worldRecord])

  const handleAdvanceTime = async () => {
    if (!world || advancing) return

    setAdvancing(true)
    try {
      console.log('Advancing time...')
      const directorRegistry = {
        runAll: async () => []
      }

      const nextWorld = await runWorldTick(world, { directorRegistry })

      localStorage.setItem(`world_${worldId}`, JSON.stringify(nextWorld))

      setWorld(nextWorld)
      console.log('Time advanced to tick', nextWorld.tick)
    } catch (error) {
      console.error('Failed to advance time:', error)
      alert('Failed to advance time: ' + (error as Error).message)
      setAutoAdvancing(false)
    } finally {
      setAdvancing(false)
    }
  }

  React.useEffect(() => {
    if (!autoAdvancing || !world || world.agents.npcs.length === 0) return

    let ticksAdvanced = 0
    const advanceNextTick = async () => {
      if (ticksAdvanced >= autoAdvanceTicks) {
        setAutoAdvancing(false)
        return
      }

      await handleAdvanceTime()
      ticksAdvanced++

      if (ticksAdvanced < autoAdvanceTicks && autoAdvancing) {
        setTimeout(advanceNextTick, 500)
      }
    }

    advanceNextTick()

    return () => {
      ticksAdvanced = autoAdvanceTicks
    }
  }, [autoAdvancing])

  const toggleAutoAdvance = () => {
    setAutoAdvancing(!autoAdvancing)
  }

  // --- Loading / Not Found states ---

  if (!worldRecord) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-200">
            {worldRecord === undefined ? 'Loading world...' : 'World not found'}
          </h1>
          {worldRecord === null && (
            <p className="mt-2 text-sm text-slate-500">
              The world you are looking for does not exist.
            </p>
          )}
        </div>
      </main>
    )
  }

  if (!world) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-200">Loading world...</h1>
        </div>
      </main>
    )
  }

  // --- Main render ---

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-slate-200">
      {/* ===== Header / Top Bar ===== */}
      <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-white/[0.03] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: back + title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/worlds')}
                className="flex items-center justify-center rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-white/[0.06] hover:text-slate-200 cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="h-6 w-px bg-white/[0.08]" />

              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-slate-100">
                  World Slice
                </h1>
                <p className="truncate text-xs text-slate-500 max-w-[260px]">
                  {worldRecord.worldPrompt}
                </p>
              </div>
            </div>

            {/* Right: tick controls */}
            <div className="flex items-center gap-2">
              {/* Tick badge */}
              <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-400">Tick</span>
                <span className="min-w-[1.5rem] text-center text-sm font-bold text-slate-100">
                  {world?.tick || 0}
                </span>
              </div>

              {/* Auto-advance tick count */}
              <div className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={autoAdvanceTicks}
                  onChange={(e) => setAutoAdvanceTicks(Math.max(1, parseInt(e.target.value) || 10))}
                  className="w-10 rounded bg-transparent px-1 py-0.5 text-xs text-center text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  disabled={autoAdvancing}
                />
                <span className="text-xs text-slate-500 hidden sm:inline">ticks</span>
              </div>

              {/* Auto-advance toggle */}
              <button
                onClick={toggleAutoAdvance}
                disabled={!world || world.agents.npcs.length === 0 || advancing}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                  autoAdvancing
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                }`}
              >
                {autoAdvancing ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{autoAdvancing ? 'Stop' : 'Auto'}</span>
              </button>

              {/* Single tick advance */}
              <button
                onClick={handleAdvanceTime}
                disabled={advancing || !world || world.agents.npcs.length === 0 || autoAdvancing}
                className="flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3.5 py-1.5 text-sm font-medium text-blue-400 transition-all duration-200 hover:bg-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <SkipForward className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{advancing ? 'Running...' : '+1 Tick'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Tick Summary / Chronicle ===== */}
      {world.tick_summary && (
        <div className="mx-auto max-w-7xl px-6 pt-5">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 border-l-2 border-l-blue-500/60">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="text-base font-semibold text-slate-100" style={{ textShadow: '0 0 20px rgba(96,165,250,0.3)' }}>
                Tick {world.tick}
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
            </div>
            <div className="text-base leading-relaxed text-slate-300 whitespace-pre-line">
              {world.tick_summary}
            </div>
          </div>
        </div>
      )}

      {/* ===== Main Content ===== */}
      <div className="mx-auto max-w-7xl p-6">
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Chat column */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03]">
              <ChatShell world={world} onWorldUpdate={setWorld} />
            </div>
          </div>

          {/* Tabs column */}
          <div className="lg:col-span-7">
            {/* Tab Navigation */}
            <div className="mb-4 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 cursor-pointer ${
                    activeTab === key
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                  }`}
                  onClick={() => setActiveTab(key)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03]">
              {activeTab === 'world' && <PanelShell world={world} />}
              {activeTab === 'observer' && <AgentObserverPanel world={world} />}
              {activeTab === 'agents' && (
                <AgentGeneratorPanel
                  worldId={worldId}
                  world={world}
                  onWorldUpdate={setWorld}
                />
              )}
              {activeTab === 'narratives' && <NarrativePanel world={world} />}
              {activeTab === 'social' && <SocialNetworkPanel world={world} />}
              {activeTab === 'timeline' && <NarrativeTimelinePanel world={world} />}
              {activeTab === 'houtu' && <HoutuPanel world={world} />}
              {activeTab === 'events' && <EventsPanel world={world} />}
              {activeTab === 'stats' && <SystemStatsPanel world={world} />}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
