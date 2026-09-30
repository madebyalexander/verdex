'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type SearchResult = {
  symbol: string
  displaySymbol: string
  description: string
  type: string
}

type Coords = { top: number; left: number; width: number }

export function SymbolCombobox({
  value,
  onChange,
  onSelect,
  placeholder = 'Search ticker or company…',
  disabled = false,
  excludeSymbols = [],
  id,
  autoFocus = false,
  className,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  /** Called when the user picks a result from the dropdown. */
  onSelect: (symbol: string, description?: string) => void
  placeholder?: string
  disabled?: boolean
  /** Symbols to hide from suggestions (already-added). */
  excludeSymbols?: string[]
  id?: string
  autoFocus?: boolean
  className?: string
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [coords, setCoords] = useState<Coords | null>(null)

  const inputWrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const reqId = useRef(0)

  // Debounced fetch — kept inside setTimeout to satisfy
  // react-hooks/set-state-in-effect (no sync setState in effect body).
  useEffect(() => {
    const trimmed = value.trim()
    const myReq = ++reqId.current

    const timer = setTimeout(async () => {
      if (!trimmed) {
        if (myReq === reqId.current) {
          setResults([])
          setLoading(false)
        }
        return
      }
      setLoading(true)
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`
        )
        if (myReq !== reqId.current) return
        if (res.ok) {
          const data = await res.json()
          const all: SearchResult[] = data.result ?? []
          const primary = all.filter(
            (r) => r.type === 'Common Stock' && !r.symbol.includes('.')
          )
          const list = primary.length > 0 ? primary : all
          setResults(list.slice(0, 8))
          setActiveIndex(0)
        }
      } catch (err) {
        console.error('[SymbolCombobox]', err)
      } finally {
        if (myReq === reqId.current) setLoading(false)
      }
    }, 220)
    return () => clearTimeout(timer)
  }, [value])

  // Track input rect so the portal-rendered dropdown can sit beneath it.
  useEffect(() => {
    if (!open) return
    function updateCoords() {
      const wrap = inputWrapRef.current
      if (!wrap) return
      const r = wrap.getBoundingClientRect()
      setCoords({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    updateCoords()
    window.addEventListener('scroll', updateCoords, true)
    window.addEventListener('resize', updateCoords)
    return () => {
      window.removeEventListener('scroll', updateCoords, true)
      window.removeEventListener('resize', updateCoords)
    }
  }, [open])

  // Close on outside click — must consider both the input and the portal.
  useEffect(() => {
    if (!open) return
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (inputWrapRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  const excluded = new Set(excludeSymbols.map((s) => s.toUpperCase()))
  const shown = results.filter((r) => !excluded.has(r.symbol.toUpperCase()))

  function pickResult(r: SearchResult) {
    onSelect(r.symbol, r.description)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, Math.max(shown.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      // Only intercept Enter when a dropdown match is highlighted; otherwise
      // let the surrounding form / parent handler decide what Enter means.
      if (open && shown[activeIndex]) {
        e.preventDefault()
        pickResult(shown[activeIndex])
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault()
        setOpen(false)
      }
    }
  }

  const listboxId = id ? `${id}-listbox` : undefined
  const trimmed = value.trim()
  const showDropdown = open && trimmed.length > 0
  const activeId =
    listboxId && shown[activeIndex]
      ? `${listboxId}-opt-${activeIndex}`
      : undefined

  return (
    <div ref={inputWrapRef} className={cn('relative', className)}>
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          if (!open) setOpen(true)
        }}
        onFocus={() => {
          if (value.trim()) setOpen(true)
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck={false}
      />
      {showDropdown &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 50,
            }}
            className="overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-xl ring-1 ring-white/10"
          >
            {shown.length === 0 && loading && (
              <p className="text-sm py-3 px-3 text-muted-foreground">
                Searching…
              </p>
            )}
            {shown.length === 0 && !loading && (
              <p className="text-sm py-3 px-3 text-muted-foreground">
                No matches for &ldquo;{value}&rdquo;.
              </p>
            )}
            {shown.length > 0 && (
              <ul
                id={listboxId}
                role="listbox"
                className="max-h-64 overflow-y-auto p-1"
              >
                {shown.map((r, i) => (
                  <li
                    key={r.symbol}
                    id={listboxId ? `${listboxId}-opt-${i}` : undefined}
                    role="option"
                    aria-selected={i === activeIndex}
                  >
                    <button
                      type="button"
                      onClick={() => pickResult(r)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                        i === activeIndex && 'bg-white/[0.06]'
                      )}
                    >
                      <span
                        className={cn(
                          'font-semibold tabular-nums shrink-0 min-w-[3.5rem]',
                          i === activeIndex && 'text-primary'
                        )}
                      >
                        {r.displaySymbol}
                      </span>
                      <span className="flex-1 truncate text-muted-foreground">
                        {r.description}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
