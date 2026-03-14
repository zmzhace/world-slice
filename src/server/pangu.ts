import { createAgentRegistry } from '../engine/agent-registry'
import type { PanguAgent } from '../domain/agents'
import { panguDirectorAgent } from './pangu-agent'

const registry = createAgentRegistry()

// Register story director agent
registry.register(panguDirectorAgent)

export const registerDirectorAgent = (agent: PanguAgent) => {
  registry.register(agent)
}

export const getDirectorRegistry = () => registry
