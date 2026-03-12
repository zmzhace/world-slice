import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WorldsPage from '../app/worlds/page'

describe('WorldsPage', () => {
  it('renders the worlds heading', () => {
    render(<WorldsPage />)
    expect(screen.getByRole('heading', { name: /worlds/i })).toBeTruthy()
  })
})
