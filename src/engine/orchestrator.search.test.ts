import { describe, it, expect } from 'vitest'
import { createInitialWorldSlice } from '@/domain/world'
import { runWorldTick } from '@/engine/orchestrator'

it('can incorporate mapped search context during a tick', async () => {
  const world = createInitialWorldSlice()
  const next = await runWorldTick(world, {
    search: async () => [{ title: 'Economic update', summary: 'anxious market', url: 'https://example.com' }],
  })

  expect(next.social_context.narratives.length).toBeGreaterThan(0)
})
