'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  AreaSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type AreaData,
  type Time,
} from 'lightweight-charts'
import { Card } from '@/components/ui/card'
import { ChangeText } from '@/components/ui/change-badge'
import { Segmented } from '@/components/ui/filter-chip'
import type { OhlcvBar } from '@/lib/apis/alpha-vantage'
import { cn } from '@/lib/utils'
import { usd } from '@/lib/format'
import { readCssColor } from '@/lib/css-color'
import { useUxMode } from '@/components/ux/use-ux-mode'

const UP_COLOR = '#34D399' // emerald-400
const DOWN_COLOR = '#FB7185' // rose-400
const UP_FILL = 'rgba(52, 211, 153, 0.35)'
const DOWN_FILL = 'rgba(251, 113, 133, 0.35)'

const TOOLTIP_WIDTH = 168
const TOOLTIP_HEIGHT = 132

const RANGES = [
  { label: '1M', days: 22, text: 'Past month' },
  { label: '3M', days: 66, text: 'Past 3 months' },
  { label: '6M', days: 132, text: 'Past 6 months' },
  { label: '1Y', days: 252, text: 'Past year' },
  { label: 'MAX', days: Number.POSITIVE_INFINITY, text: 'All available' },
] as const

type RangeLabel = (typeof RANGES)[number]['label']
const RANGE_LABELS = RANGES.map((r) => r.label)

type Hover = { date: string; price: number }

type Tooltip = {
  left: number
  top: number
  up: boolean
  ohlc: { open: number; high: number; low: number; close: number; volume: number }
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

function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
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
  const baselineRef = useRef<IPriceLine | null>(null)
  const mode = useUxMode()
  const [range, setRange] = useState<RangeLabel>('3M')
  const [hover, setHover] = useState<Hover | null>(null)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  const visibleBars = useMemo(() => {
    const cfg = RANGES.find((r) => r.label === range)
    if (!cfg || cfg.days === Number.POSITIVE_INFINITY) return bars
    return bars.slice(-cfg.days)
  }, [bars, range])

  const baseClose = visibleBars[0]?.close ?? null
  const lastClose = visibleBars[visibleBars.length - 1]?.close ?? null
  const shown = hover?.price ?? lastClose
  const abs = baseClose != null && shown != null ? shown - baseClose : null
  const pct = abs != null && baseClose ? (abs / baseClose) * 100 : null
  const rangeUp = (lastClose ?? 0) >= (baseClose ?? 0)
  const rangeText = RANGES.find((r) => r.label === range)?.text ?? ''

  // Create the chart + series once per display mode. Range changes only
  // update data (effect below).
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const simple = mode === 'simple'

    const fg = readCssColor('--foreground', '#fafafa')
    const muted = readCssColor('--muted-foreground', '#a1a1aa')

    const chart: IChartApi = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: muted,
        fontFamily: 'inherit',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: simple ? 'transparent' : 'rgba(255,255,255,0.04)' },
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
        // Simple mode reads the price from the header instead of an axis.
        visible: !simple,
        borderVisible: false,
        // Reserve bottom space for the volume histogram in technical mode.
        scaleMargins: { top: 0.08, bottom: simple ? 0.04 : 0.25 },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: simple ? 'rgba(255,255,255,0.35)' : fg,
          width: 1,
          style: simple ? LineStyle.Solid : LineStyle.Dotted,
          labelVisible: !simple,
        },
        horzLine: {
          color: fg,
          width: 1,
          style: LineStyle.Dotted,
          visible: !simple,
          labelVisible: !simple,
        },
      },
      // Let vertical swipes scroll the page on touch devices.
      handleScroll: { vertTouchDrag: false },
      // Don't let horizontal axis drag stretch time; price axis still scales.
      handleScale: { axisPressedMouseMove: { time: false } },
    })
    chartRef.current = chart

    const place = (px: number, py: number) => {
      const w = container.clientWidth
      const h = container.clientHeight
      let left = px + 16
      if (left + TOOLTIP_WIDTH > w) left = px - TOOLTIP_WIDTH - 16
      if (left < 0) left = 8
      let top = py + 16
      if (top + TOOLTIP_HEIGHT > h) top = py - TOOLTIP_HEIGHT - 16
      if (top < 0) top = 8
      return { left, top }
    }

    const clear = () => {
      setHover(null)
      setTooltip(null)
    }

    if (simple) {
      // Beginner-friendly: a clean area line of the close, no candles/volume.
      const area = chart.addSeries(AreaSeries, {
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: '#0a0a0c',
        crosshairMarkerBorderWidth: 2,
      })
      areaRef.current = area

      chart.subscribeCrosshairMove((param) => {
        if (!param.point || param.point.x < 0 || param.time === undefined) {
          clear()
          return
        }
        const d = param.seriesData.get(area) as AreaData<Time> | undefined
        if (!d) {
          clear()
          return
        }
        setHover({ date: formatDate(d.time), price: d.value })
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
          clear()
          return
        }
        const candle = param.seriesData.get(candleSeries) as
          | CandlestickData<Time>
          | undefined
        if (!candle) {
          clear()
          return
        }
        const vol = param.seriesData.get(volumeSeries) as
          | HistogramData<Time>
          | undefined
        const { left, top } = place(param.point.x, param.point.y)
        setHover({ date: formatDate(candle.time), price: candle.close })
        setTooltip({
          left,
          top,
          up: candle.close >= candle.open,
          ohlc: {
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
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
      baselineRef.current = null
    }
  }, [mode])

  // Update data on range (or mode) change without otherwise recreating the chart.
  useEffect(() => {
    if (mode === 'simple') {
      const area = areaRef.current
      if (!area || visibleBars.length === 0) return
      // Line takes the semantic colour of the selected period's performance.
      const color = rangeUp ? UP_COLOR : DOWN_COLOR
      area.applyOptions({
        lineColor: color,
        topColor: withAlpha(color, 0.22),
        bottomColor: withAlpha(color, 0),
      })
      area.setData(visibleBars.map((b) => ({ time: b.time, value: b.close })))
      // Dashed reference at the period's opening close.
      if (baselineRef.current) area.removePriceLine(baselineRef.current)
      baselineRef.current = area.createPriceLine({
        price: visibleBars[0].close,
        color: 'rgba(255,255,255,0.22)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: false,
      })
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
    chartRef.current?.timeScale().fitContent()
  }, [visibleBars, mode, rangeUp])

  return (
    <Card className="gap-4 pb-4">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5">
        <div className="flex min-h-12 min-w-0 flex-col justify-center gap-0.5">
          <p className="text-xs font-medium text-muted-foreground tabular-nums">
            {hover ? hover.date : rangeText}
          </p>
          <div className="flex flex-wrap items-baseline gap-x-2">
            {hover && (
              <span className="text-lg font-semibold tracking-tight tabular-nums">
                {usd(hover.price)}
              </span>
            )}
            <ChangeText
              pct={pct}
              abs={abs}
              className={hover ? 'text-sm' : 'text-lg font-semibold'}
            />
          </div>
        </div>
        <Segmented
          value={range}
          options={RANGE_LABELS}
          onChange={(r) => {
            setRange(r)
            setHover(null)
            setTooltip(null)
          }}
          ariaLabel="Price chart range"
          isDisabled={(label) => {
            const cfg = RANGES.find((r) => r.label === label)
            return !!cfg && cfg.days !== Number.POSITIVE_INFINITY && bars.length < cfg.days
          }}
        />
      </div>

      <div className="relative h-[280px] w-full px-2 sm:h-[360px]">
        <div ref={containerRef} className="absolute inset-0 mx-2" />
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 w-[168px] rounded-xl bg-popover/95 px-3 py-2.5 text-xs shadow-lg ring-1 ring-white/10 backdrop-blur"
            style={{ left: tooltip.left, top: tooltip.top }}
          >
            <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 tabular-nums">
              <TooltipRow label="O" value={tooltip.ohlc.open.toFixed(2)} />
              <TooltipRow label="H" value={tooltip.ohlc.high.toFixed(2)} />
              <TooltipRow label="L" value={tooltip.ohlc.low.toFixed(2)} />
              <TooltipRow
                label="C"
                value={tooltip.ohlc.close.toFixed(2)}
                valueClassName={tooltip.up ? 'text-emerald-400' : 'text-rose-400'}
              />
              <div className="col-span-2 flex items-center justify-between">
                <dt className="text-muted-foreground">Vol</dt>
                <dd className="font-medium text-foreground">
                  {volumeFormat.format(tooltip.ohlc.volume)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      <p className="px-5 text-[11px] text-muted-foreground/80">{description}</p>
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
