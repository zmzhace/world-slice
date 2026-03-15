/**
 * Narrative influence system - lets narratives influence agents' decisions and behavior
 * Core: forms positive feedback loop - narrative -> influence -> behavior -> event -> narrative
 */

import type { PersonalAgentState, MemoryRecord, WorldSlice } from '@/domain/world'
import type { NarrativePattern, NarrativeRole } from '@/domain/narrative'

export class NarrativeInfluenceSystem {
  /**
   * Apply narrative influence to agent
   */
  applyNarrativeInfluence(
    agent: PersonalAgentState,
    narratives: NarrativePattern[],
    world: WorldSlice
  ): PersonalAgentState {
    // 1. Find narratives the agent participates in
    const participatingNarratives = narratives.filter(n =>
      n.participants.includes(agent.genetics.seed)
    )
    
    if (participatingNarratives.length === 0) {
      return agent
    }
    
    // 2. Update agent's narrative roles
    const narrative_roles = this.updateNarrativeRoles(agent, participatingNarratives)
    
    // 3. Generate narrative-related memories
    const narrativeMemories = this.generateNarrativeMemories(
      agent,
      participatingNarratives,
      world.tick
    )
    
    // 4. Adjust emotional state
    const emotion = this.adjustEmotionByNarrative(agent, participatingNarratives)
    
    // 5. Influence goals
    const goals = this.influenceGoals(agent, participatingNarratives)
    
    return {
      ...agent,
      narrative_roles,
      memory_short: [...agent.memory_short, ...narrativeMemories],
      emotion,
      goals
    }
  }
  
  /**
   * Update agent's narrative roles
   */
  private updateNarrativeRoles(
    agent: PersonalAgentState,
    narratives: NarrativePattern[]
  ): PersonalAgentState['narrative_roles'] {
    const roles: PersonalAgentState['narrative_roles'] = agent.narrative_roles || {}
    
    for (const narrative of narratives) {
      const role = this.determineRole(agent, narrative)
      const involvement = this.calculateInvolvement(agent, narrative)
      const impact = this.calculateImpact(agent, narrative)
      
      roles[narrative.id] = { role, involvement, impact }
    }
    
    return roles
  }
  
  /**
   * Determine agent's role in narrative
   */
  private determineRole(
    agent: PersonalAgentState,
    narrative: NarrativePattern
  ): NarrativeRole['role'] {
    const agentId = agent.genetics.seed
    
    // Check if primary participant (top two)
    const participantIndex = narrative.participants.indexOf(agentId)
    
    if (participantIndex === 0) {
      // First participant is usually the protagonist
      return 'protagonist'
    } else if (participantIndex === 1 && narrative.type === 'conflict') {
      // Second participant in conflict is the antagonist
      return 'antagonist'
    } else if (participantIndex === 1 && narrative.type === 'alliance') {
      // Second participant in alliance is also protagonist
      return 'protagonist'
    } else if (narrative.catalyst === narrative.event_ids[0]) {
      // Participant who triggered the event is the catalyst
      return 'catalyst'
    } else if (participantIndex > 1) {
      // Other participants are supporting
      return 'supporting'
    } else {
      // Default is observer
      return 'observer'
    }
  }
  
  /**
   * Calculate involvement
   */
  private calculateInvolvement(
    agent: PersonalAgentState,
    narrative: NarrativePattern
  ): number {
    const agentId = agent.genetics.seed
    
    // Count agent's appearances in narrative events
    const totalEvents = narrative.event_ids.length
    // Simplified: assume each event involves all participants
    const agentEvents = totalEvents
    
    return Math.min(1, agentEvents / Math.max(1, totalEvents))
  }
  
  /**
   * Calculate impact
   */
  private calculateImpact(
    agent: PersonalAgentState,
    narrative: NarrativePattern
  ): number {
    // Impact based on narrative intensity and agent involvement
    const involvement = this.calculateInvolvement(agent, narrative)
    return narrative.intensity * involvement
  }
  
  /**
   * Generate narrative-related memories
   */
  generateNarrativeMemories(
    agent: PersonalAgentState,
    narratives: NarrativePattern[],
    currentTick: number
  ): MemoryRecord[] {
    const memories: MemoryRecord[] = []
    
    for (const narrative of narratives) {
      // Only generate memories for active narratives
      if (narrative.status !== 'developing' && narrative.status !== 'climax') {
        continue
      }
      
      const role = this.determineRole(agent, narrative)
      const impact = this.calculateImpact(agent, narrative)
      
      // Generate memory content
      const content = this.generateMemoryContent(agent, narrative, role)
      
      const memory: MemoryRecord = {
        id: `narrative-memory-${narrative.id}-${currentTick}`,
        content,
        importance: impact,
        emotional_weight: narrative.sentiment,
        source: 'social',
        timestamp: new Date().toISOString(),
        decay_rate: 0.02, // narrative memories decay slower
        retrieval_strength: impact
      }
      
      memories.push(memory)
    }
    
    return memories
  }
  
  /**
   * Generate memory content
   */
  private generateMemoryContent(
    agent: PersonalAgentState,
    narrative: NarrativePattern,
    role: NarrativeRole['role']
  ): string {
    const narrativeTypeNames: Record<string, string> = {
      conflict: 'conflict',
      alliance: 'alliance',
      romance: 'romance',
      betrayal: 'betrayal',
      discovery: 'discovery',
      transformation: 'transformation',
      quest: 'quest',
      mystery: 'mystery',
      tragedy: 'tragedy',
      triumph: 'triumph'
    }

    const roleDescriptions: Record<string, string> = {
      protagonist: 'I am the protagonist',
      antagonist: 'I am the antagonist',
      supporting: 'I am supporting',
      observer: 'I am observing',
      catalyst: 'I triggered this'
    }

    const typeName = narrativeTypeNames[narrative.type] || 'event'
    const roleDesc = roleDescriptions[role] || 'I participated'
    const otherParticipants = narrative.participants.filter(p => p !== agent.genetics.seed)

    let content = `${roleDesc}, experiencing a ${typeName}`

    if (otherParticipants.length > 0) {
      content += `, involving ${otherParticipants.slice(0, 2).join(', ')}`
      if (otherParticipants.length > 2) {
        content += ` and ${otherParticipants.length} others`
      }
    }

    // Add description based on narrative status
    if (narrative.status === 'climax') {
      content += '. Things have reached a critical moment'
    } else if (narrative.status === 'developing') {
      content += '. Things are still developing'
    }

    // Add description based on sentiment
    if (narrative.sentiment > 0.5) {
      content += ', feeling positive'
    } else if (narrative.sentiment < -0.5) {
      content += ', making me uneasy'
    }

    return content
  }
  
  /**
   * Adjust emotion based on narrative
   */
  private adjustEmotionByNarrative(
    agent: PersonalAgentState,
    narratives: NarrativePattern[]
  ): PersonalAgentState['emotion'] {
    if (narratives.length === 0) {
      return agent.emotion
    }
    
    // Calculate average sentiment and intensity across all narratives
    let totalSentiment = 0
    let totalIntensity = 0
    
    for (const narrative of narratives) {
      const impact = this.calculateImpact(agent, narrative)
      totalSentiment += narrative.sentiment * impact
      totalIntensity += narrative.intensity * impact
    }
    
    const avgSentiment = totalSentiment / narratives.length
    const avgIntensity = totalIntensity / narratives.length
    
    // Choose label based on sentiment
    let label = agent.emotion.label
    
    if (avgIntensity > 0.7) {
      if (avgSentiment > 0.5) {
        label = 'excited'
      } else if (avgSentiment < -0.5) {
        label = 'anxious'
      } else {
        label = 'tense'
      }
    } else if (avgIntensity > 0.4) {
      if (avgSentiment > 0.3) {
        label = 'hopeful'
      } else if (avgSentiment < -0.3) {
        label = 'worried'
      } else {
        label = 'uncertain'
      }
    }
    
    return {
      label,
      intensity: Math.min(1, agent.emotion.intensity + avgIntensity * 0.3)
    }
  }
  
  /**
   * Influence agent's goals
   */
  private influenceGoals(
    agent: PersonalAgentState,
    narratives: NarrativePattern[]
  ): string[] {
    const goals = [...agent.goals]

    for (const narrative of narratives) {
      const role = this.determineRole(agent, narrative)

      // Add goals based on narrative type and role
      if (narrative.type === 'conflict' && role === 'protagonist') {
        const conflictGoal = `Resolve conflict with ${narrative.participants[1] || 'opponent'}`
        if (!goals.includes(conflictGoal)) {
          goals.push(conflictGoal)
        }
      } else if (narrative.type === 'alliance' && role === 'protagonist') {
        const allianceGoal = `Maintain alliance with ${narrative.participants[1] || 'ally'}`
        if (!goals.includes(allianceGoal)) {
          goals.push(allianceGoal)
        }
      } else if (narrative.type === 'quest' && role === 'protagonist') {
        const questGoal = `Complete the quest`
        if (!goals.includes(questGoal)) {
          goals.push(questGoal)
        }
      } else if (narrative.type === 'transformation' && role === 'protagonist') {
        const transformGoal = `Complete self-transformation`
        if (!goals.includes(transformGoal)) {
          goals.push(transformGoal)
        }
      }
    }

    // Limit number of goals
    return goals.slice(-5)
  }
  
  /**
   * Calculate narrative's overall impact on agent
   */
  calculateNarrativeImpact(
    agent: PersonalAgentState,
    narrative: NarrativePattern
  ): number {
    const involvement = this.calculateInvolvement(agent, narrative)
    const intensity = narrative.intensity
    const emotionalWeight = Math.abs(narrative.sentiment)
    
    return (involvement * 0.4 + intensity * 0.4 + emotionalWeight * 0.2)
  }
  
  /**
   * Get agent's most influential narrative
   */
  getMostInfluentialNarrative(
    agent: PersonalAgentState,
    narratives: NarrativePattern[]
  ): NarrativePattern | null {
    const participatingNarratives = narratives.filter(n =>
      n.participants.includes(agent.genetics.seed)
    )
    
    if (participatingNarratives.length === 0) {
      return null
    }
    
    // Sort by impact
    const sorted = participatingNarratives.sort((a, b) => {
      const impactA = this.calculateNarrativeImpact(agent, a)
      const impactB = this.calculateNarrativeImpact(agent, b)
      return impactB - impactA
    })
    
    return sorted[0]
  }
}
