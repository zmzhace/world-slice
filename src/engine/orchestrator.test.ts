import { describe, it, expect } from 'vitest'
import { createInitialWorldSlice } from '@/domain/world'
import { runWorldTick } from './orchestrator'

it('advances the world by one tick and appends an event', async () => {
  const world = createInitialWorldSlice()
  const next = await runWorldTick(world)

  expect(next.tick).toBe(1)
  expect(next.events.length).toBeGreaterThan(0)
  expect(next.agents.personal.action_history.length).toBe(1)
})
