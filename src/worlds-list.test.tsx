import React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import WorldsPage from '../app/worlds/page'
import { createWorld } from './store/worlds'

beforeEach(() => {
  localStorage.clear()
})

describe('WorldsPage', () => {
  it('shows the empty state and create link when no worlds exist', () => {
    render(<WorldsPage />)

    const link = screen.getByRole('link', { name: /create world/i })

    expect(screen.getByRole('heading', { name: /worlds/i })).toBeTruthy()
    expect(screen.getByText(/no worlds yet/i)).toBeTruthy()
    expect(link.getAttribute('href')).toBe('/worlds/new')
  })

  it('lists existing worlds with prompt and created time', () => {
    const world = createWorld({ worldPrompt: 'Oceanic shelter' })

    render(<WorldsPage />)

    expect(screen.getByText('Oceanic shelter')).toBeTruthy()
    expect(screen.getByText(new RegExp(world.createdAt))).toBeTruthy()
  })
})
