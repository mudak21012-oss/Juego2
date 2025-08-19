// /src/game/LevelScene.ts
import Phaser from 'phaser'
import { LEVELS, LevelSpec, idx } from './levels'

type PathPoint = { x:number, y:number }

export class LevelScene extends Phaser.Scene {
  levelSpec!: LevelSpec
  gridSize = 28
  path: PathPoint[] = []
  printed: boolean[] = []
  filamentUsed = 0
  errors = 0
  startTime = 0
  completed = false

  constructor(){ super('LevelScene') }

  init(data: { level: number, seed: string }) {
    const lvl = LEVELS.find(l => l.id === data.level) ?? LEVELS[0]
    this.levelSpec = lvl
    this.printed = this.levelSpec.grid.map(c => c !== 1) // cells with 1 need printing
    this.path = [{...this.levelSpec.start}]
    this.filamentUsed = 0
    this.errors = 0
    this.completed = false
  }

  create() {
    this.startTime = this.time.now
    this.cameras.main.setBackgroundColor('#0b0d0f')

    const { width, height } = this.levelSpec
    const g = this.add.graphics()
    g.lineStyle(1, 0x15202b, 1)
    g.fillStyle(0x0f1318, 1)
    g.fillRect(0, 0, width*this.gridSize, height*this.gridSize)

    this.input.on('pointerdown', (p: Phaser.Input.Pointer)=> this.handlePointer(p))
    this.input.on('pointermove', (p: Phaser.Input.Pointer)=> this.handlePointer(p, true))
    this.input.on('pointerup', ()=> this.commitPath())

    this.draw()
  }

  private handlePointer(pointer: Phaser.Input.Pointer, move=false) {
    if (this.completed) return
    const tile = this.pointerToTile(pointer)
    if (!tile) return
    if (!move && this.path.length>0 && tile.x===this.path[this.path.length-1].x && tile.y===this.path[this.path.length-1].y) return
    const last = this.path[this.path.length-1]
    if (!last || this.isAdjacent(last, tile)) {
      if (!this.isBlocked(tile)) {
        // stringing penalty: sharp turns or cross already warm zone
        const last2 = this.path[this.path.length-2]
        if (last2) {
          const d1 = {x:last.x-last2.x, y:last.y-last2.y}
          const d2 = {x:tile.x-last.x, y:tile.y-last.y}
          if (d1.x!==0 && d2.y!==0 || d1.y!==0 && d2.x!==0) this.errors++ // corner change
        }
        this.path.push(tile)
        this.draw()
      }
    }
  }

  private isAdjacent(a: PathPoint, b: PathPoint){ return Math.abs(a.x-b.x) + Math.abs(a.y-b.y) === 1 }
  private pointerToTile(p: Phaser.Input.Pointer){
    const x = Math.floor(p.x/this.gridSize), y = Math.floor(p.y/this.gridSize)
    if (x<0||y<0||x>=this.levelSpec.width||y>=this.levelSpec.height) return null
    return { x, y }
  }
  private isBlocked(t: PathPoint){
    const cell = this.levelSpec.grid[idx(t.x,t.y,this.levelSpec.width)]
    return cell === 2
  }

  private commitPath(){
    // simulate extrusion along path
    const { grid, width, height, coolingPenaltyS, stringingPenalty } = this.levelSpec
    let extraTime = 0
    for (let i=1;i<this.path.length;i++){
      const p = this.path[i]
      const cIndex = idx(p.x,p.y,width)
      const cell = grid[cIndex]
      if (cell===2) { this.errors+=2; continue }
      this.filamentUsed++
      if (cell===3) extraTime += coolingPenaltyS
      if (!this.printed[cIndex]) this.printed[cIndex] = true
      if (i>1 && this.path[i-2]) {
        const prev = this.path[i-1]
        if (prev.x!==p.x && prev.y!==p.y) this.errors++ // diagonal glitch (shouldn't happen)
      }
    }
    // stringing as function of intersections
    const duplicates = new Set<string>()
    let crossings = 0
    for (const p of this.path) {
      const k = `${p.x},${p.y}`
      if (duplicates.has(k)) crossings++
      duplicates.add(k)
    }
    this.errors += crossings * stringingPenalty

    // reset path to last point
    this.path = [this.path[this.path.length-1]]

    this.draw()
    this.checkCompletion(extraTime)
  }

  private checkCompletion(extraTime:number){
    const elapsedS = Math.floor((this.time.now - this.startTime)/1000) + Math.floor(extraTime)
    const timeLeft = Math.max(0, this.levelSpec.timeLimitS - elapsedS)
    const filamentLeft = Math.max(0, this.levelSpec.filamentLimit - this.filamentUsed)
    const remainingTargets = this.printed.filter(v=>!v).length // cells still requiring print
    if (remainingTargets===0 || timeLeft===0 || filamentLeft===0) {
      this.completed = true
      const score = this.computeScore(elapsedS)
      this.events.emit('level:complete', {
        score, duration_s: elapsedS, errors: this.errors,
        win: remainingTargets===0
      })
    }
  }

  private computeScore(elapsedS:number){
    const printedCount = this.printed.filter(v=>v).length
    const base = printedCount*100
    const timeBonus = Math.max(0, (this.levelSpec.timeLimitS - elapsedS)) * 20
    const filamentBonus = Math.max(0, (this.levelSpec.filamentLimit - this.filamentUsed)) * 5
    const penalty = this.errors * 50
    return Math.max(0, base + timeBonus + filamentBonus - penalty)
  }

  private draw(){
    const g = this.add.graphics()
    g.clear()
    const { width, height, grid } = this.levelSpec
    // grid cells
    for (let y=0;y<height;y++){
      for (let x=0;x<width;x++){
        const c = grid[idx(x,y,width)]
        const px = x*this.gridSize, py = y*this.gridSize
        const bg =
          c===0 ? 0x0f1318 :
          c===1 ? 0x111827 :
          c===2 ? 0x1f2937 :
          0x102030
        g.fillStyle(bg, 1); g.fillRect(px, py, this.gridSize-1, this.gridSize-1)
        // printed overlay
        const printed = this.printed[idx(x,y,width)]
        if (printed) { g.fillStyle(0x0ea5e9, 0.25); g.fillRect(px+2, py+2, this.gridSize-5, this.gridSize-5) }
      }
    }
    // path
    g.lineStyle(3, 0x22d3ee, 1)
    for (let i=1;i<this.path.length;i++){
      const a = this.path[i-1], b = this.path[i]
      const ax = a.x*this.gridSize + this.gridSize/2
      const ay = a.y*this.gridSize + this.gridSize/2
      const bx = b.x*this.gridSize + this.gridSize/2
      const by = b.y*this.gridSize + this.gridSize/2
      g.strokeLineShape(new Phaser.Geom.Line(ax, ay, bx, by))
    }
  }
}
