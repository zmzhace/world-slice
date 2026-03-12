import React from 'react'
import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createInitialWorldSlice } from '@/domain/world'
import { PanelShell } from './panel-shell'

it('renders agent observation desk', () => {
  render(<PanelShell world={createInitialWorldSlice()} />)
  expect(screen.getByText(/agent observation/i)).toBeTruthy()
})
