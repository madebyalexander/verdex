'use client'

import { useId } from 'react'
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'

const UP = '#34D399' // emerald-400
const DOWN = '#FB7185' // rose-400

/**
 * Minimal trend sparkline — no axes, grid, or tooltips. Colored emerald when
 * the series ends higher than it started, rose when lower. Used per-row in the
 * market overview table.
 */
export function Sparkline({
  data,
  height = 36,
}: {
  data: number[]
  height?: number
}) {
  const rawId = useId()
  const gradientId = `spark-${rawId.replace(/:/g, '')}`

  if (data.length < 2) {
    return <div style={{ height }} className="w-full" aria-hidden />
  }

  const positive = data[data.length - 1] >= data[0]
  const color = positive ? UP : DOWN
  const chartData = data.map((value, i) => ({ i, value }))

  // Pad the domain slightly so the line doesn't hug the top/bottom edges.
  const min = Math.min(...data)
  const max = Math.max(...data)
  const pad = (max - min) * 0.1 || 1

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={chartData}
        margin={{ top: 3, right: 0, bottom: 3, left: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={[min - pad, max + pad]} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
          dot={false}
          activeDot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
