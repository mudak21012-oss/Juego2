// /src/utils/hash.ts
export async function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', enc)
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')
}
export function tz(): string { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' } }
export async function fingerprint(): Promise<string> {
  const ua = navigator.userAgent
  const t = tz()
  // canvas fingerprint (simple)
  const c = document.createElement('canvas')
  c.width = 200; c.height = 50
  const g = c.getContext('2d')!
  g.textBaseline = 'top'
  g.font = "16px 'JetBrains Mono'"
  g.fillText(ua.slice(0,64), 2, 2)
  g.fillStyle = '#09f'
  g.fillRect(40, 20, 80, 10)
  const data = c.toDataURL()
  return sha256Hex([ua, t, data].join('|'))
}
export function nowS(){ return Math.floor(performance.now()/1000) }
