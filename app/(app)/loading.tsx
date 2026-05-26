import { Skeleton } from '@/components/ui/skeleton'

export default function AppLoading() {
  return (
    <main className="p-6 max-w-4xl mx-auto flex flex-col gap-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
        <Skeleton className="h-24 rounded-md" />
        <Skeleton className="h-24 rounded-md" />
        <Skeleton className="h-24 rounded-md" />
      </div>
      <Skeleton className="h-64 rounded-md" />
    </main>
  )
}
