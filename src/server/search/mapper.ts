import type { SearchSignal } from '@/domain/search'
import type { SocialContext } from '@/domain/world'

export function mapSearchResultsToSocialContext(results: SearchSignal[]): SocialContext {
  const narratives = results.map((result) => result.summary)
  const pressures = results.map((result) => `pressure:${result.title}`)
  const macro_events = results.map((result) => `event:${result.title}`)

  return {
    macro_events,
    narratives,
    pressures,
    institutions: [],
    ambient_noise: [],
  }
}
