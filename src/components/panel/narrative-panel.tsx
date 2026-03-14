'use client'

import type { WorldSlice } from '@/domain/world'
import type { NarrativePattern, StoryArc } from '@/domain/narrative'

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
          label="活跃叙事"
          value={narratives.stats.active_patterns}
          total={narratives.stats.total_patterns}
        />
        <StatCard
          label="故事弧"
          value={narratives.stats.completed_arcs}
          total={narratives.stats.total_arcs}
        />
      </div>
      
      {/* 活跃的叙事模式 */}
      <section>
        <h3 className="text-lg font-semibold mb-3">🔥 活跃叙事</h3>
        {activePatterns.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无活跃叙事</p>
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
          <h3 className="text-lg font-semibold mb-3">📖 主线故事</h3>
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
          <h3 className="text-lg font-semibold mb-3">📚 支线故事</h3>
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
          <h3 className="text-lg font-semibold mb-3">✅ 已完结</h3>
          <div className="space-y-2">
            {concludedPatterns.slice(-5).map(pattern => (
              <div key={pattern.id} className="text-sm text-gray-600">
                {getNarrativeTypeIcon(pattern.type)} {formatParticipants(pattern.participants)}
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* 叙事总结 */}
      {narratives.summaries.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-3">📝 叙事总结</h3>
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
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value} / {total}</div>
      <div className="mt-2 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// 叙事模式卡片
function NarrativeCard({ pattern }: { pattern: NarrativePattern }) {
  const icon = getNarrativeTypeIcon(pattern.type)
  const statusColor = getStatusColor(pattern.status)
  const intensityBar = Math.round(pattern.intensity * 10)
  
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className="font-semibold">{getNarrativeTypeName(pattern.type)}</div>
            <div className="text-sm text-gray-600">
              {formatParticipants(pattern.participants)}
            </div>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${statusColor}`}>
          {getStatusName(pattern.status)}
        </span>
      </div>
      
      <div className="mt-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">强度</span>
          <span className="font-medium">{Math.round(pattern.intensity * 100)}%</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded ${
                i < intensityBar ? 'bg-red-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
      
      {pattern.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {pattern.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded">
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
    <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-lg">{arc.title}</h4>
          <div className="text-sm text-gray-600 mt-1">
            主角: {arc.protagonists.join(', ')}
          </div>
          {arc.antagonists.length > 0 && (
            <div className="text-sm text-gray-600">
              对手: {arc.antagonists.join(', ')}
            </div>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(arc.status)}`}>
          {getStatusName(arc.status)}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">当前阶段</span>
          <span className="font-medium">{getStageName(arc.current_stage)}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">完整度</span>
          <span className="font-medium">{completenessPercentage}%</span>
        </div>
        
        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
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
              className={`text-center p-2 rounded text-xs ${
                isCurrent ? 'bg-blue-600 text-white font-bold' : 
                count > 0 ? 'bg-blue-300 text-blue-900' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {getStageName(stage)}
              <div className="text-xs mt-1">{count}</div>
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
    <div className="border rounded-lg p-4 bg-gray-50">
      <h4 className="font-semibold mb-2">{summary.title}</h4>
      <p className="text-sm text-gray-700 line-clamp-3">{summary.content}</p>
      <div className="mt-2 text-xs text-gray-500">
        Tick {summary.tick_range[0]} - {summary.tick_range[1]} · {summary.word_count} 字
      </div>
    </div>
  )
}

// 辅助函数
function getNarrativeTypeIcon(type: NarrativePattern['type']): string {
  const icons: Record<string, string> = {
    conflict: '⚔️',
    alliance: '🤝',
    romance: '💕',
    betrayal: '🗡️',
    discovery: '🔍',
    transformation: '🔄',
    quest: '🗺️',
    mystery: '❓',
    tragedy: '😢',
    triumph: '🏆'
  }
  return icons[type] || '📖'
}

function getNarrativeTypeName(type: NarrativePattern['type']): string {
  const names: Record<string, string> = {
    conflict: '冲突',
    alliance: '联盟',
    romance: '浪漫',
    betrayal: '背叛',
    discovery: '发现',
    transformation: '转变',
    quest: '探索',
    mystery: '谜团',
    tragedy: '悲剧',
    triumph: '胜利'
  }
  return names[type] || '故事'
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    emerging: 'bg-green-100 text-green-800',
    developing: 'bg-blue-100 text-blue-800',
    climax: 'bg-red-100 text-red-800',
    resolving: 'bg-yellow-100 text-yellow-800',
    concluded: 'bg-gray-100 text-gray-800',
    dormant: 'bg-gray-100 text-gray-500'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getStatusName(status: string): string {
  const names: Record<string, string> = {
    emerging: '萌芽',
    developing: '发展',
    climax: '高潮',
    resolving: '解决',
    concluded: '完结',
    dormant: '休眠'
  }
  return names[status] || status
}

function getStageName(stage: string): string {
  const names: Record<string, string> = {
    setup: '铺垫',
    rising: '上升',
    climax: '高潮',
    falling: '下降',
    resolution: '解决'
  }
  return names[stage] || stage
}

function formatParticipants(participants: string[]): string {
  if (participants.length === 0) return '无参与者'
  if (participants.length === 1) return participants[0]
  if (participants.length === 2) return participants.join(' 和 ')
  return `${participants.slice(0, 2).join(', ')} 等 ${participants.length} 人`
}
