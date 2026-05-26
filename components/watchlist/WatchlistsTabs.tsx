'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { WatchlistMeta } from '@/lib/watchlist'
import {
  createWatchlistAction,
  renameWatchlistAction,
  deleteWatchlistAction,
} from '@/app/(app)/watchlist/actions'
import { cn } from '@/lib/utils'

export function WatchlistsTabs({
  watchlists,
  activeId,
}: {
  watchlists: WatchlistMeta[]
  activeId: string
}) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const active = watchlists.find((w) => w.id === activeId)

  function startCreate() {
    setError(null)
    setNewName('')
    setCreating(true)
  }

  function submitCreate() {
    setError(null)
    if (!newName.trim()) {
      setError('Name required')
      return
    }
    startTransition(async () => {
      const res = await createWatchlistAction(newName)
      if (res.error) {
        setError(res.error)
        return
      }
      toast.success(`Created list "${newName.trim()}"`)
      setCreating(false)
      setNewName('')
      if (res.id) router.push(`/watchlist?id=${res.id}`)
    })
  }

  function startRename() {
    setError(null)
    setRenameValue(active?.name ?? '')
    setRenaming(true)
  }

  function submitRename() {
    if (!active) return
    setError(null)
    if (!renameValue.trim()) {
      setError('Name required')
      return
    }
    if (renameValue.trim() === active.name) {
      setRenaming(false)
      return
    }
    startTransition(async () => {
      const res = await renameWatchlistAction(active.id, renameValue)
      if (res.error) {
        setError(res.error)
        return
      }
      toast.success(`Renamed to "${renameValue.trim()}"`)
      setRenaming(false)
    })
  }

  function handleDelete() {
    if (!active) return
    startTransition(async () => {
      const res = await deleteWatchlistAction(active.id)
      if (res.error) {
        setError(res.error)
        return
      }
      toast.success(`Deleted list "${active.name}"`)
      setConfirmDeleteOpen(false)
      const remaining = watchlists.find((w) => w.id !== active.id)
      router.push(remaining ? `/watchlist?id=${remaining.id}` : '/watchlist')
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {watchlists.map((w) => {
          const isActive = w.id === activeId
          return (
            <Link key={w.id} href={`/watchlist?id=${w.id}`}>
              <span
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'bg-secondary text-muted-foreground border border-border hover:bg-secondary/70'
                )}
              >
                {w.name}
                <span className="text-xs tabular-nums opacity-70">
                  {w.item_count}
                </span>
              </span>
            </Link>
          )
        })}

        {creating ? (
          <span className="inline-flex items-center gap-1">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submitCreate()
                } else if (e.key === 'Escape') {
                  setCreating(false)
                }
              }}
              placeholder="List name"
              autoFocus
              disabled={pending}
              className="h-8 w-36"
            />
            <Button
              size="sm"
              onClick={submitCreate}
              disabled={pending}
            >
              Add
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setCreating(false)}
              disabled={pending}
              aria-label="Cancel new list"
            >
              <X aria-hidden className="size-3.5" />
            </Button>
          </span>
        ) : (
          <Button size="sm" variant="outline" onClick={startCreate}>
            <Plus aria-hidden className="size-3.5" />
            <span>New list</span>
          </Button>
        )}
      </div>

      {active && (
        <div className="flex items-center justify-between gap-2 flex-wrap border-t border-border pt-3">
          {renaming ? (
            <div className="flex items-center gap-2">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    submitRename()
                  } else if (e.key === 'Escape') {
                    setRenaming(false)
                  }
                }}
                autoFocus
                disabled={pending}
                className="h-8 w-48"
              />
              <Button size="sm" onClick={submitRename} disabled={pending}>
                Save
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setRenaming(false)}
                disabled={pending}
                aria-label="Cancel rename"
              >
                <X aria-hidden className="size-3.5" />
              </Button>
            </div>
          ) : (
            <h2 className="text-lg font-semibold tracking-tight">
              {active.name}
            </h2>
          )}

          <div className="flex items-center gap-1">
            {!renaming && (
              <Button size="sm" variant="ghost" onClick={startRename}>
                <Pencil aria-hidden className="size-3.5" />
                <span>Rename</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={pending || watchlists.length <= 1}
              aria-label={`Delete watchlist ${active.name}`}
            >
              <Trash2 aria-hidden className="size-3.5" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-rose-400" role="alert">
          {error}
        </p>
      )}

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this watchlist?</AlertDialogTitle>
            <AlertDialogDescription>
              {active &&
                `"${active.name}" and its ${active.item_count} item${active.item_count === 1 ? '' : 's'} will be removed. This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={pending}
              variant="destructive"
            >
              {pending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
