# World Slice — 项目准则

## 核心理念

World Slice 是一个通用世界模拟引擎。它的目标是**完全模仿一个世界**——世界中的一切事物、规律、行为逻辑都必须与设定的世界一致。

### 世界一致性原则（最高优先级）

- 模拟中的所有行为、事件、对话、决策都必须**符合该世界的设定规律**
- 如果世界设定是中世纪奇幻，就不能出现现代科技；如果是赛博朋克，就不能出现魔法（除非设定允许）
- NPC 的行为、语言风格、价值观必须与世界观一致
- 物理规律、社会规则、经济系统都应遵循世界设定
- 不要用现实世界的常识覆盖世界设定——**世界设定优先于现实逻辑**

### 语言无关性

- 引擎本身是语言无关的，支持任何语言的世界
- LLM prompt 用英文编写（最佳理解），但指示 LLM 根据世界描述的语言生成内容
- 代码中不硬编码任何特定语言的文本（中文、英文都不行）
- 可配置文本通过 `world.config` 传递

### 泛化原则

- 不绑定任何特定主题（神话、科幻、现实等都应支持）
- 不绑定任何特定角色（没有"盘古"、"女娲"等硬编码角色）
- 角色的职业、性格、能力、信仰全部由 LLM 根据世界描述动态生成
- 系统机制（声誉、资源、张力等）是通用的，不预设特定场景

## 技术栈

- Next.js + TypeScript
- Anthropic Claude API（通过 `createAnthropicClient`）
- Vitest 测试框架
- Zustand 状态管理

## 架构概览

```
src/
  domain/       — 类型定义（WorldSlice, PersonalAgentState 等）
  engine/       — 核心引擎（orchestrator, circadian, memory, persona 等）
  server/       — API 层 + LLM 调用（agent-generator, agent-decision, world-generator）
  components/   — UI 组件
  store/        — Zustand store
app/
  api/          — Next.js API routes
  worlds/       — 页面
```

## 关键约定

- `world.config.language` 决定生成内容的语言
- `world.environment.description` 是世界的核心设定，所有生成都以此为基础
- Agent 激活使用昼夜节律系统（`circadian-rhythm.ts`），不是简单的随机选择
- 每次修改都要提交到 GitHub

## 提交规范

- 每次有意义的改动都应提交并推送到 GitHub
- commit message 用中文或英文均可，保持简洁
- 不要积攒大量改动再一次性提交
