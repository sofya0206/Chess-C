"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Chess, Square } from "chess.js"
import { Settings, X, ChevronRight, ChevronLeft } from "lucide-react"

type UnifiedThemeKey = keyof typeof UNIFIED_THEMES
type GameResult = { winner: "White" | "Black" | "Draw"; reason: string }
type Screen = "menu" | "game" | "learn"
type Lang = "en" | "ru"
type Difficulty = "easy" | "medium" | "hard" | "master"
type LearnTab = "rules" | "tutorial"

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    welcomeTo: "WELCOME TO", chooseGame: "choose your game",
    playFriend: "Play with Friend", playAI: "Play with AI",
    learn: "Learn Chess",
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
    rulesTab: "Rules", tutorialTab: "Tutorial",
    backToMenu: "← Back to menu",
    next: "Next", prev: "Previous", startOver: "Start over",
    tutorialDone: "You completed the tutorial!",
    tryItYourself: "Now try it yourself →",
  },
  ru: {
    welcomeTo: "ДОБРО ПОЖАЛОВАТЬ В", chooseGame: "выберите игру",
    playFriend: "Играть с другом", playAI: "Играть с ИИ",
    learn: "Обучение",
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
    rulesTab: "Правила", tutorialTab: "Тренировка",
    backToMenu: "← В меню",
    next: "Далее", prev: "Назад", startOver: "Сначала",
    tutorialDone: "Урок завершён!",
    tryItYourself: "Попробуй сам →",
  },
}

const RULES: Record<Lang, { title: string; icon: string; text: string }[]> = {
  en: [
    {
      icon: "♟", title: "The Board",
      text: "Chess is played on an 8×8 board with 64 squares alternating between light and dark. Each player starts with 16 pieces: 1 king, 1 queen, 2 rooks, 2 bishops, 2 knights, and 8 pawns. White always moves first.",
    },
    {
      icon: "♚", title: "The King",
      text: "The king moves one square in any direction. The goal of the game is to checkmate your opponent's king — put it in a position where it is under attack and cannot escape. If your king is in check, you must resolve it immediately.",
    },
    {
      icon: "♛", title: "The Queen",
      text: "The queen is the most powerful piece. She can move any number of squares in any direction — horizontally, vertically, or diagonally. Protect your queen and use her wisely.",
    },
    {
      icon: "♜", title: "The Rook",
      text: "The rook moves any number of squares horizontally or vertically. Rooks are most powerful on open files (columns with no pawns). Two rooks working together can be devastating.",
    },
    {
      icon: "♝", title: "The Bishop",
      text: "The bishop moves any number of squares diagonally. Each player has two bishops: one on light squares and one on dark squares. A bishop always stays on the same colour throughout the game.",
    },
    {
      icon: "♞", title: "The Knight",
      text: "The knight moves in an L-shape: two squares in one direction and then one square perpendicular. Knights are the only pieces that can jump over other pieces. This makes them especially useful in crowded positions.",
    },
    {
      icon: "♙", title: "The Pawn",
      text: "Pawns move forward one square, but capture diagonally. On their first move, pawns may advance two squares. If a pawn reaches the opposite end of the board, it promotes to any piece (usually a queen). Pawns are small but mighty!",
    },
    {
      icon: "⚡", title: "Special Moves",
      text: "Castling: the king moves two squares toward a rook, and the rook jumps to the other side. En passant: a pawn that has just advanced two squares can be captured by an opposing pawn as if it had moved only one. These moves have specific conditions — learn them well!",
    },
    {
      icon: "🏁", title: "Winning & Drawing",
      text: "You win by checkmate. The game is drawn by stalemate (no legal moves but not in check), threefold repetition, the 50-move rule, or mutual agreement. A draw is often a good result for the weaker side!",
    },
  ],
  ru: [
    {
      icon: "♟", title: "Доска",
      text: "Шахматы играются на доске 8×8, состоящей из 64 чередующихся светлых и тёмных клеток. У каждого игрока 16 фигур: 1 король, 1 ферзь, 2 ладьи, 2 слона, 2 коня и 8 пешек. Белые всегда ходят первыми.",
    },
    {
      icon: "♚", title: "Король",
      text: "Король ходит на одну клетку в любом направлении. Цель игры — поставить мат королю противника: атаковать его так, чтобы он не мог спастись. Если ваш король под шахом — вы обязаны немедленно его защитить.",
    },
    {
      icon: "♛", title: "Ферзь",
      text: "Ферзь — самая сильная фигура. Он ходит на любое количество клеток в любом направлении: по горизонтали, вертикали и диагоналям. Берегите ферзя и используйте его с умом.",
    },
    {
      icon: "♜", title: "Ладья",
      text: "Ладья ходит на любое количество клеток по горизонтали или вертикали. Ладьи сильнее всего на открытых вертикалях (без пешек). Две ладьи вместе могут быть очень опасны.",
    },
    {
      icon: "♝", title: "Слон",
      text: "Слон ходит на любое количество клеток по диагонали. У каждого игрока два слона: один на светлых клетках, другой на тёмных. Слон всегда остаётся на клетках одного цвета.",
    },
    {
      icon: "♞", title: "Конь",
      text: "Конь ходит буквой «Г»: две клетки в одну сторону и одна перпендикулярно. Конь — единственная фигура, которая может перепрыгивать через другие. Это делает его особенно ценным в стеснённых позициях.",
    },
    {
      icon: "♙", title: "Пешка",
      text: "Пешки ходят вперёд на одну клетку, а бьют по диагонали. При первом ходе пешка может пойти на две клетки. Если пешка доходит до последней горизонтали, она превращается в любую фигуру (обычно в ферзя). Маленькая, но грозная!",
    },
    {
      icon: "⚡", title: "Специальные ходы",
      text: "Рокировка: король перемещается на две клетки к ладье, а ладья перепрыгивает на другую сторону. Взятие на проходе: пешка, только что прошедшая две клетки, может быть взята вражеской пешкой, как если бы она прошла одну. У этих ходов есть специальные условия!",
    },
    {
      icon: "🏁", title: "Победа и ничья",
      text: "Победа достигается матом. Ничья возможна при пате (нет ходов, но нет и шаха), троекратном повторении позиции, правиле 50 ходов или по соглашению сторон. Для более слабой стороны ничья часто является хорошим результатом!",
    },
  ],
}

// Interactive tutorial steps
type TutorialStep = {
  fen: string
  titleEn: string; titleRu: string
  textEn: string; textRu: string
  hint: Square[]         // squares to highlight
  expectedFrom: Square
  expectedTo: Square
  autoPlay?: { from: Square; to: Square }  // opponent response
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    titleEn: "Step 1 — Open with a Pawn",
    titleRu: "Шаг 1 — Открытие пешкой",
    textEn: "The best way to start a game is to control the centre. Move the pawn from e2 to e4. This opens lines for your bishop and queen.",
    textRu: "Лучший способ начать игру — захватить центр. Переместите пешку с e2 на e4. Это откроет линии для слона и ферзя.",
    hint: ["e2", "e4"],
    expectedFrom: "e2", expectedTo: "e4",
    autoPlay: { from: "e7", to: "e5" },
  },
  {
    fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    titleEn: "Step 2 — Develop a Knight",
    titleRu: "Шаг 2 — Развитие коня",
    textEn: "Develop your pieces early! Move the knight from g1 to f3. It attacks the centre and gets ready to defend your king.",
    textRu: "Развивайте фигуры как можно раньше! Переместите коня с g1 на f3. Он атакует центр и готовится защищать короля.",
    hint: ["g1", "f3"],
    expectedFrom: "g1", expectedTo: "f3",
    autoPlay: { from: "b8", to: "c6" },
  },
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    titleEn: "Step 3 — Develop a Bishop",
    titleRu: "Шаг 3 — Развитие слона",
    textEn: "Bring out your bishop! Move it from f1 to c4. From here it eyes the centre and puts pressure on the f7 square — a key weakness near the black king.",
    textRu: "Выведите слона! Переместите его с f1 на c4. Отсюда он смотрит в центр и давит на поле f7 — ключевую слабость рядом с чёрным королём.",
    hint: ["f1", "c4"],
    expectedFrom: "f1", expectedTo: "c4",
    autoPlay: { from: "f8", to: "c5" },
  },
  {
    fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    titleEn: "Step 4 — Castle to Safety",
    titleRu: "Шаг 4 — Рокировка",
    textEn: "Castle kingside! Move the king from e1 to g1. This tucks your king safely behind pawns and connects your rooks. Click the king on e1.",
    textRu: "Сделайте рокировку в сторону короля! Переместите короля с e1 на g1. Это спрячет короля за пешками и соединит ладьи. Нажмите на короля e1.",
    hint: ["e1", "g1"],
    expectedFrom: "e1", expectedTo: "g1",
    autoPlay: { from: "e8", to: "g8" },
  },
  {
    fen: "r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w - - 6 5",
    titleEn: "Step 5 — Control the Centre",
    titleRu: "Шаг 5 — Контроль центра",
    textEn: "Advance the d-pawn from d2 to d3. This supports your e4 pawn and gives your pieces more room to operate. Controlling the centre is the key to a good game!",
    textRu: "Продвиньте пешку d с d2 на d3. Это поддержит пешку e4 и даст фигурам больше пространства. Контроль центра — ключ к хорошей игре!",
    hint: ["d2", "d3"],
    expectedFrom: "d2", expectedTo: "d3",
    autoPlay: { from: "d7", to: "d6" },
  },
]

const DIFFICULTY_DEPTH: Record<Difficulty, number> = { easy: 1, medium: 3, hard: 6, master: 10 }
const DIFFICULTY_DOTS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3, master: 4 }

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]
const SKAK = "https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/{color}{piece}.svg"

const UNIFIED_THEMES = {
  arcticCobalt: {
    name: "Arctic Cobalt", boardImageUrl: "/aluminium.png",
    boardColors: { light: "#A3B8CC", dark: "#4C5A66", pageBg: "#EAF4FC", lastLight: "rgba(23,59,240,0.3)", lastDark: "rgba(23,59,240,0.4)", selected: "rgba(23,59,240,0.6)" },
    coachUI: { bg: "#FFFFFF", border: "rgba(60,69,75,0.15)", text: "#1a1916" },
    pieceFilter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))", pieceSetUrl: SKAK,
  },
  amberOak: {
    name: "Amber Oak", boardImageUrl: "/wood.png",
    boardColors: { light: "#EBDDCB", dark: "#614332", pageBg: "#FDF5E6", lastLight: "rgba(214,176,57,0.4)", lastDark: "rgba(214,176,57,0.5)", selected: "rgba(214,176,57,0.7)" },
    coachUI: { bg: "#FFFDF7", border: "rgba(97,67,50,0.15)", text: "#3d2b1f" },
    pieceFilter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))", pieceSetUrl: SKAK,
  },
  neonDusk: {
    name: "Neon Dusk", boardImageUrl: "",
    boardColors: { light: "#2C3341", dark: "#1D222B", pageBg: "#161920", lastLight: "#3D4452", lastDark: "#2E333C", selected: "rgba(0,240,255,0.4)" },
    coachUI: { bg: "#1D222B", border: "rgba(255,255,255,0.08)", text: "#e5e5e5" },
    pieceFilter: "invert(1) hue-rotate(180deg) brightness(2) drop-shadow(0 0 6px #00F0FF)", pieceSetUrl: SKAK,
  },
  softSmoke: {
    name: "Soft Smoke", boardImageUrl: "/marble.png",
    boardColors: { light: "#E3C8C8", dark: "#7E8E99", pageBg: "#DFE2E5", lastLight: "rgba(237,121,121,0.4)", lastDark: "rgba(237,121,121,0.5)", selected: "rgba(237,121,121,0.7)" },
    coachUI: { bg: "#FFFFFF", border: "rgba(142,156,165,0.18)", text: "#4a555e" },
    pieceFilter: "opacity(0.85) drop-shadow(0 2px 4px rgba(0,0,0,0.12))", pieceSetUrl: SKAK,
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

// ─────────────────────────────────────────────
// LEARN SCREEN
// ─────────────────────────────────────────────
function LearnScreen({ theme, lang, onBack }: {
  theme: (typeof UNIFIED_THEMES)[UnifiedThemeKey]
  lang: Lang
  onBack: () => void
}) {
  const [tab, setTab] = useState<LearnTab>("rules")
  const [ruleIdx, setRuleIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [tutDone, setTutDone] = useState(false)
  const [tutGame, setTutGame] = useState(() => new Chess(TUTORIAL_STEPS[0].fen))
  const [selected, setSelected] = useState<Square | null>(null)
  const [legalMoves, setLegalMoves] = useState<Square[]>([])
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null)
  const [feedback, setFeedback] = useState<"" | "wrong" | "correct">("")
  const [waitingBot, setWaitingBot] = useState(false)

  const tx = theme.coachUI.text
  const bg = theme.coachUI.bg
  const br = theme.coachUI.border
  const isDark = false
  const rules = RULES[lang]
  const step = TUTORIAL_STEPS[stepIdx]

  const FONTS = "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Mono:wght@300;400&family=DM+Serif+Display:ital@0;1&display=swap"
  const BASE = `@import url('${FONTS}');*{box-sizing:border-box;margin:0;padding:0;}.fm{font-family:'DM Mono',monospace;}.fs{font-family:'DM Serif Display',serif;}.fb{font-family:'EB Garamond',serif;}`

  const loadStep = (idx: number) => {
    setStepIdx(idx)
    setTutGame(new Chess(TUTORIAL_STEPS[idx].fen))
    setSelected(null); setLegalMoves([]); setLastMove(null)
    setFeedback(""); setTutDone(false); setWaitingBot(false)
  }

  const handleTutorialClick = (sq: Square) => {
    if (waitingBot || tutDone) return
    const piece = tutGame.get(sq)

    if (piece && piece.color === "w") {
      setSelected(sq)
      setLegalMoves(tutGame.moves({ square: sq, verbose: true }).map(m => m.to as Square))
      setFeedback("")
      return
    }

    if (selected && legalMoves.includes(sq)) {
      if (selected === step.expectedFrom && sq === step.expectedTo) {
        // Correct move
        const next = new Chess(tutGame.fen())
        next.move({ from: selected, to: sq, promotion: "q" })
        setTutGame(next)
        setLastMove({ from: selected, to: sq })
        setSelected(null); setLegalMoves([])
        setFeedback("correct")

        // Bot responds
        if (step.autoPlay) {
          setWaitingBot(true)
          setTimeout(() => {
            const next2 = new Chess(next.fen())
            next2.move({ from: step.autoPlay!.from, to: step.autoPlay!.to, promotion: "q" })
            setTutGame(next2)
            setLastMove({ from: step.autoPlay!.from, to: step.autoPlay!.to })
            setWaitingBot(false)
            if (stepIdx < TUTORIAL_STEPS.length - 1) {
              setTimeout(() => loadStep(stepIdx + 1), 800)
            } else {
              setTutDone(true)
            }
          }, 900)
        } else {
          if (stepIdx < TUTORIAL_STEPS.length - 1) {
            setTimeout(() => loadStep(stepIdx + 1), 600)
          } else {
            setTutDone(true)
          }
        }
      } else {
        setFeedback("wrong")
        setSelected(null); setLegalMoves([])
      }
      return
    }
    setSelected(null); setLegalMoves([])
  }

  const sqStyleLearn = (file: string, rank: string, sq: Square) => {
    const isL = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
    const isHint = step.hint.includes(sq) && !tutDone
    const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq)
    const isSel = selected === sq

    let base: React.CSSProperties = {}
    if (theme.boardImageUrl) {
      base = { backgroundImage: `url("${theme.boardImageUrl}")`, backgroundSize: "100% 200%", backgroundPosition: isL ? "top" : "bottom" }
    } else {
      base = { backgroundColor: isL ? theme.boardColors.light : theme.boardColors.dark }
    }

    let overlay = ""
    if (isSel) overlay = theme.boardColors.selected
    else if (isLast) overlay = isL ? theme.boardColors.lastLight : theme.boardColors.lastDark
    else if (isHint) overlay = "rgba(250,200,0,0.35)"

    if (overlay && theme.boardImageUrl) {
      return { ...base, backgroundImage: `linear-gradient(${overlay},${overlay}),url("${theme.boardImageUrl}")` }
    }
    if (overlay) return { ...base, backgroundColor: overlay }
    return base
  }

  return (
    <>
      <style>{BASE + `
        .lw{min-height:100vh;background:${theme.boardColors.pageBg};color:${tx};padding:2rem 1rem;}
        .lin{max-width:860px;margin:0 auto;}
        .tabs{display:flex;gap:0;border:1px solid ${tx}18;border-radius:4px;overflow:hidden;margin-bottom:2rem;width:fit-content;}
        .tab{font-family:'DM Mono',monospace;font-size:.68rem;letter-spacing:.15em;text-transform:uppercase;background:none;border:none;color:${tx};padding:.65rem 1.5rem;cursor:pointer;transition:all .2s;opacity:.45;}
        .tab.on{background:${tx}0e;opacity:1;border-bottom:2px solid ${tx}60;}
        .rcard{background:${bg};border:1px solid ${br};border-radius:6px;padding:2rem;max-width:600px;}
        .rnav{display:flex;align-items:center;justify-content:space-between;margin-top:1.5rem;}
        .navbtn{font-family:'DM Mono',monospace;font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;background:none;border:1px solid ${tx}22;color:${tx};padding:.5rem 1rem;border-radius:3px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:.3rem;}
        .navbtn:hover{border-color:${tx}50;background:${tx}06;}
        .navbtn:disabled{opacity:.2;cursor:default;}
        .dots{display:flex;gap:5px;align-items:center;}
        .dot2{width:6px;height:6px;border-radius:50%;transition:background .2s;}
        .tgrid{display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:start;}
        @media(max-width:640px){.tgrid{grid-template-columns:1fr;}}
        .fbbox{font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;padding:.55rem .9rem;border-radius:3px;margin-bottom:.75rem;transition:all .3s;}
        .sq2{position:relative;display:flex;align-items:center;justify-content:center;border:none;padding:0;cursor:pointer;width:100%;height:100%;}
        .dot3{position:absolute;width:26%;height:26%;border-radius:50%;background:rgba(0,0,0,.24);pointer-events:none;z-index:3;}
        .ring2{position:absolute;inset:0;border:3px solid ${theme.boardColors.selected};pointer-events:none;z-index:3;}
        .coord2{position:absolute;font-size:9px;font-family:'DM Mono',monospace;z-index:1;pointer-events:none;opacity:.5;}
        .hint-ring{position:absolute;inset:2px;border:2px dashed rgba(220,170,0,.8);border-radius:1px;pointer-events:none;z-index:4;animation:pulse 1.2s ease-in-out infinite;}
        @keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
        .pgbar{height:3px;background:${tx}14;border-radius:2px;margin-bottom:2rem;overflow:hidden;}
        .pgfill{height:100%;background:${tx}50;border-radius:2px;transition:width .4s;}
      `}</style>
      <div className="lw">
        <div className="lin">
          <button onClick={onBack} style={{ fontFamily: "'DM Mono',monospace", fontSize: ".62rem", letterSpacing: ".15em", textTransform: "uppercase", background: "none", border: "none", color: `${tx}55`, cursor: "pointer", padding: 0, marginBottom: "1.8rem", display: "flex", alignItems: "center", gap: ".3rem" }}>
            <ChevronLeft size={12} /> {lang === "ru" ? "В меню" : "Back to menu"}
          </button>

          <p className="fm" style={{ fontSize: ".58rem", letterSpacing: ".35em", textTransform: "uppercase", opacity: .3, marginBottom: ".4rem" }}>{lang === "ru" ? "ОБУЧЕНИЕ" : "LEARN"}</p>
          <h1 className="fs" style={{ fontSize: "clamp(2rem,6vw,3.2rem)", fontStyle: "italic", lineHeight: 1, color: tx, marginBottom: "1.8rem" }}>{lang === "ru" ? "Шахматы" : "Chess"}</h1>

          <div className="tabs">
            <button className={`tab${tab === "rules" ? " on" : ""}`} onClick={() => setTab("rules")}>
              {lang === "ru" ? "Правила" : "Rules"}
            </button>
            <button className={`tab${tab === "tutorial" ? " on" : ""}`} onClick={() => { setTab("tutorial"); loadStep(0) }}>
              {lang === "ru" ? "Тренировка" : "Tutorial"}
            </button>
          </div>

          {/* ── RULES TAB ── */}
          {tab === "rules" && (
            <>
              <div className="pgbar"><div className="pgfill" style={{ width: `${((ruleIdx + 1) / rules.length) * 100}%` }} /></div>
              <div className="rcard">
                <div style={{ fontSize: "2.4rem", marginBottom: ".8rem", lineHeight: 1 }}>{rules[ruleIdx].icon}</div>
                <h2 className="fs" style={{ fontSize: "1.6rem", fontStyle: "italic", color: tx, marginBottom: ".9rem" }}>{rules[ruleIdx].title}</h2>
                <p className="fb" style={{ fontSize: "1.05rem", lineHeight: 1.65, color: `${tx}cc`, fontStyle: "italic" }}>{rules[ruleIdx].text}</p>
                <div className="rnav">
                  <button className="navbtn" onClick={() => setRuleIdx(p => p - 1)} disabled={ruleIdx === 0}>
                    <ChevronLeft size={13} /> {lang === "ru" ? "Назад" : "Previous"}
                  </button>
                  <div className="dots">
                    {rules.map((_, i) => (
                      <span key={i} className="dot2" onClick={() => setRuleIdx(i)}
                        style={{ background: i === ruleIdx ? tx : `${tx}28`, cursor: "pointer", transform: i === ruleIdx ? "scale(1.3)" : "scale(1)" }} />
                    ))}
                  </div>
                  {ruleIdx < rules.length - 1
                    ? <button className="navbtn" onClick={() => setRuleIdx(p => p + 1)}>{lang === "ru" ? "Далее" : "Next"} <ChevronRight size={13} /></button>
                    : <button className="navbtn" onClick={() => { setTab("tutorial"); loadStep(0) }} style={{ borderColor: `${tx}50`, opacity: 1 }}>{lang === "ru" ? "К тренировке →" : "Try Tutorial →"}</button>
                  }
                </div>
              </div>
            </>
          )}

          {/* ── TUTORIAL TAB ── */}
          {tab === "tutorial" && (
            <>
              <div className="pgbar"><div className="pgfill" style={{ width: `${((stepIdx + (tutDone ? 1 : 0)) / TUTORIAL_STEPS.length) * 100}%` }} /></div>
              {tutDone ? (
                <div className="rcard" style={{ textAlign: "center", padding: "3rem 2rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
                  <h2 className="fs" style={{ fontSize: "1.8rem", fontStyle: "italic", color: tx, marginBottom: ".8rem" }}>{lang === "ru" ? "Урок завершён!" : "Tutorial complete!"}</h2>
                  <p className="fb" style={{ fontSize: "1.05rem", fontStyle: "italic", opacity: .6, marginBottom: "2rem", lineHeight: 1.6 }}>
                    {lang === "ru" ? "Отличная работа! Ты освоил основы дебюта. Теперь попробуй сыграть настоящую партию." : "Great work! You've learned the opening basics. Now try a real game."}
                  </p>
                  <div style={{ display: "flex", gap: ".6rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <button className="navbtn" onClick={() => loadStep(0)}>{lang === "ru" ? "Сначала" : "Start over"}</button>
                    <button className="navbtn" onClick={onBack} style={{ borderColor: `${tx}50` }}>{lang === "ru" ? "Играть →" : "Play a game →"}</button>
                  </div>
                </div>
              ) : (
                <div className="tgrid">
                  {/* Board */}
                  <div>
                    <div style={{ position: "relative", width: "100%", paddingTop: "100%" }}>
                      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(8,1fr)", gridTemplateRows: "repeat(8,1fr)", border: `1px solid ${tx}14`, boxShadow: "0 8px 30px -6px rgba(0,0,0,.18)" }}>
                        {RANKS.map(rank => FILES.map(file => {
                          const sq = `${file}${rank}` as Square
                          const piece = tutGame.get(sq)
                          const isL = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
                          const url = piece ? getPieceUrl(piece.color, piece.type, theme) : null
                          const isHinted = step.hint.includes(sq) && !waitingBot
                          return (
                            <button key={sq} className="sq2" onClick={() => handleTutorialClick(sq)} style={sqStyleLearn(file, rank, sq)}>
                              {url && <img src={url} alt="" style={{ width: "84%", height: "84%", zIndex: 2, filter: theme.pieceFilter }} />}
                              {legalMoves.includes(sq) && (piece ? <span className="ring2" /> : <span className="dot3" />)}
                              {isHinted && <span className="hint-ring" />}
                              {file === "a" && <span className="coord2" style={{ top: 2, left: 3, color: isL ? theme.boardColors.dark : theme.boardColors.light }}>{rank}</span>}
                              {rank === "1" && <span className="coord2" style={{ bottom: 2, right: 3, color: isL ? theme.boardColors.dark : theme.boardColors.light }}>{file}</span>}
                            </button>
                          )
                        }))}
                      </div>
                    </div>
                    {/* Step dots */}
                    <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: ".9rem" }}>
                      {TUTORIAL_STEPS.map((_, i) => (
                        <span key={i} className="dot2" style={{ background: i < stepIdx ? tx : i === stepIdx ? tx : `${tx}28`, opacity: i < stepIdx ? .5 : 1, width: i === stepIdx ? 8 : 6, height: i === stepIdx ? 8 : 6, cursor: "pointer" }} onClick={() => loadStep(i)} />
                      ))}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <p className="fm" style={{ fontSize: ".56rem", letterSpacing: ".2em", textTransform: "uppercase", opacity: .32, marginBottom: ".5rem" }}>
                      {lang === "ru" ? `ШАГ ${stepIdx + 1} из ${TUTORIAL_STEPS.length}` : `STEP ${stepIdx + 1} of ${TUTORIAL_STEPS.length}`}
                    </p>
                    <h2 className="fs" style={{ fontSize: "1.35rem", fontStyle: "italic", color: tx, marginBottom: ".9rem", lineHeight: 1.2 }}>
                      {lang === "ru" ? step.titleRu : step.titleEn}
                    </h2>
                    <p className="fb" style={{ fontSize: "1rem", fontStyle: "italic", lineHeight: 1.7, color: `${tx}bb`, marginBottom: "1.2rem" }}>
                      {lang === "ru" ? step.textRu : step.textEn}
                    </p>

                    {feedback === "correct" && (
                      <div className="fbbox" style={{ background: "rgba(74,222,128,.12)", border: "1px solid rgba(74,222,128,.3)", color: "#4ade80" }}>
                        ✓ {lang === "ru" ? "Правильно!" : "Correct!"}
                      </div>
                    )}
                    {feedback === "wrong" && (
                      <div className="fbbox" style={{ background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.28)", color: "#f87171" }}>
                        ✗ {lang === "ru" ? "Попробуй ещё раз. Следи за подсказкой." : "Try again. Follow the highlighted squares."}
                      </div>
                    )}
                    {waitingBot && (
                      <div className="fbbox" style={{ background: `${tx}08`, border: `1px solid ${tx}18`, color: `${tx}70` }}>
                        ♟ {lang === "ru" ? "Чёрные отвечают…" : "Black is responding…"}
                      </div>
                    )}

                    <p className="fm" style={{ fontSize: ".6rem", letterSpacing: ".12em", textTransform: "uppercase", opacity: .3, marginTop: ".5rem" }}>
                      {lang === "ru" ? "Нажми на подсвеченную фигуру" : "Click the highlighted piece to move"}
                    </p>

                    <div style={{ display: "flex", gap: ".5rem", marginTop: "1.5rem" }}>
                      <button className="navbtn" onClick={() => loadStep(0)}>
                        {lang === "ru" ? "Сначала" : "Reset"}
                      </button>
                      {stepIdx > 0 && (
                        <button className="navbtn" onClick={() => loadStep(stepIdx - 1)}>
                          <ChevronLeft size={12} /> {lang === "ru" ? "Назад" : "Prev"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
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
  const [pendingMode, setPendingMode] = useState<"pvp" | "pve" | null>(null)
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
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      try {
        const cur = gameRef.current
        const res = await fetch(`https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(cur.fen())}&depth=${DIFFICULTY_DEPTH[difficulty]}`, { signal: controller.signal })
        clearTimeout(timeout)
        const data = await res.json()
        if (data.success && data.bestmove) {
          const uci = data.bestmove.split(" ")[1]
          if (!uci || uci.length < 4) return
          const from = uci.slice(0, 2) as Square; const to = uci.slice(2, 4) as Square
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
      } catch {
        clearTimeout(timeout)
        // При таймауте делаем случайный ход
        try {
          const cur = gameRef.current
          const moves = cur.moves({ verbose: true })
          if (moves.length > 0) {
            const mv = moves[Math.floor(Math.random() * moves.length)]
            const next = new Chess(cur.fen())
            next.move(mv)
            gameRef.current = next; setGame(next)
            setMoveHistory(next.history()); setLastMove({ from: mv.from as Square, to: mv.to as Square })
            addCoach(`${t.stockfish}: ${mv.san}`)
          }
        } catch {}
      }
      setIsBotThinking(false)
    }
    const delay = difficulty === "easy" ? 300 : difficulty === "medium" ? 600 : difficulty === "hard" ? 900 : 1400
    const timer = setTimeout(go, delay)
    return () => clearTimeout(timer)
  }, [game, gameMode, screen, isGameActive, isPaused, isBotThinking, difficulty, t])

  const endGame = useCallback((result: GameResult, _: number) => { setGameResult(result); setIsGameActive(false) }, [])
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

  // ── LEARN SCREEN ──
  if (screen === "learn") return (
    <LearnScreen theme={theme} lang={lang as Lang} onBack={() => setScreen("menu")} />
  )

  const FONTS = "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Mono:wght@300;400&family=DM+Serif+Display:ital@0;1&display=swap"
  const BASE = `@import url('${FONTS}');*{box-sizing:border-box;margin:0;padding:0;}.fm{font-family:'DM Mono',monospace;}.fs{font-family:'DM Serif Display',serif;}.fb{font-family:'EB Garamond',serif;}`

  const SettingsModal = ({ onClose, inGame }: { onClose: () => void; inGame?: boolean }) => (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(26,25,22,.3)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.boardColors.pageBg, border: `1px solid ${br}`, width: 360, maxWidth: "92vw", borderRadius: 6, overflow: "hidden", color: tx }}>
        <div style={{ padding: "1.1rem 1.4rem", borderBottom: `1px solid ${br}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="fm" style={{ fontSize: ".72rem", letterSpacing: ".18em", textTransform: "uppercase", opacity: .5 }}>{t.settings}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: tx, opacity: .38, display: "flex" }}><X size={16} /></button>
        </div>
        <div style={{ padding: ".9rem 1.4rem", borderBottom: `1px solid ${br}` }}>
          <p className="fm" style={{ fontSize: ".6rem", letterSpacing: ".2em", textTransform: "uppercase", opacity: .35, marginBottom: ".65rem" }}>{t.themeGallery}</p>
          {(Object.keys(UNIFIED_THEMES) as UnifiedThemeKey[]).map(key => (
            <div key={key} onClick={() => setCurrentThemeKey(key)} style={{ padding: ".65rem 0", cursor: "pointer", display: "flex", alignItems: "center", gap: ".75rem", opacity: currentThemeKey === key ? 1 : .5, transition: "opacity .15s" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: currentThemeKey === key ? tx : "transparent", border: `1px solid ${tx}50`, display: "inline-block", flexShrink: 0 }} />
              <span className="fm" style={{ fontSize: ".72rem", letterSpacing: ".1em", textTransform: "uppercase" }}>{UNIFIED_THEMES[key].name}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: ".9rem 1.4rem", borderBottom: inGame ? `1px solid ${br}` : "none" }}>
          <p className="fm" style={{ fontSize: ".6rem", letterSpacing: ".2em", textTransform: "uppercase", opacity: .35, marginBottom: ".65rem" }}>{t.language}</p>
          <div style={{ display: "flex", gap: ".4rem" }}>
            {(["en", "ru"] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{ fontFamily: "'DM Mono',monospace", fontSize: ".65rem", letterSpacing: ".1em", textTransform: "uppercase", padding: ".45rem .75rem", border: `1px solid ${lang === l ? tx + "80" : tx + "22"}`, background: lang === l ? `${tx}0e` : "transparent", color: tx, borderRadius: 3, cursor: "pointer", opacity: lang === l ? 1 : .5, transition: "all .2s" }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {inGame && (
          <div style={{ padding: ".9rem 1.4rem", display: "flex", flexDirection: "column", gap: ".4rem" }}>
            <button onClick={() => { setIsPaused(false); onClose() }} style={{ fontFamily: "'DM Mono',monospace", fontSize: ".68rem", letterSpacing: ".15em", textTransform: "uppercase", background: "none", border: `1px solid ${tx}22`, color: tx, padding: ".78rem", borderRadius: 3, cursor: "pointer" }}>{t.resume}</button>
            <button onClick={() => { resetGame(); setIsPaused(false); onClose() }} style={{ fontFamily: "'DM Mono',monospace", fontSize: ".68rem", letterSpacing: ".15em", textTransform: "uppercase", background: "none", border: `1px solid ${tx}22`, color: tx, padding: ".78rem", borderRadius: 3, cursor: "pointer" }}>{t.restart}</button>
            <button onClick={() => { resetGame(); setIsPaused(false); onClose(); setScreen("menu") }} style={{ fontFamily: "'DM Mono',monospace", fontSize: ".68rem", letterSpacing: ".15em", textTransform: "uppercase", background: "none", border: `1px solid ${tx}22`, color: tx, padding: ".78rem", borderRadius: 3, cursor: "pointer" }}>{t.exitMenu}</button>
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
        .mbtn.learn{border-style:dashed;opacity:.7;}
        .mbtn.learn:hover{opacity:1;}
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
          <div style={{ display: "flex", gap: ".5rem", width: "100%", maxWidth: 280 }}>
            <button className={`mbtn hi${pendingMode === "pvp" ? " active" : ""}`} style={{ flex: 1, fontSize: ".65rem" }} onClick={() => setPendingMode("pvp")}>{t.playFriend}</button>
            <button className={`mbtn hi${pendingMode === "pve" ? " active" : ""}`} style={{ flex: 1, fontSize: ".65rem" }} onClick={() => setPendingMode("pve")}>{t.playAI}</button>
          </div>

          {pendingMode === "pve" && (
            <div className="dcard" style={{ marginTop: ".2rem" }}>
              {(["easy", "medium", "hard", "master"] as Difficulty[]).map(d => (
                <div key={d} className={`drow${difficulty === d ? " sel" : ""}`} onClick={() => setDifficulty(d)}>
                  <div style={{ display: "flex", flexDirection: "column", gap: ".2rem" }}>
                    <span className="fm" style={{ fontSize: ".68rem", letterSpacing: ".12em", textTransform: "uppercase" }}>{t[d]}</span>
                    <span className="fm" style={{ fontSize: ".54rem", opacity: .38 }}>{t[`${d}Desc`]}</span>
                  </div>
                  <div style={{ display: "flex", gap: 3 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i < DIFFICULTY_DOTS[d] ? tx : "transparent", border: `1px solid ${tx}40`, display: "inline-block" }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingMode && (
            <button className="mbtn hi" style={{ marginTop: ".4rem", background: `${tx}08`, borderColor: `${tx}60` }}
              onClick={() => { setGameMode(pendingMode!); resetGame(); setScreen("game") }}>
              {pendingMode === "pve" ? `▶  ${t.playAI} · ${t[difficulty]}` : `▶  ${t.playFriend}`}
            </button>
          )}

          {/* Learn button */}
          <button className="mbtn learn" onClick={() => setScreen("learn")}>
            ✦ {t.learn}
          </button>

          <button className="mbtn" onClick={() => setSettingsOpen(true)}>{t.settings}</button>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "2rem" }}>
          {(Object.keys(UNIFIED_THEMES) as UnifiedThemeKey[]).map(k => (
            <span key={k} onClick={() => setCurrentThemeKey(k)} style={{ width: 13, height: 13, borderRadius: "50%", background: UNIFIED_THEMES[k].boardColors.dark, border: `2px solid ${currentThemeKey === k ? tx : "transparent"}`, cursor: "pointer", display: "inline-block" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: ".35rem", marginTop: "1rem" }}>
          {(["en", "ru"] as Lang[]).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{ fontFamily: "'DM Mono',monospace", fontSize: ".56rem", letterSpacing: ".1em", textTransform: "uppercase", padding: ".28rem .48rem", border: `1px solid ${lang === l ? tx + "70" : tx + "18"}`, background: lang === l ? `${tx}0e` : "transparent", color: tx, borderRadius: 3, cursor: "pointer", opacity: lang === l ? 1 : .38, transition: "all .2s" }}>
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
                <button onClick={() => { setIsPaused(true); setSettingsOpen(true) }} style={{ background: "none", border: "none", cursor: "pointer", color: tx, opacity: .35, display: "flex", padding: 0 }}><Settings size={14} /></button>
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
