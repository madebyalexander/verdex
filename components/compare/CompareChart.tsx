'use client'

import { useEffect, useRef } from 'react'
import {
  createChart,
  LineSeries,
  ColorType,
  type IChartApi,
} from 'lightweight-charts'

export type CompareSeries = {
  symbol: string
  color: string
  data: { time: string; value: number }[]
}

export function CompareChart({ series }: { series: CompareSeries[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const styles = getComputedStyle(document.documentElement)
    const fg = styles.getPropertyValue('--foreground').trim() || '#fafafa'
    const muted =
      styles.getPropertyValue('--muted-foreground').trim() || '#a1a1aa'

    const chart: IChartApi = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 420,
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
      },
      crosshair: {
        mode: 1,
        vertLine: { color: fg, width: 1, style: 3 },
        horzLine: { color: fg, width: 1, style: 3 },
      },
      localization: {
        priceFormatter: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`,
      },
    })

    for (const s of series) {
      const line = chart.addSeries(LineSeries, {
        color: s.color,
        lineWidth: 2,
        priceFormat: {
          type: 'custom',
          formatter: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`,
          minMove: 0.01,
        },
      })
      line.setData(s.data)
    }

    chart.timeScale().fitContent()

    const onResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      chart.remove()
    }
  }, [series])

  return (
    <div className="flex flex-col gap-3">
      <div ref={containerRef} className="w-full" style={{ height: 420 }} />
      <div className="flex flex-wrap gap-3">
        {series.map((s) => (
          <div key={s.symbol} className="flex items-center gap-1.5 text-sm">
            <span
              aria-hidden
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: s.color }}
            />
            <span className="font-medium">{s.symbol}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
