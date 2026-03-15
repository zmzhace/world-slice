import { NextResponse } from 'next/server'
import { generateSingleAgent } from '@/server/llm/agent-generator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const prompt = String(body?.prompt ?? '')
    const worldContext = body?.worldContext
    const existingAgents: { seed: string; name: string; occupation?: string }[] = body?.existingAgents ?? []

    if (!prompt.trim()) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      )
    }

    // Build world context string from structured data
    let worldContextStr = ''
    if (worldContext) {
      const parts: string[] = []
      if (worldContext.environment?.description) {
        parts.push(`Environment: ${worldContext.environment.description}`)
      }
      if (worldContext.social_context) {
        parts.push(`Social context: ${JSON.stringify(worldContext.social_context)}`)
      }
      if (worldContext.narrative_seed) {
        parts.push(`Core narrative: ${worldContext.narrative_seed}`)
      }
      worldContextStr = parts.join('\n')
    }

    console.log('Generating single agent with prompt:', prompt)

    const agent = await generateSingleAgent({
      description: prompt,
      worldContext: worldContextStr,
      existingAgents,
    })

    console.log('Agent generated:', agent.identity.name)

    return NextResponse.json({
      success: true,
      agent,
    })
  } catch (error) {
    console.error('Failed to generate agent:', error)
    return NextResponse.json(
      { error: 'Failed to generate agent: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
