import { NextResponse } from 'next/server'
import { generateInitialWorld } from '@/server/llm/world-generator'
import { generatePersonalAgents } from '@/server/llm/agent-generator'

/**
 * Full world initialization flow (emergent):
 * 1. Generate initial world state
 * 2. Create initial agents
 * 3. Let agents interact freely, stories emerge naturally
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const worldPrompt = String(body?.worldPrompt ?? '')
    const worldId = String(body?.worldId ?? '')

    if (!worldPrompt.trim()) {
      return NextResponse.json(
        { error: 'worldPrompt is required' },
        { status: 400 }
      )
    }

    console.log('=== World initialization (emergent) ===')
    console.log('1. Generating world...')

    // 1. Generate world
    const world = await generateInitialWorld({ worldPrompt })
    if (worldId) {
      world.world_id = worldId
    }

    console.log('✓ World generated')
    console.log('2. Creating agents...')

    // 2. Create agents via LLM (10 agents in batches of 5)
    const agentCount = 10
    console.log(`Generating ${agentCount} agents in batches...`)
    const newAgents = await generatePersonalAgents({
      prompt: `${world.environment.description}\n\nSocial context: ${JSON.stringify(world.social_context)}`,
      count: agentCount,
    })

    console.log(`✓ Created ${newAgents.length} agents`)

    world.agents.npcs = newAgents

    world.events.push({
      id: `init-complete-${Date.now()}`,
      type: 'world_initialized',
      timestamp: new Date().toISOString(),
      payload: {
        agent_count: newAgents.length,
        agent_names: newAgents.map(a => a.identity.name),
        initialization_type: 'emergent',
      },
    })

    console.log('=== World initialization complete ===')

    return NextResponse.json({
      success: true,
      world,
      summary: {
        agents_count: newAgents.length,
        agent_names: newAgents.map(a => a.identity.name),
        initialization_type: 'emergent',
        message: 'World created. Agents will interact freely and stories will emerge.',
      },
    })
  } catch (error) {
    console.error('Failed to initialize world:', error)
    return NextResponse.json(
      { error: 'Failed to initialize world: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
