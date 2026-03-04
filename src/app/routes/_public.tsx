import { Outlet } from 'react-router'
import { PublicHeader } from '@/components/layout/public-header'
import { Footer } from '@/components/layout/footer'

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
