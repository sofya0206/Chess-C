"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Chess, Square, Move } from "chess.js"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

const BOARD_STYLES = {
  prada: {
    name: "Prada Monochrome",
    light: "#F7F7F7",
    dark: "#8A8A8A",
    selected: "#C9B037",
    lastLight: "#E5DDA0",
    lastDark: "#B0A060",
    pageBg: "#F5F3EF",
  },
  nordic: {
    name: "Nordic Minimalist",
    light: "#EFECE6",
    dark: "#A89F91",
    selected: "#C9B037",
    lastLight: "#DDD8C0",
    lastDark: "#A09080",
    pageBg: "#EAE7E1",
  },
  midnight: {
    name: "Midnight Graphite",
    light: "#2A2A2A",
    dark: "#141414",
    selected: "#4A5568",
    lastLight: "#383838",
    lastDark: "#202020",
    pageBg: "#0A0A0A",
  },
} as const

type BoardStyleKey = keyof typeof BOARD_STYLES

const PIECE_SETS = {
  classic: {
    name: "Classic",
    wp: "♙", wn: "♘", wb: "♗", wr: "♖", wq: "♕", wk: "♔",
    bp: "♟", bn: "♞", bb: "♝", br: "♜", bq: "♛", bk: "♚",
  },
} as const

type PieceStyleKey = keyof typeof PIECE_SETS

const COACH_COMMENTS = {
  firstMove: [
    "Interesting opening. Let's see where this strategy takes us.",
    "A classic start. The journey of a thousand moves begins with one.",
    "And so it begins. Show me what you've got.",
    "Opening gambit noted. The plot thickens already.",
    "The first brushstroke on an empty canvas. Make it count.",
  ],
  capture: [
    "A bold sacrifice. Or a miscalculation. Time will tell.",
    "Material exchange. Fortune favors the brave — or does it?",
    "Taking pieces. Sometimes aggression is the language.",
    "Clean capture. Prada-level precision on that move.",
    "The board is lighter now. Was it worth it?",
    "Blood on the squares. Chess is a violent game dressed in silk.",
    "You took something. But what did you give up in return?",
  ],
  check: [
    "Check! Pressure is on. Take a breath and look at the whole board.",
    "The king is nervous. As he should be.",
    "Keep that royal headache going.",
    "Targeting the crown. How very ambitious of you.",
    "Your king looks uncomfortably exposed. Fix that.",
    "Check. The clock of doom ticks louder now.",
  ],
  castle: [
    "Castling. Safety first, chaos later.",
    "The king retreats to his fortress. Smart.",
    "A wise monarch knows when to hide.",
    "Tucked away nicely. Now unleash the rest.",
    "The king finds shelter. Now the real game begins.",
  ],
  promotion: [
    "A pawn becomes a queen. The ultimate transformation.",
    "Promotion. From nobody to somebody in one move.",
    "That pawn walked the entire board for this moment. Respect.",
    "New queen on the block. Things just got interesting.",
    "The smallest piece, the biggest ambition. Promoted.",
  ],
  opening: [
    "Solid development. Classical and precise.",
    "Textbook. Sometimes classics are classic for a reason.",
    "Building the foundation. Patience is a virtue.",
    "Developing nicely. The masters would approve.",
    "Control and coordination. I like your style.",
    "Knights before bishops. Bishops before rooks. You know the rules.",
    "The center is contested. As it should be.",
  ],
  middlegame: [
    "The battle heats up. Choose your targets wisely.",
    "Midgame complexity. This is where games are won or lost.",
    "Interesting maneuver. Let's see the follow-up.",
    "The position demands creativity. Don't disappoint me.",
    "Pieces are clashing. Stay sharp.",
    "The board is getting crowded with ideas. Prioritize.",
    "Tactical storm brewing. Keep your calculations tight.",
    "Every move is a statement. What are you saying?",
  ],
  endgame: [
    "Endgame precision required. Every tempo counts.",
    "The final act approaches. Make it count.",
    "Technique over tactics now. Stay focused.",
    "Few pieces, big decisions. The pressure is real.",
    "This is where preparation meets execution.",
    "The kings come alive in the endgame. Use yours.",
    "Pawns are gold now. Treat them accordingly.",
  ],
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function generateComment(move: Move, game: Chess, lastComment: string, usedRef: React.MutableRefObject<Set<string>>): string {
  const n = game.history().length
  const pool: string[] = (() => {
    if (n === 1) return COACH_COMMENTS.firstMove
    if (move.san.includes("+")) return COACH_COMMENTS.check
    if (move.san.includes("x")) return COACH_COMMENTS.capture
    if (move.san.includes("O-O")) return COACH_COMMENTS.castle
    if (move.san.includes("=")) return COACH_COMMENTS.promotion
    if (n <= 10) return COACH_COMMENTS.opening
    if (n <= 30) return COACH_COMMENTS.middlegame
    return COACH_COMMENTS.endgame
  })()
  let candidates = pool.filter((c) => c !== lastComment && !usedRef.current.has(c))
  if (candidates.length === 0) { usedRef.current.clear(); candidates = pool.filter((c) => c !== lastComment) }
  if (candidates.length === 0) candidates = pool
  const chosen = candidates[Math.floor(Math.random() * candidates.length)]
  usedRef.current.add(chosen)
  if (usedRef.current.size > 10) {
    const first = usedRef.current.values().next().value
    if (first) usedRef.current.delete(first)
  }
  return chosen
}

function generateHint(game: Chess): string {
  if (game.isCheckmate()) return "The game is over. Study this position — there is much to learn."
  if (game.isDraw()) return "A drawn position. Neither side could find the decisive blow."
  if (game.isCheck()) {
    const turn = game.turn() === "w" ? "White" : "Black"
    return `${turn} is in check. The king demands immediate attention — all other plans are secondary.`
  }
  const moves = game.moves({ verbose: true })
  const history = game.history()
  const n = history.length
  const checks = moves.filter((m) => m.san.includes("+"))
  if (checks.length > 0) return `There is a check available. Look for ${checks[0].san}.`
  const captures = moves.filter((m) => m.san.includes("x"))
  if (captures.length > 1) return "Multiple captures available. Before taking, ask: does it improve your position?"
  if (n < 6) return "In the opening, development is everything. Bring your knights and bishops into the game before committing to an attack."
  const castles = moves.filter((m) => m.san.includes("O-O"))
  if (castles.length > 0) return "You can castle. King safety is paramount — consider tucking away before launching an offensive."
  if (n >= 30) return "The endgame requires technique over tactics. Activate your king — it becomes a powerful piece in the final phase."
  return "Assess the position. Look for undefended pieces, open files for rooks, and the safety of both kings. Then act."
}

function useLocalStorage<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(defaultValue)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) setValue(JSON.parse(stored) as T)
    } catch {}
  }, [key])
  const set = useCallback((v: T) => {
    setValue(v)
    try { localStorage.setItem(key, JSON.stringify(v)) } catch {}
  }, [key])
  return [value, set]
}

type SettingsTab = "game" | "board" | "pieces"

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
  const [activeTab, setActiveTab] = useState<SettingsTab>("game")
  const [boardStyle, setBoardStyle] = useLocalStorage<BoardStyleKey>("chess_boardStyle", "prada")
  const [pieceStyle, setPieceStyle] = useLocalStorage<PieceStyleKey>("chess_pieceStyle", "classic")
  const coachRef = useRef<HTMLDivElement>(null)
  const usedPhrasesRef = useRef<Set<string>>(new Set())

  const bs = BOARD_STYLES[boardStyle] || BOARD_STYLES.prada
  const ps = PIECE_SETS[pieceStyle] || PIECE_SETS.classic
  const isDark = boardStyle === "midnight"

  useEffect(() => {
    document.body.style.backgroundColor = bs.pageBg
    document.body.style.transition = "background-color 0.3s ease"
    return () => { document.body.style.backgroundColor = "" }
  }, [bs.pageBg])

  useEffect(() => {
    if (coachRef.current) coachRef.current.scrollTop = coachRef.current.scrollHeight
  }, [coachMessages])

  useEffect(() => {
    if (!isGameActive || game.isGameOver() || isPaused) return
    const interval = setInterval(() => {
      if (game.turn() === "w") {
        setWhiteTime((prev) => {
          if (prev <= 1) { setIsGameActive(false); addCoach("Time expired. Black wins on time."); return 0 }
          return prev - 1
        })
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) { setIsGameActive(false); addCoach("Time expired. White wins on time."); return 0 }
          return prev - 1
        })
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isGameActive, game, isPaused])

  const addCoach = useCallback((msg: string) => {
    setCoachMessages((prev) => [...prev, msg])
  }, [])

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
          else if (game.isDraw()) { addCoach("The game ends in a draw. Equilibrium achieved."); setIsGameActive(false) }
          setGame(new Chess(game.fen()))
        }
      } catch {}
    }
    setSelectedSquare(null)
    setLegalMoves([])
  }, [game, selectedSquare, legalMoves, isGameActive, isPaused, lastCoachComment, addCoach])

  const handleHint = () => addCoach("— " + generateHint(game))

  const resetGame = () => {
    setGame(new Chess()); setSelectedSquare(null); setLegalMoves([])
    setMoveHistory([]); setCoachMessages(["New game. White to move. Good luck."])
    setLastCoachComment(""); setWhiteTime(600); setBlackTime(600)
    setIsGameActive(false); setIsPaused(false); setLastMove(null)
  }

  const undoMove = () => {
    game.undo()
    setGame(new Chess(game.fen()))
    setMoveHistory([...game.history()])
    setSelectedSquare(null); setLegalMoves([]); setLastMove(null)
    addCoach("Move undone. Reconsider.")
  }

  const getSquareBg = (file: string, rank: string, sq: Square) => {
    const isLight = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
    if (selectedSquare === sq) return bs.selected
    if (lastMove && (lastMove.from === sq || lastMove.to === sq)) return isLight ? bs.lastLight : bs.lastDark
    return isLight ? bs.light : bs.dark
  }

  const statusText = () => {
    if (game.isCheckmate()) return `Checkmate — ${game.turn() === "w" ? "Black" : "White"} wins`
    if (game.isDraw()) return "Draw"
    if (game.isCheck()) return `${game.turn() === "w" ? "White" : "Black"} in check`
    return `${game.turn() === "w" ? "White" : "Black"} to move`
  }

  const isWhiteActive = game.turn() === "w" && isGameActive && !isPaused
  const isBlackActive = game.turn() === "b" && isGameActive && !isPaused

  const BOARD_STYLE_SWATCHES: Record<BoardStyleKey, string[]> = {
    prada: ["#F7F7F7", "#8A8A8A", "#C9B037"],
    nordic: ["#EFECE6", "#A89F91", "#C9B037"],
    midnight: ["#2A2A2A", "#141414", "#4A5568"],
  }

  const text = isDark ? "#e5e5e5" : "#1a1916"
  const panelBg = isDark ? "#1a1a1a" : "#ffffff"
  const panelBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(26,25,22,0.12)"

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Mono:wght@300;400&display=swap');
        .chess-root { font-family: 'EB Garamond', Georgia, serif; background: transparent; min-height: 100vh; color: ${text}; transition: color 0.3s ease; }
        .chess-root * { box-sizing: border-box; }
        .chess-mono { font-family: 'DM Mono', monospace; }
        .settings-overlay { position: fixed; inset: 0; z-index: 100; background: ${isDark ? "rgba(0,0,0,0.6)" : "rgba(26,25,22,0.4)"}; backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; }
        .settings-modal { background: ${panelBg}; border: 1px solid ${panelBorder}; width: 360px; max-width: 92vw; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4); }
        .modal-tab-btn { flex: 1; padding: 0.6rem 0; font-family: 'DM Mono', monospace; font-size: 0.6rem; letter-spacing: 0.15em; text-transform: uppercase; background: none; border: none; cursor: pointer; color: #a09e99; border-bottom: 1.5px solid transparent; transition: all 0.15s; }
        .modal-tab-btn.active { color: ${text}; border-bottom-color: ${text}; }
        .modal-action-btn { width: 100%; font-family: 'DM Mono', monospace; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; padding: 0.7rem 1rem; border: 0.5px solid ${panelBorder}; background: none; color: #6b6860; cursor: pointer; text-align: left; transition: all 0.15s; }
        .modal-action-btn:hover { background: ${text}; color: ${isDark ? "#0a0a0a" : "#fff"}; border-color: ${text}; }
        .style-opt { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.8rem; border: 0.5px solid ${panelBorder}; cursor: pointer; margin-bottom: 0.4rem; font-family: 'DM Mono', monospace; font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; color: #6b6860; transition: all 0.15s; }
        .style-opt:hover, .style-opt.selected { border-color: ${text}; color: ${text}; }
        .opt-dot { width: 8px; height: 8px; border-radius: 50%; border: 1px solid currentColor; }
        .style-opt.selected .opt-dot { background: currentColor; }
        .swatch { width: 12px; height: 12px; border: 0.5px solid rgba(26,25,22,0.2); display: inline-block; }
        .sq-btn { position: relative; display: flex; align-items: center; justify-content: center; border: none; padding: 0; cursor: pointer; transition: filter 0.1s; aspect-ratio: 1; }
        .sq-btn:hover { filter: brightness(0.94); }
        .dot-ind { position: absolute; width: 28%; height: 28%; border-radius: 50%; background: rgba(26,25,22,0.35); pointer-events: none; z-index: 3; }
        .ring-ind { position: absolute; inset: 3%; border: 3px solid rgba(26,25,22,0.3); pointer-events: none; z-index: 3; }
        .coord { position: absolute; font-size: 9px; font-family: 'DM Mono', monospace; font-weight: 300; opacity: 0.5; z-index: 1; pointer-events: none; }
        .coach-scroll::-webkit-scrollbar { width: 3px; }
        .coach-scroll::-webkit-scrollbar-thumb { background: rgba(26,25,22,0.15); }
      `}</style>

      <div className="chess-root">
        <div style={{ maxWidth: 940, margin: "0 auto", padding: "2rem 1.25rem 3rem" }}>
          <header style={{ textAlign: "center", marginBottom: "2rem", borderBottom: `0.5px solid ${panelBorder}`, paddingBottom: "1.25rem", position: "relative" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 400, letterSpacing: "0.18em", textTransform: "uppercase", color: text, margin: 0 }}>Chess Platform</h1>
            <p className="chess-mono" style={{ fontSize: "0.72rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "#a09e99", marginTop: "0.2rem", fontWeight: 300 }}>Premium Edition</p>
            <button
              onClick={() => { setIsPaused(true); setSettingsOpen(true) }}
              style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: panelBg, border: `1px solid ${text}`, width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: "1.1rem", color: text, display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Settings"
            >⚙</button>
          </header>

          <div style={{ display: "flex", gap: "1.75rem", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              {/* Black timer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.55rem 0.85rem", marginBottom: "0.4rem", border: `0.5px solid ${isBlackActive ? text : panelBorder}`, background: panelBg, transition: "border-color 0.2s" }}>
                <div className="chess-mono" style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b6860" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: isDark ? "#e5e5e5" : "#1a1916" }} /> Black
                </div>
                <span className="chess-mono" style={{ fontSize: "0.88rem", color: isBlackActive ? text : "#a09e99", letterSpacing: "0.05em" }}>{formatTime(blackTime)}</span>
              </div>

              {/* Board */}
              <div style={{ width: "100%", aspectRatio: "1", display: "grid", gridTemplateColumns: "repeat(8,1fr)", gridTemplateRows: "repeat(8,1fr)", border: `1px solid ${panelBorder}` }}>
                {RANKS.map((rank) => FILES.map((file) => {
                  const sq = `${file}${rank}` as Square
                  const piece = game.get(sq)
                  const isLight = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
                  const isLegal = legalMoves.includes(sq)
                  const pieceKey = piece ? `${piece.color}${piece.type}` as keyof typeof ps : null
                  const wStyle = { color: "#ffffff", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.08))" }
                  const bStyle = { color: "#111111", filter: "brightness(0.15) contrast(1.2) drop-shadow(0 4px 6px rgba(0,0,0,0.12))" }
                  return (
                    <button key={sq} className="sq-btn" onClick={() => handleSquareClick(sq)} style={{ background: getSquareBg(file, rank, sq) }}>
                      {pieceKey && (
                        <span style={{ fontSize: "clamp(1.3rem, 3.5vw, 2rem)", lineHeight: 1, userSelect: "none", position: "relative", zIndex: 2, ...(piece?.color === "w" ? wStyle : bStyle) }}>
                          {ps[pieceKey]}
                        </span>
                      )}
                      {isLegal && (piece ? <span className="ring-ind" /> : <span className="dot-ind" />)}
                      {file === "a" && <span className="coord" style={{ top: 2, left: 3, color: isLight ? bs.dark : bs.light }}>{rank}</span>}
                      {rank === "1" && <span className="coord" style={{ bottom: 2, right: 3, color: isLight ? bs.dark : bs.light }}>{file}</span>}
                    </button>
                  )
                }))}
              </div>

              {/* White timer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.55rem 0.85rem", marginTop: "0.4rem", border: `0.5px solid ${isWhiteActive ? text : panelBorder}`, background: panelBg, transition: "border-color 0.2s" }}>
                <div className="chess-mono" style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b6860" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "transparent", border: `1px solid ${isDark ? "#888" : "rgba(26,25,22,0.3)"}` }} /> White
                </div>
                <span className="chess-mono" style={{ fontSize: "0.88rem", color: isWhiteActive ? text : "#a09e99", letterSpacing: "0.05em" }}>{formatTime(whiteTime)}</span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", justifyContent: "center" }}>
                {[{ label: "New Game", onClick: resetGame, disabled: false }, { label: "Undo", onClick: undoMove, disabled: moveHistory.length === 0 }].map(({ label, onClick, disabled }) => (
                  <button key={label} onClick={onClick} disabled={disabled} className="chess-mono"
                    style={{ fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.5rem 1rem", border: `1px solid ${text}`, background: panelBg, color: text, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.35 : 1, transition: "all 0.15s" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ width: 248, flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ border: `0.5px solid ${panelBorder}`, background: panelBg, padding: "0.85rem 1rem" }}>
                <div className="chess-mono" style={{ fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#a09e99", marginBottom: "0.45rem", borderBottom: `0.5px solid rgba(26,25,22,0.08)`, paddingBottom: "0.35rem", fontWeight: 300 }}>Status</div>
                <p style={{ fontSize: "0.85rem", fontStyle: "italic", color: text }}>{statusText()}</p>
              </div>

              <div style={{ border: `0.5px solid ${panelBorder}`, background: panelBg, padding: "0.85rem 1rem" }}>
                <div className="chess-mono" style={{ fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#a09e99", marginBottom: "0.5rem", borderBottom: `0.5px solid rgba(26,25,22,0.08)`, paddingBottom: "0.35rem", fontWeight: 300 }}>Move History</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.12rem", maxHeight: 118, overflowY: "auto" }}>
                  {moveHistory.length === 0
                    ? <p className="chess-mono" style={{ fontSize: "0.7rem", color: "#a09e99", fontStyle: "italic", gridColumn: "span 2" }}>No moves yet</p>
                    : moveHistory.map((move, i) => (
                      <div key={i} className="chess-mono" style={{ fontSize: "0.7rem", color: i % 2 === 0 ? text : "#6b6860" }}>
                        {i % 2 === 0 && <span style={{ color: "#a09e99", marginRight: 2 }}>{Math.floor(i / 2) + 1}.</span>}
                        {move}
                      </div>
                    ))
                  }
                </div>
              </div>

              <div style={{ border: `0.5px solid ${panelBorder}`, background: isDark ? "#111" : "#faf9f7", padding: "0.85rem 1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem", borderBottom: `0.5px solid rgba(26,25,22,0.08)`, paddingBottom: "0.35rem" }}>
                  <span className="chess-mono" style={{ fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#a09e99", fontWeight: 300 }}>AI Coach</span>
                  <button onClick={handleHint} className="chess-mono"
                    style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.28rem 0.6rem", border: `1px solid ${text}`, background: panelBg, color: text, cursor: "pointer", transition: "all 0.15s" }}>
                    Get Hint
                  </button>
                </div>
                <div ref={coachRef} className="coach-scroll" style={{ maxHeight: 140, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {coachMessages.map((msg, i) => (
                    <p key={i} style={{ fontSize: "0.8rem", lineHeight: 1.55, fontStyle: "italic", padding: "0.3rem 0.45rem", color: i === coachMessages.length - 1 ? text : "#6b6860", background: i === coachMessages.length - 1 ? (isDark ? "rgba(255,255,255,0.05)" : "rgba(26,25,22,0.04)") : "transparent" }}>
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
            <div className="settings-modal">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.2rem 0.75rem", borderBottom: `0.5px solid ${panelBorder}` }}>
                <span className="chess-mono" style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 300, color: text }}>Settings</span>
                <button onClick={() => { setIsPaused(false); setSettingsOpen(false) }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "#a09e99" }}>✕</button>
              </div>
              <div style={{ display: "flex", borderBottom: `0.5px solid ${panelBorder}` }}>
                {(["game", "board", "pieces"] as SettingsTab[]).map((tab) => (
                  <button key={tab} className={`modal-tab-btn${activeTab === tab ? " active" : ""}`} onClick={() => setActiveTab(tab)}>
                    {tab === "game" ? "Game" : tab === "board" ? "Board Style" : "Piece Style"}
                  </button>
                ))}
              </div>
              <div style={{ padding: "1.1rem 1.2rem 1.4rem" }}>
                {activeTab === "game" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                    <button className="modal-action-btn" onClick={() => { setIsPaused(false); setSettingsOpen(false) }}>Resume Game</button>
                    <button className="modal-action-btn" onClick={() => { resetGame(); setSettingsOpen(false) }}>Reset Game</button>
                  </div>
                )}
                {activeTab === "board" && (
                  <div>
                    {(Object.keys(BOARD_STYLES) as BoardStyleKey[]).map((key) => (
                      <div key={key} className={`style-opt${boardStyle === key ? " selected" : ""}`} onClick={() => setBoardStyle(key)}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ display: "flex", gap: 3 }}>
                            {BOARD_STYLE_SWATCHES[key].map((c, i) => <span key={i} className="swatch" style={{ background: c }} />)}
                          </span>
                          {BOARD_STYLES[key].name}
                        </span>
                        <span className="opt-dot" />
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "pieces" && (
                  <div>
                    {(Object.keys(PIECE_SETS) as PieceStyleKey[]).map((key) => (
                      <div key={key} className={`style-opt${pieceStyle === key ? " selected" : ""}`} onClick={() => setPieceStyle(key)}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.9rem", opacity: 0.7 }}>{PIECE_SETS[key].wk}{PIECE_SETS[key].bk}</span>
                          {PIECE_SETS[key].name}
                        </span>
                        <span className="opt-dot" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
