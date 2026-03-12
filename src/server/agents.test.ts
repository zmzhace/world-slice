import { describe, expect, it, vi } from 'vitest'
import { POST } from '../../app/api/agents/route'

vi.mock('@/server/llm/anthropic', () => ({
  summarizeObservation: vi.fn(async () => 'agent-1;agent-2'),
}))

it('returns generated agents from prompt', async () => {
  const req = new Request('http://localhost/api/agents', {
    method: 'POST',
    body: JSON.stringify({ prompt: 'create 2 agents' }),
  })
  const res = await POST(req)
  const json = await res.json()
  expect(json.agents.length).toBe(2)
})
