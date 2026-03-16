# Conversation Scenes — Multi-Turn Agent Dialogue

**Date:** 2026-03-16
**Status:** Approved
**Goal:** Enable emergent multi-turn conversations between colocated agents, driven by world pressure rather than rules.

## Problem

The current 2-wave execution model gives agents one LLM call per tick. Wave 2 agents can react to Wave 1's actions, but there is no back-and-forth. Agents announce — they don't converse. This limits emergent social dynamics: no arguments, negotiations, persuasion, or conspiracies can form within a single tick.

## Design Principles

- **No conversation rules.** Conversations emerge from context pressure (tension, resource competition, relationship intensity), not from rules like "you must talk."
- **Private inner worlds.** Each agent sees the shared transcript but interprets it through their own memories, biases, and desires. Inner monologue is private — deception and subtext emerge naturally.
- **LLM self-termination.** The LLM decides when there's nothing left to say. No external evaluator.
- **Same feedback loop.** Conversations produce the same `system_feedback` structure as single-shot decisions — no new system integrations needed.

## Architecture

### Conversation Trigger

A **conversation pressure score** is computed for each pair of colocated agents. No hard threshold — the top N pairs per location (1-2) enter conversations each tick.

Pressure signals (all from existing systems):

| Signal | Source System | Pressure Reason |
|--------|-------------|-----------------|
| Tension between agents | `dramatic-tension-system` | Unresolved conflict demands confrontation |
| Relationship intensity | `agent.relations` | Strong love OR strong hate drives interaction |
| Resource competition | `resource-competition-system` | Two agents claiming the same scarce resource |
| Meme carrying | `meme-propagation-system` | Agent carrying a rumor about the other agent |
| Reputation shift | `reputation-system` | Agent's rank just changed — others notice |
| Shared narrative role | `narrative-recognizer` | Both part of the same emerging story arc |

The score is a weighted sum. Quiet worlds produce fewer conversations; tense worlds produce more. This is purely emergent.

### Conversation Loop

```
Conversation Scene (AgentA vs AgentB at location)

  Round 1: AgentA speaks (randomly selected to go first)
    prompt = agent's full context + pressure awareness
    LLM returns: dialogue, inner_monologue, action,
                 system_feedback, continue_conversation

  Round 1: AgentB responds
    prompt = agent's full context + conversation transcript so far
    LLM returns: same structure

  Round 2+: alternating turns, conversation history grows

  Terminates when:
    - Both agents return continue_conversation: false
    - Either agent chooses "leave" as action
    - Safety cap: 6 rounds
```

Key properties:
- No conversation topic is injected as a rule — the prompt only surfaces the pressure ("you feel the tension about the stolen grain"). What agents say is up to the LLM.
- Each agent's prompt includes their own memories, desires, and biases — they share the transcript but interpret it differently.
- `inner_monologue` is private to each agent — only `dialogue` and `action` are shared. This creates natural deception and subtext.
- `continue_conversation` is the LLM's own judgment.

### Integration with Existing Systems

**During conversation:** Each round's LLM response includes `system_feedback`. Feedback accumulates across rounds:

```
Round 1: AgentA insults AgentB → reputation_impact: {target: B, delta: -0.1}
Round 2: AgentB threatens AgentA → tension_effect: {escalate, 0.3}
Round 3: AgentA backs down → reputation_impact: {target: A, delta: -0.2}
                             → tension_effect: {resolve, -0.5}
```

**After conversation ends:**

| System | What It Receives |
|--------|-----------------|
| `memory` | Full conversation as single memory record — both agents remember |
| `reputation` | Accumulated reputation impacts, colocated agents as witnesses |
| `dramatic-tension` | Net tension change — conversations can escalate or resolve |
| `meme-propagation` | New memes born from dialogue (threats become rumors) |
| `knowledge-graph` | Causal edges: "A confronted B → B threatened → A backed down" |
| `cognitive-bias` | Biases observed during conversation |
| `social-role` | Role shifts from conversation outcomes |

### Execution Flow (Modified Tick)

The wave system evolves:

1. **Circadian selection** — same as today
2. **Conversation trigger** — compute pressure scores for all colocated pairs, select top N
3. **Conversation scenes** — run multi-turn loops (parallel across locations)
4. **Remaining agents** — single-shot decisions as today, but with conversation outcomes visible as context ("You notice AgentA and AgentB arguing loudly nearby")
5. **Feedback routing** — all `system_feedback` (from conversations and single-shot) routed through existing 6-system pipeline

Bystanders can react to conversations they witness — emergence from observation.

## Data Model

```typescript
ConversationScene {
  id: string
  location: string
  participants: string[]            // agent seeds
  trigger: ConversationTrigger      // what pressure sparked this
  rounds: ConversationRound[]       // the transcript
  status: 'active' | 'concluded'
}

ConversationRound {
  speaker: string                   // agent seed
  dialogue: string                  // visible to all participants
  inner_monologue: string           // private to this agent only
  action: string                    // body language, gestures
  system_feedback: SystemFeedback   // same structure as today
  continue_conversation: boolean
}

ConversationTrigger {
  type: 'tension' | 'resource' | 'reputation' | 'meme' | 'narrative'
  pressure_score: number
  description: string               // human-readable, for prompt context
}
```

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `src/engine/conversation-scene.ts` | Pressure scoring + conversation loop execution |
| `src/domain/conversation.ts` | Type definitions (ConversationScene, ConversationRound, ConversationTrigger) |

### Modified Files

| File | Change |
|------|--------|
| `src/engine/npc-agent-executor.ts` | Identify conversation pairs before waves, run scenes, pass outcomes as context to remaining agents |
| `src/server/llm/agent-decision-llm.ts` | Conversation-mode prompt variant (includes transcript, pressure context) + `continue_conversation` in LLM response schema |
| `src/engine/orchestrator.ts` | Route per-round `system_feedback` through existing 6-system pipeline |
| `src/domain/agents.ts` | Add conversation-related types or re-export from conversation.ts |

### Unchanged

- All 12 mechanism systems — receive same `system_feedback` format
- Director/storyline system — operates independently
- Circadian rhythm — still controls who is active
- LLM client layer — same API, more calls

## Cost Estimate

- Current: ~1 LLM call per active agent per tick
- With conversations: ~1 call per non-conversing agent + ~3-6 calls per conversing agent (average 2-3 rounds x 2 participants)
- Expected: 3-5x total LLM calls per tick (acceptable per user budget)
