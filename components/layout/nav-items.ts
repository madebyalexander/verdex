import type { ComponentType, SVGProps } from 'react'
import {
  IoGrid as Dashboard,
  IoStatsChart as Markets,
  IoStar as Star,
  IoPieChart as Portfolio,
  IoGitCompare as Compare,
  IoNewspaper as News,
  IoPeople as Investors,
} from 'react-icons/io5'

export type NavItem = {
  href: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: Dashboard },
      { href: '/market', label: 'Markets', icon: Markets },
      { href: '/news', label: 'News', icon: News },
    ],
  },
  {
    label: 'Your money',
    items: [
      { href: '/watchlist', label: 'Watchlist', icon: Star },
      { href: '/portfolio', label: 'Portfolio', icon: Portfolio },
    ],
  },
  {
    label: 'Research',
    items: [
      { href: '/compare', label: 'Compare', icon: Compare },
      { href: '/investors', label: 'Top investors', icon: Investors },
    ],
  },
]

/** Primary destinations surfaced in the phone tab bar. */
export const MOBILE_TABS: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Dashboard },
  { href: '/market', label: 'Markets', icon: Markets },
  { href: '/watchlist', label: 'Watchlist', icon: Star },
  { href: '/portfolio', label: 'Portfolio', icon: Portfolio },
]

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
