'use client'

import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { BROKERS, brokerUrlFor, type Broker } from '@/lib/brokers'
import { cn } from '@/lib/utils'
import {
  IoOpen as OpenInWindow,
  IoCart as Cart,
  IoSparkles as Sparks,
  IoChevronDown as ChevronDown,
} from 'react-icons/io5'

function openBrokerUrl(broker: Broker, symbol: string) {
  if (typeof window === 'undefined') return
  // noopener,noreferrer protects against tabnabbing on the destination site.
  window.open(
    brokerUrlFor(broker, symbol),
    '_blank',
    'noopener,noreferrer'
  )
}

export function BuyNowButton({ symbol }: { symbol: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Buy ${symbol} via external broker`}
        className={cn(buttonVariants({ size: 'lg' }))}
      >
        <Cart aria-hidden />
        <span>Buy</span>
        <ChevronDown
          aria-hidden
          className="opacity-70 transition-transform data-[popup-open]:rotate-180"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5 text-xs">
            Trade {symbol} through a broker
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {BROKERS.map((broker) => (
          <DropdownMenuItem
            key={broker.id}
            onClick={() => openBrokerUrl(broker, symbol)}
            className="py-2 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{broker.name}</span>
                {broker.referralOnly ? (
                  <Badge
                    variant="outline"
                    className="text-[10px] h-4 px-1.5 gap-0.5 border-transparent bg-primary/10 text-primary ring-1 ring-inset ring-primary/20"
                  >
                    <Sparks aria-hidden className="size-2.5" />
                    <span>Referral</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                    {broker.region}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {broker.referralOnly
                  ? `${broker.description} · lands on signup, not ${symbol}`
                  : `${broker.description} · opens ${symbol} directly`}
              </p>
            </div>
            <OpenInWindow
              aria-hidden
              className="size-3.5 text-muted-foreground shrink-0"
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
