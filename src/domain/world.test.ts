import { describe, it, expect } from 'vitest'
import { createInitialWorldSlice } from './world'

describe('createInitialWorldSlice', () => {
  it('creates a single-user world with core agents and empty event history', () => {
    const world = createInitialWorldSlice()

    expect(world.tick).toBe(0)
    expect(world.agents.director.kind).toBe('world')
    expect(world.agents.creator.kind).toBe('persona')
    expect(world.agents.personal.kind).toBe('personal')
    expect(world.agents.social.kind).toBe('social')
    expect(world.events).toEqual([])
  })
})
