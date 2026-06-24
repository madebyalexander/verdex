'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { deletePosition } from '@/app/(app)/portfolio/actions'
import { IoTrash as Trash } from 'react-icons/io5'

export function DeletePositionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const res = await deletePosition(id)
          if (res?.error) {
            toast.error("Couldn't delete position", { description: res.error })
          } else {
            toast.success('Position removed')
          }
        })
      }}
      aria-label="Delete position"
    >
      <Trash aria-hidden className="size-3.5" />
    </Button>
  )
}
