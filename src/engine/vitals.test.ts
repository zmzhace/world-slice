import { describe, it, expect } from 'vitest'
import { updateVitalsAfterTick } from './vitals'

it('increases aging and preserves numeric bounds', () => {
  const vitals = updateVitalsAfterTick({
    energy: 0.8,
    stress: 0.2,
    sleep_debt: 0.1,
    focus: 0.7,
    aging_index: 0.3,
  })

  expect(vitals.aging_index).toBeGreaterThan(0.3)
  expect(vitals.energy).toBeGreaterThanOrEqual(0)
  expect(vitals.energy).toBeLessThanOrEqual(1)
})
