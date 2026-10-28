// Opening a place by its screen id. With the rail, a place the rail reaches (the bird's-eye view, the design system,
// the profile, settings) is a view: any open screens close and the frame shows it at its route. Otherwise, and for every
// other place, it opens as a screen over what is open. Doors, steps and tools open places through this, so a place
// shows the same way wherever it is opened from.
import { useNavigate } from 'react-router'
import { RAIL_VIEWS, isRailView } from '@/app/nav'
import { openScreen, useScreens, type OpenScreen, type ScreenId } from '@/stores/screens'
import { usePreferencesStore } from '@/stores/preferences'

export function useOpenPlace() {
  const navigate = useNavigate()
  const rail = usePreferencesStore((s) => s.navStyle) === 'rail'
  return (id: ScreenId, params?: OpenScreen['params'], from?: Element | null) => {
    if (rail && isRailView(id)) {
      useScreens.getState().closeAll()
      navigate(RAIL_VIEWS[id])
      return
    }
    openScreen(id, params, from)
  }
}
