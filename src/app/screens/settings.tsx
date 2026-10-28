// Settings as a screen: appearance, navigation, the getting-started steps, and privacy. Picking a theme marks the
// getting-started preferences step done.
import { Monitor, Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/stores/theme'
import { useOnboardingStore } from '@/stores/onboarding'
import { NavStylePicker } from '@/components/shell/nav-styles'
import { usePreferencesStore } from '@/stores/preferences'
import { STEPS } from '@/lib/getting-started'
import { FolderCard } from '@/components/system/folder-card'
import { Sec } from '@/components/system/status'
import { PrivacyControls } from '@/components/gdpr/privacy-controls'
import { cn } from '@/lib/utils/cn'

const THEMES = [
  { id: 'light', word: 'Light', icon: Sun, note: 'The default' },
  { id: 'dark', word: 'Dark', icon: Moon, note: 'For low light' },
  { id: 'system', word: 'System', icon: Monitor, note: 'Follows this device' },
] as const

export function SettingsScreen() {
  const stateSwitches = usePreferencesStore((s) => s.stateSwitches)
  const setStateSwitches = usePreferencesStore((s) => s.setStateSwitches)
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const { completedSteps, completeStep, reset } = useOnboardingStore()
  return (
    <div className="grid gap-3.5" style={{ gridTemplateColumns: 'var(--layout-plates)' }}>
      <FolderCard bodyClassName="content-start gap-3">
        <Sec as="h3">Appearance</Sec>
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={mode === t.id}
              onClick={() => {
                setMode(t.id)
                completeStep('preferences')
              }}
              className={cn(
                'grid justify-items-start gap-1.5 rounded-card border-2 px-3 py-3 text-left transition-colors duration-(--dur-hover)',
                mode === t.id ? 'border-brand bg-brand/8' : 'border-line hover:border-teal',
              )}
            >
              <t.icon className={cn('h-5 w-5', mode === t.id ? 'text-brand' : 'text-dim')} aria-hidden="true" />
              <b className="text-[14px] font-semibold">{t.word}</b>
              <span className="text-[12px] text-dim">{t.note}</span>
            </button>
          ))}
        </div>
      </FolderCard>
      <FolderCard bodyClassName="content-start gap-3">
        <Sec as="h3">Navigation</Sec>
        <NavStylePicker />
      </FolderCard>
      <FolderCard bodyClassName="content-start gap-3">
        <Sec as="h3">Prototype</Sec>
        <p className="text-[13.5px]/[1.5] text-dim">
          State switches sit above each view’s lead chart: Happy, Empty, Loading, Error and Live. Views open on the Happy path, with example data, while the
          switches are on. Turn them off to show live data everywhere.
        </p>
        <label className="flex w-fit cursor-pointer items-center gap-3 text-[14px] font-medium">
          <input type="checkbox" checked={stateSwitches} onChange={(e) => setStateSwitches(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
          Show state switches
        </label>
      </FolderCard>
      <FolderCard bodyClassName="content-start gap-3">
        <Sec as="h3">Getting started</Sec>
        <p className="text-[13.5px]/[1.5] text-dim">
          {completedSteps.length
            ? `Profile and preferences: ${completedSteps.length} of ${STEPS.filter((x) => x.screen).length} done. Start over to see them under Needs you again.`
            : 'The dashboard shows the getting-started steps under Needs you until each is done.'}
        </p>
        <button type="button" className="btn w-fit" disabled={!completedSteps.length} onClick={reset}>
          Start the steps over
        </button>
      </FolderCard>
      <div className="col-span-full">
        <PrivacyControls />
      </div>
    </div>
  )
}
