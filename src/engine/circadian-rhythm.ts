/**
 * Circadian Rhythm System
 * Time-aware agent activation: agents have activity patterns,
 * sleep schedules, and timezone offsets that determine when they act.
 */

import type { PersonalAgentState, WorldSlice } from '@/domain/world'

export type CircadianConfig = {
  /** How many real-world hours one tick represents */
  hoursPerTick: number
  /** Base activity probability when no pattern is set */
  defaultActivityProbability: number
  /** Minimum activity probability (even sleeping agents can be woken) */
  minActivityProbability: number
  /** Energy recovery rate during sleep hours */
  sleepEnergyRecovery: number
  /** Stress reduction rate during sleep hours */
  sleepStressReduction: number
}

const DEFAULT_CONFIG: CircadianConfig = {
  hoursPerTick: 1,
  defaultActivityProbability: 0.6,
  minActivityProbability: 0.05,
  sleepEnergyRecovery: 0.08,
  sleepStressReduction: 0.04,
}

/**
 * Get the current world hour (0-23) from the world timestamp
 */
export function getWorldHour(world: WorldSlice, config: CircadianConfig = DEFAULT_CONFIG): number {
  const date = new Date(world.time)
  const tickHours = world.tick * config.hoursPerTick
  return (date.getUTCHours() + tickHours) % 24
}

/**
 * Get the local hour for an agent (accounting for timezone offset)
 */
export function getAgentLocalHour(worldHour: number, agent: PersonalAgentState): number {
  const offset = agent.timezone_offset || 0
  return ((worldHour + offset) % 24 + 24) % 24
}

/**
 * Determine if an agent is in their sleep window
 */
export function isInSleepWindow(localHour: number, agent: PersonalAgentState): boolean {
  const schedule = agent.sleep_schedule
  if (!schedule) return false

  const { typical_sleep_hour, typical_wake_hour } = schedule

  // Handle overnight sleep (e.g., sleep at 23, wake at 7)
  if (typical_sleep_hour > typical_wake_hour) {
    return localHour >= typical_sleep_hour || localHour < typical_wake_hour
  }
  // Handle same-day sleep (e.g., sleep at 1, wake at 9)
  return localHour >= typical_sleep_hour && localHour < typical_wake_hour
}

/**
 * Get the activity probability for an agent at the current world time.
 * Uses the agent's activity_pattern if available, otherwise derives from sleep_schedule.
 */
export function getActivityProbability(
  agent: PersonalAgentState,
  worldHour: number,
  config: CircadianConfig = DEFAULT_CONFIG
): number {
  const localHour = getAgentLocalHour(worldHour, agent)

  // If agent has a custom 24-hour activity pattern, use it directly
  if (agent.activity_pattern && agent.activity_pattern.length === 24) {
    const hourIdx = Math.floor(localHour) % 24
    return Math.max(config.minActivityProbability, agent.activity_pattern[hourIdx])
  }

  // Derive from sleep schedule
  if (agent.sleep_schedule) {
    if (isInSleepWindow(localHour, agent)) {
      return config.minActivityProbability
    }
    // Awake — use a bell curve peaking mid-day
    const wakeMid = getWakeMidpoint(agent.sleep_schedule)
    const distFromPeak = Math.abs(((localHour - wakeMid + 12) % 24) - 12)
    // Gaussian-ish: peak at 1.0, drops to ~0.4 at edges of waking hours
    return Math.max(config.minActivityProbability, Math.exp(-0.5 * (distFromPeak / 5) ** 2))
  }

  // No pattern or schedule — use default
  return config.defaultActivityProbability
}

function getWakeMidpoint(schedule: { typical_sleep_hour: number; typical_wake_hour: number }): number {
  const { typical_sleep_hour, typical_wake_hour } = schedule
  if (typical_sleep_hour > typical_wake_hour) {
    // Overnight: wake hours span from wake to sleep
    return (typical_wake_hour + typical_sleep_hour) / 2
  }
  // Same-day sleep: wake hours are outside the sleep window
  const wakeStart = typical_wake_hour
  const wakeEnd = typical_sleep_hour
  return (wakeStart + wakeEnd) / 2
}

/**
 * Apply circadian effects to an agent's vitals.
 * Called each tick to simulate sleep recovery and fatigue accumulation.
 */
export function applyCircadianEffects(
  agent: PersonalAgentState,
  worldHour: number,
  config: CircadianConfig = DEFAULT_CONFIG
): PersonalAgentState {
  const localHour = getAgentLocalHour(worldHour, agent)
  const sleeping = agent.sleep_schedule ? isInSleepWindow(localHour, agent) : false

  if (sleeping) {
    return {
      ...agent,
      vitals: {
        ...agent.vitals,
        energy: Math.min(1, agent.vitals.energy + config.sleepEnergyRecovery),
        stress: Math.max(0, agent.vitals.stress - config.sleepStressReduction),
        sleep_debt: Math.max(0, agent.vitals.sleep_debt - 0.05),
      },
    }
  }

  // Awake — slight fatigue accumulation, especially late at night
  const fatigueFactor = agent.sleep_schedule
    ? (isLateNight(localHour, agent.sleep_schedule) ? 0.03 : 0.01)
    : 0.01

  return {
    ...agent,
    vitals: {
      ...agent.vitals,
      sleep_debt: Math.min(1, agent.vitals.sleep_debt + fatigueFactor),
    },
  }
}

function isLateNight(localHour: number, schedule: { typical_sleep_hour: number; typical_wake_hour: number }): boolean {
  // "Late night" = within 2 hours before typical sleep time
  const beforeSleep = ((schedule.typical_sleep_hour - localHour + 24) % 24)
  return beforeSleep <= 2 && beforeSleep > 0
}

/**
 * Select which agents should be active this tick based on circadian rhythms.
 * Replaces the old tension-only activation logic in the orchestrator.
 */
export function selectActiveAgents(
  agents: PersonalAgentState[],
  world: WorldSlice,
  tensionFactor: number,
  config: CircadianConfig = DEFAULT_CONFIG
): PersonalAgentState[] {
  const worldHour = getWorldHour(world, config)

  const scored = agents.map(agent => {
    const activityProb = getActivityProbability(agent, worldHour, config)

    // Base score from circadian rhythm
    let score = activityProb

    // Tension boost: high tension wakes people up
    score += tensionFactor * 0.3

    // Urgency factors (same as before)
    if (agent.vitals.stress > 0.5) score += 0.2
    if (agent.goals.length > 0) score += 0.15
    if (agent.emotion.intensity > 0.5) score += 0.15
    // Agents who didn't act last tick get priority
    if (!agent.last_action_description) score += 0.3

    // Random jitter
    score += Math.random() * 0.2

    return { agent, score }
  })

  scored.sort((a, b) => b.score - a.score)

  // Dynamic active count: base 40%, tension can push to 80%
  const activeRatio = 0.4 + tensionFactor * 0.4
  const activeCount = Math.max(5, Math.min(agents.length, Math.round(agents.length * activeRatio)))

  return scored.slice(0, activeCount).map(s => s.agent)
}

/**
 * Generate a default sleep schedule for an agent based on their occupation/traits.
 * Used when creating new agents that don't have a schedule yet.
 */
export function generateDefaultSleepSchedule(agent: PersonalAgentState): {
  typical_sleep_hour: number
  typical_wake_hour: number
} {
  // Night owls: high openness, low stability
  if (agent.persona.openness > 0.7 && agent.persona.stability < 0.4) {
    return { typical_sleep_hour: 2, typical_wake_hour: 10 }
  }
  // Early birds: high stability, high agency
  if (agent.persona.stability > 0.7 && agent.persona.agency > 0.6) {
    return { typical_sleep_hour: 22, typical_wake_hour: 6 }
  }
  // Default: normal schedule with slight variation
  const sleepHour = 23 + Math.floor(Math.random() * 2) // 23-24
  const wakeHour = 6 + Math.floor(Math.random() * 2)   // 6-7
  return { typical_sleep_hour: sleepHour % 24, typical_wake_hour: wakeHour }
}
