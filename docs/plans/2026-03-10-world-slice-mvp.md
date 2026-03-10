# World Slice MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single-user, single-world multi-agent system with chat-first interaction, an observability panel, tick-based world evolution, memory decay, persona shaping, hook execution, and search-backed social context.

**Architecture:** Use a single Next.js + TypeScript application with shared domain schemas, a deterministic orchestrator, in-memory world state plus JSON snapshot persistence, and a web UI containing both chat and observability views. The orchestrator runs the Pangu, Nuwa, social background, and personal agents inside one process, with structured actions and a unified hook bus.

**Tech Stack:** Next.js, React, TypeScript, Node.js runtime, Vitest, Testing Library, Playwright, Zod, Tailwind CSS

---

### Task 1: Bootstrap the application shell

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/lib/utils.ts`
- Create: `.gitignore`
- Create: `public/.gitkeep`

**Step 1: Write the failing test**

Create `src/app-shell.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import HomePage from '../app/page'

describe('HomePage shell', () => {
  it('renders the world slice title', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { name: /world slice/i })).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app-shell.test.tsx`
Expected: FAIL because app files and test setup do not exist yet.

**Step 3: Write minimal implementation**

Create a minimal Next.js app shell with a root layout and home page containing a `World Slice` heading.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app-shell.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json tsconfig.json next.config.ts postcss.config.js tailwind.config.ts app/layout.tsx app/page.tsx app/globals.css vitest.config.ts playwright.config.ts src/lib/utils.ts src/app-shell.test.tsx .gitignore public/.gitkeep
git commit -m "feat: bootstrap world slice web app"
```

---

### Task 2: Define the shared world domain schema

**Files:**
- Create: `src/domain/world.ts`
- Create: `src/domain/actions.ts`
- Create: `src/domain/hooks.ts`
- Create: `src/domain/search.ts`
- Test: `src/domain/world.test.ts`

**Step 1: Write the failing test**

Create `src/domain/world.test.ts`:

```ts
import { createInitialWorldSlice } from './world'

describe('createInitialWorldSlice', () => {
  it('creates a single-user world with core agents and empty event history', () => {
    const world = createInitialWorldSlice()

    expect(world.tick).toBe(0)
    expect(world.agents.pangu.kind).toBe('world')
    expect(world.agents.nuwa.kind).toBe('persona')
    expect(world.agents.personal.kind).toBe('personal')
    expect(world.agents.social.kind).toBe('social')
    expect(world.events).toEqual([])
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/world.test.ts`
Expected: FAIL because schema helpers do not exist.

**Step 3: Write minimal implementation**

Define exact TypeScript types and factories for:
- `WorldSlice`
- `PersonalAgentState`
- `MemoryRecord`
- `VitalsState`
- `PersonaState`
- `SocialContext`
- `AgentAction`
- `HookDefinition`
- `SearchSignal`

Add `createInitialWorldSlice()` that returns a valid single-user world.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/domain/world.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/domain/world.ts src/domain/actions.ts src/domain/hooks.ts src/domain/search.ts src/domain/world.test.ts
git commit -m "feat: define world slice domain schema"
```

---

### Task 3: Implement memory decay and vitals transition logic

**Files:**
- Create: `src/engine/memory.ts`
- Create: `src/engine/vitals.ts`
- Test: `src/engine/memory.test.ts`
- Test: `src/engine/vitals.test.ts`

**Step 1: Write the failing tests**

Create `src/engine/memory.test.ts`:

```ts
import { applyMemoryDecay } from './memory'

it('reduces retrieval strength over time without deleting the memory', () => {
  const [memory] = applyMemoryDecay([
    {
      id: 'm1',
      content: 'old memory',
      importance: 0.8,
      emotional_weight: 0.4,
      source: 'self',
      timestamp: '2026-03-01T00:00:00.000Z',
      decay_rate: 0.1,
      retrieval_strength: 1,
    },
  ])

  expect(memory.retrieval_strength).toBeLessThan(1)
  expect(memory.content).toBe('old memory')
})
```

Create `src/engine/vitals.test.ts`:

```ts
import { updateVitalsAfterTick } from './vitals'

it('increases aging and preserves numeric bounds', () => {
  const vitals = updateVitalsAfterTick({
    energy: 0.8,
    stress: 0.2,
    sleep_debt: 0.1,
    focus: 0.7,
    aging_index: 0.3,
  })

  expect(vitals.aging_index).toBeGreaterThan(0.3)
  expect(vitals.energy).toBeGreaterThanOrEqual(0)
  expect(vitals.energy).toBeLessThanOrEqual(1)
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/engine/memory.test.ts src/engine/vitals.test.ts`
Expected: FAIL because transition helpers do not exist.

**Step 3: Write minimal implementation**

Implement pure functions that:
- decay retrieval strength by tick progression
- preserve memory records instead of deleting them
- update vitals with bounded numeric outputs
- slightly increase `aging_index` every tick

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/engine/memory.test.ts src/engine/vitals.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/memory.ts src/engine/vitals.ts src/engine/memory.test.ts src/engine/vitals.test.ts
git commit -m "feat: add memory decay and vitals transitions"
```

---

### Task 4: Implement persona drift and action normalization

**Files:**
- Create: `src/engine/persona.ts`
- Create: `src/engine/actions.ts`
- Test: `src/engine/persona.test.ts`
- Test: `src/engine/actions.test.ts`

**Step 1: Write the failing tests**

Create `src/engine/persona.test.ts`:

```ts
import { applyPersonaDrift } from './persona'

it('shifts persona slowly in response to repeated patterns', () => {
  const next = applyPersonaDrift(
    { openness: 0.5, stability: 0.5, attachment: 0.5, agency: 0.5, empathy: 0.5 },
    [{ key: 'withdraw', count: 5 }],
  )

  expect(next).not.toEqual({ openness: 0.5, stability: 0.5, attachment: 0.5, agency: 0.5, empathy: 0.5 })
  expect(Math.abs(next.agency - 0.5)).toBeLessThan(0.2)
})
```

Create `src/engine/actions.test.ts`:

```ts
import { normalizeAction } from './actions'

it('normalizes action intensity into a bounded range', () => {
  const action = normalizeAction({ type: 'search', intensity: 10 })
  expect(action.intensity).toBe(1)
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/engine/persona.test.ts src/engine/actions.test.ts`
Expected: FAIL because helpers do not exist.

**Step 3: Write minimal implementation**

Implement:
- bounded persona drift rules
- action normalization for type safety and intensity bounds
- defensive normalization for missing optional fields

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/engine/persona.test.ts src/engine/actions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/persona.ts src/engine/actions.ts src/engine/persona.test.ts src/engine/actions.test.ts
git commit -m "feat: implement persona drift and action normalization"
```

---

### Task 5: Build the hook bus

**Files:**
- Create: `src/engine/hooks.ts`
- Test: `src/engine/hooks.test.ts`

**Step 1: Write the failing test**

Create `src/engine/hooks.test.ts`:

```ts
import { createHookBus } from './hooks'

it('runs enabled hooks in priority order', async () => {
  const calls: string[] = []
  const bus = createHookBus()

  bus.register({ id: 'b', trigger: 'before_action', priority: 20, enabled: true, scope: 'personal', handler: async () => calls.push('b') })
  bus.register({ id: 'a', trigger: 'before_action', priority: 10, enabled: true, scope: 'personal', handler: async () => calls.push('a') })

  await bus.emit('before_action', {})

  expect(calls).toEqual(['a', 'b'])
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/engine/hooks.test.ts`
Expected: FAIL because hook bus does not exist.

**Step 3: Write minimal implementation**

Implement a hook bus with:
- registration
- priority sorting
- enabled filtering
- async emission
- typed lifecycle triggers

**Step 4: Run test to verify it passes**

Run: `npm test -- src/engine/hooks.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/hooks.ts src/engine/hooks.test.ts
git commit -m "feat: add lifecycle hook bus"
```

---

### Task 6: Implement the orchestrator tick loop

**Files:**
- Create: `src/engine/orchestrator.ts`
- Test: `src/engine/orchestrator.test.ts`

**Step 1: Write the failing test**

Create `src/engine/orchestrator.test.ts`:

```ts
import { createInitialWorldSlice } from '@/domain/world'
import { runWorldTick } from './orchestrator'

it('advances the world by one tick and appends an event', async () => {
  const world = createInitialWorldSlice()
  const next = await runWorldTick(world)

  expect(next.tick).toBe(1)
  expect(next.events.length).toBeGreaterThan(0)
  expect(next.agents.personal.action_history.length).toBe(1)
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/engine/orchestrator.test.ts`
Expected: FAIL because orchestrator does not exist.

**Step 3: Write minimal implementation**

Implement `runWorldTick(world)` that:
- emits `before_tick`
- advances tick/time
- runs social background update
- applies memory/vitals/persona transitions
- selects one structured action for the personal agent
- emits before/after action hooks
- appends an event
- emits `after_tick`

Use deterministic default logic first. Do not add LLM calls yet.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/engine/orchestrator.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/engine/orchestrator.ts src/engine/orchestrator.test.ts
git commit -m "feat: implement world tick orchestrator"
```

---

### Task 7: Add JSON snapshot persistence

**Files:**
- Create: `src/server/persistence.ts`
- Create: `data/.gitkeep`
- Test: `src/server/persistence.test.ts`

**Step 1: Write the failing test**

Create `src/server/persistence.test.ts`:

```ts
import { createInitialWorldSlice } from '@/domain/world'
import { saveWorldSlice, loadWorldSlice } from './persistence'

it('saves and reloads the world slice from disk', async () => {
  const world = createInitialWorldSlice()
  await saveWorldSlice(world)
  const loaded = await loadWorldSlice()
  expect(loaded?.world_id).toBe(world.world_id)
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/server/persistence.test.ts`
Expected: FAIL because persistence helpers do not exist.

**Step 3: Write minimal implementation**

Implement file-based JSON persistence using a fixed MVP location like `data/world-slice.json`.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/server/persistence.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/server/persistence.ts src/server/persistence.test.ts data/.gitkeep
git commit -m "feat: add world snapshot persistence"
```

---

### Task 8: Add chat-driven world update API

**Files:**
- Create: `app/api/chat/route.ts`
- Create: `src/server/chat.ts`
- Test: `src/server/chat.test.ts`

**Step 1: Write the failing test**

Create `src/server/chat.test.ts`:

```ts
import { handleChatTurn } from './chat'

it('returns a reply and updates the world summary after a user message', async () => {
  const result = await handleChatTurn({ message: '我今天有点累。' })

  expect(result.reply.length).toBeGreaterThan(0)
  expect(result.worldSummary.length).toBeGreaterThan(0)
  expect(result.world.tick).toBeGreaterThan(0)
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/server/chat.test.ts`
Expected: FAIL because chat orchestration does not exist.

**Step 3: Write minimal implementation**

Implement a server helper and API route that:
- loads or creates the world
- writes the user message as an event
- runs one tick
- saves the new world
- returns `reply`, `worldSummary`, and `world`

For MVP, the reply generator can be deterministic and template-based.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/server/chat.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/chat/route.ts src/server/chat.ts src/server/chat.test.ts
git commit -m "feat: add chat-driven world update api"
```

---

### Task 9: Build the chat UI

**Files:**
- Modify: `app/page.tsx`
- Create: `src/components/chat/chat-shell.tsx`
- Create: `src/components/chat/message-list.tsx`
- Create: `src/components/chat/chat-input.tsx`
- Test: `src/components/chat/chat-shell.test.tsx`

**Step 1: Write the failing test**

Create `src/components/chat/chat-shell.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatShell } from './chat-shell'

it('submits a message and renders the returned reply summary', async () => {
  const user = userEvent.setup()
  render(<ChatShell />)

  await user.type(screen.getByRole('textbox'), '你好，世界')
  await user.click(screen.getByRole('button', { name: /send/i }))

  expect(await screen.findByText(/world summary/i)).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/chat/chat-shell.test.tsx`
Expected: FAIL because the chat UI does not exist.

**Step 3: Write minimal implementation**

Build a simple chat shell that:
- renders message history
- posts to `/api/chat`
- shows the reply
- shows a world summary block

Update `app/page.tsx` to render the chat shell on the left and reserve space for the panel on the right.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/chat/chat-shell.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/page.tsx src/components/chat/chat-shell.tsx src/components/chat/message-list.tsx src/components/chat/chat-input.tsx src/components/chat/chat-shell.test.tsx
git commit -m "feat: add chat-first interface"
```

---

### Task 10: Build the observability panel

**Files:**
- Create: `src/components/panel/world-overview.tsx`
- Create: `src/components/panel/agent-panel.tsx`
- Create: `src/components/panel/memory-panel.tsx`
- Create: `src/components/panel/trace-panel.tsx`
- Create: `src/components/panel/panel-shell.tsx`
- Test: `src/components/panel/panel-shell.test.tsx`

**Step 1: Write the failing test**

Create `src/components/panel/panel-shell.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { createInitialWorldSlice } from '@/domain/world'
import { PanelShell } from './panel-shell'

it('renders world and agent panels from world state', () => {
  render(<PanelShell world={createInitialWorldSlice()} />)
  expect(screen.getByText(/world overview/i)).toBeInTheDocument()
  expect(screen.getByText(/agents/i)).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/panel/panel-shell.test.tsx`
Expected: FAIL because panel components do not exist.

**Step 3: Write minimal implementation**

Build a panel shell with:
- world overview card
- agent state card
- memory/vitals/persona card
- hook/action trace card

Bind it to the current `WorldSlice`.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/panel/panel-shell.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/panel/world-overview.tsx src/components/panel/agent-panel.tsx src/components/panel/memory-panel.tsx src/components/panel/trace-panel.tsx src/components/panel/panel-shell.tsx src/components/panel/panel-shell.test.tsx
git commit -m "feat: add world observability panel"
```

---

### Task 11: Integrate the panel with the page state

**Files:**
- Modify: `app/page.tsx`
- Modify: `src/components/chat/chat-shell.tsx`
- Modify: `src/components/panel/panel-shell.tsx`
- Test: `src/app-integration.test.tsx`

**Step 1: Write the failing test**

Create `src/app-integration.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import HomePage from '../app/page'

it('renders both chat and observability panel containers', () => {
  render(<HomePage />)
  expect(screen.getByText(/world slice/i)).toBeInTheDocument()
  expect(screen.getByText(/world overview/i)).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app-integration.test.tsx`
Expected: FAIL until the page composes both major surfaces.

**Step 3: Write minimal implementation**

Wire page-level state so that:
- the current world is stored in one place
- the chat UI can update it after each message
- the panel re-renders live from the same state

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app-integration.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add app/page.tsx src/components/chat/chat-shell.tsx src/components/panel/panel-shell.tsx src/app-integration.test.tsx
git commit -m "feat: connect chat and panel state"
```

---

### Task 12: Add search provider abstraction and social-context mapping

**Files:**
- Create: `src/server/search/provider.ts`
- Create: `src/server/search/mapper.ts`
- Modify: `src/engine/orchestrator.ts`
- Test: `src/server/search/mapper.test.ts`
- Test: `src/engine/orchestrator.search.test.ts`

**Step 1: Write the failing tests**

Create `src/server/search/mapper.test.ts`:

```ts
import { mapSearchResultsToSocialContext } from './mapper'

it('maps search results into structured social context', () => {
  const context = mapSearchResultsToSocialContext([
    { title: 'News', summary: 'Stress is rising', url: 'https://example.com' },
  ])

  expect(context.narratives.length).toBeGreaterThan(0)
  expect(context.pressures.length).toBeGreaterThan(0)
})
```

Create `src/engine/orchestrator.search.test.ts`:

```ts
import { createInitialWorldSlice } from '@/domain/world'
import { runWorldTick } from './orchestrator'

it('can incorporate mapped search context during a tick', async () => {
  const world = createInitialWorldSlice()
  const next = await runWorldTick(world, {
    search: async () => [{ title: 'Economic update', summary: 'anxious market', url: 'https://example.com' }],
  })

  expect(next.social_context.narratives.length).toBeGreaterThan(0)
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/server/search/mapper.test.ts src/engine/orchestrator.search.test.ts`
Expected: FAIL because provider abstraction and mapping do not exist.

**Step 3: Write minimal implementation**

Implement:
- a search provider interface
- a simple mapper from search results to `narratives`, `pressures`, and `macro_events`
- orchestrator support for optional search-backed social context

Use dependency injection so tests stay deterministic.

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/server/search/mapper.test.ts src/engine/orchestrator.search.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/server/search/provider.ts src/server/search/mapper.ts src/engine/orchestrator.ts src/server/search/mapper.test.ts src/engine/orchestrator.search.test.ts
git commit -m "feat: add search-backed social context"
```

---

### Task 13: Add end-to-end verification

**Files:**
- Create: `tests/e2e/chat-world-panel.spec.ts`

**Step 1: Write the failing test**

Create `tests/e2e/chat-world-panel.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test('chat updates world panel after a user turn', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.getByRole('textbox').fill('今天感觉有点累')
  await page.getByRole('button', { name: /send/i }).click()

  await expect(page.getByText(/world summary/i)).toBeVisible()
  await expect(page.getByText(/world overview/i)).toBeVisible()
})
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/chat-world-panel.spec.ts`
Expected: FAIL until the app is fully wired.

**Step 3: Write minimal implementation**

Make any final wiring fixes needed so the chat flow and panel flow work together in the browser.

**Step 4: Run test to verify it passes**

Run: `npx playwright test tests/e2e/chat-world-panel.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/e2e/chat-world-panel.spec.ts
git commit -m "test: verify chat and panel end-to-end flow"
```

---

### Task 14: Verify the full MVP locally

**Files:**
- Modify: any files required by verification fixes

**Step 1: Run targeted unit and integration tests**

Run: `npm test`
Expected: PASS

**Step 2: Run end-to-end tests**

Run: `npx playwright test`
Expected: PASS

**Step 3: Run the development app manually**

Run: `npm run dev`
Expected: The app starts successfully and supports a chat turn that updates the panel.

**Step 4: Fix only failures found in verification**

Make the smallest changes needed to get all verification green.

**Step 5: Commit**

```bash
git add <exact files changed during verification>
git commit -m "fix: complete world slice mvp verification"
```
