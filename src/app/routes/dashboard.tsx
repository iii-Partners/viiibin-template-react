import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardChecklist } from '@/components/onboarding/dashboard-checklist'
import { useOnboardingStore } from '@/stores/onboarding'

export default function DashboardPage() {
  const onboardingComplete = useOnboardingStore((s) => s.completed)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your dashboard.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {!onboardingComplete && <DashboardChecklist />}

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Complete your setup to get the most out of the app.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your app is up and running. This is your dashboard — start
              building by editing <code>src/app/routes/dashboard.tsx</code>,
              adding pages under <code>src/app/routes</code>, and wiring up your
              data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
