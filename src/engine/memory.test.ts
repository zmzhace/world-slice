import { describe, it, expect } from 'vitest'
import { applyMemoryDecay } from './memory'

it('reduces retrieval strength over time without deleting the memory', () => {
  const [memory] = applyMemoryDecay([
    {
      id: 'm1',
      content: 'old memory',
      importance: 0.8,
      emotional_weight: 0.4,
      source: 'self',
      timestamp: '2026-03-01T00:00:00.000Z',
      decay_rate: 0.1,
      retrieval_strength: 1,
    },
  ])

  expect(memory.retrieval_strength).toBeLessThan(1)
  expect(memory.content).toBe('old memory')
})
