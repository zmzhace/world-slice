<div align="center">

# World Slice

**给 LLM 一个世界设定，看它自己长出文明**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

[How It Works](#-how-it-works) · [Chat with Your World](#-chat-with-your-world) · [Mechanism Systems](#-mechanism-systems) · [Design Philosophy](#-design-philosophy)

</div>

---

## What Is This?

World Slice is an emergent world simulation engine. You describe a world, it generates characters with personalities, desires, and grudges — and then you let go.

No pre-written scripts. No behavior trees. Characters make their own decisions based on who they are, what they want, and who wronged them. Stories grow from chaos, all on their own.

> Think of it as a terrarium for civilizations. You build the jar, add the soil, and watch what grows.

---

## ✨ How It Works

Three steps. That's it.

```
 1. DESCRIBE        2. GENERATE         3. WATCH
 ───────────        ───────────         ─────────
 "A mountain        Engine spawns       Characters scheme,
  village where      10 characters       negotiate, betray,
  three clans        with personalities  and form alliances
  fight for          goals, and tangled  — all by themselves.
  power..."          relationships.
```

You type a world description. The engine creates characters, places them in your world, and advances time tick by tick. Each tick, every character independently decides what to do — powered by an LLM that sees their personality, desires, relationships, memories, and pressures. The results feed back into 12 interlocking mechanism systems that track reputation, resources, tension, memes, and more.

No one tells anyone to betray anyone. But when a vengeful person faces their enemy while resources are running out — betrayal just happens.

### See It in Action

Here is an actual exchange from a simulation set in a mountain village where three clans contest for power. No one scripted this:

> **Tick 1** — Linye leans in close and whispers to Moheng: "The scraps from the Back Valley poison pool — can you give the nod? Mutually beneficial."
>
> **Tick 1** — Qinghe immediately pushes back, invoking protocol: "Moheng the Enforcer is right here. What's with the private deal?"
>
> **Tick 2** — Moheng plays both sides, agreeing to each while secretly checking the ledgers. The golden-bell leaf shipment numbers don't add up...
>
> **Tick 3** — Linye notices Moheng's finger paused on a particular page of the ledger. She knows her moment has come.

Three characters with different desires, under resource pressure, navigating their own way to this moment. The engine just gave them context and let them decide.

---

## 💬 Chat with Your World

Want to shake things up? Type directly into the chat and watch your world react.

The chat system works like this:
1. **You type an event** — "A massive earthquake shakes the valley" or "A stranger arrives carrying a sealed letter"
2. **The LLM interprets it** — Your message becomes a world event with a type, intensity, and affected characters
3. **The world ticks forward** — Agents react to the event naturally on the next tick, weaving it into their ongoing plans and conflicts

It is a conversation with a living world. Say something, and the world answers back through its characters.

---

## 🎬 The Prologue

Every world begins at Tick 0 with a genesis event — a narrative seed that captures the essence of your world. This is not just flavor text; it is the foundation that every character, every social pressure, and every future event builds upon.

When you create a world, the engine generates:
- A vivid environment description
- Historical macro events that shaped this place
- Dominant narratives the inhabitants believe in
- Social pressures that drive conflict
- The institutions that hold (or fail to hold) power

From this soil, characters grow. Their goals, their grudges, their alliances — all rooted in the world you described.

---

## 🔄 The Tick Lifecycle

```
                    ┌─────────────┐
                    │  World State │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌─────────┐ ┌─────────┐ ┌─────────┐
         │ Agent A │ │ Agent B │ │ Agent C │  ← Each gets a tailored prompt
         │ (LLM)   │ │ (LLM)   │ │ (LLM)   │    (desires, scene, pressure, relationships)
         └────┬────┘ └────┬────┘ └────┬────┘
              │           │           │
              │    action + system_feedback
              ▼           ▼           ▼
         ┌─────────────────────────────────┐
         │       Mechanism System Router    │
         │  Reputation · Resources · Tension│
         │  Memes · Memory · Knowledge · ...│
         └───────────────┬─────────────────┘
                         │
                         ▼
                    ┌─────────────┐
                    │ World State' │ → Persisted, enters next tick
                    └─────────────┘
```

### The Key to Emergence

The engine never tells the LLM "create conflict." It does two things:

1. **Provides rich context** — who you are, what you want, who is near you, your history with them, which resources are dwindling, how people see you
2. **Lets the LLM decide** — then routes the results back through the mechanism systems

When someone filled with resentment faces their rival while supplies run low — conflict does not need to be scripted.

### Wave Execution

Characters at the same location execute in two waves. The first wave acts, and the second wave sees what happened and can respond. This lets dialogue, confrontation, and negotiation unfold naturally within a single tick.

---

## ⚙️ Mechanism Systems

12 systems run in parallel, persist across ticks, and form closed feedback loops with the LLM.

### The LLM Feedback Loop

Every time an agent acts, the LLM also self-evaluates the social impact of the action:

```json
{
  "action": { "type": "whispered negotiation", "target": "moheng" },
  "dialogue": "The scraps from the Back Valley — can you give the nod?",
  "system_feedback": {
    "reputation_impact": [{ "dimension": "trustworthiness", "delta": -0.05, "reason": "bypassing protocol" }],
    "resource_action": { "resource": "poison materials", "strategy": "cooperate" },
    "tension_effect": "building",
    "meme_spread": { "content": "Rules are for the weak", "category": "belief" }
  }
}
```

This feedback routes to the corresponding systems. System state changes inject into the next round's prompt. The loop closes.

### System Overview

| System | What It Does | How It Shapes Characters |
|:-------|:-------------|:------------------------|
| **Reputation** | Tracks trust / competence / status; witnesses spread gossip to friends | *"Your credibility is slipping. Qinghe is taking your place."* |
| **Resource Competition** | Dynamic resource pools with 6 strategies (compete / cooperate / steal...) | *"Supplies at 20%. Roughly 3 cycles until depletion."* |
| **Dramatic Tension** | Detects conflict from relationships and events; auto-accumulates and releases | *"The crisis between you and Moheng is reaching its peak."* |
| **Meme Propagation** | Beliefs / rumors / behaviors spread through social networks via SIR model | *"Lately everyone's been saying: 'Rules are just chains.'"* |
| **Social Roles** | Assigns emergent roles based on personality (leader / mediator / innovator...) | *"As mediator, you should resolve disputes and foster harmony."* |
| **Cognitive Bias** | Records LLM-reported decision biases; tracks group-level cognition | Analysis layer — surfaces systematic thinking patterns |
| **Attention** | Finite attention allocation; high-reputation agents get noticed more | Affects who notices whom and how information flows |
| **Emergence Detection** | Detects phase transitions, self-organization, synchronization, polarization | Spots macro-level tipping points and pattern shifts |
| **Knowledge Graph** | Entity-relationship network with causal chain tracking | Characters see causal links in their prompt context |
| **Narrative Recognition** | Auto-detects conflict / alliance / betrayal arcs from event streams | Detected story arcs are injected into character context |
| **Collective Memory** | Detects shared group memories; distills cultural norms | Cultural norms propagate and influence group behavior |
| **Hierarchical Memory** | Working memory (7 +/- 2) → Short-term (50) → Long-term (unlimited) | Important memories consolidate; trivia naturally fades |

---

## 🧬 Design Philosophy

### World Consistency (Highest Priority)

Everything in the simulation must obey the world's rules. No smartphones in a medieval setting. No magic in cyberpunk (unless the setting allows it). **World rules override real-world logic.**

### Generalized, Not Hardcoded

- Wuxia, cyberpunk, medieval, modern office drama — any world works
- Zero hardcoded character names, resource names, or UI text
- Characters, resources, and culture are all dynamically generated by the LLM
- The resource system starts empty and emerges organically from LLM feedback

### Language-Agnostic

- Prompts are written in English (best LLM comprehension)
- Generated content follows `world.config.language`
- Zero hardcoded strings in the codebase

### Emergence First, Minimal Rules

Do not tell the LLM "create conflict." Show it: your enemy is right here, resources are running out, your status is under threat. Conflict happens on its own.

**Fewer rules, more emergence.**

### Everything Persists

All 12 mechanism systems maintain state across ticks. Reputation does not reset. Memories do not vanish. Tension builds until it breaks. No system "starts from zero" each tick.

---

## 🚀 Quick Start

```bash
git clone https://github.com/zmzhace/world-slice.git
cd world-slice
npm install
```

Configure `.env.local`:

```env
WORLD_SLICE_API_BASE=your-api-base-url
WORLD_SLICE_API_KEY=your-api-key
WORLD_SLICE_MODEL=your-model-name
```

Compatible with any OpenAI / Anthropic-compatible API.

```bash
npm run dev
# Open http://localhost:3000 → Create a world → Advance time → Watch emergence
```

---

## 📁 Project Structure

```
src/
  domain/         Type definitions (WorldSlice, PersonalAgentState, NarrativePattern...)
  engine/
    orchestrator.ts              World tick driver
    npc-agent-executor.ts        Wave execution (co-located agents see each other)
    circadian-rhythm.ts          Circadian rhythm (who is awake, who is asleep)
    reputation-system.ts         Reputation (trust / propagation / decay)
    resource-competition-system.ts  Resource competition (allocation / conflict / cooperation)
    dramatic-tension-system.ts   Dramatic tension (buildup / eruption / release)
    meme-propagation-system.ts   Meme propagation (SIR model)
    knowledge-graph.ts           Knowledge graph (entity relations + causal chains)
    ...12 mechanism systems total
  server/llm/
    agent-decision-llm.ts        Agent decision prompt construction
    agent-generator.ts           Character generation (batched + cross-batch relationships)
    world-generator.ts           World generation
  components/     UI components (light, warm theme)
  store/          Zustand state management
app/
  api/            Next.js API routes
  worlds/         Pages
```

## Tech Stack

- **Next.js 14** + TypeScript (strict)
- **LLM API** — compatible with OpenAI / Anthropic interfaces
- **Zustand** — state management
- **Vitest** — testing

---

<div align="center">

**World Slice** — We don't write stories. We plant them.

[Back to top](#world-slice)

</div>
