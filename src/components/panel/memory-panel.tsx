import React from 'react'
import type { WorldSlice } from '@/domain/world'

type MemoryPanelProps = {
  world: WorldSlice
}

export function MemoryPanel({ world }: MemoryPanelProps) {
  return (
    <section className="rounded border p-4">
      <h3 className="text-lg font-semibold">Memory & Vitals</h3>
      <div className="mt-2 text-sm text-slate-600">Short-term: {world.agents.personal.memory_short.length}</div>
      <div className="text-sm text-slate-600">Long-term: {world.agents.personal.memory_long.length}</div>
      <div className="text-sm text-slate-600">Energy: {world.agents.personal.vitals.energy.toFixed(2)}</div>
    </section>
  )
}
