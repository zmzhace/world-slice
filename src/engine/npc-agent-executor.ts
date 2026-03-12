import type { PersonalAgentState, WorldSlice } from '@/domain/world'
import type { AgentPatch } from '@/domain/agents'
import { extractWorldKnowledge, generateAgentContext } from './world-knowledge'

/**
 * NPC Agent Executor - 并行执行 NPC agents 的决策和行动
 */

type AgentDecision = {
  agentId: string
  action: {
    type: string
    target?: string
    intensity: number
  }
  reasoning?: string
}

/**
 * 为单个 NPC agent 生成决策
 * 使用世界知识和 agent 目标来做出上下文感知的决策
 */
function makeAgentDecision(agent: PersonalAgentState, world: WorldSlice): AgentDecision {
  // 提取世界知识
  const worldKnowledge = extractWorldKnowledge(world)
  
  // 基于 agent 的状态、性格和目标做出决策
  const { vitals, persona, emotion, goals } = agent
  
  let actionType = 'idle'
  let intensity = 0.3
  let target: string | undefined
  let reasoning = ''
  
  // 如果能量低，休息
  if (vitals.energy < 0.3) {
    actionType = 'rest'
    intensity = 0.8
    reasoning = `能量过低 (${(vitals.energy * 100).toFixed(0)}%)，需要休息恢复`
  }
  // 如果压力高，放松
  else if (vitals.stress > 0.7) {
    actionType = 'relax'
    intensity = 0.6
    reasoning = `压力过高 (${(vitals.stress * 100).toFixed(0)}%)，需要放松`
  }
  // 如果有目标且主动性高，执行目标
  else if (goals.length > 0 && persona.agency > 0.6) {
    actionType = 'pursue_goal'
    intensity = persona.agency
    target = goals[0]
    reasoning = `主动追求目标: ${goals[0]}。当前世界背景: ${worldKnowledge.narrative_seed}`
  }
  // 如果共情力高且开放性高，社交
  else if (persona.empathy > 0.6 && persona.openness > 0.5 && worldKnowledge.known_agents.length > 1) {
    actionType = 'socialize'
    intensity = (persona.empathy + persona.openness) / 2
    // 随机选择一个其他 agent 作为社交对象
    const otherAgents = worldKnowledge.known_agents.filter(a => a.seed !== agent.genetics.seed)
    if (otherAgents.length > 0) {
      target = otherAgents[Math.floor(Math.random() * otherAgents.length)].name
    }
    reasoning = `高共情力和开放性，尝试与${target || '他人'}社交`
  }
  // 根据世界压力做出反应
  else if (worldKnowledge.social.pressures.length > 0 && persona.stability < 0.5) {
    actionType = 'react_to_pressure'
    intensity = 1 - persona.stability
    target = worldKnowledge.social.pressures[0]
    reasoning = `对社会压力做出反应: ${target}`
  }
  // 否则探索
  else {
    actionType = 'explore'
    intensity = persona.openness
    reasoning = `探索世界: ${worldKnowledge.environment.description}`
  }
  
  return {
    agentId: agent.genetics.seed,
    action: {
      type: actionType,
      target,
      intensity,
    },
    reasoning,
  }
}

/**
 * 将 agent 决策转换为世界补丁
 */
function decisionToPatch(decision: AgentDecision, agent: PersonalAgentState, world: WorldSlice): AgentPatch {
  const { action } = decision
  
  // 生成事件
  const event = {
    id: `agent-${agent.genetics.seed}-${world.tick}`,
    kind: 'micro' as const,
    summary: `${agent.identity.name} ${action.type}${action.target ? ` (${action.target})` : ''}`,
    conflict: false,
  }
  
  return {
    timeDelta: 0,
    events: [event],
    rulesDelta: [],
    notes: [decision.reasoning || ''],
    meta: {
      agentId: decision.agentId,
      actionType: action.type,
      intensity: action.intensity,
    },
  }
}

/**
 * 并行执行所有 NPC agents
 */
export async function executeNpcAgents(
  world: WorldSlice
): Promise<Array<{ agentId: string; patch: AgentPatch }>> {
  const { npcs } = world.agents
  
  if (npcs.length === 0) {
    return []
  }
  
  // 并行为所有 agents 生成决策
  const decisions = await Promise.all(
    npcs.map(async (agent) => {
      try {
        return makeAgentDecision(agent, world)
      } catch (error) {
        console.error(`Failed to make decision for agent ${agent.identity.name}:`, error)
        return null
      }
    })
  )
  
  // 过滤掉失败的决策
  const validDecisions = decisions.filter((d): d is AgentDecision => d !== null)
  
  // 并行将决策转换为补丁
  const results = await Promise.all(
    validDecisions.map(async (decision) => {
      const agent = npcs.find(a => a.genetics.seed === decision.agentId)
      if (!agent) return null
      
      try {
        const patch = decisionToPatch(decision, agent, world)
        return {
          agentId: decision.agentId,
          patch,
        }
      } catch (error) {
        console.error(`Failed to create patch for agent ${agent.identity.name}:`, error)
        return null
      }
    })
  )
  
  // 过滤掉失败的结果
  return results.filter((r): r is { agentId: string; patch: AgentPatch } => r !== null)
}
