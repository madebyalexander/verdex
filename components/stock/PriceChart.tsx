'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  type IChartApi,
} from 'lightweight-charts'
import type { OhlcvBar } from '@/lib/apis/alpha-vantage'
import { cn } from '@/lib/utils'

const UP_COLOR = '#34D399' // emerald-400
const DOWN_COLOR = '#FB7185' // rose-400
const UP_FILL = 'rgba(52, 211, 153, 0.35)'
const DOWN_FILL = 'rgba(251, 113, 133, 0.35)'

const RANGES = [
  { label: '1M', days: 22 },
  { label: '3M', days: 66 },
  { label: '6M', days: 132 },
  { label: '1Y', days: 252 },
  { label: 'MAX', days: Number.POSITIVE_INFINITY },
] as const

type RangeLabel = (typeof RANGES)[number]['label']

export function PriceChart({ bars }: { bars: OhlcvBar[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [range, setRange] = useState<RangeLabel>('3M')

  const visibleBars = useMemo(() => {
    const cfg = RANGES.find((r) => r.label === range)
    if (!cfg || cfg.days === Number.POSITIVE_INFINITY) return bars
    return bars.slice(-cfg.days)
  }, [bars, range])

  useEffect(() => {
    if (!containerRef.current) return

    const styles = getComputedStyle(document.documentElement)
    const fg = styles.getPropertyValue('--foreground').trim() || '#fafafa'
    const muted =
      styles.getPropertyValue('--muted-foreground').trim() || '#a1a1aa'

    const chart: IChartApi = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 380,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: muted,
        fontFamily: 'inherit',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
      timeScale: {
        timeVisible: false,
        secondsVisible: false,
        borderColor: 'rgba(255,255,255,0.1)',
        tickMarkFormatter: (time: number | string) => {
          const d = typeof time === 'string' ? new Date(time) : new Date(time)
          return d.toLocaleDateString(undefined, {
            month: 'short',
            year: '2-digit',
          })
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        scaleMargins: { top: 0.05, bottom: 0.25 },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: fg, width: 1, style: 3 },
        horzLine: { color: fg, width: 1, style: 3 },
      },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR,
      borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    })
    candleSeries.setData(
      visibleBars.map((b) => ({
        time: b.time,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }))
    )

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    })
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    })
    volumeSeries.setData(
      visibleBars.map((b) => ({
        time: b.time,
        value: b.volume,
        color: b.close >= b.open ? UP_FILL : DOWN_FILL,
      }))
    )

    chart.timeScale().fitContent()

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [visibleBars])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end gap-1" role="tablist" aria-label="Price chart range">
        {RANGES.map((r) => {
          const isActive = r.label === range
          const disabled = bars.length < r.days && r.days !== Number.POSITIVE_INFINITY
          return (
            <button
              key={r.label}
              role="tab"
              aria-selected={isActive}
              disabled={disabled}
              onClick={() => setRange(r.label)}
              className={cn(
                'h-7 px-2.5 rounded-md text-xs font-medium tabular-nums transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                isActive
                  ? 'bg-primary/15 text-primary ring-1 ring-inset ring-primary/30'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
              )}
            >
              {r.label}
            </button>
          )
        })}
      </div>
      <div ref={containerRef} className="w-full" style={{ height: 380 }} />
    </div>
  )
}
