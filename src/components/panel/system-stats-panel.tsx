'use client'

import React from 'react'
import type { WorldSlice } from '@/domain/world'
import { createTimeEngine } from '@/engine/time-engine'
import { createKnowledgeGraph } from '@/engine/knowledge-graph'
import {
  Clock,
  GitBranch,
  Crosshair,
  Zap,
  User,
  Calendar,
  MapPin,
  Building,
  Lightbulb,
  Activity,
  Database,
  TrendingUp,
  BarChart3,
} from 'lucide-react'

type SystemStatsPanelProps = {
  world: WorldSlice
}

export function SystemStatsPanel({ world }: SystemStatsPanelProps) {
  const [stats, setStats] = React.useState<{
    timeEngine: {
      total: number
      active: number
      sleeping: number
      activityRate: number
    }
    knowledgeGraph: {
      totalNodes: number
      totalEdges: number
      nodesByType: Record<string, number>
      avgDegree: number
    }
  } | null>(null)

  React.useEffect(() => {
    const timeEngine = createTimeEngine()
    const knowledgeGraph = createKnowledgeGraph(world)

    setStats({
      timeEngine: timeEngine.getActivityStats(world),
      knowledgeGraph: knowledgeGraph.getStats(),
    })
  }, [world.tick])

  if (!stats) {
    return <div className="text-sm text-slate-500 p-4">Loading...</div>
  }

  const currentHour = new Date(world.time).getHours()

  const nodeTypeIcons: Record<string, { icon: typeof User; label: string }> = {
    agent: { icon: User, label: 'Agents' },
    event: { icon: Zap, label: 'Events' },
    location: { icon: MapPin, label: 'Locations' },
    organization: { icon: Building, label: 'Organizations' },
    concept: { icon: Lightbulb, label: 'Concepts' },
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800">System Stats</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time simulation status
        </p>
      </div>

      {/* Time engine stats */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h3 className="flex items-center gap-2 mb-3 font-semibold text-sm text-slate-700">
          <Clock className="h-4 w-4 text-blue-500" />
          Time Engine
        </h3>
        <div className="space-y-2.5 text-xs">
          <StatRow
            label="Current Time"
            value={
              new Date(world.time).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })
            }
            accent="blue"
          />
          <StatRow
            label="Active Agents"
            value={`${stats.timeEngine.active} / ${stats.timeEngine.total}`}
            accent="blue"
          />
          <StatRow
            label="Activity Rate"
            value={`${(stats.timeEngine.activityRate * 100).toFixed(1)}%`}
            accent="amber"
          />
          <StatRow
            label="Sleeping Agents"
            value={String(stats.timeEngine.sleeping)}
            accent="blue"
          />

          {/* Activity bar */}
          <div className="mt-3 pt-2 border-t border-blue-100">
            <div className="mb-1.5 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">Activity Distribution</span>
              <span className="text-slate-400 tabular-nums">{currentHour}:00</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-blue-100">
              <div
                className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${stats.timeEngine.activityRate * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge graph stats */}
      <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
        <h3 className="flex items-center gap-2 mb-3 font-semibold text-sm text-slate-700">
          <GitBranch className="h-4 w-4 text-violet-500" />
          Knowledge Graph
        </h3>
        <div className="space-y-2.5 text-xs">
          <StatRow
            label="Total Nodes"
            value={String(stats.knowledgeGraph.totalNodes)}
            accent="blue"
          />
          <StatRow
            label="Total Edges"
            value={String(stats.knowledgeGraph.totalEdges)}
            accent="blue"
          />
          <StatRow
            label="Avg Degree"
            value={stats.knowledgeGraph.avgDegree.toFixed(2)}
            accent="amber"
          />

          {/* Node type distribution */}
          <div className="mt-3 pt-2 border-t border-violet-100 space-y-1.5">
            <div className="text-[10px] text-slate-500">Node Type Distribution</div>
            {Object.entries(stats.knowledgeGraph.nodesByType).map(([type, count]) => {
              const config = nodeTypeIcons[type]
              const Icon = config?.icon || Database
              const label = config?.label || type
              return (
                <div key={type} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Icon className="h-3 w-3 text-violet-500" />
                    {label}
                  </span>
                  <span className="font-medium text-slate-700 tabular-nums">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recommendation system */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <h3 className="flex items-center gap-2 mb-3 font-semibold text-sm text-slate-700">
          <Crosshair className="h-4 w-4 text-emerald-500" />
          Recommendation System
        </h3>
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Status</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
              <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
              Running
            </span>
          </div>
          <StatRow
            label="Recommendable Events"
            value={String(world.events.filter(e => !['tick'].includes(e.type)).length)}
            accent="blue"
          />
          <div className="mt-2 text-[10px] text-slate-500 leading-relaxed">
            Recommends content based on agent interests, social network, and event popularity.
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
        <h3 className="flex items-center gap-2 mb-3 font-semibold text-sm text-slate-700">
          <Activity className="h-4 w-4 text-slate-400" />
          Performance
        </h3>
        <div className="space-y-2.5 text-xs">
          <StatRow
            label="Current Tick"
            value={String(world.tick)}
            accent="blue"
          />
          <StatRow
            label="Total Events"
            value={String(world.events.length)}
            accent="blue"
          />
          <StatRow
            label="Active Narratives"
            value={String(world.narratives.stats.active_patterns)}
            accent="blue"
          />
          <StatRow
            label="Story Arcs"
            value={String(world.narratives.stats.total_arcs)}
            accent="blue"
          />
        </div>
      </div>
    </div>
  )
}

function StatRow({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: 'blue' | 'amber'
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium tabular-nums ${
        accent === 'amber' ? 'text-amber-600' : 'text-blue-600'
      }`}>
        {value}
      </span>
    </div>
  )
}
