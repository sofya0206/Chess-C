"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Chess, Square } from "chess.js"
import { Settings } from "lucide-react"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

const SKAK_PIECES_URL = "https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/{color}{piece}.svg"

const UNIFIED_THEMES = {
  arcticCobalt: {
    name: "The Arctic Cobalt Theme",
    boardImageUrl: "/aluminium.png",
    boardColors: {
      light: "#A3B8CC",
      dark: "#4C5A66",
      pageBg: "#EAF4FC",
      lastLight: "rgba(23,59,240,0.3)",
      lastDark: "rgba(23,59,240,0.4)",
      selected: "rgba(23,59,240,0.6)",
    },
    coachUI: { bg: "#FFFFFF", border: "rgba(60,69,75,0.2)", text: "#1a1916" },
    pieceFilter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
    pieceSetUrl: SKAK_PIECES_URL,
  },
  amberOak: {
    name: "The Amber Oak Theme",
    boardImageUrl: "/wood.png",
    boardColors: {
      light: "#EBDDCB",
      dark: "#614332",
      pageBg: "#FDF5E6",
      lastLight: "rgba(214,176,57,0.4)",
      lastDark: "rgba(214,176,57,0.5)",
      selected: "rgba(214,176,57,0.7)",
    },
    coachUI: { bg: "#FFFFFF", border: "rgba(97,67,50,0.2)", text: "#3d2b1f" },
    pieceFilter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
    pieceSetUrl: SKAK_PIECES_URL,
  },
  neonDusk: {
    name: "The Neon Dusk Theme",
    boardImageUrl: "",
    boardColors: {
      light: "#2C3341",
      dark: "#1D222B",
      pageBg: "#161920",
      lastLight: "#3D4452",
      lastDark: "#2E333C",
      selected: "rgba(0,240,255,0.4)",
    },
    coachUI: { bg: "#1D222B", border: "rgba(255,255,255,0.1)", text: "#e5e5e5" },
    pieceFilter: "invert(1) hue-rotate(180deg) brightness(2) drop-shadow(0 0 6px #00F0FF)",
    pieceSetUrl: SKAK_PIECES_URL,
  },
  softSmoke: {
    name: "The Soft Smoke Theme",
    boardImageUrl: "/marble.png",
    boardColors: {
      light: "#E3C8C8",
      dark: "#7E8E99",
      pageBg: "#DFE2E5",
      lastLight: "rgba(237,121,121,0.4)",
      lastDark: "rgba(237,121,121,0.5)",
      selected: "rgba(237,121,121,0.7)",
    },
    coachUI: { bg: "#FFFFFF", border: "rgba(142,156,165,0.2)", text: "#4a555e" },
    pieceFilter: "opacity(0.85) drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
    pieceSetUrl: SKAK_PIECES_URL,
  },
} as const

type UnifiedThemeKey = keyof typeof UNIFIED_THEMES

const getPieceUrl = (color: string, piece: string, theme: (typeof UNIFIED_THEMES)[UnifiedThemeKey]): string => {
  return theme.pieceSetUrl.replace("{color}", color).replace("{piece}", piece)
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

type GameResult = { winner: "White" | "Black" | "Draw"; reason: string }
type Screen = "menu" | "game"

function useLocalStorage<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(defaultValue)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) setValue(JSON.parse(stored) as T)
    } catch {}
  }, [key])
  const set = useCallback(
    (v: T) => {
      setValue(v)
      try {
        localStorage.setItem(key, JSON.stringify(v))
      } catch {}
    },
    [key]
  )
  return [value, set]
}

export default function ChessPage() {
  const gameRef = useRef(new Chess())
  const [game, setGame] = useState(() => new Chess())
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [legalMoves, setLegalMoves] = useState<Square[]>([])
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [coachMessages, setCoachMessages] = useState<string[]>([
    "Welcome. Make your first move and let the game begin.",
  ])
  const [whiteTime, setWhiteTime] = useState(600)
  const [blackTime, setBlackTime] = useState(600)
  const [isGameActive, setIsGameActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [screen, setScreen] = useState<Screen>("menu")
  const [currentThemeKey, setCurrentThemeKey] = useLocalStorage<UnifiedThemeKey>(
    "chess_premium_theme_v11",
    "amberOak"
  )
  const [gameMode, setGameMode] = useState<"pvp" | "pve">("pvp")
  const [isBotThinking, setIsBotThinking] = useState(false)
  const coachRef = useRef<HTMLDivElement>(null)

  const theme = UNIFIED_THEMES[currentThemeKey] || UNIFIED_THEMES.amberOak
  const isDark = currentThemeKey === "neonDusk"

  useEffect(() => {
    document.body.style.backgroundColor = theme.boardColors.pageBg
    document.body.style.transition = "background-color 0.4s ease"
    return () => { document.body.style.backgroundColor = "" }
  }, [theme.boardColors.pageBg])

  useEffect(() => {
    if (coachRef.current) coachRef.current.scrollTop = coachRef.current.scrollHeight
  }, [coachMessages])

  useEffect(() => {
    if (!isGameActive || game.isGameOver() || isPaused) return
    const interval = setInterval(() => {
      if (game.turn() === "w") {
        setWhiteTime((p) => {
          if (p <= 1) { setIsGameActive(false); setGameResult({ winner: "Black", reason: "on time" }); return 0 }
          return p - 1
        })
      } else {
        setBlackTime((p) => {
          if (p <= 1) { setIsGameActive(false); setGameResult({ winner: "White", reason: "on time" }); return 0 }
          return p - 1
        })
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isGameActive, game, isPaused])

  useEffect(() => {
    if (
      screen === "game" && gameMode === "pve" && isGameActive &&
      !isPaused && !game.isGameOver() && game.turn() === "b" && !isBotThinking
    ) {
      const fetchBotMove = async () => {
        setIsBotThinking(true)
        try {
          const currentGame = gameRef.current
          const res = await fetch(
            `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(currentGame.fen())}&depth=10`
          )
          const data = await res.json()
          if (data.success && data.bestmove) {
            const uci = data.bestmove.split(" ")[1]
            if (!uci || uci.length < 4) return
            const from = uci.substring(0, 2) as Square
            const to = uci.substring(2, 4) as Square
            const promotion = uci.length > 4 ? uci[4] : "q"
            const nextGame = new Chess(currentGame.fen())
            const result = nextGame.move({ from, to, promotion })
            if (result) {
              gameRef.current = nextGame
              setGame(nextGame)
              setMoveHistory(nextGame.history())
              setLastMove({ from, to })
              addCoach("Stockfish played " + result.san)
              if (nextGame.isCheckmate()) { setGameResult({ winner: "White", reason: "checkmate" }); setIsGameActive(false) }
              else if (nextGame.isDraw() || nextGame.isStalemate()) { setGameResult({ winner: "Draw", reason: "draw" }); setIsGameActive(false) }
            }
          }
        } catch (error) { console.error("Bot error:", error) }
        setIsBotThinking(false)
      }
      const timer = setTimeout(fetchBotMove, 800)
      return () => clearTimeout(timer)
    }
  }, [game, gameMode, screen, isGameActive, isPaused, isBotThinking])

  const addCoach = useCallback((msg: string) => setCoachMessages((prev) => [...prev, msg]), [])

  const handleAskAI = async () => {
    if (game.history().length === 0) { addCoach("Make a move first to get AI analysis."); return }
    addCoach("AI Coach is analyzing...")
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: game.history() }),
      })
      const data = await res.json()
      setCoachMessages((prev) => {
        const newMsgs = [...prev]
        newMsgs[newMsgs.length - 1] = "— " + data.comment.replace(/\*/g, "")
        return newMsgs
      })
    } catch (e) { console.error(e); addCoach("AI Coach is unavailable right now.") }
  }

  const resetGame = useCallback(() => {
    const fresh = new Chess()
    gameRef.current = fresh
    setGame(fresh)
    setSelectedSquare(null); setLegalMoves([]); setMoveHistory([])
    setCoachMessages(["Welcome. Make your first move and let the game begin."])
    setWhiteTime(600); setBlackTime(600); setIsGameActive(false)
    setIsPaused(false); setLastMove(null); setGameResult(null); setIsBotThinking(false)
  }, [])

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (game.isGameOver() || isPaused || (gameMode === "pve" && game.turn() === "b") || isBotThinking) return
      const piece = game.get(square)
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square)
        setLegalMoves(game.moves({ square, verbose: true }).map((m) => m.to as Square))
        return
      }
      if (selectedSquare && legalMoves.includes(square)) {
        try {
          const nextGame = new Chess(game.fen())
          const result = nextGame.move({ from: selectedSquare, to: square, promotion: "q" })
          if (result) {
            if (!isGameActive) setIsGameActive(true)
            setLastMove({ from: selectedSquare, to: square })
            setMoveHistory(nextGame.history())
            addCoach(`You played ${result.san}. Good move.`)
            if (nextGame.isCheckmate()) { setGameResult({ winner: nextGame.turn() === "w" ? "Black" : "White", reason: "checkmate" }); setIsGameActive(false) }
            else if (nextGame.isStalemate()) { setGameResult({ winner: "Draw", reason: "stalemate" }); setIsGameActive(false) }
            else if (nextGame.isDraw()) { setGameResult({ winner: "Draw", reason: "draw" }); setIsGameActive(false) }
            gameRef.current = nextGame
            setGame(nextGame)
          }
        } catch {}
      }
      setSelectedSquare(null); setLegalMoves([])
    },
    [game, selectedSquare, legalMoves, isGameActive, isPaused, gameMode, isBotThinking, addCoach]
  )

  const getSquareStyle = (file: string, rank: string, sq: Square): React.CSSProperties => {
    const isLightSq = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
    let highlightColor = ""
    if (selectedSquare === sq) highlightColor = theme.boardColors.selected
    if (lastMove && (lastMove.from === sq || lastMove.to === sq)) {
      highlightColor = isLightSq ? theme.boardColors.lastLight : theme.boardColors.lastDark
    }
    if (theme.boardImageUrl) {
      return {
        backgroundImage: highlightColor
          ? `linear-gradient(${highlightColor}, ${highlightColor}), url("${theme.boardImageUrl}")`
          : `url("${theme.boardImageUrl}")`,
        backgroundSize: "100% 200%",
        backgroundPosition: isLightSq ? "top" : "bottom",
        transition: "all 0.2s ease",
      }
    }
    return {
      backgroundColor: highlightColor || (isLightSq ? theme.boardColors.light : theme.boardColors.dark),
      transition: "background-color 0.2s ease",
    }
  }

  const isWhiteActive = game.turn() === "w" && isGameActive && !isPaused
  const isBlackActive = game.turn() === "b" && isGameActive && !isPaused
  const text = isDark ? "#e5e5e5" : theme.coachUI.text
  const panelBg = theme.coachUI.bg
  const panelBorder = theme.coachUI.border

  if (screen === "menu") {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Mono:wght@300;400&family=DM+Serif+Display:ital@0;1&display=swap');
          * { box-sizing: border-box; }
          .chess-mono { font-family: 'DM Mono', monospace; }
          .chess-serif-display { font-family: 'DM Serif Display', serif; }
          .menu-btn { display: block; width: 100%; max-width: 280px; font-family: 'DM Mono', monospace; font-size: 0.78rem; letter-spacing: 0.15em; text-transform: uppercase; background: none; border: 1px solid ${text}30; color: ${text}; padding: 0.9rem 2rem; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
          .menu-btn:hover { border-color: ${text}70; background: ${text}08; }
          .menu-btn.accent { border-color: ${text}60; }
          .auth-btn { font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; background: none; border: 1px solid ${text}20; color: ${text}55; padding: 0.45rem 0.9rem; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
          .auth-btn:hover { border-color: ${text}40; color: ${text}90; }
          .settings-overlay { position: fixed; inset: 0; z-index: 100; background: ${isDark ? "rgba(0,0,0,0.7)" : "rgba(26,25,22,0.3)"}; backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
          .settings-modal { background: ${theme.boardColors.pageBg}; border: 1px solid ${panelBorder}; width: 400px; max-width: 92vw; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border-radius: 8px; overflow: hidden; }
          .style-opt { padding: 1rem; cursor: pointer; border-bottom: 1px solid ${panelBorder}; transition: background 0.2s; }
          .style-opt:last-child { border-bottom: none; }
          .style-opt:hover { background: rgba(0,0,0,0.03); }
          .style-opt.selected { background: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}; }
        `}</style>
        <div style={{ minHeight: "100vh", backgroundColor: theme.boardColors.pageBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", color: text, transition: "background-color 0.4s ease" }}>
          <p className="chess-mono" style={{ fontSize: "0.6rem", letterSpacing: "0.35em", textTransform: "uppercase", color: `${text}45`, margin: "0 0 0.6rem 0" }}>welcome to</p>
          <h1 className="chess-serif-display" style={{ fontSize: "clamp(3rem, 10vw, 5rem)", fontStyle: "italic", margin: 0, lineHeight: 1, color: text }}>Chess</h1>
          <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "1.05rem", fontStyle: "italic", color: `${text}50`, margin: "0.6rem 0 3.5rem 0" }}>choose your game</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", alignItems: "center", width: "100%" }}>
            <button className="menu-btn accent" onClick={() => { setGameMode("pvp"); setScreen("game") }}>Play with Friend</button>
            <button className="menu-btn accent" onClick={() => { setGameMode("pve"); setScreen("game") }}>Play with AI</button>
            <button className="menu-btn" onClick={() => setSettingsOpen(true)}>Settings</button>
          </div>
          <div style={{ marginTop: "2.5rem", display: "flex", gap: "8px", alignItems: "center" }}>
            {(Object.keys(UNIFIED_THEMES) as UnifiedThemeKey[]).map((k) => (
              <span key={k} title={UNIFIED_THEMES[k].name} onClick={() => setCurrentThemeKey(k)} style={{ width: 14, height: 14, borderRadius: "50%", background: UNIFIED_THEMES[k].boardColors.dark, border: `2px solid ${currentThemeKey === k ? text : "transparent"}`, cursor: "pointer", transition: "all 0.2s", display: "inline-block" }} />
            ))}
          </div>
          <div style={{ marginTop: "3rem", display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button className="auth-btn">Sign in with GitHub</button>
            <button className="auth-btn">Sign in with Google</button>
          </div>
        </div>
        {settingsOpen && (
          <div className="settings-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false) }}>
            <div className="settings-modal" style={{ color: text }}>
              <div style={{ padding: "1.2rem 1.5rem", borderBottom: `1px solid ${panelBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="chess-mono" style={{ fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>Theme Gallery</span>
                <button onClick={() => setSettingsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: text }}>✕</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(Object.keys(UNIFIED_THEMES) as UnifiedThemeKey[]).map((key) => (
                  <div key={key} className={`style-opt${currentThemeKey === key ? " selected" : ""}`} onClick={() => setCurrentThemeKey(key)}>
                    <span className="chess-mono" style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: currentThemeKey === key ? text : "transparent", border: `1px solid ${text}` }} />
                      {UNIFIED_THEMES[key].name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Mono:wght@300;400&family=DM+Serif+Display:ital@0;1&display=swap');
        .chess-root * { box-sizing: border-box; }
        .chess-root { font-family: 'EB Garamond', Georgia, serif; color: ${text}; transition: color 0.4s ease; }
        .chess-mono { font-family: 'DM Mono', monospace; }
        .chess-serif-display { font-family: 'DM Serif Display', serif; }
        .game-layout { display: flex; flex-direction: row; align-items: flex-start; gap: 2rem; width: 100%; max-width: 960px; margin: 0 auto; }
        .board-col { flex: 0 0 auto; width: min(560px, calc(100vw - 380px)); min-width: 280px; }
        .panel-col { flex: 0 0 300px; width: 300px; display: flex; flex-direction: column; gap: 1rem; padding-top: 2.2rem; }
        @media (max-width: 720px) {
          .game-layout { flex-direction: column; align-items: center; }
          .board-col { width: min(560px, calc(100vw - 2rem)); }
          .panel-col { flex: none; width: min(560px, calc(100vw - 2rem)); }
        }
        .menu-btn { display: block; width: 100%; max-width: 280px; font-family: 'DM Mono', monospace; font-size: 0.78rem; letter-spacing: 0.15em; text-transform: uppercase; background: none; border: 1px solid ${text}30; color: ${text}; padding: 0.9rem 2rem; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
        .menu-btn:hover { border-color: ${text}70; background: ${text}08; }
        .board-wrapper { position: relative; width: 100%; padding-top: 100%; }
        .board-grid { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(8, 1fr); border: 2px solid ${panelBorder}; }
        .sq-btn { position: relative; display: flex; align-items: center; justify-content: center; border: none; padding: 0; cursor: pointer; width: 100%; height: 100%; }
        .dot-ind { position: absolute; width: 24%; height: 24%; border-radius: 50%; background: ${isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)"}; pointer-events: none; z-index: 3; }
        .ring-ind { position: absolute; inset: 0; border: 4px solid ${theme.boardColors.selected}; pointer-events: none; z-index: 3; }
        .coord { position: absolute; font-size: 11px; font-family: 'DM Mono', monospace; font-weight: 600; z-index: 1; pointer-events: none; opacity: 0.8; }
        .coach-scroll::-webkit-scrollbar { width: 4px; }
        .coach-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
        .settings-overlay { position: fixed; inset: 0; z-index: 1000; background: ${isDark ? "rgba(0,0,0,0.7)" : "rgba(26,25,22,0.3)"}; backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
      `}</style>

      <div className="chess-root" style={{ minHeight: "100vh", backgroundColor: theme.boardColors.pageBg, padding: "1.5rem 1rem" }}>
        <div className="game-layout">
          <div className="board-col">
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0.2rem", fontSize: "0.9rem" }}>
              <span className="chess-mono" style={{ textTransform: "uppercase", letterSpacing: "0.1em", opacity: isBlackActive ? 1 : 0.6 }}>
                ● Black {isBotThinking && gameMode === "pve" ? "(thinking...)" : ""}
              </span>
              <span className="chess-mono" style={{ fontSize: "1rem" }}>{formatTime(blackTime)}</span>
            </div>

            <div className="board-wrapper">
              <div className="board-grid">
                {RANKS.map((rank) =>
                  FILES.map((file) => {
                    const sq = `${file}${rank}` as Square
                    const piece = game.get(sq)
                    const isLightSq = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
                    const isLegal = legalMoves.includes(sq)
                    const pieceImgUrl = piece ? getPieceUrl(piece.color, piece.type, theme) : null
                    return (
                      <button key={sq} className="sq-btn" onClick={() => handleSquareClick(sq)} style={getSquareStyle(file, rank, sq)} disabled={isBotThinking}>
                        {pieceImgUrl && <img src={pieceImgUrl} alt="piece" style={{ width: "86%", height: "86%", zIndex: 2, filter: theme.pieceFilter }} />}
                        {isLegal && (piece ? <span className="ring-ind" /> : <span className="dot-ind" />)}
                        {file === "a" && <span className="coord" style={{ top: 4, left: 5, color: isLightSq ? theme.boardColors.dark : theme.boardColors.light }}>{rank}</span>}
                        {rank === "1" && <span className="coord" style={{ bottom: 4, right: 5, color: isLightSq ? theme.boardColors.dark : theme.boardColors.light }}>{file}</span>}
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0.2rem", fontSize: "0.9rem" }}>
              <span className="chess-mono" style={{ textTransform: "uppercase", letterSpacing: "0.1em", opacity: isWhiteActive ? 1 : 0.6 }}>○ White</span>
              <span className="chess-mono" style={{ fontSize: "1rem" }}>{formatTime(whiteTime)}</span>
            </div>
          </div>

          <div className="panel-col">
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", background: panelBg, padding: "0.75rem", border: `1px solid ${panelBorder}`, borderRadius: "6px" }}>
              <button onClick={() => { setIsPaused(true); setSettingsOpen(true) }} className="chess-mono" style={{ background: "none", border: "none", color: text, cursor: "pointer", opacity: 0.8 }}>
                <Settings size={22} />
              </button>
            </div>

            <div style={{ background: panelBg, border: `1px solid ${panelBorder}`, borderRadius: "6px", padding: "1.2rem" }}>
              <p className="chess-mono" style={{ fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: `${text}80`, margin: 0 }}>Status</p>
              <p className="chess-serif-display" style={{ fontSize: "1.2rem", fontStyle: "italic", margin: "0.3rem 0 0 0" }}>
                {game.isCheckmate() ? `Checkmate — ${game.turn() === "w" ? "Black" : "White"} wins.`
                  : game.isDraw() ? "A drawn position."
                  : game.isCheck() ? `${game.turn() === "w" ? "White" : "Black"} in check.`
                  : `${game.turn() === "w" ? "White" : "Black"} to move`}
              </p>
            </div>

            <div style={{ background: panelBg, border: `1px solid ${panelBorder}`, borderRadius: "6px", padding: "1.2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", borderBottom: `1px solid ${panelBorder}`, paddingBottom: "0.5rem" }}>
                <p className="chess-mono" style={{ fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: `${text}80`, margin: 0 }}>AI Coach</p>
                <button onClick={handleAskAI} className="chess-mono" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.3rem 0.6rem", border: `1px solid ${text}`, background: "transparent", color: text, borderRadius: "4px", cursor: "pointer" }}>Ask AI</button>
              </div>
              <div ref={coachRef} className="coach-scroll" style={{ maxHeight: 130, overflowY: "auto" }}>
                {coachMessages.map((msg, i) => (
                  <p key={i} className="chess-serif-display" style={{ fontSize: "0.95rem", fontStyle: "italic", lineHeight: 1.5, margin: "0 0 0.5rem 0", color: i === coachMessages.length - 1 ? text : `${text}65` }}>{msg}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {settingsOpen && (
          <div className="settings-overlay" onClick={() => { setIsPaused(false); setSettingsOpen(false) }}>
            <div style={{ background: theme.boardColors.pageBg, padding: "2rem", borderRadius: "8px", border: `1px solid ${panelBorder}`, width: "300px", maxWidth: "90vw", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
              <button className="menu-btn" onClick={() => { setIsPaused(false); setSettingsOpen(false) }}>Resume Game</button>
              <button className="menu-btn" onClick={() => { resetGame(); setIsPaused(false); setSettingsOpen(false); setScreen("menu") }}>Exit to Menu</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
