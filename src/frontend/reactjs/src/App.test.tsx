import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('Donezo', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('donezo_session', 'demo@donezo.app')
  })
  afterEach(cleanup)

  it('creates a task from the composer', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /add task/i }))
    await user.type(screen.getByLabelText(/task name/i), 'Write release notes')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /add task/i }))
    expect(screen.getByText('Write release notes')).toBeInTheDocument()
  })

  it('filters completed tasks', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('tab', { name: /completed/i }))
    expect(screen.getByText('Send invoice to Northstar')).toBeInTheDocument()
    expect(screen.queryByText('Book dentist appointment')).not.toBeInTheDocument()
  })

  it('signs in from the authentication screen', async () => {
    localStorage.clear()
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: /sign in to donezo/i })).toBeInTheDocument()
    await user.type(screen.getByLabelText(/email address/i), 'demo@donezo.app')
    await user.type(screen.getByLabelText(/^password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(screen.getByRole('heading', { name: /good morning/i })).toBeInTheDocument()
  })

  it('keeps profile and logout as separate account actions', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /open account menu/i }))
    expect(screen.getByRole('menuitem', { name: /view profile/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /log out/i })).toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: /view profile/i }))
    expect(screen.getByRole('heading', { name: 'demo' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /close profile/i }))
    await user.click(screen.getByRole('button', { name: /open account menu/i }))
    await user.click(screen.getByRole('menuitem', { name: /log out/i }))
    expect(screen.getByRole('dialog', { name: /log out of donezo/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /good morning/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^log out$/i }))
    expect(screen.getByRole('heading', { name: /sign in to donezo/i })).toBeInTheDocument()
  })
})
