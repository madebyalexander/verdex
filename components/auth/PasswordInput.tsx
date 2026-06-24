'use client'

import { useState, type ComponentProps } from 'react'
import { IoEyeOutline as Eye, IoEyeOffOutline as EyeOff } from 'react-icons/io5'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** Password input with a show/hide toggle. */
export function PasswordInput({
  className,
  ...props
}: ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        className={cn('pr-10', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
