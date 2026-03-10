import React from 'react'
import type { WorldSlice } from '@/domain/world'

type AgentPanelProps = {
  world: WorldSlice
}

export function AgentPanel({ world }: AgentPanelProps) {
  return (
    <section className="rounded border p-4">
      <h3 className="text-lg font-semibold">Agents</h3>
      <ul className="mt-2 text-sm text-slate-600">
        <li>Pangu: {world.agents.pangu.kind}</li>
        <li>Nuwa: {world.agents.nuwa.kind}</li>
        <li>Personal: {world.agents.personal.kind}</li>
        <li>Social: {world.agents.social.kind}</li>
      </ul>
    </section>
  )
}
