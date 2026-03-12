import { describe, it, expect, beforeEach } from 'vitest'
import { createWorld, updateWorld, getWorld, listWorlds } from './worlds'

beforeEach(() => {
  localStorage.clear()
})

describe('worlds store', () => {
  it('creates and retrieves a world', () => {
    const world = createWorld({ worldPrompt: 'ocean world' })
    const loaded = getWorld(world.id)
    expect(loaded?.worldPrompt).toBe('ocean world')
  })

  it('updates a world', () => {
    const world = createWorld({ worldPrompt: 'forest' })
    updateWorld(world.id, { personaPrompt: 'ranger' })
    const loaded = getWorld(world.id)
    expect(loaded?.personaPrompt).toBe('ranger')
  })

  it('lists worlds in reverse chronological order', () => {
    const a = createWorld({ worldPrompt: 'a' })
    const b = createWorld({ worldPrompt: 'b' })
    const list = listWorlds()
    expect(list[0].id).toBe(b.id)
    expect(list[1].id).toBe(a.id)
  })
})
