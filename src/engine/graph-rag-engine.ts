/**
 * GraphRAG 引擎 - 核心实现
 * 提供语义搜索、关系推理、社区发现等功能
 */

import type {
  GraphRAGNode,
  GraphRAGEdge,
  NodeType,
  RelationType,
  Community,
  GraphRAGStats,
  GraphRAGJSON
} from '@/domain/graph-rag'
import { VectorDatabase } from './vector-db'
import { EmbeddingService } from '@/server/embedding/embedding-service'

export class GraphRAGEngine {
  private nodes: Map<string, GraphRAGNode> = new Map()
  private edges: Map<string, GraphRAGEdge> = new Map()
  
  // 索引：加速查询
  private nodesByType: Map<NodeType, Set<string>> = new Map()
  private edgesBySource: Map<string, Set<string>> = new Map()
  private edgesByTarget: Map<string, Set<string>> = new Map()
  private edgesByRelation: Map<RelationType, Set<string>> = new Map()
  
  constructor(
    private vectorDB: VectorDatabase,
    private embeddingService: EmbeddingService
  ) {}
  
  /**
   * 添加节点（带 embedding 生成）
   */
  async addNode(node: Omit<GraphRAGNode, 'embedding' | 'version' | 'history' | 'inferred_properties' | 'confidence_scores'>): Promise<void> {
    // 生成节点的文本表示
    const text = this.nodeToText(node)
    
    // 生成 embedding
    const embedding = await this.embeddingService.embed(text)
    
    // 构建完整节点
    const fullNode: GraphRAGNode = {
      ...node,
      embedding,
      semantic_tags: node.semantic_tags || [],
      version: 1,
      history: [],
      inferred_properties: {},
      confidence_scores: {}
    }
    
    // 存储节点
    this.nodes.set(node.id, fullNode)
    
    // 更新类型索引
    if (!this.nodesByType.has(node.type)) {
      this.nodesByType.set(node.type, new Set())
    }
    this.nodesByType.get(node.type)!.add(node.id)
    
    // 存储到向量数据库
    await this.vectorDB.insert('nodes', node.id, embedding, {
      type: node.type,
      label: node.label,
      created_at: node.created_at,
      updated_at: node.updated_at
    })
    
    console.log(`[GraphRAG] Added node: ${node.id} (${node.type})`)
  }
  
  /**
   * 更新节点
   */
  async updateNode(nodeId: string, updates: Partial<GraphRAGNode>): Promise<void> {
    const node = this.nodes.get(nodeId)
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`)
    }
    
    // 保存历史快照
    node.history.push({
      tick: node.updated_at,
      properties: { ...node.properties },
      embedding: node.embedding
    })
    
    // 应用更新
    const updatedNode = {
      ...node,
      ...updates,
      version: node.version + 1,
      updated_at: updates.updated_at || Date.now()
    }
    
    // 如果属性变化，重新生成 embedding
    if (updates.properties || updates.label) {
      const text = this.nodeToText(updatedNode)
      updatedNode.embedding = await this.embeddingService.embed(text)
      
      // 更新向量数据库
      await this.vectorDB.insert('nodes', nodeId, updatedNode.embedding, {
        type: updatedNode.type,
        label: updatedNode.label,
        created_at: updatedNode.created_at,
        updated_at: updatedNode.updated_at
      })
    }
    
    this.nodes.set(nodeId, updatedNode)
  }
  
  /**
   * 添加边
   */
  async addEdge(edge: GraphRAGEdge): Promise<void> {
    this.edges.set(edge.id, edge)
    
    // 更新索引
    if (!this.edgesBySource.has(edge.source)) {
      this.edgesBySource.set(edge.source, new Set())
    }
    this.edgesBySource.get(edge.source)!.add(edge.id)
    
    if (!this.edgesByTarget.has(edge.target)) {
      this.edgesByTarget.set(edge.target, new Set())
    }
    this.edgesByTarget.get(edge.target)!.add(edge.id)
    
    if (!this.edgesByRelation.has(edge.relation)) {
      this.edgesByRelation.set(edge.relation, new Set())
    }
    this.edgesByRelation.get(edge.relation)!.add(edge.id)
  }
  
  /**
   * 获取节点
   */
  getNode(id: string): GraphRAGNode | undefined {
    return this.nodes.get(id)
  }
  
  /**
   * 获取边
   */
  getEdge(id: string): GraphRAGEdge | undefined {
    return this.edges.get(id)
  }
  
  /**
   * 获取某类型的所有节点
   */
  getNodesByType(type: NodeType): GraphRAGNode[] {
    const nodeIds = this.nodesByType.get(type) || new Set()
    return Array.from(nodeIds)
      .map(id => this.nodes.get(id)!)
      .filter(node => node !== undefined)
  }
  
  /**
   * 获取节点的所有出边
   */
  getOutgoingEdges(nodeId: string): GraphRAGEdge[] {
    const edgeIds = this.edgesBySource.get(nodeId) || new Set()
    return Array.from(edgeIds)
      .map(id => this.edges.get(id)!)
      .filter(edge => edge !== undefined)
  }
  
  /**
   * 获取节点的所有入边
   */
  getIncomingEdges(nodeId: string): GraphRAGEdge[] {
    const edgeIds = this.edgesByTarget.get(nodeId) || new Set()
    return Array.from(edgeIds)
      .map(id => this.edges.get(id)!)
      .filter(edge => edge !== undefined)
  }
  
  /**
   * 获取节点的所有邻居
   */
  getNeighbors(nodeId: string): GraphRAGNode[] {
    const neighbors = new Set<string>()
    
    // 出边的目标节点
    for (const edge of this.getOutgoingEdges(nodeId)) {
      neighbors.add(edge.target)
    }
    
    // 入边的源节点
    for (const edge of this.getIncomingEdges(nodeId)) {
      neighbors.add(edge.source)
    }
    
    return Array.from(neighbors)
      .map(id => this.nodes.get(id)!)
      .filter(node => node !== undefined)
  }
  
  /**
   * 语义搜索节点
   */
  async semanticSearch(
    query: string,
    options: {
      topK?: number
      threshold?: number
      nodeType?: NodeType
    } = {}
  ): Promise<Array<{ node: GraphRAGNode; score: number }>> {
    const { topK = 10, threshold = 0.7, nodeType } = options
    
    // 生成查询的 embedding
    const queryEmbedding = await this.embeddingService.embed(query)
    
    // 向量搜索
    const results = await this.vectorDB.search('nodes', queryEmbedding, {
      topK: topK * 2,  // 多取一些，后面过滤
      threshold
    })
    
    // 转换为节点并按类型过滤
    const nodes = results
      .map(r => ({
        node: this.nodes.get(r.id),
        score: r.score
      }))
      .filter(item => item.node !== undefined)
      .filter(item => !nodeType || item.node!.type === nodeType) as Array<{ node: GraphRAGNode; score: number }>
    
    return nodes.slice(0, topK)
  }
  
  /**
   * 查找相似节点（基于 embedding）
   */
  async findSimilarNodes(
    nodeId: string,
    options: {
      topK?: number
      threshold?: number
      nodeType?: NodeType
    } = {}
  ): Promise<Array<{ node: GraphRAGNode; similarity: number }>> {
    const node = this.nodes.get(nodeId)
    if (!node || !node.embedding) {
      return []
    }
    
    const { topK = 10, threshold = 0.7, nodeType } = options
    
    // 向量搜索
    const results = await this.vectorDB.search('nodes', node.embedding, {
      topK: topK + 1,  // +1 因为会包含自己
      threshold
    })
    
    // 转换为节点并过滤
    return results
      .filter(r => r.id !== nodeId)  // 排除自己
      .map(r => ({
        node: this.nodes.get(r.id),
        similarity: r.score
      }))
      .filter(item => item.node !== undefined)
      .filter(item => !nodeType || item.node!.type === nodeType) as Array<{ node: GraphRAGNode; similarity: number }>
  }
  
  /**
   * 推理隐含关系
   */
  async inferRelationships(nodeId: string): Promise<GraphRAGEdge[]> {
    const node = this.nodes.get(nodeId)
    if (!node || !node.embedding) {
      return []
    }
    
    // 找到语义相似的节点
    const similarNodes = await this.findSimilarNodes(nodeId, {
      topK: 20,
      threshold: 0.75
    })
    
    const inferredEdges: GraphRAGEdge[] = []
    
    for (const { node: similarNode, similarity } of similarNodes) {
      // 检查是否已有直接关系
      const existingEdge = this.findEdgeBetween(nodeId, similarNode.id)
      if (existingEdge) continue
      
      // 推理关系类型
      const relationType = this.inferRelationType(node, similarNode)
      
      if (relationType) {
        const edge: GraphRAGEdge = {
          id: `inferred-${nodeId}-${similarNode.id}`,
          source: nodeId,
          target: similarNode.id,
          relation: relationType,
          semantic_strength: similarity,
          weight: similarity * 0.7,  // 推理关系权重稍低
          temporal_pattern: [],
          inferred: true,
          evidence: [`Semantic similarity: ${similarity.toFixed(3)}`],
          confidence: similarity * 0.8,
          created_at: Date.now(),
          updated_at: Date.now(),
          last_interaction: Date.now()
        }
        
        inferredEdges.push(edge)
        await this.addEdge(edge)
      }
    }
    
    console.log(`[GraphRAG] Inferred ${inferredEdges.length} relationships for node ${nodeId}`)
    return inferredEdges
  }
  
  /**
   * 推理关系类型
   */
  private inferRelationType(
    node1: GraphRAGNode,
    node2: GraphRAGNode
  ): RelationType | null {
    // 基于节点类型推理关系
    if (node1.type === 'agent' && node2.type === 'agent') {
      return 'similar_to'
    } else if (node1.type === 'agent' && node2.type === 'location') {
      return 'located_in'
    } else if (node1.type === 'agent' && node2.type === 'event') {
      return 'participates_in'
    } else if (node1.type === 'event' && node2.type === 'event') {
      return 'related_to'
    } else if (node1.type === 'narrative' && node2.type === 'event') {
      return 'part_of'
    }
    
    return 'similar_to'  // 默认关系
  }
  
  /**
   * 查找两个节点之间的边
   */
  private findEdgeBetween(sourceId: string, targetId: string): GraphRAGEdge | undefined {
    const outEdges = this.getOutgoingEdges(sourceId)
    return outEdges.find(e => e.target === targetId)
  }
  
  /**
   * 社区发现（简化版 Louvain 算法）
   */
  async detectCommunities(): Promise<Community[]> {
    const communities: Community[] = []
    const visited = new Set<string>()
    
    for (const nodeId of this.nodes.keys()) {
      if (visited.has(nodeId)) continue
      
      const members = new Set<string>()
      const queue = [nodeId]
      
      while (queue.length > 0) {
        const current = queue.shift()!
        if (visited.has(current)) continue
        
        visited.add(current)
        members.add(current)
        
        // 找到强连接的邻居（权重 > 0.6）
        const neighbors = this.getStrongNeighbors(current, 0.6)
        queue.push(...neighbors.filter(n => !visited.has(n)))
      }
      
      if (members.size > 1) {
        // 计算社区密度
        const density = this.calculateCommunityDensity(members)
        
        // 找到中心节点（度数最高）
        const centralNode = this.findCentralNode(members)
        
        communities.push({
          id: `community-${communities.length}`,
          members,
          density,
          central_node: centralNode
        })
      }
    }
    
    console.log(`[GraphRAG] Detected ${communities.length} communities`)
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
      .filter(e => e.weight >= threshold && !e.inferred)  // 只考虑真实关系
      .map(e => e.source === nodeId ? e.target : e.source)
  }
  
  /**
   * 计算社区密度
   */
  private calculateCommunityDensity(members: Set<string>): number {
    if (members.size < 2) return 0
    
    let edgeCount = 0
    const maxEdges = members.size * (members.size - 1) / 2
    
    for (const nodeId of members) {
      const edges = this.getOutgoingEdges(nodeId)
      edgeCount += edges.filter(e => members.has(e.target)).length
    }
    
    return edgeCount / maxEdges
  }
  
  /**
   * 找到社区的中心节点
   */
  private findCentralNode(members: Set<string>): string {
    let maxDegree = -1
    let centralNode = ''
    
    for (const nodeId of members) {
      const degree = this.getOutgoingEdges(nodeId).length + this.getIncomingEdges(nodeId).length
      if (degree > maxDegree) {
        maxDegree = degree
        centralNode = nodeId
      }
    }
    
    return centralNode
  }
  
  /**
   * 获取图谱统计信息
   */
  getStats(): GraphRAGStats {
    const nodesByType: Record<string, number> = {}
    for (const [type, nodeIds] of this.nodesByType.entries()) {
      nodesByType[type] = nodeIds.size
    }
    
    const totalDegrees = Array.from(this.nodes.keys()).reduce((sum, nodeId) => {
      return sum + this.getOutgoingEdges(nodeId).length + this.getIncomingEdges(nodeId).length
    }, 0)
    
    const inferredEdges = Array.from(this.edges.values()).filter(e => e.inferred).length
    
    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.size,
      nodesByType: nodesByType as Record<NodeType, number>,
      avgDegree: this.nodes.size > 0 ? totalDegrees / this.nodes.size : 0,
      communities: 0,  // 需要调用 detectCommunities() 才能知道
      inferredEdges
    }
  }
  
  /**
   * 节点转文本（用于生成 embedding）
   */
  private nodeToText(node: Omit<GraphRAGNode, 'embedding' | 'version' | 'history' | 'inferred_properties' | 'confidence_scores'>): string {
    const parts = [
      `Type: ${node.type}`,
      `Label: ${node.label}`
    ]
    
    // 添加语义标签
    if (node.semantic_tags && node.semantic_tags.length > 0) {
      parts.push(`Tags: ${node.semantic_tags.join(', ')}`)
    }
    
    // 添加重要属性
    for (const [key, value] of Object.entries(node.properties)) {
      if (typeof value === 'string' || typeof value === 'number') {
        parts.push(`${key}: ${value}`)
      } else if (Array.isArray(value) && value.length > 0) {
        parts.push(`${key}: ${value.join(', ')}`)
      }
    }
    
    return parts.join('. ')
  }
  
  /**
   * 导出为 JSON
   */
  toJSON(): GraphRAGJSON {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values()),
      metadata: {
        created_at: new Date().toISOString(),
        version: '1.0.0'
      }
    }
  }
  
  /**
   * 从 JSON 导入
   */
  static async fromJSON(
    data: GraphRAGJSON,
    vectorDB: VectorDatabase,
    embeddingService: EmbeddingService
  ): Promise<GraphRAGEngine> {
    const engine = new GraphRAGEngine(vectorDB, embeddingService)
    
    // 导入节点
    for (const node of data.nodes) {
      engine.nodes.set(node.id, node)
      
      // 重建索引
      if (!engine.nodesByType.has(node.type)) {
        engine.nodesByType.set(node.type, new Set())
      }
      engine.nodesByType.get(node.type)!.add(node.id)
    }
    
    // 导入边
    for (const edge of data.edges) {
      await engine.addEdge(edge)
    }
    
    return engine
  }
  
  /**
   * 清空图谱
   */
  clear(): void {
    this.nodes.clear()
    this.edges.clear()
    this.nodesByType.clear()
    this.edgesBySource.clear()
    this.edgesByTarget.clear()
    this.edgesByRelation.clear()
  }
}
