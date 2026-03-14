/**
 * Embedding 服务 - 使用 OpenAI text-embedding-3-large
 * 用于生成文本的语义向量表示
 */

import OpenAI from 'openai'

export class EmbeddingService {
  private client: OpenAI
  private model = 'text-embedding-3-large'
  private dimension = 3072
  
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  
  /**
   * 生成单个文本的 embedding
   */
  async embed(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty')
    }
    
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: 'float'
      })
      
      return response.data[0].embedding
    } catch (error) {
      console.error('[EmbeddingService] Error generating embedding:', error)
      throw error
    }
  }
  
  /**
   * 批量生成 embeddings
   * OpenAI 支持批量，但有限制（最多 2048 个输入）
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return []
    }
    
    // 过滤空文本
    const validTexts = texts.filter(t => t && t.trim().length > 0)
    if (validTexts.length === 0) {
      return []
    }
    
    const batchSize = 2048
    const results: number[][] = []
    
    for (let i = 0; i < validTexts.length; i += batchSize) {
      const batch = validTexts.slice(i, i + batchSize)
      
      try {
        const response = await this.client.embeddings.create({
          model: this.model,
          input: batch,
          encoding_format: 'float'
        })
        
        results.push(...response.data.map(d => d.embedding))
      } catch (error) {
        console.error(`[EmbeddingService] Error in batch ${i / batchSize}:`, error)
        throw error
      }
    }
    
    return results
  }
  
  /**
   * 计算两个向量的余弦相似度
   * 返回值范围：[-1, 1]，1 表示完全相同，-1 表示完全相反
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Vector dimensions must match: ${a.length} vs ${b.length}`)
    }
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB)
    
    if (denominator === 0) {
      return 0
    }
    
    return dotProduct / denominator
  }
  
  /**
   * 平均多个向量
   * 用于合并多个 embeddings 成一个代表性向量
   */
  averageEmbeddings(embeddings: number[][]): number[] {
    if (embeddings.length === 0) {
      throw new Error('Cannot average empty array')
    }
    
    const dim = embeddings[0].length
    const result = new Array(dim).fill(0)
    
    for (const embedding of embeddings) {
      if (embedding.length !== dim) {
        throw new Error('All embeddings must have the same dimension')
      }
      
      for (let i = 0; i < dim; i++) {
        result[i] += embedding[i]
      }
    }
    
    for (let i = 0; i < dim; i++) {
      result[i] /= embeddings.length
    }
    
    return result
  }
  
  /**
   * 加权平均多个向量
   */
  weightedAverageEmbeddings(
    embeddings: number[][],
    weights: number[]
  ): number[] {
    if (embeddings.length === 0) {
      throw new Error('Cannot average empty array')
    }
    
    if (embeddings.length !== weights.length) {
      throw new Error('Embeddings and weights must have the same length')
    }
    
    // 归一化权重
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    const normalizedWeights = weights.map(w => w / totalWeight)
    
    const dim = embeddings[0].length
    const result = new Array(dim).fill(0)
    
    for (let i = 0; i < embeddings.length; i++) {
      const embedding = embeddings[i]
      const weight = normalizedWeights[i]
      
      if (embedding.length !== dim) {
        throw new Error('All embeddings must have the same dimension')
      }
      
      for (let j = 0; j < dim; j++) {
        result[j] += embedding[j] * weight
      }
    }
    
    return result
  }
  
  /**
   * 归一化向量（使其长度为 1）
   */
  normalize(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
    
    if (norm === 0) {
      return vector
    }
    
    return vector.map(v => v / norm)
  }
  
  /**
   * 计算向量的欧氏距离
   */
  euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }
    
    let sum = 0
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i]
      sum += diff * diff
    }
    
    return Math.sqrt(sum)
  }
  
  /**
   * 获取 embedding 的维度
   */
  getDimension(): number {
    return this.dimension
  }
  
  /**
   * 获取使用的模型名称
   */
  getModel(): string {
    return this.model
  }
}

/**
 * 创建 Embedding 服务实例（单例）
 */
let embeddingServiceInstance: EmbeddingService | null = null

export function getEmbeddingService(): EmbeddingService {
  if (!embeddingServiceInstance) {
    embeddingServiceInstance = new EmbeddingService()
  }
  return embeddingServiceInstance
}
