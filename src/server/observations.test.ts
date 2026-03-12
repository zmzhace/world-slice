import { describe, expect, it, vi } from 'vitest'
import { POST } from '../../app/api/observations/route'

vi.mock('@/server/llm/anthropic', () => ({
  summarizeObservation: vi.fn(async () => 'summary text'),
}))

it('returns observation summary', async () => {
  const req = new Request('http://localhost/api/observations', {
    method: 'POST',
    body: JSON.stringify({ prompt: 'observe', world: { tick: 1 } }),
  })
  const res = await POST(req)
  const json = await res.json()
  expect(json.summary).toBe('summary text')
})
