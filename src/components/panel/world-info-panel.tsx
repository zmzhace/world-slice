import React from 'react'
import {
  Globe,
  BookOpen,
  MapPin,
  Cloud,
  Mountain,
  Landmark,
  Clock,
  Megaphone,
  ScrollText,
  AlertTriangle,
  Building2,
  Volume2,
} from 'lucide-react'
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
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-slate-500" />
        <h2 className="text-lg font-semibold text-slate-800">World Info</h2>
      </div>

      {/* Narrative Seed */}
      {genesisPayload?.narrative_seed && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 shadow-sm p-4">
          <div className="mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-600">Core Narrative</h3>
          </div>
          <p className="text-sm italic leading-relaxed text-slate-500">{genesisPayload.narrative_seed}</p>
        </div>
      )}

      {/* Environment */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 shadow-sm p-4">
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-600">Environment</h3>
        </div>
        <div className="space-y-2.5 text-sm">
          <div>
            <span className="font-medium text-slate-500">Description</span>
            <p className="mt-1 leading-relaxed text-slate-800">{world.environment.description}</p>
          </div>
          {genesisPayload?.region && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-500">Region:</span>
              <span className="text-slate-800">{genesisPayload.region}</span>
            </div>
          )}
          {genesisPayload?.climate && (
            <div className="flex items-center gap-2">
              <Cloud className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-500">Climate:</span>
              <span className="text-slate-800">{genesisPayload.climate}</span>
            </div>
          )}
          {genesisPayload?.terrain && (
            <div className="flex items-center gap-2">
              <Mountain className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-500">Terrain:</span>
              <span className="text-slate-800">{genesisPayload.terrain}</span>
            </div>
          )}
        </div>
      </div>

      {/* Social Context */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 shadow-sm p-4">
        <div className="mb-3 flex items-center gap-2">
          <Landmark className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-600">Social Context</h3>
        </div>
        <div className="space-y-3 text-sm">
          {world.social_context.macro_events.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <Megaphone className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium text-slate-500">Major Events</span>
              </div>
              <ul className="ml-5 list-disc space-y-1 text-slate-600">
                {world.social_context.macro_events.map((event, i) => (
                  <li key={i}>{event}</li>
                ))}
              </ul>
            </div>
          )}
          {world.social_context.narratives.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <ScrollText className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium text-slate-500">Narratives</span>
              </div>
              <ul className="ml-5 list-disc space-y-1 text-slate-600">
                {world.social_context.narratives.map((narrative, i) => (
                  <li key={i}>{narrative}</li>
                ))}
              </ul>
            </div>
          )}
          {world.social_context.pressures.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium text-slate-500">Social Pressures</span>
              </div>
              <ul className="ml-5 list-disc space-y-1 text-slate-600">
                {world.social_context.pressures.map((pressure, i) => (
                  <li key={i}>{pressure}</li>
                ))}
              </ul>
            </div>
          )}
          {world.social_context.institutions.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium text-slate-500">Institutions</span>
              </div>
              <ul className="ml-5 list-disc space-y-1 text-slate-600">
                {world.social_context.institutions.map((institution, i) => (
                  <li key={i}>{institution}</li>
                ))}
              </ul>
            </div>
          )}
          {world.social_context.ambient_noise.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5">
                <Volume2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium text-slate-500">Ambient</span>
              </div>
              <ul className="ml-5 list-disc space-y-1 text-slate-600">
                {world.social_context.ambient_noise.map((noise, i) => (
                  <li key={i}>{noise}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 shadow-sm p-4">
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-600">Timeline</h3>
        </div>
        <div className="space-y-2 text-sm">
          {genesisPayload?.initial_time && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Start:</span>
              <span className="text-slate-800">{genesisPayload.initial_time}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Tick:</span>
            <span className="font-mono text-slate-800">{world.tick}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
