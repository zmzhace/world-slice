/**
 * Meme Propagation System
 * Core: ideas, beliefs, and behavior patterns spread like viruses between agents
 */

import type { PersonalAgentState, WorldSlice } from '@/domain/world'

export type Meme = {
  id: string
  content: string  // meme content
  category: 'belief' | 'behavior' | 'knowledge' | 'emotion' | 'value'
  contagiousness: number  // contagiousness [0-1]
  fidelity: number  // fidelity [0-1] (mutation degree during propagation)
  longevity: number  // longevity (time retained in memory)
  fitness: number  // fitness (survival ability in environment)
  carriers: string[]  // carriers
  mutations: Meme[]  // mutations
  origin: string  // origin agent
  created_at: number
  spread_count: number  // spread count
}

export type MemeTransmission = {
  meme_id: string
  from_agent: string
  to_agent: string
  tick: number
  success: boolean
  mutation_occurred: boolean
  new_meme_id?: string
}

export class MemePropagationSystem {
  private memes: Map<string, Meme> = new Map()
  private transmissions: MemeTransmission[] = []
  private memeCounter = 0

  /**
   * Create a meme
   */
  createMeme(
    content: string,
    category: Meme['category'],
    origin: string,
    currentTick: number
  ): Meme {
    const meme: Meme = {
      id: `meme-${this.memeCounter++}`,
      content,
      category,
      contagiousness: this.calculateContagiousness(content, category),
      fidelity: 0.7 + Math.random() * 0.2,
      longevity: 10 + Math.random() * 20,
      fitness: 0.5,
      carriers: [origin],
      mutations: [],
      origin,
      created_at: currentTick,
      spread_count: 0
    }

    this.memes.set(meme.id, meme)
    return meme
  }

  /**
   * Calculate contagiousness
   */
  private calculateContagiousness(content: string, category: Meme['category']): number {
    let base = 0.5

    // Emotion memes spread more easily
    if (category === 'emotion') {
      base += 0.2
    }

    // Belief memes spread slower
    if (category === 'belief') {
      base -= 0.1
    }

    // Simpler content spreads more easily
    if (content.length < 20) {
      base += 0.1
    }

    // Language-agnostic: shorter, more emphatic content spreads faster
    // Use content length and category as proxies instead of keyword matching
    if (content.length < 10) {
      base += 0.15  // Very short, punchy content is more contagious
    }

    return Math.min(1, Math.max(0, base))
  }

  /**
   * Propagate meme (SIR model)
   */
  propagateMeme(
    meme: Meme,
    network: Map<string, Set<string>>,
    agents: PersonalAgentState[],
    currentTick: number
  ): MemeTransmission[] {
    const transmissions: MemeTransmission[] = []

    // For each carrier
    for (const carrierId of meme.carriers) {
      const contacts = network.get(carrierId) || new Set()

      // Attempt to spread to contacts
      for (const contactId of contacts) {
        // Check if already a carrier
        if (meme.carriers.includes(contactId)) continue

        const contact = agents.find(a => a.genetics.seed === contactId)
        if (!contact) continue

        // Calculate transmission probability
        const transmissionProb = this.calculateTransmissionProbability(
          meme,
          agents.find(a => a.genetics.seed === carrierId)!,
          contact
        )

        // Attempt transmission
        if (Math.random() < transmissionProb) {
          // Check if mutation occurs
          const mutationOccurred = Math.random() > meme.fidelity

          if (mutationOccurred) {
            // Create mutation
            const mutatedMeme = this.mutateMeme(meme, contact, currentTick)
            meme.mutations.push(mutatedMeme)

            transmissions.push({
              meme_id: meme.id,
              from_agent: carrierId,
              to_agent: contactId,
              tick: currentTick,
              success: true,
              mutation_occurred: true,
              new_meme_id: mutatedMeme.id
            })
          } else {
            // Successfully propagated original meme
            meme.carriers.push(contactId)
            meme.spread_count++

            transmissions.push({
              meme_id: meme.id,
              from_agent: carrierId,
              to_agent: contactId,
              tick: currentTick,
              success: true,
              mutation_occurred: false
            })
          }
        } else {
          transmissions.push({
            meme_id: meme.id,
            from_agent: carrierId,
            to_agent: contactId,
            tick: currentTick,
            success: false,
            mutation_occurred: false
          })
        }
      }
    }

    this.transmissions.push(...transmissions)
    return transmissions
  }

  /**
   * Calculate transmission probability
   */
  private calculateTransmissionProbability(
    meme: Meme,
    carrier: PersonalAgentState,
    receiver: PersonalAgentState
  ): number {
    let prob = meme.contagiousness

    // Better relationship = easier transmission
    const relationship = carrier.relations[receiver.genetics.seed] || 0
    prob += relationship * 0.3

    // Receiver's openness affects acceptance
    prob += receiver.persona.openness * 0.2

    // Emotional state influence
    if (meme.category === 'emotion') {
      if (receiver.emotion.intensity > 0.5) {
        prob += 0.2  // Emotionally aroused agents accept emotion memes more easily
      }
    }

    // Belief memes require higher trust
    if (meme.category === 'belief') {
      if (relationship < 0.5) {
        prob -= 0.3
      }
    }

    return Math.min(1, Math.max(0, prob))
  }

  /**
   * Meme mutation
   */
  mutateMeme(
    originalMeme: Meme,
    carrier: PersonalAgentState,
    currentTick: number
  ): Meme {
    // Mutate content based on carrier's personality
    let mutatedContent = originalMeme.content

    // High openness: extend the idea
    if (carrier.persona.openness > 0.7) {
      mutatedContent = `${mutatedContent} [extended]`
    }

    // Low stability: amplify the message
    if (carrier.persona.stability < 0.3) {
      mutatedContent = `[amplified] ${mutatedContent}`
    }

    // High empathy: soften the message
    if (carrier.persona.empathy > 0.7) {
      mutatedContent = `[softened] ${mutatedContent}`
    }

    const mutatedMeme: Meme = {
      id: `meme-${this.memeCounter++}`,
      content: mutatedContent,
      category: originalMeme.category,
      contagiousness: originalMeme.contagiousness * (0.9 + Math.random() * 0.2),
      fidelity: originalMeme.fidelity * 0.95,
      longevity: originalMeme.longevity * (0.8 + Math.random() * 0.4),
      fitness: originalMeme.fitness,
      carriers: [carrier.genetics.seed],
      mutations: [],
      origin: carrier.genetics.seed,
      created_at: currentTick,
      spread_count: 0
    }

    this.memes.set(mutatedMeme.id, mutatedMeme)
    return mutatedMeme
  }

  /**
   * Meme competition (selection)
   */
  competeMemes(
    memes: Meme[],
    environment: { stress: number; cooperation: number; conflict: number }
  ): Meme[] {
    // Calculate fitness for each meme
    for (const meme of memes) {
      meme.fitness = this.calculateFitness(meme, environment)
    }

    // Select memes with high fitness
    const survivors = memes.filter(m => {
      // Survival probability based on fitness
      return Math.random() < m.fitness
    })

    return survivors
  }

  /**
   * Calculate fitness
   */
  private calculateFitness(
    meme: Meme,
    environment: { stress: number; cooperation: number; conflict: number }
  ): number {
    let fitness = 0.5

    // Spread breadth affects fitness
    fitness += Math.min(0.3, meme.carriers.length / 20)

    // Category-based fitness (language-agnostic)
    if (meme.category === 'emotion') {
      fitness += environment.stress * 0.3
    }

    if (meme.category === 'value') {
      fitness += Math.max(environment.cooperation, environment.conflict) * 0.3
    }

    // Longevity affects fitness
    fitness += meme.longevity / 50

    return Math.min(1, Math.max(0, fitness))
  }

  /**
   * Extract memes from agent memory
   */
  extractMemesFromAgent(agent: PersonalAgentState, currentTick: number): Meme[] {
    const newMemes: Meme[] = []

    // Extract from core beliefs
    if (agent.core_belief && !this.memeExists(agent.core_belief)) {
      const meme = this.createMeme(
        agent.core_belief,
        'belief',
        agent.genetics.seed,
        currentTick
      )
      newMemes.push(meme)
    }

    // Extract from goals
    for (const goal of agent.goals) {
      if (!this.memeExists(goal)) {
        const meme = this.createMeme(
          goal,
          'value',
          agent.genetics.seed,
          currentTick
        )
        newMemes.push(meme)
      }
    }

    // Extract from strong memories
    const strongMemories = agent.memory_short.filter(m =>
      Math.abs(m.emotional_weight) > 0.7
    )

    for (const memory of strongMemories.slice(0, 2)) {
      if (!this.memeExists(memory.content)) {
        const category: Meme['category'] =
          memory.emotional_weight > 0 ? 'emotion' : 'knowledge'

        const meme = this.createMeme(
          memory.content,
          category,
          agent.genetics.seed,
          currentTick
        )
        newMemes.push(meme)
      }
    }

    return newMemes
  }

  /**
   * Check if meme already exists
   */
  private memeExists(content: string): boolean {
    return Array.from(this.memes.values()).some(m =>
      m.content === content || m.content.includes(content.slice(0, 20))
    )
  }

  /**
   * Apply meme to agent
   */
  applyMemeToAgent(
    meme: Meme,
    agent: PersonalAgentState,
    currentTick: number
  ): PersonalAgentState {
    const updatedAgent = { ...agent }

    // Apply influence based on meme category
    switch (meme.category) {
      case 'belief':
        // Influence core belief
        if (!updatedAgent.core_belief || Math.random() < 0.3) {
          updatedAgent.core_belief = meme.content
        }
        break

      case 'value':
        // Add to goals
        if (!updatedAgent.goals.includes(meme.content)) {
          updatedAgent.goals.push(meme.content)
        }
        break

      case 'emotion':
        // Emotion memes influence the agent's emotional state
        // The meme content itself describes the emotion (in whatever language)
        updatedAgent.emotion = {
          label: 'influenced',
          intensity: 0.6
        }
        break

      case 'knowledge':
        // Add to memory
        updatedAgent.memory_short.push({
          id: `mem-meme-${currentTick}`,
          content: meme.content,
          importance: 0.5,
          emotional_weight: 0.3,
          source: 'social',
          timestamp: new Date().toISOString(),
          decay_rate: 0.05,
          retrieval_strength: 0.7
        })
        break
    }

    return updatedAgent
  }

  /**
   * Meme decay
   */
  decayMemes(currentTick: number): void {
    for (const [id, meme] of this.memes) {
      const age = currentTick - meme.created_at

      // Memes past their longevity may disappear
      if (age > meme.longevity) {
        // Remove from some carriers
        const removalRate = 0.2
        const carriersToRemove = Math.floor(meme.carriers.length * removalRate)

        for (let i = 0; i < carriersToRemove; i++) {
          const randomIndex = Math.floor(Math.random() * meme.carriers.length)
          meme.carriers.splice(randomIndex, 1)
        }

        // Delete meme if no carriers remain
        if (meme.carriers.length === 0) {
          this.memes.delete(id)
        }
      }
    }
  }

  /**
   * Get most popular memes
   */
  getMostPopularMemes(count: number = 10): Meme[] {
    return Array.from(this.memes.values())
      .sort((a, b) => b.carriers.length - a.carriers.length)
      .slice(0, count)
  }

  /**
   * Get statistics
   */
  getStats() {
    const memes = Array.from(this.memes.values())

    return {
      total_memes: memes.length,
      total_transmissions: this.transmissions.length,
      successful_transmissions: this.transmissions.filter(t => t.success).length,
      mutation_rate: this.transmissions.filter(t => t.mutation_occurred).length / this.transmissions.length || 0,
      avg_carriers: memes.reduce((sum, m) => sum + m.carriers.length, 0) / memes.length || 0,
      avg_fitness: memes.reduce((sum, m) => sum + m.fitness, 0) / memes.length || 0,
      by_category: {
        belief: memes.filter(m => m.category === 'belief').length,
        behavior: memes.filter(m => m.category === 'behavior').length,
        knowledge: memes.filter(m => m.category === 'knowledge').length,
        emotion: memes.filter(m => m.category === 'emotion').length,
        value: memes.filter(m => m.category === 'value').length
      }
    }
  }

  /**
   * Get all memes
   */
  getAllMemes(): Map<string, Meme> {
    return this.memes
  }

  /**
   * Get memes carried by an agent
   */
  getAgentMemes(agentId: string): Meme[] {
    return Array.from(this.memes.values()).filter(m =>
      m.carriers.includes(agentId)
    )
  }

  /**
   * Ingest meme from LLM feedback (system_feedback.meme_spread)
   */
  ingestFromLLMFeedback(
    agentId: string,
    memeSpread: { content: string; category: Meme['category'] },
    currentTick: number
  ): void {
    // Check if this meme already exists
    if (this.memeExists(memeSpread.content)) {
      // Add agent as carrier of existing similar meme
      for (const meme of this.memes.values()) {
        if (meme.content === memeSpread.content || meme.content.includes(memeSpread.content.slice(0, 20))) {
          if (!meme.carriers.includes(agentId)) {
            meme.carriers.push(agentId)
            meme.spread_count++
          }
          return
        }
      }
    }

    // Create new meme
    this.createMeme(memeSpread.content, memeSpread.category, agentId, currentTick)
  }

  /**
   * Export snapshot
   */
  toSnapshot(): { memes: Record<string, Meme>; transmissions: MemeTransmission[]; memeCounter: number } {
    const memes: Record<string, Meme> = {}
    for (const [id, m] of this.memes) {
      memes[id] = m
    }
    return { memes, transmissions: this.transmissions, memeCounter: this.memeCounter }
  }

  /**
   * Restore from snapshot
   */
  fromSnapshot(snapshot: { memes: Record<string, Meme>; transmissions: MemeTransmission[]; memeCounter: number }): void {
    this.memes.clear()
    for (const [id, m] of Object.entries(snapshot.memes)) {
      this.memes.set(id, m)
    }
    this.transmissions = snapshot.transmissions
    this.memeCounter = snapshot.memeCounter
  }
}
