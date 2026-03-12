import type { WorldSlice, SocialContext } from '@/domain/world'

/**
 * 世界知识库 - 为 agents 提供世界背景信息
 */

export type WorldKnowledge = {
  // 环境知识
  environment: {
    description: string
    regions: string[]
    climate: string
    terrain: string
  }
  
  // 社会知识
  social: {
    macro_events: string[]
    narratives: string[]
    pressures: string[]
    institutions: string[]
    ambient_noise: string[]
  }
  
  // 核心叙事
  narrative_seed: string
  
  // 当前状态
  current_time: string
  tick: number
  
  // 已知的其他 agents
  known_agents: Array<{
    name: string
    seed: string
    relationship?: number
  }>
}

/**
 * 从 WorldSlice 提取世界知识
 */
export function extractWorldKnowledge(world: WorldSlice): WorldKnowledge {
  const genesisEvent = world.events.find(e => e.type === 'world_created')
  const genesisPayload = genesisEvent?.payload as any
  
  return {
    environment: {
      description: world.environment.description,
      regions: [genesisPayload?.region || '未知区域'],
      climate: genesisPayload?.climate || '未知气候',
      terrain: genesisPayload?.terrain || '未知地形',
    },
    social: world.social_context,
    narrative_seed: genesisPayload?.narrative_seed || '',
    current_time: world.time,
    tick: world.tick,
    known_agents: world.agents.npcs.map(npc => ({
      name: npc.identity.name,
      seed: npc.genetics.seed,
    })),
  }
}

/**
 * 为 agent 生成上下文感知的决策提示
 */
export function generateAgentContext(
  agentName: string,
  agentGoals: string[],
  worldKnowledge: WorldKnowledge
): string {
  return `你是 ${agentName}。

你的目标：
${agentGoals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

世界背景：
- 环境：${worldKnowledge.environment.description}
- 核心叙事：${worldKnowledge.narrative_seed}
- 当前时间：Tick ${worldKnowledge.tick}

社会背景：
- 重大事件：${worldKnowledge.social.macro_events.join(', ')}
- 主流叙事：${worldKnowledge.social.narratives.join(', ')}
- 社会压力：${worldKnowledge.social.pressures.join(', ')}
- 主要机构：${worldKnowledge.social.institutions.join(', ')}

已知的其他人物：
${worldKnowledge.known_agents.map(a => `- ${a.name}`).join('\n')}

基于以上信息，你应该如何行动来实现你的目标？`
}

/**
 * 查询世界知识 - agents 可以用这个来了解世界
 */
export function queryWorldKnowledge(
  world: WorldSlice,
  query: {
    type: 'environment' | 'social' | 'agents' | 'events' | 'all'
    filter?: string
  }
): any {
  const knowledge = extractWorldKnowledge(world)
  
  switch (query.type) {
    case 'environment':
      return knowledge.environment
    case 'social':
      return knowledge.social
    case 'agents':
      return knowledge.known_agents
    case 'events':
      return world.events.slice(-10)  // 最近10个事件
    case 'all':
      return knowledge
    default:
      return null
  }
}
