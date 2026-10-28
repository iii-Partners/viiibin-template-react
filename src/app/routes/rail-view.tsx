import { useEffect } from 'react'
import { Navigate } from 'react-router'
import { usePreferencesStore } from '@/stores/preferences'
import { openScreen, useScreens } from '@/stores/screens'
import { ScreenView } from '@/app/screens'
import type { RailView as RailViewId } from '@/app/nav'

/** A place the rail reaches, at its route. With the rail it is a view in the frame. With the wedge bar it is a screen,
 *  so its route opens it over the dashboard (an old link, or the viewer switching nav style while it is open). */
export function RailView({ id }: { id: RailViewId }) {
  const rail = usePreferencesStore((s) => s.navStyle) === 'rail'
  useEffect(() => {
    if (!rail && !useScreens.getState().stack.some((s) => s.id === id)) openScreen(id)
  }, [id, rail])
  if (!rail) return <Navigate to="/app/dashboard" replace />
  return <ScreenView id={id} />
}
