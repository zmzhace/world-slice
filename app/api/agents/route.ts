import { NextResponse } from 'next/server'
import { createNuwaConfig } from '@/domain/nuwa'
import { registerPanguAgent } from '@/server/pangu'
import { summarizeObservation } from '@/server/llm/anthropic'

export async function POST(request: Request) {
  const body = await request.json()
  const prompt = String(body?.prompt ?? '')

  const summary = await summarizeObservation({ prompt, world: {} })
  const names = summary
    .split(/[,;\n]+/)
    .map((name) => name.trim())
    .filter(Boolean)

  const agents = names.map((name, index) =>
    createNuwaConfig({
      race: 'coastal',
      gender: index % 2 === 0 ? 'female' : 'male',
      goals: ['survival'],
      genetics: { seed: name },
      environment_signature: { region: 'coastal', social_state: 'neutral' },
      traits: { openness: 0.5, stability: 0.5, attachment: 0.5, agency: 0.5, empathy: 0.5 },
    }),
  )

  for (const agent of agents) {
    registerPanguAgent({
      id: agent.genetics.seed as string,
      role: 'other',
      run: async () => ({ events: [] }),
    })
  }

  return NextResponse.json({ agents })
}
