# Phase 2 完成总结：移除司命系统，实现涌现式叙事

## 完成时间
2026-03-14

## 核心目标
✅ 彻底移除自上而下的剧情控制系统（司命）
✅ 实现真正的自下而上涌现式叙事

## 完成的工作

### 1. 创建涌现式叙事系统 ✅

#### 1.1 叙事类型定义 (`src/domain/narrative.ts`)
- 定义了 10 种叙事类型：conflict, alliance, romance, betrayal, discovery, transformation, quest, mystery, tragedy, triumph
- 完整的数据结构：
  - `NarrativePattern`: 叙事模式（强度、情感曲线、状态）
  - `StoryArc`: 故事弧（三幕剧结构、角色识别）
  - `NarrativeSummary`: 叙事总结（文本生成）
  - `NarrativeSystem`: 叙事系统（统计信息）

#### 1.2 叙事识别器 (`src/engine/narrative-recognizer.ts`)
- 从事件流中识别叙事模式
- 基于规则的模式匹配：
  - 冲突检测：情感极性相反
  - 联盟检测：协作性互动
  - 转变检测：agent 状态重大改变
  - 发现检测：知识获取事件
- 情感分析和关系追踪
- 叙事发展追踪（emerging → developing → climax → resolving → concluded）

#### 1.3 故事弧检测器 (`src/engine/story-arc-detector.ts`)
- 识别三幕剧结构（setup, rising, climax, falling, resolution）
- 角色识别：
  - 主角（protagonists）
  - 对手（antagonists）
  - 配角（supporting）
- 情感曲线和节奏分析
- 故事完整度计算

#### 1.4 叙事总结器 (`src/engine/narrative-summarizer.ts`)
- 将事件流总结为连贯的叙事文本
- 支持多种叙事视角：
  - 全知视角（omniscient）
  - 角色视角（character）
  - 观察者视角（observer）
- 分章节生成（序幕、发展、高潮、转折、尾声）
- 自动生成标题

### 2. 更新数据模型 ✅

#### 2.1 WorldSlice 更新
- ❌ 移除：`plots: PlotArc[]`
- ✅ 添加：`narratives: NarrativeSystem`
- 包含：patterns, arcs, summaries, stats

#### 2.2 PersonalAgentState 更新
- ❌ 移除：固定的 `role: 'protagonist' | 'supporting' | 'npc'`
- ✅ 添加：动态的 `narrative_roles`
  - 每个叙事中的角色可以不同
  - 包含参与度和影响力指标

### 3. 重构 Orchestrator ✅

#### 3.1 移除司命系统调用
- ❌ 删除：`checkPlotTriggers`
- ❌ 删除：`advancePlotStages`
- ❌ 删除：`applyPlotInfluenceToAgents`
- ❌ 删除：剧情事件生成

#### 3.2 集成叙事识别
- ✅ 每个 tick 识别新的叙事模式（最近 100 个事件）
- ✅ 更新现有叙事模式（追踪发展）
- ✅ 检测故事弧
- ✅ 更新现有故事弧
- ✅ 生成叙事总结（每 10 个 tick）
- ✅ 更新统计信息

### 4. 删除司命相关文件 ✅

#### 核心文件
- ✅ `src/domain/siming.ts` - 司命类型定义
- ✅ `src/server/llm/siming-generator.ts` - 司命剧情生成器
- ✅ `src/server/llm/siming-nuwa-coordinator.ts` - 司命-女娲协调器
- ✅ `src/engine/plot-executor.ts` - 剧情执行器

#### UI 组件
- ✅ `src/components/panel/siming-panel.tsx` - 司命面板

### 5. 更新 UI ✅

#### 5.1 创建叙事面板 (`src/components/panel/narrative-panel.tsx`)
- 统计信息卡片（活跃叙事、故事弧）
- 活跃叙事列表（带强度条、状态标签）
- 主线故事弧展示（三幕剧结构可视化）
- 支线故事弧展示
- 已完结叙事列表
- 叙事总结展示

#### 5.2 更新世界页面 (`app/worlds/[id]/page.tsx`)
- ❌ 移除："司命编织" 标签
- ✅ 添加："涌现叙事" 标签
- ✅ 替换：SimingPanel → NarrativePanel

#### 5.3 更新世界创建页面 (`app/worlds/new/page.tsx`)
- ❌ 移除：司命相关提示信息

## 核心理念转变

### 旧模式（司命系统）
```
司命预设剧情 → 设定触发条件 → 强制 agents 按剧本行动 → 检查成功/失败
```
**问题**：自上而下控制，限制了可能性空间

### 新模式（涌现式叙事）
```
Agents 自由互动 → 产生事件流 → 识别叙事模式 → 自然形成故事弧
```
**优势**：自下而上涌现，无限可能性

## 技术亮点

### 1. 叙事识别算法
- 事件聚类：找到相关的事件序列
- 模式匹配：基于规则识别叙事原型
- 置信度计算：多维度特征检测
- 去重合并：避免重复识别

### 2. 故事弧检测
- 按参与者分组叙事模式
- 分析三幕剧结构
- 识别角色（主角、对手、配角）
- 计算情感曲线和节奏

### 3. 叙事总结
- 基于模板的文本生成
- 支持多种叙事视角
- 分章节组织内容
- 自动生成标题

## 性能优化

### 1. 增量更新
- 只处理最近的事件（100 个）
- 只更新相关的叙事模式
- 避免重复计算

### 2. 并行处理
- 并行识别不同类型的叙事模式
- 并行更新现有模式

### 3. 定期总结
- 每 10 个 tick 生成一次总结
- 避免频繁的 LLM 调用

## 测试结果

### 编译检查
✅ 所有文件无编译错误
✅ 类型定义完整
✅ 导入路径正确

### 功能验证
- ✅ 叙事识别器可以识别多种模式
- ✅ 故事弧检测器可以形成完整结构
- ✅ 叙事总结器可以生成连贯文本
- ✅ UI 组件可以正确显示

## 与 Phase 1 的集成

Phase 2 建立在 Phase 1 的基础设施之上：
- 使用向量数据库存储事件 embedding（未来）
- 使用 GraphRAG 进行关系推理（未来）
- 使用推荐系统推荐相关事件（未来）

## 下一步计划

### Phase 3: 涌现式叙事的高级功能
1. 集成 LLM 进行更智能的叙事识别
2. 使用 embedding 进行语义相似度计算
3. 实现叙事预测（预测可能的发展方向）
4. 实现叙事干预（用户可以轻微影响叙事走向）
5. 实现多层次叙事（个人、群体、世界）

### Phase 4: 性能优化和规模化
1. 优化叙事识别算法
2. 实现叙事缓存
3. 支持更大规模的 agent 数量
4. 实现分布式叙事识别

## 总结

Phase 2 成功实现了从"自上而下控制"到"自下而上涌现"的根本性转变。

**核心成就**：
1. ✅ 完全移除了司命系统
2. ✅ 实现了涌现式叙事识别
3. ✅ 创建了完整的叙事系统
4. ✅ 更新了所有相关 UI

**系统优势**：
1. 真正的自主性：agents 不受预设剧情限制
2. 无限可能性：每次运行都会产生不同的故事
3. 更真实：叙事从真实互动中涌现
4. 可扩展：支持更多 agents 和更复杂的世界

**下一步**：
- 继续优化叙事识别算法
- 集成 Phase 1 的基础设施（向量数据库、GraphRAG）
- 实现更高级的叙事功能

---

**涌现式叙事系统已经就绪，准备进入下一阶段！** 🎉
