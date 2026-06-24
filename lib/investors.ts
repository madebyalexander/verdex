/**
 * Well-known 13F filers (funds / managers) to surface on the Investors page.
 * CIK = the fund's SEC Central Index Key. These are public institutional
 * managers required to file quarterly 13F holdings. Every CIK below was
 * verified against SEC EDGAR (entity name + a recent 13F-HR filing).
 */
export type InvestorCategory =
  | 'value'
  | 'growth'
  | 'activist'
  | 'macro'
  | 'quant'

export type Investor = {
  id: string
  /** Person most associated with the fund. */
  person: string
  /** Filing entity name. */
  firm: string
  cik: string
  /** Strategy bucket used for the investor filter bar. */
  category: InvestorCategory
  blurb: string
  /**
   * Freely-licensed portrait (Wikimedia Commons). Optional — investors without
   * a free photo fall back to an initials avatar. Credit: Wikimedia Commons.
   */
  photo?: string
}

/** Ordered list + display labels for the category filter. */
export const INVESTOR_CATEGORIES: { id: InvestorCategory; label: string }[] = [
  { id: 'value', label: 'Value' },
  { id: 'growth', label: 'Growth' },
  { id: 'activist', label: 'Activist' },
  { id: 'macro', label: 'Macro' },
  { id: 'quant', label: 'Quant' },
]

export const CATEGORY_LABEL: Record<InvestorCategory, string> = {
  value: 'Value',
  growth: 'Growth',
  activist: 'Activist',
  macro: 'Macro',
  quant: 'Quant',
}

export const INVESTORS: Investor[] = [
  {
    id: 'berkshire',
    person: 'Warren Buffett',
    firm: 'Berkshire Hathaway',
    cik: '1067983',
    category: 'value',
    blurb: 'Value investing · long-term concentrated bets',
    photo:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Warren_Buffett_at_the_2015_SelectUSA_Investment_Summit_%28cropped%29.jpg/250px-Warren_Buffett_at_the_2015_SelectUSA_Investment_Summit_%28cropped%29.jpg',
  },
  {
    id: 'ark',
    person: 'Cathie Wood',
    firm: 'ARK Investment Management',
    cik: '1697748',
    category: 'growth',
    blurb: 'Disruptive innovation · high-growth tech',
    photo:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Cathie_Wood_ARK_Invest_Photo.jpg/250px-Cathie_Wood_ARK_Invest_Photo.jpg',
  },
  {
    id: 'scion',
    person: 'Michael Burry',
    firm: 'Scion Asset Management',
    cik: '1649339',
    category: 'macro',
    blurb: 'Contrarian deep-value · macro bets',
  },
  {
    id: 'pershing',
    person: 'Bill Ackman',
    firm: 'Pershing Square Capital',
    cik: '1336528',
    category: 'activist',
    blurb: 'Activist · concentrated quality',
    photo:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Valeant_Pharmaceuticals%27_Business_Model_%28headshot%29.jpg/250px-Valeant_Pharmaceuticals%27_Business_Model_%28headshot%29.jpg',
  },
  {
    id: 'bridgewater',
    person: 'Ray Dalio',
    firm: 'Bridgewater Associates',
    cik: '1350694',
    category: 'macro',
    blurb: 'Macro · diversified all-weather',
    photo:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Web_Summit_2018_-_Forum_-_Day_2%2C_November_7_HM1_7481_%2844858045925%29.jpg/250px-Web_Summit_2018_-_Forum_-_Day_2%2C_November_7_HM1_7481_%2844858045925%29.jpg',
  },
  {
    id: 'greenlight',
    person: 'David Einhorn',
    firm: 'Greenlight Capital',
    cik: '1079114',
    category: 'value',
    blurb: 'Long/short value · event-driven',
  },
  {
    id: 'baupost',
    person: 'Seth Klarman',
    firm: 'Baupost Group',
    cik: '1061768',
    category: 'value',
    blurb: 'Margin-of-safety value · cash-heavy contrarian',
    photo:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Seth_Klarman_at_147th_Preakness_Stakes.jpg/250px-Seth_Klarman_at_147th_Preakness_Stakes.jpg',
  },
  {
    id: 'himalaya',
    person: 'Li Lu',
    firm: 'Himalaya Capital',
    cik: '1709323',
    category: 'value',
    blurb: 'Concentrated value · Munger-style quality',
  },
  {
    id: 'akre',
    person: 'Chuck Akre',
    firm: 'Akre Capital Management',
    cik: '1112520',
    category: 'growth',
    blurb: 'Quality compounders · long-term holds',
  },
  {
    id: 'fundsmith',
    person: 'Terry Smith',
    firm: 'Fundsmith',
    cik: '1569205',
    category: 'growth',
    blurb: 'Quality growth · buy great companies, hold',
  },
  {
    id: 'tiger',
    person: 'Chase Coleman',
    firm: 'Tiger Global Management',
    cik: '1167483',
    category: 'growth',
    blurb: 'Growth & technology · global long bias',
  },
  {
    id: 'thirdpoint',
    person: 'Daniel Loeb',
    firm: 'Third Point',
    cik: '1040273',
    category: 'activist',
    blurb: 'Activist · event-driven equity',
  },
  {
    id: 'icahn',
    person: 'Carl Icahn',
    firm: 'Icahn Capital',
    cik: '921669',
    category: 'activist',
    blurb: 'Activist · contrarian value plays',
    photo:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Carl_Icahn%2C_1980s.jpg/250px-Carl_Icahn%2C_1980s.jpg',
  },
  {
    id: 'appaloosa',
    person: 'David Tepper',
    firm: 'Appaloosa',
    cik: '1656456',
    category: 'macro',
    blurb: 'Distressed & opportunistic · bold macro tilts',
    photo:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/David_Tepper_01.jpg/250px-David_Tepper_01.jpg',
  },
  {
    id: 'duquesne',
    person: 'Stanley Druckenmiller',
    firm: 'Duquesne Family Office',
    cik: '1536411',
    category: 'macro',
    blurb: 'Macro · concentrated high-conviction',
  },
  {
    id: 'rentech',
    person: 'Jim Simons',
    firm: 'Renaissance Technologies',
    cik: '1037389',
    category: 'quant',
    blurb: 'Quantitative · systematic statistical models',
    photo:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Jim_Simons_at_MSRI.jpg/250px-Jim_Simons_at_MSRI.jpg',
  },
]

export function investorByCik(cik: string): Investor | undefined {
  const c = cik.replace(/^0+/, '')
  return INVESTORS.find((i) => i.cik.replace(/^0+/, '') === c)
}

/** Substring match on person and firm — used by the global search palette. */
export function matchInvestors(query: string): Investor[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return INVESTORS.filter(
    (i) =>
      i.person.toLowerCase().includes(q) || i.firm.toLowerCase().includes(q)
  )
}
