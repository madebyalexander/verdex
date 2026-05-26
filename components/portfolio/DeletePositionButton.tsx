'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { deletePosition } from '@/app/(app)/portfolio/actions'

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
      <Trash2 aria-hidden className="size-3.5" />
    </Button>
  )
}
