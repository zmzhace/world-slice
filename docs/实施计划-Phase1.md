# Phase 1 实施计划：基础设施升级

## 目标
建立涌现式叙事系统的基础设施，包括向量数据库、embedding 生成、GraphRAG 升级。

## 时间估计
1-2 周

## 技术选型

### 1. 向量数据库：Qdrant
**为什么选择 Qdrant**：
- 高性能向量搜索（支持 HNSW 算法）
- 支持过滤和混合查询
- 易于部署（Docker 一键启动）
- 开源免费
- TypeScript SDK 完善

**替代方案**：
- Weaviate：功能更强大，但配置复杂
- Pinecone：云服务，但需要付费
- Chroma：轻量级，但性能较弱

### 2. Embedding 模型：OpenAI text-embedding-3-large
**为什么选择**：
- 3072 维向量，高质量语义表示
- API 调用简单
- 成本可控（$0.13 / 1M tokens）
- 支持中英文

**替代方案**：
- text-embedding-3-small：更便宜，但质量稍低
- Jina Embeddings：开源，但需要自己部署

### 3. 图数据库：保持内存实现 + 持久化
**为什么不用 Neo4j**：
- 当前规模不需要专门的图数据库
- 内存实现更快
- 可以后续迁移到 Neo4j

**改进方案**：
- 添加持久化（JSON 文件）
- 添加索引优化
- 支持增量更新

## 实施步骤

### Step 1: 集成 Qdrant 向量数据库

#### 1.1 安装依赖
```bash
npm install @qdrant/js-client-rest
```

#### 1.2 启动 Qdrant 服务
```bash
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage:z \
  qdrant/qdrant
```

#### 1.3 创建向量数据库客户端
```typescript
// src/engine/vector-db.ts
import { QdrantClient } from '@qdrant/js-client-rest'

export class VectorDatabase {
  private client: QdrantClient
  
  constructor(url: string = 'http://localhost:6333') {
    this.client = new QdrantClient({ url })
  }
  
  async initialize() {
    // 创建集合
    await this.createCollections()
  }
  
  private async createCollections() {
    // 事件集合
    await this.client.createCollection('events', {
      vectors: {
        size: 3072,  // text-embedding-3-large
        distance: 'Cosine'
      }
    })
    
    // Agent 兴趣集合
    await this.client.createCollection('agent_interests', {
      vectors: {
        size: 3072,
        distance: 'Cosine'
      }
    })
    
    // 记忆集合
    await this.client.createCollection('memories', {
      vectors: {
        size: 3072,
        distance: 'Cosine'
      }
    })
  }
  
  async insertEvent(event: WorldEvent, embedding: number[]) {
    await this.client.upsert('events', {
      points: [{
        id: event.id,
        vector: embedding,
        payload: {
          type: event.type,
          timestamp: event.timestamp,
          payload: event.payload
        }
      }]
    })
  }
  
  async searchSimilarEvents(
    embedding: number[],
    options: { topK?: number; threshold?: number } = {}
  ) {
    const { topK = 10, threshold = 0.7 } = options
    
    const results = await this.client.search('events', {
      vector: embedding,
      limit: topK,
      score_threshold: threshold
    })
    
    return results
  }
}
```

### Step 2: 实现 Embedding 生成服务

#### 2.1 创建 Embedding 服务
```typescript
// src/server/embedding/embedding-service.ts
import OpenAI from 'openai'

export class EmbeddingService {
  private client: OpenAI
  
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  
  /**
   * 生成单个文本的 embedding
   */
  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      encoding_format: 'float'
    })
    
    return response.data[0].embedding
  }
  
  /**
   * 批量生成 embeddings
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    // OpenAI 支持批量，但有限制（最多 2048 个）
    const batchSize = 2048
    const results: number[][] = []
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-large',
        input: batch,
        encoding_format: 'float'
      })
      
      results.push(...response.data.map(d => d.embedding))
    }
    
    return results
  }
  
  /**
   * 计算两个向量的余弦相似度
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
  
  /**
   * 平均多个向量
   */
  averageEmbeddings(embeddings: number[][]): number[] {
    if (embeddings.length === 0) {
      throw new Error('Cannot average empty array')
    }
    
    const dim = embeddings[0].length
    const result = new Array(dim).fill(0)
    
    for (const embedding of embeddings) {
      for (let i = 0; i < dim; i++) {
        result[i] += embedding[i]
      }
    }
    
    for (let i = 0; i < dim; i++) {
      result[i] /= embeddings.length
    }
    
    return result
  }
}
```

### Step 3: 升级知识图谱为 GraphRAG

#### 3.1 扩展节点和边的数据结构
```typescript
// src/domain/graph-rag.ts
export type GraphRAGNode = {
  id: string
  type: 'agent' | 'event' | 'location' | 'organization' | 'concept' | 'plot' | 'memory'
  label: string
  properties: Record<string, any>
  
  // 语义层
  embedding?: number[]  // 3072 维向量
  semantic_tags: string[]  // 语义标签
  
  // 时序层
  created_at: number  // tick
  updated_at: number  // tick
  version: number
  history: NodeSnapshot[]
  
  // 推理层
  inferred_properties: Record<string, any>  // 推理出的属性
  confidence_scores: Record<string, number>  // 置信度
}

export type GraphRAGEdge = {
  id: string
  source: string  // node id
  target: string  // node id
  relation: RelationType
  
  // 语义层
  semantic_strength: number  // 语义相似度 [0-1]
  embedding?: number[]
  
  // 动态层
  weight: number  // 动态权重 [0-1]
  temporal_pattern: number[]  // 时间模式
  
  // 推理层
  inferred: boolean  // 是否为推理出的关系
  evidence: string[]  // 证据链
  confidence: number  // 置信度 [0-1]
  
  // 时序层
  created_at: number
  updated_at: number
  last_interaction: number  // 最后一次交互时间
}

type NodeSnapshot = {
  tick: number
  properties: Record<string, any>
  embedding?: number[]
}
```

#### 3.2 实现 GraphRAG 类
```typescript
// src/engine/graph-rag.ts
import { VectorDatabase } from './vector-db'
import { EmbeddingService } from '@/server/embedding/embedding-service'

export class GraphRAG {
  private nodes: Map<string, GraphRAGNode> = new Map()
  private edges: Map<string, GraphRAGEdge> = new Map()
  
  // 索引
  private nodesByType: Map<string, Set<string>> = new Map()
  private edgesBySource: Map<string, Set<string>> = new Map()
  private edgesByTarget: Map<string, Set<string>> = new Map()
  
  constructor(
    private vectorDB: VectorDatabase,
    private embeddingService: EmbeddingService
  ) {}
  
  /**
   * 添加节点（带 embedding）
   */
  async addNode(node: Omit<GraphRAGNode, 'embedding'>): Promise<void> {
    // 生成 embedding
    const text = this.nodeToText(node)
    const embedding = await this.embeddingService.embed(text)
    
    const fullNode: GraphRAGNode = {
      ...node,
      embedding,
      semantic_tags: node.semantic_tags || [],
      history: [],
      inferred_properties: {},
      confidence_scores: {}
    }
    
    this.nodes.set(node.id, fullNode)
    
    // 更新索引
    if (!this.nodesByType.has(node.type)) {
      this.nodesByType.set(node.type, new Set())
    }
    this.nodesByType.get(node.type)!.add(node.id)
    
    // 存储到向量数据库
    await this.vectorDB.insertEvent(
      { id: node.id, type: node.type, timestamp: new Date().toISOString() } as any,
      embedding
    )
  }
  
  /**
   * 语义搜索节点
   */
  async semanticSearch(
    query: string,
    options: { topK?: number; threshold?: number; nodeType?: string } = {}
  ): Promise<GraphRAGNode[]> {
    const { topK = 10, threshold = 0.7, nodeType } = options
    
    // 生成查询的 embedding
    const queryEmbedding = await this.embeddingService.embed(query)
    
    // 向量搜索
    const results = await this.vectorDB.searchSimilarEvents(queryEmbedding, {
      topK,
      threshold
    })
    
    // 转换为节点
    const nodes = results
      .map(r => this.nodes.get(r.id))
      .filter(n => n !== undefined) as GraphRAGNode[]
    
    // 按类型过滤
    if (nodeType) {
      return nodes.filter(n => n.type === nodeType)
    }
    
    return nodes
  }
  
  /**
   * 推理隐含关系
   */
  async inferRelationships(nodeId: string): Promise<GraphRAGEdge[]> {
    const node = this.nodes.get(nodeId)
    if (!node || !node.embedding) return []
    
    // 找到语义相似的节点
    const similarNodes = await this.findSimilarNodes(node, { threshold: 0.8 })
    
    const inferredEdges: GraphRAGEdge[] = []
    
    for (const similarNode of similarNodes) {
      // 检查是否已有直接关系
      const existingEdge = this.findEdge(nodeId, similarNode.id)
      if (existingEdge) continue
      
      // 推理关系类型
      const relationType = await this.inferRelationType(node, similarNode)
      
      if (relationType) {
        const edge: GraphRAGEdge = {
          id: `inferred-${nodeId}-${similarNode.id}`,
          source: nodeId,
          target: similarNode.id,
          relation: relationType,
          semantic_strength: this.embeddingService.cosineSimilarity(
            node.embedding,
            similarNode.embedding!
          ),
          weight: 0.5,  // 推理关系权重较低
          temporal_pattern: [],
          inferred: true,
          evidence: [`Semantic similarity: ${this.embeddingService.cosineSimilarity(node.embedding, similarNode.embedding!)}`],
          confidence: 0.7,
          created_at: Date.now(),
          updated_at: Date.now(),
          last_interaction: Date.now()
        }
        
        inferredEdges.push(edge)
        await this.addEdge(edge)
      }
    }
    
    return inferredEdges
  }
  
  /**
   * 找到相似节点
   */
  private async findSimilarNodes(
    node: GraphRAGNode,
    options: { threshold?: number; topK?: number } = {}
  ): Promise<GraphRAGNode[]> {
    if (!node.embedding) return []
    
    const { threshold = 0.7, topK = 10 } = options
    
    const results = await this.vectorDB.searchSimilarEvents(node.embedding, {
      topK,
      threshold
    })
    
    return results
      .map(r => this.nodes.get(r.id))
      .filter(n => n !== undefined && n.id !== node.id) as GraphRAGNode[]
  }
  
  /**
   * 推理关系类型
   */
  private async inferRelationType(
    node1: GraphRAGNode,
    node2: GraphRAGNode
  ): Promise<RelationType | null> {
    // 基于节点类型推理关系
    if (node1.type === 'agent' && node2.type === 'agent') {
      // 两个 agent 之间可能是 knows 或 likes
      return 'knows'
    } else if (node1.type === 'agent' && node2.type === 'location') {
      return 'located_in'
    } else if (node1.type === 'agent' && node2.type === 'event') {
      return 'participates_in'
    }
    
    return null
  }
  
  /**
   * 社区发现（使用 Louvain 算法）
   */
  async detectCommunities(): Promise<Map<string, Set<string>>> {
    // 简化版：基于连接密度
    const communities = new Map<string, Set<string>>()
    const visited = new Set<string>()
    
    for (const nodeId of this.nodes.keys()) {
      if (visited.has(nodeId)) continue
      
      const community = new Set<string>()
      const queue = [nodeId]
      
      while (queue.length > 0) {
        const current = queue.shift()!
        if (visited.has(current)) continue
        
        visited.add(current)
        community.add(current)
        
        // 找到强连接的邻居
        const neighbors = this.getStrongNeighbors(current, 0.7)
        queue.push(...neighbors.filter(n => !visited.has(n)))
      }
      
      if (community.size > 1) {
        communities.set(`community-${communities.size}`, community)
      }
    }
    
    return communities
  }
  
  /**
   * 获取强连接的邻居
   */
  private getStrongNeighbors(nodeId: string, threshold: number): string[] {
    const edges = [
      ...this.getOutgoingEdges(nodeId),
      ...this.getIncomingEdges(nodeId)
    ]
    
    return edges
      .filter(e => e.weight >= threshold)
      .map(e => e.source === nodeId ? e.target : e.source)
  }
  
  /**
   * 节点转文本（用于生成 embedding）
   */
  private nodeToText(node: Omit<GraphRAGNode, 'embedding'>): string {
    const parts = [
      `Type: ${node.type}`,
      `Label: ${node.label}`,
      ...node.semantic_tags.map(tag => `Tag: ${tag}`)
    ]
    
    // 添加重要属性
    for (const [key, value] of Object.entries(node.properties)) {
      if (typeof value === 'string' || typeof value === 'number') {
        parts.push(`${key}: ${value}`)
      }
    }
    
    return parts.join('. ')
  }
  
  // ... 其他方法（addEdge, getOutgoingEdges, getIncomingEdges 等）
}
```

### Step 4: 持久化支持

#### 4.1 添加持久化层
```typescript
// src/engine/graph-rag-persistence.ts
import fs from 'fs/promises'
import path from 'path'

export class GraphRAGPersistence {
  constructor(private dataDir: string = './data/graph-rag') {}
  
  async save(graph: GraphRAG): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true })
    
    const data = graph.toJSON()
    
    await fs.writeFile(
      path.join(this.dataDir, 'graph.json'),
      JSON.stringify(data, null, 2)
    )
  }
  
  async load(): Promise<GraphRAG | null> {
    try {
      const data = await fs.readFile(
        path.join(this.dataDir, 'graph.json'),
        'utf-8'
      )
      
      return GraphRAG.fromJSON(JSON.parse(data))
    } catch (error) {
      return null
    }
  }
}
```

## 测试计划

### 单元测试
- [ ] VectorDatabase 基本操作
- [ ] EmbeddingService embedding 生成
- [ ] GraphRAG 节点和边操作
- [ ] GraphRAG 语义搜索
- [ ] GraphRAG 关系推理

### 集成测试
- [ ] 完整的事件存储和检索流程
- [ ] Agent 兴趣向量生成和搜索
- [ ] 社区发现算法

### 性能测试
- [ ] 1000 个节点的搜索性能
- [ ] 10000 个节点的搜索性能
- [ ] 批量 embedding 生成性能

## 环境配置

### 环境变量
```bash
# .env.local
OPENAI_API_KEY=your_openai_api_key
QDRANT_URL=http://localhost:6333
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ./qdrant_storage:/qdrant/storage
```

## 成本估算

### OpenAI Embedding API
- 模型：text-embedding-3-large
- 价格：$0.13 / 1M tokens
- 估算：
  - 每个事件平均 100 tokens
  - 1000 个事件 = 100K tokens = $0.013
  - 10000 个事件 = 1M tokens = $0.13

### Qdrant
- 开源免费
- 自己部署，无额外成本

## 下一步

完成 Phase 1 后，进入 Phase 2：移除司命系统。
