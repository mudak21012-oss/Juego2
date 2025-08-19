// /src/ui/App.tsx
import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPhaserGame } from '@/game/GameConfig'
import { useGame, usePlayer, useUI } from '@/state/store'
import { LEVELS, generateDailyLevel } from '@/game/levels'
import { api } from '@/services/api'
import { ensurePlayer } from '@/services/player'
import { fingerprint } from '@/utils/hash'

export function App(){
  const containerRef = useRef<HTMLDivElement>(null)
  const [gameInstance, setGameInstance] = useState<any>(null)
  const { level, setLevel, seed, setSeed, setStart } = useGame()
  const { player, setPlayer } = usePlayer()
  const { showMenu, setShowMenu, toast, setToast, showWin, setShowWin } = useUI()

  useEffect(()=>{ (async()=>{
    // bootstrap player (localStorage)
    const p = await ensurePlayer()
    setPlayer(p)
    // seed diaria por defecto
    if (!seed) setSeed(new Date().toISOString().slice(0,10))
  })() }, [])

  useEffect(()=>{
    if (!containerRef.current) return
    const width = Math.min(960, window.innerWidth)
    const height = Math.min(640, window.innerHeight - 120)
    const game = createPhaserGame(containerRef.current, { width, height })
    setGameInstance(game)
    setStart(performance.now())
    const scene = game.scene.getScene('LevelScene')
    scene.events.on('level:complete', async ({score, duration_s, errors, win}: any)=>{
      // rating y premio
      const qualifies = await handleSubmit(score, duration_s, win)
      setToast({ msg: win ? `Nivel ${level} ${qualifies?'— ¡Calificaste!':'completado'}` : 'Sin completar', type: win?'success':'info' })
      setShowWin(true)
    })
    return ()=>{ game.destroy(true) }
  }, [seed, level])

  async function handleSubmit(score:number, duration_s:number, win:boolean){
    try {
      const fp = await fingerprint()
      const challenge = await api.getChallenge()
      const res = await api.submitScore({
        player_id: player!.player_id,
        score, level, duration: duration_s, seed: seed || 'n/a',
        nonce: challenge.nonce, fingerprint: fp, result: win?'win':'loss'
      })
      if (res.valid && res.qualifies) {
        const claim = await api.claimCoupon({ player_id: player!.player_id })
        if (claim.ok) setToast({ msg: `Cupón: ${claim.code} (-${claim.discount_pct}%)`, type: 'success' })
        else setToast({ msg: 'No hay cupones disponibles.', type: 'error' })
      }
      return !!res.qualifies
    } catch (e) {
      setToast({ msg: 'Error al enviar resultado', type: 'error' })
      return false
    }
  }

  function startLevel(n:number){
    setLevel(n); setShowMenu(false); setShowWin(false)
  }

  return (
    <div className="h-full w-full">
      <Header />
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div ref={containerRef} className="relative border border-neutral-800 rounded-xl overflow-hidden shadow-neon" />
        <HUD />
      </div>

      <AnimatePresence>
        {showMenu && <MainMenu onStart={startLevel} />}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>useUI.getState().setToast(undefined)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showWin && <WinDialog onClose={()=>useUI.getState().setShowWin(false)} />}
      </AnimatePresence>
    </div>
  )
}

function Header(){
  return (
    <div className="sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="text-sm text-neutral-400">Difícil pero justo · Premios reales</div>
        </div>
        <div className="flex items-center gap-2">
          <a className="btn btn-primary" href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
    </div>
  )
}

function Logo(){
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 24 24"><path fill="#22d3ee" d="M3 3h18v4H3zM5 9h14l-2 11H7z"/></svg>
      <div className="font-extrabold tracking-tight">PathPrint</div>
    </div>
  )
}

function HUD(){
  const { level } = useGame()
  return (
    <div className="mx-auto max-w-6xl px-4 mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
      <Stat label="Nivel" value={level} />
      <Stat label="Semilla" value={new Date().toISOString().slice(0,10)} />
      <Stat label="Objetivo" value="Rating S (L8) ≤120s" />
      <Stat label="Éxitos" value="≤10% target" />
    </div>
  )
}

function Stat({label, value}:{label:string, value:any}){
  return (
    <div className="glass rounded-lg p-3">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  )
}

function MainMenu({onStart}:{onStart:(n:number)=>void}){
  return (
    <motion.div className="dialog-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <motion.div className="dialog-panel" initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} exit={{y:20, opacity:0}}>
        <h2 className="text-xl font-bold mb-2">PathPrint — Desafío</h2>
        <p className="text-sm text-neutral-400 mb-4">Planifica una ruta óptima con límites de tiempo y filamento. Penalizaciones por stringing y zonas frías.</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(n=>(
            <button key={n} className="btn" onClick={()=>onStart(n)}>Nivel {n}</button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <button className="btn btn-danger" onClick={()=>location.reload()}>Reiniciar</button>
          <button className="btn btn-primary" onClick={()=>onStart(8)}>Ir a L8 (prueba)</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Toast({msg, type='info', onClose}:{msg:string, type?:'info'|'error'|'success', onClose:()=>void}){
  const color = type==='success' ? 'text-emerald-300' : type==='error' ? 'text-red-300' : 'text-neutral-200'
  useEffect(()=>{
    const t = setTimeout(onClose, 3500)
    return ()=>clearTimeout(t)
  }, [])
  return (
    <motion.div className="toast" initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} exit={{y:20, opacity:0}}>
      <div className={`font-semibold ${color}`}>{msg}</div>
    </motion.div>
  )
}

function WinDialog({onClose}:{onClose:()=>void}){
  return (
    <motion.div className="dialog-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <motion.div className="dialog-panel" initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} exit={{y:20, opacity:0}}>
        <h3 className="text-lg font-bold mb-2">Resultado enviado</h3>
        <p className="text-sm text-neutral-400 mb-4">Si calificaste, verás tu cupón en el toast. Revisa también tu registro en la hoja “plays”.</p>
        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={onClose}>Continuar</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
