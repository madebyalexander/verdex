'use client'

import { useState, useTransition } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ackDisclaimer } from '@/app/auth/actions'

export function DisclaimerModal({ openByDefault }: { openByDefault: boolean }) {
  const [open, setOpen] = useState(openByDefault)
  const [pending, startTransition] = useTransition()

  function handleAccept() {
    startTransition(async () => {
      const res = await ackDisclaimer()
      if (res.error) {
        console.error('ackDisclaimer failed:', res.error)
        return
      }
      setOpen(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Before you continue</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            StockSense AI provides informational analysis powered by artificial
            intelligence. This is <strong>NOT financial advice</strong>.
            Predictions are probabilistic and may be wrong. Past performance
            does not indicate future results. Always do your own research and
            consult a licensed financial advisor before investing.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleAccept} disabled={pending}>
            {pending ? 'Saving…' : 'I understand'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
