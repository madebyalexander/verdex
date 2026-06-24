// Minimal RFC 4180 CSV builder. No deps, server-only helper.

function csvCell(value: unknown): string {
  if (value == null) return ''
  let s = typeof value === 'string' ? value : String(value)
  // Formula-injection guard: a text cell beginning with = + - @ (or tab/CR) is
  // interpreted as a formula by Excel / Google Sheets and can exfiltrate data or
  // run commands when the file is opened. Stock names/sectors come from an
  // external API, so prefix a single quote to force literal-text interpretation.
  // Only applied to string-origin cells so genuine numeric columns keep their type.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`
  }
  // Quote if contains comma, quote, newline, or carriage return
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
}

export function csvResponseHeaders(filename: string): HeadersInit {
  return {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'private, no-store',
  }
}
