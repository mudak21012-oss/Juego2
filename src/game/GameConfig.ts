// /src/game/GameConfig.ts
import Phaser from 'phaser'
import { LevelScene } from './LevelScene'

export function createPhaserGame(parent: HTMLElement, opts: {width:number,height:number}) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: opts.width,
    height: opts.height,
    parent,
    backgroundColor: '#0b0d0f',
    physics: { default: 'arcade' },
    scene: [LevelScene],
    render: { pixelArt: true, antialias: false }
  })
}
