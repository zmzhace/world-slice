import { NextResponse } from 'next/server'
import { summarizeObservation } from '@/server/llm/anthropic'

export async function POST(request: Request) {
  const body = await request.json()
  const prompt = String(body?.prompt ?? '')
  const world = body?.world ?? {}
  const summary = await summarizeObservation({ prompt, world })
  return NextResponse.json({ summary })
}
