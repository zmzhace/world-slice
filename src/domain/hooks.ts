export type HookTrigger =
  | 'before_tick'
  | 'after_tick'
  | 'before_action'
  | 'after_action'
  | 'before_memory_commit'
  | 'after_memory_commit'
  | 'before_search'
  | 'after_search'
  | 'before_persona_shift'
  | 'after_persona_shift'

export type HookScope = 'world' | 'persona' | 'social' | 'personal' | string

export type HookDefinition = {
  id: string
  scope: HookScope
  trigger: HookTrigger
  priority: number
  enabled: boolean
  handler?: (payload: unknown) => Promise<void> | void
}
