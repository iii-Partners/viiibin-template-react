// The profile as a screen, opened from the profile tool or from Needs you. Who is signed in (or that the app runs in
// demo mode), then the details form. Saving marks the getting-started step done.
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth0 } from '@auth0/auth0-react'
import { toast } from 'sonner'
import { LogOut } from 'lucide-react'
import { profileSchema, type ProfileInput } from '@/lib/validation/profile'
import { isAuthEnabled } from '@/lib/auth'
import { useOnboardingStore } from '@/stores/onboarding'
import { Panel } from '@/components/system/panel'
import { Sec, StatusWord } from '@/components/system/status'

type User = { name: string; email: string; picture: string | null } | null

export function ProfileScreen() {
  return isAuthEnabled ? <WithAuth /> : <ProfileBody user={null} />
}

function WithAuth() {
  const { user, logout } = useAuth0()
  return (
    <ProfileBody
      user={user ? { name: user.name ?? '', email: user.email ?? '', picture: user.picture ?? null } : null}
      onLogout={() => {
        logout({ logoutParams: { returnTo: window.location.origin }, openUrl: false })
        window.location.href = '/'
      }}
    />
  )
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?'

function ProfileBody({ user, onLogout }: { user: User; onLogout?(): void }) {
  const [saving, setSaving] = useState(false)
  const completeStep = useOnboardingStore((s) => s.completeStep)
  const { register, handleSubmit, watch, formState: { errors, isDirty } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', phone: '' },
  })
  const name = watch('name')

  const onSubmit = async (data: ProfileInput) => {
    setSaving(true)
    try {
      // TODO: Call API to update profile
      console.log('Profile update:', data)
      completeStep('profile')
      toast.success('Profile saved')
    } catch {
      toast.error('The profile did not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  // One panel. Once the screen is wide enough, who you are sits as a narrow left column and the form as the wider right
  // column, split by a hairline; on a phone the form stacks under who you are, inside the same panel. The query reads
  // the screen's own width, so the dialog and the rail view lay out alike.
  return (
    <div className="@container">
      <Panel className="max-w-[1040px] gap-6 @min-[680px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] @min-[680px]:gap-0">
        <section className="grid content-start gap-5 @min-[680px]:pr-8">
          <Sec as="h3">Who you are</Sec>
          <div className="grid justify-items-start gap-4">
            {user?.picture ? (
              <img src={user.picture} alt="" className="h-[72px] w-[72px] rounded-full" />
            ) : (
              <span className="figure grid h-[72px] w-[72px] flex-none place-items-center rounded-full border border-edge text-[30px]">{initials(name || user?.name || '')}</span>
            )}
            <div className="grid w-full min-w-0 gap-2">
              <b className="font-display text-[26px]/[1.15] font-title [overflow-wrap:anywhere]">{name || user?.name || 'No name yet'}</b>
              <StatusWord st={user ? 'ok' : 'risk'} className="whitespace-normal">{user ? 'Signed in' : 'Demo mode'}</StatusWord>
            </div>
          </div>
          <p className="text-[14px]/[1.55] text-dim [overflow-wrap:anywhere]">
            {user
              ? 'Your picture comes from your identity provider. Change it there.'
              : 'Sign-in is not set up. Add Auth0 keys (VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID) to turn it on. Until then, what you save here stays in this browser.'}
          </p>
          {onLogout && (
            <button type="button" className="pill sm w-fit" onClick={onLogout}>
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              Log out
            </button>
          )}
        </section>
        <section className="grid min-w-0 content-start gap-5 border-t border-line pt-6 @min-[680px]:border-t-0 @min-[680px]:border-l @min-[680px]:pt-0 @min-[680px]:pl-8">
          <Sec as="h3">Your details</Sec>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} placeholder="How the app should address you" />
              {errors.name && <p className="mt-1 text-[13px] text-fault">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="you@example.com" />
              {errors.email && <p className="mt-1 text-[13px] text-fault">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" type="tel" {...register('phone')} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <button type="submit" className="pill go w-fit" disabled={!isDirty || saving} aria-describedby={isDirty ? undefined : 'profile-save-hint'}>
                {saving ? 'Saving…' : 'Save details'}
              </button>
              {!isDirty && <span id="profile-save-hint" className="text-[13px] text-dim">Change a detail to save it.</span>}
            </div>
          </form>
        </section>
      </Panel>
    </div>
  )
}
