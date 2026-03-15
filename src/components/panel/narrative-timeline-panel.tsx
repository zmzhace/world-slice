'use client'

import React from 'react'
import type { WorldSlice } from '@/domain/world'
import type { NarrativePattern, StoryArc } from '@/domain/narrative'
import {
  Sprout,
  RefreshCw,
  CheckCircle2,
  MapPin,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  SmilePlus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NarrativeTimelinePanelProps = {
  world: WorldSlice
}

type TimelineEvent = {
  tick: number
  type: 'narrative_start' | 'narrative_update' | 'narrative_end' | 'arc_milestone'
  narrative?: NarrativePattern
  arc?: StoryArc
  description: string
  sentiment: number
}

export function NarrativeTimelinePanel({ world }: NarrativeTimelinePanelProps) {
  const [selectedNarrative, setSelectedNarrative] = React.useState<string | null>(null)
  const [viewMode, setViewMode] = React.useState<'all' | 'patterns' | 'arcs'>('all')

  const timelineEvents = React.useMemo(() => {
    return buildTimelineEvents(world, viewMode)
  }, [world, viewMode])

  const selectedPattern = selectedNarrative
    ? world.narratives.patterns.find(p => p.id === selectedNarrative)
    : null

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">Narrative Timeline</h3>

        {/* View toggle */}
        <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
          {(['all', 'patterns', 'arcs'] as const).map(mode => (
            <button
              key={mode}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                viewMode === mode
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => setViewMode(mode)}
            >
              {mode === 'all' ? 'All' : mode === 'patterns' ? 'Patterns' : 'Arcs'}
            </button>
          ))}
        </div>
      </div>

      {/* Emotional curve chart */}
      <EmotionalCurveChart events={timelineEvents} />

      {/* Timeline */}
      <div className="relative">
        {/* Axis */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-200" />

        {/* Event list */}
        <div className="space-y-4">
          {timelineEvents.map((event, idx) => (
            <TimelineEventCard
              key={idx}
              event={event}
              isSelected={event.narrative?.id === selectedNarrative}
              onClick={() => {
                if (event.narrative) {
                  setSelectedNarrative(
                    event.narrative.id === selectedNarrative ? null : event.narrative.id
                  )
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selectedPattern && (
        <NarrativeDetailPanel
          pattern={selectedPattern}
          world={world}
          onClose={() => setSelectedNarrative(null)}
        />
      )}
    </div>
  )
}

function buildTimelineEvents(
  world: WorldSlice,
  viewMode: 'all' | 'patterns' | 'arcs'
): TimelineEvent[] {
  const events: TimelineEvent[] = []

  if (viewMode === 'all' || viewMode === 'patterns') {
    for (const pattern of world.narratives.patterns) {
      events.push({
        tick: pattern.started_at,
        type: 'narrative_start',
        narrative: pattern,
        description: `${getNarrativeTypeName(pattern.type)} started`,
        sentiment: pattern.sentiment
      })

      for (const turningPoint of pattern.turning_points) {
        const event = world.events.find(e => e.id === turningPoint)
        if (event) {
          events.push({
            tick: pattern.updated_at,
            type: 'narrative_update',
            narrative: pattern,
            description: `${getNarrativeTypeName(pattern.type)} turning point`,
            sentiment: pattern.sentiment
          })
        }
      }

      if (pattern.status === 'concluded' && pattern.resolution) {
        events.push({
          tick: pattern.updated_at,
          type: 'narrative_end',
          narrative: pattern,
          description: `${getNarrativeTypeName(pattern.type)} concluded`,
          sentiment: pattern.sentiment
        })
      }
    }
  }

  if (viewMode === 'all' || viewMode === 'arcs') {
    for (const arc of world.narratives.arcs) {
      const stages = ['setup', 'rising', 'climax', 'falling', 'resolution'] as const
      for (const stage of stages) {
        if (arc.structure[stage].length > 0) {
          const firstPattern = arc.structure[stage][0]
          events.push({
            tick: firstPattern.started_at,
            type: 'arc_milestone',
            arc,
            description: `${arc.title} - ${getStageName(stage)}`,
            sentiment: arc.emotional_curve[0] || 0
          })
        }
      }
    }
  }

  return events.sort((a, b) => a.tick - b.tick)
}

function TimelineEventCard({
  event,
  isSelected,
  onClick
}: {
  event: TimelineEvent
  isSelected: boolean
  onClick: () => void
}) {
  const typeConfig: Record<TimelineEvent['type'], { icon: LucideIcon; dot: string; card: string }> = {
    narrative_start: {
      icon: Sprout,
      dot: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
      card: 'border-emerald-200 bg-emerald-50',
    },
    narrative_update: {
      icon: RefreshCw,
      dot: 'bg-blue-50 text-blue-600 ring-blue-200',
      card: 'border-blue-200 bg-blue-50',
    },
    narrative_end: {
      icon: CheckCircle2,
      dot: 'bg-slate-100 text-slate-500 ring-slate-200',
      card: 'border-slate-200 bg-slate-50',
    },
    arc_milestone: {
      icon: MapPin,
      dot: 'bg-violet-50 text-violet-600 ring-violet-200',
      card: 'border-violet-200 bg-violet-50',
    },
  }

  const config = typeConfig[event.type]
  const Icon = config.icon

  return (
    <div
      className={`relative pl-16 cursor-pointer transition-all ${
        isSelected ? 'scale-[1.02]' : ''
      }`}
      onClick={onClick}
    >
      {/* Dot */}
      <div className={`absolute left-5 top-3 flex h-7 w-7 items-center justify-center rounded-full ring-1 ${config.dot}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>

      {/* Card */}
      <div
        className={`rounded-xl border p-3 transition-all ${config.card} ${
          isSelected ? 'ring-2 ring-blue-400' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold text-sm text-slate-700">{event.description}</div>
            <div className="text-xs text-slate-500 mt-1">Tick {event.tick}</div>
            {event.narrative && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {event.narrative.participants.slice(0, 3).map(p => (
                  <span key={p} className="inline-flex items-center rounded-full bg-white/80 border border-slate-200 px-2 py-0.5 text-xs text-slate-500">
                    {p}
                  </span>
                ))}
                {event.narrative.participants.length > 3 && (
                  <span className="text-xs text-slate-400">
                    +{event.narrative.participants.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Sentiment indicator */}
          <div className="flex items-center gap-2">
            <SentimentIndicator sentiment={event.sentiment} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Emotional curve chart
function EmotionalCurveChart({ events }: { events: TimelineEvent[] }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    if (!canvasRef.current || events.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = 150

    drawEmotionalCurve(ctx, events, canvas.width, canvas.height)
  }, [events])

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="text-xs font-semibold text-slate-500 mb-2">Emotional Curve</div>
      <canvas ref={canvasRef} className="w-full" style={{ height: '150px' }} />
    </div>
  )
}

function drawEmotionalCurve(
  ctx: CanvasRenderingContext2D,
  events: TimelineEvent[],
  width: number,
  height: number
) {
  if (events.length === 0) return

  ctx.clearRect(0, 0, width, height)

  const padding = 20
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  // Y axis
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding, padding)
  ctx.lineTo(padding, height - padding)
  ctx.stroke()

  // X axis (zero line)
  ctx.beginPath()
  ctx.moveTo(padding, height / 2)
  ctx.lineTo(width - padding, height / 2)
  ctx.stroke()

  if (events.length < 2) return

  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.beginPath()

  const minTick = events[0].tick
  const maxTick = events[events.length - 1].tick
  const tickRange = maxTick - minTick || 1

  events.forEach((event, i) => {
    const x = padding + ((event.tick - minTick) / tickRange) * chartWidth
    const y = height / 2 - (event.sentiment * chartHeight / 2)

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()

  // Data points
  events.forEach(event => {
    const x = padding + ((event.tick - minTick) / tickRange) * chartWidth
    const y = height / 2 - (event.sentiment * chartHeight / 2)

    ctx.beginPath()
    ctx.arc(x, y, 4, 0, 2 * Math.PI)
    ctx.fillStyle = event.sentiment > 0 ? '#10b981' : event.sentiment < 0 ? '#ef4444' : '#94a3b8'
    ctx.fill()
  })
}

// Sentiment indicator
function SentimentIndicator({ sentiment }: { sentiment: number }) {
  const getIcon = (): LucideIcon => {
    if (sentiment > 0.3) return TrendingUp
    if (sentiment < -0.3) return TrendingDown
    return Minus
  }

  const getColor = () => {
    if (sentiment > 0.5) return 'text-emerald-500'
    if (sentiment > 0) return 'text-emerald-500'
    if (sentiment > -0.5) return 'text-red-500'
    return 'text-red-500'
  }

  const getDotColor = () => {
    if (sentiment > 0.5) return 'bg-emerald-500'
    if (sentiment > 0) return 'bg-emerald-400'
    if (sentiment > -0.5) return 'bg-red-400'
    return 'bg-red-500'
  }

  const Icon = getIcon()

  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`h-3.5 w-3.5 ${getColor()}`} />
      <div className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
    </div>
  )
}

// Narrative detail panel (modal)
function NarrativeDetailPanel({
  pattern,
  world,
  onClose
}: {
  pattern: NarrativePattern
  world: WorldSlice
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
        <div className="flex items-start justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800">{getNarrativeTypeName(pattern.type)}</h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <DetailRow label="Participants">
            <div className="flex flex-wrap gap-1 mt-1">
              {pattern.participants.map(p => (
                <span key={p} className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
                  {p}
                </span>
              ))}
            </div>
          </DetailRow>

          <DetailRow label="Status">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(pattern.status)}`}>
              {getStatusName(pattern.status)}
            </span>
          </DetailRow>

          <DetailRow label="Intensity">
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                <div
                  className="h-1.5 rounded-full bg-blue-500"
                  style={{ width: `${pattern.intensity * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-700 tabular-nums">{Math.round(pattern.intensity * 100)}%</span>
            </div>
          </DetailRow>

          <DetailRow label="Sentiment">
            <span className="text-sm text-slate-700">
              {pattern.sentiment > 0 ? 'Positive' : pattern.sentiment < 0 ? 'Negative' : 'Neutral'}
              <span className="text-slate-400 ml-1">({pattern.sentiment.toFixed(2)})</span>
            </span>
          </DetailRow>

          <DetailRow label="Time Range">
            <span className="text-sm text-slate-700">
              Tick {pattern.started_at} - {pattern.updated_at}
              <span className="text-slate-400 ml-1">({pattern.updated_at - pattern.started_at} ticks)</span>
            </span>
          </DetailRow>

          {pattern.tags.length > 0 && (
            <DetailRow label="Tags">
              <div className="flex flex-wrap gap-1 mt-1">
                {pattern.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-500">
                    {tag}
                  </span>
                ))}
              </div>
            </DetailRow>
          )}

          {pattern.turning_points.length > 0 && (
            <DetailRow label="Turning Points">
              <span className="text-sm text-slate-700">
                {pattern.turning_points.length} key events
              </span>
            </DetailRow>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
      <div>{children}</div>
    </div>
  )
}

// Helper functions
function getNarrativeTypeName(type: string): string {
  const names: Record<string, string> = {
    conflict: 'Conflict',
    alliance: 'Alliance',
    romance: 'Romance',
    betrayal: 'Betrayal',
    discovery: 'Discovery',
    transformation: 'Transformation',
    quest: 'Quest',
    mystery: 'Mystery',
    tragedy: 'Tragedy',
    triumph: 'Triumph'
  }
  return names[type] || type
}

function getStatusStyle(status: string): string {
  const styles: Record<string, string> = {
    emerging: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    developing: 'bg-blue-50 text-blue-600 border border-blue-200',
    climax: 'bg-red-50 text-red-600 border border-red-200',
    resolving: 'bg-amber-50 text-amber-600 border border-amber-200',
    concluded: 'bg-slate-100 text-slate-500 border border-slate-200',
    dormant: 'bg-slate-50 text-slate-400 border border-slate-200',
  }
  return styles[status] || 'bg-slate-100 text-slate-500 border border-slate-200'
}

function getStatusName(status: string): string {
  const names: Record<string, string> = {
    emerging: 'Emerging',
    developing: 'Developing',
    climax: 'Climax',
    resolving: 'Resolving',
    concluded: 'Concluded',
    dormant: 'Dormant'
  }
  return names[status] || status
}

function getStageName(stage: string): string {
  const names: Record<string, string> = {
    setup: 'Setup',
    rising: 'Rising',
    climax: 'Climax',
    falling: 'Falling',
    resolution: 'Resolve'
  }
  return names[stage] || stage
}
