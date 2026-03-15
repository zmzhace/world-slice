'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { WorldSlice, PersonalAgentState } from '@/domain/world'
import {
  Network,
  Users,
  Heart,
  Skull,
  Minus,
} from 'lucide-react'

const ForceGraph = dynamic(() => import('react-force-graph-2d'), { ssr: false })

type SocialNetworkPanelProps = {
  world: WorldSlice
}

type NetworkNode = {
  id: string
  name: string
  group: number  // 社区 ID
  size: number   // 节点大小（基于连接数）
  color: string
}

type NetworkLink = {
  source: string
  target: string
  value: number  // 关系强度
  type: 'positive' | 'negative' | 'neutral'
}

// Graph data node with extra fields for ForceGraph2D
type GraphNode = {
  id: string
  name: string
  val: number
  color: string
  group: number
}

// Graph data link with extra fields for ForceGraph2D
type GraphLink = {
  source: string
  target: string
  color: string
  width: number
  type: 'positive' | 'negative' | 'neutral'
  value: number
}

export function SocialNetworkPanel({ world }: SocialNetworkPanelProps) {
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = React.useState(600)

  // Track container width for responsive sizing
  React.useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // 构建网络数据
  const { nodes, links, communities } = React.useMemo(() => {
    return buildNetworkData(world)
  }, [world])

  // Transform into ForceGraph2D format
  const graphData = React.useMemo(() => {
    const graphNodes: GraphNode[] = nodes.map(n => ({
      id: n.id,
      name: n.name,
      val: Math.max(2, n.size),
      color: n.color,
      group: n.group,
    }))

    const graphLinks: GraphLink[] = links.map(l => ({
      source: l.source,
      target: l.target,
      color:
        l.type === 'positive'
          ? 'rgba(16,185,129,0.4)'
          : l.type === 'negative'
            ? 'rgba(239,68,68,0.4)'
            : 'rgba(255,255,255,0.06)',
      width: Math.max(0.5, l.value * 2),
      type: l.type,
      value: l.value,
    }))

    return { nodes: graphNodes, links: graphLinks }
  }, [nodes, links])

  // Set of node IDs connected to the hovered node (for highlight)
  const connectedNodeIds = React.useMemo(() => {
    if (!hoveredNode) return new Set<string>()
    const ids = new Set<string>()
    ids.add(hoveredNode)
    for (const l of links) {
      if (l.source === hoveredNode) ids.add(l.target)
      if (l.target === hoveredNode) ids.add(l.source)
    }
    return ids
  }, [hoveredNode, links])

  // Custom node renderer
  const nodeCanvasObject = React.useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const id = node.id as string
      const label = node.name as string
      const color = node.color as string
      const baseRadius = Math.max(4, Math.sqrt(node.val || 1) * 2.5)
      const isHovered = id === hoveredNode
      const isSelected = id === selectedNode
      const isHighlighted = isHovered || isSelected
      const radius = isHighlighted ? baseRadius * 1.4 : baseRadius

      const x = node.x as number
      const y = node.y as number

      // Glow effect for highlighted nodes
      if (isHighlighted) {
        const gradient = ctx.createRadialGradient(x, y, radius, x, y, radius + 10)
        gradient.addColorStop(0, color + '60')
        gradient.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(x, y, radius + 10, 0, 2 * Math.PI)
        ctx.fillStyle = gradient
        ctx.fill()
      }

      // Node circle
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = isHighlighted ? color : color + 'CC'
      ctx.fill()

      if (isSelected) {
        ctx.strokeStyle = '#93c5fd'
        ctx.lineWidth = 2 / globalScale
        ctx.stroke()
      }

      // Label below the node (always visible)
      const fontSize = 11 / globalScale
      ctx.font = `${isHighlighted ? 'bold ' : ''}${fontSize}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      const textWidth = ctx.measureText(label).width
      const textY = y + radius + 3 / globalScale
      const padding = 2 / globalScale

      // Dark background rect for readability
      ctx.fillStyle = 'rgba(5, 5, 8, 0.75)'
      ctx.fillRect(
        x - textWidth / 2 - padding,
        textY - padding,
        textWidth + padding * 2,
        fontSize + padding * 2
      )

      ctx.fillStyle = isHighlighted ? '#f1f5f9' : '#94a3b8'
      ctx.fillText(label, x, textY)
    },
    [hoveredNode, selectedNode]
  )

  // Custom pointer area for nodes (makes hit detection match visual size)
  const nodePointerAreaPaint = React.useCallback(
    (node: any, paintColor: string, ctx: CanvasRenderingContext2D) => {
      const radius = Math.max(6, Math.sqrt(node.val || 1) * 3)
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = paintColor
      ctx.fill()
    },
    []
  )

  // 获取选中节点的详细信息
  const selectedAgent = selectedNode
    ? world.agents.npcs.find(a => a.genetics.seed === selectedNode)
    : null

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-100">
          <Network className="h-4 w-4 text-blue-400" />
          Social Network
        </h3>
        <div className="text-xs text-slate-500">
          {nodes.length} nodes · {links.length} links · {communities.length} clusters
        </div>
      </div>

      {/* 网络图 */}
      <div
        ref={containerRef}
        className="relative rounded-xl border border-white/[0.06] bg-[#050508]"
        style={{ height: '500px' }}
      >
        <ForceGraph
          graphData={graphData}
          width={containerWidth}
          height={500}
          backgroundColor="#050508"
          nodeCanvasObject={nodeCanvasObject}
          nodeCanvasObjectMode={() => 'replace'}
          nodePointerAreaPaint={nodePointerAreaPaint}
          linkColor={(link: any) => {
            const src = typeof link.source === 'object' ? link.source.id : link.source
            const tgt = typeof link.target === 'object' ? link.target.id : link.target
            const isHighlighted =
              src === hoveredNode || tgt === hoveredNode ||
              src === selectedNode || tgt === selectedNode

            if (link.type === 'positive') {
              return isHighlighted ? 'rgba(16,185,129,0.7)' : 'rgba(16,185,129,0.4)'
            }
            if (link.type === 'negative') {
              return isHighlighted ? 'rgba(239,68,68,0.7)' : 'rgba(239,68,68,0.4)'
            }
            return isHighlighted ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'
          }}
          linkWidth={(link: any) => {
            const src = typeof link.source === 'object' ? link.source.id : link.source
            const tgt = typeof link.target === 'object' ? link.target.id : link.target
            const isHighlighted =
              src === hoveredNode || tgt === hoveredNode ||
              src === selectedNode || tgt === selectedNode
            return isHighlighted ? link.value * 3 + 1 : Math.max(0.5, link.value * 1.5)
          }}
          linkLineDash={(link: any) =>
            link.type === 'negative' ? [4, 2] : null
          }
          linkDirectionalParticles={(link: any) =>
            link.type === 'positive' ? 2 : 0
          }
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleColor={(link: any) => 'rgba(16,185,129,0.6)'}
          onNodeClick={(node: any) => {
            setSelectedNode(node.id as string)
          }}
          onNodeHover={(node: any) => {
            setHoveredNode(node ? (node.id as string) : null)
          }}
          onBackgroundClick={() => {
            setSelectedNode(null)
          }}
          warmupTicks={100}
          cooldownTicks={0}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />

        {/* 图例 */}
        <div className="absolute top-3 right-3 rounded-xl border border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-sm p-3 text-xs pointer-events-none">
          <div className="font-semibold text-slate-300 mb-2">Legend</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Heart className="h-3 w-3 text-emerald-400" />
              <span className="text-slate-400">Positive</span>
            </div>
            <div className="flex items-center gap-2">
              <Skull className="h-3 w-3 text-red-400" />
              <span className="text-slate-400">Negative</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="h-3 w-3 text-slate-500" />
              <span className="text-slate-400">Neutral</span>
            </div>
          </div>
        </div>
      </div>

      {/* 社区列表 */}
      <div className="grid grid-cols-2 gap-3">
        {communities.map((community, idx) => (
          <div key={idx} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-sm text-slate-200">Cluster {idx + 1}</span>
            </div>
            <div className="text-xs text-slate-500 mb-2">
              {community.members.length} members
            </div>
            <div className="flex flex-wrap gap-1">
              {community.members.slice(0, 5).map(memberId => {
                const memberNode = nodes.find(n => n.id === memberId)
                return (
                  <span
                    key={memberId}
                    className="text-xs bg-white/[0.06] text-slate-400 px-2 py-0.5 rounded-full cursor-pointer hover:bg-white/[0.10] hover:text-slate-300 transition-colors"
                    onClick={() => setSelectedNode(memberId)}
                  >
                    {memberNode?.name || memberId}
                  </span>
                )
              })}
              {community.members.length > 5 && (
                <span className="text-xs text-slate-600">
                  +{community.members.length - 5}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 节点详情 */}
      {selectedAgent && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-4">
          <h4 className="font-semibold text-sm text-slate-100 mb-3">{selectedAgent.identity.name}</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Occupation</span>
              <span className="text-slate-300">{selectedAgent.occupation || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Core Belief</span>
              <span className="text-slate-300">{selectedAgent.core_belief || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Relationships</span>
              <span className="text-blue-400 font-medium">{Object.keys(selectedAgent.relations).length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Emotion</span>
              <span className="text-slate-300">
                {selectedAgent.emotion.label}
                <span className="text-slate-500 ml-1">
                  ({Math.round(selectedAgent.emotion.intensity * 100)}%)
                </span>
              </span>
            </div>
            {Object.keys(selectedAgent.relations).length > 0 && (
              <div className="pt-2 border-t border-white/[0.06]">
                <span className="text-slate-500">Key Relationships</span>
                <div className="mt-1.5 space-y-1">
                  {Object.entries(selectedAgent.relations)
                    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                    .slice(0, 5)
                    .map(([target, value]) => {
                      const targetAgent = world.agents.npcs.find(a => a.genetics.seed === target)
                      return (
                        <div key={target} className="flex items-center justify-between">
                          <span className="text-slate-400">{targetAgent?.identity.name || target}</span>
                          <span className={value > 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {value > 0 ? '+' : ''}{value.toFixed(2)}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// 构建网络数据
function buildNetworkData(world: WorldSlice): {
  nodes: NetworkNode[]
  links: NetworkLink[]
  communities: Array<{ id: number; members: string[] }>
} {
  const nodes: NetworkNode[] = []
  const links: NetworkLink[] = []

  // 创建节点
  const allAgents = [world.agents.personal, ...world.agents.npcs]

  for (const agent of allAgents) {
    const connectionCount = Object.keys(agent.relations).length

    nodes.push({
      id: agent.genetics.seed,
      name: agent.identity.name,
      group: 0,  // 稍后分配社区
      size: Math.max(5, connectionCount * 2),
      color: '#3b82f6'
    })
  }

  // 创建连接
  for (const agent of allAgents) {
    for (const [target, value] of Object.entries(agent.relations)) {
      // 避免重复连接
      const existingLink = links.find(
        l => (l.source === agent.genetics.seed && l.target === target) ||
             (l.source === target && l.target === agent.genetics.seed)
      )

      if (!existingLink) {
        links.push({
          source: agent.genetics.seed,
          target,
          value: Math.abs(value),
          type: value > 0.3 ? 'positive' : value < -0.3 ? 'negative' : 'neutral'
        })
      }
    }
  }

  // 社区发现（简化版：基于连接密度）
  const communities = detectCommunities(nodes, links)

  // 为节点分配社区颜色
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
  for (const node of nodes) {
    const community = communities.find(c => c.members.includes(node.id))
    if (community) {
      node.group = community.id
      node.color = colors[community.id % colors.length]
    }
  }

  return { nodes, links, communities }
}

// 社区发现（简化版）
function detectCommunities(
  nodes: NetworkNode[],
  links: NetworkLink[]
): Array<{ id: number; members: string[] }> {
  const communities: Array<{ id: number; members: string[] }> = []
  const visited = new Set<string>()

  let communityId = 0

  for (const node of nodes) {
    if (visited.has(node.id)) continue

    // BFS 查找连通分量
    const community: string[] = []
    const queue = [node.id]
    visited.add(node.id)

    while (queue.length > 0) {
      const current = queue.shift()!
      community.push(current)

      // 找到所有邻居
      const neighbors = links
        .filter(l => l.source === current || l.target === current)
        .map(l => l.source === current ? l.target : l.source)
        .filter(n => !visited.has(n))

      for (const neighbor of neighbors) {
        visited.add(neighbor)
        queue.push(neighbor)
      }
    }

    if (community.length > 0) {
      communities.push({ id: communityId++, members: community })
    }
  }

  return communities
}
