import { describe, it, expect } from 'vitest'
import { computePairPressure } from './conversation-scene'
import type { PersonalAgentState, WorldSlice } from '../domain/world'
import { createPersonalAgent } from '../domain/agents'

function makeAgent(seed: string, overrides?: Partial<PersonalAgentState>): PersonalAgentState {
  return { ...createPersonalAgent(seed), ...overrides } as PersonalAgentState
}

describe('computePairPressure', () => {
  it('returns zero pressure for unrelated agents', () => {
    const a = makeAgent('a')
    const b = makeAgent('b')
    const result = computePairPressure(a, b, {} as WorldSlice)
    expect(result.pressure_score).toBe(0)
  })

  it('returns high pressure for strong negative relationship', () => {
    const a = makeAgent('a', { relations: { b: -0.8 } })
    const b = makeAgent('b', { relations: { a: -0.6 } })
    const result = computePairPressure(a, b, {} as WorldSlice)
    expect(result.pressure_score).toBeGreaterThan(0)
    expect(result.type).toBe('relationship')
  })

  it('returns high pressure for strong positive relationship', () => {
    const a = makeAgent('a', { relations: { b: 0.9 } })
    const b = makeAgent('b', { relations: { a: 0.85 } })
    const result = computePairPressure(a, b, {} as WorldSlice)
    expect(result.pressure_score).toBeGreaterThan(0)
    expect(result.type).toBe('relationship')
  })

  it('picks the highest pressure signal as the trigger type', () => {
    const a = makeAgent('a', {
      relations: { b: -0.9 },
      narrative_roles: { 'n1': { role: 'protagonist', involvement: 0.8, impact: 0.7 } },
    })
    const b = makeAgent('b', {
      relations: { a: -0.7 },
      narrative_roles: { 'n1': { role: 'antagonist', involvement: 0.9, impact: 0.8 } },
    })
    const world = {
      narratives: {
        patterns: [
          { id: 'n1', participants: ['a', 'b'], status: 'climax', intensity: 0.9, type: 'conflict' },
        ],
      },
    } as unknown as WorldSlice
    const result = computePairPressure(a, b, world)
    expect(result.pressure_score).toBeGreaterThan(0)
    expect(['relationship', 'narrative']).toContain(result.type)
  })
})
