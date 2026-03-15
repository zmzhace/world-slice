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

  const activePatterns = narratives.patterns.filter(p =>
    p.status === 'developing' || p.status === 'climax'
  )
  const concludedPatterns = narratives.patterns.filter(p => p.status === 'concluded')

  const mainArcs = narratives.arcs.filter(a => a.type === 'main')
  const subplotArcs = narratives.arcs.filter(a => a.type === 'subplot')

  return (
    <div className="space-y-6 p-4">
      {/* Stats */}
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

      {/* Active narratives */}
      <section>
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-3">
          <Flame className="h-4 w-4 text-orange-500" />
          Active Narratives
        </h3>
        {activePatterns.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 font-medium">No narratives yet</p>
            <p className="mt-1 text-xs text-slate-400">Advance a few ticks — stories emerge from agent interactions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activePatterns.map(pattern => (
              <NarrativeCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        )}
      </section>

      {/* Main arcs */}
      {mainArcs.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-3">
            <BookOpen className="h-4 w-4 text-blue-500" />
            Main Arcs
          </h3>
          <div className="space-y-3">
            {mainArcs.map(arc => (
              <StoryArcCard key={arc.id} arc={arc} />
            ))}
          </div>
        </section>
      )}

      {/* Subplots */}
      {subplotArcs.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-3">
            <Library className="h-4 w-4 text-violet-500" />
            Subplots
          </h3>
          <div className="space-y-3">
            {subplotArcs.map(arc => (
              <StoryArcCard key={arc.id} arc={arc} />
            ))}
          </div>
        </section>
      )}

      {/* Concluded */}
      {concludedPatterns.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Concluded
          </h3>
          <div className="space-y-2">
            {concludedPatterns.slice(-5).map(pattern => {
              const Icon = getNarrativeTypeIcon(pattern.type)
              return (
                <div key={pattern.id} className="flex items-center gap-2 text-sm text-slate-500">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{formatParticipants(pattern.participants)}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Summaries */}
      {narratives.summaries.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-3">
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

// Stat card
function StatCard({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-800">
        {value}
        <span className="text-sm font-normal text-slate-400"> / {total}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-100">
        <div
          className="h-1.5 rounded-full bg-blue-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Narrative card
function NarrativeCard({ pattern }: { pattern: NarrativePattern }) {
  const Icon = getNarrativeTypeIcon(pattern.type)
  const statusStyle = getStatusStyle(pattern.status)
  const typeColor = getNarrativeTypeColor(pattern.type)
  const intensityBar = Math.round(pattern.intensity * 10)

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 transition-colors hover:bg-slate-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center justify-center rounded-lg p-1.5 ${typeColor.bg}`}>
            <Icon className={`h-4 w-4 ${typeColor.icon}`} />
          </div>
          <div>
            <div className="font-semibold text-sm text-slate-800">{getNarrativeTypeName(pattern.type)}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {pattern.participants.map(p => (
                <span key={p} className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
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
          <span className="font-medium text-slate-700">{Math.round(pattern.intensity * 100)}%</span>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i < intensityBar ? 'bg-red-500' : 'bg-slate-100'
              }`}
            />
          ))}
        </div>
      </div>

      {pattern.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {pattern.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Story arc card
function StoryArcCard({ arc }: { arc: StoryArc }) {
  const completenessPercentage = Math.round(arc.completeness * 100)

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-base text-slate-800">{arc.title}</h4>
          <div className="text-xs text-slate-500 mt-1">
            Protagonists: {arc.protagonists.join(', ')}
          </div>
          {arc.antagonists.length > 0 && (
            <div className="text-xs text-slate-400">
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
          <span className="font-medium text-slate-700">{getStageName(arc.current_stage)}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Completeness</span>
          <span className="font-medium text-slate-700">{completenessPercentage}%</span>
        </div>

        <div className="h-1.5 rounded-full bg-blue-100">
          <div
            className="h-1.5 rounded-full bg-blue-500 transition-all"
            style={{ width: `${completenessPercentage}%` }}
          />
        </div>
      </div>

      {/* Story structure overview */}
      <div className="mt-3 grid grid-cols-5 gap-1">
        {(['setup', 'rising', 'climax', 'falling', 'resolution'] as const).map(stage => {
          const count = arc.structure[stage].length
          const isCurrent = arc.current_stage === stage
          return (
            <div
              key={stage}
              className={`text-center p-1.5 rounded-lg text-xs ${
                isCurrent ? 'bg-blue-500 text-white font-bold ring-1 ring-blue-500' :
                count > 0 ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'
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

// Summary card
function SummaryCard({ summary }: { summary: any }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <h4 className="font-semibold text-sm text-slate-700 mb-2">{summary.title}</h4>
      <p className="text-sm text-slate-500 line-clamp-3">{summary.content}</p>
      <div className="mt-2 text-xs text-slate-400">
        Tick {summary.tick_range[0]} - {summary.tick_range[1]} · {summary.word_count} words
      </div>
    </div>
  )
}

// Helper functions
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
    conflict: { bg: 'bg-red-50', icon: 'text-red-500' },
    alliance: { bg: 'bg-emerald-50', icon: 'text-emerald-500' },
    romance: { bg: 'bg-pink-50', icon: 'text-pink-500' },
    betrayal: { bg: 'bg-amber-50', icon: 'text-amber-500' },
    discovery: { bg: 'bg-cyan-50', icon: 'text-cyan-500' },
    transformation: { bg: 'bg-violet-50', icon: 'text-violet-500' },
    quest: { bg: 'bg-orange-50', icon: 'text-orange-500' },
    mystery: { bg: 'bg-indigo-50', icon: 'text-indigo-500' },
    tragedy: { bg: 'bg-slate-100', icon: 'text-slate-500' },
    triumph: { bg: 'bg-yellow-50', icon: 'text-yellow-500' },
  }
  return colors[type] || { bg: 'bg-slate-100', icon: 'text-slate-500' }
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

function formatParticipants(participants: string[]): string {
  if (participants.length === 0) return 'No participants'
  if (participants.length === 1) return participants[0]
  if (participants.length === 2) return participants.join(' & ')
  return `${participants.slice(0, 2).join(', ')} +${participants.length - 2}`
}
