# Phase 1 启动指南

## 前置要求

1. Docker 和 Docker Compose
2. Node.js 18+
3. OpenAI API Key

## 步骤 1: 配置环境变量

复制 `.env.example` 到 `.env.local`:

```bash
cp .env.example .env.local
```

编辑 `.env.local`，添加你的 OpenAI API Key:

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

## 步骤 2: 启动 Qdrant 向量数据库

使用 Docker Compose 启动 Qdrant:

```bash
docker-compose up -d
```

验证 Qdrant 是否运行:

```bash
curl http://localhost:6333/
```

应该返回类似这样的响应:

```json
{
  "title": "qdrant - vector search engine",
  "version": "1.x.x"
}
```

## 步骤 3: 安装依赖

```bash
npm install
```

## 步骤 4: 测试基础设施

创建一个测试脚本 `test-infrastructure.ts`:

```typescript
import { getVectorDB } from './src/engine/vector-db'
import { getEmbeddingService } from './src/server/embedding/embedding-service'
import { GraphRAGEngine } from './src/engine/graph-rag-engine'

async function testInfrastructure() {
  console.log('Testing infrastructure...')
  
  // 1. 测试向量数据库
  console.log('\n1. Testing Vector Database...')
  const vectorDB = getVectorDB()
  await vectorDB.initialize()
  console.log('✓ Vector Database initialized')
  
  // 2. 测试 Embedding 服务
  console.log('\n2. Testing Embedding Service...')
  const embeddingService = getEmbeddingService()
  const embedding = await embeddingService.embed('Hello, world!')
  console.log(`✓ Generated embedding with ${embedding.length} dimensions`)
  
  // 3. 测试 GraphRAG
  console.log('\n3. Testing GraphRAG...')
  const graphRAG = new GraphRAGEngine(vectorDB, embeddingService)
  
  // 添加测试节点
  await graphRAG.addNode({
    id: 'test-agent-1',
    type: 'agent',
    label: 'Test Agent',
    properties: {
      name: 'Alice',
      occupation: 'Scientist'
    },
    semantic_tags: ['scientist', 'researcher'],
    created_at: Date.now(),
    updated_at: Date.now()
  })
  
  console.log('✓ Added test node')
  
  // 语义搜索
  const results = await graphRAG.semanticSearch('researcher', { topK: 5 })
  console.log(`✓ Semantic search returned ${results.length} results`)
  
  // 获取统计信息
  const stats = graphRAG.getStats()
  console.log('✓ Graph stats:', stats)
  
  console.log('\n✅ All tests passed!')
}

testInfrastructure().catch(console.error)
```

运行测试:

```bash
npx tsx test-infrastructure.ts
```

## 步骤 5: 启动开发服务器

```bash
npm run dev
```

## 验证清单

- [ ] Qdrant 容器正在运行
- [ ] OpenAI API Key 已配置
- [ ] 向量数据库初始化成功
- [ ] Embedding 服务可以生成向量
- [ ] GraphRAG 可以添加节点和搜索
- [ ] 开发服务器启动成功

## 故障排除

### Qdrant 无法启动

检查端口是否被占用:

```bash
lsof -i :6333
```

如果被占用，修改 `docker-compose.yml` 中的端口映射。

### OpenAI API 错误

确保:
1. API Key 正确
2. 有足够的配额
3. 网络可以访问 OpenAI API

### 向量数据库连接失败

检查 Qdrant 日志:

```bash
docker-compose logs qdrant
```

## 下一步

完成 Phase 1 后，继续 Phase 2：移除司命系统。

参考文档：
- [涌现式叙事系统架构](./涌现式叙事系统架构.md)
- [实施计划 Phase 1](./实施计划-Phase1.md)
