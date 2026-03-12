import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { WorldSlice } from '@/domain/world'

const DATA_PATH = path.resolve(process.cwd(), 'data', 'world-slice.json')

export async function saveWorldSlice(world: WorldSlice): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true })
  await fs.writeFile(DATA_PATH, JSON.stringify(world, null, 2), 'utf-8')
}

export async function loadWorldSlice(): Promise<WorldSlice | null> {
  try {
    const contents = await fs.readFile(DATA_PATH, 'utf-8')
    return JSON.parse(contents) as WorldSlice
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}
