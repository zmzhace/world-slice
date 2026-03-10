import { createHookBus } from './hooks'
import { applyMemoryDecay } from './memory'
import { updateVitalsAfterTick } from './vitals'
import { applyPersonaDrift } from './persona'
import type { AgentAction } from '@/domain/actions'
import type { WorldSlice } from '@/domain/world'

export async function runWorldTick(world: WorldSlice): Promise<WorldSlice> {
  const bus = createHookBus()
  await bus.emit('before_tick', { world })

  const nextTick = world.tick + 1
  const timestamp = new Date(Date.parse(world.time) + 1000).toISOString()

  const updatedMemoryShort = applyMemoryDecay(world.agents.personal.memory_short)
  const updatedMemoryLong = applyMemoryDecay(world.agents.personal.memory_long)
  const updatedVitals = updateVitalsAfterTick(world.agents.personal.vitals)
  const updatedPersona = applyPersonaDrift(world.agents.personal.persona, [])

  const action: AgentAction = { type: 'reflect', intensity: 0.5 }

  await bus.emit('before_action', { action })
  await bus.emit('after_action', { action })

  const event = {
    id: `event-${nextTick}`,
    type: 'tick',
    timestamp,
  }

  const next: WorldSlice = {
    ...world,
    tick: nextTick,
    time: timestamp,
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

  await bus.emit('after_tick', { world: next })

  return next
}
