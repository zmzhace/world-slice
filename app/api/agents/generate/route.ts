import { NextResponse } from 'next/server'
import { generatePersonalAgents } from '@/server/llm/agent-generator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const prompt = String(body?.prompt ?? '')
    const count = Number(body?.count ?? 1)
    const worldContext = body?.worldContext  // 世界背景上下文
    
    if (!prompt.trim()) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      )
    }

    if (count < 1 || count > 30) {
      return NextResponse.json(
        { error: 'count must be between 1 and 30' },
        { status: 400 }
      )
    }

    console.log('Generating agents with prompt:', prompt, 'count:', count)
    
    // 构建包含世界背景的完整 prompt
    let fullPrompt = prompt
    if (worldContext) {
      fullPrompt = `世界背景：
环境：${worldContext.environment?.description || '未知'}
社会背景：${JSON.stringify(worldContext.social_context || {})}
核心叙事：${worldContext.narrative_seed || ''}

基于以上世界背景，生成以下人物：
${prompt}

要求：
1. 人物的目标应该与世界背景相关
2. 人物应该了解世界的社会结构和主要机构
3. 人物的性格应该受到世界环境的影响`
    }
    
    // Call Nuwa to generate agents
    const agents = await generatePersonalAgents({ prompt: fullPrompt, count })
    
    console.log('Agents generated:', agents.length)
    
    return NextResponse.json({
      success: true,
      agents,
    })
  } catch (error) {
    console.error('Failed to generate agents:', error)
    return NextResponse.json(
      { error: 'Failed to generate agents: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
