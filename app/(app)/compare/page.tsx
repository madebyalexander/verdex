import { Suspense } from 'react'
import { GitCompare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { CompareControls } from '@/components/compare/CompareControls'
import { CompareView } from '@/components/compare/CompareView'
import { CompareSkeleton } from '@/components/compare/CompareSkeleton'
import { PageHeader } from '@/components/layout/PageHeader'

const MAX_SYMBOLS = 4
const SymbolRegex = /^[A-Z][A-Z0-9.-]{0,9}$/

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ symbols?: string }>
}) {
  const { symbols: raw } = await searchParams
  const symbols = Array.from(
    new Set(
      (raw ?? '')
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter((s) => SymbolRegex.test(s))
    )
  ).slice(0, MAX_SYMBOLS)

  return (
    <main className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
      <PageHeader
        icon={GitCompare}
        title="Compare stocks"
        description={`Up to ${MAX_SYMBOLS} tickers · overlay chart + side-by-side metrics.`}
      />

      <CompareControls symbols={symbols} max={MAX_SYMBOLS} />

      {symbols.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-center py-12 text-muted-foreground">
            Add a symbol above to start a comparison. Try{' '}
            <code className="font-mono">AAPL</code>,{' '}
            <code className="font-mono">NVDA</code>,{' '}
            <code className="font-mono">TSLA</code>.
          </CardContent>
        </Card>
      ) : (
        <Suspense key={symbols.join(',')} fallback={<CompareSkeleton />}>
          <CompareView symbols={symbols} />
        </Suspense>
      )}
    </main>
  )
}
