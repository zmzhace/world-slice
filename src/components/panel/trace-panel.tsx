import React from 'react'
import type { WorldSlice } from '@/domain/world'

type TracePanelProps = {
  world: WorldSlice
}

export function TracePanel({ world }: TracePanelProps) {
  return (
    <section className="rounded border p-4">
      <h3 className="text-lg font-semibold">Trace</h3>
      <div className="mt-2 text-sm text-slate-600">Events: {world.events.length}</div>
      <div className="text-sm text-slate-600">Hooks: {world.active_hooks.length}</div>
    </section>
  )
}
