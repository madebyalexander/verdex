import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { CardStack } from '@/components/layout/CardStack'
import { IoPeople as Community } from 'react-icons/io5'

export default function InvestorsLoading() {
  return (
    <PageContainer>
      <PageHeader
        icon={Community}
        title="Top investors"
        description="What famous funds are buying & selling, from their latest SEC 13F filings"
      />
      <CardStack>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 w-44 rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="h-5 w-48 rounded bg-muted animate-pulse" />
            <div className="h-3 w-72 rounded bg-muted animate-pulse mt-2" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-1 h-8 px-[3px] rounded-2xl bg-muted self-start">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[26px] w-20 rounded-xl bg-foreground/5 animate-pulse"
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-7 rounded-full bg-muted animate-pulse"
                    style={{ width: `${110 + (i % 4) * 22}px` }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </CardStack>
    </PageContainer>
  )
}
