"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Chess, Square } from "chess.js"
import { Settings, X } from "lucide-react"

type UnifiedThemeKey = keyof typeof UNIFIED_THEMES
type GameResult = { winner: "White" | "Black" | "Draw"; reason: string }
type Screen = "menu" | "game"
type Lang = "en" | "ru" | "es" | "fr" | "de"
type Difficulty = "easy" | "medium" | "hard" | "master"

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    welcomeTo: "WELCOME TO", chooseGame: "choose your game",
    playFriend: "Play with Friend", playAI: "Play with AI",
    settings: "Settings", themeGallery: "Theme Gallery",
    language: "Language", difficulty: "Difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", master: "Master",
    easyDesc: "Casual play", mediumDesc: "Balanced", hardDesc: "Challenge", masterDesc: "Maximum",
    status: "Status", aiCoach: "AI Coach", ask: "Ask",
    moves: "Moves", pause: "Pause", newGame: "New",
    white: "White", black: "Black", thinking: "thinking",
    checkMsg: "in check", winsMsg: "wins.", drawMsg: "A draw.",
    byMsg: "by", checkmate: "checkmate", stalemate: "stalemate",
    draw: "draw", onTime: "on time", gameOver: "Game over",
    playAgain: "Play again", backMenu: "Back to menu",
    resume: "Resume", restart: "Restart", exitMenu: "Exit to menu",
    toMove: "to move", drawn: "Drawn.",
    welcome: "Welcome. Make your first move and let the game begin.",
    analyzing: "Analyzing...", moveFirst: "Make a move first.",
    aiUnavail: "AI Coach unavailable.", stockfish: "Stockfish",
  },
  ru: {
    welcomeTo: "ДОБРО ПОЖАЛОВАТЬ В", chooseGame: "выберите игру",
    playFriend: "Играть с другом", playAI: "Играть с ИИ",
    settings: "Настройки", themeGallery: "Галерея тем",
    language: "Язык", difficulty: "Сложность",
    easy: "Легко", medium: "Средне", hard: "Сложно", master: "Мастер",
    easyDesc: "Для новичков", mediumDesc: "Баланс", hardDesc: "Вызов", masterDesc: "Максимум",
    status: "Статус", aiCoach: "ИИ Тренер", ask: "Спросить",
    moves: "Ходы", pause: "Пауза", newGame: "Новая",
    white: "Белые", black: "Чёрные", thinking: "думает",
    checkMsg: "под шахом", winsMsg: "побеждают.", drawMsg: "Ничья.",
    byMsg: "путём", checkmate: "мат", stalemate: "пат",
    draw: "ничья", onTime: "по времени", gameOver: "Игра окончена",
    playAgain: "Играть снова", backMenu: "В главное меню",
    resume: "Продолжить", restart: "Заново", exitMenu: "Выйти в меню",
    toMove: "ходят", drawn: "Ничья.",
    welcome: "Добро пожаловать. Сделайте первый ход.",
    analyzing: "Анализирую...", moveFirst: "Сначала сделайте ход.",
    aiUnavail: "ИИ тренер недоступен.", stockfish: "Стокфиш",
  },
  es: {
    welcomeTo: "BIENVENIDO A", chooseGame: "elige tu juego",
    playFriend: "Jugar con amigo", playAI: "Jugar con IA",
    settings: "Ajustes", themeGallery: "Galería de temas",
    language: "Idioma", difficulty: "Dificultad",
    easy: "Fácil", medium: "Medio", hard: "Difícil", master: "Maestro",
    easyDesc: "Casual", mediumDesc: "Equilibrado", hardDesc: "Desafío", masterDesc: "Máximo",
    status: "Estado", aiCoach: "Entrenador IA", ask: "Preguntar",
    moves: "Movimientos", pause: "Pausa", newGame: "Nueva",
    white: "Blancas", black: "Negras", thinking: "pensando",
    checkMsg: "en jaque", winsMsg: "gana.", drawMsg: "Empate.",
    byMsg: "por", checkmate: "jaque mate", stalemate: "ahogado",
    draw: "empate", onTime: "por tiempo", gameOver: "Juego terminado",
    playAgain: "Jugar de nuevo", backMenu: "Volver al menú",
    resume: "Continuar", restart: "Reiniciar", exitMenu: "Salir al menú",
    toMove: "mueven", drawn: "Empate.",
    welcome: "Bienvenido. Haz tu primer movimiento.",
    analyzing: "Analizando...", moveFirst: "Haz un movimiento primero.",
    aiUnavail: "Entrenador IA no disponible.", stockfish: "Stockfish",
  },
  fr: {
    welcomeTo: "BIENVENUE À", chooseGame: "choisissez votre jeu",
    playFriend: "Jouer avec un ami", playAI: "Jouer contre l'IA",
    settings: "Paramètres", themeGallery: "Galerie de thèmes",
    language: "Langue", difficulty: "Difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", master: "Maître",
    easyDesc: "Décontracté", mediumDesc: "Équilibré", hardDesc: "Défi", masterDesc: "Maximum",
    status: "Statut", aiCoach: "Coach IA", ask: "Demander",
    moves: "Coups", pause: "Pause", newGame: "Nouveau",
    white: "Blancs", black: "Noirs", thinking: "réfléchit",
    checkMsg: "en échec", winsMsg: "gagne.", drawMsg: "Nulle.",
    byMsg: "par", checkmate: "échec et mat", stalemate: "pat",
    draw: "nulle", onTime: "au temps", gameOver: "Partie terminée",
    playAgain: "Rejouer", backMenu: "Retour au menu",
    resume: "Reprendre", restart: "Recommencer", exitMenu: "Quitter",
    toMove: "jouent", drawn: "Nulle.",
    welcome: "Bienvenue. Faites votre premier coup.",
    analyzing: "Analyse...", moveFirst: "Faites un coup d'abord.",
    aiUnavail: "Coach IA indisponible.", stockfish: "Stockfish",
  },
  de: {
    welcomeTo: "WILLKOMMEN BEI", chooseGame: "wähle dein Spiel",
    playFriend: "Mit Freund spielen", playAI: "Gegen KI spielen",
    settings: "Einstellungen", themeGallery: "Themengalerie",
    language: "Sprache", difficulty: "Schwierigkeit",
    easy: "Leicht", medium: "Mittel", hard: "Schwer", master: "Meister",
    easyDesc: "Entspannt", mediumDesc: "Ausgewogen", hardDesc: "Herausforderung", masterDesc: "Maximum",
    status: "Status", aiCoach: "KI Trainer", ask: "Fragen",
    moves: "Züge", pause: "Pause", newGame: "Neu",
    white: "Weiß", black: "Schwarz", thinking: "denkt",
    checkMsg: "im Schach", winsMsg: "gewinnt.", drawMsg: "Remis.",
    byMsg: "durch", checkmate: "Schachmatt", stalemate: "Patt",
    draw: "Remis", onTime: "auf Zeit", gameOver: "Spiel vorbei",
    playAgain: "Nochmal", backMenu: "Zurück zum Menü",
    resume: "Fortsetzen", restart: "Neustart", exitMenu: "Menü",
    toMove: "am Zug", drawn: "Remis.",
    welcome: "Willkommen. Mache deinen ersten Zug.",
    analyzing: "Analysiere...", moveFirst: "Mache zuerst einen Zug.",
    aiUnavail: "KI Trainer nicht verfügbar.", stockfish: "Stockfish",
  },
}

const LANG_NAMES: Record<Lang, string> = {
  en: "EN", ru: "RU", es: "ES", fr: "FR", de: "DE"
}

const DIFFICULTY_DEPTH: Record<Difficulty, number> = {
  easy: 1, medium: 5, hard: 10, master: 18
}

const DIFFICULTY_DOTS: Record<Difficulty, number> = {
  easy: 1, medium: 2, hard: 3, master: 4
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
  const [mounted, setMounted] = useState(false)
  const gameRef = useRef(new Chess())
  const [game, setGame] = useState(() => new Chess())
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [legalMoves, setLegalMoves] = useState<Square[]>([])
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [coachMessages, setCoachMessages] = useState<string[]>([])
  const [whiteTime, setWhiteTime] = useState(600)
  const [blackTime, setBlackTime] = useState(600)
  const [isGameActive, setIsGameActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [screen, setScreen] = useState<Screen>("menu")
  const [currentThemeKey, setCurrentThemeKey] = useLocalStorage<UnifiedThemeKey>("chess_theme_v15", "amberOak")
  const [lang, setLang] = useLocalStorage<Lang>("chess_lang", "en")
  const [difficulty, setDifficulty] = useLocalStorage<Difficulty>("chess_difficulty", "medium")
  const [gameMode, setGameMode] = useState<"pvp" | "pve">("pvp")
  const [pendingMode, setPendingMode] = useState<"pvp" | "pve">("pvp")
  const [isBotThinking, setIsBotThinking] = useState(false)
  const coachRef = useRef<HTMLDivElement>(null)

  const theme = UNIFIED_THEMES[currentThemeKey] ?? UNIFIED_THEMES.amberOak
  const isDark = currentThemeKey === "neonDusk"
  const tx = theme.coachUI.text
  const bg = theme.coachUI.bg
  const br = theme.coachUI.border
  const t = TRANSLATIONS[lang]

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (mounted) setCoachMessages([t.welcome]) }, [lang, mounted])
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
        setWhiteTime(p => { if (p <= 1) { setIsGameActive(false); setGameResult({ winner: "Black", reason: t.onTime }); return 0 } return p - 1 })
      } else {
        setBlackTime(p => { if (p <= 1) { setIsGameActive(false); setGameResult({ winner: "White", reason: t.onTime }); return 0 } return p - 1 })
      }
    }, 1000)
    return () => clearInterval(id)
  }, [isGameActive, game, isPaused, t])

  useEffect(() => {
    if (screen !== "game" || gameMode !== "pve" || !isGameActive || isPaused || game.isGameOver() || game.turn() !== "b" || isBotThinking) return
    const go = async () => {
      setIsBotThinking(true)
      try {
        const cur = gameRef.current
        const depth = DIFFICULTY_DEPTH[difficulty]
        const res = await fetch(`https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(cur.fen())}&depth=${depth}`)
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
            addCoach(`${t.stockfish}: ${mv.san}`)
            if (next.isCheckmate()) endGame({ winner: "White", reason: t.checkmate }, next.history().length)
            else if (next.isDraw() || next.isStalemate()) endGame({ winner: "Draw", reason: t.draw }, next.history().length)
          }
        }
      } catch {}
      setIsBotThinking(false)
    }
    const delay = difficulty === "easy" ? 300 : difficulty === "medium" ? 600 : difficulty === "hard" ? 900 : 1400
    const timer = setTimeout(go, delay)
    return () => clearTimeout(timer)
  }, [game, gameMode, screen, isGameActive, isPaused, isBotThinking, difficulty, t])

  const endGame = useCallback((result: GameResult, _: number) => {
    setGameResult(result); setIsGameActive(false)
  }, [])

  const addCoach = useCallback((msg: string) => setCoachMessages(p => [...p, msg]), [])

  const handleAskAI = async () => {
    if (game.history().length === 0) { addCoach(t.moveFirst); return }
    addCoach(t.analyzing)
    try {
      const res = await fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ history: game.history(), lang }) })
      const data = await res.json()
      setCoachMessages(p => { const n = [...p]; n[n.length - 1] = "— " + data.comment.replace(/\*/g, ""); return n })
    } catch { addCoach(t.aiUnavail) }
  }

  const resetGame = useCallback(() => {
    const fresh = new Chess(); gameRef.current = fresh; setGame(fresh)
    setSelectedSquare(null); setLegalMoves([]); setMoveHistory([])
    setCoachMessages([t.welcome])
    setWhiteTime(600); setBlackTime(600); setIsGameActive(false)
    setIsPaused(false); setLastMove(null); setGameResult(null); setIsBotThinking(false)
  }, [t])

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
          if (!isGameActive) setIsGameActive(true)
          setLastMove({ from: selectedSquare, to: square })
          setMoveHistory(next.history())
          addCoach(`${mv.san}${next.isCheck() ? ` — ${game.turn() === "w" ? t.black : t.white} ${t.checkMsg}!` : ""}`)
          if (next.isCheckmate()) endGame({ winner: next.turn() === "w" ? "Black" : "White", reason: t.checkmate }, next.history().length)
          else if (next.isStalemate()) endGame({ winner: "Draw", reason: t.stalemate }, next.history().length)
          else if (next.isDraw()) endGame({ winner: "Draw", reason: t.draw }, next.history().length)
          gameRef.current = next; setGame(next)
        }
      } catch {}
    }
    setSelectedSquare(null); setLegalMoves([])
  }, [game, selectedSquare, legalMoves, isGameActive, isPaused, gameMode, isBotThinking, addCoach, endGame, t])

  const sqStyle = (file: string, rank: string, sq: Square): React.CSSProperties => {
    const isL = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
    let hi = ""
    if (selectedSquare === sq) hi = theme.boardColors.selected
    if (lastMove && (lastMove.from === sq || lastMove.to === sq)) hi = isL ? theme.boardColors.lastLight : theme.boardColors.lastDark
    if (theme.boardImageUrl) return { backgroundImage: hi ? `linear-gradient(${hi},${hi}),url("${theme.boardImageUrl}")` : `url("${theme.boardImageUrl}")`, backgroundSize: "100% 200%", backgroundPosition: isL ? "top" : "bottom", transition: "all .2s" }
    return { backgroundColor: hi || (isL ? theme.boardColors.light : theme.boardColors.dark), transition: "background-color .2s" }
  }

  const isWA = game.turn() === "w" && isGameActive && !isPaused
  const isBA = game.turn() === "b" && isGameActive && !isPaused

  if (!mounted) return <div style={{ minHeight: "100vh", background: "#FDF5E6" }} />

  const FONTS = "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Mono:wght@300;400&family=DM+Serif+Display:ital@0;1&display=swap"
  const BASE = `@import url('${FONTS}');*{box-sizing:border-box;margin:0;padding:0;}.fm{font-family:'DM Mono',monospace;}.fs{font-family:'DM Serif Display',serif;}.fb{font-family:'EB Garamond',serif;}`

  // ── SETTINGS MODAL (only theme + language, in-game adds actions) ──
  const SettingsModal = ({ onClose, inGame }: { onClose: () => void; inGame?: boolean }) => (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(26,25,22,.3)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.boardColors.pageBg, border: `1px solid ${br}`, width: 360, maxWidth: "92vw", borderRadius: 6, overflow: "hidden", color: tx }}>
        <div style={{ padding: "1.1rem 1.4rem", borderBottom: `1px solid ${br}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="fm" style={{ fontSize: ".72rem", letterSpacing: ".18em", textTransform: "uppercase", opacity: .5 }}>{t.settings}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: tx, opacity: .38, display: "flex" }}><X size={16} /></button>
        </div>
        {/* Theme */}
        <div style={{ padding: ".9rem 1.4rem", borderBottom: `1px solid ${br}` }}>
          <p className="fm" style={{ fontSize: ".6rem", letterSpacing: ".2em", textTransform: "uppercase", opacity: .35, marginBottom: ".65rem" }}>{t.themeGallery}</p>
          {(Object.keys(UNIFIED_THEMES) as UnifiedThemeKey[]).map(key => (
            <div key={key} onClick={() => setCurrentThemeKey(key)}
              style={{ padding: ".65rem 0", cursor: "pointer", display: "flex", alignItems: "center", gap: ".75rem", opacity: currentThemeKey === key ? 1 : .5, transition: "opacity .15s" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: currentThemeKey === key ? tx : "transparent", border: `1px solid ${tx}50`, display: "inline-block", flexShrink: 0 }} />
              <span className="fm" style={{ fontSize: ".72rem", letterSpacing: ".1em", textTransform: "uppercase" }}>{UNIFIED_THEMES[key].name}</span>
            </div>
          ))}
        </div>
        {/* Language */}
        <div style={{ padding: ".9rem 1.4rem", borderBottom: inGame ? `1px solid ${br}` : "none" }}>
          <p className="fm" style={{ fontSize: ".6rem", letterSpacing: ".2em", textTransform: "uppercase", opacity: .35, marginBottom: ".65rem" }}>{t.language}</p>
          <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
            {(Object.keys(LANG_NAMES) as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                style={{ fontFamily: "'DM Mono',monospace", fontSize: ".65rem", letterSpacing: ".1em", textTransform: "uppercase", padding: ".45rem .75rem", border: `1px solid ${lang === l ? tx + "80" : tx + "22"}`, background: lang === l ? `${tx}0e` : "transparent", color: tx, borderRadius: 3, cursor: "pointer", opacity: lang === l ? 1 : .5, transition: "all .2s" }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {/* In-game actions */}
        {inGame && (
          <div style={{ padding: ".9rem 1.4rem", display: "flex", flexDirection: "column", gap: ".4rem" }}>
            <button onClick={() => { setIsPaused(false); onClose() }}
              style={{ fontFamily: "'DM Mono',monospace", fontSize: ".68rem", letterSpacing: ".15em", textTransform: "uppercase", background: "none", border: `1px solid ${tx}22`, color: tx, padding: ".78rem", borderRadius: 3, cursor: "pointer", transition: "all .2s" }}>{t.resume}</button>
            <button onClick={() => { resetGame(); setIsPaused(false); onClose() }}
              style={{ fontFamily: "'DM Mono',monospace", fontSize: ".68rem", letterSpacing: ".15em", textTransform: "uppercase", background: "none", border: `1px solid ${tx}22`, color: tx, padding: ".78rem", borderRadius: 3, cursor: "pointer", transition: "all .2s" }}>{t.restart}</button>
            <button onClick={() => { resetGame(); setIsPaused(false); onClose(); setScreen("menu") }}
              style={{ fontFamily: "'DM Mono',monospace", fontSize: ".68rem", letterSpacing: ".15em", textTransform: "uppercase", background: "none", border: `1px solid ${tx}22`, color: tx, padding: ".78rem", borderRadius: 3, cursor: "pointer", transition: "all .2s" }}>{t.exitMenu}</button>
          </div>
        )}
      </div>
    </div>
  )

  // ── MENU ──
  if (screen === "menu") return (
    <>
      <style>{BASE + `
        .root{min-height:100vh;background:${theme.boardColors.pageBg};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;color:${tx};}
        .mbtn{display:block;width:100%;max-width:280px;font-family:'DM Mono',monospace;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;background:none;border:1px solid ${tx}28;color:${tx};padding:.85rem 1.5rem;border-radius:3px;cursor:pointer;transition:all .2s;text-align:center;}
        .mbtn:hover{border-color:${tx}60;background:${tx}06;}
        .mbtn.hi{border-color:${tx}50;}
        .mbtn.active{border-color:${tx}80;background:${tx}0a;}
        .dcard{width:100%;max-width:280px;border:1px solid ${tx}18;border-radius:3px;overflow:hidden;}
        .drow{display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;cursor:pointer;transition:all .2s;border-bottom:1px solid ${tx}10;}
        .drow:last-child{border-bottom:none;}
        .drow:hover{background:${tx}06;}
        .drow.sel{background:${tx}0a;border-left:2px solid ${tx}60;}
      `}</style>
      <div className="root">
        <p className="fm" style={{ fontSize: ".58rem", letterSpacing: ".4em", textTransform: "uppercase", opacity: .32, marginBottom: ".5rem" }}>{t.welcomeTo}</p>
        <h1 className="fs" style={{ fontSize: "clamp(3.5rem,12vw,6rem)", fontStyle: "italic", lineHeight: 1, color: tx }}>Chess</h1>
        <p className="fb" style={{ fontSize: "1rem", fontStyle: "italic", opacity: .38, marginTop: ".4rem", marginBottom: "2.5rem" }}>{t.chooseGame}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: ".6rem", alignItems: "center", width: "100%" }}>
          {/* Mode buttons */}
          <div style={{ display: "flex", gap: ".5rem", width: "100%", maxWidth: 280 }}>
            <button className={`mbtn hi${pendingMode === "pvp" ? " active" : ""}`}
              style={{ flex: 1, fontSize: ".65rem" }}
              onClick={() => setPendingMode("pvp")}>
              {t.playFriend}
            </button>
            <button className={`mbtn hi${pendingMode === "pve" ? " active" : ""}`}
              style={{ flex: 1, fontSize: ".65rem" }}
              onClick={() => setPendingMode("pve")}>
              {t.playAI}
            </button>
          </div>

          {/* Difficulty selector — only when pve selected */}
          {pendingMode === "pve" && (
            <div className="dcard" style={{ marginTop: ".2rem" }}>
              {(["easy", "medium", "hard", "master"] as Difficulty[]).map(d => (
                <div key={d} className={`drow${difficulty === d ? " sel" : ""}`} onClick={() => setDifficulty(d)}>
                  <div style={{ display: "flex", flexDirection: "column", gap: ".2rem" }}>
                    <span className="fm" style={{ fontSize: ".68rem", letterSpacing: ".12em", textTransform: "uppercase" }}>{t[d]}</span>
                    <span className="fm" style={{ fontSize: ".54rem", opacity: .38 }}>{t[`${d}Desc`]}</span>
                  </div>
                  <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i < DIFFICULTY_DOTS[d] ? tx : "transparent", border: `1px solid ${tx}40`, display: "inline-block", transition: "background .2s" }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Start button */}
          <button className="mbtn hi" style={{ marginTop: ".4rem", background: `${tx}08`, borderColor: `${tx}60` }}
            onClick={() => { setGameMode(pendingMode); resetGame(); setScreen("game") }}>
            {pendingMode === "pve" ? `▶  ${t.playAI} · ${t[difficulty]}` : `▶  ${t.playFriend}`}
          </button>

          <button className="mbtn" onClick={() => setSettingsOpen(true)}>{t.settings}</button>
        </div>

        {/* Theme dots */}
        <div style={{ display: "flex", gap: "8px", marginTop: "2rem" }}>
          {(Object.keys(UNIFIED_THEMES) as UnifiedThemeKey[]).map(k => (
            <span key={k} onClick={() => setCurrentThemeKey(k)} style={{ width: 13, height: 13, borderRadius: "50%", background: UNIFIED_THEMES[k].boardColors.dark, border: `2px solid ${currentThemeKey === k ? tx : "transparent"}`, cursor: "pointer", display: "inline-block" }} />
          ))}
        </div>

        {/* Language quick-pick */}
        <div style={{ display: "flex", gap: ".35rem", marginTop: "1rem" }}>
          {(Object.keys(LANG_NAMES) as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={{ fontFamily: "'DM Mono',monospace", fontSize: ".56rem", letterSpacing: ".1em", textTransform: "uppercase", padding: ".28rem .48rem", border: `1px solid ${lang === l ? tx + "70" : tx + "18"}`, background: lang === l ? `${tx}0e` : "transparent", color: tx, borderRadius: 3, cursor: "pointer", opacity: lang === l ? 1 : .38, transition: "all .2s" }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  )

  // ── GAME ──
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
        .dot{position:absolute;width:26%;height:26%;border-radius:50%;background:${isDark ? "rgba(255,255,255,.3)" : "rgba(0,0,0,.24)"};pointer-events:none;z-index:3;}
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
        .blay{position:fixed;inset:0;z-index:200;background:${isDark ? "rgba(0,0,0,.75)" : "rgba(26,25,22,.35)"};backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;}
        .rmod{background:${theme.boardColors.pageBg};border:1px solid ${br};padding:2.5rem 2rem;border-radius:6px;text-align:center;width:290px;max-width:90vw;}
        .pbtn{width:100%;font-family:'DM Mono',monospace;font-size:.68rem;letter-spacing:.15em;text-transform:uppercase;background:none;border:1px solid ${tx}22;color:${tx};padding:.78rem;border-radius:3px;cursor:pointer;transition:all .2s;margin-bottom:.4rem;}
        .pbtn:hover{border-color:${tx}52;background:${tx}06;}
      `}</style>
      <div className="gw">
        <div className="gl">
          <div className="bc">
            <div className="prow">
              <span className="fm" style={{ fontSize: ".68rem", letterSpacing: ".1em", textTransform: "uppercase", opacity: isBA ? 1 : .42, display: "flex", alignItems: "center", gap: ".4rem" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2d2d2d", border: `1.5px solid ${tx}38`, display: "inline-block" }} />
                {t.black} {isBotThinking && gameMode === "pve" && <span style={{ opacity: .38, fontSize: ".54rem" }}>({t.thinking})</span>}
              </span>
              <span className="fm" style={{ fontSize: "1rem", opacity: isBA ? 1 : .32 }}>{fmt(blackTime)}</span>
            </div>
            <div className="bw">
              <div className="bgrid">
                {RANKS.map(rank => FILES.map(file => {
                  const sq = `${file}${rank}` as Square
                  const piece = game.get(sq)
                  const isL = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
                  const url = piece ? getPieceUrl(piece.color, piece.type, theme) : null
                  return (
                    <button key={sq} className="sq" onClick={() => handleSquareClick(sq)} style={sqStyle(file, rank, sq)} disabled={isBotThinking}>
                      {url && <img src={url} alt="" style={{ width: "84%", height: "84%", zIndex: 2, filter: theme.pieceFilter }} />}
                      {legalMoves.includes(sq) && (piece ? <span className="ring" /> : <span className="dot" />)}
                      {file === "a" && <span className="coord" style={{ top: 3, left: 4, color: isL ? theme.boardColors.dark : theme.boardColors.light }}>{rank}</span>}
                      {rank === "1" && <span className="coord" style={{ bottom: 3, right: 4, color: isL ? theme.boardColors.dark : theme.boardColors.light }}>{file}</span>}
                    </button>
                  )
                }))}
              </div>
            </div>
            <div className="prow">
              <span className="fm" style={{ fontSize: ".68rem", letterSpacing: ".1em", textTransform: "uppercase", opacity: isWA ? 1 : .42, display: "flex", alignItems: "center", gap: ".4rem" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f5f0e8", border: `1.5px solid ${tx}25`, display: "inline-block" }} />
                {t.white}
              </span>
              <span className="fm" style={{ fontSize: "1rem", opacity: isWA ? 1 : .32 }}>{fmt(whiteTime)}</span>
            </div>
          </div>

          <div className="pc">
            <div className="card">
              <div className="chd">
                <span className="lbl">{t.status}</span>
                <button onClick={() => { setIsPaused(true); setSettingsOpen(true) }} style={{ background: "none", border: "none", cursor: "pointer", color: tx, opacity: .35, display: "flex", padding: 0 }}>
                  <Settings size={14} />
                </button>
              </div>
              <div className="fs" style={{ fontSize: "1rem", fontStyle: "italic", padding: ".65rem .9rem", lineHeight: 1.4, color: tx }}>
                {game.isCheckmate() ? `${game.turn() === "w" ? t.black : t.white} ${t.winsMsg}` : game.isDraw() ? t.drawn : game.isCheck() ? `${game.turn() === "w" ? t.white : t.black} ${t.checkMsg}` : `${game.turn() === "w" ? t.white : t.black} ${t.toMove}`}
              </div>
              {gameMode === "pve" && (
                <div style={{ padding: ".2rem .9rem .6rem", display: "flex", gap: 4, alignItems: "center" }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i < DIFFICULTY_DOTS[difficulty] ? `${tx}70` : "transparent", border: `1px solid ${tx}30`, display: "inline-block" }} />
                  ))}
                  <span className="fm" style={{ fontSize: ".54rem", opacity: .35, marginLeft: 4, letterSpacing: ".1em", textTransform: "uppercase" }}>{t[difficulty]}</span>
                </div>
              )}
            </div>

            <div className="card">
              <div className="chd">
                <span className="lbl">{t.aiCoach}</span>
                <button onClick={handleAskAI} style={{ fontFamily: "'DM Mono',monospace", fontSize: ".55rem", letterSpacing: ".1em", textTransform: "uppercase", padding: ".22rem .5rem", border: `1px solid ${tx}28`, background: "transparent", color: tx, borderRadius: "3px", cursor: "pointer" }}>{t.ask}</button>
              </div>
              <div className="cscroll" ref={coachRef}>
                {coachMessages.map((msg, i) => (
                  <p key={i} className="fb" style={{ fontSize: ".88rem", fontStyle: "italic", lineHeight: 1.45, marginBottom: ".3rem", color: i === coachMessages.length - 1 ? tx : `${tx}42` }}>{msg}</p>
                ))}
              </div>
            </div>

            {moveHistory.length > 0 && (
              <div className="card">
                <div className="chd">
                  <span className="lbl">{t.moves}</span>
                  <span className="fm" style={{ fontSize: ".55rem", opacity: .3 }}>{moveHistory.length}</span>
                </div>
                <div className="mwrap">
                  {moveHistory.map((m, i) => (
                    <span key={i} className="fm" style={{ fontSize: ".58rem", opacity: i === moveHistory.length - 1 ? 1 : .42 }}>
                      {i % 2 === 0 && <span style={{ opacity: .25 }}>{Math.floor(i / 2) + 1}.</span>}{m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="arow">
              <button className="abtn2" onClick={() => { setIsPaused(true); setSettingsOpen(true) }}>{t.pause}</button>
              <button className="abtn2" onClick={resetGame}>{t.newGame}</button>
            </div>
          </div>
        </div>

        {gameResult && (
          <div className="blay">
            <div className="rmod" style={{ color: tx }}>
              <p className="fm" style={{ fontSize: ".58rem", letterSpacing: ".25em", textTransform: "uppercase", opacity: .32, marginBottom: ".5rem" }}>{t.gameOver}</p>
              <p className="fs" style={{ fontSize: "1.8rem", fontStyle: "italic", lineHeight: 1.1, marginBottom: ".3rem" }}>
                {gameResult.winner === "Draw" ? t.drawMsg : `${gameResult.winner === "White" ? t.white : t.black} ${t.winsMsg}`}
              </p>
              <p className="fb" style={{ fontStyle: "italic", opacity: .38, marginBottom: "2rem" }}>{t.byMsg} {gameResult.reason}</p>
              <button className="pbtn" onClick={resetGame}>{t.playAgain}</button>
              <button className="pbtn" onClick={() => { resetGame(); setScreen("menu") }}>{t.backMenu}</button>
            </div>
          </div>
        )}

        {settingsOpen && <SettingsModal onClose={() => { setIsPaused(false); setSettingsOpen(false) }} inGame />}
      </div>
    </>
  )
}
