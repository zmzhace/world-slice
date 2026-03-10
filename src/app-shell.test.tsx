import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from '../app/page'

describe('HomePage shell', () => {
  it('renders the world slice title', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { name: /world slice/i })).toBeInTheDocument()
  })
})
