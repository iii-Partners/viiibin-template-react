// Settings as a screen: appearance (light or dark, and the design variant), the prototype's clock and its example
// data, and privacy. Picking a theme marks the getting-started preferences step done.
import { Switch } from '@/components/ui/switch'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/stores/theme'
import { usePreferencesStore } from '@/stores/preferences'
import { useOnboardingStore } from '@/stores/onboarding'
import { Panel } from '@/components/system/panel'
import { Sec } from '@/components/system/status'
import { confirm } from '@/components/system/confirm'
import { PrivacyControls } from '@/components/gdpr/privacy-controls'
import { VariantPicker } from '@/components/shell/variant-picker'
import { useOs } from '@/os/store'
import { SEED_TODAY } from '@/os/seed'
import { fmt } from '@/os/model'
import { Clock } from '@/os/ui'
import { cn } from '@/lib/utils/cn'

const THEMES = [
  { id: 'light', word: 'Light', icon: Sun, note: 'The default' },
  { id: 'dark', word: 'Dark', icon: Moon, note: 'For low light' },
  { id: 'system', word: 'System', icon: Monitor, note: 'Follows this device' },
] as const

export function SettingsScreen() {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const completeStep = useOnboardingStore((s) => s.completeStep)
  const ambient = usePreferencesStore((s) => s.ambient)
  const setAmbient = usePreferencesStore((s) => s.setAmbient)
  const { events, reset } = useOs()
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'var(--layout-plates)' }}>
      <Panel className="content-start gap-4">
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
                'grid justify-items-start gap-2 border p-3.5 text-left transition-colors duration-(--dur-hover)',
                mode === t.id ? 'border-text bg-wash' : 'border-line hover:border-edge',
              )}
            >
              <t.icon className={cn('h-[18px] w-[18px]', mode === t.id ? 'text-text' : 'text-dim')} strokeWidth={1.5} aria-hidden="true" />
              <span className="mt-1 font-display text-[19px]/none font-light">{t.word}</span>
              <span className="text-[12.5px] text-dim">{t.note}</span>
            </button>
          ))}
        </div>
        <div className="flex items-start justify-between gap-4 border-t border-line pt-4">
          <label htmlFor="ambient" className="grid cursor-pointer gap-0.5 text-[14px]/[1.5]">
            <span>Ambient light</span>
            <span className="text-[12.5px] text-dim">The edge glow and the light that follows the cursor, in the Northlight variant. Off under reduced motion.</span>
          </label>
          <Switch id="ambient" checked={ambient} onCheckedChange={setAmbient} className="mt-0.5" />
        </div>
      </Panel>
      <Panel className="content-start gap-4">
        <Sec as="h3">The prototype</Sec>
        <p className="text-[14px]/[1.55] text-dim">Northlight OS runs on invented guests and keeps its own clock. Each day you advance runs the automations: reminders, hold expiry, form chasers, check-ins and the Living Well Series.</p>
        <Clock />
        <p className="text-[13px] text-dim">{events.length} events logged since {fmt(SEED_TODAY)}.</p>
        <button
          type="button"
          className="pill sm risky w-fit"
          onClick={async () => { if (await confirm({ title: 'Reset the example data?', body: `Every guest, retreat and event goes back to how it was on ${fmt(SEED_TODAY)}. Your theme and variant stay.`, action: 'Reset', risky: true })) reset() }}
        >
          Reset the example data
        </button>
      </Panel>
      <Panel className="col-span-full content-start gap-4">
        <Sec as="h3">Design variant</Sec>
        <p className="max-w-[72ch] text-[14px]/[1.55] text-dim">Eleven looks for the same system: the Modern default, after the reference deck, and ten inspired by wellness brands’ public sites. The Design system screen explains each one.</p>
        <VariantPicker />
      </Panel>
      <div className="col-span-full">
        <PrivacyControls />
      </div>
    </div>
  )
}
