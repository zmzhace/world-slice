'use client'

import type { WorldSlice } from '@/domain/world'
import type { NarrativePattern, StoryArc } from '@/domain/narrative'
import {
  Flame,
  BookOpen,
  Library,
  CheckCircle2,
  FileText,
  Swords,
  Handshake,
  Heart,
  Crosshair,
  Search,
  RefreshCw,
  Compass,
  HelpCircle,
  CloudRain,
  Trophy,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NarrativePanelProps = {
  world: WorldSlice
}

export function NarrativePanel({ world }: NarrativePanelProps) {
  const { narratives } = world

  // 按状态分组叙事模式
  const activePatterns = narratives.patterns.filter(p =>
    p.status === 'developing' || p.status === 'climax'
  )
  const concludedPatterns = narratives.patterns.filter(p => p.status === 'concluded')

  // 主线和支线故事弧
  const mainArcs = narratives.arcs.filter(a => a.type === 'main')
  const subplotArcs = narratives.arcs.filter(a => a.type === 'subplot')

  return (
    <div className="space-y-6 p-4">
      {/* 统计信息 */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Active Narratives"
          value={narratives.stats.active_patterns}
          total={narratives.stats.total_patterns}
        />
        <StatCard
          label="Story Arcs"
          value={narratives.stats.completed_arcs}
          total={narratives.stats.total_arcs}
        />
      </div>

      {/* 活跃的叙事模式 */}
      <section>
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-100 mb-3">
          <Flame className="h-4 w-4 text-orange-400" />
          Active Narratives
        </h3>
        {activePatterns.length === 0 ? (
          <p className="text-sm text-slate-500">No active narratives</p>
        ) : (
          <div className="space-y-3">
            {activePatterns.map(pattern => (
              <NarrativeCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        )}
      </section>

      {/* 主线故事弧 */}
      {mainArcs.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-100 mb-3">
            <BookOpen className="h-4 w-4 text-blue-400" />
            Main Arcs
          </h3>
          <div className="space-y-3">
            {mainArcs.map(arc => (
              <StoryArcCard key={arc.id} arc={arc} />
            ))}
          </div>
        </section>
      )}

      {/* 支线故事弧 */}
      {subplotArcs.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-100 mb-3">
            <Library className="h-4 w-4 text-violet-400" />
            Subplots
          </h3>
          <div className="space-y-3">
            {subplotArcs.map(arc => (
              <StoryArcCard key={arc.id} arc={arc} />
            ))}
          </div>
        </section>
      )}

      {/* 已完结的叙事 */}
      {concludedPatterns.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-100 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Concluded
          </h3>
          <div className="space-y-2">
            {concludedPatterns.slice(-5).map(pattern => {
              const Icon = getNarrativeTypeIcon(pattern.type)
              return (
                <div key={pattern.id} className="flex items-center gap-2 text-sm text-slate-400">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{formatParticipants(pattern.participants)}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 叙事总结 */}
      {narratives.summaries.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-100 mb-3">
            <FileText className="h-4 w-4 text-slate-400" />
            Summaries
          </h3>
          <div className="space-y-3">
            {narratives.summaries.slice(-3).map(summary => (
              <SummaryCard key={summary.id} summary={summary} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// 统计卡片
function StatCard({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-100">
        {value}
        <span className="text-sm font-normal text-slate-500"> / {total}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/[0.06]">
        <div
          className="h-1.5 rounded-full bg-blue-500/80 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// 叙事模式卡片
function NarrativeCard({ pattern }: { pattern: NarrativePattern }) {
  const Icon = getNarrativeTypeIcon(pattern.type)
  const statusStyle = getStatusStyle(pattern.status)
  const typeColor = getNarrativeTypeColor(pattern.type)
  const intensityBar = Math.round(pattern.intensity * 10)

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center justify-center rounded-lg p-1.5 ${typeColor.bg}`}>
            <Icon className={`h-4 w-4 ${typeColor.icon}`} />
          </div>
          <div>
            <div className="font-semibold text-sm text-slate-100">{getNarrativeTypeName(pattern.type)}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {pattern.participants.map(p => (
                <span key={p} className="inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-slate-400">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyle}`}>
          {getStatusName(pattern.status)}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-500">Intensity</span>
          <span className="font-medium text-slate-300">{Math.round(pattern.intensity * 100)}%</span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < intensityBar ? 'bg-red-500/80' : 'bg-white/[0.06]'
              }`}
            />
          ))}
        </div>
      </div>

      {pattern.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {pattern.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs bg-white/[0.06] text-slate-400 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// 故事弧卡片
function StoryArcCard({ arc }: { arc: StoryArc }) {
  const completenessPercentage = Math.round(arc.completeness * 100)

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-base text-slate-100">{arc.title}</h4>
          <div className="text-xs text-slate-400 mt-1">
            Protagonists: {arc.protagonists.join(', ')}
          </div>
          {arc.antagonists.length > 0 && (
            <div className="text-xs text-slate-500">
              Antagonists: {arc.antagonists.join(', ')}
            </div>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusStyle(arc.status)}`}>
          {getStatusName(arc.status)}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Stage</span>
          <span className="font-medium text-slate-300">{getStageName(arc.current_stage)}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Completeness</span>
          <span className="font-medium text-slate-300">{completenessPercentage}%</span>
        </div>

        <div className="h-1.5 rounded-full bg-white/[0.06]">
          <div
            className="h-1.5 rounded-full bg-blue-500/80 transition-all"
            style={{ width: `${completenessPercentage}%` }}
          />
        </div>
      </div>

      {/* 故事结构概览 */}
      <div className="mt-3 grid grid-cols-5 gap-1">
        {(['setup', 'rising', 'climax', 'falling', 'resolution'] as const).map(stage => {
          const count = arc.structure[stage].length
          const isCurrent = arc.current_stage === stage
          return (
            <div
              key={stage}
              className={`text-center p-1.5 rounded-lg text-xs ${
                isCurrent ? 'bg-blue-500/30 text-blue-300 font-bold ring-1 ring-blue-500/40' :
                count > 0 ? 'bg-white/[0.06] text-slate-400' : 'bg-white/[0.03] text-slate-600'
              }`}
            >
              {getStageName(stage)}
              <div className="text-[10px] mt-0.5 opacity-70">{count}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 总结卡片
function SummaryCard({ summary }: { summary: any }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <h4 className="font-semibold text-sm text-slate-200 mb-2">{summary.title}</h4>
      <p className="text-sm text-slate-400 line-clamp-3">{summary.content}</p>
      <div className="mt-2 text-xs text-slate-600">
        Tick {summary.tick_range[0]} - {summary.tick_range[1]} · {summary.word_count} words
      </div>
    </div>
  )
}

// 辅助函数
function getNarrativeTypeIcon(type: NarrativePattern['type']): LucideIcon {
  const icons: Record<string, LucideIcon> = {
    conflict: Swords,
    alliance: Handshake,
    romance: Heart,
    betrayal: Crosshair,
    discovery: Search,
    transformation: RefreshCw,
    quest: Compass,
    mystery: HelpCircle,
    tragedy: CloudRain,
    triumph: Trophy,
  }
  return icons[type] || BookOpen
}

function getNarrativeTypeColor(type: NarrativePattern['type']): { bg: string; icon: string } {
  const colors: Record<string, { bg: string; icon: string }> = {
    conflict: { bg: 'bg-red-500/10', icon: 'text-red-400' },
    alliance: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400' },
    romance: { bg: 'bg-pink-500/10', icon: 'text-pink-400' },
    betrayal: { bg: 'bg-amber-500/10', icon: 'text-amber-400' },
    discovery: { bg: 'bg-cyan-500/10', icon: 'text-cyan-400' },
    transformation: { bg: 'bg-violet-500/10', icon: 'text-violet-400' },
    quest: { bg: 'bg-orange-500/10', icon: 'text-orange-400' },
    mystery: { bg: 'bg-indigo-500/10', icon: 'text-indigo-400' },
    tragedy: { bg: 'bg-slate-500/10', icon: 'text-slate-400' },
    triumph: { bg: 'bg-yellow-500/10', icon: 'text-yellow-400' },
  }
  return colors[type] || { bg: 'bg-white/[0.06]', icon: 'text-slate-400' }
}

function getNarrativeTypeName(type: NarrativePattern['type']): string {
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
  return names[type] || 'Story'
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

function formatParticipants(participants: string[]): string {
  if (participants.length === 0) return 'No participants'
  if (participants.length === 1) return participants[0]
  if (participants.length === 2) return participants.join(' & ')
  return `${participants.slice(0, 2).join(', ')} +${participants.length - 2}`
}
