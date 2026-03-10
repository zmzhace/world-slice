import { describe, it, expect } from 'vitest'
import { createInitialWorldSlice } from '@/domain/world'
import { saveWorldSlice, loadWorldSlice } from './persistence'

it('saves and reloads the world slice from disk', async () => {
  const world = createInitialWorldSlice()
  await saveWorldSlice(world)
  const loaded = await loadWorldSlice()
  expect(loaded?.world_id).toBe(world.world_id)
})
