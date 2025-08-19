// /src/services/api.ts  (reemplaza request y export)
const BASE = import.meta.env.VITE_API_BASE_URL

async function request(path: string, init?: RequestInit, tries = 3, backoff = 300): Promise<any> {
  for (let i = 0; i < tries; i++) {
    try {
      const url = `${BASE}?path=${encodeURIComponent(path)}`
      const res = await fetch(url, init)
      if (!res.ok) throw new Error('http_' + res.status)
      return await res.json()
    } catch (e) {
      if (i === tries - 1) throw e
      await new Promise(r => setTimeout(r, backoff * Math.pow(2, i)))
    }
  }
}

export const api = {
  async register(payload: any) {
    return request('register', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
  },
  async getChallenge() {
    // IMPORTANTE: sin headers para evitar preflight
    return request('challenge', { method: 'GET' })
  },
  async submitScore(payload: any) {
    return request('submit', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
  },
  async claimCoupon(payload: any) {
    return request('claim', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
  }
}
