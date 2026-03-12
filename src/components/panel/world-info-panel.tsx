import React from 'react'
import type { WorldSlice } from '@/domain/world'

type WorldInfoPanelProps = {
  world: WorldSlice
}

export function WorldInfoPanel({ world }: WorldInfoPanelProps) {
  // Get world genesis event
  const genesisEvent = world.events.find(e => e.type === 'world_created')
  const genesisPayload = genesisEvent?.payload as any

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">世界信息</h2>
      
      {/* Narrative Seed */}
      {genesisPayload?.narrative_seed && (
        <div className="rounded-lg border bg-slate-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">核心叙事</h3>
          <p className="text-sm italic text-slate-600">{genesisPayload.narrative_seed}</p>
        </div>
      )}

      {/* Environment */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">环境</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-slate-600">描述：</span>
            <p className="mt-1 text-slate-700">{world.environment.description}</p>
          </div>
          {genesisPayload?.region && (
            <div>
              <span className="font-medium text-slate-600">区域：</span>
              <span className="ml-2 text-slate-700">{genesisPayload.region}</span>
            </div>
          )}
          {genesisPayload?.climate && (
            <div>
              <span className="font-medium text-slate-600">气候：</span>
              <span className="ml-2 text-slate-700">{genesisPayload.climate}</span>
            </div>
          )}
          {genesisPayload?.terrain && (
            <div>
              <span className="font-medium text-slate-600">地形：</span>
              <span className="ml-2 text-slate-700">{genesisPayload.terrain}</span>
            </div>
          )}
        </div>
      </div>

      {/* Social Context */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">社会背景</h3>
        <div className="space-y-3 text-sm">
          {world.social_context.macro_events.length > 0 && (
            <div>
              <span className="font-medium text-slate-600">重大事件：</span>
              <ul className="mt-1 list-inside list-disc space-y-1 text-slate-700">
                {world.social_context.macro_events.map((event, i) => (
                  <li key={i}>{event}</li>
                ))}
              </ul>
            </div>
          )}
          {world.social_context.narratives.length > 0 && (
            <div>
              <span className="font-medium text-slate-600">主流叙事：</span>
              <ul className="mt-1 list-inside list-disc space-y-1 text-slate-700">
                {world.social_context.narratives.map((narrative, i) => (
                  <li key={i}>{narrative}</li>
                ))}
              </ul>
            </div>
          )}
          {world.social_context.pressures.length > 0 && (
            <div>
              <span className="font-medium text-slate-600">社会压力：</span>
              <ul className="mt-1 list-inside list-disc space-y-1 text-slate-700">
                {world.social_context.pressures.map((pressure, i) => (
                  <li key={i}>{pressure}</li>
                ))}
              </ul>
            </div>
          )}
          {world.social_context.institutions.length > 0 && (
            <div>
              <span className="font-medium text-slate-600">主要机构：</span>
              <ul className="mt-1 list-inside list-disc space-y-1 text-slate-700">
                {world.social_context.institutions.map((institution, i) => (
                  <li key={i}>{institution}</li>
                ))}
              </ul>
            </div>
          )}
          {world.social_context.ambient_noise.length > 0 && (
            <div>
              <span className="font-medium text-slate-600">环境氛围：</span>
              <ul className="mt-1 list-inside list-disc space-y-1 text-slate-700">
                {world.social_context.ambient_noise.map((noise, i) => (
                  <li key={i}>{noise}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">时间线</h3>
        <div className="space-y-2 text-sm">
          {genesisPayload?.initial_time && (
            <div>
              <span className="font-medium text-slate-600">起始时间：</span>
              <span className="ml-2 text-slate-700">{genesisPayload.initial_time}</span>
            </div>
          )}
          <div>
            <span className="font-medium text-slate-600">世界周期：</span>
            <span className="ml-2 text-slate-700">Tick {world.tick}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
