<div align="center">

# World Slice

**给 LLM 一个世界设定，看它自己长出文明**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

[快速开始](#-快速开始) · [工作原理](#-工作原理) · [机制系统](#-机制系统) · [设计哲学](#-设计哲学)

</div>

---

## 这是什么

World Slice 是一个涌现式世界模拟引擎。你描述一个世界，它生成角色、建立关系，然后——放手。

没有预设剧本。没有行为脚本。角色基于性格、欲望和恩怨自主决策，故事从混沌中自然生长。

```
你输入: "南疆古月山寨，三脉争权，修行者与蛊术交织"

引擎自动:
  → 生成 10 个角色（性格、背景、目标、关系网）
  → 每个 tick，每个角色由 LLM 独立决策
  → 声誉在目击者之间传播
  → 资源枯竭产生生存压力
  → 谣言和信念在社交网络中扩散
  → 张力自动积累直到爆发
  → 知识图谱记录一切因果

你得到: 一个不断演化的世界，故事自己写自己
```

### 实际效果

> **Tick 1** — 琳鸦压低声音试探墨衡："后谷毒池的边角料，可否由你点头？互利。"
>
> **Tick 1** — 青禾立刻反制，搬出规矩："墨衡执法使在此，何来单独一说？"
>
> **Tick 2** — 墨衡两边应承，暗中核查账册，发现金铃叶调拨数目对不上...
>
> **Tick 3** — 琳鸦注意到墨衡在账册某页停了手指，她知道机会来了。

没有人编排这些。三个有着不同欲望的角色，在资源紧缺的压力下，自己走向了这条路。

---

## 🚀 快速开始

```bash
git clone https://github.com/zmzhace/world-slice.git
cd world-slice
npm install
```

配置 `.env.local`：

```env
WORLD_SLICE_API_BASE=your-api-base-url
WORLD_SLICE_API_KEY=your-api-key
WORLD_SLICE_MODEL=your-model-name
```

兼容任何 OpenAI/Anthropic 兼容 API。

```bash
npm run dev
# 打开 http://localhost:3000 → 创建世界 → 推进时间 → 观察涌现
```

---

## 🔄 工作原理

### 一个 Tick 的生命周期

```
                    ┌─────────────┐
                    │  世界状态    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌─────────┐ ┌─────────┐ ┌─────────┐
         │ Agent A │ │ Agent B │ │ Agent C │  ← 各自收到定制 prompt
         │ (LLM)   │ │ (LLM)   │ │ (LLM)   │    (欲望、场景、压力、关系)
         └────┬────┘ └────┬────┘ └────┬────┘
              │           │           │
              │    行为 + system_feedback
              ▼           ▼           ▼
         ┌─────────────────────────────────┐
         │         机制系统路由              │
         │  声誉 · 资源 · 张力 · 模因 · ...  │
         └───────────────┬─────────────────┘
                         │
                         ▼
                    ┌─────────────┐
                    │  世界状态'   │ → 持久化，进入下一个 tick
                    └─────────────┘
```

### 涌现的关键

引擎不告诉 LLM"要有冲突"。它只做两件事：

1. **给足上下文** — 你是谁、你想要什么、谁在你身边、你们之间有什么恩怨、什么资源在枯竭、你的声誉如何
2. **让 LLM 自己决定** — 然后把结果反馈回机制系统

当一个怀着仇恨的人，面对仇人，在资源即将耗尽时——冲突不需要被编排。

### 波次执行

同一位置的角色分两波执行。第一波行动后，第二波能看到发生了什么并做出回应。这让对话和对抗能在一个 tick 内自然展开。

---

## ⚙️ 机制系统

每个系统独立运行、跨 tick 持久化、通过 LLM 反馈闭环驱动。

### LLM 反馈闭环

LLM 每次决策不只输出行为——它同时自评行为的社会影响：

```json
{
  "action": { "type": "低声交涉", "target": "guyu-mohen" },
  "dialogue": "墨衡，后谷的边角料可否由你点头？",
  "system_feedback": {
    "reputation_impact": [{ "dimension": "trustworthiness", "delta": -0.05, "reason": "试图绕过规矩" }],
    "resource_action": { "resource": "毒蛊素材", "strategy": "cooperate" },
    "tension_effect": "building",
    "meme_spread": { "content": "规矩是给弱者看的", "category": "belief" }
  }
}
```

反馈路由到对应系统，系统状态变化又注入下一轮的 prompt。闭环形成。

### 系统清单

| 系统 | 作用 | 怎么影响角色 |
|:-----|:-----|:------------|
| **声誉** | 追踪信任/能力/地位，目击者传播到朋友 | *"你的信任度在下滑，古月青禾正在取代你的位置"* |
| **资源竞争** | 动态资源池，6 种策略（竞争/合作/偷窃...） | *"物资只剩 20%，约 3 个周期后耗尽"* |
| **戏剧张力** | 从关系和事件中检测冲突，自动积累释放 | *"你和古月墨衡之间的危机正达到顶点"* |
| **模因传播** | 信念/谣言/行为在社交网络中 SIR 传播 | *"你最近总听人说：'规矩就是枷锁'"* |
| **社会角色** | 基于性格分配角色（领袖/调解者/创新者...） | *"身为调解者，你应当解决纠纷、促进和谐"* |
| **认知偏差** | 记录 LLM 自报的决策偏差，追踪群体认知 | 分析层，发现系统性思维倾向 |
| **注意力** | 有限注意力分配，高声誉者更被关注 | 影响谁注意到谁、信息传播效率 |
| **涌现检测** | 检测相变、自组织、同步、群体极化 | 发现宏观层面的突变模式 |
| **知识图谱** | 实体-关系网络，因果链追踪 | 角色在 prompt 中看到因果关系 |
| **叙事识别** | 从事件流中自动识别冲突/联盟/背叛等模式 | 识别的叙事弧注入角色上下文 |
| **集体记忆** | 检测群体共同记忆，提炼文化规范 | 文化规范传播，影响群体行为 |
| **分层记忆** | 工作记忆(7±2) → 短期(50) → 长期(∞) | 重要记忆巩固，琐事自然遗忘 |

---

## 🧬 设计哲学

### 世界一致性（最高优先级）

模拟中的一切必须符合世界设定。中世纪不出现手机，赛博朋克不出现魔法（除非设定允许）。**世界设定优先于现实逻辑。**

### 泛化，不绑定

- 修仙、赛博朋克、中世纪、现代职场——什么世界都行
- 不硬编码任何角色名、资源名、语言文本
- 角色、资源、文化全部由 LLM 动态生成
- 资源系统初始为空，从 LLM 反馈中动态涌现

### 语言无关

- Prompt 用英文（LLM 最佳理解）
- 生成内容跟随 `world.config.language`
- 代码中零硬编码文本

### 涌现优先，规则最少

不告诉 LLM "要有冲突"。给它看到：仇人就在面前 + 资源在枯竭 + 你的地位受威胁。冲突自然发生。

**规则越少，涌现越多。**

### 持久化一切

所有 12 个机制系统的状态跨 tick 保留。声誉不会重置，记忆不会丢失，张力持续积累直到爆发。没有任何系统"每 tick 从零开始"。

---

## 📁 项目结构

```
src/
  domain/         类型定义 (WorldSlice, PersonalAgentState, NarrativePattern...)
  engine/
    orchestrator.ts              世界 tick 驱动器
    npc-agent-executor.ts        波次执行 (同位置角色能看到彼此)
    circadian-rhythm.ts          昼夜节律 (谁醒着谁睡了)
    reputation-system.ts         声誉 (信任/传播/衰减)
    resource-competition-system.ts  资源竞争 (分配/冲突/合作)
    dramatic-tension-system.ts   张力 (积累/爆发/释放)
    meme-propagation-system.ts   模因传播 (SIR 模型)
    knowledge-graph.ts           知识图谱 (实体关系 + 因果链)
    ...共 12 个机制系统
  server/llm/
    agent-decision-llm.ts        Agent 决策 prompt 构建
    agent-generator.ts           角色生成 (分批 + 跨批关系)
    world-generator.ts           世界生成
  components/     UI 组件
  store/          Zustand 状态管理
app/
  api/            Next.js API routes
  worlds/         页面
```

## 技术栈

- **Next.js 14** + TypeScript (strict)
- **LLM API** — 兼容 OpenAI / Anthropic 接口
- **Zustand** — 状态管理
- **Vitest** — 测试

---

<div align="center">

**World Slice** — 不写故事，种故事。

[⬆ 回到顶部](#world-slice)

</div>
