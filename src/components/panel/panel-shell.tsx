import React from 'react'
import type { WorldSlice } from '@/domain/world'
import { WorldInfoPanel } from './world-info-panel'

type PanelShellProps = {
  world: WorldSlice
}

export function PanelShell({ world }: PanelShellProps) {
  return (
    <section className="space-y-4 rounded-xl border border-white/[0.08] bg-[#141414] p-4">
      <WorldInfoPanel world={world} />
    </section>
  )
}
