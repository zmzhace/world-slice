import { createHookBus } from './hooks'
import { createNuwaService } from './nuwa-service'
import { applyMemoryDecay } from './memory'
import { updateVitalsAfterTick } from './vitals'
import { applyPersonaDrift, generateDriftSignals } from './persona'
import { selectActiveAgents, applyCircadianEffects, getWorldHour, generateDefaultSleepSchedule } from './circadian-rhythm'
import { mapSearchResultsToSocialContext } from '@/server/search/mapper'
import { executeNpcAgents } from './npc-agent-executor'
import type { AgentAction } from '@/domain/actions'
import type { WorldSlice, PersonalAgentState, SystemsState } from '@/domain/world'
import type { SearchSignal } from '@/domain/search'
import { arbitratePatches } from './arbiter'
import { judgeLife, decideReincarnation, createHoutuConfig } from '@/domain/houtu'
import { createPersonalAgent } from '@/domain/agents'
import { createRecommendationSystem } from './recommendation-system'
import { createKnowledgeGraph, KnowledgeGraph } from './knowledge-graph'
import { NarrativeRecognizer } from './narrative-recognizer'
import { StoryArcDetector } from './story-arc-detector'
import { NarrativeSummarizer } from './narrative-summarizer'
import { NarrativeInfluenceSystem } from './narrative-influence'
import { CollectiveMemorySystem } from './collective-memory'
import { ReputationSystem } from './reputation-system'
import { CognitiveBiasSystem } from './cognitive-bias-system'
import { ResourceCompetitionSystem } from './resource-competition-system'
import { DramaticTensionSystem } from './dramatic-tension-system'
import { EmergentPropertyDetector } from './emergent-property-detector'
import { SocialRoleSystem } from './social-role-system'
import { MemePropagationSystem } from './meme-propagation-system'
import { HierarchicalMemorySystem } from './hierarchical-memory-system'
import { AttentionMechanism } from './attention-mechanism'

type OrchestratorOptions = {
  search?: () => Promise<SearchSignal[]>
  creator?: { trigger: 'event'; seed: string; environment: { region: string; social_state: string } }
  directorRegistry?: { runAll: (world: WorldSlice) => Promise<{ agentId: string; patch?: unknown; error?: string }[]> }
}

// 全局系统实例（跨 tick 保持状态，从 world.systems 水合）
let globalReputationSystem: ReputationSystem | null = null
let globalBiasSystem: CognitiveBiasSystem | null = null
let globalResourceSystem: ResourceCompetitionSystem | null = null
let globalTensionSystem: DramaticTensionSystem | null = null
let globalEmergenceDetector: EmergentPropertyDetector | null = null
let globalRoleSystem: SocialRoleSystem | null = null
let globalMemeSystem: MemePropagationSystem | null = null
let globalMemorySystems: Map<string, HierarchicalMemorySystem> = new Map()
let globalAttentionMechanism: AttentionMechanism | null = null

/**
 * 从 world.systems 水合全局系统单例
 */
function hydrateSystemsFromWorld(world: WorldSlice): void {
  const sys = world.systems || {}

  // 声誉系统
  globalReputationSystem = new ReputationSystem()
  if (sys.reputation) {
    globalReputationSystem.fromSnapshot(sys.reputation)
  }

  // 认知偏差（无状态，每次 new 即可）
  globalBiasSystem = new CognitiveBiasSystem()

  // 资源竞争
  globalResourceSystem = new ResourceCompetitionSystem()
  if (sys.resources) {
    globalResourceSystem.fromSnapshot(sys.resources)
  } else {
    globalResourceSystem.initializeResources(world)
  }

  // 戏剧张力
  globalTensionSystem = new DramaticTensionSystem()
  if (sys.tension) {
    globalTensionSystem.fromSnapshot(sys.tension)
  }

  // 涌现检测
  globalEmergenceDetector = new EmergentPropertyDetector()
  if (sys.emergence) {
    globalEmergenceDetector.fromSnapshot(sys.emergence)
  }

  // 社会角色
  globalRoleSystem = new SocialRoleSystem()
  if (sys.social_roles) {
    globalRoleSystem.fromSnapshot(sys.social_roles)
  }

  // 模因传播
  globalMemeSystem = new MemePropagationSystem()
  if (sys.memes) {
    globalMemeSystem.fromSnapshot(sys.memes)
  }

  // 注意力机制
  globalAttentionMechanism = new AttentionMechanism()
  if (sys.attention) {
    globalAttentionMechanism.fromSnapshot(sys.attention)
  }
}

/**
 * 将所有系统状态导出为 SystemsState
 */
function exportSystemsState(knowledgeGraph: KnowledgeGraph): SystemsState {
  return {
    reputation: globalReputationSystem!.toSnapshot(),
    social_roles: globalRoleSystem!.toSnapshot(),
    resources: globalResourceSystem!.toSnapshot(),
    tension: globalTensionSystem!.toSnapshot(),
    emergence: globalEmergenceDetector!.toSnapshot(),
    memes: globalMemeSystem!.toSnapshot(),
    attention: globalAttentionMechanism!.toSnapshot(),
    knowledge_graph: knowledgeGraph.toJSON(),
  }
}

/**
 * 世界状态演进 - 根据本轮事件更新 social_context
 * 纯粹从事件内容驱动，不做硬编码阈值判断
 */
function evolveWorldState(world: WorldSlice, patch: ReturnType<typeof arbitratePatches>): WorldSlice {
  const updatedSocialContext = { ...world.social_context }

  // 1. 所有有 summary 的事件都是潜在的宏观事件
  const newEventSummaries = patch.events
    .filter(e => e.summary && e.summary.length > 5)
    .map(e => e.summary)

  if (newEventSummaries.length > 0) {
    const existingSet = new Set(updatedSocialContext.macro_events)
    for (const evt of newEventSummaries) {
      if (!existingSet.has(evt)) {
        updatedSocialContext.macro_events.push(evt)
      }
    }
    // 保留最近 20 条
    if (updatedSocialContext.macro_events.length > 20) {
      updatedSocialContext.macro_events = updatedSocialContext.macro_events.slice(-20)
    }
  }

  // 2. 从叙事模式更新 narratives
  const activeNarrativeDescriptions = world.narratives.patterns
    .filter(p => p.status === 'developing' || p.status === 'climax')
    .slice(0, 5)
    .map(p => {
      const participants = world.agents.npcs
        .filter(a => p.participants.includes(a.genetics.seed))
        .map(a => a.identity.name)
      return `${p.type}: ${participants.join(' & ')} — ${p.type} (${p.status === 'climax' ? 'climax' : 'developing'})`
    })

  if (activeNarrativeDescriptions.length > 0) {
    updatedSocialContext.narratives = activeNarrativeDescriptions
  }

  // 3. 从 NPC 的情绪状态生成环境氛围（不做阈值判断，直接统计主流情绪）
  const emotionCounts = new Map<string, number>()
  for (const npc of world.agents.npcs) {
    if (npc.emotion.label && npc.emotion.label !== 'neutral') {
      emotionCounts.set(npc.emotion.label, (emotionCounts.get(npc.emotion.label) || 0) + 1)
    }
  }
  const topEmotions = [...emotionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([label]) => `atmosphere of ${label}`)

  if (topEmotions.length > 0) {
    updatedSocialContext.ambient_noise = [
      ...topEmotions,
      ...updatedSocialContext.ambient_noise.slice(0, 2),
    ].slice(0, 4)
  }

  // 4. 清理过旧的事件（保留最近 200 条）
  const trimmedEvents = world.events.length > 200
    ? world.events.slice(-200)
    : world.events

  return {
    ...world,
    social_context: updatedSocialContext,
    events: trimmedEvents,
  }
}

export async function runWorldTick(world: WorldSlice, options: OrchestratorOptions = {}): Promise<WorldSlice> {
  const bus = createHookBus()
  await bus.emit('before_tick', { world })

  const nextTick = world.tick + 1
  const timestamp = new Date(Date.parse(world.time) + 1000).toISOString()

  // 初始化新系统
  const recSystem = createRecommendationSystem()
  const narrativeInfluence = new NarrativeInfluenceSystem()
  const collectiveMemory = new CollectiveMemorySystem()

  // 从 world.systems 水合全局系统（替代旧的 if (!global) new() 模式）
  hydrateSystemsFromWorld(world)

  // 知识图谱：如果有持久化快照则恢复，否则从世界状态构建
  let knowledgeGraph: KnowledgeGraph
  if (world.systems?.knowledge_graph) {
    knowledgeGraph = KnowledgeGraph.fromJSON(world.systems.knowledge_graph)
  } else {
    knowledgeGraph = createKnowledgeGraph(world)
  }

  const reputationSystem = globalReputationSystem!
  const biasSystem = globalBiasSystem!
  const resourceSystem = globalResourceSystem!
  const tensionSystem = globalTensionSystem!
  const emergenceDetector = globalEmergenceDetector!
  const roleSystem = globalRoleSystem!
  const memeSystem = globalMemeSystem!
  const attentionMechanism = globalAttentionMechanism!

  // All alive NPCs participate in state updates, but only a subset makes LLM decisions
  const aliveNpcs = world.agents.npcs.filter(a => a.life_status === 'alive')

  // Ensure all agents have sleep schedules (backfill for agents created before circadian system)
  const npcsWithSchedules = aliveNpcs.map(a => {
    if (!a.sleep_schedule) {
      return { ...a, sleep_schedule: generateDefaultSleepSchedule(a) }
    }
    return a
  })

  // Calculate tension from recent conflicts + high-stress agents
  const recentConflicts = world.events.slice(-20).filter(e =>
    (e.payload as Record<string, unknown> | undefined)?.conflict === true
  ).length
  const conflictRatio = world.events.length > 0 ? recentConflicts / Math.min(20, world.events.length) : 0
  const highStressRatio = npcsWithSchedules.filter(a => a.vitals.stress > 0.6).length / Math.max(1, npcsWithSchedules.length)
  const tension = Math.min(1, conflictRatio + highStressRatio * 0.5)

  // Circadian-aware agent selection
  const activeNpcsForDecision = selectActiveAgents(npcsWithSchedules, world, tension)
  const activeSeeds = new Set(activeNpcsForDecision.map(a => a.genetics.seed))

  const worldHour = getWorldHour(world)
  console.log(`[Orchestrator] Tick ${nextTick} (hour ${worldHour}): ${activeNpcsForDecision.length}/${npcsWithSchedules.length} agents active (tension: ${(tension * 100).toFixed(0)}%)`)

  // Parallel update for personal agent
  const updatedMemoryShort = applyMemoryDecay(world.agents.personal.memory_short)
  const updatedMemoryLong = applyMemoryDecay(world.agents.personal.memory_long)
  const updatedVitals = updateVitalsAfterTick(world.agents.personal.vitals)
  const updatedPersona = applyPersonaDrift(world.agents.personal.persona, generateDriftSignals(world.agents.personal.action_history))

  // Parallel update for all NPC agents (with circadian effects)
  const updatedNpcs = await Promise.all(
    npcsWithSchedules.map(async (npc) => {
      const withCircadian = applyCircadianEffects(npc, worldHour)
      return {
        ...withCircadian,
        memory_short: applyMemoryDecay(npc.memory_short),
        memory_long: applyMemoryDecay(npc.memory_long),
        vitals: updateVitalsAfterTick(withCircadian.vitals),
        persona: applyPersonaDrift(npc.persona, generateDriftSignals(npc.action_history || [])),
      }
    })
  )

  const searchResults = options.search ? await options.search() : []
  const mappedContext = searchResults.length
    ? mapSearchResultsToSocialContext(searchResults)
    : world.social_context

  const action: AgentAction = { type: 'reflect', intensity: 0.5 }

  await bus.emit('before_action', { action })
  await bus.emit('after_action', { action })

  const events = [...world.events]

  if (options.creator) {
    const nuwa = createNuwaService({
      emit: (event) => {
        events.push({
          id: `event-${nextTick}-${events.length}`,
          type: event.type,
          timestamp,
          payload: event.payload as Record<string, unknown> | undefined,
        })
      },
    })
    nuwa.createAgent(options.creator)
  }

  const event = {
    id: `event-${nextTick}`,
    type: 'tick',
    timestamp,
  }

  events.push(event)

  const baseNext: WorldSlice = {
    ...world,
    tick: nextTick,
    time: timestamp,
    social_context: mappedContext,
    events,
    agents: {
      ...world.agents,
      personal: {
        ...world.agents.personal,
        memory_short: updatedMemoryShort,
        memory_long: updatedMemoryLong,
        vitals: updatedVitals,
        persona: updatedPersona,
        action_history: [...world.agents.personal.action_history, { type: action.type, timestamp }],
      },
      npcs: updatedNpcs,
    },
  }

  if (!options.directorRegistry) {
    const earlyNext = { ...baseNext, systems: exportSystemsState(knowledgeGraph) }
    await bus.emit('after_tick', { world: earlyNext })
    return earlyNext
  }

  // 并行执行 Pangu agents 和 NPC agents
  const [directorResults, npcResults] = await Promise.all([
    options.directorRegistry.runAll(world),
    executeNpcAgents({ ...world, agents: { ...world.agents, npcs: activeNpcsForDecision } }),
  ])

  // 合并所有 agent 的结果
  const allResults = [
    ...directorResults,
    ...npcResults.map(r => ({ agentId: r.agentId, patch: r.patch })),
  ]

  const patch = arbitratePatches(allResults as { agentId: string; patch?: any; error?: string }[])

  // 应用 NPC agents 的状态更新
  const updatedNpcsMap = new Map(npcResults.map(r => [r.agentId, r.updatedAgent]))
  const npcsAfterExecution = baseNext.agents.npcs.map(agent => 
    updatedNpcsMap.get(agent.genetics.seed) || agent
  )

  let next: WorldSlice = {
    ...baseNext,
    tick: baseNext.tick + patch.timeDelta,
    agents: {
      ...baseNext.agents,
      npcs: npcsAfterExecution,
    },
    events: [
      ...baseNext.events,
      ...patch.events.map((e) => ({
        id: e.id,
        type: e.kind,
        timestamp,
        payload: { summary: e.summary, conflict: e.conflict },
      })),
    ],
  }

  // Life cycle system - death and reincarnation
  const houtuConfig = createHoutuConfig()
  const houtuEvents: Array<{ id: string; type: string; timestamp: string; payload?: Record<string, unknown> }> = []
  
  // 1. 判定生死
  const updatedNpcsAfterHoutu: PersonalAgentState[] = []
  const deadAgents: PersonalAgentState[] = []
  
  for (const npc of next.agents.npcs) {
    const judgment = judgeLife(npc, next.tick, houtuConfig)
    
    if (judgment.should_die && npc.life_status === 'alive') {
      // 标记为死亡
      const dyingAgent: PersonalAgentState = {
        ...npc,
        life_status: 'dead',
        death_tick: next.tick,
        cause_of_death: judgment.reason,
        legacy: judgment.legacy,
      }
      deadAgents.push(dyingAgent)
      updatedNpcsAfterHoutu.push(dyingAgent)
      
      houtuEvents.push({
        id: `houtu-death-${next.tick}-${npc.genetics.seed}`,
        type: 'agent_death',
        timestamp,
        payload: {
          agent_seed: npc.genetics.seed,
          agent_name: npc.identity.name,
          cause: judgment.reason,
          death_type: judgment.death_type,
        },
      })
    } else {
      updatedNpcsAfterHoutu.push(npc)
    }
  }
  
  // 2. 处理轮回
  const reincarnatedAgents: PersonalAgentState[] = []
  
  for (const deadAgent of deadAgents) {
    const reincarnation = decideReincarnation(deadAgent, next.tick, houtuConfig)
    
    if (reincarnation.should_reincarnate) {
      // 创建轮回后的新 agent
      const newAgent = createPersonalAgent(`${deadAgent.genetics.seed}-reborn-${next.tick}`)
      newAgent.life_status = 'alive'
      newAgent.identity.name = `${deadAgent.identity.name}${next.config?.reborn_suffix || ' Reborn'}`
      
      // 继承部分特质
      if (reincarnation.inherited_traits) {
        if (reincarnation.inherited_traits.goals) {
          newAgent.goals = reincarnation.inherited_traits.goals
        }
        if (reincarnation.inherited_traits.relations) {
          newAgent.relations = reincarnation.inherited_traits.relations
        }
        if (reincarnation.inherited_traits.memories) {
          // 将记忆转为模糊的长期记忆
          newAgent.memory_long = reincarnation.inherited_traits.memories.map((content, idx) => ({
            id: `inherited-${next.tick}-${idx}`,
            content: `${next.config?.past_life_prefix || 'Past life: '}${content}`,
            importance: 0.3,
            emotional_weight: 0.2,
            source: 'self' as const,
            timestamp,
            decay_rate: 0.05,
            retrieval_strength: 0.4,
          }))
        }
      }
      
      reincarnatedAgents.push(newAgent)
      
      houtuEvents.push({
        id: `houtu-reincarnation-${next.tick}-${deadAgent.genetics.seed}`,
        type: 'agent_reincarnation',
        timestamp,
        payload: {
          old_seed: deadAgent.genetics.seed,
          new_seed: newAgent.genetics.seed,
          old_name: deadAgent.identity.name,
          new_name: newAgent.identity.name,
        },
      })
    }
  }
  
  // 3. 清理死亡 agents（延迟清理）
  const cleanedNpcs = updatedNpcsAfterHoutu.filter(npc => {
    if (npc.life_status === 'dead' && npc.death_tick) {
      const ticksSinceDeath = next.tick - npc.death_tick
      return ticksSinceDeath < houtuConfig.cleanup_delay
    }
    return true
  })
  
  // 4. 添加轮回的新 agents
  const finalNpcs = [...cleanedNpcs, ...reincarnatedAgents]
  
  // 更新世界状态
  next = {
    ...next,
    agents: {
      ...next.agents,
      npcs: finalNpcs,
    },
    events: [...next.events, ...houtuEvents],
  }

  // 涌现式叙事系统 - 识别叙事模式
  const narrativeRecognizer = new NarrativeRecognizer()
  
  // 1. 识别新的叙事模式（从最近 100 个事件）
  const recentEvents = next.events.slice(-100)
  const newPatterns = await narrativeRecognizer.recognizePatterns(recentEvents, next)
  
  // 2. 更新现有叙事模式（追踪发展）
  const recentEventsForTracking = next.events.slice(-10)
  const updatedPatterns = await Promise.all(
    next.narratives.patterns.map(pattern =>
      narrativeRecognizer.trackNarrativeDevelopment(pattern, recentEventsForTracking, next)
    )
  )
  
  // 3. 合并新旧模式（去重）
  const allPatterns = [...updatedPatterns, ...newPatterns]
  const uniquePatterns = allPatterns.filter((pattern, index, self) =>
    index === self.findIndex(p => p.id === pattern.id)
  )
  
  // 4. 检测故事弧
  const storyArcDetector = new StoryArcDetector()
  const detectedArcs = await storyArcDetector.detectArcs(uniquePatterns)
  
  // 5. 更新现有故事弧
  const updatedArcs = await Promise.all(
    next.narratives.arcs.map(async arc => {
      // 找到相关的新模式
      const relevantNewPatterns = uniquePatterns.filter(p =>
        p.participants.some(participant =>
          [...arc.protagonists, ...arc.antagonists, ...arc.supporting].includes(participant)
        )
      )
      
      if (relevantNewPatterns.length > 0) {
        return await storyArcDetector.updateArc(arc, relevantNewPatterns)
      }
      return arc
    })
  )
  
  // 6. 合并新旧故事弧
  const allArcs = [...updatedArcs, ...detectedArcs]
  const uniqueArcs = allArcs.filter((arc, index, self) =>
    index === self.findIndex(a => a.id === arc.id)
  )
  
  // 7. 生成叙事总结（每 10 个 tick）
  let summaries = next.narratives.summaries
  if (next.tick % 10 === 0 && uniquePatterns.length > 0) {
    const summarizer = new NarrativeSummarizer()
    const newSummary = await summarizer.summarize(uniquePatterns, next.events)
    summaries = [...summaries, newSummary]
    
    console.log(`[NarrativeSummarizer] Generated summary: "${newSummary.title}"`)
  }
  
  // 8. 更新统计信息
  const narrativeStats = {
    total_patterns: uniquePatterns.length,
    active_patterns: uniquePatterns.filter(p => 
      p.status === 'developing' || p.status === 'climax'
    ).length,
    concluded_patterns: uniquePatterns.filter(p => p.status === 'concluded').length,
    total_arcs: uniqueArcs.length,
    completed_arcs: uniqueArcs.filter(a => a.status === 'concluded').length
  }
  
  console.log(`[NarrativeSystem] Tick ${nextTick}: ${narrativeStats.active_patterns} active patterns, ${narrativeStats.total_arcs} story arcs`)
  
  // 9. 更新世界的叙事系统
  next = {
    ...next,
    narratives: {
      patterns: uniquePatterns,
      arcs: uniqueArcs,
      summaries,
      stats: narrativeStats
    }
  }
  
  // 10. 叙事影响系统 - 让叙事影响 agents
  const npcsWithNarrativeInfluence = next.agents.npcs.map(agent =>
    narrativeInfluence.applyNarrativeInfluence(agent, uniquePatterns, next)
  )
  
  // 11. 群体记忆系统 - 检测和传播群体记忆
  const newCollectiveMemories = collectiveMemory.detectCollectiveMemory(
    npcsWithNarrativeInfluence,
    next.tick
  )
  
  if (newCollectiveMemories.length > 0) {
    console.log(`[CollectiveMemory] Formed ${newCollectiveMemories.length} new collective memories`)
    
    // 传播群体记忆
    const npcsWithCollectiveMemory = collectiveMemory.propagateMemory(
      newCollectiveMemories[0],  // 传播第一个群体记忆
      npcsWithNarrativeInfluence,
      next.tick
    )
    
    // 提取文化规范
    const culturalNorms = collectiveMemory.extractCulturalNorms(
      collectiveMemory.getAllCollectiveMemories()
    )
    
    if (culturalNorms.length > 0) {
      console.log(`[CollectiveMemory] Extracted ${culturalNorms.length} cultural norms`)
    }
    
    next = {
      ...next,
      agents: {
        ...next.agents,
        npcs: npcsWithCollectiveMemory
      }
    }
  } else {
    next = {
      ...next,
      agents: {
        ...next.agents,
        npcs: npcsWithNarrativeInfluence
      }
    }
  }
  
  // 群体记忆统计
  const memoryStats = collectiveMemory.getStats()
  if (memoryStats.total_memories > 0) {
    console.log(`[CollectiveMemory] ${memoryStats.total_memories} memories, ${memoryStats.total_norms} norms`)
  }

  // 知识图谱更新：重建图谱（每个 tick）
  const updatedKnowledgeGraph = createKnowledgeGraph(next)
  const graphStats = updatedKnowledgeGraph.getStats()
  console.log(`[KnowledgeGraph] Tick ${nextTick}: ${graphStats.totalNodes} nodes, ${graphStats.totalEdges} edges`)

  // ===== Phase 4-5: 高级机制系统 =====
  
  // 1. 声誉系统 - 更新社交网络和应用衰减
  reputationSystem.updateSocialNetwork(next)
  reputationSystem.applyDecay(nextTick)
  const reputationStats = reputationSystem.getStats()
  if (nextTick % 10 === 0) {
    console.log(`[ReputationSystem] Avg trust: ${reputationStats.avg_trustworthiness.toFixed(2)}, Events: ${reputationStats.total_events}`)
  }
  
  // 2. 社会角色系统 - 为所有 agents 分配角色并写回 agent 状态
  const npcsWithRoles = next.agents.npcs.map(agent => {
    const roles = roleSystem.assignRoles(agent, next)
    roleSystem.detectRoleConflicts(agent)
    // 将主要角色写入 agent 的 narrative_roles
    const primaryRole = roles[0]
    if (primaryRole) {
      return {
        ...agent,
        narrative_roles: {
          ...agent.narrative_roles,
          [`role-${primaryRole.type}`]: {
            // Map social role to narrative role based on identity_strength and agent traits
            role: (agent.persona.agency > 0.7 && primaryRole.identity_strength > 0.5) ? 'protagonist' as const :
                  (agent.persona.empathy > 0.7) ? 'catalyst' as const :
                  (agent.persona.attachment > 0.6) ? 'supporting' as const :
                  'observer' as const,
            involvement: primaryRole.identity_strength,
            impact: primaryRole.identity_strength * 0.8,
          }
        }
      }
    }
    return agent
  })
  const roleStats = roleSystem.getStats()
  if (nextTick % 10 === 0 && roleStats.total_roles > 0) {
    console.log(`[RoleSystem] ${roleStats.total_roles} roles, ${roleStats.total_conflicts} conflicts`)
  }
  
  // 3. 资源竞争系统 - 分配资源
  const resourceResults = resourceSystem.allocateAllResources(next.agents.npcs)
  resourceSystem.regenerateResources()
  const resourceStats = resourceSystem.getStats()
  if (nextTick % 10 === 0) {
    console.log(`[ResourceSystem] Scarcity: ${resourceStats.scarcity_avg.toFixed(2)}, Claims: ${resourceStats.total_claims}`)
  }
  
  // 4. 戏剧张力系统 - 检测和累积张力
  const newTensions = tensionSystem.detectAndCreateTension(next, uniquePatterns)
  for (const tension of tensionSystem.getActiveTensions()) {
    tensionSystem.buildupTension(tension.id, next.events, nextTick)
  }
  tensionSystem.checkReleaseConditions(next, uniquePatterns)
  const overallTension = tensionSystem.calculateOverallTension(next)
  const tensionStats = tensionSystem.getStats()
  if (nextTick % 10 === 0) {
    console.log(`[TensionSystem] Overall: ${overallTension.toFixed(2)}, Active: ${tensionStats.active_tensions}, Peak: ${tensionStats.peak_tensions}`)
  }
  
  // 5. 涌现属性检测器 - 检测涌现
  const worldHistory: WorldSlice[] = []  // TODO: 维护历史窗口
  const emergentProperties = emergenceDetector.detectEmergence(next, worldHistory)
  if (emergentProperties.length > 0) {
    console.log(`[EmergenceDetector] Detected ${emergentProperties.length} emergent properties:`)
    for (const prop of emergentProperties) {
      console.log(`  - ${prop.type}: ${prop.description} (strength: ${prop.strength.toFixed(2)})`)
    }
  }
  const emergenceStats = emergenceDetector.getStats()
  if (nextTick % 10 === 0 && emergenceStats.total_detected > 0) {
    console.log(`[EmergenceDetector] Total: ${emergenceStats.total_detected}, Avg novelty: ${emergenceStats.avg_novelty.toFixed(2)}`)
  }
  
  // 6. 模因传播系统 - 提取和传播模因
  // 从 agents 提取新模因
  for (const agent of next.agents.npcs.slice(0, 5)) {  // 每次只从 5 个 agents 提取
    const newMemes = memeSystem.extractMemesFromAgent(agent, nextTick)
  }
  
  // 传播现有模因
  const socialNetwork = new Map<string, Set<string>>()
  for (const agent of next.agents.npcs) {
    const friends = new Set<string>()
    for (const [target, value] of Object.entries(agent.relations)) {
      if (value > 0.3) friends.add(target)
    }
    socialNetwork.set(agent.genetics.seed, friends)
  }
  
  const allMemes = Array.from(memeSystem.getAllMemes().values())
  for (const meme of allMemes.slice(0, 10)) {  // 每次只传播 10 个模因
    memeSystem.propagateMeme(meme, socialNetwork, next.agents.npcs, nextTick)
  }
  
  // 模因衰减
  memeSystem.decayMemes(nextTick)
  
  const memeStats = memeSystem.getStats()
  if (nextTick % 10 === 0 && memeStats.total_memes > 0) {
    console.log(`[MemeSystem] Memes: ${memeStats.total_memes}, Transmissions: ${memeStats.successful_transmissions}, Mutation rate: ${(memeStats.mutation_rate * 100).toFixed(1)}%`)
  }
  
  // 7. 注意力机制 - 分配注意力 + 接入推荐系统
  const npcsWithAttention = await Promise.all(next.agents.npcs.map(async agent => {
    // 推荐系统为 agent 推荐事件
    const recommendedEvents = await recSystem.recommendEvents(agent, next)

    // 将推荐事件转为刺激
    const recStimuli = recommendedEvents.slice(0, 3).map(evt =>
      attentionMechanism.createStimulus('event', evt.id, `Recommended: ${evt.type}`, {
        salience: 0.8,
        urgency: 0.7,
        relevance: 0.9,
      })
    )

    const worldStimuli = attentionMechanism.generateStimuliFromWorld(next, agent)
    const allStimuli = [...recStimuli, ...worldStimuli]
    const allocations = attentionMechanism.allocateAttention(agent, allStimuli, nextTick)

    // 如果在休息，恢复注意力
    if (agent.vitals.energy > 0.7 && agent.vitals.stress < 0.3) {
      attentionMechanism.recoverAttention(agent)
    }

    // 将注意力分配结果写回 agent 的 focus
    const topFocus = allocations[0]
    const focusBoost = topFocus ? topFocus.weight * 0.1 : 0
    return {
      ...agent,
      vitals: {
        ...agent.vitals,
        focus: Math.min(1, agent.vitals.focus + focusBoost),
      },
    }
  }))
  
  const attentionStats = attentionMechanism.getStats()
  if (nextTick % 10 === 0) {
    console.log(`[AttentionMechanism] Avg focus: ${attentionStats.avg_focus_count.toFixed(1)}/${attentionStats.avg_capacity.toFixed(1)}, Fatigue: ${(attentionStats.avg_fatigue * 100).toFixed(1)}%`)
  }
  
  // 8. 分层记忆系统 - 为每个 agent 管理记忆（按需初始化）
  for (const agent of next.agents.npcs) {
    if (!globalMemorySystems.has(agent.genetics.seed)) {
      const memorySystem = new HierarchicalMemorySystem()
      memorySystem.migrateFromAgent(agent, nextTick)
      globalMemorySystems.set(agent.genetics.seed, memorySystem)
    }
    
    const memorySystem = globalMemorySystems.get(agent.genetics.seed)!
    
    // 应用衰减和巩固
    memorySystem.applyDecay(nextTick)
    
    // 导出回 agent（保持兼容性）
    const exported = memorySystem.exportToAgent()
    agent.memory_short = exported.memory_short
    agent.memory_long = exported.memory_long
  }
  
  // 记忆系统统计（采样）
  if (nextTick % 10 === 0 && globalMemorySystems.size > 0) {
    const sampleSystem = Array.from(globalMemorySystems.values())[0]
    const memStats = sampleSystem.getStats()
    console.log(`[MemorySystem] WM: ${memStats.working_memory.count}/${memStats.working_memory.capacity}, STM: ${memStats.short_term_memory.count}/${memStats.short_term_memory.capacity}, LTM: ${memStats.long_term_memory.count}`)
  }
  
  // 更新 next 的 agents + 导出所有系统状态到 next.systems
  next = {
    ...next,
    agents: {
      ...next.agents,
      npcs: npcsWithAttention
    },
    systems: exportSystemsState(updatedKnowledgeGraph),
  }

  // ===== Auto-spawn new agents when population drops =====
  // 触发条件：NPC 死亡导致人数不足 / 每 20 tick 检查一次是否需要新势力
  const aliveCount = next.agents.npcs.filter(a => a.life_status === 'alive').length
  const shouldSpawn = (
    // 有人死了，人数低于初始的 70%
    (aliveCount < 10 && nextTick > 5) ||
    // 每 20 tick 有 30% 概率引入新角色（模拟外来者/新势力）
    (nextTick % 20 === 0 && Math.random() < 0.3 && aliveCount < 25)
  )

  if (shouldSpawn) {
    try {
      const spawnCount = aliveCount < 5 ? 3 : aliveCount < 10 ? 2 : 1
      console.log(`[AutoSpawn] Tick ${nextTick}: spawning ${spawnCount} new agents (alive: ${aliveCount})`)

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const existingNames = next.agents.npcs
        .filter(a => a.life_status === 'alive')
        .map(a => `${a.identity.name} (${a.occupation || 'unknown'})`)
        .join(', ')
      const recentEvents = next.social_context.macro_events.slice(-5).join('; ')
      const deadNames = next.agents.npcs
        .filter(a => a.life_status === 'dead')
        .map(a => `${a.identity.name} (${a.cause_of_death || 'deceased'})`)
        .join(', ')

      const res = await fetch(`${baseUrl}/api/agents/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${next.environment.description}\n\nExisting characters: ${existingNames}\n${deadNames ? `Deceased: ${deadNames}` : ''}\nRecent major events: ${recentEvents || 'The world has just begun'}\n\nGenerate ${spawnCount} new character(s). **Important: their appearance must have a narrative reason**, for example:\n- An old friend/enemy/descendant of a deceased character, arriving after hearing the news\n- An outsider drawn by recent events\n- Someone who has been hiding nearby and is forced to emerge due to changing circumstances\n- A figure from an existing character's past with unfinished business\n\nTheir backstory must explain "why they appear now" and they must have relationships with at least 2 existing characters. Do not create characters out of thin air.\n\n**Language: Generate all content in the same language as the world description above.**`,
          count: spawnCount,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const newAgents = data.agents || []
        if (newAgents.length > 0) {
          next = {
            ...next,
            agents: {
              ...next.agents,
              npcs: [...next.agents.npcs, ...newAgents],
            },
            events: [
              ...next.events,
              ...newAgents.map((a: PersonalAgentState) => ({
                id: `spawn-${nextTick}-${a.genetics.seed}`,
                type: 'agent_spawn',
                timestamp,
                payload: {
                  agent_name: a.identity.name,
                  summary: `${a.identity.name} (${a.occupation || 'unknown'}) has arrived in this world`,
                },
              })),
            ],
          }
          console.log(`[AutoSpawn] Created: ${newAgents.map((a: PersonalAgentState) => a.identity.name).join(', ')}`)
        }
      }
    } catch (error) {
      console.warn('[AutoSpawn] Failed:', (error as Error).message)
    }
  }

  // ===== 世界状态演进 - 让事件反馈到世界 =====
  next = evolveWorldState(next, patch)

  // ===== Tick 总结 — 收集所有 agent 本轮行为描述 =====
  const tickBehaviors = npcResults
    .map(r => {
      const agent = next.agents.npcs.find(a => a.genetics.seed === r.agentId)
      return agent?.last_action_description
    })
    .filter(Boolean)

  if (tickBehaviors.length > 0) {
    next = {
      ...next,
      tick_summary: tickBehaviors.join('\n'),
    }
  }

  await bus.emit('after_tick', { world: next })

  return next
}
