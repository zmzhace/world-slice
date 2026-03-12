import type { MemoryRecord } from '@/domain/world'

export function applyMemoryDecay(records: MemoryRecord[]): MemoryRecord[] {
  return records.map((record) => ({
    ...record,
    retrieval_strength: Math.max(0, record.retrieval_strength - record.decay_rate),
  }))
}
