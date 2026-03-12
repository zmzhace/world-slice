# Agent Observation Panel Design (2026-03-12)

## Scope & Goals
Redesign the right-side panel into an “Agent Observation Desk” that lets the user:
1) switch personal agents, and
2) view a natural-language observation summary covering: world state, other agents, social events, memory/cognition, and self-state.

The design assumes LLM-driven agent generation and observation summaries.

## Layout & Components
- **Top:** Personal Agent selector (dropdown/list)
- **Middle:** Single natural-language observation summary (covers all five categories)
- **Bottom:** Collapsible “World Snapshot” (tick/time, minimal metadata)

## Data Flow
- **Bootstrap:** user provides natural-language input → LLM interprets → Nuwa generates N personal agents → Pangu registers agents.
- **Selection:** user selects a personal agent → call LLM to generate that agent’s observation summary → render in panel.
- **World updates:** after tick/event updates, observation summary can be refreshed (manual button or auto refresh).

## Observation Content (Full Scope)
Summary must include:
- World understanding
- Understanding of other agents
- Social event understanding
- Memory/cognition
- Self-state understanding

## Error & Empty States
- LLM failure: show “Generation failed, retry” and keep last summary.
- No personal agents: prompt user to input description to generate agents.
- Loading: show progress + timestamp.

## Out of Scope (for now)
- Multi-panel breakdown by category (single summary only)
- Advanced timeline navigation UI

## Verification
- Panel renders with agent selector + summary + snapshot.
- Selecting different agents changes the summary.
- Empty/error/loading states display correctly.
