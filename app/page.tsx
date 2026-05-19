"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Chess, Square, Move } from "chess.js"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

// Прямая ссылка на облачное хранилище оригинальных фигур
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
    boardImageUrl: "", // Для неона картинка не нужна
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
  return theme.pieceSetUrl.replace('{color}', color).replace('{piece}', piece)
}

const COACH_COMMENTS = {
  firstMove: ["Interesting opening. Let's see where this strategy takes us.", "A classic start. The journey of a thousand moves begins with one."],
  capture: ["Material exchange. Fortune favors the brave — or does it?", "Clean capture. Precision on that move.", "The board is lighter now. Was it worth it?"],
  check: ["Check! Pressure is on. Take a breath and look at the whole board.", "The king is nervous. As he should be."],
  castle: ["Castling. Safety first, chaos later.", "The king finds shelter. Now the real game begins."],
  promotion: ["A pawn becomes a queen. The ultimate transformation.", "New queen on the block. Things just got interesting."],
  opening: ["Solid development. Classical and precise.", "Building the foundation. Patience is a virtue.", "The center is contested. As it should be."],
  middlegame: ["The battle heats up. Choose your targets wisely.", "Midgame complexity. This is where games are won or lost.", "Pieces are clashing. Stay sharp."],
  endgame: ["Endgame precision required. Every tempo counts.", "The final act approaches. Make it count.", "Pawns are gold now. Treat them accordingly."],
}

function generateHint(game: Chess): string {
  if (game.isCheckmate()) return "The game is over. Study this position — there is much to learn."
  if (game.isDraw()) return "A drawn position."
  if (game.isCheck()) return `${game.turn() === "w" ? "White" : "Black"} is in check. The king demands immediate attention.`
  const moves = game.moves({ verbose: true })
  const captures = moves.filter((m) => m.san.includes("x"))
  if (captures.length > 0) return `Tension detected. Capturing on ${captures[0].to} is architecturally sound.`
  if (game.history().length < 6) return "In the opening, development is everything. Control the center."
  return "Assess the position. Look for undefended pieces and open files. Then act."
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function generateComment(move: Move, game: Chess, lastComment: string, usedRef: React.MutableRefObject<Set<string>>): string {
  const n = game.history().length
  const pool = n === 1 ? COACH_COMMENTS.firstMove : move.san.includes("+") ? COACH_COMMENTS.check : move.san.includes("x") ? COACH_COMMENTS.capture : move.san.includes("O-O") ? COACH_COMMENTS.castle : move.san.includes("=") ? COACH_COMMENTS.promotion : n <= 10 ? COACH_COMMENTS.opening : n <= 30 ? COACH_COMMENTS.middlegame : COACH_COMMENTS.endgame
  let candidates = pool.filter((c) => c !== lastComment && !usedRef.current.has(c))
  if (candidates.length === 0) { usedRef.current.clear(); candidates = pool.filter((c) => c !== lastComment) }
  if (candidates.length === 0) candidates = pool
  const chosen = candidates[Math.floor(Math.random() * candidates.length)]
  usedRef.current.add(chosen)
  return chosen
}

function useLocalStorage<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(defaultValue)
  useEffect(() => {
    try { const stored = localStorage.getItem(key); if (stored) setValue(JSON.parse(stored) as T) } catch {}
  }, [key])
  const set = useCallback((v: T) => { setValue(v); try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }, [key])
  return [value, set]
}

export default function ChessPage() {
  const [game, setGame] = useState(() => new Chess())
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [legalMoves, setLegalMoves] = useState<Square[]>([])
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [coachMessages, setCoachMessages] = useState<string[]>(["Welcome. Make your first move and let the game begin."])
  const [lastCoachComment, setLastCoachComment] = useState("")
  const [whiteTime, setWhiteTime] = useState(600)
  const [blackTime, setBlackTime] = useState(600)
  const [isGameActive, setIsGameActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  const [currentThemeKey, setCurrentThemeKey] = useLocalStorage<UnifiedThemeKey>("chess_premium_theme_v10", "amberOak")
  
  const coachRef = useRef<HTMLDivElement>(null)
  const usedPhrasesRef = useRef<Set<string>>(new Set())

  const theme = UNIFIED_THEMES[currentThemeKey] || UNIFIED_THEMES.amberOak
  const isDark = currentThemeKey === "neonDusk"
  
  useEffect(() => {
    document.body.style.backgroundColor = theme.boardColors.pageBg
    document.body.style.transition = "background-color 0.4s ease"
    return () => { document.body.style.backgroundColor = "" }
  }, [theme.boardColors.pageBg])

  useEffect(() => { if (coachRef.current) coachRef.current.scrollTop = coachRef.current.scrollHeight }, [coachMessages])

  useEffect(() => {
    if (!isGameActive || game.isGameOver() || isPaused) return
    const interval = setInterval(() => {
      if (game.turn() === "w") setWhiteTime(p => { if (p <= 1) { setIsGameActive(false); addCoach("Time expired. Black wins."); return 0 }; return p - 1 })
      else setBlackTime(p => { if (p <= 1) { setIsGameActive(false); addCoach("Time expired. White wins."); return 0 }; return p - 1 })
    }, 1000)
    return () => clearInterval(interval)
  }, [isGameActive, game, isPaused])

  const addCoach = useCallback((msg: string) => setCoachMessages(prev => [...prev, msg]), [])
  const handleHint = () => addCoach("— " + generateHint(game))

  const handleSquareClick = useCallback((square: Square) => {
    if (game.isGameOver() || isPaused) return
    const piece = game.get(square)
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square)
      setLegalMoves(game.moves({ square, verbose: true }).map((m) => m.to as Square))
      return
    }
    if (selectedSquare && legalMoves.includes(square)) {
      try {
        const result = game.move({ from: selectedSquare, to: square, promotion: "q" })
        if (result) {
          if (!isGameActive) setIsGameActive(true)
          setLastMove({ from: selectedSquare, to: square })
          setMoveHistory([...game.history()])
          const comment = generateComment(result, game, lastCoachComment, usedPhrasesRef)
          setLastCoachComment(comment)
          addCoach(comment)
          if (game.isCheckmate()) { addCoach(`Checkmate. ${game.turn() === "w" ? "Black" : "White"} wins.`); setIsGameActive(false) }
          else if (game.isDraw()) { addCoach("Draw. Equilibrium achieved."); setIsGameActive(false) }
          setGame(new Chess(game.fen()))
        }
      } catch {}
    }
    setSelectedSquare(null); setLegalMoves([])
  }, [game, selectedSquare, legalMoves, isGameActive, isPaused, lastCoachComment, addCoach])

  // НОВАЯ ГЕНИАЛЬНАЯ ЛОГИКА КЛЕТОК (Нарезаем картинки на две половинки)
  const getSquareStyle = (file: string, rank: string, sq: Square): React.CSSProperties => {
    const isLightSq = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
    
    // Определяем цвет подсветки (если клетка выделена или был ход)
    let highlightColor = ""
    if (selectedSquare === sq) highlightColor = theme.boardColors.selected
    if (lastMove && (lastMove.from === sq || lastMove.to === sq)) {
      highlightColor = isLightSq ? theme.boardColors.lastLight : theme.boardColors.lastDark
    }

    if (theme.boardImageUrl) {
      // 100% 200% растягивает картинку так, что видна только её половина.
      // Если светлая клетка - показываем верх (top), если темная - низ (bottom).
      return {
        backgroundImage: highlightColor 
          ? `linear-gradient(${highlightColor}, ${highlightColor}), url("${theme.boardImageUrl}")` 
          : `url("${theme.boardImageUrl}")`,
        backgroundSize: "100% 200%",
        backgroundPosition: isLightSq ? "top" : "bottom",
        transition: "all 0.2s ease"
      }
    }

    // Стандартное поведение для Неона (где нет картинок)
    return {
      backgroundColor: highlightColor || (isLightSq ? theme.boardColors.light : theme.boardColors.dark),
      transition: "background-color 0.2s ease"
    }
  }

  const isWhiteActive = game.turn() === "w" && isGameActive && !isPaused
  const isBlackActive = game.turn() === "b" && isGameActive && !isPaused

  const text = isDark ? "#e5e5e5" : theme.coachUI.text
  const panelBg = theme.coachUI.bg
  const panelBorder = theme.coachUI.border

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Mono:wght@300;400&family=DM+Serif+Display:ital@0;1&display=swap');
        .chess-root { font-family: 'EB Garamond', Georgia, serif; min-height: 100vh; color: ${text}; transition: color 0.4s ease; padding: 20px; }
        .chess-root * { box-sizing: border-box; }
        .chess-mono { font-family: 'DM Mono', monospace; }
        .chess-serif-display { font-family: 'DM Serif Display', serif; }
        .settings-overlay { position: fixed; inset: 0; z-index: 100; background: ${isDark ? "rgba(0,0,0,0.7)" : "rgba(26,25,22,0.3)"}; backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
        .settings-modal { background: ${theme.boardColors.pageBg}; border: 1px solid ${panelBorder}; width: 400px; max-width: 92vw; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border-radius: 8px; overflow: hidden; }
        .style-opt { padding: 1rem; cursor: pointer; border-bottom: 1px solid ${panelBorder}; transition: background 0.2s; }
        .style-opt:last-child { border-bottom: none; }
        .style-opt:hover { background: rgba(0,0,0,0.03); }
        .style-opt.selected { background: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}; }
        .swatch-circle { width: 18px; height: 18px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.15); display: inline-block; }
        .sq-btn { position: relative; display: flex; align-items: center; justify-content: center; border: none; padding: 0; cursor: pointer; aspect-ratio: 1; }
        .dot-ind { position: absolute; width: 24%; height: 24%; border-radius: 50%; background: ${isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)"}; pointer-events: none; z-index: 3; }
        .ring-ind { position: absolute; inset: 0; border: 4px solid ${theme.boardColors.selected}; pointer-events: none; z-index: 3; }
        .coord { position: absolute; font-size: 11px; font-family: 'DM Mono', monospace; font-weight: 600; z-index: 1; pointer-events: none; text-shadow: 0 0 3px rgba(255,255,255,0.8), 0 0 5px rgba(255,255,255,0.8); color: #000; opacity: 0.8; }
        .coach-scroll::-webkit-scrollbar { width: 4px; }
        .coach-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
      `}</style>

      <div className="chess-root" style={{ backgroundColor: theme.boardColors.pageBg, transition: "background-color 0.4s ease" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "1.5rem 1rem" }}>
          
          <div style={{ display: "flex", gap: "2.5rem", alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>
            
            <div style={{ flex: "1 1 500px", maxWidth: "560px" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0.2rem", fontSize: "0.9rem" }}>
                <span className="chess-mono" style={{ textTransform: "uppercase", letterSpacing: "0.1em", opacity: isBlackActive ? 1 : 0.6, fontWeight: isBlackActive ? 600 : 400 }}>● Black</span>
                <span className="chess-mono" style={{ fontSize: "1rem", fontWeight: isBlackActive ? 600 : 400 }}>{formatTime(blackTime)}</span>
              </div>

              {/* Убрали картинку с контейнера доски */}
              <div style={{ 
                width: "100%", aspectRatio: "1", display: "grid", gridTemplateColumns: "repeat(8,1fr)", gridTemplateRows: "repeat(8,1fr)", 
                border: `2px solid ${panelBorder}`, boxShadow: "0 20px 40px -15px rgba(0,0,0,0.2)"
              }}>
                {RANKS.map((rank) => FILES.map((file) => {
                  const sq = `${file}${rank}` as Square
                  const piece = game.get(sq)
                  const isLightSq = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
                  const isLegal = legalMoves.includes(sq)
                  const pieceImgUrl = piece ? getPieceUrl(piece.color, piece.type, theme) : null

                  return (
                    <button key={sq} className="sq-btn" onClick={() => handleSquareClick(sq)} style={getSquareStyle(file, rank, sq)}>
                      {pieceImgUrl && (
                        <img src={pieceImgUrl} alt={`${piece?.color}${piece?.type}`} style={{ width: "86%", height: "86%", zIndex: 2, filter: theme.pieceFilter, transition: "filter 0.4s ease" }} />
                      )}
                      {isLegal && (piece ? <span className="ring-ind" /> : <span className="dot-ind" />)}
                      {file === "a" && <span className="coord" style={{ top: 4, left: 5, color: theme.boardImageUrl ? (isLightSq ? "#4a3c31" : "#EBDDCB") : (isLightSq ? theme.boardColors.dark : theme.boardColors.light) }}>{rank}</span>}
                      {rank === "1" && <span className="coord" style={{ bottom: 4, right: 5, color: theme.boardImageUrl ? (isLightSq ? "#4a3c31" : "#EBDDCB") : (isLightSq ? theme.boardColors.dark : theme.boardColors.light) }}>{file}</span>}
                    </button>
                  )
                }))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0.2rem", fontSize: "0.9rem" }}>
                <span className="chess-mono" style={{ textTransform: "uppercase", letterSpacing: "0.1em", opacity: isWhiteActive ? 1 : 0.6, fontWeight: isWhiteActive ? 600 : 400 }}>○ White</span>
                <span className="chess-mono" style={{ fontSize: "1rem", fontWeight: isWhiteActive ? 600 : 400 }}>{formatTime(whiteTime)}</span>
              </div>
            </div>

            <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1.5rem" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: panelBg, padding: "0.75rem 1rem", border: `1px solid ${panelBorder}`, borderRadius: "6px" }}>
                 <button onClick={() => setSettingsOpen(true)} className="chess-mono" style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", background: "none", border: `1px solid ${text}40`, color: text, padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer", transition: "all 0.2s" }}>Select Theme</button>
                 <div style={{ display: "flex", gap: "6px" }}>
                    <span className="swatch-circle" style={{ background: theme.boardColors.pageBg }} />
                    <span className="swatch-circle" style={{ background: theme.boardColors.dark }} />
                    <span className="swatch-circle" style={{ background: theme.boardColors.light }} />
                    <span className="swatch-circle" style={{ background: theme.boardColors.selected }} />
                 </div>
              </div>

              <div style={{ background: panelBg, border: `1px solid ${panelBorder}`, borderRadius: "6px", padding: "1.2rem" }}>
                <p className="chess-mono" style={{ fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: `${text}80`, marginBottom: "0.4rem", margin: 0 }}>Status</p>
                <p className="chess-serif-display" style={{ fontSize: "1.2rem", fontStyle: "italic", color: text, margin: "0.3rem 0 0 0" }}>{
                  game.isCheckmate() ? `Checkmate — ${game.turn() === "w" ? "Black" : "White"} wins.` :
                  game.isDraw() ? "A drawn position." :
                  game.isCheck() ? `${game.turn() === "w" ? "White" : "Black"} in check.` :
                  `${game.turn() === "w" ? "White" : "Black"} to move`
                }</p>
              </div>

              <div style={{ background: panelBg, border: `1px solid ${panelBorder}`, borderRadius: "6px", padding: "1.2rem" }}>
                <p className="chess-mono" style={{ fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: `${text}80`, marginBottom: "0.4rem", margin: 0 }}>Move History</p>
                <p className="chess-serif-display" style={{ fontSize: "1.1rem", fontStyle: "italic", color: text, margin: "0.3rem 0 0 0" }}>
                  {moveHistory.length === 0 ? "No moves yet" : moveHistory[moveHistory.length - 1]}
                </p>
              </div>

              <div style={{ background: panelBg, border: `1px solid ${panelBorder}`, borderRadius: "6px", padding: "1.2rem" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", borderBottom: `1px solid ${panelBorder}`, paddingBottom: "0.5rem" }}>
                    <p className="chess-mono" style={{ fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: `${text}80`, margin: 0 }}>AI Coach</p>
                    <button onClick={handleHint} className="chess-mono" style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.3rem 0.6rem", border: `1px solid ${text}`, background: "transparent", color: text, borderRadius: "4px", cursor: "pointer" }}>Get Hint</button>
                 </div>
                 <div ref={coachRef} className="coach-scroll" style={{ maxHeight: 130, overflowY: "auto" }}>
                  {coachMessages.map((msg, i) => (
                    <p key={i} className="chess-serif-display" style={{ fontSize: "0.95rem", fontStyle: "italic", lineHeight: 1.5, margin: "0 0 0.5rem 0", color: i === coachMessages.length - 1 ? text : `${text}65` }}>
                      {msg}
                    </p>
                  ))}
                 </div>
              </div>
            </div>

          </div>
        </div>

        {settingsOpen && (
          <div className="settings-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setIsPaused(false); setSettingsOpen(false) } }}>
            <div className="settings-modal" style={{ color: text }}>
              <div style={{ padding: "1.2rem 1.5rem", borderBottom: `1px solid ${panelBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="chess-mono" style={{ fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>Theme Gallery</span>
                <button onClick={() => { setIsPaused(false); setSettingsOpen(false) }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: text }}>✕</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(Object.keys(UNIFIED_THEMES) as UnifiedThemeKey[]).map((key) => (
                  <div key={key} className={`style-opt${currentThemeKey === key ? " selected" : ""}`} onClick={() => setCurrentThemeKey(key)}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="chess-mono" style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: currentThemeKey === key ? text : "transparent", border: `1px solid ${text}` }}></span>
                            {UNIFIED_THEMES[key].name}
                        </span>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <span className="swatch-circle" style={{ background: UNIFIED_THEMES[key].boardColors.pageBg }} />
                          <span className="swatch-circle" style={{ background: UNIFIED_THEMES[key].boardColors.dark }} />
                          <span className="swatch-circle" style={{ background: UNIFIED_THEMES[key].boardColors.light }} />
                          <span className="swatch-circle" style={{ background: UNIFIED_THEMES[key].boardColors.selected }} />
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
