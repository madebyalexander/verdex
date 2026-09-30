'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/components/ui/sidebar'
import { MOBILE_TABS, isActivePath } from '@/components/layout/nav-items'
import { cn } from '@/lib/utils'
import { IoMenu as Menu } from 'react-icons/io5'

/**
 * Phone-only bottom navigation — the thumb-reachable pattern every mobile
 * investing app uses. "More" opens the full sidebar sheet.
 */
export function MobileTabBar() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  const itemClass =
    'flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:text-foreground'

  return (
    <nav
      aria-label="Primary"
      className="shrink-0 border-t border-white/[0.06] bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="grid grid-cols-5">
        {MOBILE_TABS.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  itemClass,
                  active ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                <Icon
                  aria-hidden
                  className={cn('size-5', active && 'text-primary')}
                />
                {label}
              </Link>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            onClick={() => setOpenMobile(true)}
            className={cn(itemClass, 'w-full text-muted-foreground')}
          >
            <Menu aria-hidden className="size-5" />
            More
          </button>
        </li>
      </ul>
    </nav>
  )
}
