import type { VitalsState } from '@/domain/world'

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function updateVitalsAfterTick(vitals: VitalsState): VitalsState {
  return {
    ...vitals,
    energy: clamp(vitals.energy - 0.02 + (1 - vitals.sleep_debt) * 0.01),
    stress: clamp(vitals.stress + 0.01),
    sleep_debt: clamp(vitals.sleep_debt + 0.01),
    focus: clamp(vitals.focus - 0.01),
    aging_index: clamp(vitals.aging_index + 0.005),
  }
}
