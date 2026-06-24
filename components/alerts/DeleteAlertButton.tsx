'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { deleteAlert } from '@/app/(app)/alerts/actions'
import { IoTrash as Trash } from 'react-icons/io5'

export function DeleteAlertButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const res = await deleteAlert(id)
          if (res?.error) {
            toast.error("Couldn't delete alert", { description: res.error })
          } else {
            toast.success('Alert deleted')
          }
        })
      }}
      aria-label="Delete alert"
    >
      <Trash aria-hidden className="size-3.5" />
    </Button>
  )
}
