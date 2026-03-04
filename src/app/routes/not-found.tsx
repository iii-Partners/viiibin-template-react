import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-xl text-muted-foreground">Page not found</p>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  )
}
