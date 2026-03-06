import { Outlet } from 'react-router'
import { SkipToContent } from '@/components/common/skip-to-content'
import { PublicHeader } from '@/components/layout/public-header'
import { Footer } from '@/components/layout/footer'

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipToContent />
      <PublicHeader />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
