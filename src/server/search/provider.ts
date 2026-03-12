import type { SearchSignal } from '@/domain/search'

export type SearchProvider = {
  search: (query: string) => Promise<SearchSignal[]>
}
