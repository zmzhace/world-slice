/**
 * Resource competition system - generates the most conflict and cooperation
 * Core: Agents compete for limited resources, producing complex competitive and cooperative dynamics
 */

import type { PersonalAgentState, WorldSlice } from '@/domain/world'

export type ResourceType = 'material' | 'social' | 'information' | 'time'

export type Resource = {
  id: string
  type: ResourceType
  name: string
  amount: number
  max_amount: number
  regeneration_rate: number
  scarcity: number  // scarcity [0-1]
  value: number  // value [0-1]
  location?: string  // resource location
}

export type CompetitionStrategy =
  | 'direct_compete'  // direct competition
  | 'cooperate'       // cooperation
  | 'deceive'         // deception
  | 'share'           // sharing
  | 'hoard'           // hoarding
  | 'steal'           // theft

export type ResourceClaim = {
  agent_id: string
  resource_id: string
  amount: number
  strategy: CompetitionStrategy
  priority: number  // priority
  reason: string
}

export type CompetitionResult = {
  resource_id: string
  allocations: Map<string, number>  // agent_id -> amount
  conflicts: Array<{
    agents: string[]
    intensity: number
    resolution: string
  }>
  cooperations: Array<{
    agents: string[]
    benefit: number
  }>
}

export class ResourceCompetitionSystem {
  private resources: Map<string, Resource> = new Map()
  private claims: ResourceClaim[] = []
  
  /**
   * Initialize resources
   */
  initializeResources(world: WorldSlice): void {
    // Material resources
    this.resources.set('food', {
      id: 'food',
      type: 'material',
      name: 'food',
      amount: 100,
      max_amount: 100,
      regeneration_rate: 5,
      scarcity: 0.3,
      value: 0.8
    })

    this.resources.set('water', {
      id: 'water',
      type: 'material',
      name: 'water',
      amount: 80,
      max_amount: 100,
      regeneration_rate: 10,
      scarcity: 0.2,
      value: 0.9
    })

    this.resources.set('shelter', {
      id: 'shelter',
      type: 'material',
      name: 'shelter',
      amount: 50,
      max_amount: 50,
      regeneration_rate: 0,
      scarcity: 0.5,
      value: 0.7
    })

    // Social resources
    this.resources.set('status', {
      id: 'status',
      type: 'social',
      name: 'status',
      amount: 100,
      max_amount: 100,
      regeneration_rate: 0,
      scarcity: 0.7,
      value: 0.6
    })

    this.resources.set('influence', {
      id: 'influence',
      type: 'social',
      name: 'influence',
      amount: 100,
      max_amount: 100,
      regeneration_rate: 0,
      scarcity: 0.8,
      value: 0.7
    })

    // Information resources
    this.resources.set('knowledge', {
      id: 'knowledge',
      type: 'information',
      name: 'knowledge',
      amount: 200,
      max_amount: 1000,
      regeneration_rate: 2,
      scarcity: 0.4,
      value: 0.8
    })

    this.resources.set('secrets', {
      id: 'secrets',
      type: 'information',
      name: 'secrets',
      amount: 50,
      max_amount: 100,
      regeneration_rate: 1,
      scarcity: 0.9,
      value: 0.9
    })

    // Time resources
    this.resources.set('attention', {
      id: 'attention',
      type: 'time',
      name: 'attention',
      amount: world.agents.npcs.length * 10,
      max_amount: world.agents.npcs.length * 10,
      regeneration_rate: world.agents.npcs.length * 10,
      scarcity: 0.6,
      value: 0.7
    })
  }
  
  /**
   * Agent claims a resource
   */
  claimResource(
    agent: PersonalAgentState,
    resourceId: string,
    amount: number,
    strategy: CompetitionStrategy
  ): ResourceClaim {
    const resource = this.resources.get(resourceId)
    if (!resource) {
      throw new Error(`Resource ${resourceId} not found`)
    }
    
    // Calculate priority
    const priority = this.calculatePriority(agent, resource, strategy)
    
    const claim: ResourceClaim = {
      agent_id: agent.genetics.seed,
      resource_id: resourceId,
      amount,
      strategy,
      priority,
      reason: this.generateClaimReason(agent, resource, strategy)
    }
    
    this.claims.push(claim)
    return claim
  }
  
  /**
   * Calculate priority
   */
  private calculatePriority(
    agent: PersonalAgentState,
    resource: Resource,
    strategy: CompetitionStrategy
  ): number {
    let priority = 0
    
    // Based on need
    if (resource.type === 'material') {
      priority += (1 - agent.vitals.energy) * 2  // low energy -> high priority
    }
    
    if (resource.type === 'social') {
      priority += agent.persona.agency * 1.5  // high agency -> high priority
    }
    
    if (resource.type === 'information') {
      priority += agent.persona.openness * 1.5  // high openness -> high priority
    }
    
    // Based on strategy
    switch (strategy) {
      case 'direct_compete':
        priority += agent.persona.agency * 1.2
        break
      case 'cooperate':
        priority += agent.persona.empathy * 1.2
        break
      case 'deceive':
        priority += (1 - agent.persona.empathy) * 1.5
        break
      case 'share':
        priority += agent.persona.empathy * 1.5
        break
      case 'hoard':
        priority += agent.persona.stability * 1.2
        break
      case 'steal':
        priority += (1 - agent.persona.empathy) * 2
        break
    }
    
    return priority
  }
  
  /**
   * Select competition strategy
   */
  selectStrategy(
    agent: PersonalAgentState,
    resource: Resource,
    competitors: PersonalAgentState[]
  ): CompetitionStrategy {
    const strategies: Array<{ strategy: CompetitionStrategy; score: number }> = []
    
    // Direct competition
    strategies.push({
      strategy: 'direct_compete',
      score: agent.persona.agency * 2 + resource.scarcity
    })

    // Cooperation
    const friendCount = Object.values(agent.relations).filter(v => v > 0.5).length
    strategies.push({
      strategy: 'cooperate',
      score: agent.persona.empathy * 2 + friendCount * 0.2
    })

    // Deception
    strategies.push({
      strategy: 'deceive',
      score: (1 - agent.persona.empathy) * 1.5 + resource.value
    })

    // Sharing
    strategies.push({
      strategy: 'share',
      score: agent.persona.empathy * 2.5
    })

    // Hoarding
    strategies.push({
      strategy: 'hoard',
      score: agent.persona.stability * 1.5 + resource.scarcity
    })

    // Theft
    strategies.push({
      strategy: 'steal',
      score: (1 - agent.persona.empathy) * 2 + (1 - agent.vitals.energy) * 1.5
    })
    
    // Select highest scoring strategy
    strategies.sort((a, b) => b.score - a.score)
    return strategies[0].strategy
  }
  
  /**
   * Compete for resource (core algorithm)
   */
  competeForResource(
    resourceId: string,
    agents: PersonalAgentState[]
  ): CompetitionResult {
    const resource = this.resources.get(resourceId)
    if (!resource) {
      throw new Error(`Resource ${resourceId} not found`)
    }
    
    // Get all claims for this resource
    const resourceClaims = this.claims.filter(c => c.resource_id === resourceId)
    
    const allocations = new Map<string, number>()
    const conflicts: CompetitionResult['conflicts'] = []
    const cooperations: CompetitionResult['cooperations'] = []
    
    // Group by strategy
    const cooperators = resourceClaims.filter(c => c.strategy === 'cooperate' || c.strategy === 'share')
    const competitors = resourceClaims.filter(c => c.strategy === 'direct_compete')
    const deceivers = resourceClaims.filter(c => c.strategy === 'deceive')
    const hoarders = resourceClaims.filter(c => c.strategy === 'hoard')
    const thieves = resourceClaims.filter(c => c.strategy === 'steal')
    
    let remainingAmount = resource.amount
    
    // 1. Handle cooperators (priority, split evenly)
    if (cooperators.length > 0) {
      const totalCoopAmount = Math.min(
        remainingAmount * 0.4,
        cooperators.reduce((sum, c) => sum + c.amount, 0)
      )
      const perCoopAmount = totalCoopAmount / cooperators.length
      
      for (const claim of cooperators) {
        allocations.set(claim.agent_id, perCoopAmount)
      }
      
      remainingAmount -= totalCoopAmount
      
      cooperations.push({
        agents: cooperators.map(c => c.agent_id),
        benefit: perCoopAmount * cooperators.length
      })
    }
    
    // 2. Handle competitors (by priority)
    if (competitors.length > 0) {
      competitors.sort((a, b) => b.priority - a.priority)
      
      for (const claim of competitors) {
        const allocated = Math.min(claim.amount, remainingAmount * 0.3)
        allocations.set(claim.agent_id, (allocations.get(claim.agent_id) || 0) + allocated)
        remainingAmount -= allocated
        
        // Generate conflict
        if (competitors.length > 1) {
          conflicts.push({
            agents: competitors.map(c => c.agent_id),
            intensity: resource.scarcity * 0.8,
            resolution: `${claim.agent_id} won the resource through competition`
          })
        }
      }
    }
    
    // 3. Handle deceivers (may succeed or fail)
    for (const claim of deceivers) {
      const successChance = 0.3 + (1 - claim.priority) * 0.3
      
      if (Math.random() < successChance) {
        const stolen = Math.min(claim.amount, remainingAmount * 0.2)
        allocations.set(claim.agent_id, (allocations.get(claim.agent_id) || 0) + stolen)
        remainingAmount -= stolen
        
        conflicts.push({
          agents: [claim.agent_id, ...competitors.map(c => c.agent_id)],
          intensity: 0.9,
          resolution: `${claim.agent_id} obtained resources through deception`
        })
      } else {
        conflicts.push({
          agents: [claim.agent_id],
          intensity: 0.5,
          resolution: `${claim.agent_id}'s deception was discovered`
        })
      }
    }
    
    // 4. Handle hoarders
    for (const claim of hoarders) {
      const hoarded = Math.min(claim.amount, remainingAmount * 0.15)
      allocations.set(claim.agent_id, (allocations.get(claim.agent_id) || 0) + hoarded)
      remainingAmount -= hoarded
    }
    
    // 5. Handle thieves
    for (const claim of thieves) {
      const successChance = 0.2
      
      if (Math.random() < successChance && allocations.size > 0) {
        // Steal from others
        const victims = Array.from(allocations.keys())
        const victim = victims[Math.floor(Math.random() * victims.length)]
        const stolenAmount = (allocations.get(victim) || 0) * 0.3
        
        allocations.set(victim, (allocations.get(victim) || 0) - stolenAmount)
        allocations.set(claim.agent_id, (allocations.get(claim.agent_id) || 0) + stolenAmount)
        
        conflicts.push({
          agents: [claim.agent_id, victim],
          intensity: 1.0,
          resolution: `${claim.agent_id} stole resources from ${victim}`
        })
      }
    }
    
    // Update resource amount
    resource.amount = remainingAmount
    
    return {
      resource_id: resourceId,
      allocations,
      conflicts,
      cooperations
    }
  }
  
  /**
   * Allocate all resources
   */
  allocateAllResources(agents: PersonalAgentState[]): Map<string, CompetitionResult> {
    const results = new Map<string, CompetitionResult>()
    
    // Generate claims for each resource
    for (const agent of agents) {
      // Claim resources based on need
      if (agent.vitals.energy < 0.5) {
        const strategy = this.selectStrategy(agent, this.resources.get('food')!, agents)
        this.claimResource(agent, 'food', 10, strategy)
      }
      
      if (agent.persona.agency > 0.6) {
        const strategy = this.selectStrategy(agent, this.resources.get('status')!, agents)
        this.claimResource(agent, 'status', 5, strategy)
      }
      
      if (agent.persona.openness > 0.6) {
        const strategy = this.selectStrategy(agent, this.resources.get('knowledge')!, agents)
        this.claimResource(agent, 'knowledge', 8, strategy)
      }
    }
    
    // Compete for each resource
    for (const [resourceId, resource] of this.resources) {
      const result = this.competeForResource(resourceId, agents)
      results.set(resourceId, result)
    }
    
    // Clear claims
    this.claims = []
    
    return results
  }
  
  /**
   * Regenerate resources
   */
  regenerateResources(): void {
    for (const [id, resource] of this.resources) {
      resource.amount = Math.min(
        resource.max_amount,
        resource.amount + resource.regeneration_rate
      )
      
      // Update scarcity
      resource.scarcity = 1 - (resource.amount / resource.max_amount)
    }
  }
  
  /**
   * Get resource statistics
   */
  getStats() {
    const resources = Array.from(this.resources.values())
    
    return {
      total_resources: resources.length,
      total_claims: this.claims.length,
      scarcity_avg: resources.reduce((sum, r) => sum + r.scarcity, 0) / resources.length,
      most_scarce: resources.sort((a, b) => b.scarcity - a.scarcity)[0],
      most_valuable: resources.sort((a, b) => b.value - a.value)[0]
    }
  }
  
  /**
   * Generate claim reason
   */
  private generateClaimReason(
    agent: PersonalAgentState,
    resource: Resource,
    strategy: CompetitionStrategy
  ): string {
    return `${agent.identity.name} claims ${resource.name} via ${strategy}`
  }
  
  /**
   * Get all resources
   */
  getAllResources(): Map<string, Resource> {
    return this.resources
  }

  /**
   * Claim resource from LLM feedback (system_feedback.resource_action)
   */
  claimFromLLMFeedback(
    agentId: string,
    resourceAction: { resource: string; strategy: CompetitionStrategy; amount_hint: number }
  ): void {
    const { resource: resourceName, strategy, amount_hint } = resourceAction

    // Find or create resource
    let resource = this.resources.get(resourceName)
    if (!resource) {
      // Dynamically create a new resource type reported by LLM
      resource = {
        id: resourceName,
        type: 'material',
        name: resourceName,
        amount: 100,
        max_amount: 100,
        regeneration_rate: 2,
        scarcity: 0.5,
        value: 0.5,
      }
      this.resources.set(resourceName, resource)
    }

    this.claims.push({
      agent_id: agentId,
      resource_id: resource.id,
      amount: Math.min(amount_hint, resource.amount * 0.3),
      strategy,
      priority: 1.0, // LLM-driven claims get standard priority
      reason: `LLM-driven ${strategy} for ${resourceName}`,
    })
  }

  /**
   * Export snapshot
   */
  toSnapshot(): { resources: Record<string, Resource> } {
    const resources: Record<string, Resource> = {}
    for (const [id, res] of this.resources) {
      resources[id] = res
    }
    return { resources }
  }

  /**
   * Restore from snapshot
   */
  fromSnapshot(snapshot: { resources: Record<string, Resource> }): void {
    this.resources.clear()
    for (const [id, res] of Object.entries(snapshot.resources)) {
      this.resources.set(id, res)
    }
  }
}
