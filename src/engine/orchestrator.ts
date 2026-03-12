import { createHookBus } from './hooks'
import { createNuwaService } from './nuwa-service'
import { applyMemoryDecay } from './memory'
import { updateVitalsAfterTick } from './vitals'
import { applyPersonaDrift } from './persona'
import { mapSearchResultsToSocialContext } from '@/server/search/mapper'
import { executeNpcAgents } from './npc-agent-executor'
import type { AgentAction } from '@/domain/actions'
import type { WorldSlice } from '@/domain/world'
import type { SearchSignal } from '@/domain/search'
import { arbitratePatches } from './arbiter'

type OrchestratorOptions = {
  search?: () => Promise<SearchSignal[]>
  nuwa?: { trigger: 'event'; seed: string; environment: { region: string; social_state: string } }
  panguRegistry?: { runAll: (world: WorldSlice) => Promise<{ agentId: string; patch?: unknown; error?: string }[]> }
}

export async function runWorldTick(world: WorldSlice, options: OrchestratorOptions = {}): Promise<WorldSlice> {
  const bus = createHookBus()
  await bus.emit('before_tick', { world })

  const nextTick = world.tick + 1
  const timestamp = new Date(Date.parse(world.time) + 1000).toISOString()

  // Parallel update for personal agent
  const updatedMemoryShort = applyMemoryDecay(world.agents.personal.memory_short)
  const updatedMemoryLong = applyMemoryDecay(world.agents.personal.memory_long)
  const updatedVitals = updateVitalsAfterTick(world.agents.personal.vitals)
  const updatedPersona = applyPersonaDrift(world.agents.personal.persona, [])

  // Parallel update for all NPC agents
  const updatedNpcs = await Promise.all(
    world.agents.npcs.map(async (npc) => ({
      ...npc,
      memory_short: applyMemoryDecay(npc.memory_short),
      memory_long: applyMemoryDecay(npc.memory_long),
      vitals: updateVitalsAfterTick(npc.vitals),
      persona: applyPersonaDrift(npc.persona, []),
    }))
  )

  const searchResults = options.search ? await options.search() : []
  const mappedContext = searchResults.length
    ? mapSearchResultsToSocialContext(searchResults)
    : world.social_context

  const action: AgentAction = { type: 'reflect', intensity: 0.5 }

  await bus.emit('before_action', { action })
  await bus.emit('after_action', { action })

  const events = [...world.events]

  if (options.nuwa) {
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
    nuwa.createAgent(options.nuwa)
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

  if (!options.panguRegistry) {
    await bus.emit('after_tick', { world: baseNext })
    return baseNext
  }

  // 并行执行 Pangu agents 和 NPC agents
  const [panguResults, npcResults] = await Promise.all([
    options.panguRegistry.runAll(world),
    executeNpcAgents(world),
  ])

  // 合并所有 agent 的结果
  const allResults = [
    ...panguResults,
    ...npcResults.map(r => ({ agentId: r.agentId, patch: r.patch })),
  ]

  const patch = arbitratePatches(allResults as { agentId: string; patch?: any; error?: string }[])

  const next: WorldSlice = {
    ...baseNext,
    tick: baseNext.tick + patch.timeDelta,
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

  await bus.emit('after_tick', { world: next })

  return next
}
