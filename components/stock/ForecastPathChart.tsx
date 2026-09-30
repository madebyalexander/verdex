'use client'

import {
  Area,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Horizon } from '@/lib/zod-schemas'
import { usd } from '@/lib/format'

const PRIMARY = '#ad46ff'

type Point = {
  label: string
  base: number
  range: [number, number]
  confidence?: Horizon['confidence']
}

/**
 * The three horizons drawn as one path from today's price: the band is the
 * model's low–high range, the line its base case. Reading the widening band
 * left to right makes "uncertainty grows with time" obvious at a glance.
 */
export function ForecastPathChart({
  current,
  horizons,
}: {
  current: number
  horizons: { '1w': Horizon; '1m': Horizon; '3m': Horizon }
}) {
  const data: Point[] = [
    { label: 'Today', base: current, range: [current, current] },
    ...(['1w', '1m', '3m'] as const).map((k) => ({
      label: k === '1w' ? '1 week' : k === '1m' ? '1 month' : '3 months',
      base: horizons[k].base,
      range: [horizons[k].low, horizons[k].high] as [number, number],
      confidence: horizons[k].confidence,
    })),
  ]
  const ticks = niceTicks(
    Math.min(...data.map((d) => d.range[0])),
    Math.max(...data.map((d) => d.range[1]))
  )

  return (
    <div
      className="h-56 w-full"
      role="img"
      aria-label={`Forecast path from ${usd(current)} today to a 3-month base case of ${usd(horizons['3m'].base)}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 16, right: 4, bottom: 0, left: 16 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            padding={{ left: 16, right: 24 }}
          />
          <YAxis
            orientation="right"
            domain={[ticks[0], ticks[ticks.length - 1]]}
            ticks={ticks}
            axisLine={false}
            tickLine={false}
            width={56}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            tickFormatter={(v: number) => `$${v.toLocaleString()}`}
          />
          <ReferenceLine
            y={current}
            stroke="rgba(255,255,255,0.28)"
            strokeWidth={1}
            label={{
              value: `Now ${usd(current)}`,
              position: 'insideBottomLeft',
              fill: 'var(--muted-foreground)',
              fontSize: 11,
            }}
          />
          <Area
            dataKey="range"
            type="monotone"
            stroke="none"
            fill={PRIMARY}
            fillOpacity={0.14}
            isAnimationActive={false}
            activeDot={false}
          />
          <Line
            dataKey="base"
            type="monotone"
            stroke={PRIMARY}
            strokeWidth={2}
            strokeLinecap="round"
            dot={{ r: 4, fill: PRIMARY, stroke: 'var(--card)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: PRIMARY, stroke: 'var(--card)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Tooltip
            cursor={{ stroke: 'rgba(255,255,255,0.18)', strokeWidth: 1 }}
            content={({ active, payload }) => (
              <PathTooltip
                active={active}
                point={payload?.[0]?.payload as Point | undefined}
                current={current}
              />
            )}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Round, evenly spaced price ticks (e.g. 160 / 180 / 200 / 220) spanning [min, max]. */
function niceTicks(min: number, max: number, target = 4): number[] {
  const raw = (max - min || Math.abs(max) * 0.1 || 1) / (target - 1)
  const mag = 10 ** Math.floor(Math.log10(raw))
  const n = raw / mag
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag
  const ticks: number[] = []
  for (let v = Math.floor(min / step) * step; v < max + step; v += step) {
    ticks.push(Number(v.toFixed(6)))
    if (v >= max) break
  }
  return ticks
}

function PathTooltip({
  active,
  point,
  current,
}: {
  active?: boolean
  point?: Point
  current: number
}) {
  if (!active || !point) return null
  const move = ((point.base - current) / current) * 100
  return (
    <div className="rounded-xl bg-popover px-3 py-2 text-xs shadow-lg ring-1 ring-white/10">
      <p className="mb-1 font-medium">{point.label}</p>
      {point.label === 'Today' ? (
        <p className="tabular-nums">{usd(point.base)}</p>
      ) : (
        <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 tabular-nums">
          <dt className="text-muted-foreground">Base case</dt>
          <dd className="text-right font-medium">
            {usd(point.base)}{' '}
            <span className={move >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              ({move >= 0 ? '+' : '−'}
              {Math.abs(move).toFixed(1)}%)
            </span>
          </dd>
          <dt className="text-muted-foreground">Range</dt>
          <dd className="text-right">
            {usd(point.range[0])} – {usd(point.range[1])}
          </dd>
          {point.confidence && (
            <>
              <dt className="text-muted-foreground">Confidence</dt>
              <dd className="text-right capitalize">{point.confidence}</dd>
            </>
          )}
        </dl>
      )}
    </div>
  )
}
