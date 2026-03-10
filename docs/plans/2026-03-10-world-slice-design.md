# World Slice Design

**Date:** 2026-03-10
**Status:** Approved
**Scope:** MVP, single-user single-world

---

## 1. Goal

Build a multi-agent "world slice" system where a single user's inner world and outer social world evolve together over time. The system should make users feel that they are interacting with a living world, while still providing a clear observability layer for inspecting state, memory decay, hooks, and agent actions.

The MVP should prioritize:
- chat as the main interaction surface
- a web panel for deeper inspection and debugging
- a persistent world state that evolves in ticks
- memory decay tied to aging and body-state abstractions
- structured agent actions and hookable lifecycle events
- online search as input to social context, not direct truth

---

## 2. Product Shape

### Main entry: chat

The user primarily interacts with the system through conversation. A user message is not handled as plain Q&A. Instead, it is treated as an event that can alter world state, trigger one or more ticks, activate agents, and update memory, emotion, or goals.

Each response should include:
1. the natural-language reply
2. an internal world-change summary
3. optionally, traceable state changes shown in the panel

### Secondary entry: web panel

The web panel acts as an interpreter for the hidden world dynamics. It should make the system explainable rather than mysterious.

The panel should expose:
- world overview
- agent states
- memory/persona/vitals views
- hook and action traces

---

## 3. Core Agents

### Pangu: world evolution agent

Responsibilities:
- advance time and world ticks
- maintain global world rules and phase transitions
- generate macro world changes
- coordinate world-level narrative continuity

Pangu behaves like a world engine plus macro-level director.

### Nuwa: persona shaping agent

Responsibilities:
- adjust long-term persona vectors slowly over time
- infer personality drift from repeated behavior and repeated experiences
- keep personality evolution coherent across many ticks

Nuwa should not produce fast emotional changes. It should only govern slow personality movement.

### Personal agent

Responsibilities:
- represent the user's in-world self
- maintain short-term and long-term memory
- maintain vitals, emotion, goals, and relationships
- perceive events and choose actions from the action space

This is the main subjective agent.

### Social background agent

Responsibilities:
- generate ambient social context
- inject narratives, pressure, institutions, and macro events
- optionally use online search to ground social context in real-world signals

This agent turns raw external information into structured background influence.

---

## 4. Two-Layer World Model

The world should evolve across two tightly coupled layers.

### Inner layer

The personal layer contains:
- memory
- vitals
- emotion
- persona
- goals
- relationships

### Outer layer

The social layer contains:
- events
- narratives
- institutions
- ambient pressure
- environmental change

### Coupling rule

Outer-world change influences the person.
The person's actions can also influence the outer-world trajectory.

This is important for making the world feel alive instead of scripted.

---

## 5. World Evolution Loop

Every tick should follow a deterministic orchestration flow.

1. **Pangu advances the world**
   - increment tick/time
   - update environment
   - determine macro changes

2. **Social background agent injects context**
   - produce social events, narratives, pressure
   - optionally trigger online search and transform results into structured context

3. **Personal agent perceives**
   - read relevant world events and relationship changes
   - interpret them through current memory, emotion, vitals, and goals

4. **Nuwa updates persona trend**
   - slowly shift personality dimensions based on repeated patterns

5. **Personal agent chooses an action**
   - select one structured action from the allowed action space

6. **Hooks execute**
   - run lifecycle hooks before/after actions, memory updates, search, and persona shifts

7. **World slice persists**
   - commit new state for events, memory strength, relationships, vitals, and action history

Key behavioral rules:
- persona changes slowly
- emotion changes quickly
- memory decays rather than disappearing instantly
- search-derived information becomes social context, not direct truth

---

## 6. Core Data Model

### WorldSlice

The persistent world state should contain:
- `world_id`
- `tick`
- `time`
- `environment`
- `social_context`
- `agents`
- `events`
- `relations`
- `active_hooks`

The world slice is the canonical state for both chat replies and panel rendering.

### PersonalAgentState

Each personal agent should contain:
- `identity`
- `memory_short`
- `memory_long`
- `vitals`
- `emotion`
- `persona`
- `goals`
- `relations`
- `action_history`

### Memory model

Each memory record should contain:
- `content`
- `importance`
- `emotional_weight`
- `source`
- `timestamp`
- `decay_rate`
- `retrieval_strength`

Decay should reduce retrieval quality and detail resolution. Emotional residue can outlast factual precision.

### Vitals model

The MVP should use abstract body-state signals:
- `energy`
- `stress`
- `sleep_debt`
- `focus`
- `aging_index`

Vitals should influence:
- memory retrieval probability
- action preference
- emotional stability
- sensitivity to outer-world stress

### Persona model

The MVP should use a small vector of continuous traits:
- `openness`
- `stability`
- `attachment`
- `agency`
- `empathy`

Nuwa should update these gradually.

### SocialContext

The social layer should contain:
- `macro_events`
- `narratives`
- `pressures`
- `institutions`
- `ambient_noise`

This allows the system to map search results into world influence without letting raw content directly control the personal agent.

---

## 7. Action Space

The action space should be structured, not free-form.

Initial action types:
- `remember`
- `forget`
- `reflect`
- `speak`
- `ask`
- `search`
- `approach`
- `withdraw`
- `reframe`
- `change_goal`

Suggested shape:

```ts
type AgentAction = {
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
```

A structured action space is important because it:
- makes panel visualization possible
- supports reliable hook interception and mutation
- reduces prompt ambiguity inside orchestration

---

## 8. Hook System

The MVP should support a unified event-bus style hook model.

Initial lifecycle triggers:
- `before_tick`
- `after_tick`
- `before_action`
- `after_action`
- `before_memory_commit`
- `after_memory_commit`
- `before_search`
- `after_search`
- `before_persona_shift`
- `after_persona_shift`

Each hook should define:
- `scope` (`world`, `persona`, `social`, `personal`, or specific agent)
- `trigger`
- `priority`
- `enabled`
- `handler` or `script`

### Hook execution modes

1. **System hooks**
   - registered handlers with stable interfaces
   - safe and predictable

2. **Restricted script hooks**
   - dynamic injection for advanced customization
   - must run in a constrained environment with explicit permissions and state boundaries

The hook system should be first-class because the product vision explicitly includes the ability to operate on any agent hook.

---

## 9. Online Search Integration

Online search should be attached to the social background agent, not directly exposed as a truth source for the personal agent.

Recommended flow:
1. social background agent determines whether external information is needed
2. trigger `before_search`
3. call a search provider
4. extract structured signals from search results
5. map signals into `macro_events`, `narratives`, or `pressures`
6. trigger `after_search`
7. inject structured output into world state

This preserves realism while preventing direct contamination of the subjective agent state by raw web content.

---

## 10. Interface Design

### Chat view

The main conversational interface should:
- accept user input as world-affecting events
- trigger one or more world ticks
- return a reply composed from both agent state and world state

### Panel views

The initial panel should contain four major sections.

#### A. World overview
- tick
- world time
- macro events
- active pressure/narratives
- high-level world summary

#### B. Agent panel
- all core agents
- current state
- recent actions
- recent decisions
- recent hook triggers

#### C. Memory / persona / vitals panel
- short-term memory
- long-term memory
- retrieval strength / decay curves
- persona vector history
- vitals history

#### D. Hook / action trace panel
- triggered hooks
- modified actions
- modified memory writes
- search calls and post-processing

---

## 11. MVP Technical Direction

Recommended stack:
- **Frontend:** Next.js
- **Language:** TypeScript
- **Backend/API:** Next.js server routes or a lightweight Node orchestration layer
- **Persistence:** in-memory state plus JSON snapshot persistence for MVP
- **Agent orchestration:** custom orchestrator service
- **Search integration:** provider abstraction
- **Hook runtime:** event bus + handler registry + restricted script execution

Rationale:
- fast to build
- fits both chat and admin panel in one app
- keeps state modeling simple in the first iteration
- easy to expand into a real database later

---

## 12. Scope Boundaries for MVP

Included:
- single-user single-world
- one persistent world state
- the four core agents
- tick-based evolution
- memory decay
- vitals abstraction
- persona drift
- structured actions
- lifecycle hooks
- chat + observability panel
- search-backed social context

Excluded for MVP:
- multi-user worlds
- shared-world collaboration
- detailed medical modeling
- arbitrary infinite agent expansion
- full autonomous sandbox ecosystems
- production-grade distributed orchestration

---

## 13. Testing Strategy

The implementation should be validated at three levels.

### Unit tests
- memory decay calculations
- vitals influence rules
- persona drift logic
- hook dispatch and priority ordering
- action validation and normalization

### Integration tests
- single tick orchestration
- search-to-social-context mapping
- hook interception modifying action or memory commit
- chat event causing world updates

### UI tests
- panel renders world state correctly
- chat responses show state-derived summaries
- trace view correctly shows hooks and actions

---

## 14. Recommended MVP Milestones

1. bootstrap Next.js + TypeScript app
2. define shared world and agent schemas
3. implement deterministic orchestrator tick loop
4. implement memory/vitals/persona state transitions
5. implement structured action system
6. implement hook bus and system hooks
7. add chat-driven world update flow
8. add admin panel views
9. add search provider abstraction and social-context ingestion
10. add persistence snapshots and test coverage

---

## 15. Final Recommendation

Build the first version as a **single-user, single-world, chat-first multi-agent system** with a strong observability panel. Keep the world alive through deterministic ticks, structured actions, slow persona drift, memory decay, and social context grounded by search.

This gives the project a strong experiential core without overbuilding the initial architecture.
