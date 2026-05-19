"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Chess, Square, Move } from "chess.js"

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

const COACH_COMMENTS = {
  firstMove: [
    "The first move is placed. Let the game begin in earnest.",
    "A journey of a thousand moves starts here.",
    "The board breathes. Show your intentions.",
    "First piece moves. The middlegame is already being shaped.",
  ],
  capture: [
    "Material exchanged. Was the trade worth the tempo?",
    "Clean capture. Now reassess the whole board.",
    "A piece falls. Count the material and continue.",
    "Exchange completed. Who benefits from the new structure?",
    "The board lightens. Precision required from here.",
    "Taken. Don't celebrate too long — there is work ahead.",
  ],
  check: [
    "Check. The king demands immediate attention.",
    "The king is under fire. One move at a time.",
    "Check — every check carries a message. Read it.",
    "Check! The defender must find a way out.",
    "The king steps aside, blocks, or captures. Choose wisely.",
  ],
  castle: [
    "Castled. King to safety, rooks to work.",
    "Good instinct. Castling early often decides games.",
    "King tucked away. Now unleash the pieces.",
    "Castling is the bridge between safety and activity.",
  ],
  promotion: [
    "A pawn has ascended. The board changes forever.",
    "The long march pays off — a new queen rises.",
    "Promotion. This is what endgames are made of.",
    "The little pawn made it. Extraordinary patience rewarded.",
  ],
  opening: [
    "Development is everything in the opening. Each move should activate a piece.",
    "Control the center — it is the foundation of all good chess.",
    "Don't move the same piece twice unless there is a clear reason.",
    "Solid structure. Keep building and look for weaknesses.",
    "Every opening move should serve a purpose.",
    "Knights before bishops, generally. But trust your intuition too.",
    "The opening sets the tone for the whole game.",
    "Look for natural outposts for your knights.",
  ],
  middlegame: [
    "The middlegame is about imbalances. Who has the better-placed pieces?",
    "Look for weak squares in the opponent's camp and occupy them.",
    "An open file is an invitation. Place a rook there.",
    "Tactics arise from better positions. Build first, then strike.",
    "Is your king safe enough to launch the attack?",
    "Every piece should be doing something useful. Idle pieces lose games.",
    "Seek activity. Passive play rarely wins.",
    "Watch for forks and pins — they hide in plain sight.",
    "Coordinate your pieces. Together they are formidable.",
    "A well-placed knight can be worth more than a rook.",
  ],
  endgame: [
    "In the endgame the king becomes a fighting piece. Activate it now.",
    "Passed pawns must be pushed. They are future queens.",
    "Endgame precision required. Every single tempo counts.",
    "Two connected passed pawns are nearly unstoppable. Create them.",
    "Rook endings are notoriously complex. Stay patient and accurate.",
    "Centralize everything. King, rooks, all of it.",
    "Zugzwang awaits the careless player in this phase.",
    "Simplify when ahead. Complicate when behind.",
    "The king belongs in the heart of the board now.",
  ],
  knightMove: [
    "The knight dances. Its path is never straight.",
    "Knights love closed positions. Is this the right moment?",
    "An outpost knight is a thorn that never leaves.",
    "Interesting knight maneuver. What follows from here?",
    "The knight's value depends entirely on the pawn structure.",
  ],
  bishopMove: [
    "The bishop opens its diagonal. Long-range pressure begins.",
    "Bishops thrive in open positions. Are the pawns cooperating?",
    "Good bishop versus bad bishop — that difference can decide the game.",
    "The diagonal is yours. Use it without mercy.",
    "A bishop on an open diagonal is a silent assassin.",
  ],
  rookMove: [
    "Rooks belong on open files. This looks right.",
    "The rook activates. Now give it space to operate.",
    "Rooks love the seventh rank — pure devastation from there.",
    "Doubling rooks on a file can be overwhelming.",
    "A rook needs open lines the way a river needs a valley.",
  ],
  queenMove: [
    "The queen moves. Powerful, but don't expose her prematurely.",
    "A queen in the center too early invites harassment.",
    "The queen is placed. What does she threaten right now?",
    "Queen sorties require discipline. Every tempo lost is a gift.",
    "The queen coordinates best when the other pieces are already active.",
  ],
  pawnMove: [
    "Pawn moves are permanent. They shape the structure forever.",
    "Pawns define the character of the position.",
    "A pawn advance — bold. Make sure it is sound.",
    "Pawn structure is the skeleton your pieces live in.",
    "Weak pawns become targets. Advance with purpose.",
  ],
}

const HINT_POOLS = {
  opening: [
    "In the opening, develop your pieces to active squares before attacking.",
    "Control the center — d4, d5, e4, e5 are the key squares.",
    "Castle early to keep your king safe and connect the rooks.",
    "Knights belong on f3 and c3 for White, f6 and c6 for Black.",
    "Don't bring your queen out too early — it will be chased away.",
    "Develop a new piece on each move if possible.",
    "Look to establish a strong pawn center before launching attacks.",
  ],
  middlegame: [
    "Find your least active piece and improve it.",
    "Look for undefended pieces — tactics are always lurking.",
    "Open files are highways for your rooks. Claim them.",
    "Identify your opponent's weakest pawn and target it.",
    "Think about a pawn break to open the position on your terms.",
    "Your knight needs an outpost — a square it cannot be kicked from.",
    "Coordinate your pieces before launching the decisive combination.",
    "Ask yourself: what is my opponent's plan? Stop it.",
    "A piece that defends is a piece that does not attack.",
  ],
  endgame: [
    "Activate your king — it is a powerful fighting piece in the endgame.",
    "Push your passed pawns. Every square forward is progress.",
    "Place your rook behind the passed pawn, not in front of it.",
    "Cut off the opponent's king with your rook along a rank or file.",
    "Two weaknesses are harder to defend than one. Create a second front.",
    "Centralize your king — it belongs in the heart of the board.",
    "In rook endings, activity beats material almost every time.",
  ],
  check: [
    "You are in check. Find the only legal escape before anything else.",
    "The king is threatened. Block, capture the attacker, or move the king.",
    "In check — stay calm and calculate every option methodically.",
  ],
  capture: [
    "A capture is available. Ask yourself what recaptures are possible.",
    "Before you take, check what your opponent can take back.",
    "There is a capture on the board. Is it truly sound after the reply?",
  ],
}

function generateHint(game: Chess, usedHints: Set<string>): string {
  if (game.isCheckmate()) return "The game is over. Study this position — there is much to learn."
  if (game.isDraw()) return "A drawn position. Balance has been achieved."

  const moves = game.moves({ verbose: true })
  const n = game.history().length

  let pool: string[]
  if (game.isCheck()) {
    pool = HINT_POOLS.check
  } else {
    const captures = moves.filter((m) => m.san.includes("x"))
    if (captures.length > 0) {
      pool = HINT_POOLS.capture
    } else {
      pool = n < 10 ? HINT_POOLS.opening : n < 30 ? HINT_POOLS.middlegame : HINT_POOLS.endgame
    }
  }

  const unused = pool.filter((h) => !usedHints.has(h))
  const candidates = unused.length > 0 ? unused : pool
  const hint = candidates[Math.floor(Math.random() * candidates.length)]
  usedHints.add(hint)
  return hint
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function generateComment(
  move: Move,
  game: Chess,
  lastComment: string,
  usedRef: React.MutableRefObject<Set<string>>
): string {
  const n = game.history().length
  const phase = n <= 10 ? "opening" : n <= 30 ? "middlegame" : "endgame"

  let primaryPool: string[]

  if (n === 1) {
    primaryPool = COACH_COMMENTS.firstMove
  } else if (move.san.includes("O-O")) {
    primaryPool = COACH_COMMENTS.castle
  } else if (move.san.includes("=")) {
    primaryPool = COACH_COMMENTS.promotion
  } else if (move.san.includes("+")) {
    primaryPool = COACH_COMMENTS.check
  } else if (move.san.includes("x")) {
    primaryPool = COACH_COMMENTS.capture
  } else {
    const piece = move.piece
    if (piece === "n") primaryPool = [...COACH_COMMENTS.knightMove, ...COACH_COMMENTS[phase]]
    else if (piece === "b") primaryPool = [...COACH_COMMENTS.bishopMove, ...COACH_COMMENTS[phase]]
    else if (piece === "r") primaryPool = [...COACH_COMMENTS.rookMove, ...COACH_COMMENTS[phase]]
    else if (piece === "q") primaryPool = [...COACH_COMMENTS.queenMove, ...COACH_COMMENTS[phase]]
    else if (piece === "p") primaryPool = [...COACH_COMMENTS.pawnMove, ...COACH_COMMENTS[phase]]
    else primaryPool = COACH_COMMENTS[phase]
  }

  let candidates = primaryPool.filter((c) => c !== lastComment && !usedRef.current.has(c))
  if (candidates.length === 0) {
    usedRef.current.clear()
    candidates = primaryPool.filter((c) => c !== lastComment)
  }
  if (candidates.length === 0) candidates = primaryPool

  const chosen = candidates[Math.floor(Math.random() * candidates.length)]
  usedRef.current.add(chosen)
  return chosen
}

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

type GameResult = { winner: "White" | "Black" | "Draw"; reason: string }

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
  const [gameResult, setGameResult] = useState<GameResult | null>(null)

  const [currentThemeKey, setCurrentThemeKey] = useLocalStorage<UnifiedThemeKey>("chess_premium_theme_v11", "amberOak")

  const coachRef = useRef<HTMLDivElement>(null)
  const usedPhrasesRef = useRef<Set<string>>(new Set())
  const usedHintsRef = useRef<Set<string>>(new Set())

  const theme = UNIFIED_THEMES[currentThemeKey] || UNIFIED_THEMES.amberOak
  const isDark = currentThemeKey === "neonDusk"

  useEffect(() => {
    document.body.style.backgroundColor = theme.boardColors.pageBg
    document.body.style.transition = "background-color 0.4s ease"
    return () => {
      document.body.style.backgroundColor = ""
    }
  }, [theme.boardColors.pageBg])

  useEffect(() => {
    if (coachRef.current) coachRef.current.scrollTop = coachRef.current.scrollHeight
  }, [coachMessages])

  useEffect(() => {
    if (!isGameActive || game.isGameOver() || isPaused) return
    const interval = setInterval(() => {
      if (game.turn() === "w") {
        setWhiteTime((p) => {
          if (p <= 1) {
            setIsGameActive(false)
            setGameResult({ winner: "Black", reason: "on time" })
            return 0
          }
          return p - 1
        })
      } else {
        setBlackTime((p) => {
          if (p <= 1) {
            setIsGameActive(false)
            setGameResult({ winner: "White", reason: "on time" })
            return 0
          }
          return p - 1
        })
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isGameActive, game, isPaused])

  const addCoach = useCallback((msg: string) => setCoachMessages((prev) => [...prev, msg]), [])
  const handleHint = () => addCoach("— " + generateHint(game, usedHintsRef.current))

  const resetGame = useCallback(() => {
    setGame(new Chess())
    setSelectedSquare(null)
    setLegalMoves([])
    setMoveHistory([])
    setCoachMessages(["Welcome. Make your first move and let the game begin."])
    setLastCoachComment("")
    setWhiteTime(600)
    setBlackTime(600)
    setIsGameActive(false)
    setIsPaused(false)
    setLastMove(null)
    setGameResult(null)
    usedPhrasesRef.current.clear()
    usedHintsRef.current.clear()
  }, [])

  const handleSquareClick = useCallback(
    (square: Square) => {
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
            if (game.isCheckmate()) {
              const winner = game.turn() === "w" ? "Black" : "White"
              setGameResult({ winner, reason: "checkmate" })
              setIsGameActive(false)
            } else if (game.isStalemate()) {
              setGameResult({ winner: "Draw", reason: "stalemate" })
              setIsGameActive(false)
            } else if (game.isDraw()) {
              setGameResult({ winner: "Draw", reason: "draw" })
              setIsGameActive(false)
            }
            setGame(new Chess(game.fen()))
          }
        } catch {}
      }
      setSelectedSquare(null)
      setLegalMoves([])
    },
    [game, selectedSquare, legalMoves, isGameActive, isPaused, lastCoachComment, addCoach]
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
        .coord { position: absolute; font-size: 11px; font-family: 'DM Mono', monospace; font-weight: 600; z-index: 1; pointer-events: none; opacity: 0.8; }
        .coach-scroll::-webkit-scrollbar { width: 4px; }
        .coach-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
        .result-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.55); backdrop-filter: blur(14px); display: flex; align-items: center; justify-content: center; animation: fadeIn 0.35s ease; }
        .result-modal { background: ${panelBg}; border: 1px solid ${panelBorder}; border-radius: 8px; padding: 3rem 3.5rem; text-align: center; box-shadow: 0 30px 70px rgba(0,0,0,0.35); max-width: 380px; width: 90vw; animation: slideUp 0.35s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .result-btn { font-family: 'DM Mono', monospace; font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; background: none; border: 1px solid ${text}40; color: ${text}; padding: 0.65rem 1.6rem; border-radius: 4px; cursor: pointer; transition: all 0.2s; margin-top: 2rem; }
        .result-btn:hover { background: ${text}10; border-color: ${text}80; }
      `}</style>

      <div
        className="chess-root"
        style={{ backgroundColor: theme.boardColors.pageBg, transition: "background-color 0.4s ease" }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "1.5rem 1rem" }}>
          <div
            style={{
              display: "flex",
              gap: "2.5rem",
              alignItems: "flex-start",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <div style={{ flex: "1 1 500px", maxWidth: "560px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.5rem 0.2rem",
                  fontSize: "0.9rem",
                }}
              >
                <span
                  className="chess-mono"
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    opacity: isBlackActive ? 1 : 0.6,
                    fontWeight: isBlackActive ? 600 : 400,
                  }}
                >
                  ● Black
                </span>
                <span
                  className="chess-mono"
                  style={{ fontSize: "1rem", fontWeight: isBlackActive ? 600 : 400 }}
                >
                  {formatTime(blackTime)}
                </span>
              </div>

              <div
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  display: "grid",
                  gridTemplateColumns: "repeat(8,1fr)",
                  gridTemplateRows: "repeat(8,1fr)",
                  border: `2px solid ${panelBorder}`,
                  boxShadow: "0 20px 40px -15px rgba(0,0,0,0.2)",
                }}
              >
                {RANKS.map((rank) =>
                  FILES.map((file) => {
                    const sq = `${file}${rank}` as Square
                    const piece = game.get(sq)
                    const isLightSq = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
                    const isLegal = legalMoves.includes(sq)
                    const pieceImgUrl = piece ? getPieceUrl(piece.color, piece.type, theme) : null

                    return (
                      <button
                        key={sq}
                        className="sq-btn"
                        onClick={() => handleSquareClick(sq)}
                        style={getSquareStyle(file, rank, sq)}
                      >
                        {pieceImgUrl && (
                          <img
                            src={pieceImgUrl}
                            alt={`${piece?.color}${piece?.type}`}
                            style={{
                              width: "86%",
                              height: "86%",
                              zIndex: 2,
                              filter: theme.pieceFilter,
                              transition: "filter 0.4s ease",
                            }}
                          />
                        )}
                        {isLegal && (piece ? <span className="ring-ind" /> : <span className="dot-ind" />)}
                        {file === "a" && (
                          <span
                            className="coord"
                            style={{
                              top: 4,
                              left: 5,
                              color: isLightSq ? theme.boardColors.dark : theme.boardColors.light,
                            }}
                          >
                            {rank}
                          </span>
                        )}
                        {rank === "1" && (
                          <span
                            className="coord"
                            style={{
                              bottom: 4,
                              right: 5,
                              color: isLightSq ? theme.boardColors.dark : theme.boardColors.light,
                            }}
                          >
                            {file}
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.5rem 0.2rem",
                  fontSize: "0.9rem",
                }}
              >
                <span
                  className="chess-mono"
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    opacity: isWhiteActive ? 1 : 0.6,
                    fontWeight: isWhiteActive ? 600 : 400,
                  }}
                >
                  ○ White
                </span>
                <span
                  className="chess-mono"
                  style={{ fontSize: "1rem", fontWeight: isWhiteActive ? 600 : 400 }}
                >
                  {formatTime(whiteTime)}
                </span>
              </div>
            </div>

            <div
              style={{
                width: 320,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                marginTop: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: panelBg,
                  padding: "0.75rem 1rem",
                  border: `1px solid ${panelBorder}`,
                  borderRadius: "6px",
                }}
              >
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="chess-mono"
                  style={{
                    fontSize: "0.75rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    background: "none",
                    border: `1px solid ${text}40`,
                    color: text,
                    padding: "0.4rem 0.8rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Select Theme
                </button>
                <div style={{ display: "flex", gap: "6px" }}>
                  <span className="swatch-circle" style={{ background: theme.boardColors.pageBg }} />
                  <span className="swatch-circle" style={{ background: theme.boardColors.dark }} />
                  <span className="swatch-circle" style={{ background: theme.boardColors.light }} />
                  <span className="swatch-circle" style={{ background: theme.boardColors.selected }} />
                </div>
              </div>

              <div
                style={{
                  background: panelBg,
                  border: `1px solid ${panelBorder}`,
                  borderRadius: "6px",
                  padding: "1.2rem",
                }}
              >
                <p
                  className="chess-mono"
                  style={{
                    fontSize: "0.68rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: `${text}80`,
                    marginBottom: "0.4rem",
                    margin: 0,
                  }}
                >
                  Status
                </p>
                <p
                  className="chess-serif-display"
                  style={{ fontSize: "1.2rem", fontStyle: "italic", color: text, margin: "0.3rem 0 0 0" }}
                >
                  {game.isCheckmate()
                    ? `Checkmate — ${game.turn() === "w" ? "Black" : "White"} wins.`
                    : game.isDraw()
                    ? "A drawn position."
                    : game.isCheck()
                    ? `${game.turn() === "w" ? "White" : "Black"} in check.`
                    : `${game.turn() === "w" ? "White" : "Black"} to move`}
                </p>
              </div>

              <div
                style={{
                  background: panelBg,
                  border: `1px solid ${panelBorder}`,
                  borderRadius: "6px",
                  padding: "1.2rem",
                }}
              >
                <p
                  className="chess-mono"
                  style={{
                    fontSize: "0.68rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: `${text}80`,
                    marginBottom: "0.4rem",
                    margin: 0,
                  }}
                >
                  Move History
                </p>
                <p
                  className="chess-serif-display"
                  style={{ fontSize: "1.1rem", fontStyle: "italic", color: text, margin: "0.3rem 0 0 0" }}
                >
                  {moveHistory.length === 0 ? "No moves yet" : moveHistory[moveHistory.length - 1]}
                </p>
              </div>

              <div
                style={{
                  background: panelBg,
                  border: `1px solid ${panelBorder}`,
                  borderRadius: "6px",
                  padding: "1.2rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.8rem",
                    borderBottom: `1px solid ${panelBorder}`,
                    paddingBottom: "0.5rem",
                  }}
                >
                  <p
                    className="chess-mono"
                    style={{
                      fontSize: "0.68rem",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: `${text}80`,
                      margin: 0,
                    }}
                  >
                    AI Coach
                  </p>
                  <button
                    onClick={handleHint}
                    className="chess-mono"
                    style={{
                      fontSize: "0.6rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "0.3rem 0.6rem",
                      border: `1px solid ${text}`,
                      background: "transparent",
                      color: text,
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Get Hint
                  </button>
                </div>
                <div ref={coachRef} className="coach-scroll" style={{ maxHeight: 130, overflowY: "auto" }}>
                  {coachMessages.map((msg, i) => (
                    <p
                      key={i}
                      className="chess-serif-display"
                      style={{
                        fontSize: "0.95rem",
                        fontStyle: "italic",
                        lineHeight: 1.5,
                        margin: "0 0 0.5rem 0",
                        color: i === coachMessages.length - 1 ? text : `${text}65`,
                      }}
                    >
                      {msg}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {settingsOpen && (
          <div
            className="settings-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsPaused(false)
                setSettingsOpen(false)
              }
            }}
          >
            <div className="settings-modal" style={{ color: text }}>
              <div
                style={{
                  padding: "1.2rem 1.5rem",
                  borderBottom: `1px solid ${panelBorder}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  className="chess-mono"
                  style={{ fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase" }}
                >
                  Theme Gallery
                </span>
                <button
                  onClick={() => {
                    setIsPaused(false)
                    setSettingsOpen(false)
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    color: text,
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(Object.keys(UNIFIED_THEMES) as UnifiedThemeKey[]).map((key) => (
                  <div
                    key={key}
                    className={`style-opt${currentThemeKey === key ? " selected" : ""}`}
                    onClick={() => setCurrentThemeKey(key)}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        className="chess-mono"
                        style={{
                          fontSize: "0.75rem",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: currentThemeKey === key ? text : "transparent",
                            border: `1px solid ${text}`,
                          }}
                        ></span>
                        {UNIFIED_THEMES[key].name}
                      </span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <span
                          className="swatch-circle"
                          style={{ background: UNIFIED_THEMES[key].boardColors.pageBg }}
                        />
                        <span
                          className="swatch-circle"
                          style={{ background: UNIFIED_THEMES[key].boardColors.dark }}
                        />
                        <span
                          className="swatch-circle"
                          style={{ background: UNIFIED_THEMES[key].boardColors.light }}
                        />
                        <span
                          className="swatch-circle"
                          style={{ background: UNIFIED_THEMES[key].boardColors.selected }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {gameResult && (
          <div className="result-overlay">
            <div className="result-modal">
              <p
                className="chess-mono"
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: `${text}60`,
                  margin: "0 0 1.2rem 0",
                }}
              >
                {gameResult.reason}
              </p>
              <p
                className="chess-serif-display"
                style={{
                  fontSize: gameResult.winner === "Draw" ? "2.4rem" : "2.8rem",
                  fontStyle: "italic",
                  color: text,
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                {gameResult.winner === "Draw" ? "Draw" : gameResult.winner}
              </p>
              {gameResult.winner !== "Draw" && (
                <p
                  className="chess-serif-display"
                  style={{
                    fontSize: "1.1rem",
                    fontStyle: "italic",
                    color: `${text}70`,
                    margin: "0.5rem 0 0 0",
                  }}
                >
                  wins the game
                </p>
              )}
              <div
                style={{
                  width: 40,
                  height: 1,
                  background: `${text}25`,
                  margin: "1.8rem auto 0",
                }}
              />
              <button className="result-btn" onClick={resetGame}>
                New Game
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

