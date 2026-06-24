'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { WatchlistMeta } from '@/lib/watchlist'
import {
  createWatchlistAction,
  renameWatchlistAction,
  deleteWatchlistAction,
} from '@/app/(app)/watchlist/actions'
import { cn } from '@/lib/utils'
import {
  IoChevronDown as ChevronDown,
  IoEllipsisHorizontal as More,
  IoAdd as Plus,
  IoPencil as EditPencil,
  IoTrash as Trash,
  IoDownload as Download,
  IoCheckmark as Check,
} from 'react-icons/io5'

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

  function exportCsv() {
    const a = document.createElement('a')
    a.href = '/api/export/watchlist'
    a.click()
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-6 pb-3 border-b border-border">
        {/* List switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex min-w-0 items-center gap-1.5 -ml-2 rounded-md px-2 py-1 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <span className="truncate text-base font-semibold tracking-tight">
              {active?.name ?? 'Watchlist'}
            </span>
            {active && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {active.item_count}
              </span>
            )}
            <ChevronDown
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground transition-transform data-[popup-open]:rotate-180"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Your lists</DropdownMenuLabel>
              {watchlists.map((w) => (
                <DropdownMenuItem
                  key={w.id}
                  onClick={() => router.push(`/watchlist?id=${w.id}`)}
                  className="gap-2"
                >
                  <span className="flex-1 truncate">{w.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {w.item_count}
                  </span>
                  {w.id === activeId && (
                    <Check aria-hidden className="size-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={startCreate}>
              <Plus aria-hidden />
              <span>New list</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <Button size="sm" variant="outline" onClick={startCreate}>
            <Plus aria-hidden className="size-3.5" />
            <span>New</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="List actions"
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
            >
              <More aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onClick={startRename}>
                <EditPencil aria-hidden />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportCsv}>
                <Download aria-hidden />
                <span>Export CSV</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={watchlists.length <= 1}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash aria-hidden />
                <span>Delete list</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Create list */}
      <Dialog
        open={creating}
        onOpenChange={(o) => {
          setCreating(o)
          if (!o) setError(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New watchlist</DialogTitle>
            <DialogDescription>Give your list a name.</DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submitCreate()
              }
            }}
            placeholder="e.g. Tech, Dividend payers"
            autoFocus
            disabled={pending}
          />
          {error && (
            <p className="text-sm text-rose-400" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCreating(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={submitCreate} disabled={pending}>
              {pending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename list */}
      <Dialog
        open={renaming}
        onOpenChange={(o) => {
          setRenaming(o)
          if (!o) setError(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename watchlist</DialogTitle>
            <DialogDescription>
              Choose a new name for “{active?.name}”.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submitRename()
              }
            }}
            autoFocus
            disabled={pending}
          />
          {error && (
            <p className="text-sm text-rose-400" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRenaming(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={submitRename} disabled={pending}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </>
  )
}
