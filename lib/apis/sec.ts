import { cache } from '@/lib/cache'

// SEC requires a descriptive User-Agent with a *reachable* contact, or it will
// throttle/deny. Set SEC_CONTACT_EMAIL to a real, monitored address in prod.
const SEC_CONTACT = process.env.SEC_CONTACT_EMAIL ?? 'support@verdex.app'
const UA = `Verdex research tool (contact: ${SEC_CONTACT})`

async function secFetch(url: string): Promise<Response> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`SEC ${res.status} for ${url}`)
  return res
}

export type Holding = {
  issuer: string
  cusip: string
  shares: number
  value: number // USD (13F values report in dollars as of 2023+)
}

export type MoveAction = 'new' | 'added' | 'reduced' | 'held' | 'exited'

export type HoldingMove = Holding & {
  prevShares: number
  deltaShares: number
  /** Percent change in share count vs the prior quarter (null for new/exited). */
  deltaPct: number | null
  action: MoveAction
  /**
   * Estimated signed USD value of the trade this quarter (positive = bought,
   * negative = sold). For buys/adds/cuts this is `deltaShares × current price`
   * (price ≈ value/shares); for exits it's the negated prior position value.
   */
  tradeValue: number
}

export type Fund13F = {
  cik: string
  reportDate: string | null
  filedAt: string | null
  totalValue: number
  holdingsCount: number
  /** Largest current positions, with how they changed vs last quarter. */
  topHoldings: HoldingMove[]
  /** Most significant changes this quarter (new buys, big adds/cuts, exits). */
  notableMoves: HoldingMove[]
}

type SubmissionsRecent = {
  form: string[]
  accessionNumber: string[]
  primaryDocument: string[]
  filingDate: string[]
  reportDate: string[]
}

async function getRecent13FFilings(cik10: string) {
  const res = await secFetch(`https://data.sec.gov/submissions/CIK${cik10}.json`)
  const json = (await res.json()) as { filings?: { recent?: SubmissionsRecent } }
  const recent = json.filings?.recent
  if (!recent) return []

  const filings: { accession: string; reportDate: string; filingDate: string }[] =
    []
  for (let i = 0; i < recent.form.length; i++) {
    if (recent.form[i] === '13F-HR') {
      filings.push({
        accession: recent.accessionNumber[i],
        reportDate: recent.reportDate[i] ?? '',
        filingDate: recent.filingDate[i] ?? '',
      })
      if (filings.length >= 2) break
    }
  }
  return filings
}

async function getHoldings(
  cikNum: string,
  accession: string
): Promise<Holding[]> {
  const accNoDashes = accession.replace(/-/g, '')
  const folder = `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accNoDashes}`

  // Locate the information-table XML (filename varies between filers).
  const idxRes = await secFetch(`${folder}/index.json`)
  const idx = (await idxRes.json()) as {
    directory?: { item?: { name: string }[] }
  }
  const files = idx.directory?.item ?? []
  const xmlFile =
    files.find(
      (f) =>
        /\.xml$/i.test(f.name) && /(infotable|form13f|table)/i.test(f.name)
    ) ??
    files.find(
      (f) => /\.xml$/i.test(f.name) && !/primary_doc/i.test(f.name)
    )
  if (!xmlFile) return []

  const xmlRes = await secFetch(`${folder}/${xmlFile.name}`)
  const xml = await xmlRes.text()
  return parseInfoTable(xml)
}

function tag(block: string, name: string): string | null {
  // Namespace-tolerant single-tag extractor.
  const m = block.match(new RegExp(`<(?:\\w+:)?${name}>([^<]+)<`, 'i'))
  return m ? m[1].trim() : null
}

function parseInfoTable(xml: string): Holding[] {
  const blocks =
    xml.match(/<(?:\w+:)?infoTable\b[\s\S]*?<\/(?:\w+:)?infoTable>/g) ?? []
  const byCusip = new Map<string, Holding>()
  for (const b of blocks) {
    const issuer = tag(b, 'nameOfIssuer')
    const cusip = tag(b, 'cusip')
    const value = parseFloat(tag(b, 'value') ?? '0')
    const shares = parseFloat(tag(b, 'sshPrnamt') ?? '0')
    if (!issuer || !cusip) continue
    const existing = byCusip.get(cusip)
    if (existing) {
      existing.shares += shares
      existing.value += value
    } else {
      byCusip.set(cusip, { issuer, cusip, shares, value })
    }
  }
  return Array.from(byCusip.values())
}

export async function getFund13F(cik: string): Promise<Fund13F | null> {
  const cik10 = cik.padStart(10, '0')
  const cikNum = String(parseInt(cik, 10))

  // 13F is quarterly — cache a full day.
  return cache(`sec:13f:v2:${cik10}`, 24 * 3600, async () => {
    const filings = await getRecent13FFilings(cik10)
    if (filings.length === 0) return null

    const [latest, prev] = filings
    const [latestHoldings, prevHoldings] = await Promise.all([
      getHoldings(cikNum, latest.accession),
      prev
        ? getHoldings(cikNum, prev.accession).catch(() => [] as Holding[])
        : Promise.resolve([] as Holding[]),
    ])
    if (latestHoldings.length === 0) return null

    const prevByCusip = new Map(prevHoldings.map((h) => [h.cusip, h]))
    const latestCusips = new Set(latestHoldings.map((h) => h.cusip))

    const moves: HoldingMove[] = latestHoldings.map((h) => {
      const prevShares = prevByCusip.get(h.cusip)?.shares ?? 0
      const deltaShares = h.shares - prevShares
      let action: MoveAction
      if (prevShares === 0) action = 'new'
      else if (deltaShares > 0) action = 'added'
      else if (deltaShares < 0) action = 'reduced'
      else action = 'held'
      const deltaPct =
        prevShares > 0 ? (deltaShares / prevShares) * 100 : null
      const price = h.shares > 0 ? h.value / h.shares : 0
      const tradeValue = deltaShares * price
      return { ...h, prevShares, deltaShares, deltaPct, action, tradeValue }
    })

    // Positions present last quarter but gone now = exited (sold out).
    const exits: HoldingMove[] = prevHoldings
      .filter((p) => !latestCusips.has(p.cusip))
      .map((p) => ({
        ...p,
        shares: 0,
        value: 0,
        prevShares: p.shares,
        deltaShares: -p.shares,
        deltaPct: -100,
        action: 'exited' as const,
        tradeValue: -p.value,
      }))

    const totalValue = latestHoldings.reduce((s, h) => s + h.value, 0)

    const topHoldings = moves
      .slice()
      .sort((a, b) => b.value - a.value)
      .slice(0, 12)

    // Notable = new buys + exits + biggest adds/cuts, ranked by current value
    // (for buys/holds) or prior value (for exits).
    const notableMoves = [...moves, ...exits]
      .filter((m) => m.action !== 'held')
      .sort((a, b) => {
        const rank = (m: HoldingMove) =>
          m.action === 'exited' ? prevByCusip.get(m.cusip)?.value ?? 0 : m.value
        return rank(b) - rank(a)
      })
      .slice(0, 30)

    return {
      cik: cik10,
      reportDate: latest.reportDate || null,
      filedAt: latest.filingDate || null,
      totalValue,
      holdingsCount: latestHoldings.length,
      topHoldings,
      notableMoves,
    }
  })
}
