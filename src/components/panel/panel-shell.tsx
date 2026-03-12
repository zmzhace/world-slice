import React from 'react'
import type { WorldSlice } from '@/domain/world'
import { AgentPanel } from './agent-panel'

type PanelShellProps = {
  world: WorldSlice
}

export function PanelShell({ world }: PanelShellProps) {
  return (
    <section className="space-y-4">
      <AgentPanel world={world} />
    </section>
  )
}
