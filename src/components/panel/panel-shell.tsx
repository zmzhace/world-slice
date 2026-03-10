import React from 'react'
import type { WorldSlice } from '@/domain/world'
import { WorldOverview } from './world-overview'
import { AgentPanel } from './agent-panel'
import { MemoryPanel } from './memory-panel'
import { TracePanel } from './trace-panel'

type PanelShellProps = {
  world: WorldSlice
}

export function PanelShell({ world }: PanelShellProps) {
  return (
    <section className="space-y-4">
      <WorldOverview world={world} />
      <AgentPanel world={world} />
      <MemoryPanel world={world} />
      <TracePanel world={world} />
    </section>
  )
}
