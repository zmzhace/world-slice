import React from 'react'
import type { WorldSlice } from '@/domain/world'

type WorldOverviewProps = {
  world: WorldSlice
}

export function WorldOverview({ world }: WorldOverviewProps) {
  return (
    <section className="rounded border p-4">
      <h3 className="text-lg font-semibold">World Overview</h3>
      <div className="mt-2 text-sm text-slate-600">Tick: {world.tick}</div>
      <div className="text-sm text-slate-600">Time: {world.time}</div>
    </section>
  )
}
