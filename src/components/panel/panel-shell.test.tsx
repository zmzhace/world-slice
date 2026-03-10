import React from 'react'
import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createInitialWorldSlice } from '@/domain/world'
import { PanelShell } from './panel-shell'

it('renders world and agent panels from world state', () => {
  render(<PanelShell world={createInitialWorldSlice()} />)
  expect(screen.getByText(/world overview/i)).toBeInTheDocument()
  expect(screen.getByText(/agents/i)).toBeInTheDocument()
})
