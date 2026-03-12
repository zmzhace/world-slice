import { createHookBus } from './hooks'
import { applyMemoryDecay } from './memory'
import { updateVitalsAfterTick } from './vitals'
import { applyPersonaDrift } from './persona'
import { mapSearchResultsToSocialContext } from '@/server/search/mapper'
import type { AgentAction } from '@/domain/actions'
import type { WorldSlice } from '@/domain/world'
import type { SearchSignal } from '@/domain/search'
import { arbitratePatches } from './arbiter'

type OrchestratorOptions = {
  search?: () => Promise<SearchSignal[]>
  panguRegistry?: { runAll: (world: WorldSlice) => Promise<{ agentId: string; patch?: unknown; error?: string }[]> }
}

export async function runWorldTick(world: WorldSlice, options: OrchestratorOptions = {}): Promise<WorldSlice> {
  const bus = createHookBus()
  await bus.emit('before_tick', { world })

  const nextTick = world.tick + 1
  const timestamp = new Date(Date.parse(world.time) + 1000).toISOString()

  const updatedMemoryShort = applyMemoryDecay(world.agents.personal.memory_short)
  const updatedMemoryLong = applyMemoryDecay(world.agents.personal.memory_long)
  const updatedVitals = updateVitalsAfterTick(world.agents.personal.vitals)
  const updatedPersona = applyPersonaDrift(world.agents.personal.persona, [])

  const searchResults = options.search ? await options.search() : []
  const mappedContext = searchResults.length
    ? mapSearchResultsToSocialContext(searchResults)
    : world.social_context

  const action: AgentAction = { type: 'reflect', intensity: 0.5 }

  await bus.emit('before_action', { action })
  await bus.emit('after_action', { action })

  const event = {
    id: `event-${nextTick}`,
    type: 'tick',
    timestamp,
  }

  const baseNext: WorldSlice = {
    ...world,
    tick: nextTick,
    time: timestamp,
    social_context: mappedContext,
    events: [...world.events, event],
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
    },
  }

  if (!options.panguRegistry) {
    await bus.emit('after_tick', { world: baseNext })
    return baseNext
  }

  const results = await options.panguRegistry.runAll(world)
  const patch = arbitratePatches(results as { agentId: string; patch?: any; error?: string }[])

  const next: WorldSlice = {
    ...baseNext,
    tick: baseNext.tick + patch.timeDelta,
    events: [...baseNext.events, ...patch.events],
  }

  await bus.emit('after_tick', { world: next })

  return next
}
