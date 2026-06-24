'use client'

import { useTransition } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { resetDisclaimer } from '@/app/(app)/settings/actions'
import { signOut } from '@/app/auth/actions'
import { IoLogOut as LogOut, IoReload as Restart } from 'react-icons/io5'

export function PrivacySection({
  disclaimerAckedAt,
}: {
  disclaimerAckedAt: string | null
}) {
  const [pending, startTransition] = useTransition()

  function onResetDisclaimer() {
    startTransition(async () => {
      const res = await resetDisclaimer()
      if (!res.ok) {
        toast.error("Couldn't reset", { description: res.error })
        return
      }
      toast.success('Disclaimer reset. You\'ll see it on your next dashboard visit.')
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy & account</CardTitle>
        <CardDescription>
          Manage disclaimer acknowledgment and your session.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Row
          title="Investment disclaimer"
          description={
            disclaimerAckedAt
              ? `Acknowledged on ${new Date(disclaimerAckedAt).toLocaleDateString()}.`
              : 'Not yet acknowledged.'
          }
          status={disclaimerAckedAt ? 'acknowledged' : 'pending'}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={onResetDisclaimer}
              disabled={!disclaimerAckedAt || pending}
            >
              <Restart aria-hidden className="size-3.5" />
              <span>Show again</span>
            </Button>
          }
        />
        <Row
          title="Sign out"
          description="End your current session on this device."
          action={
            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <LogOut aria-hidden className="size-3.5" />
                <span>Sign out</span>
              </Button>
            </form>
          }
        />
      </CardContent>
    </Card>
  )
}

function Row({
  title,
  description,
  status,
  action,
}: {
  title: string
  description: string
  status?: 'acknowledged' | 'pending'
  action: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{title}</p>
          {status === 'acknowledged' && (
            <Badge
              variant="outline"
              className="border-transparent bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
            >
              Acknowledged
            </Badge>
          )}
          {status === 'pending' && (
            <Badge
              variant="outline"
              className="border-transparent bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20"
            >
              Pending
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}
