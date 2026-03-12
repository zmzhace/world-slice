import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { it, vi, expect } from 'vitest'
import { AgentPanel } from './agent-panel'
import { createInitialWorldSlice } from '@/domain/world'

it('loads observation summary', async () => {
  const fetchMock = vi
    .fn()
    .mockImplementationOnce(async () => ({
      ok: true,
      json: async () => ({ agents: [{ genetics: { seed: 'agent-1' } }] }),
    }))
    .mockImplementationOnce(async () => ({
      ok: true,
      json: async () => ({ summary: 'summary text' }),
    }))

  global.fetch = fetchMock as any

  render(<AgentPanel world={createInitialWorldSlice()} />)

  fireEvent.change(screen.getByPlaceholderText('描述你想要的个人 agent...'), {
    target: { value: 'agent-1' },
  })
  fireEvent.click(screen.getByText('生成'))

  await screen.findByRole('option', { name: 'agent-1' })

  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'agent-1' } })
  fireEvent.click(screen.getByText('刷新摘要'))

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  expect(await screen.findByText(/summary text/i)).toBeTruthy()
})
