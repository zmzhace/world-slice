/**
 * GraphRAG - 语义增强的知识图谱
 * 结合了传统知识图谱和向量语义搜索
 */

export type NodeType = 'agent' | 'event' | 'location' | 'organization' | 'concept' | 'plot' | 'memory' | 'narrative'

export type RelationType = 
  | 'knows'           // agent 认识 agent
  | 'likes'           // agent 喜欢 agent
  | 'dislikes'        // agent 不喜欢 agent
  | 'works_for'       // agent 为 organization 工作
  | 'located_in'      // agent/organization 位于 location
  | 'participates_in' // agent 参与 event/plot
  | 'caused_by'       // event 由 agent 引起
  | 'related_to'      // 通用关系
  | 'protagonist_of'  // agent 是 plot 的主角
  | 'antagonist_of'   // agent 是 plot 的对手
  | 'supports'        // agent 支持 plot
  | 'part_of'         // 属于某个叙事
  | 'influences'      // 影响关系
  | 'similar_to'      // 语义相似

export type NodeSnapshot = {
  tick: number
  properties: Record<string, any>
  embedding?: number[]
}

export type GraphRAGNode = {
  id: string
  type: NodeType
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
  confidence_scores: Record<string, number>  // 置信度 [0-1]
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

export type Community = {
  id: string
  members: Set<string>  // node IDs
  density: number  // 社区密度
  central_node: string  // 中心节点
}

export type GraphRAGStats = {
  totalNodes: number
  totalEdges: number
  nodesByType: Record<NodeType, number>
  avgDegree: number
  communities: number
  inferredEdges: number
}

/**
 * GraphRAG 导出格式
 */
export type GraphRAGJSON = {
  nodes: GraphRAGNode[]
  edges: GraphRAGEdge[]
  metadata: {
    created_at: string
    version: string
  }
}
