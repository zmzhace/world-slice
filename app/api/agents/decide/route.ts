import { NextResponse } from 'next/server'
import { generateAgentDecisionViaLLM } from '@/server/llm/agent-decision-llm'
import type { PersonalAgentState, WorldSlice } from '@/domain/world'

/**
 * POST /api/agents/decide
 * 为单个 agent 通过 LLM 生成决策
 * Body: { agent: PersonalAgentState, world: WorldSlice }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { agent, world, thisTickContext } = body as { agent: PersonalAgentState; world: WorldSlice; thisTickContext?: string }

    if (!agent || !world) {
      return NextResponse.json(
        { error: 'agent and world are required' },
        { status: 400 }
      )
    }

    const result = await generateAgentDecisionViaLLM(agent, world, thisTickContext)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error(`[API] Agent decision failed:`, (error as Error).message)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}
