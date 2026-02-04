import { RiErrorWarningLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'

export function NotFoundComponent() {
  const navigate = useNavigate()

  return (
    <div className="flex bg-white min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
          <RiErrorWarningLine className="h-10 w-10 text-amber-500" />
        </div>
        <div className="flex gap-2 flex-col items-center">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Page Not Found
          </h1>
          <p className="text-muted-foreground max-w-md">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate({ to: '/' })}>
          Go Home
        </Button>
        <Button variant="ghost" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    </div>
  )
}
