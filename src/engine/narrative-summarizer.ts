/**
 * 叙事总结器 - 将事件流和叙事模式总结为连贯的叙事文本
 * 类似 StoryBox 的 Storyteller Agent，但不控制走向
 */

import type {
  NarrativePattern,
  NarrativeSummary,
  StoryArc
} from '@/domain/narrative'
import type { WorldSlice } from '@/domain/world'

export class NarrativeSummarizer {
  /**
   * 生成叙事总结
   */
  async summarize(
    patterns: NarrativePattern[],
    events: WorldSlice['events'],
    options: {
      perspective?: 'omniscient' | 'character' | 'observer'
      character_pov?: string
      max_words?: number
    } = {}
  ): Promise<NarrativeSummary> {
    const {
      perspective = 'omniscient',
      character_pov,
      max_words = 500
    } = options
    
    if (patterns.length === 0) {
      return this.createEmptySummary(perspective, character_pov)
    }
    
    // 1. 按时间排序模式
    const sorted = patterns.sort((a, b) => a.started_at - b.started_at)
    
    // 2. 生成叙事文本
    const content = await this.generateNarrativeText(
      sorted,
      events,
      perspective,
      character_pov,
      max_words
    )
    
    // 3. 生成标题
    const title = this.generateTitle(sorted)
    
    // 4. 计算范围
    const tick_range: [number, number] = [
      sorted[0].started_at,
      sorted[sorted.length - 1].updated_at
    ]
    
    const summary: NarrativeSummary = {
      id: `summary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      content,
      tick_range,
      patterns: sorted.map(p => p.id),
      arcs: [],  // 将由调用者填充
      perspective,
      character_pov,
      word_count: content.split(/\s+/).length,
      generated_at: Date.now(),
      version: 1
    }
    
    return summary
  }
  
  /**
   * 从故事弧生成总结
   */
  async summarizeArc(
    arc: StoryArc,
    events: WorldSlice['events'],
    options: {
      perspective?: 'omniscient' | 'character' | 'observer'
      character_pov?: string
    } = {}
  ): Promise<NarrativeSummary> {
    const { perspective = 'omniscient', character_pov } = options
    
    // 收集所有模式
    const allPatterns = [
      ...arc.structure.setup,
      ...arc.structure.rising,
      ...arc.structure.climax,
      ...arc.structure.falling,
      ...arc.structure.resolution
    ]
    
    // 生成分章节的叙事
    const content = await this.generateArcNarrative(arc, events, perspective, character_pov)
    
    const summary: NarrativeSummary = {
      id: `summary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: arc.title,
      content,
      tick_range: [arc.started_at, arc.updated_at],
      patterns: allPatterns.map(p => p.id),
      arcs: [arc.id],
      perspective,
      character_pov,
      word_count: content.split(/\s+/).length,
      generated_at: Date.now(),
      version: 1
    }
    
    return summary
  }
  
  /**
   * 生成叙事文本
   */
  private async generateNarrativeText(
    patterns: NarrativePattern[],
    events: WorldSlice['events'],
    perspective: 'omniscient' | 'character' | 'observer',
    character_pov: string | undefined,
    max_words: number
  ): Promise<string> {
    const paragraphs: string[] = []
    
    for (const pattern of patterns) {
      const paragraph = this.generatePatternNarrative(
        pattern,
        events,
        perspective,
        character_pov
      )
      paragraphs.push(paragraph)
    }
    
    let content = paragraphs.join('\n\n')
    
    // 限制字数
    const words = content.split(/\s+/)
    if (words.length > max_words) {
      content = words.slice(0, max_words).join(' ') + '...'
    }
    
    return content
  }
  
  /**
   * 为单个叙事模式生成叙事文本
   */
  private generatePatternNarrative(
    pattern: NarrativePattern,
    events: WorldSlice['events'],
    perspective: 'omniscient' | 'character' | 'observer',
    character_pov: string | undefined
  ): string {
    const { type, participants, intensity, sentiment, status } = pattern
    
    // 根据叙事类型选择模板
    const templates = this.getNarrativeTemplates(type)
    
    // 根据视角调整叙述
    const narrator = this.getNarratorVoice(perspective, character_pov)
    
    // 生成基础叙事
    let narrative = templates.base
      .replace('{participants}', this.formatParticipants(participants))
      .replace('{intensity}', this.describeIntensity(intensity))
      .replace('{sentiment}', this.describeSentiment(sentiment))
      .replace('{narrator}', narrator)
    
    // 根据状态添加进展描述
    if (status === 'climax') {
      narrative += ' ' + templates.climax
    } else if (status === 'resolving') {
      narrative += ' ' + templates.resolving
    } else if (status === 'concluded') {
      narrative += ' ' + templates.concluded
    }
    
    return narrative
  }
  
  /**
   * 生成故事弧叙事（分章节）
   */
  private async generateArcNarrative(
    arc: StoryArc,
    events: WorldSlice['events'],
    perspective: 'omniscient' | 'character' | 'observer',
    character_pov: string | undefined
  ): Promise<string> {
    const sections: string[] = []
    
    // 铺垫
    if (arc.structure.setup.length > 0) {
      sections.push('## 序幕\n\n' + this.generateSectionNarrative(
        arc.structure.setup,
        events,
        perspective,
        character_pov
      ))
    }
    
    // 上升
    if (arc.structure.rising.length > 0) {
      sections.push('## 发展\n\n' + this.generateSectionNarrative(
        arc.structure.rising,
        events,
        perspective,
        character_pov
      ))
    }
    
    // 高潮
    if (arc.structure.climax.length > 0) {
      sections.push('## 高潮\n\n' + this.generateSectionNarrative(
        arc.structure.climax,
        events,
        perspective,
        character_pov
      ))
    }
    
    // 下降
    if (arc.structure.falling.length > 0) {
      sections.push('## 转折\n\n' + this.generateSectionNarrative(
        arc.structure.falling,
        events,
        perspective,
        character_pov
      ))
    }
    
    // 解决
    if (arc.structure.resolution.length > 0) {
      sections.push('## 尾声\n\n' + this.generateSectionNarrative(
        arc.structure.resolution,
        events,
        perspective,
        character_pov
      ))
    }
    
    return sections.join('\n\n')
  }
  
  /**
   * 生成章节叙事
   */
  private generateSectionNarrative(
    patterns: NarrativePattern[],
    events: WorldSlice['events'],
    perspective: 'omniscient' | 'character' | 'observer',
    character_pov: string | undefined
  ): string {
    return patterns
      .map(p => this.generatePatternNarrative(p, events, perspective, character_pov))
      .join(' ')
  }
  
  /**
   * 获取叙事模板
   */
  private getNarrativeTemplates(type: NarrativePattern['type']): {
    base: string
    climax: string
    resolving: string
    concluded: string
  } {
    const templates: Record<string, any> = {
      conflict: {
        base: '{participants}之间的冲突{intensity}展开，气氛{sentiment}。',
        climax: '冲突达到了白热化的程度。',
        resolving: '紧张局势开始缓和。',
        concluded: '冲突最终得到了解决。'
      },
      alliance: {
        base: '{participants}形成了{intensity}的联盟，关系{sentiment}。',
        climax: '联盟关系达到了最紧密的状态。',
        resolving: '联盟开始面临考验。',
        concluded: '联盟关系稳定下来。'
      },
      romance: {
        base: '{participants}之间产生了{intensity}的情感，氛围{sentiment}。',
        climax: '情感达到了最浓烈的时刻。',
        resolving: '情感开始趋于平静。',
        concluded: '情感关系尘埃落定。'
      },
      betrayal: {
        base: '{participants}之间出现了{intensity}的背叛，信任{sentiment}。',
        climax: '背叛的真相完全暴露。',
        resolving: '背叛的后果逐渐显现。',
        concluded: '背叛事件画上了句号。'
      },
      discovery: {
        base: '{participants}发现了{intensity}的秘密，反应{sentiment}。',
        climax: '发现的影响达到了顶点。',
        resolving: '发现的意义逐渐明朗。',
        concluded: '发现的故事告一段落。'
      },
      transformation: {
        base: '{participants}经历了{intensity}的转变，变化{sentiment}。',
        climax: '转变达到了关键时刻。',
        resolving: '转变开始稳定。',
        concluded: '转变完成。'
      },
      quest: {
        base: '{participants}开始了{intensity}的探索，过程{sentiment}。',
        climax: '探索遇到了最大的挑战。',
        resolving: '探索接近尾声。',
        concluded: '探索圆满结束。'
      },
      mystery: {
        base: '{participants}面对{intensity}的谜团，氛围{sentiment}。',
        climax: '谜团的核心即将揭晓。',
        resolving: '谜团开始解开。',
        concluded: '谜团真相大白。'
      },
      tragedy: {
        base: '{participants}陷入了{intensity}的悲剧，情绪{sentiment}。',
        climax: '悲剧达到了最痛苦的时刻。',
        resolving: '悲剧的余波逐渐平息。',
        concluded: '悲剧落幕。'
      },
      triumph: {
        base: '{participants}取得了{intensity}的胜利，心情{sentiment}。',
        climax: '胜利的喜悦达到顶峰。',
        resolving: '胜利的庆祝逐渐平息。',
        concluded: '胜利成为历史。'
      }
    }
    
    return templates[type] || {
      base: '{participants}经历了{intensity}的事件，情况{sentiment}。',
      climax: '事件达到了高潮。',
      resolving: '事件开始平息。',
      concluded: '事件结束。'
    }
  }
  
  /**
   * 获取叙述者声音
   */
  private getNarratorVoice(
    perspective: 'omniscient' | 'character' | 'observer',
    character_pov: string | undefined
  ): string {
    if (perspective === 'character' && character_pov) {
      return `从${character_pov}的视角来看`
    } else if (perspective === 'observer') {
      return '据观察'
    } else {
      return ''  // 全知视角不需要特殊标记
    }
  }
  
  /**
   * 格式化参与者列表
   */
  private formatParticipants(participants: string[]): string {
    if (participants.length === 0) return '某些角色'
    if (participants.length === 1) return participants[0]
    if (participants.length === 2) return participants.join('和')
    
    return participants.slice(0, -1).join('、') + '和' + participants[participants.length - 1]
  }
  
  /**
   * 描述强度
   */
  private describeIntensity(intensity: number): string {
    if (intensity > 0.8) return '激烈地'
    if (intensity > 0.6) return '强烈地'
    if (intensity > 0.4) return '明显地'
    if (intensity > 0.2) return '缓慢地'
    return '微弱地'
  }
  
  /**
   * 描述情感
   */
  private describeSentiment(sentiment: number): string {
    if (sentiment > 0.6) return '非常积极'
    if (sentiment > 0.3) return '较为积极'
    if (sentiment > -0.3) return '较为中性'
    if (sentiment > -0.6) return '较为消极'
    return '非常消极'
  }
  
  /**
   * 生成标题
   */
  private generateTitle(patterns: NarrativePattern[]): string {
    if (patterns.length === 0) return '空白的故事'
    
    // 找到最主要的叙事类型
    const typeCount = new Map<string, number>()
    for (const pattern of patterns) {
      typeCount.set(pattern.type, (typeCount.get(pattern.type) || 0) + 1)
    }
    
    const mainType = Array.from(typeCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'story'
    
    const typeNames: Record<string, string> = {
      conflict: '冲突',
      alliance: '联盟',
      romance: '浪漫',
      betrayal: '背叛',
      discovery: '发现',
      transformation: '转变',
      quest: '探索',
      mystery: '谜团',
      tragedy: '悲剧',
      triumph: '胜利'
    }
    
    const typeName = typeNames[mainType] || '故事'
    
    // 获取主要参与者
    const participantCount = new Map<string, number>()
    for (const pattern of patterns) {
      for (const participant of pattern.participants) {
        participantCount.set(participant, (participantCount.get(participant) || 0) + 1)
      }
    }
    
    const mainParticipant = Array.from(participantCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '未知'
    
    return `${mainParticipant}的${typeName}`
  }
  
  /**
   * 创建空总结
   */
  private createEmptySummary(
    perspective: 'omniscient' | 'character' | 'observer',
    character_pov: string | undefined
  ): NarrativeSummary {
    return {
      id: `summary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: '平静的时光',
      content: '这段时间里，世界保持着平静，没有发生特别值得记录的事件。',
      tick_range: [0, 0],
      patterns: [],
      arcs: [],
      perspective,
      character_pov,
      word_count: 20,
      generated_at: Date.now(),
      version: 1
    }
  }
}
