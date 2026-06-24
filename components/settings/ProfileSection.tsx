'use client'

import { useState, useTransition } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { updateDisplayName } from '@/app/(app)/settings/actions'

export function ProfileSection({
  email,
  displayName,
}: {
  email: string
  displayName: string
}) {
  const [name, setName] = useState(displayName)
  const [pending, startTransition] = useTransition()
  const dirty = name.trim() !== displayName.trim() && name.trim().length > 0

  function save() {
    startTransition(async () => {
      const res = await updateDisplayName(name.trim())
      if (!res.ok) {
        toast.error("Couldn't save", { description: res.error })
        return
      }
      toast.success('Profile updated')
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          How you appear on the dashboard. Email is tied to your auth account.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="display-name" className="text-sm font-medium">
            Display name
          </label>
          <Input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            disabled={pending}
            maxLength={80}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email-readonly" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email-readonly"
            value={email}
            readOnly
            disabled
            aria-readonly="true"
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={!dirty || pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
