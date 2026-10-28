// The profile as a screen, opened from the profile tool or from Needs you. Who is signed in (or that the app runs in
// demo mode), then the details form. Saving marks the getting-started step done.
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth0 } from '@auth0/auth0-react'
import { toast } from 'sonner'
import { LogOut } from 'lucide-react'
import { profileSchema, type ProfileInput } from '@/lib/validation/profile'
import { isAuthEnabled } from '@/lib/auth'
import { useOnboardingStore } from '@/stores/onboarding'
import { FolderCard } from '@/components/system/folder-card'
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

  return (
    <div className="grid gap-3.5" style={{ gridTemplateColumns: 'var(--layout-plates)' }}>
      <FolderCard bodyClassName="content-start gap-4">
        <Sec as="h3">Who you are</Sec>
        <div className="flex items-center gap-4">
          {user?.picture ? (
            <img src={user.picture} alt="" className="h-16 w-16 rounded-full" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-glass-raised font-figure text-[26px] font-medium text-brand">{initials(name || user?.name || '')}</span>
          )}
          <div className="grid min-w-0 gap-1">
            <b className="truncate text-[17px] font-semibold">{name || user?.name || 'No name yet'}</b>
            {user ? <StatusWord st="ok">Signed in</StatusWord> : <StatusWord st="risk">Demo mode: sign-in is not set up</StatusWord>}
          </div>
        </div>
        <p className="text-[13.5px]/[1.5] text-dim">
          {user
            ? 'Your picture comes from your identity provider. Change it there.'
            : 'Add Auth0 keys (VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID) to turn on sign-in. Until then, what you save here stays in this browser.'}
        </p>
        {onLogout && (
          <button type="button" className="btn inline-flex w-fit items-center gap-2" onClick={onLogout}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        )}
      </FolderCard>
      <FolderCard bodyClassName="gap-3">
        <Sec as="h3">Your details</Sec>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div>
            <label htmlFor="name" className="label">Name</label>
            <input id="name" {...register('name')} className="field" placeholder="How the app should address you" />
            {errors.name && <p className="mt-1 text-[13px] text-fault">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" type="email" {...register('email')} className="field" placeholder="you@example.com" />
            {errors.email && <p className="mt-1 text-[13px] text-fault">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="label">Phone (optional)</label>
            <input id="phone" type="tel" {...register('phone')} className="field" />
          </div>
          <button type="submit" className="gm-btn go w-fit" disabled={!isDirty || saving}>
            {saving ? 'Saving…' : 'Save details'}
          </button>
        </form>
      </FolderCard>
    </div>
  )
}
