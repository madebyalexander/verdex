'use client'

import { useEffect, useRef } from 'react'
import {
  createChart,
  LineSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
} from 'lightweight-charts'
import { StockLogo } from '@/components/ui/stock-logo'
import { directionText } from '@/components/ui/change-badge'
import { readCssColor } from '@/lib/css-color'
import { chartTickFormatter } from '@/lib/chart-time'
import { cn } from '@/lib/utils'

export type CompareSeries = {
  symbol: string
  color: string
  data: { time: string; value: number }[]
}

const pctLabel = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`

export function CompareChart({ series }: { series: CompareSeries[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const fg = readCssColor('--foreground', '#fafafa')
    const muted = readCssColor('--muted-foreground', '#a1a1aa')

    const chart: IChartApi = createChart(containerRef.current, {
      autoSize: true,
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
        fixLeftEdge: true,
        fixRightEdge: true,
        tickMarkFormatter: chartTickFormatter,
      },
      rightPriceScale: { borderVisible: false },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: fg, width: 1, style: LineStyle.Dotted },
        horzLine: { color: fg, width: 1, style: LineStyle.Dotted },
      },
      handleScroll: { vertTouchDrag: false },
      localization: { priceFormatter: pctLabel },
    })

    series.forEach((s, i) => {
      const line = chart.addSeries(LineSeries, {
        color: s.color,
        lineWidth: 2,
        priceLineVisible: false,
        priceFormat: { type: 'custom', formatter: pctLabel, minMove: 0.01 },
      })
      line.setData(s.data)
      // Zero line once, on the first series.
      if (i === 0) {
        line.createPriceLine({
          price: 0,
          color: 'rgba(255,255,255,0.2)',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
        })
      }
    })

    chart.timeScale().fitContent()
    return () => chart.remove()
  }, [series])

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-wrap gap-2">
        {series.map((s) => {
          const last = s.data[s.data.length - 1]?.value ?? null
          return (
            <li
              key={s.symbol}
              className="flex items-center gap-2 rounded-full bg-white/[0.03] py-1 pr-3 pl-1 text-sm ring-1 ring-inset ring-white/[0.07]"
            >
              <StockLogo symbol={s.symbol} className="size-6 rounded-full text-[10px]" />
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ background: s.color }}
              />
              <span className="font-semibold tabular-nums">{s.symbol}</span>
              {last != null && (
                <span className={cn('text-xs font-medium tabular-nums', directionText(last))}>
                  {pctLabel(last)}
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <div ref={containerRef} className="h-[320px] w-full sm:h-[420px]" />
    </div>
  )
}
