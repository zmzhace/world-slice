export type AgentAction = {
  type:
    | 'remember'
    | 'forget'
    | 'reflect'
    | 'speak'
    | 'ask'
    | 'search'
    | 'approach'
    | 'withdraw'
    | 'reframe'
    | 'change_goal'
  target?: string
  intensity?: number
  payload?: Record<string, unknown>
}
