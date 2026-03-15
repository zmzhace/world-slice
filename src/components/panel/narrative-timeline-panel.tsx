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

  // 构建时间线事件
  const timelineEvents = React.useMemo(() => {
    return buildTimelineEvents(world, viewMode)
  }, [world, viewMode])

  // 获取选中的叙事
  const selectedPattern = selectedNarrative
    ? world.narratives.patterns.find(p => p.id === selectedNarrative)
    : null

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-100">Narrative Timeline</h3>

        {/* 视图切换 */}
        <div className="flex gap-1 rounded-lg bg-white/[0.03] p-0.5">
          {(['all', 'patterns', 'arcs'] as const).map(mode => (
            <button
              key={mode}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                viewMode === mode
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
              }`}
              onClick={() => setViewMode(mode)}
            >
              {mode === 'all' ? 'All' : mode === 'patterns' ? 'Patterns' : 'Arcs'}
            </button>
          ))}
        </div>
      </div>

      {/* 情感曲线图 */}
      <EmotionalCurveChart events={timelineEvents} />

      {/* 时间线 */}
      <div className="relative">
        {/* 时间轴 */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-white/[0.08]" />

        {/* 事件列表 */}
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

      {/* 详情面板 */}
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

// 构建时间线事件
function buildTimelineEvents(
  world: WorldSlice,
  viewMode: 'all' | 'patterns' | 'arcs'
): TimelineEvent[] {
  const events: TimelineEvent[] = []

  // 添加叙事模式事件
  if (viewMode === 'all' || viewMode === 'patterns') {
    for (const pattern of world.narratives.patterns) {
      // 开始事件
      events.push({
        tick: pattern.started_at,
        type: 'narrative_start',
        narrative: pattern,
        description: `${getNarrativeTypeName(pattern.type)} started`,
        sentiment: pattern.sentiment
      })

      // 更新事件（转折点）
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

      // 结束事件
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

  // 添加故事弧事件
  if (viewMode === 'all' || viewMode === 'arcs') {
    for (const arc of world.narratives.arcs) {
      // 故事弧里程碑
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

  // 按时间排序
  return events.sort((a, b) => a.tick - b.tick)
}

// 时间线事件卡片
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
      dot: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30',
      card: 'border-emerald-500/15 bg-emerald-500/[0.04]',
    },
    narrative_update: {
      icon: RefreshCw,
      dot: 'bg-blue-500/20 text-blue-400 ring-blue-500/30',
      card: 'border-blue-500/15 bg-blue-500/[0.04]',
    },
    narrative_end: {
      icon: CheckCircle2,
      dot: 'bg-white/[0.06] text-slate-400 ring-white/[0.08]',
      card: 'border-white/[0.06] bg-white/[0.03]',
    },
    arc_milestone: {
      icon: MapPin,
      dot: 'bg-violet-500/20 text-violet-400 ring-violet-500/30',
      card: 'border-violet-500/15 bg-violet-500/[0.04]',
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
      {/* 时间点 */}
      <div className={`absolute left-5 top-3 flex h-7 w-7 items-center justify-center rounded-full ring-1 ${config.dot}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>

      {/* 事件卡片 */}
      <div
        className={`rounded-xl border p-3 transition-all ${config.card} ${
          isSelected ? 'ring-1 ring-blue-500/40' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold text-sm text-slate-200">{event.description}</div>
            <div className="text-xs text-slate-500 mt-1">Tick {event.tick}</div>
            {event.narrative && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {event.narrative.participants.slice(0, 3).map(p => (
                  <span key={p} className="inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-slate-400">
                    {p}
                  </span>
                ))}
                {event.narrative.participants.length > 3 && (
                  <span className="text-xs text-slate-500">
                    +{event.narrative.participants.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 情感指示器 */}
          <div className="flex items-center gap-2">
            <SentimentIndicator sentiment={event.sentiment} />
          </div>
        </div>
      </div>
    </div>
  )
}

// 情感曲线图
function EmotionalCurveChart({ events }: { events: TimelineEvent[] }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    if (!canvasRef.current || events.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = 150

    // 绘制情感曲线
    drawEmotionalCurve(ctx, events, canvas.width, canvas.height)
  }, [events])

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="text-xs font-semibold text-slate-400 mb-2">Emotional Curve</div>
      <canvas ref={canvasRef} className="w-full" style={{ height: '150px' }} />
    </div>
  )
}

// 绘制情感曲线
function drawEmotionalCurve(
  ctx: CanvasRenderingContext2D,
  events: TimelineEvent[],
  width: number,
  height: number
) {
  if (events.length === 0) return

  ctx.clearRect(0, 0, width, height)

  // 绘制坐标轴
  const padding = 20
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  // Y 轴
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding, padding)
  ctx.lineTo(padding, height - padding)
  ctx.stroke()

  // X 轴（中间零线）
  ctx.beginPath()
  ctx.moveTo(padding, height / 2)
  ctx.lineTo(width - padding, height / 2)
  ctx.stroke()

  // 绘制曲线
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

  // 绘制数据点
  events.forEach(event => {
    const x = padding + ((event.tick - minTick) / tickRange) * chartWidth
    const y = height / 2 - (event.sentiment * chartHeight / 2)

    ctx.beginPath()
    ctx.arc(x, y, 4, 0, 2 * Math.PI)
    ctx.fillStyle = event.sentiment > 0 ? '#10b981' : event.sentiment < 0 ? '#ef4444' : '#6b7280'
    ctx.fill()
  })
}

// 情感指示器
function SentimentIndicator({ sentiment }: { sentiment: number }) {
  const getIcon = (): LucideIcon => {
    if (sentiment > 0.3) return TrendingUp
    if (sentiment < -0.3) return TrendingDown
    return Minus
  }

  const getColor = () => {
    if (sentiment > 0.5) return 'text-emerald-400'
    if (sentiment > 0) return 'text-emerald-500/70'
    if (sentiment > -0.5) return 'text-red-500/70'
    return 'text-red-400'
  }

  const getDotColor = () => {
    if (sentiment > 0.5) return 'bg-emerald-400'
    if (sentiment > 0) return 'bg-emerald-500/70'
    if (sentiment > -0.5) return 'bg-red-500/70'
    return 'bg-red-400'
  }

  const Icon = getIcon()

  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`h-3.5 w-3.5 ${getColor()}`} />
      <div className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
    </div>
  )
}

// 叙事详情面板
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0a0a0f] border border-white/[0.08] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-100">{getNarrativeTypeName(pattern.type)}</h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <DetailRow label="Participants">
            <div className="flex flex-wrap gap-1 mt-1">
              {pattern.participants.map(p => (
                <span key={p} className="inline-flex items-center rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-slate-300">
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
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                <div
                  className="h-1.5 rounded-full bg-blue-500/80"
                  style={{ width: `${pattern.intensity * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-300 tabular-nums">{Math.round(pattern.intensity * 100)}%</span>
            </div>
          </DetailRow>

          <DetailRow label="Sentiment">
            <span className="text-sm text-slate-300">
              {pattern.sentiment > 0 ? 'Positive' : pattern.sentiment < 0 ? 'Negative' : 'Neutral'}
              <span className="text-slate-500 ml-1">({pattern.sentiment.toFixed(2)})</span>
            </span>
          </DetailRow>

          <DetailRow label="Time Range">
            <span className="text-sm text-slate-300">
              Tick {pattern.started_at} - {pattern.updated_at}
              <span className="text-slate-500 ml-1">({pattern.updated_at - pattern.started_at} ticks)</span>
            </span>
          </DetailRow>

          {pattern.tags.length > 0 && (
            <DetailRow label="Tags">
              <div className="flex flex-wrap gap-1 mt-1">
                {pattern.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-white/[0.06] rounded-full text-xs text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </DetailRow>
          )}

          {pattern.turning_points.length > 0 && (
            <DetailRow label="Turning Points">
              <span className="text-sm text-slate-300">
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

// 辅助函数
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
    emerging: 'bg-emerald-500/15 text-emerald-400',
    developing: 'bg-blue-500/15 text-blue-400',
    climax: 'bg-red-500/15 text-red-400',
    resolving: 'bg-amber-500/15 text-amber-400',
    concluded: 'bg-white/[0.06] text-slate-400',
    dormant: 'bg-white/[0.04] text-slate-500',
  }
  return styles[status] || 'bg-white/[0.06] text-slate-400'
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
