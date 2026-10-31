import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RailView } from '@/app/routes/rail-view'
import { usePreferencesStore } from '@/stores/preferences'
import { useScreens } from '@/stores/screens'

vi.mock('@auth0/auth0-react', () => ({ useAuth0: () => ({ isAuthenticated: false, user: null, logout: vi.fn() }) }))

function at(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/app/settings" element={<RailView id="settings" />} />
          <Route path="/app/today" element={<p>Today view</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// With the rail, every place it reaches is a view, never a dialog. With the header pill, the same place is a screen.
describe('Places the rail reaches', () => {
  beforeEach(() => useScreens.getState().closeAll())

  it('show as a view with the rail', () => {
    usePreferencesStore.getState().setNavStyle('rail')
    at('/app/settings')
    expect(screen.getByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(useScreens.getState().stack).toHaveLength(0)
  })

  it('open as a screen over Today with the header pill', async () => {
    usePreferencesStore.getState().setNavStyle('bar')
    at('/app/settings')
    expect(await screen.findByText('Today view')).toBeInTheDocument()
    await waitFor(() => expect(useScreens.getState().stack.map((s) => s.id)).toEqual(['settings']))
  })
})
