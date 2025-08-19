// /src/game/levels.ts
import { rngFromSeed } from '@/utils/rng'

export type Cell = 0 | 1 | 2 | 3
// 0 empty, 1 target-to-print, 2 obstacle (support/wall), 3 cooling zone (needs wait)

export type LevelSpec = {
  id: number
  width: number
  height: number
  grid: Cell[]
  start: { x: number, y: number }
  filamentLimit: number
  timeLimitS: number
  coolingPenaltyS: number
  stringingPenalty: number
  name: string
}

export const LEVELS: LevelSpec[] = [
  simple(1, 8, 8, 60, 45, 2, 5, 'Capa inicial'),
  simple(2,10,10,70, 45, 2, 5, 'Zig-Zag de prueba'),
  simple(3,10,10,68, 40, 3, 8, 'Puentes cortos'),
  simple(4,12,12,80, 40, 3,10, 'Soportes activos'),
  simple(5,12,12,78, 35, 4,12, 'Malla con barreras'),
  simple(6,14,12,88, 35, 4,14, 'Doble retorno'),
  simple(7,14,14,95, 30, 5,16, 'Cámara tibia'),
  simple(8,14,14,90, 28, 6,18, 'Test de overhang'),
  simple(9,16,14,105,26, 6,20, 'Densidad fina'),
  simple(10,16,16,110,24, 7,22,'Vibraciones'),
  simple(11,16,16,115,22, 7,24,'Trazos largos'),
  simple(12,18,16,125,20, 8,26,'Cierre de capa'),
]

// Helper para generar plantillas base
function simple(
  id:number, w:number, h:number, filament:number, timeS:number,
  cool:number, stringing:number, name:string
): LevelSpec {
  // base: cruz de targets + paredes dispersas
  const grid: Cell[] = new Array(w*h).fill(0)
  for (let x=1;x<w-1;x++) grid[idx(x, Math.floor(h/2), w)] = 1
  for (let y=1;y<h-1;y++) grid[idx(Math.floor(w/2), y, w)] = 1
  // algunos obstáculos
  for (let y=2;y<h-2;y+=3) grid[idx(2, y, w)] = 2
  for (let x=3;x<w-3;x+=4) grid[idx(x, 3, w)] = 2
  // zonas de cooling
  for (let i=0;i<Math.floor((w*h)/40);i++) {
    const x = 1 + (i*3) % (w-2), y = 1 + (i*5) % (h-2)
    grid[idx(x, y, w)] = 3
  }
  return {
    id, width:w, height:h, grid,
    start: { x: 1, y: 1 },
    filamentLimit: filament,
    timeLimitS: timeS,
    coolingPenaltyS: cool,
    stringingPenalty: stringing,
    name
  }
}
export function idx(x:number,y:number,w:number){return y*w+x}

export function generateDailyLevel(date=new Date()): LevelSpec {
  const d = `${date.getUTCFullYear()}-${date.getUTCMonth()+1}-${date.getUTCDate()}`
  const seed = `daily-${d}`
  const rng = rngFromSeed(seed)
  const base = LEVELS[Math.floor(rng()*Math.min(LEVELS.length,8))]
  // mutate
  const mutGrid = [...base.grid]
  for (let i=0;i<mutGrid.length;i++){
    if (rng()<0.06 && mutGrid[i]===0) mutGrid[i]=1
    else if (rng()<0.03 && mutGrid[i]===1) mutGrid[i]=3
  }
  return { ...base, id: 1000, name:`Diaria ${d}`, grid: mutGrid }
}
