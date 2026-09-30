'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { compactUsd, usd } from '@/lib/format'

// Brand purple leads; the rest are spaced around the wheel so adjacent
// slices stay distinguishable on a dark surface.
export const ALLOCATION_COLORS = [
  '#ad46ff', // brand purple — matches --primary
  '#0EA5E9', // sky-500
  '#F59E0B', // amber-500
  '#EC4899', // pink-500
  '#14B8A6', // teal-500
  '#A78BFA', // violet-400
  '#22D3EE', // cyan-400
  '#FB923C', // orange-400
  '#84CC16', // lime-500
  '#F472B6', // pink-400
]

export type AllocationSlice = {
  symbol: string
  value: number
}

export function AllocationPie({ data }: { data: AllocationSlice[] }) {
  if (data.length === 0) return null
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const total = sorted.reduce((s, d) => s + d.value, 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="relative mx-auto aspect-square w-full max-w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sorted}
              dataKey="value"
              nameKey="symbol"
              cx="50%"
              cy="50%"
              outerRadius="100%"
              innerRadius="74%"
              paddingAngle={sorted.length > 1 ? 2 : 0}
              cornerRadius={4}
              stroke="none"
              isAnimationActive={false}
            >
              {sorted.map((_, i) => (
                <Cell key={i} fill={ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              cursor={false}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                fontSize: 12,
                color: 'var(--popover-foreground)',
                padding: '6px 10px',
              }}
              itemStyle={{ color: 'var(--popover-foreground)' }}
              formatter={(value, name) => [
                usd(typeof value === 'number' ? value : Number(value)),
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Market value</span>
          <span className="text-xl font-semibold tracking-tight tabular-nums">
            {compactUsd(total)}
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {sorted.map((d, i) => {
          const weight = total > 0 ? (d.value / total) * 100 : 0
          return (
            <li key={d.symbol} className="flex items-center gap-2.5 text-sm">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] }}
              />
              <span className="font-medium tabular-nums">{d.symbol}</span>
              <span className="ml-auto tabular-nums text-muted-foreground">
                {weight.toFixed(1)}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
