import React from 'react'
import type { WorldSlice } from '@/domain/world'
import { ChevronDown, Globe } from 'lucide-react'

type WorldSnapshotProps = {
  world: WorldSlice
  defaultOpen?: boolean
}

export function WorldSnapshot({ world, defaultOpen = true }: WorldSnapshotProps) {
  return (
    <details className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-sm" open={defaultOpen}>
      <summary className="flex items-center gap-2 cursor-pointer font-medium text-slate-300 hover:text-slate-100 transition-colors list-none [&::-webkit-details-marker]:hidden">
        <Globe className="h-3.5 w-3.5 text-slate-500" />
        <span>World Snapshot</span>
        <ChevronDown className="ml-auto h-3.5 w-3.5 text-slate-500 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 space-y-1.5 text-xs">
        <SnapshotRow label="Tick" value={String(world.tick)} mono={false} />
        <SnapshotRow label="Time" value={new Date(world.time).toLocaleString()} mono={false} />
        <SnapshotRow label="World ID" value={world.world_id} mono />
        <SnapshotRow label="Environment" value={world.environment.description} mono={false} />
        {world.events.length > 0 && (
          <SnapshotRow label="Events" value={String(world.events.length)} mono={false} />
        )}
      </div>
    </details>
  )
}

function SnapshotRow({ label, value, mono }: { label: string; value: string; mono: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="font-medium text-slate-500 shrink-0">{label}</span>
      <span className={`text-slate-300 text-right truncate ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value}
      </span>
    </div>
  )
}
