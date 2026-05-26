'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

import { usd } from '@/lib/format'

const COLORS = [
  '#9353D3', // primary purple
  '#0EA5E9', // sky-500
  '#F59E0B', // amber-500
  '#EC4899', // pink-500
  '#10B981', // emerald-500
  '#F43F5E', // rose-500
  '#A78BFA', // violet-400
  '#22D3EE', // cyan-400
  '#FB923C', // orange-400
  '#84CC16', // lime-500
]

export type AllocationSlice = {
  symbol: string
  value: number
}

export function AllocationPie({ data }: { data: AllocationSlice[] }) {
  if (data.length === 0) return null
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="symbol"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={50}
          paddingAngle={1}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          cursor={{ fill: 'var(--muted)' }}
          contentStyle={{
            background: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: 8,
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
        <Legend
          verticalAlign="bottom"
          wrapperStyle={{ fontSize: 12, color: 'var(--muted-foreground)' }}
          iconType="square"
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
