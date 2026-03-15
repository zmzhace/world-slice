'use client'

import React from 'react'
import type { WorldSlice, PersonalAgentState } from '@/domain/world'
import {
  Network,
  Users,
  Heart,
  Skull,
  Minus,
} from 'lucide-react'

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

export function SocialNetworkPanel({ world }: SocialNetworkPanelProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null)

  // 构建网络数据
  const { nodes, links, communities } = React.useMemo(() => {
    return buildNetworkData(world)
  }, [world])

  // 绘制网络图
  React.useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布大小
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // 简单的力导向布局（简化版）
    const positions = calculateLayout(nodes, links, canvas.width, canvas.height)

    // 绘制
    drawNetwork(ctx, nodes, links, positions, hoveredNode, selectedNode)
  }, [nodes, links, hoveredNode, selectedNode])

  // 处理鼠标事件
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 查找点击的节点
    const positions = calculateLayout(nodes, links, canvas.width, canvas.height)
    const clickedNode = findNodeAtPosition(nodes, positions, x, y)

    setSelectedNode(clickedNode)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const positions = calculateLayout(nodes, links, canvas.width, canvas.height)
    const hoveredNode = findNodeAtPosition(nodes, positions, x, y)

    setHoveredNode(hoveredNode)
    canvas.style.cursor = hoveredNode ? 'pointer' : 'default'
  }

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
      <div className="relative rounded-xl border border-white/[0.06] bg-[#050508]" style={{ height: '500px' }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
        />

        {/* 图例 */}
        <div className="absolute top-3 right-3 rounded-xl border border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-sm p-3 text-xs">
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

// 计算布局（force-directed simulation）
function calculateLayout(
  nodes: NetworkNode[],
  links: NetworkLink[],
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()

  if (nodes.length === 0) return positions

  // Initialize with circular layout
  const centerX = width / 2
  const centerY = height / 2
  const initRadius = Math.min(width, height) * 0.3

  nodes.forEach((node, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2
    positions.set(node.id, {
      x: centerX + initRadius * Math.cos(angle),
      y: centerY + initRadius * Math.sin(angle),
    })
  })

  // Run force simulation (50 iterations)
  const repulsion = 3000
  const attraction = 0.005
  const damping = 0.9
  const velocities = new Map<string, { vx: number; vy: number }>()
  nodes.forEach(n => velocities.set(n.id, { vx: 0, vy: 0 }))

  for (let iter = 0; iter < 60; iter++) {
    // Repulsive forces (all pairs)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = positions.get(nodes[i].id)!
        const b = positions.get(nodes[j].id)!
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
        const force = repulsion / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force

        const va = velocities.get(nodes[i].id)!
        const vb = velocities.get(nodes[j].id)!
        va.vx -= fx; va.vy -= fy
        vb.vx += fx; vb.vy += fy
      }
    }

    // Attractive forces (links)
    for (const link of links) {
      const a = positions.get(link.source)
      const b = positions.get(link.target)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
      const force = dist * attraction * (1 + link.value)
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force

      const va = velocities.get(link.source)!
      const vb = velocities.get(link.target)!
      if (va) { va.vx += fx; va.vy += fy }
      if (vb) { vb.vx -= fx; vb.vy -= fy }
    }

    // Center gravity
    for (const node of nodes) {
      const pos = positions.get(node.id)!
      const v = velocities.get(node.id)!
      v.vx += (centerX - pos.x) * 0.001
      v.vy += (centerY - pos.y) * 0.001
    }

    // Apply velocities with damping
    const margin = 40
    for (const node of nodes) {
      const pos = positions.get(node.id)!
      const v = velocities.get(node.id)!
      v.vx *= damping
      v.vy *= damping
      pos.x = Math.max(margin, Math.min(width - margin, pos.x + v.vx))
      pos.y = Math.max(margin, Math.min(height - margin, pos.y + v.vy))
    }
  }

  return positions
}

// 绘制网络
function drawNetwork(
  ctx: CanvasRenderingContext2D,
  nodes: NetworkNode[],
  links: NetworkLink[],
  positions: Map<string, { x: number; y: number }>,
  hoveredNode: string | null,
  selectedNode: string | null
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // Draw links
  for (const link of links) {
    const sourcePos = positions.get(link.source)
    const targetPos = positions.get(link.target)
    if (!sourcePos || !targetPos) continue

    ctx.beginPath()
    ctx.moveTo(sourcePos.x, sourcePos.y)
    ctx.lineTo(targetPos.x, targetPos.y)

    const isHighlighted = link.source === hoveredNode || link.target === hoveredNode ||
                          link.source === selectedNode || link.target === selectedNode

    if (link.type === 'positive') {
      ctx.strokeStyle = isHighlighted ? 'rgba(16, 185, 129, 0.7)' : 'rgba(16, 185, 129, 0.25)'
    } else if (link.type === 'negative') {
      ctx.strokeStyle = isHighlighted ? 'rgba(239, 68, 68, 0.7)' : 'rgba(239, 68, 68, 0.25)'
      ctx.setLineDash([4, 4])
    } else {
      ctx.strokeStyle = isHighlighted ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)'
    }

    ctx.lineWidth = isHighlighted ? link.value * 3 + 1 : link.value * 1.5 + 0.5
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Draw nodes
  for (const node of nodes) {
    const pos = positions.get(node.id)
    if (!pos) continue

    const isHovered = node.id === hoveredNode
    const isSelected = node.id === selectedNode
    const radius = Math.max(6, node.size) * (isHovered || isSelected ? 1.3 : 1)

    // Outer glow
    if (isHovered || isSelected) {
      const gradient = ctx.createRadialGradient(pos.x, pos.y, radius, pos.x, pos.y, radius + 12)
      gradient.addColorStop(0, node.color + '40')
      gradient.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, radius + 12, 0, 2 * Math.PI)
      ctx.fillStyle = gradient
      ctx.fill()
    }

    // Node circle
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI)
    ctx.fillStyle = isHovered || isSelected ? node.color : node.color + 'CC'
    ctx.fill()

    if (isSelected) {
      ctx.strokeStyle = '#93c5fd'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Label — always visible
    ctx.fillStyle = isHovered || isSelected ? '#f1f5f9' : '#94a3b8'
    ctx.font = isHovered || isSelected ? 'bold 12px system-ui, sans-serif' : '11px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    // Text background for readability
    const textWidth = ctx.measureText(node.name).width
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(pos.x - textWidth / 2 - 3, pos.y + radius + 4, textWidth + 6, 16)
    ctx.fillStyle = isHovered || isSelected ? '#f1f5f9' : '#94a3b8'
    ctx.fillText(node.name, pos.x, pos.y + radius + 6)
  }
}

// 查找位置上的节点
function findNodeAtPosition(
  nodes: NetworkNode[],
  positions: Map<string, { x: number; y: number }>,
  x: number,
  y: number
): string | null {
  for (const node of nodes) {
    const pos = positions.get(node.id)
    if (!pos) continue

    const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2))
    if (distance <= node.size) {
      return node.id
    }
  }

  return null
}
