// /src/services/player.ts
import { api } from './api'
import { sha256Hex, tz } from '@/utils/hash'

export async function ensurePlayer(){
  const key = 'player_id'
  const ex = localStorage.getItem(key)
  if (ex) return { player_id: ex }
  // registro anónimo opcionalmente con hash de email (si el usuario lo provee en una pantalla futura)
  const nickname = `Guest-${Math.random().toString(36).slice(2,6)}`
  const res = await api.register({ nickname, country: tz() })
  localStorage.setItem(key, res.player_id)
  return { player_id: res.player_id, nickname }
}
