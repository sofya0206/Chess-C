"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Chess, Square } from "chess.js"
import { Settings, LogOut, User, ChevronRight, X } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
const supabase = createClient(supabaseUrl, supabaseKey)

type UnifiedThemeKey = keyof typeof UNIFIED_THEMES
type GameResult = { winner: "White" | "Black" | "Draw"; reason: string }
type Screen = "menu" | "game" | "profile"
type GameRecord = {
  id?: string
  result: "win" | "loss" | "draw"
  opponent: "human" | "ai"
  moves_count: number
  duration_seconds: number
  created_at?: string
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]
const SKAK = "https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/{color}{piece}.svg"

const UNIFIED_THEMES = {
  arcticCobalt: {
    name: "Arctic Cobalt",
    boardImageUrl: "/aluminium.png",
    boardColors: { light: "#A3B8CC", dark: "#4C5A66", pageBg: "#EAF4FC", lastLight: "rgba(23,59,240,0.3)", lastDark: "rgba(23,59,240,0.4)", selected: "rgba(23,59,240,0.6)" },
    coachUI: { bg: "#FFFFFF", border: "rgba(60,69,75,0.15)", text: "#1a1916" },
    pieceFilter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
    pieceSetUrl: SKAK,
  },
  amberOak: {
    name: "Amber Oak",
    boardImageUrl: "/wood.png",
    boardColors: { light: "#EBDDCB", dark: "#614332", pageBg: "#FDF5E6", lastLight: "rgba(214,176,57,0.4)", lastDark: "rgba(214,176,57,0.5)", selected: "rgba(214,176,57,0.7)" },
    coachUI: { bg: "#FFFDF7", border: "rgba(97,67,50,0.15)", text: "#3d2b1f" },
    pieceFilter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
    pieceSetUrl: SKAK,
  },
  neonDusk: {
    name: "Neon Dusk",
    boardImageUrl: "",
    boardColors: { light: "#2C3341", dark: "#1D222B", pageBg: "#161920", lastLight: "#3D4452", lastDark: "#2E333C", selected: "rgba(0,240,255,0.4)" },
    coachUI: { bg: "#1D222B", border: "rgba(255,255,255,0.08)", text: "#e5e5e5" },
    pieceFilter: "invert(1) hue-rotate(180deg) brightness(2) drop-shadow(0 0 6px #00F0FF)",
    pieceSetUrl: SKAK,
  },
  softSmoke: {
    name: "Soft Smoke",
    boardImageUrl: "/marble.png",
    boardColors: { light: "#E3C8C8", dark: "#7E8E99", pageBg: "#DFE2E5", lastLight: "rgba(237,121,121,0.4)", lastDark: "rgba(237,121,121,0.5)", selected: "rgba(237,121,121,0.7)" },
    coachUI: { bg: "#FFFFFF", border: "rgba(142,156,165,0.18)", text: "#4a555e" },
    pieceFilter: "opacity(0.85) drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
    pieceSetUrl: SKAK,
  },
} as const

const getPieceUrl = (color: string, piece: string, theme: (typeof UNIFIED_THEMES)[UnifiedThemeKey]) =>
  theme.pieceSetUrl.replace("{color}", color).replace("{piece}", piece)

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

function useLocalStorage<T>(key: string, def: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(def)
  useEffect(() => { try { const s = localStorage.getItem(key); if (s) setValue(JSON.parse(s)) } catch {} }, [key])
  const set = useCallback((v: T) => { setValue(v); try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }, [key])
  return [value, set]
}

export default function ChessPage() {
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([])
  const [profileLoading, setProfileLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const gameRef = useRef(new Chess())
  const [game, setGame] = useState(() => new Chess())
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [legalMoves, setLegalMoves] = useState<Square[]>([])
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [coachMessages, setCoachMessages] = useState(["Welcome. Make your first move and let the game begin."])
  const [whiteTime, setWhiteTime] = useState(600)
  const [blackTime, setBlackTime] = useState(600)
  const [isGameActive, setIsGameActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [screen, setScreen] = useState<Screen>("menu")
  const [currentThemeKey, setCurrentThemeKey] = useLocalStorage<UnifiedThemeKey>("chess_theme_v15", "amberOak")
  const [gameMode, setGameMode] = useState<"pvp" | "pve">("pvp")
  const [isBotThinking, setIsBotThinking] = useState(false)
  const [gameStartTime, setGameStartTime] = useState(0)
  const coachRef = useRef<HTMLDivElement>(null)

  const theme = UNIFIED_THEMES[currentThemeKey] ?? UNIFIED_THEMES.amberOak
  const isDark = currentThemeKey === "neonDusk"
  const tx = theme.coachUI.text
  const bg = theme.coachUI.bg
  const br = theme.coachUI.border

  useEffect(() => {
    setMounted(true)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.body.style.backgroundColor = theme.boardColors.pageBg
    return () => { document.body.style.backgroundColor = "" }
  }, [theme.boardColors.pageBg, mounted])

  useEffect(() => {
    if (coachRef.current) coachRef.current.scrollTop = coachRef.current.scrollHeight
  }, [coachMessages])

  useEffect(() => {
    if (!isGameActive || game.isGameOver() || isPaused) return
    const id = setInterval(() => {
      if (game.turn() === "w") {
        setWhiteTime(p => { if (p <= 1) { setIsGameActive(false); setGameResult({ winner: "Black", reason: "on time" }); return 0 } return p - 1 })
      } else {
        setBlackTime(p => { if (p <= 1) { setIsGameActive(false); setGameResult({ winner: "White", reason: "on time" }); return 0 } return p - 1 })
      }
    }, 1000)
    return () => clearInterval(id)
  }, [isGameActive, game, isPaused])

  useEffect(() => {
    if (screen !== "game" || gameMode !== "pve" || !isGameActive || isPaused || game.isGameOver() || game.turn() !== "b" || isBotThinking) return
    const go = async () => {
      setIsBotThinking(true)
      try {
        const cur = gameRef.current
        const res = await fetch(`https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(cur.fen())}&depth=10`)
        const data = await res.json()
        if (data.success && data.bestmove) {
          const uci = data.bestmove.split(" ")[1]
          if (!uci || uci.length < 4) return
          const from = uci.slice(0, 2) as Square
          const to = uci.slice(2, 4) as Square
          const next = new Chess(cur.fen())
          const mv = next.move({ from, to, promotion: uci[4] ?? "q" })
          if (mv) {
            gameRef.current = next; setGame(next)
            setMoveHistory(next.history()); setLastMove({ from, to })
            addCoach("Stockfish: " + mv.san)
            if (next.isCheckmate()) endGame({ winner: "White", reason: "checkmate" }, next.history().length)
            else if (next.isDraw() || next.isStalemate()) endGame({ winner: "Draw", reason: "draw" }, next.history().length)
          }
        }
      } catch {}
      setIsBotThinking(false)
    }
    const t = setTimeout(go, 800)
    return () => clearTimeout(t)
  }, [game, gameMode, screen, isGameActive, isPaused, isBotThinking])

  const endGame = useCallback(async (result: GameResult, movesCount: number) => {
    setGameResult(result); setIsGameActive(false)
    if (!user) return
    const duration = Math.floor((Date.now() - gameStartTime) / 1000)
    const dbResult: "win" | "loss" | "draw" = result.winner === "Draw" ? "draw" : result.winner === "White" ? "win" : "loss"
    await supabase.from("game_history").insert({
      user_id: user.id, result: dbResult,
      opponent: gameMode === "pve" ? "ai" : "human",
      moves_count: movesCount, duration_seconds: Math.max(duration, 0),
    })
  }, [user, gameStartTime, gameMode])

  const loadProfile = useCallback(async () => {
    if (!user) return
    setProfileLoading(true)
    const { data } = await supabase.from("game_history").select("*").order("created_at", { ascending: false }).limit(20)
    setGameHistory(data ?? [])
    setProfileLoading(false)
  }, [user])

  useEffect(() => { if (screen === "profile") loadProfile() }, [screen, loadProfile])

const signInGitHub = () => {
  window.location.href = "https://gcwqeofcdyfhxvtrymzo.supabase.co/auth/v1/authorize?provider=github&redirect_to=https://chess-c-rho.vercel.app/auth/callback"
}
const signInGoogle = () => {
  window.location.href = "https://gcwqeofcdyfhxvtrymzo.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://chess-c-rho.vercel.app/auth/callback"
}
  const signOut = async () => { await supabase.auth.signOut(); setUser(null) }

  const addCoach = useCallback((msg: string) => setCoachMessages(p => [...p, msg]), [])

  const handleAskAI = async () => {
    if (game.history().length === 0) { addCoach("Make a move first."); return }
    addCoach("Analyzing...")
    try {
      const res = await fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ history: game.history() }) })
      const data = await res.json()
      setCoachMessages(p => { const n = [...p]; n[n.length - 1] = "— " + data.comment.replace(/\*/g, ""); return n })
    } catch { addCoach("AI Coach unavailable.") }
  }

  const resetGame = useCallback(() => {
    const fresh = new Chess(); gameRef.current = fresh; setGame(fresh)
    setSelectedSquare(null); setLegalMoves([]); setMoveHistory([])
    setCoachMessages(["Welcome. Make your first move and let the game begin."])
    setWhiteTime(600); setBlackTime(600); setIsGameActive(false)
    setIsPaused(false); setLastMove(null); setGameResult(null); setIsBotThinking(false)
    setGameStartTime(Date.now())
  }, [])

  const handleSquareClick = useCallback((square: Square) => {
    if (game.isGameOver() || isPaused || (gameMode === "pve" && game.turn() === "b") || isBotThinking) return
    const piece = game.get(square)
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square)
      setLegalMoves(game.moves({ square, verbose: true }).map(m => m.to as Square))
      return
    }
    if (selectedSquare && legalMoves.includes(square)) {
      try {
        const next = new Chess(game.fen())
        const mv = next.move({ from: selectedSquare, to: square, promotion: "q" })
        if (mv) {
          if (!isGameActive) { setIsGameActive(true); setGameStartTime(Date.now()) }
          setLastMove({ from: selectedSquare, to: square })
          setMoveHistory(next.history())
          addCoach(`${mv.san}${next.isCheck() ? " — Check!" : ""}`)
          if (next.isCheckmate()) endGame({ winner: next.turn() === "w" ? "Black" : "White", reason: "checkmate" }, next.history().length)
          else if (next.isStalemate()) endGame({ winner: "Draw", reason: "stalemate" }, next.history().length)
          else if (next.isDraw()) endGame({ winner: "Draw", reason: "draw" }, next.history().length)
          gameRef.current = next; setGame(next)
        }
      } catch {}
    }
    setSelectedSquare(null); setLegalMoves([])
  }, [game, selectedSquare, legalMoves, isGameActive, isPaused, gameMode, isBotThinking, addCoach, endGame])

  const sqStyle = (file: string, rank: string, sq: Square): React.CSSProperties => {
    const isL = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
    let hi = ""
    if (selectedSquare === sq) hi = theme.boardColors.selected
    if (lastMove && (lastMove.from === sq || lastMove.to === sq)) hi = isL ? theme.boardColors.lastLight : theme.boardColors.lastDark
    if (theme.boardImageUrl) return { backgroundImage: hi ? `linear-gradient(${hi},${hi}),url("${theme.boardImageUrl}")` : `url("${theme.boardImageUrl}")`, backgroundSize: "100% 200%", backgroundPosition: isL ? "top" : "bottom", transition: "all .2s" }
    return { backgroundColor: hi || (isL ? theme.boardColors.light : theme.boardColors.dark), transition: "background-color .2s" }
  }

  const stats = {
    total: gameHistory.length,
    wins: gameHistory.filter(g => g.result === "win").length,
    losses: gameHistory.filter(g => g.result === "loss").length,
  }
  const winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0
  const isWA = game.turn() === "w" && isGameActive && !isPaused
  const isBA = game.turn() === "b" && isGameActive && !isPaused

  if (!mounted) return <div style={{minHeight:"100vh",background:"#FDF5E6"}}/>

  const FONTS = "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Mono:wght@300;400&family=DM+Serif+Display:ital@0;1&display=swap"

  const BASE = `
    @import url('${FONTS}');
    *{box-sizing:border-box;margin:0;padding:0;}
    .fm{font-family:'DM Mono',monospace;}
    .fs{font-family:'DM Serif Display',serif;}
    .fb{font-family:'EB Garamond',serif;}
  `

  if (screen === "menu") return (
    <>
      <style>{BASE + `
        .root{min-height:100vh;background:${theme.boardColors.pageBg};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;color:${tx};}
        .mbtn{display:block;width:100%;max-width:260px;font-family:'DM Mono',monospace;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;background:none;border:1px solid ${tx}28;color:${tx};padding:.85rem 1.5rem;border-radius:3px;cursor:pointer;transition:all .2s;text-align:center;}
        .mbtn:hover{border-color:${tx}60;background:${tx}06;}
        .mbtn.hi{border-color:${tx}50;}
        .abtn{display:flex;align-items:center;justify-content:center;gap:.5rem;width:100%;font-family:'DM Mono',monospace;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;background:none;border:1px solid ${tx}1e;color:${tx}70;padding:.65rem 1rem;border-radius:3px;cursor:pointer;transition:all .2s;margin-bottom:.45rem;}
        .abtn:hover{border-color:${tx}48;color:${tx};}
        .ucard{display:flex;align-items:center;gap:.75rem;padding:.85rem 1rem;border:1px solid ${tx}18;border-radius:3px;cursor:pointer;transition:all .2s;width:100%;}
        .ucard:hover{border-color:${tx}42;}
        .ov{position:fixed;inset:0;z-index:100;background:rgba(26,25,22,.3);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;}
        .mod{background:${theme.boardColors.pageBg};border:1px solid ${br};width:360px;max-width:92vw;border-radius:6px;overflow:hidden;}
        .mod-hd{padding:1.1rem 1.4rem;border-bottom:1px solid ${br};display:flex;justify-content:space-between;align-items:center;}
        .topt{padding:.9rem 1.4rem;cursor:pointer;border-bottom:1px solid ${br};display:flex;align-items:center;gap:.75rem;transition:background .15s;}
        .topt:last-child{border-bottom:none;}
        .topt:hover{background:${tx}06;}
      `}</style>
      <div className="root">
        <p className="fm" style={{fontSize:".58rem",letterSpacing:".4em",textTransform:"uppercase",opacity:.32,marginBottom:".5rem"}}>welcome to</p>
        <h1 className="fs" style={{fontSize:"clamp(3.5rem,12vw,6rem)",fontStyle:"italic",lineHeight:1,color:tx}}>Chess</h1>
        <p className="fb" style={{fontSize:"1rem",fontStyle:"italic",opacity:.38,marginTop:".4rem",marginBottom:"3rem"}}>choose your game</p>
        <div style={{display:"flex",flexDirection:"column",gap:".6rem",alignItems:"center",width:"100%"}}>
          <button className="mbtn hi" onClick={()=>{setGameMode("pvp");resetGame();setScreen("game")}}>Play with Friend</button>
          <button className="mbtn hi" onClick={()=>{setGameMode("pve");resetGame();setScreen("game")}}>Play with AI</button>
          <button className="mbtn" onClick={()=>setSettingsOpen(true)}>Settings</button>
        </div>
        <div style={{display:"flex",gap:"8px",marginTop:"2.5rem"}}>
          {(Object.keys(UNIFIED_THEMES) as UnifiedThemeKey[]).map(k=>(
            <span key={k} onClick={()=>setCurrentThemeKey(k)} style={{width:13,height:13,borderRadius:"50%",background:UNIFIED_THEMES[k].boardColors.dark,border:`2px solid ${currentThemeKey===k?tx:"transparent"}`,cursor:"pointer",display:"inline-block"}}/>
          ))}
        </div>
        <div style={{marginTop:"3rem",width:"100%",maxWidth:"260px"}}>
          <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1rem"}}>
            <div style={{flex:1,height:"1px",background:`${tx}14`}}/>
            <span className="fm" style={{fontSize:".56rem",letterSpacing:".2em",textTransform:"uppercase",opacity:.32}}>
              {authLoading?"...":user?"account":"sign in"}
            </span>
            <div style={{flex:1,height:"1px",background:`${tx}14`}}/>
          </div>
          {authLoading ? (
            <div style={{textAlign:"center",opacity:.3,fontFamily:"'DM Mono',monospace",fontSize:".65rem"}}>loading...</div>
          ) : user ? (
            <>
              <div className="ucard" onClick={()=>setScreen("profile")}>
                <div style={{width:28,height:28,borderRadius:"50%",background:`${tx}10`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0}}>
                  {user.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <User size={14} style={{opacity:.45}}/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="fm" style={{fontSize:".68rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {user.user_metadata?.full_name||user.user_metadata?.user_name||user.email?.split("@")[0]}
                  </div>
                  <div className="fm" style={{fontSize:".54rem",opacity:.32,marginTop:".15rem"}}>View profile →</div>
                </div>
                <ChevronRight size={14} style={{opacity:.22}}/>
              </div>
              <button className="abtn" style={{marginTop:".4rem"}} onClick={signOut}><LogOut size={12}/> Sign out</button>
            </>
          ) : (
            <>
              <button className="abtn" onClick={signInGitHub}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                Continue with GitHub
              </button>
              <button className="abtn" onClick={signInGoogle}>
                <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>
            </>
          )}
        </div>
      </div>
      {settingsOpen && (
        <div className="ov" onClick={()=>setSettingsOpen(false)}>
          <div className="mod" onClick={e=>e.stopPropagation()} style={{color:tx}}>
            <div className="mod-hd">
              <span className="fm" style={{fontSize:".72rem",letterSpacing:".18em",textTransform:"uppercase",opacity:.5}}>Theme Gallery</span>
              <button onClick={()=>setSettingsOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:tx,opacity:.38,display:"flex"}}><X size={16}/></button>
            </div>
            {(Object.keys(UNIFIED_THEMES) as UnifiedThemeKey[]).map(key=>(
              <div key={key} className="topt" onClick={()=>{setCurrentThemeKey(key);setSettingsOpen(false)}}>
                <span style={{width:9,height:9,borderRadius:"50%",background:currentThemeKey===key?tx:"transparent",border:`1px solid ${tx}50`,display:"inline-block",flexShrink:0}}/>
                <span className="fm" style={{fontSize:".72rem",letterSpacing:".1em",textTransform:"uppercase"}}>{UNIFIED_THEMES[key].name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )

  if (screen === "profile") return (
    <>
      <style>{BASE + `
        .pr{min-height:100vh;background:${theme.boardColors.pageBg};color:${tx};padding:2rem 1rem;}
        .pr-in{max-width:500px;margin:0 auto;}
        .back{font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.15em;text-transform:uppercase;background:none;border:none;color:${tx}50;cursor:pointer;padding:0;margin-bottom:2.5rem;transition:color .2s;}
        .back:hover{color:${tx};}
        .sg{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;border:1px solid ${tx}12;border-radius:4px;overflow:hidden;margin-bottom:1.5rem;}
        .sc{padding:1.2rem .5rem;text-align:center;background:${bg};}
        .pbox{background:${bg};border:1px solid ${br};border-radius:4px;overflow:hidden;margin-bottom:1.5rem;}
        .gr{display:flex;align-items:center;gap:.75rem;padding:.8rem 1rem;border-bottom:1px solid ${tx}08;}
        .gr:last-child{border-bottom:none;}
        .sob{display:flex;align-items:center;gap:.5rem;font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;background:none;border:1px solid ${tx}18;color:${tx}50;padding:.65rem 1rem;border-radius:3px;cursor:pointer;transition:all .2s;}
        .sob:hover{border-color:${tx}40;color:${tx};}
      `}</style>
      <div className="pr">
        <div className="pr-in">
          <button className="back" onClick={()=>setScreen("menu")}>← Back to menu</button>
          <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"2.5rem"}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:`${tx}10`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",border:`1px solid ${tx}14`,flexShrink:0}}>
              {user?.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <User size={22} style={{opacity:.32}}/>}
            </div>
            <div>
              <div className="fs" style={{fontSize:"1.5rem",fontStyle:"italic"}}>{user?.user_metadata?.full_name||user?.user_metadata?.user_name||user?.email?.split("@")[0]||"Player"}</div>
              <div className="fm" style={{fontSize:".6rem",opacity:.32,marginTop:".2rem",textTransform:"uppercase"}}>{user?.email}</div>
            </div>
          </div>
          <p className="fm" style={{fontSize:".6rem",letterSpacing:".2em",textTransform:"uppercase",opacity:.35,marginBottom:".75rem"}}>Statistics</p>
          <div className="sg">
            {([["Games",stats.total],["Wins",stats.wins],["Losses",stats.losses],["Win rate",`${winRate}%`]] as [string,any][]).map(([lbl,val])=>(
              <div key={lbl} className="sc">
                <div className="fs" style={{fontSize:"1.8rem",fontStyle:"italic",lineHeight:1,color:tx}}>{val}</div>
                <div className="fm" style={{fontSize:".5rem",letterSpacing:".16em",textTransform:"uppercase",opacity:.35,marginTop:".3rem"}}>{lbl}</div>
              </div>
            ))}
          </div>
          <p className="fm" style={{fontSize:".6rem",letterSpacing:".2em",textTransform:"uppercase",opacity:.35,marginBottom:".75rem"}}>Recent games</p>
          <div className="pbox">
            {profileLoading ? <div style={{padding:"2rem",textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:".65rem",opacity:.32}}>loading...</div>
            : gameHistory.length===0 ? <div style={{padding:"2rem",textAlign:"center",fontFamily:"'EB Garamond',serif",fontStyle:"italic",opacity:.35}}>No games yet. Play your first!</div>
            : gameHistory.map((g,i)=>(
              <div key={g.id||i} className="gr">
                <div style={{width:6,height:6,borderRadius:"50%",flexShrink:0,background:g.result==="win"?"#4ade80":g.result==="loss"?"#f87171":`${tx}32`}}/>
                <div style={{flex:1}}>
                  <div className="fm" style={{fontSize:".68rem",textTransform:"capitalize"}}>{g.result} vs {g.opponent==="ai"?"Stockfish AI":"Human"}</div>
                  <div className="fm" style={{fontSize:".54rem",opacity:.32,marginTop:".2rem"}}>{g.moves_count} moves · {fmt(g.duration_seconds)}{g.created_at&&` · ${new Date(g.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}`}</div>
                </div>
                <span className="fm" style={{fontSize:".6rem",opacity:.25,textTransform:"uppercase"}}>{g.result==="win"?"W":g.result==="loss"?"L":"D"}</span>
              </div>
            ))}
          </div>
          <button className="sob" onClick={signOut}><LogOut size={13}/> Sign out</button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{BASE + `
        .gw{min-height:100vh;background:${theme.boardColors.pageBg};padding:1.5rem 1rem;}
        .gl{display:flex;flex-direction:row;align-items:flex-start;gap:2rem;width:100%;max-width:980px;margin:0 auto;}
        .bc{flex:0 0 auto;width:min(560px,calc(100vw - 360px));min-width:280px;}
        .pc{flex:0 0 280px;width:280px;display:flex;flex-direction:column;gap:.65rem;padding-top:2.5rem;}
        @media(max-width:720px){.gl{flex-direction:column;align-items:center;}.bc{width:min(560px,calc(100vw - 2rem));}.pc{flex:none;width:min(560px,calc(100vw - 2rem));padding-top:0;}}
        .bw{position:relative;width:100%;padding-top:100%;}
        .bgrid{position:absolute;inset:0;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);border:1px solid ${tx}14;box-shadow:0 12px 40px -8px rgba(0,0,0,.16);}
        .sq{position:relative;display:flex;align-items:center;justify-content:center;border:none;padding:0;cursor:pointer;width:100%;height:100%;}
        .dot{position:absolute;width:26%;height:26%;border-radius:50%;background:${isDark?"rgba(255,255,255,.3)":"rgba(0,0,0,.24)"};pointer-events:none;z-index:3;}
        .ring{position:absolute;inset:0;border:3px solid ${theme.boardColors.selected};pointer-events:none;z-index:3;}
        .coord{position:absolute;font-size:10px;font-family:'DM Mono',monospace;z-index:1;pointer-events:none;opacity:.58;}
        .prow{display:flex;justify-content:space-between;align-items:center;padding:.5rem .1rem;}
        .card{background:${bg};border:1px solid ${br};border-radius:4px;overflow:hidden;}
        .chd{display:flex;justify-content:space-between;align-items:center;padding:.65rem .9rem;border-bottom:1px solid ${br};}
        .lbl{font-family:'DM Mono',monospace;font-size:.58rem;letter-spacing:.2em;text-transform:uppercase;opacity:.38;}
        .cscroll{padding:.65rem .9rem;max-height:115px;overflow-y:auto;}
        .mwrap{padding:.5rem .9rem .65rem;max-height:80px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:.15rem .3rem;}
        .arow{display:flex;gap:.45rem;}
        .abtn2{flex:1;font-family:'DM Mono',monospace;font-size:.58rem;letter-spacing:.12em;text-transform:uppercase;background:none;border:1px solid ${tx}1e;color:${tx};padding:.58rem .4rem;border-radius:3px;cursor:pointer;transition:all .2s;}
        .abtn2:hover{border-color:${tx}48;background:${tx}06;}
        .blay{position:fixed;inset:0;z-index:200;background:${isDark?"rgba(0,0,0,.75)":"rgba(26,25,22,.35)"};backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;}
        .rmod{background:${theme.boardColors.pageBg};border:1px solid ${br};padding:2.5rem 2rem;border-radius:6px;text-align:center;width:290px;max-width:90vw;}
        .pmod{background:${theme.boardColors.pageBg};border:1px solid ${br};padding:1.75rem;border-radius:6px;width:250px;max-width:90vw;display:flex;flex-direction:column;gap:.55rem;align-items:center;}
        .pbtn{width:100%;font-family:'DM Mono',monospace;font-size:.68rem;letter-spacing:.15em;text-transform:uppercase;background:none;border:1px solid ${tx}22;color:${tx};padding:.78rem;border-radius:3px;cursor:pointer;transition:all .2s;}
        .pbtn:hover{border-color:${tx}52;background:${tx}06;}
      `}</style>
      <div className="gw">
        <div className="gl">
          <div className="bc">
            <div className="prow">
              <span className="fm" style={{fontSize:".68rem",letterSpacing:".1em",textTransform:"uppercase",opacity:isBA?1:.42,display:"flex",alignItems:"center",gap:".4rem"}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:"#2d2d2d",border:`1.5px solid ${tx}38`,display:"inline-block"}}/>
                Black {isBotThinking&&gameMode==="pve"&&<span style={{opacity:.38,fontSize:".54rem"}}>(thinking)</span>}
              </span>
              <span className="fm" style={{fontSize:"1rem",opacity:isBA?1:.32}}>{fmt(blackTime)}</span>
            </div>
            <div className="bw">
              <div className="bgrid">
                {RANKS.map(rank=>FILES.map(file=>{
                  const sq=`${file}${rank}` as Square
                  const piece=game.get(sq)
                  const isL=(FILES.indexOf(file)+RANKS.indexOf(rank))%2===0
                  const url=piece?getPieceUrl(piece.color,piece.type,theme):null
                  return (
                    <button key={sq} className="sq" onClick={()=>handleSquareClick(sq)} style={sqStyle(file,rank,sq)} disabled={isBotThinking}>
                      {url&&<img src={url} alt="" style={{width:"84%",height:"84%",zIndex:2,filter:theme.pieceFilter}}/>}
                      {legalMoves.includes(sq)&&(piece?<span className="ring"/>:<span className="dot"/>)}
                      {file==="a"&&<span className="coord" style={{top:3,left:4,color:isL?theme.boardColors.dark:theme.boardColors.light}}>{rank}</span>}
                      {rank==="1"&&<span className="coord" style={{bottom:3,right:4,color:isL?theme.boardColors.dark:theme.boardColors.light}}>{file}</span>}
                    </button>
                  )
                }))}
              </div>
            </div>
            <div className="prow">
              <span className="fm" style={{fontSize:".68rem",letterSpacing:".1em",textTransform:"uppercase",opacity:isWA?1:.42,display:"flex",alignItems:"center",gap:".4rem"}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:"#f5f0e8",border:`1.5px solid ${tx}25`,display:"inline-block"}}/>
                White
              </span>
              <span className="fm" style={{fontSize:"1rem",opacity:isWA?1:.32}}>{fmt(whiteTime)}</span>
            </div>
          </div>
          <div className="pc">
            <div className="card">
              <div className="chd">
                <span className="lbl">Status</span>
                <button onClick={()=>{setIsPaused(true);setSettingsOpen(true)}} style={{background:"none",border:"none",cursor:"pointer",color:tx,opacity:.35,display:"flex",padding:0}}>
                  <Settings size={14}/>
                </button>
              </div>
              <div className="fs" style={{fontSize:"1rem",fontStyle:"italic",padding:".65rem .9rem",lineHeight:1.4,color:tx}}>
                {game.isCheckmate()?`${game.turn()==="w"?"Black":"White"} wins.`:game.isDraw()?"Drawn.":game.isCheck()?`${game.turn()==="w"?"White":"Black"} in check.`:`${game.turn()==="w"?"White":"Black"} to move`}
              </div>
            </div>
            <div className="card">
              <div className="chd">
                <span className="lbl">AI Coach</span>
                <button onClick={handleAskAI} style={{fontFamily:"'DM Mono',monospace",fontSize:".55rem",letterSpacing:".1em",textTransform:"uppercase",padding:".22rem .5rem",border:`1px solid ${tx}28`,background:"transparent",color:tx,borderRadius:"3px",cursor:"pointer"}}>Ask</button>
              </div>
              <div className="cscroll" ref={coachRef}>
                {coachMessages.map((msg,i)=>(
                  <p key={i} className="fb" style={{fontSize:".88rem",fontStyle:"italic",lineHeight:1.45,marginBottom:".3rem",color:i===coachMessages.length-1?tx:`${tx}42`}}>{msg}</p>
                ))}
              </div>
            </div>
            {moveHistory.length>0&&(
              <div className="card">
                <div className="chd">
                  <span className="lbl">Moves</span>
                  <span className="fm" style={{fontSize:".55rem",opacity:.3}}>{moveHistory.length}</span>
                </div>
                <div className="mwrap">
                  {moveHistory.map((m,i)=>(
                    <span key={i} className="fm" style={{fontSize:".58rem",opacity:i===moveHistory.length-1?1:.42}}>
                      {i%2===0&&<span style={{opacity:.25}}>{Math.floor(i/2)+1}.</span>}{m}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="arow">
              <button className="abtn2" onClick={()=>{setIsPaused(true);setSettingsOpen(true)}}>Pause</button>
              <button className="abtn2" onClick={resetGame}>New</button>
              {user&&<button className="abtn2" onClick={()=>setScreen("profile")}><User size={11}/></button>}
            </div>
          </div>
        </div>
        {gameResult&&(
          <div className="blay">
            <div className="rmod" style={{color:tx}}>
              <p className="fm" style={{fontSize:".58rem",letterSpacing:".25em",textTransform:"uppercase",opacity:.32,marginBottom:".5rem"}}>Game over</p>
              <p className="fs" style={{fontSize:"1.8rem",fontStyle:"italic",lineHeight:1.1,marginBottom:".3rem"}}>{gameResult.winner==="Draw"?"A draw.":`${gameResult.winner} wins.`}</p>
              <p className="fb" style={{fontStyle:"italic",opacity:.38,marginBottom:"2rem"}}>by {gameResult.reason}</p>
              <div style={{display:"flex",flexDirection:"column",gap:".5rem"}}>
                <button className="pbtn" onClick={resetGame}>Play again</button>
                <button className="pbtn" onClick={()=>{resetGame();setScreen("menu")}}>Back to menu</button>
                {user&&<button className="pbtn" onClick={()=>setScreen("profile")}>View profile</button>}
              </div>
            </div>
          </div>
        )}
        {settingsOpen&&(
          <div className="blay" onClick={()=>{setIsPaused(false);setSettingsOpen(false)}}>
            <div className="pmod" onClick={e=>e.stopPropagation()} style={{color:tx}}>
              <p className="fm" style={{fontSize:".6rem",letterSpacing:".2em",textTransform:"uppercase",opacity:.32,marginBottom:".4rem",alignSelf:"flex-start"}}>Paused</p>
              <button className="pbtn" onClick={()=>{setIsPaused(false);setSettingsOpen(false)}}>Resume</button>
              <button className="pbtn" onClick={()=>{resetGame();setIsPaused(false);setSettingsOpen(false)}}>Restart</button>
              <button className="pbtn" onClick={()=>{resetGame();setIsPaused(false);setSettingsOpen(false);setScreen("menu")}}>Exit to menu</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
