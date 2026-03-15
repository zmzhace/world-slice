/**
 * Social Role System
 * Core: Agents play different social roles in different contexts
 */

import type { PersonalAgentState, WorldSlice } from '@/domain/world'

export type RoleType = 'professional' | 'family' | 'social' | 'cultural'

export type SocialRole = {
  id: string
  type: RoleType
  name: string
  expectations: string[]  // role expectations
  obligations: string[]  // role obligations
  privileges: string[]  // role privileges
  identity_strength: number  // identity strength [0-1]
  context: string  // context where the role applies
}

export type RoleConflict = {
  agent_id: string
  role1: SocialRole
  role2: SocialRole
  conflict_description: string
  intensity: number  // conflict intensity [0-1]
  resolution_strategy?: string
}

export class SocialRoleSystem {
  private agentRoles: Map<string, SocialRole[]> = new Map()
  private roleConflicts: RoleConflict[] = []

  /**
   * Assign roles to an agent
   */
  assignRoles(agent: PersonalAgentState, world: WorldSlice): SocialRole[] {
    const roles: SocialRole[] = []

    // 1. Professional role
    if (agent.occupation) {
      roles.push(this.createProfessionalRole(agent))
    }

    // 2. Social role (based on social network position)
    const socialRole = this.determineSocialRole(agent, world)
    if (socialRole) {
      roles.push(socialRole)
    }

    // 3. Cultural role (based on personality and beliefs)
    const culturalRole = this.determineCulturalRole(agent)
    if (culturalRole) {
      roles.push(culturalRole)
    }

    this.agentRoles.set(agent.genetics.seed, roles)
    return roles
  }

  /**
   * Create a professional role
   */
  private createProfessionalRole(agent: PersonalAgentState): SocialRole {
    const occupation = agent.occupation || 'worker'

    return {
      id: `role-professional-${agent.genetics.seed}`,
      type: 'professional',
      name: occupation,
      expectations: ['fulfill duties', 'follow standards'],
      obligations: ['complete work', 'continuous learning'],
      privileges: ['earn compensation', 'social recognition'],
      identity_strength: 0.6 + agent.persona.agency * 0.3,
      context: 'professional'
    }
  }

  /**
   * Determine social role
   */
  private determineSocialRole(agent: PersonalAgentState, world: WorldSlice): SocialRole | null {
    // Calculate position in social network
    const friendCount = Object.values(agent.relations).filter(v => v > 0.5).length
    const totalAgents = world.agents.npcs.length

    // Leader
    if (friendCount > totalAgents * 0.4 && agent.persona.agency > 0.7) {
      return {
        id: `role-social-${agent.genetics.seed}`,
        type: 'social',
        name: 'leader',
        expectations: ['lead the group', 'make decisions', 'take responsibility'],
        obligations: ['care for members', 'resolve conflicts', 'set direction'],
        privileges: ['earn respect', 'influence decisions', 'priority resources'],
        identity_strength: agent.persona.agency * 0.8,
        context: 'group activities'
      }
    }

    // Mediator
    if (agent.persona.empathy > 0.7 && agent.persona.stability > 0.6) {
      return {
        id: `role-social-${agent.genetics.seed}`,
        type: 'social',
        name: 'mediator',
        expectations: ['resolve disputes', 'promote harmony', 'listen to all sides'],
        obligations: ['stay neutral', 'seek consensus', 'maintain relationships'],
        privileges: ['earn trust', 'receive gratitude', 'wide connections'],
        identity_strength: agent.persona.empathy * 0.7,
        context: 'conflict situations'
      }
    }

    // Follower
    if (friendCount < totalAgents * 0.2 && agent.persona.attachment > 0.6) {
      return {
        id: `role-social-${agent.genetics.seed}`,
        type: 'social',
        name: 'follower',
        expectations: ['support leaders', 'execute tasks', 'stay loyal'],
        obligations: ['follow decisions', 'complete assignments', 'maintain unity'],
        privileges: ['receive protection', 'share outcomes', 'sense of belonging'],
        identity_strength: agent.persona.attachment * 0.6,
        context: 'group activities'
      }
    }

    return null
  }

  /**
   * Determine cultural role
   */
  private determineCulturalRole(agent: PersonalAgentState): SocialRole | null {
    // Guardian
    if (agent.persona.stability > 0.7) {
      return {
        id: `role-cultural-${agent.genetics.seed}`,
        type: 'cultural',
        name: 'guardian',
        expectations: ['preserve traditions', 'pass on culture', 'resist change'],
        obligations: ['preserve knowledge', 'teach successors', 'maintain order'],
        privileges: ['earn respect', 'cultural authority', 'historical standing'],
        identity_strength: agent.persona.stability * 0.8,
        context: 'cultural activities'
      }
    }

    // Innovator
    if (agent.persona.openness > 0.8 && agent.persona.agency > 0.7) {
      return {
        id: `role-cultural-${agent.genetics.seed}`,
        type: 'cultural',
        name: 'innovator',
        expectations: ['drive change', 'challenge status quo', 'create new things'],
        obligations: ['take risks', 'persuade others', 'prove value'],
        privileges: ['lead trends', 'gain recognition', 'shape the world'],
        identity_strength: agent.persona.openness * 0.7,
        context: 'innovation activities'
      }
    }

    // Outsider
    if (agent.persona.stability < 0.3 && Object.values(agent.relations).filter(v => v > 0.3).length < 2) {
      return {
        id: `role-cultural-${agent.genetics.seed}`,
        type: 'cultural',
        name: 'outsider',
        expectations: ['think independently', 'keep distance', 'observe society'],
        obligations: ['self-reliance', 'not depend on others'],
        privileges: ['freedom of action', 'unique perspective', 'no constraints'],
        identity_strength: 0.5,
        context: 'solitary'
      }
    }

    return null
  }

  /**
   * Detect role conflicts
   */
  detectRoleConflicts(agent: PersonalAgentState): RoleConflict[] {
    const roles = this.agentRoles.get(agent.genetics.seed) || []
    const conflicts: RoleConflict[] = []

    // Check all role pairs
    for (let i = 0; i < roles.length; i++) {
      for (let j = i + 1; j < roles.length; j++) {
        const conflict = this.checkRoleConflict(agent, roles[i], roles[j])
        if (conflict) {
          conflicts.push(conflict)
        }
      }
    }

    this.roleConflicts.push(...conflicts)
    return conflicts
  }

  /**
   * Check if two roles conflict
   */
  private checkRoleConflict(
    agent: PersonalAgentState,
    role1: SocialRole,
    role2: SocialRole
  ): RoleConflict | null {
    // Professional vs social role conflict
    if (role1.type === 'professional' && role2.type === 'social') {
      if (role2.name === 'leader') {
        return {
          agent_id: agent.genetics.seed,
          role1,
          role2,
          conflict_description: 'professional obligations conflict with leadership power',
          intensity: 0.6,
          resolution_strategy: 'switch roles based on context'
        }
      }
    }

    // Cultural role conflict
    if (role1.type === 'cultural' && role2.type === 'cultural') {
      if (role1.name === 'guardian' && role2.name === 'innovator') {
        return {
          agent_id: agent.genetics.seed,
          role1,
          role2,
          conflict_description: 'preserving tradition fundamentally conflicts with driving change',
          intensity: 0.9,
          resolution_strategy: 'choose a dominant role'
        }
      }
    }

    // Social role conflict
    if (role1.type === 'social' && role2.type === 'social') {
      if (role1.name === 'leader' && role2.name === 'follower') {
        return {
          agent_id: agent.genetics.seed,
          role1,
          role2,
          conflict_description: 'leading and following are contradictory identities',
          intensity: 0.7,
          resolution_strategy: 'switch based on group size'
        }
      }
    }

    // Check expectation conflicts
    const expectationConflict = this.checkExpectationConflict(role1, role2)
    if (expectationConflict) {
      return {
        agent_id: agent.genetics.seed,
        role1,
        role2,
        conflict_description: expectationConflict,
        intensity: 0.5,
        resolution_strategy: 'prioritize the role with higher identity strength'
      }
    }

    return null
  }

  /**
   * Check for expectation conflicts
   */
  private checkExpectationConflict(role1: SocialRole, role2: SocialRole): string | null {
    // Simplified: check keyword conflicts
    const conflictPairs = [
      ['obey', 'decide'],
      ['conserve', 'innovate'],
      ['independent', 'cooperate'],
      ['compete', 'harmonize']
    ]

    for (const [word1, word2] of conflictPairs) {
      const role1Has = role1.expectations.some(e => e.includes(word1))
      const role2Has = role2.expectations.some(e => e.includes(word2))

      if (role1Has && role2Has) {
        return `${role1.name} requires ${word1}, but ${role2.name} requires ${word2}`
      }
    }

    return null
  }

  /**
   * Role switching
   */
  switchRole(
    agent: PersonalAgentState,
    context: string,
    world: WorldSlice
  ): SocialRole | null {
    const roles = this.agentRoles.get(agent.genetics.seed) || []

    // Select the most appropriate role based on context
    for (const role of roles) {
      if (role.context.includes(context) || context.includes(role.context)) {
        return role
      }
    }

    // If no matching role, return the one with highest identity strength
    return roles.sort((a, b) => b.identity_strength - a.identity_strength)[0] || null
  }

  /**
   * Apply role influence to behavior
   */
  applyRoleInfluence(
    agent: PersonalAgentState,
    action: { type: string; target?: string },
    currentRole: SocialRole
  ): {
    modified: boolean
    influence_description: string
    behavior_change: number  // [-1, 1]
  } {
    let modified = false
    let influence_description = ''
    let behavior_change = 0

    // Leader role
    if (currentRole.name === 'leader') {
      if (action.type === 'help' || action.type === 'lead') {
        modified = true
        influence_description = 'leader role reinforced helping and leading behavior'
        behavior_change = 0.3
      }
    }

    // Mediator role
    if (currentRole.name === 'mediator') {
      if (action.type === 'compete' || action.type === 'conflict') {
        modified = true
        influence_description = 'mediator role suppressed competitive and conflict behavior'
        behavior_change = -0.4
      }
    }

    // Guardian role
    if (currentRole.name === 'guardian') {
      if (action.type === 'innovate' || action.type === 'change') {
        modified = true
        influence_description = 'guardian role suppressed innovation and change behavior'
        behavior_change = -0.3
      }
    }

    // Innovator role
    if (currentRole.name === 'innovator') {
      if (action.type === 'explore' || action.type === 'create') {
        modified = true
        influence_description = 'innovator role reinforced exploration and creation behavior'
        behavior_change = 0.4
      }
    }

    return { modified, influence_description, behavior_change }
  }

  /**
   * Get statistics
   */
  getStats() {
    const allRoles = Array.from(this.agentRoles.values()).flat()

    const roleTypeCounts = {
      professional: allRoles.filter(r => r.type === 'professional').length,
      family: allRoles.filter(r => r.type === 'family').length,
      social: allRoles.filter(r => r.type === 'social').length,
      cultural: allRoles.filter(r => r.type === 'cultural').length
    }

    const roleNameCounts = new Map<string, number>()
    for (const role of allRoles) {
      roleNameCounts.set(role.name, (roleNameCounts.get(role.name) || 0) + 1)
    }

    return {
      total_agents_with_roles: this.agentRoles.size,
      total_roles: allRoles.length,
      avg_roles_per_agent: allRoles.length / this.agentRoles.size || 0,
      role_type_distribution: roleTypeCounts,
      role_name_distribution: Object.fromEntries(roleNameCounts),
      total_conflicts: this.roleConflicts.length,
      avg_conflict_intensity: this.roleConflicts.reduce((sum, c) => sum + c.intensity, 0) / this.roleConflicts.length || 0
    }
  }

  /**
   * Get all roles for an agent
   */
  getAgentRoles(agentId: string): SocialRole[] {
    return this.agentRoles.get(agentId) || []
  }

  /**
   * Update from LLM feedback (system_feedback.current_role, role_conflict)
   */
  updateFromLLMFeedback(
    agentId: string,
    currentRole?: string,
    roleConflict?: string
  ): void {
    if (currentRole) {
      const roles = this.agentRoles.get(agentId) || []
      const existing = roles.find(r => r.name === currentRole)
      if (existing) {
        // Boost identity strength for the role the LLM reports
        existing.identity_strength = Math.min(1, existing.identity_strength + 0.05)
      } else {
        // LLM reported a new role — create it
        roles.push({
          id: `role-llm-${agentId}`,
          type: 'social',
          name: currentRole,
          expectations: [],
          obligations: [],
          privileges: [],
          identity_strength: 0.5,
          context: 'general',
        })
        this.agentRoles.set(agentId, roles)
      }
    }

    if (roleConflict) {
      const roles = this.agentRoles.get(agentId) || []
      if (roles.length >= 2) {
        this.roleConflicts.push({
          agent_id: agentId,
          role1: roles[0],
          role2: roles[1],
          conflict_description: roleConflict,
          intensity: 0.6,
          resolution_strategy: 'LLM-reported conflict',
        })
      }
    }
  }

  /**
   * Get all role conflicts
   */
  getAllConflicts(): RoleConflict[] {
    return this.roleConflicts
  }

  /**
   * Export snapshot
   */
  toSnapshot(): { agentRoles: Record<string, SocialRole[]>; roleConflicts: RoleConflict[] } {
    const agentRoles: Record<string, SocialRole[]> = {}
    for (const [id, roles] of this.agentRoles) {
      agentRoles[id] = roles
    }
    return { agentRoles, roleConflicts: this.roleConflicts }
  }

  /**
   * Restore from snapshot
   */
  fromSnapshot(snapshot: { agentRoles: Record<string, SocialRole[]>; roleConflicts: RoleConflict[] }): void {
    this.agentRoles.clear()
    for (const [id, roles] of Object.entries(snapshot.agentRoles)) {
      this.agentRoles.set(id, roles)
    }
    this.roleConflicts = snapshot.roleConflicts
  }
}
