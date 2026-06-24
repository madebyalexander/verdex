/**
 * Read a CSS custom property and return it as an sRGB color string (`#rrggbb`
 * or `rgba(...)`) that any JS color parser can consume.
 *
 * Why this is non-trivial: in modern browsers, both `getComputedStyle(el).color`
 * AND the canvas `fillStyle` getter preserve the original color function — so
 * if a CSS variable is defined as `oklch(0.708 0 0)`, both APIs round-trip it
 * back as the literal `"oklch(0.708 0 0)"` string. Third-party libraries like
 * lightweight-charts use their own color parsers that don't understand
 * `oklch()` and crash.
 *
 * The bulletproof coercion path is: paint the color onto a 1x1 canvas, then
 * read the pixel's RGBA bytes via `getImageData`. The browser rasterizes into
 * sRGB regardless of the source color space.
 */
export function readCssColor(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback

  // Step 1: resolve `var(--foo)` to its current value (may be oklch / oklab /
  // color() / rgb / hex / etc — we don't care, the next step normalizes).
  const probe = document.createElement('span')
  probe.style.color = `var(${name}, ${fallback})`
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const cssVal = getComputedStyle(probe).color
  document.body.removeChild(probe)

  if (!cssVal) return fallback

  // Step 2: paint onto a 1×1 canvas and read the pixel back. Reading via
  // getImageData always returns sRGB bytes, no matter what color space the
  // source was in.
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext('2d')
    if (!ctx) return cssVal
    ctx.fillStyle = cssVal
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    if (a === 255) {
      const hex = (n: number) => n.toString(16).padStart(2, '0')
      return `#${hex(r)}${hex(g)}${hex(b)}`
    }
    return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`
  } catch {
    return cssVal
  }
}
