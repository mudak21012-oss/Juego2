// /src/state/store.ts
import { create } from 'zustand'

export type Player = {
  player_id: string
  nickname?: string
  email_hash?: string
  country?: string
}

export type RunResult = {
  level: number
  score: number
  duration_s: number
  errors: number
  seed: string
  result: 'win' | 'loss'
  qualifies?: boolean
  coupon?: { code: string; type: string; discount_pct: number }
}

type UIState = {
  muted: boolean
  setMuted(v: boolean): void
  showMenu: boolean
  setShowMenu(v: boolean): void
  showWin: boolean
  setShowWin(v: boolean): void
  toast?: { msg: string; type?: 'info'|'error'|'success' }
  setToast(t?: UIState['toast']): void
}

type GameState = {
  level: number
  seed: string
  startTs?: number
  setLevel(l: number): void
  setSeed(s: string): void
  setStart(ts: number): void
}

type PlayerState = {
  player?: Player
  setPlayer(p: Player): void
}

export const useUI = create<UIState>((set) => ({
  muted: false, setMuted: (v)=>set({muted:v}),
  showMenu: true, setShowMenu: (v)=>set({showMenu:v}),
  showWin: false, setShowWin: (v)=>set({showWin:v}),
  toast: undefined, setToast: (t)=>set({toast:t})
}))

export const useGame = create<GameState>((set) => ({
  level: 1,
  seed: '',
  setLevel: (l)=>set({level:l}),
  setSeed: (s)=>set({seed:s}),
  setStart: (ts)=>set({startTs: ts})
}))

export const usePlayer = create<PlayerState>((set)=>({
  player: undefined,
  setPlayer: (p)=>set({player: p})
}))
