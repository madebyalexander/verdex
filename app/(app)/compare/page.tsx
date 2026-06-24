import { Suspense } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CompareControls } from '@/components/compare/CompareControls'
import { CompareView } from '@/components/compare/CompareView'
import { CompareSkeleton } from '@/components/compare/CompareSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { CardStack } from '@/components/layout/CardStack'
import { IoGitMerge as Combine } from 'react-icons/io5'

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
    <PageContainer>
      <PageHeader
        icon={Combine}
        title="Compare stocks"
        description={`Up to ${MAX_SYMBOLS} tickers · overlay chart + side-by-side metrics`}
      />

      <CardStack>
        <Card>
          <CardHeader>
            <CardTitle>Tickers</CardTitle>
            <CardDescription>
              Add or remove symbols to update the comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompareControls symbols={symbols} max={MAX_SYMBOLS} />
          </CardContent>
        </Card>

        {symbols.length > 0 && (
          <Suspense key={symbols.join(',')} fallback={<CompareSkeleton />}>
            <CompareView symbols={symbols} />
          </Suspense>
        )}
      </CardStack>
    </PageContainer>
  )
}
