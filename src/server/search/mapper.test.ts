import { describe, it, expect } from 'vitest'
import { mapSearchResultsToSocialContext } from './mapper'

it('maps search results into structured social context', () => {
  const context = mapSearchResultsToSocialContext([
    { title: 'News', summary: 'Stress is rising', url: 'https://example.com' },
  ])

  expect(context.narratives.length).toBeGreaterThan(0)
  expect(context.pressures.length).toBeGreaterThan(0)
})
