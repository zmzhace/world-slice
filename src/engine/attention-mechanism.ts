/**
 * Attention mechanism
 * Core: Agents have limited attention, need to selectively focus
 */

import type { PersonalAgentState, WorldSlice } from '@/domain/world'

export type Stimulus = {
  id: string
  type: 'agent' | 'event' | 'resource' | 'narrative' | 'environment'
  source: string
  salience: number  // salience [0-1]
  urgency: number  // urgency [0-1]
  relevance: number  // relevance [0-1]
  description: string
}

export type AttentionState = {
  agent_id: string
  capacity: number  // attention capacity
  current_focus: string[]  // currently focused objects
  attention_weights: Map<string, number>  // attention weights
  fatigue: number  // fatigue level [0-1]
  last_shift: number  // last attention shift time
}

export type AttentionAllocation = {
  stimulus_id: string
  weight: number
  reason: string
}

export class AttentionMechanism {
  private attentionStates: Map<string, AttentionState> = new Map()
  private readonly BASE_CAPACITY = 3  // base capacity
  private readonly FATIGUE_RATE = 0.05
  private readonly RECOVERY_RATE = 0.1
  
  /**
   * Initialize agent's attention state
   */
  initializeAttention(agent: PersonalAgentState): AttentionState {
    // Capacity based on personality
    const capacity = this.BASE_CAPACITY + Math.floor(agent.persona.focus * 2)
    
    const state: AttentionState = {
      agent_id: agent.genetics.seed,
      capacity,
      current_focus: [],
      attention_weights: new Map(),
      fatigue: 0,
      last_shift: 0
    }
    
    this.attentionStates.set(agent.genetics.seed, state)
    return state
  }
  
  /**
   * Allocate attention
   */
  allocateAttention(
    agent: PersonalAgentState,
    stimuli: Stimulus[],
    currentTick: number
  ): AttentionAllocation[] {
    let state = this.attentionStates.get(agent.genetics.seed)
    if (!state) {
      state = this.initializeAttention(agent)
    }
    
    // Calculate attention weight for each stimulus
    const weightedStimuli = stimuli.map(stimulus => ({
      stimulus,
      weight: this.calculateAttentionWeight(stimulus, agent, state!)
    }))
    
    // Sort by weight
    weightedStimuli.sort((a, b) => b.weight - a.weight)
    
    // Allocate attention (limited by capacity)
    const allocations: AttentionAllocation[] = []
    const effectiveCapacity = Math.max(1, Math.floor(state.capacity * (1 - state.fatigue)))
    
    for (let i = 0; i < Math.min(effectiveCapacity, weightedStimuli.length); i++) {
      const { stimulus, weight } = weightedStimuli[i]
      
      allocations.push({
        stimulus_id: stimulus.id,
        weight,
        reason: this.generateAllocationReason(stimulus, weight)
      })
      
      state.current_focus.push(stimulus.id)
      state.attention_weights.set(stimulus.id, weight)
    }
    
    // Limit current_focus size
    if (state.current_focus.length > effectiveCapacity) {
      const removed = state.current_focus.splice(0, state.current_focus.length - effectiveCapacity)
      for (const id of removed) {
        state.attention_weights.delete(id)
      }
    }
    
    // Increase fatigue
    state.fatigue = Math.min(1, state.fatigue + this.FATIGUE_RATE * allocations.length)
    
    return allocations
  }
  
  /**
   * Calculate attention weight
   */
  calculateAttentionWeight(
    stimulus: Stimulus,
    agent: PersonalAgentState,
    state: AttentionState
  ): number {
    let weight = 0
    
    // 1. Salience (base weight)
    weight += stimulus.salience * 0.3
    
    // 2. Urgency
    weight += stimulus.urgency * 0.3
    
    // 3. Relevance
    weight += stimulus.relevance * 0.2
    
    // 4. Personality influence
    if (stimulus.type === 'agent') {
      // High attachment people pay more attention to other agents
      weight += agent.persona.attachment * 0.1
    }
    
    if (stimulus.type === 'event') {
      // Low stability people are more attracted to events
      weight += (1 - agent.persona.stability) * 0.1
    }
    
    if (stimulus.type === 'resource') {
      // More attention to resources when energy is low
      if (agent.vitals.energy < 0.5) {
        weight += 0.2
      }
    }
    
    // 5. Novelty (items not in current focus are more attractive)
    if (!state.current_focus.includes(stimulus.id)) {
      weight += agent.persona.openness * 0.15
    }
    
    // 6. Fatigue effect (when fatigued, only focus on high priority)
    if (state.fatigue > 0.5) {
      weight *= (1 - state.fatigue * 0.5)
    }
    
    return Math.min(1, weight)
  }
  
  /**
   * Attention shift
   */
  shiftAttention(
    agent: PersonalAgentState,
    newStimulus: Stimulus,
    currentTick: number
  ): boolean {
    const state = this.attentionStates.get(agent.genetics.seed)
    if (!state) return false
    
    // Calculate new stimulus weight
    const newWeight = this.calculateAttentionWeight(newStimulus, agent, state)
    
    // If capacity not full, add directly
    const effectiveCapacity = Math.max(1, Math.floor(state.capacity * (1 - state.fatigue)))
    if (state.current_focus.length < effectiveCapacity) {
      state.current_focus.push(newStimulus.id)
      state.attention_weights.set(newStimulus.id, newWeight)
      state.last_shift = currentTick
      return true
    }
    
    // Find lowest weight in current focus
    let lowestWeight = Infinity
    let lowestId = ''
    
    for (const [id, weight] of state.attention_weights) {
      if (weight < lowestWeight) {
        lowestWeight = weight
        lowestId = id
      }
    }
    
    // If new stimulus has higher weight, replace
    if (newWeight > lowestWeight) {
      const index = state.current_focus.indexOf(lowestId)
      if (index !== -1) {
        state.current_focus[index] = newStimulus.id
      }
      state.attention_weights.delete(lowestId)
      state.attention_weights.set(newStimulus.id, newWeight)
      state.last_shift = currentTick
      
      // Shifting attention increases fatigue
      state.fatigue = Math.min(1, state.fatigue + this.FATIGUE_RATE * 0.5)
      
      return true
    }
    
    return false
  }
  
  /**
   * Recover attention (rest)
   */
  recoverAttention(agent: PersonalAgentState): void {
    const state = this.attentionStates.get(agent.genetics.seed)
    if (!state) return
    
    // Reduce fatigue
    state.fatigue = Math.max(0, state.fatigue - this.RECOVERY_RATE)
    
    // If fully recovered, clear some focus
    if (state.fatigue < 0.1) {
      const toRemove = Math.floor(state.current_focus.length * 0.3)
      for (let i = 0; i < toRemove; i++) {
        const removed = state.current_focus.shift()
        if (removed) {
          state.attention_weights.delete(removed)
        }
      }
    }
  }
  
  /**
   * Check if attending to
   */
  isAttendingTo(agentId: string, stimulusId: string): boolean {
    const state = this.attentionStates.get(agentId)
    if (!state) return false
    
    return state.current_focus.includes(stimulusId)
  }
  
  /**
   * Get attention weight
   */
  getAttentionWeight(agentId: string, stimulusId: string): number {
    const state = this.attentionStates.get(agentId)
    if (!state) return 0
    
    return state.attention_weights.get(stimulusId) || 0
  }
  
  /**
   * Create stimulus
   */
  createStimulus(
    type: Stimulus['type'],
    source: string,
    description: string,
    properties: {
      salience?: number
      urgency?: number
      relevance?: number
    }
  ): Stimulus {
    return {
      id: `stimulus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      source,
      salience: properties.salience || 0.5,
      urgency: properties.urgency || 0.5,
      relevance: properties.relevance || 0.5,
      description
    }
  }
  
  /**
   * Generate stimuli from world state
   * reputationInfluences: optional map of agentId -> influence score from ReputationSystem
   * activeTensions: optional array of active dramatic tensions
   */
  generateStimuliFromWorld(
    world: WorldSlice,
    agent: PersonalAgentState,
    reputationInfluences?: Map<string, number>,
    activeTensions?: Array<{ source: string; level: number; target_agents: string[] }>
  ): Stimulus[] {
    const stimuli: Stimulus[] = []
    
    // 1. Other agents
    for (const other of world.agents.npcs) {
      if (other.genetics.seed === agent.genetics.seed) continue
      
      const relationship = agent.relations[other.genetics.seed] || 0
      const relevance = Math.abs(relationship)

      // Reputation factor: high-reputation agents are more salient
      const repInfluence = reputationInfluences?.get(other.genetics.seed) || 0
      const repBoost = repInfluence * 0.2

      stimuli.push(this.createStimulus(
        'agent',
        other.genetics.seed,
        `Agent: ${other.identity.name}`,
        {
          salience: Math.min(1, 0.5 + repBoost),
          urgency: 0.3,
          relevance
        }
      ))
    }
    
    // 2. Recent events
    const recentEvents = world.events.slice(-5)
    for (const event of recentEvents) {
      stimuli.push(this.createStimulus(
        'event',
        event.id,
        `Event: ${event.type}`,
        {
          salience: 0.7,
          urgency: 0.8,
          relevance: 0.6
        }
      ))
    }
    
    // 3. Resources (if energy is low)
    if (agent.vitals.energy < 0.5) {
      stimuli.push(this.createStimulus(
        'resource',
        'energy',
        'Resource: Energy',
        {
          salience: 0.8,
          urgency: 1 - agent.vitals.energy,
          relevance: 0.9
        }
      ))
    }
    
    // 4. Narratives (if participating)
    if (world.narratives) {
      const participatingNarratives = world.narratives.patterns.filter(n =>
        n.participants.includes(agent.genetics.seed)
      )
      
      for (const narrative of participatingNarratives) {
        stimuli.push(this.createStimulus(
          'narrative',
          narrative.id,
          `Narrative: ${narrative.type}`,
          {
            salience: narrative.intensity,
            urgency: narrative.status === 'climax' ? 0.9 : 0.5,
            relevance: 0.8
          }
        ))
      }
    }
    
    // 5. Active tensions (high-tension events generate urgent stimuli)
    if (activeTensions) {
      for (const tension of activeTensions) {
        if (tension.target_agents.includes(agent.genetics.seed) && tension.level > 0.3) {
          stimuli.push(this.createStimulus(
            'event',
            `tension-${tension.source}`,
            `Tension: ${tension.source}`,
            {
              salience: tension.level,
              urgency: tension.level,
              relevance: 0.8,
            }
          ))
        }
      }
    }

    return stimuli
  }
  
  /**
   * Generate allocation reason
   */
  private generateAllocationReason(stimulus: Stimulus, weight: number): string {
    if (weight > 0.8) {
      return `High attention to ${stimulus.description} (weight: ${weight.toFixed(2)})`
    } else if (weight > 0.5) {
      return `Moderate attention to ${stimulus.description} (weight: ${weight.toFixed(2)})`
    } else {
      return `Low attention to ${stimulus.description} (weight: ${weight.toFixed(2)})`
    }
  }
  
  /**
   * Get statistics
   */
  getStats() {
    const states = Array.from(this.attentionStates.values())
    
    return {
      total_agents: states.length,
      avg_capacity: states.reduce((sum, s) => sum + s.capacity, 0) / states.length || 0,
      avg_focus_count: states.reduce((sum, s) => sum + s.current_focus.length, 0) / states.length || 0,
      avg_fatigue: states.reduce((sum, s) => sum + s.fatigue, 0) / states.length || 0,
      highly_fatigued: states.filter(s => s.fatigue > 0.7).length,
      at_capacity: states.filter(s => s.current_focus.length >= s.capacity).length
    }
  }
  
  /**
   * Get agent's attention state
   */
  getAttentionState(agentId: string): AttentionState | undefined {
    return this.attentionStates.get(agentId)
  }

  /**
   * Export snapshot
   */
  toSnapshot(): { states: Record<string, Omit<AttentionState, 'attention_weights'> & { attention_weights: Record<string, number> }> } {
    const states: Record<string, any> = {}
    for (const [id, state] of this.attentionStates) {
      states[id] = {
        ...state,
        attention_weights: Object.fromEntries(state.attention_weights),
      }
    }
    return { states }
  }

  /**
   * Restore from snapshot
   */
  fromSnapshot(snapshot: { states: Record<string, any> }): void {
    this.attentionStates.clear()
    for (const [id, state] of Object.entries(snapshot.states)) {
      const s = state as any
      this.attentionStates.set(id, {
        ...s,
        attention_weights: new Map(Object.entries(s.attention_weights || {})),
      })
    }
  }
}
