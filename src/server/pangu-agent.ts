import type { PanguAgent } from '@/domain/agents'
import type { WorldSlice } from '@/domain/world'
import { generateStorylineEvent } from './llm/pangu-director'

/**
 * Story Director Agent
 * Observes world state and generates events to drive the narrative forward
 */
export const panguDirectorAgent: PanguAgent = {
  id: 'story-director',
  role: 'macro',
  run: async (world: unknown) => {
    const worldSlice = world as WorldSlice
    
    // 每 3 个 tick 运行一次，避免过于频繁
    if (worldSlice.tick % 3 !== 0) {
      return {
        timeDelta: 0,
        events: [],
        rulesDelta: [],
        notes: ['Story director skipped this tick'],
        meta: {},
      }
    }
    
    console.log(`[StoryDirector] Running at tick ${worldSlice.tick}`)
    
    // 生成故事线事件
    const patch = await generateStorylineEvent(worldSlice)
    
    console.log(`[StoryDirector] Generated event:`, patch.events?.[0]?.summary || 'none')
    
    return patch
  },
}
