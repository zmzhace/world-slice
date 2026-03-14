'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { createWorld } from '@/store/worlds'

export default function NewWorldPage() {
  const router = useRouter()
  const [prompt, setPrompt] = React.useState('')
  const [creating, setCreating] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    console.log('Creating world with prompt:', prompt)
    setCreating(true)
    try {
      // Create world record first to get ID
      const worldRecord = createWorld({ worldPrompt: prompt })
      console.log('World record created:', worldRecord)

      // Call complete initialization: Pangu + Nuwa
      const response = await fetch('/api/worlds/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          worldPrompt: prompt,
          worldId: worldRecord.id 
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to initialize world')
      }

      const data = await response.json()
      console.log('World initialized:', data.summary)
      
      // Save generated world to localStorage
      localStorage.setItem(`world_${worldRecord.id}`, JSON.stringify(data.world))
      
      router.push(`/worlds/${worldRecord.id}`)
    } catch (error) {
      console.error('Failed to create world:', error)
      alert('创建世界失败: ' + (error as Error).message)
      setCreating(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <button
            onClick={() => router.push('/worlds')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <span>←</span>
            <span>返回世界列表</span>
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl shadow-lg mb-4">
              ✨
            </div>
            <h1 className="text-3xl font-bold text-slate-900">创建新世界</h1>
            <p className="mt-3 text-slate-600 max-w-xl mx-auto">
              描述你想要创建的世界，AI 将生成初始环境、社会背景和 5-10 个个性化 agents
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="prompt" className="block text-sm font-semibold text-slate-900 mb-2">
                世界描述
              </label>
              <textarea
                id="prompt"
                rows={6}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                placeholder="例如：一个平静的海边小镇，居民们过着简单的生活...&#10;&#10;或者：南疆蛊师世界，充满神秘的蛊虫和修炼者..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={creating}
              />
              <p className="mt-2 text-xs text-slate-500">
                💡 提示：描述越详细，生成的世界越丰富。可以包括环境、文化、社会结构等。
              </p>
            </div>

            {creating && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="animate-spin text-2xl">⚙️</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">正在创建世界...</h3>
                    <div className="space-y-1 text-sm text-blue-700">
                      <p>🌍 盘古创世 - 生成初始世界状态</p>
                      <p>👥 女娲造人 - 创建个性化 agents</p>
                      <p>✨ 准备涌现式叙事系统</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={creating || !prompt.trim()}
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚙️</span>
                    <span>创建中...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>✨</span>
                    <span>开始创建</span>
                  </span>
                )}
              </button>
              <button
                type="button"
                className="rounded-xl border-2 border-slate-200 px-6 py-4 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                onClick={() => router.push('/worlds')}
                disabled={creating}
              >
                取消
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">💡 创建提示</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <h4 className="text-xs font-semibold text-slate-700 mb-1">🏔️ 环境设定</h4>
                <p className="text-xs text-slate-600">描述地理、气候、地形等自然环境</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <h4 className="text-xs font-semibold text-slate-700 mb-1">🏛️ 社会结构</h4>
                <p className="text-xs text-slate-600">描述文化、制度、权力关系等</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <h4 className="text-xs font-semibold text-slate-700 mb-1">⚡ 核心冲突</h4>
                <p className="text-xs text-slate-600">描述主要矛盾、压力来源等</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <h4 className="text-xs font-semibold text-slate-700 mb-1">🎭 叙事基调</h4>
                <p className="text-xs text-slate-600">描述整体氛围、风格、主题等</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
