import { createAgentRegistry } from '../engine/agent-registry'
import type { PanguAgent } from '../domain/agents'
import { panguDirectorAgent } from './pangu-agent'

const registry = createAgentRegistry()

// 注册盘古导演 agent
registry.register(panguDirectorAgent)

export const registerPanguAgent = (agent: PanguAgent) => {
  registry.register(agent)
}

export const getPanguRegistry = () => registry
