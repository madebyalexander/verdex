'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  AreaSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type AreaData,
  type Time,
} from 'lightweight-charts'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { OhlcvBar } from '@/lib/apis/alpha-vantage'
import { cn } from '@/lib/utils'
import { readCssColor } from '@/lib/css-color'
import { useUxMode } from '@/components/ux/use-ux-mode'

const UP_COLOR = '#34D399' // emerald-400
const DOWN_COLOR = '#FB7185' // rose-400
const UP_FILL = 'rgba(52, 211, 153, 0.35)'
const DOWN_FILL = 'rgba(251, 113, 133, 0.35)'

const CHART_HEIGHT = 380
const TOOLTIP_WIDTH = 168
const TOOLTIP_HEIGHT = 132

const RANGES = [
  { label: '1M', days: 22 },
  { label: '3M', days: 66 },
  { label: '6M', days: 132 },
  { label: '1Y', days: 252 },
  { label: 'MAX', days: Number.POSITIVE_INFINITY },
] as const

type RangeLabel = (typeof RANGES)[number]['label']

type Tooltip = {
  left: number
  top: number
  date: string
  price: number
  up: boolean
  /** OHLC + volume — present only in technical (candlestick) mode. */
  ohlc: { open: number; high: number; low: number; volume: number } | null
}

const volumeFormat = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 2,
})

function formatDate(time: Time): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
  if (typeof time === 'string') return new Date(time).toLocaleDateString(undefined, opts)
  if (typeof time === 'number')
    return new Date(time * 1000).toLocaleDateString(undefined, opts)
  return new Date(time.year, time.month - 1, time.day).toLocaleDateString(
    undefined,
    opts
  )
}

export function PriceChart({
  bars,
  description,
}: {
  bars: OhlcvBar[]
  description: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const areaRef = useRef<ISeriesApi<'Area'> | null>(null)
  const mode = useUxMode()
  const [range, setRange] = useState<RangeLabel>('3M')
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  const visibleBars = useMemo(() => {
    const cfg = RANGES.find((r) => r.label === range)
    if (!cfg || cfg.days === Number.POSITIVE_INFINITY) return bars
    return bars.slice(-cfg.days)
  }, [bars, range])

  // Create the chart + series once. Range changes only update data (effect below).
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const fg = readCssColor('--foreground', '#fafafa')
    const muted = readCssColor('--muted-foreground', '#a1a1aa')

    const chart: IChartApi = createChart(container, {
      autoSize: true,
      height: CHART_HEIGHT,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: muted,
        fontFamily: 'inherit',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      timeScale: {
        timeVisible: false,
        secondsVisible: false,
        borderVisible: false,
        // Keep the data pinned to the viewport: no scrolling/zooming into
        // empty space beyond the first or last bar.
        fixLeftEdge: true,
        fixRightEdge: true,
        rightOffset: 0,
        minBarSpacing: 2,
        lockVisibleTimeRangeOnResize: true,
        tickMarkFormatter: (time: number | string) => {
          const d = typeof time === 'string' ? new Date(time) : new Date(time)
          return d.toLocaleDateString(undefined, {
            month: 'short',
            year: '2-digit',
          })
        },
      },
      rightPriceScale: {
        borderVisible: false,
        // Reserve bottom space for the volume histogram in technical mode;
        // the simple area chart has no volume, so keep it tight.
        scaleMargins: { top: 0.05, bottom: mode === 'simple' ? 0.08 : 0.25 },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: fg, width: 1, style: 3 },
        horzLine: { color: fg, width: 1, style: 3 },
      },
      // Don't let horizontal axis drag stretch time; price axis still scales.
      handleScale: { axisPressedMouseMove: { time: false } },
    })
    chartRef.current = chart

    const place = (px: number, py: number) => {
      const w = container.clientWidth
      let left = px + 16
      if (left + TOOLTIP_WIDTH > w) left = px - TOOLTIP_WIDTH - 16
      if (left < 0) left = 8
      let top = py + 16
      if (top + TOOLTIP_HEIGHT > CHART_HEIGHT) top = py - TOOLTIP_HEIGHT - 16
      if (top < 0) top = 8
      return { left, top }
    }

    if (mode === 'simple') {
      // Beginner-friendly: a clean area line of the close, no candles/volume.
      const accent = readCssColor('--primary', '#ad46ff')
      const area = chart.addSeries(AreaSeries, {
        lineColor: accent,
        topColor: 'rgba(173, 70, 255, 0.25)',
        bottomColor: 'rgba(173, 70, 255, 0)',
        lineWidth: 2,
        priceLineVisible: false,
      })
      areaRef.current = area

      chart.subscribeCrosshairMove((param) => {
        if (
          !param.point ||
          param.point.x < 0 ||
          param.point.y < 0 ||
          param.time === undefined
        ) {
          setTooltip(null)
          return
        }
        const d = param.seriesData.get(area) as AreaData<Time> | undefined
        if (!d) {
          setTooltip(null)
          return
        }
        const { left, top } = place(param.point.x, param.point.y)
        setTooltip({
          left,
          top,
          date: formatDate(d.time),
          price: d.value,
          up: true,
          ohlc: null,
        })
      })
    } else {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: UP_COLOR,
        downColor: DOWN_COLOR,
        borderUpColor: UP_COLOR,
        borderDownColor: DOWN_COLOR,
        wickUpColor: UP_COLOR,
        wickDownColor: DOWN_COLOR,
      })
      candleRef.current = candleSeries

      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      })
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      })
      volumeRef.current = volumeSeries

      chart.subscribeCrosshairMove((param) => {
        if (
          !param.point ||
          param.point.x < 0 ||
          param.point.y < 0 ||
          param.time === undefined
        ) {
          setTooltip(null)
          return
        }
        const candle = param.seriesData.get(candleSeries) as
          | CandlestickData<Time>
          | undefined
        if (!candle) {
          setTooltip(null)
          return
        }
        const vol = param.seriesData.get(volumeSeries) as
          | HistogramData<Time>
          | undefined
        const { left, top } = place(param.point.x, param.point.y)
        setTooltip({
          left,
          top,
          date: formatDate(candle.time),
          price: candle.close,
          up: candle.close >= candle.open,
          ohlc: {
            open: candle.open,
            high: candle.high,
            low: candle.low,
            volume: vol?.value ?? 0,
          },
        })
      })
    }

    return () => {
      chart.remove()
      chartRef.current = null
      candleRef.current = null
      volumeRef.current = null
      areaRef.current = null
    }
  }, [mode])

  // Update data on range (or mode) change without otherwise recreating the chart.
  useEffect(() => {
    if (mode === 'simple') {
      const area = areaRef.current
      if (!area) return
      area.setData(
        visibleBars.map((b) => ({ time: b.time, value: b.close }))
      )
    } else {
      const candle = candleRef.current
      const volume = volumeRef.current
      if (!candle || !volume) return
      candle.setData(
        visibleBars.map((b) => ({
          time: b.time,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
        }))
      )
      volume.setData(
        visibleBars.map((b) => ({
          time: b.time,
          value: b.volume,
          color: b.close >= b.open ? UP_FILL : DOWN_FILL,
        }))
      )
    }
    setTooltip(null)
    chartRef.current?.timeScale().fitContent()
  }, [visibleBars, mode])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price chart</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction className="self-center">
          <div
            className="flex items-center gap-1"
            role="tablist"
            aria-label="Price chart range"
          >
            {RANGES.map((r) => {
              const isActive = r.label === range
              const disabled =
                bars.length < r.days && r.days !== Number.POSITIVE_INFINITY
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
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="relative w-full" style={{ height: CHART_HEIGHT }}>
          <div ref={containerRef} className="absolute inset-0" />
          {tooltip && (
            <div
              className="pointer-events-none absolute z-10 w-[168px] rounded-md border bg-popover/95 px-2.5 py-2 text-xs shadow-md backdrop-blur"
              style={{ left: tooltip.left, top: tooltip.top }}
            >
              <div className="mb-1.5 font-medium text-foreground">
                {tooltip.date}
              </div>
              {tooltip.ohlc ? (
                <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 tabular-nums">
                  <TooltipRow label="O" value={tooltip.ohlc.open.toFixed(2)} />
                  <TooltipRow label="H" value={tooltip.ohlc.high.toFixed(2)} />
                  <TooltipRow label="L" value={tooltip.ohlc.low.toFixed(2)} />
                  <TooltipRow
                    label="C"
                    value={tooltip.price.toFixed(2)}
                    valueClassName={tooltip.up ? 'text-emerald-400' : 'text-rose-400'}
                  />
                  <div className="col-span-2 flex items-center justify-between">
                    <dt className="text-muted-foreground">Vol</dt>
                    <dd className="font-medium text-foreground">
                      {volumeFormat.format(tooltip.ohlc.volume)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="flex items-center justify-between tabular-nums">
                  <dt className="text-muted-foreground">Price</dt>
                  <dd className="font-medium text-foreground">
                    ${tooltip.price.toFixed(2)}
                  </dd>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TooltipRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('font-medium text-foreground', valueClassName)}>{value}</dd>
    </div>
  )
}
