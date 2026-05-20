"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Chess, Square } from "chess.js"
import { Settings, X, ChevronRight, ChevronLeft, RotateCcw, LogOut, User } from "lucide-react"

type UnifiedThemeKey = keyof typeof UNIFIED_THEMES
type GameResult = { winner: "White" | "Black" | "Draw"; reason: string }
type Screen = "splash" | "menu" | "game" | "learn" | "history" | "profile"
type Lang = "en" | "ru"
type Difficulty = "easy" | "medium" | "hard" | "master"
type LearnTab = "rules" | "tutorial"

type TelegramUser = {
  id: string
  first_name: string
  username: string
  photo_url: string
}

type UserXP = {
  xp: number
  level: number
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
}

// XP helpers
const XP_WIN = 50; const XP_DRAW = 20; const XP_LOSS = 10; const XP_LONG = 15
function xpForLevel(l: number) { return Math.floor(100 * Math.pow(1.4, l - 1)) }
function levelFromXp(xp: number) { let l=1,t=0; while(t+xpForLevel(l)<=xp){t+=xpForLevel(l);l++;if(l>=50)break}; return l }
function levelProgress(xp: number) { let l=1,t=0; while(t+xpForLevel(l)<=xp){t+=xpForLevel(l);l++;if(l>=50)break}; return(xp-t)/xpForLevel(l) }
const TITLES: Record<number,{en:string;ru:string}> = {
  1:{en:"Beginner",ru:"Новичок"},2:{en:"Beginner",ru:"Новичок"},
  3:{en:"Student",ru:"Ученик"},4:{en:"Student",ru:"Ученик"},
  5:{en:"Apprentice",ru:"Подмастерье"},6:{en:"Apprentice",ru:"Подмастерье"},
  7:{en:"Club Player",ru:"Клубный"},8:{en:"Club Player",ru:"Клубный"},
  9:{en:"Tournament",ru:"Турнирный"},10:{en:"Tournament",ru:"Турнирный"},
  11:{en:"Candidate",ru:"Кандидат"},12:{en:"Candidate",ru:"Кандидат"},
  13:{en:"Expert",ru:"Эксперт"},14:{en:"Expert",ru:"Эксперт"},
  15:{en:"Master",ru:"Мастер"},16:{en:"Master",ru:"Мастер"},
  17:{en:"Int. Master",ru:"Межд. Мастер"},18:{en:"Int. Master",ru:"Межд. Мастер"},
  19:{en:"Grandmaster",ru:"Гроссмейстер"},20:{en:"Grandmaster",ru:"Гроссмейстер"},
}
function getTitle(level: number, lang: Lang) { const c=Math.min(level,20); return TITLES[c]?.[lang]??(lang==="ru"?"Легенда":"Legend") }

type LocalGame = {
  id: string
  date: string
  mode: "pvp" | "pve"
  result: "win" | "loss" | "draw"
  reason: string
  moves: number
  duration: number
  difficulty?: string
}
type TimeControl = 3 | 5 | 10 | 0

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    welcomeTo: "WELCOME TO", chooseGame: "choose your game",
    playFriend: "Play with Friend", playAI: "Play with AI",
    learn: "Learn Chess", settings: "Settings", themeGallery: "Theme Gallery",
    language: "Language", difficulty: "Difficulty", timeControl: "Time Control",
    easy: "Easy", medium: "Medium", hard: "Hard", master: "Master",
    easyDesc: "Casual play", mediumDesc: "Balanced", hardDesc: "Challenge", masterDesc: "Maximum",
    status: "Status", aiCoach: "AI Coach", ask: "Ask",
    moves: "Moves", pause: "Pause", newGame: "New", undo: "Undo",
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
    rulesTab: "Rules", tutorialTab: "Tutorial", score: "Score",
    unlimited: "∞", min: "min", captured: "captured",
    sessionScore: "Session",
    history: "History", noGames: "No games yet", vsHuman: "vs Human", vsAI: "vs Stockfish",
    winLabel: "Win", lossLabel: "Loss", drawLabel: "Draw", clearHistory: "Clear history",
    movesLabel: "moves", today: "Today", yesterday: "Yesterday",
    signIn: "Sign in", signInTg: "Sign in with Telegram", signOut: "Sign out",
    profile: "Profile", level: "Level", xp: "XP", yourProgress: "Your Progress",
    gamesPlayed: "Games", winRate: "Win rate", xpGained: "XP gained",
    levelUp: "Level up!", nextLevel: "Next level", lang: "en",
  },
  ru: {
    welcomeTo: "ДОБРО ПОЖАЛОВАТЬ В", chooseGame: "выберите игру",
    playFriend: "Играть с другом", playAI: "Играть с ИИ",
    learn: "Обучение", settings: "Настройки", themeGallery: "Галерея тем",
    language: "Язык", difficulty: "Сложность", timeControl: "Время",
    easy: "Легко", medium: "Средне", hard: "Сложно", master: "Мастер",
    easyDesc: "Для новичков", mediumDesc: "Баланс", hardDesc: "Вызов", masterDesc: "Максимум",
    status: "Статус", aiCoach: "ИИ Тренер", ask: "Спросить",
    moves: "Ходы", pause: "Пауза", newGame: "Новая", undo: "Отмена",
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
    rulesTab: "Правила", tutorialTab: "Тренировка", score: "Счёт",
    unlimited: "∞", min: "мин", captured: "взято",
    sessionScore: "Сессия",
    history: "История", noGames: "Игр пока нет", vsHuman: "vs Человек", vsAI: "vs Stockfish",
    winLabel: "Победа", lossLabel: "Поражение", drawLabel: "Ничья", clearHistory: "Очистить",
    movesLabel: "ходов", today: "Сегодня", yesterday: "Вчера",
    signIn: "Войти", signInTg: "Войти через Telegram", signOut: "Выйти",
    profile: "Профиль", level: "Уровень", xp: "XP", yourProgress: "Прогресс",
    gamesPlayed: "Игры", winRate: "Винрейт", xpGained: "Получено XP",
    levelUp: "Новый уровень!", nextLevel: "До след. уровня", lang: "ru",
  },
}

const RULES: Record<Lang, { title: string; icon: string; text: string }[]> = {
  en: [
    { icon: "♟", title: "The Board", text: "Chess is played on an 8×8 board with 64 squares alternating between light and dark. Each player starts with 16 pieces: 1 king, 1 queen, 2 rooks, 2 bishops, 2 knights, and 8 pawns. White always moves first." },
    { icon: "♚", title: "The King", text: "The king moves one square in any direction. The goal of the game is to checkmate your opponent's king — put it in a position where it is under attack and cannot escape. If your king is in check, you must resolve it immediately." },
    { icon: "♛", title: "The Queen", text: "The queen is the most powerful piece. She can move any number of squares in any direction — horizontally, vertically, or diagonally. Protect your queen and use her wisely." },
    { icon: "♜", title: "The Rook", text: "The rook moves any number of squares horizontally or vertically. Rooks are most powerful on open files (columns with no pawns). Two rooks working together can be devastating." },
    { icon: "♝", title: "The Bishop", text: "The bishop moves any number of squares diagonally. Each player has two bishops: one on light squares and one on dark squares. A bishop always stays on the same colour throughout the game." },
    { icon: "♞", title: "The Knight", text: "The knight moves in an L-shape: two squares in one direction and then one square perpendicular. Knights are the only pieces that can jump over other pieces. This makes them especially useful in crowded positions." },
    { icon: "♙", title: "The Pawn", text: "Pawns move forward one square, but capture diagonally. On their first move, pawns may advance two squares. If a pawn reaches the opposite end of the board, it promotes to any piece (usually a queen)." },
    { icon: "⚡", title: "Special Moves", text: "Castling: the king moves two squares toward a rook, and the rook jumps to the other side. En passant: a pawn that has just advanced two squares can be captured by an opposing pawn as if it had moved only one." },
    { icon: "🏁", title: "Winning & Drawing", text: "You win by checkmate. The game is drawn by stalemate (no legal moves but not in check), threefold repetition, the 50-move rule, or mutual agreement." },
  ],
  ru: [
    { icon: "♟", title: "Доска", text: "Шахматы играются на доске 8×8, состоящей из 64 чередующихся светлых и тёмных клеток. У каждого игрока 16 фигур: 1 король, 1 ферзь, 2 ладьи, 2 слона, 2 коня и 8 пешек. Белые всегда ходят первыми." },
    { icon: "♚", title: "Король", text: "Король ходит на одну клетку в любом направлении. Цель игры — поставить мат королю противника. Если ваш король под шахом — вы обязаны немедленно его защитить." },
    { icon: "♛", title: "Ферзь", text: "Ферзь — самая сильная фигура. Он ходит на любое количество клеток в любом направлении: по горизонтали, вертикали и диагоналям. Берегите ферзя и используйте его с умом." },
    { icon: "♜", title: "Ладья", text: "Ладья ходит на любое количество клеток по горизонтали или вертикали. Ладьи сильнее всего на открытых вертикалях. Две ладьи вместе могут быть очень опасны." },
    { icon: "♝", title: "Слон", text: "Слон ходит на любое количество клеток по диагонали. У каждого игрока два слона: один на светлых клетках, другой на тёмных. Слон всегда остаётся на клетках одного цвета." },
    { icon: "♞", title: "Конь", text: "Конь ходит буквой «Г»: две клетки в одну сторону и одна перпендикулярно. Конь — единственная фигура, которая может перепрыгивать через другие." },
    { icon: "♙", title: "Пешка", text: "Пешки ходят вперёд на одну клетку, а бьют по диагонали. При первом ходе пешка может пойти на две клетки. Если пешка доходит до последней горизонтали, она превращается в любую фигуру." },
    { icon: "⚡", title: "Специальные ходы", text: "Рокировка: король перемещается на две клетки к ладье, а ладья перепрыгивает на другую сторону. Взятие на проходе: пешка, только что прошедшая две клетки, может быть взята вражеской пешкой." },
    { icon: "🏁", title: "Победа и ничья", text: "Победа достигается матом. Ничья возможна при пате, троекратном повторении позиции, правиле 50 ходов или по соглашению сторон." },
  ],
}

type TutorialStep = { fen: string; titleEn: string; titleRu: string; textEn: string; textRu: string; hint: Square[]; expectedFrom: Square; expectedTo: Square; autoPlay?: { from: Square; to: Square } }
const TUTORIAL_STEPS: TutorialStep[] = [
  { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", titleEn: "Step 1 — Open with a Pawn", titleRu: "Шаг 1 — Открытие пешкой", textEn: "Control the centre. Move the pawn from e2 to e4. This opens lines for your bishop and queen.", textRu: "Захватите центр. Переместите пешку с e2 на e4. Это откроет линии для слона и ферзя.", hint: ["e2", "e4"], expectedFrom: "e2", expectedTo: "e4", autoPlay: { from: "e7", to: "e5" } },
  { fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", titleEn: "Step 2 — Develop a Knight", titleRu: "Шаг 2 — Развитие коня", textEn: "Develop your pieces early! Move the knight from g1 to f3.", textRu: "Развивайте фигуры! Переместите коня с g1 на f3.", hint: ["g1", "f3"], expectedFrom: "g1", expectedTo: "f3", autoPlay: { from: "b8", to: "c6" } },
  { fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", titleEn: "Step 3 — Develop a Bishop", titleRu: "Шаг 3 — Развитие слона", textEn: "Move the bishop from f1 to c4. It eyes the centre and pressures f7.", textRu: "Переместите слона с f1 на c4. Он давит на центр и поле f7.", hint: ["f1", "c4"], expectedFrom: "f1", expectedTo: "c4", autoPlay: { from: "f8", to: "c5" } },
  { fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", titleEn: "Step 4 — Castle to Safety", titleRu: "Шаг 4 — Рокировка", textEn: "Castle kingside! Move the king from e1 to g1 to tuck it safely behind pawns.", textRu: "Сделайте рокировку! Переместите короля с e1 на g1, спрятав его за пешками.", hint: ["e1", "g1"], expectedFrom: "e1", expectedTo: "g1", autoPlay: { from: "e8", to: "g8" } },
  { fen: "r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w - - 6 5", titleEn: "Step 5 — Control the Centre", titleRu: "Шаг 5 — Контроль центра", textEn: "Advance the d-pawn from d2 to d3. Controlling the centre is the key to a good game!", textRu: "Продвиньте пешку d с d2 на d3. Контроль центра — ключ к хорошей игре!", hint: ["d2", "d3"], expectedFrom: "d2", expectedTo: "d3", autoPlay: { from: "d7", to: "d6" } },
]

const DIFFICULTY_DEPTH: Record<Difficulty, number> = { easy: 1, medium: 3, hard: 6, master: 10 }
const DIFFICULTY_DOTS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3, master: 4 }
const TIME_OPTIONS: TimeControl[] = [3, 5, 10, 0]

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]
const SKAK = "https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/{color}{piece}.svg"

const UNIFIED_THEMES = {
  arcticCobalt: {
    name: "Arctic Cobalt", boardImageUrl: "",
    boardColors: { light: "#DEE6ED", dark: "#4F7396", pageBg: "#EAF1F7", lastLight: "rgba(100,160,220,0.45)", lastDark: "rgba(30,90,160,0.55)", selected: "rgba(255,210,50,0.75)" },
    coachUI: { bg: "#FFFFFF", border: "rgba(60,90,120,0.14)", text: "#1e2d3d" },
    pieceFilter: "drop-shadow(0 3px 6px rgba(0,0,0,0.25))", pieceSetUrl: SKAK,
  },
  amberOak: {
    name: "Amber Oak", boardImageUrl: "",
    boardColors: { light: "#F0D9B5", dark: "#B58863", pageBg: "#FDF5E6", lastLight: "rgba(205,170,50,0.5)", lastDark: "rgba(180,130,30,0.6)", selected: "rgba(255,215,50,0.8)" },
    coachUI: { bg: "#FFFDF7", border: "rgba(97,67,50,0.14)", text: "#3d2b1f" },
    pieceFilter: "drop-shadow(0 3px 6px rgba(0,0,0,0.22))", pieceSetUrl: SKAK,
  },
  neonDusk: {
    name: "Neon Dusk", boardImageUrl: "",
    boardColors: { light: "#3D4A5C", dark: "#1A2332", pageBg: "#111827", lastLight: "rgba(0,200,255,0.25)", lastDark: "rgba(0,180,230,0.35)", selected: "rgba(0,240,255,0.5)" },
    coachUI: { bg: "#1e2a3a", border: "rgba(255,255,255,0.08)", text: "#e2e8f0" },
    pieceFilter: "drop-shadow(0 0 8px rgba(0,220,255,0.4)) brightness(1.1)", pieceSetUrl: SKAK,
  },
  softSmoke: {
    name: "Soft Smoke", boardImageUrl: "",
    boardColors: { light: "#EEE8E0", dark: "#8B7355", pageBg: "#F5F1EB", lastLight: "rgba(180,150,80,0.4)", lastDark: "rgba(150,110,40,0.5)", selected: "rgba(220,180,60,0.75)" },
    coachUI: { bg: "#FEFCF9", border: "rgba(100,80,60,0.14)", text: "#3d3428" },
    pieceFilter: "drop-shadow(0 3px 6px rgba(0,0,0,0.2))", pieceSetUrl: SKAK,
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

// ── CAPTURED PIECES component ──
function CapturedPieces({ fen, color, theme, tx }: { fen: string; color: "w" | "b"; theme: any; tx: string }) {
  const game = new Chess(fen)
  const board = game.board().flat()
  const onBoard: Record<string, number> = {}
  board.forEach(p => { if (p) onBoard[`${p.color}${p.type}`] = (onBoard[`${p.color}${p.type}`] || 0) + 1 })
  const start: Record<string, number> = { wp: 8, wn: 2, wb: 2, wr: 2, wq: 1, bp: 8, bn: 2, bb: 2, br: 2, bq: 1 }
  // color = "w" means we show pieces captured BY white (black pieces missing)
  const capturedBy = color === "w" ? "b" : "w"
  const pieces: string[] = []
  const order = ["q", "r", "b", "n", "p"]
  order.forEach(type => {
    const key = `${capturedBy}${type}`
    const missing = (start[key] || 0) - (onBoard[key] || 0)
    for (let i = 0; i < missing; i++) pieces.push(type)
  })
  if (pieces.length === 0) return null
  const advantage = pieces.reduce((s, p) => s + PIECE_VALUES[p], 0)
  const symMap: Record<string, string> = { p: capturedBy === "b" ? "♟" : "♙", n: capturedBy === "b" ? "♞" : "♘", b: capturedBy === "b" ? "♝" : "♗", r: capturedBy === "b" ? "♜" : "♖", q: capturedBy === "b" ? "♛" : "♕" }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "2px", flexWrap: "wrap", minHeight: 16 }}>
      {pieces.map((p, i) => <span key={i} style={{ fontSize: "13px", opacity: .7, lineHeight: 1 }}>{symMap[p]}</span>)}
      {advantage > 0 && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: ".52rem", opacity: .45, marginLeft: 3 }}>+{advantage}</span>}
    </div>
  )
}

// ── LEARN SCREEN ──
function LearnScreen({ theme, lang, onBack }: { theme: (typeof UNIFIED_THEMES)[UnifiedThemeKey]; lang: Lang; onBack: () => void }) {
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
  const tx = theme.coachUI.text; const bg = theme.coachUI.bg; const br = theme.coachUI.border
  const rules = RULES[lang]; const step = TUTORIAL_STEPS[stepIdx]
  const FONTS = "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Mono:wght@300;400&family=DM+Serif+Display:ital@0;1&display=swap"

  const loadStep = (idx: number) => { setStepIdx(idx); setTutGame(new Chess(TUTORIAL_STEPS[idx].fen)); setSelected(null); setLegalMoves([]); setLastMove(null); setFeedback(""); setTutDone(false); setWaitingBot(false) }

  const handleClick = (sq: Square) => {
    if (waitingBot || tutDone) return
    const piece = tutGame.get(sq)
    if (piece && piece.color === "w") { setSelected(sq); setLegalMoves(tutGame.moves({ square: sq, verbose: true }).map(m => m.to as Square)); setFeedback(""); return }
    if (selected && legalMoves.includes(sq)) {
      if (selected === step.expectedFrom && sq === step.expectedTo) {
        const next = new Chess(tutGame.fen()); next.move({ from: selected, to: sq, promotion: "q" })
        setTutGame(next); setLastMove({ from: selected, to: sq }); setSelected(null); setLegalMoves([]); setFeedback("correct")
        if (step.autoPlay) {
          setWaitingBot(true)
          setTimeout(() => {
            const next2 = new Chess(next.fen()); next2.move({ from: step.autoPlay!.from, to: step.autoPlay!.to, promotion: "q" })
            setTutGame(next2); setLastMove({ from: step.autoPlay!.from, to: step.autoPlay!.to }); setWaitingBot(false)
            if (stepIdx < TUTORIAL_STEPS.length - 1) setTimeout(() => loadStep(stepIdx + 1), 700); else setTutDone(true)
          }, 900)
        } else { if (stepIdx < TUTORIAL_STEPS.length - 1) setTimeout(() => loadStep(stepIdx + 1), 600); else setTutDone(true) }
      } else { setFeedback("wrong"); setSelected(null); setLegalMoves([]) }
      return
    }
    setSelected(null); setLegalMoves([])
  }

  const sqSL = (file: string, rank: string, sq: Square) => {
    const isL = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
    const isHint = step.hint.includes(sq) && !tutDone
    const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq)
    const isSel = selected === sq
    let overlay = isSel ? theme.boardColors.selected : isLast ? (isL ? theme.boardColors.lastLight : theme.boardColors.lastDark) : isHint ? "rgba(250,200,0,0.35)" : ""
    if (theme.boardImageUrl) return { backgroundImage: overlay ? `linear-gradient(${overlay},${overlay}),url("${theme.boardImageUrl}")` : `url("${theme.boardImageUrl}")`, backgroundSize: "100% 200%", backgroundPosition: isL ? "top" : "bottom" } as React.CSSProperties
    return { backgroundColor: overlay || (isL ? theme.boardColors.light : theme.boardColors.dark) } as React.CSSProperties
  }

  return (
    <>
      <style>{`@import url('${FONTS}');*{box-sizing:border-box;margin:0;padding:0}.fm{font-family:'DM Mono',monospace}.fs{font-family:'DM Serif Display',serif}.fb{font-family:'EB Garamond',serif}
        .lw{min-height:100vh;background:${theme.boardColors.pageBg};color:${tx};padding:2rem 1rem;animation:fadeIn .4s ease}
        .lin{max-width:860px;margin:0 auto}
        .tabs{display:flex;border:1px solid ${tx}18;border-radius:4px;overflow:hidden;margin-bottom:2rem;width:fit-content}
        .tab{font-family:'DM Mono',monospace;font-size:.68rem;letter-spacing:.15em;text-transform:uppercase;background:none;border:none;color:${tx};padding:.65rem 1.5rem;cursor:pointer;transition:all .2s;opacity:.45}
        .tab.on{background:${tx}0e;opacity:1;border-bottom:2px solid ${tx}60}
        .rcard{background:${bg};border:1px solid ${br};border-radius:6px;padding:2rem;max-width:600px;animation:slideUp .3s ease}
        .rnav{display:flex;align-items:center;justify-content:space-between;margin-top:1.5rem}
        .navbtn{font-family:'DM Mono',monospace;font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;background:none;border:1px solid ${tx}22;color:${tx};padding:.5rem 1rem;border-radius:3px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:.3rem}
        .navbtn:hover{border-color:${tx}50;background:${tx}06}
        .navbtn:disabled{opacity:.2;cursor:default}
        .tgrid{display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:start}
        @media(max-width:640px){.tgrid{grid-template-columns:1fr}}
        .fbbox{font-family:'DM Mono',monospace;font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;padding:.55rem .9rem;border-radius:3px;margin-bottom:.75rem}
        .sq2{position:relative;display:flex;align-items:center;justify-content:center;border:none;padding:0;cursor:pointer;width:100%;height:100%}
        .dot3{position:absolute;width:26%;height:26%;border-radius:50%;background:rgba(0,0,0,.24);pointer-events:none;z-index:3}
        .ring2{position:absolute;inset:0;border:3px solid ${theme.boardColors.selected};pointer-events:none;z-index:3}
        .coord2{position:absolute;font-size:9px;font-family:'DM Mono',monospace;z-index:1;pointer-events:none;opacity:.5}
        .hint-ring{position:absolute;inset:2px;border:2px dashed rgba(220,170,0,.8);border-radius:1px;pointer-events:none;z-index:4;animation:pulse 1.2s ease-in-out infinite}
        .pgbar{height:3px;background:${tx}14;border-radius:2px;margin-bottom:2rem;overflow:hidden}
        .pgfill{height:100%;background:${tx}50;border-radius:2px;transition:width .4s}
        @keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div className="lw">
        <div className="lin">
          <button onClick={onBack} style={{ fontFamily: "'DM Mono',monospace", fontSize: ".62rem", letterSpacing: ".15em", textTransform: "uppercase", background: "none", border: "none", color: `${tx}55`, cursor: "pointer", padding: 0, marginBottom: "1.8rem", display: "flex", alignItems: "center", gap: ".3rem" }}>
            <ChevronLeft size={12} /> {lang === "ru" ? "В меню" : "Back to menu"}
          </button>
          <p className="fm" style={{ fontSize: ".58rem", letterSpacing: ".35em", textTransform: "uppercase", opacity: .3, marginBottom: ".4rem" }}>{lang === "ru" ? "ОБУЧЕНИЕ" : "LEARN"}</p>
          <h1 className="fs" style={{ fontSize: "clamp(2rem,6vw,3.2rem)", fontStyle: "italic", lineHeight: 1, color: tx, marginBottom: "1.8rem" }}>{lang === "ru" ? "Шахматы" : "Chess"}</h1>
          <div className="tabs">
            <button className={`tab${tab === "rules" ? " on" : ""}`} onClick={() => setTab("rules")}>{lang === "ru" ? "Правила" : "Rules"}</button>
            <button className={`tab${tab === "tutorial" ? " on" : ""}`} onClick={() => { setTab("tutorial"); loadStep(0) }}>{lang === "ru" ? "Тренировка" : "Tutorial"}</button>
          </div>
          {tab === "rules" && (
            <>
              <div className="pgbar"><div className="pgfill" style={{ width: `${((ruleIdx + 1) / rules.length) * 100}%` }} /></div>
              <div className="rcard" key={ruleIdx}>
                <div style={{ fontSize: "2.4rem", marginBottom: ".8rem" }}>{rules[ruleIdx].icon}</div>
                <h2 className="fs" style={{ fontSize: "1.6rem", fontStyle: "italic", color: tx, marginBottom: ".9rem" }}>{rules[ruleIdx].title}</h2>
                <p className="fb" style={{ fontSize: "1.05rem", lineHeight: 1.65, color: `${tx}cc`, fontStyle: "italic" }}>{rules[ruleIdx].text}</p>
                <div className="rnav">
                  <button className="navbtn" onClick={() => setRuleIdx(p => p - 1)} disabled={ruleIdx === 0}><ChevronLeft size={13} /> {lang === "ru" ? "Назад" : "Prev"}</button>
                  <div style={{ display: "flex", gap: 5 }}>{rules.map((_, i) => <span key={i} onClick={() => setRuleIdx(i)} style={{ width: i === ruleIdx ? 8 : 6, height: i === ruleIdx ? 8 : 6, borderRadius: "50%", background: i === ruleIdx ? tx : `${tx}28`, cursor: "pointer", display: "inline-block", transition: "all .2s" }} />)}</div>
                  {ruleIdx < rules.length - 1
                    ? <button className="navbtn" onClick={() => setRuleIdx(p => p + 1)}>{lang === "ru" ? "Далее" : "Next"} <ChevronRight size={13} /></button>
                    : <button className="navbtn" onClick={() => { setTab("tutorial"); loadStep(0) }} style={{ borderColor: `${tx}50` }}>{lang === "ru" ? "К тренировке →" : "Tutorial →"}</button>}
                </div>
              </div>
            </>
          )}
          {tab === "tutorial" && (
            <>
              <div className="pgbar"><div className="pgfill" style={{ width: `${((stepIdx + (tutDone ? 1 : 0)) / TUTORIAL_STEPS.length) * 100}%` }} /></div>
              {tutDone ? (
                <div className="rcard" style={{ textAlign: "center", padding: "3rem 2rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
                  <h2 className="fs" style={{ fontSize: "1.8rem", fontStyle: "italic", color: tx, marginBottom: ".8rem" }}>{lang === "ru" ? "Урок завершён!" : "Tutorial complete!"}</h2>
                  <p className="fb" style={{ fontSize: "1.05rem", fontStyle: "italic", opacity: .6, marginBottom: "2rem", lineHeight: 1.6 }}>{lang === "ru" ? "Отличная работа! Попробуй сыграть настоящую партию." : "Great work! Now try a real game."}</p>
                  <div style={{ display: "flex", gap: ".6rem", justifyContent: "center" }}>
                    <button className="navbtn" onClick={() => loadStep(0)}>{lang === "ru" ? "Сначала" : "Start over"}</button>
                    <button className="navbtn" onClick={onBack} style={{ borderColor: `${tx}50` }}>{lang === "ru" ? "Играть →" : "Play →"}</button>
                  </div>
                </div>
              ) : (
                <div className="tgrid">
                  <div>
                    <div style={{ position: "relative", width: "100%", paddingTop: "100%" }}>
                      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(8,1fr)", gridTemplateRows: "repeat(8,1fr)", border: "1px solid rgba(0,0,0,0.12)", boxShadow: "0 20px 60px -10px rgba(0,0,0,.28),0 4px 16px -4px rgba(0,0,0,.14)", borderRadius: 2, overflow: "hidden" }}>
                        {RANKS.map(rank => FILES.map(file => {
                          const sq = `${file}${rank}` as Square; const piece = tutGame.get(sq)
                          const isL = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
                          const url = piece ? getPieceUrl(piece.color, piece.type, theme) : null
                          return (
                            <button key={sq} className="sq2" onClick={() => handleClick(sq)} style={sqSL(file, rank, sq)}>
                              {url && <img src={url} alt="" style={{ width: "84%", height: "84%", zIndex: 2, filter: theme.pieceFilter }} />}
                              {legalMoves.includes(sq) && (piece ? <span className="ring2" /> : <span className="dot3" />)}
                              {step.hint.includes(sq) && !tutDone && !waitingBot && <span className="hint-ring" />}
                              {file === "a" && <span className="coord2" style={{ top: 2, left: 3, color: isL ? theme.boardColors.dark : theme.boardColors.light }}>{rank}</span>}
                              {rank === "1" && <span className="coord2" style={{ bottom: 2, right: 3, color: isL ? theme.boardColors.dark : theme.boardColors.light }}>{file}</span>}
                            </button>
                          )
                        }))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: ".9rem" }}>
                      {TUTORIAL_STEPS.map((_, i) => <span key={i} onClick={() => loadStep(i)} style={{ width: i === stepIdx ? 8 : 6, height: i === stepIdx ? 8 : 6, borderRadius: "50%", background: i < stepIdx ? `${tx}60` : i === stepIdx ? tx : `${tx}28`, cursor: "pointer", display: "inline-block", transition: "all .2s" }} />)}
                    </div>
                  </div>
                  <div style={{ animation: "slideUp .3s ease" }}>
                    <p className="fm" style={{ fontSize: ".56rem", letterSpacing: ".2em", textTransform: "uppercase", opacity: .32, marginBottom: ".5rem" }}>{lang === "ru" ? `ШАГ ${stepIdx + 1} из ${TUTORIAL_STEPS.length}` : `STEP ${stepIdx + 1} of ${TUTORIAL_STEPS.length}`}</p>
                    <h2 className="fs" style={{ fontSize: "1.35rem", fontStyle: "italic", color: tx, marginBottom: ".9rem", lineHeight: 1.2 }}>{lang === "ru" ? step.titleRu : step.titleEn}</h2>
                    <p className="fb" style={{ fontSize: "1rem", fontStyle: "italic", lineHeight: 1.7, color: `${tx}bb`, marginBottom: "1.2rem" }}>{lang === "ru" ? step.textRu : step.textEn}</p>
                    {feedback === "correct" && <div className="fbbox" style={{ background: "rgba(74,222,128,.12)", border: "1px solid rgba(74,222,128,.3)", color: "#4ade80" }}>✓ {lang === "ru" ? "Правильно!" : "Correct!"}</div>}
                    {feedback === "wrong" && <div className="fbbox" style={{ background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.28)", color: "#f87171" }}>✗ {lang === "ru" ? "Попробуй ещё раз." : "Try again."}</div>}
                    {waitingBot && <div className="fbbox" style={{ background: `${tx}08`, border: `1px solid ${tx}18`, color: `${tx}70` }}>♟ {lang === "ru" ? "Чёрные отвечают…" : "Black responds…"}</div>}
                    <p className="fm" style={{ fontSize: ".58rem", letterSpacing: ".12em", textTransform: "uppercase", opacity: .28 }}>{lang === "ru" ? "Нажми на подсвеченную фигуру" : "Click the highlighted piece"}</p>
                    <div style={{ display: "flex", gap: ".5rem", marginTop: "1.2rem" }}>
                      <button className="navbtn" onClick={() => loadStep(0)}>{lang === "ru" ? "Сначала" : "Reset"}</button>
                      {stepIdx > 0 && <button className="navbtn" onClick={() => loadStep(stepIdx - 1)}><ChevronLeft size={12} /> {lang === "ru" ? "Назад" : "Prev"}</button>}
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
// MAIN
// ─────────────────────────────────────────────
export default function ChessPage() {
  const [screen, setScreen] = useState<Screen>("splash")
  const [splashOut, setSplashOut] = useState(false)
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
  const [currentThemeKey, setCurrentThemeKey] = useLocalStorage<UnifiedThemeKey>("chess_theme_v15", "amberOak")
  const [lang, setLang] = useLocalStorage<Lang>("chess_lang", "en")
  const [difficulty, setDifficulty] = useLocalStorage<Difficulty>("chess_difficulty", "medium")
  const [timeControl, setTimeControl] = useLocalStorage<TimeControl>("chess_time", 5)
  const [gameMode, setGameMode] = useState<"pvp" | "pve">("pvp")
  const [pendingMode, setPendingMode] = useState<"pvp" | "pve" | null>(null)
  const [isBotThinking, setIsBotThinking] = useState(false)
  const [sessionScore, setSessionScore] = useLocalStorage<{ w: number; l: number; d: number }>("chess_score", { w: 0, l: 0, d: 0 })
  const [localHistory, setLocalHistory] = useLocalStorage<LocalGame[]>("chess_history_v1", [])
  const [tgUser, setTgUser] = useLocalStorage<TelegramUser | null>("chess_tg_user", null)
  const [userXP, setUserXP] = useLocalStorage<UserXP>("chess_xp_v1", { xp: 0, level: 1, gamesPlayed: 0, wins: 0, losses: 0, draws: 0 })
  const [xpPopup, setXpPopup] = useState<{ gained: number; levelUp: boolean } | null>(null)
  const [historyStack, setHistoryStack] = useState<string[]>([])
  const coachRef = useRef<HTMLDivElement>(null)

  const theme = UNIFIED_THEMES[currentThemeKey] ?? UNIFIED_THEMES.amberOak
  const isDark = currentThemeKey === "neonDusk"
  const tx = theme.coachUI.text; const bg = theme.coachUI.bg; const br = theme.coachUI.border
  const t = TRANSLATIONS[lang]

  // Splash timing
  useEffect(() => {
    setMounted(true)
    const t1 = setTimeout(() => setSplashOut(true), 1800)
    const t2 = setTimeout(() => setScreen("menu"), 2300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useEffect(() => { if (mounted) setCoachMessages([t.welcome]) }, [lang, mounted])
  useEffect(() => {
    if (!mounted) return
    document.body.style.backgroundColor = theme.boardColors.pageBg
    return () => { document.body.style.backgroundColor = "" }
  }, [theme.boardColors.pageBg, mounted])
  useEffect(() => { if (coachRef.current) coachRef.current.scrollTop = coachRef.current.scrollHeight }, [coachMessages])

  useEffect(() => {
    if (!isGameActive || game.isGameOver() || isPaused) return
    const id = setInterval(() => {
      if (game.turn() === "w") {
        setWhiteTime(p => { if (p <= 1) { setIsGameActive(false); handleGameEnd({ winner: "Black", reason: t.onTime }); return 0 } return p - 1 })
      } else {
        setBlackTime(p => { if (p <= 1) { setIsGameActive(false); handleGameEnd({ winner: "White", reason: t.onTime }); return 0 } return p - 1 })
      }
    }, 1000)
    return () => clearInterval(id)
  }, [isGameActive, game, isPaused, t])

  useEffect(() => {
    if (screen !== "game" || gameMode !== "pve" || !isGameActive || isPaused || game.isGameOver() || game.turn() !== "b" || isBotThinking) return
    const go = async () => {
      setIsBotThinking(true)
      const controller = new AbortController()
      const tout = setTimeout(() => controller.abort(), 8000)
      try {
        const cur = gameRef.current
        const res = await fetch(`https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(cur.fen())}&depth=${DIFFICULTY_DEPTH[difficulty]}`, { signal: controller.signal })
        clearTimeout(tout)
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
            if (next.isCheckmate()) handleGameEnd({ winner: "White", reason: t.checkmate })
            else if (next.isDraw() || next.isStalemate()) handleGameEnd({ winner: "Draw", reason: t.draw })
          }
        }
      } catch {
        clearTimeout(tout)
        try {
          const cur = gameRef.current; const moves = cur.moves({ verbose: true })
          if (moves.length > 0) {
            const mv = moves[Math.floor(Math.random() * moves.length)]
            const next = new Chess(cur.fen()); next.move(mv)
            gameRef.current = next; setGame(next)
            setMoveHistory(next.history()); setLastMove({ from: mv.from as Square, to: mv.to as Square })
            addCoach(`${t.stockfish}: ${mv.san}`)
          }
        } catch {}
      }
      setIsBotThinking(false)
    }
    const delay = difficulty === "easy" ? 300 : difficulty === "medium" ? 600 : 900
    const timer = setTimeout(go, delay)
    return () => clearTimeout(timer)
  }, [game, gameMode, screen, isGameActive, isPaused, isBotThinking, difficulty, t])

  const gameStartTimeRef = useRef(Date.now())

  const handleGameEnd = useCallback((result: GameResult) => {
    setGameResult(result); setIsGameActive(false)
    const dbResult: "win" | "loss" | "draw" = result.winner === "Draw" ? "draw" : result.winner === "White" ? "win" : "loss"
    setSessionScore(prev => ({
      w: prev.w + (result.winner === "White" ? 1 : 0),
      l: prev.l + (result.winner === "Black" ? 1 : 0),
      d: prev.d + (result.winner === "Draw" ? 1 : 0),
    }))

    // Начисляем XP
    const movesCount = gameRef.current.history().length
    let gained = dbResult === "win" ? XP_WIN : dbResult === "draw" ? XP_DRAW : XP_LOSS
    if (movesCount >= 20) gained += XP_LONG
    if (dbResult === "win" && result.reason === "checkmate") gained += 25

    setUserXP(prev => {
      const newXp = prev.xp + gained
      const newLevel = levelFromXp(newXp)
      const didLevelUp = newLevel > prev.level
      setTimeout(() => setXpPopup({ gained, levelUp: didLevelUp }), 800)
      setTimeout(() => setXpPopup(null), 4000)
      return {
        xp: newXp,
        level: newLevel,
        gamesPlayed: prev.gamesPlayed + 1,
        wins: prev.wins + (dbResult === "win" ? 1 : 0),
        losses: prev.losses + (dbResult === "loss" ? 1 : 0),
        draws: prev.draws + (dbResult === "draw" ? 1 : 0),
      }
    })

    const newGame: LocalGame = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mode: gameMode,
      result: dbResult,
      reason: result.reason,
      moves: movesCount,
      duration: Math.floor((Date.now() - gameStartTimeRef.current) / 1000),
      difficulty: gameMode === "pve" ? difficulty : undefined,
    }
    setLocalHistory(prev => [newGame, ...prev].slice(0, 50))
  }, [setSessionScore, setLocalHistory, setUserXP, gameMode, difficulty])

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

  const getInitialTime = useCallback(() => timeControl === 0 ? 99 * 60 : timeControl * 60, [timeControl])

  const resetGame = useCallback(() => {
    const fresh = new Chess(); gameRef.current = fresh; setGame(fresh)
    setSelectedSquare(null); setLegalMoves([]); setMoveHistory([])
    setCoachMessages([t.welcome]); setHistoryStack([])
    const initTime = getInitialTime()
    setWhiteTime(initTime); setBlackTime(initTime); setIsGameActive(false)
    setIsPaused(false); setLastMove(null); setGameResult(null); setIsBotThinking(false)
    gameStartTimeRef.current = Date.now()
  }, [t, getInitialTime])

  const handleUndo = useCallback(() => {
    if (historyStack.length === 0) return
    const prev = historyStack[historyStack.length - 1]
    const restored = new Chess(prev)
    gameRef.current = restored; setGame(restored)
    setMoveHistory(restored.history())
    setHistoryStack(s => s.slice(0, -1))
    setSelectedSquare(null); setLegalMoves([]); setLastMove(null)
    setCoachMessages(p => p.slice(0, -1).length > 0 ? p.slice(0, -1) : [t.welcome])
  }, [historyStack, t])

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
        setHistoryStack(s => [...s, game.fen()])
        const next = new Chess(game.fen())
        const mv = next.move({ from: selectedSquare, to: square, promotion: "q" })
        if (mv) {
          if (!isGameActive) setIsGameActive(true)
          setLastMove({ from: selectedSquare, to: square })
          setMoveHistory(next.history())
          addCoach(`${mv.san}${next.isCheck() ? ` — ${game.turn() === "w" ? t.black : t.white} ${t.checkMsg}!` : ""}`)
          if (next.isCheckmate()) handleGameEnd({ winner: next.turn() === "w" ? "Black" : "White", reason: t.checkmate })
          else if (next.isStalemate()) handleGameEnd({ winner: "Draw", reason: t.stalemate })
          else if (next.isDraw()) handleGameEnd({ winner: "Draw", reason: t.draw })
          gameRef.current = next; setGame(next)
        }
      } catch {}
    }
    setSelectedSquare(null); setLegalMoves([])
  }, [game, selectedSquare, legalMoves, isGameActive, isPaused, gameMode, isBotThinking, addCoach, handleGameEnd, t])

  const sqStyle = (file: string, rank: string, sq: Square): React.CSSProperties => {
    const isL = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
    let hi = ""
    if (selectedSquare === sq) hi = theme.boardColors.selected
    if (lastMove && (lastMove.from === sq || lastMove.to === sq)) hi = isL ? theme.boardColors.lastLight : theme.boardColors.lastDark
    if (theme.boardImageUrl) return { backgroundImage: hi ? `linear-gradient(${hi},${hi}),url("${theme.boardImageUrl}")` : `url("${theme.boardImageUrl}")`, backgroundSize: "100% 200%", backgroundPosition: isL ? "top" : "bottom", transition: "background .15s" }
    return { backgroundColor: hi || (isL ? theme.boardColors.light : theme.boardColors.dark), transition: "background-color .15s" }
  }

  const isWA = game.turn() === "w" && isGameActive && !isPaused
  const isBA = game.turn() === "b" && isGameActive && !isPaused
  const isInCheck = game.isCheck()
  const checkedColor = isInCheck ? game.turn() : null

  if (!mounted) return <div style={{ minHeight: "100vh", background: "#FDF5E6" }} />

  const FONTS = "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=DM+Mono:wght@300;400&family=DM+Serif+Display:ital@0;1&display=swap"
  const BASE = `@import url('${FONTS}');*{box-sizing:border-box;margin:0;padding:0}.fm{font-family:'DM Mono',monospace}.fs{font-family:'DM Serif Display',serif}.fb{font-family:'EB Garamond',serif}`

  // ── SPLASH ──
  if (screen === "splash") return (
    <>
      <style>{`@import url('${FONTS}');*{box-sizing:border-box;margin:0;padding:0}.fm{font-family:'DM Mono',monospace}.fs{font-family:'DM Serif Display',serif}
        .splash{position:fixed;inset:0;background:${theme.boardColors.pageBg};display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999;transition:opacity .5s ease,transform .5s ease;}
        .splash.out{opacity:0;transform:scale(1.03);}
        .piece-anim{font-size:5rem;animation:pieceIn .6s cubic-bezier(.34,1.56,.64,1) both;}
        .title-anim{animation:titleIn .7s .2s cubic-bezier(.34,1.56,.64,1) both;}
        .sub-anim{animation:fadeUp .5s .5s ease both;}
        .bar-anim{animation:barIn .8s .7s ease both;}
        @keyframes pieceIn{from{opacity:0;transform:translateY(-30px) scale(.5)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes titleIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:.45;transform:translateY(0)}}
        @keyframes barIn{from{opacity:0;width:0}to{opacity:1;width:60px}}
      `}</style>
      <div className={`splash${splashOut ? " out" : ""}`}>
        <div className="piece-anim" style={{ color: tx }}>♛</div>
        <h1 className="fs title-anim" style={{ fontSize: "clamp(3rem,10vw,5rem)", fontStyle: "italic", color: tx, lineHeight: 1, marginTop: ".5rem" }}>Chess</h1>
        <p className="fm sub-anim" style={{ fontSize: ".6rem", letterSpacing: ".4em", textTransform: "uppercase", color: tx, marginTop: ".8rem" }}>choose your game</p>
        <div className="bar-anim fm" style={{ height: "1px", background: tx, marginTop: "2rem", opacity: .2 }} />
      </div>
    </>
  )

  // ── LEARN ──
  if (screen === "learn") return <LearnScreen theme={theme} lang={lang} onBack={() => setScreen("menu")} />

  const SettingsModal = ({ onClose, inGame }: { onClose: () => void; inGame?: boolean }) => (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(26,25,22,.35)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn .2s ease" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.boardColors.pageBg, border: `1px solid ${br}`, width: 360, maxWidth: "92vw", borderRadius: 6, overflow: "hidden", color: tx, animation: "slideUp .25s ease" }}>
        <div style={{ padding: "1.1rem 1.4rem", borderBottom: `1px solid ${br}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="fm" style={{ fontSize: ".72rem", letterSpacing: ".18em", textTransform: "uppercase", opacity: .5 }}>{t.settings}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: tx, opacity: .38, display: "flex" }}><X size={16} /></button>
        </div>
        {/* Theme */}
        <div style={{ padding: ".9rem 1.4rem", borderBottom: `1px solid ${br}` }}>
          <p className="fm" style={{ fontSize: ".6rem", letterSpacing: ".2em", textTransform: "uppercase", opacity: .35, marginBottom: ".6rem" }}>{t.themeGallery}</p>
          {(Object.keys(UNIFIED_THEMES) as UnifiedThemeKey[]).map(key => (
            <div key={key} onClick={() => setCurrentThemeKey(key)} style={{ padding: ".6rem 0", cursor: "pointer", display: "flex", alignItems: "center", gap: ".75rem", opacity: currentThemeKey === key ? 1 : .5, transition: "opacity .15s" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: currentThemeKey === key ? tx : "transparent", border: `1px solid ${tx}50`, display: "inline-block" }} />
              <span className="fm" style={{ fontSize: ".72rem", letterSpacing: ".1em", textTransform: "uppercase" }}>{UNIFIED_THEMES[key].name}</span>
            </div>
          ))}
        </div>
        {/* Time control */}
        {!inGame && (
          <div style={{ padding: ".9rem 1.4rem", borderBottom: `1px solid ${br}` }}>
            <p className="fm" style={{ fontSize: ".6rem", letterSpacing: ".2em", textTransform: "uppercase", opacity: .35, marginBottom: ".6rem" }}>{t.timeControl}</p>
            <div style={{ display: "flex", gap: ".4rem" }}>
              {TIME_OPTIONS.map(tc => (
                <button key={tc} onClick={() => setTimeControl(tc)} style={{ fontFamily: "'DM Mono',monospace", fontSize: ".65rem", letterSpacing: ".08em", padding: ".45rem .7rem", border: `1px solid ${timeControl === tc ? tx + "80" : tx + "22"}`, background: timeControl === tc ? `${tx}0e` : "transparent", color: tx, borderRadius: 3, cursor: "pointer", opacity: timeControl === tc ? 1 : .5, transition: "all .2s" }}>
                  {tc === 0 ? "∞" : `${tc}m`}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Language */}
        <div style={{ padding: ".9rem 1.4rem", borderBottom: inGame ? `1px solid ${br}` : "none" }}>
          <p className="fm" style={{ fontSize: ".6rem", letterSpacing: ".2em", textTransform: "uppercase", opacity: .35, marginBottom: ".6rem" }}>{t.language}</p>
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

  // ── TELEGRAM LOGIN BUTTON ──
  // ── TELEGRAM OPENID LOGIN ──
  function TelegramLoginButton({ onAuth, tx, t }: { onAuth: (u: TelegramUser) => void; tx: string; t: Record<string,string> }) {
    // Читаем ?tguser=... из URL после редиректа
    useEffect(() => {
      const params = new URLSearchParams(window.location.search)
      const tguser = params.get("tguser")
      const tgerror = params.get("tgerror")
      if (tguser) {
        try {
          const user = JSON.parse(decodeURIComponent(tguser))
          window.history.replaceState({}, "", window.location.pathname)
          onAuth(user)
        } catch {}
      }
      if (tgerror) {
        window.history.replaceState({}, "", window.location.pathname)
      }
    }, [onAuth])

    const handleLogin = () => {
      const clientId = "8831113537"
      const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/telegram/callback`)
      const state = Math.random().toString(36).slice(2)
      sessionStorage.setItem("tg_state", state)
      const url = `https://oauth.telegram.org/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid+profile&state=${state}`
      window.location.href = url
    }

    return (
      <button onClick={handleLogin}
        style={{ width: "100%", fontFamily: "'DM Mono',monospace", fontSize: ".68rem", letterSpacing: ".15em", textTransform: "uppercase", background: "none", border: `1px solid ${tx}30`, color: tx, padding: ".75rem 1rem", borderRadius: 3, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = `${tx}60`; e.currentTarget.style.background = `${tx}06`; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px -4px rgba(0,0,0,.14)" }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = `${tx}30`; e.currentTarget.style.background = "none"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.024 9.54c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.48 14.697l-2.95-.924c-.642-.2-.654-.642.136-.953l11.527-4.448c.535-.194 1.003.13.37.876z"/></svg>
        {t.signInTg}
      </button>
    )
  }

  // ── PROFILE SCREEN ──
  if (screen === "profile" && tgUser) {
    const wr = userXP.gamesPlayed > 0 ? Math.round((userXP.wins / userXP.gamesPlayed) * 100) : 0
    const prog = Math.round(levelProgress(userXP.xp) * 100)
    return (
      <>
        <style>{BASE + `
          .pw{min-height:100vh;background:${theme.boardColors.pageBg};color:${tx};padding:2rem 1rem;animation:screenIn .35s cubic-bezier(.4,0,.2,1)}
          .pin{max-width:420px;margin:0 auto}
          .back3{font-family:'DM Mono',monospace;font-size:.62rem;letter-spacing:.15em;text-transform:uppercase;background:none;border:none;color:${tx}50;cursor:pointer;padding:0;margin-bottom:1.8rem;display:flex;align-items:center;gap:.3rem;transition:color .2s}
          .back3:hover{color:${tx}}
          .pstat{display:grid;grid-template-columns:repeat(2,1fr);gap:.6rem;margin-bottom:1.2rem}
          .psc{background:${bg};border:1px solid ${br};border-radius:4px;padding:1rem;text-align:center;transition:all .2s}
          .psc:hover{box-shadow:0 4px 12px -4px rgba(0,0,0,.1);transform:translateY(-1px)}
          .signoutbtn{font-family:'DM Mono',monospace;font-size:.62rem;letter-spacing:.15em;text-transform:uppercase;background:none;border:1px solid ${tx}18;color:${tx}45;padding:.55rem 1rem;border-radius:3px;cursor:pointer;display:flex;align-items:center;gap:.4rem;transition:all .2s;margin-top:1.2rem}
          .signoutbtn:hover{border-color:rgba(239,68,68,.4);color:rgba(239,68,68,.7);background:rgba(239,68,68,.05)}
          @keyframes screenIn{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
        `}</style>
        <div className="pw">
          <div className="pin">
            <button className="back3" onClick={() => setScreen("menu")}>
              <ChevronLeft size={12} /> {lang === "ru" ? "В меню" : "Back"}
            </button>

            {/* Avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: `${tx}10`, border: `2px solid ${tx}14` }}>
                {tgUser.photo_url
                  ? <img src={tgUser.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <User size={28} style={{ opacity: .3, margin: "auto", display: "block", paddingTop: 16 }} />}
              </div>
              <div>
                <div className="fs" style={{ fontSize: "1.5rem", fontStyle: "italic", color: tx }}>{tgUser.first_name}</div>
                {tgUser.username && <div className="fm" style={{ fontSize: ".6rem", opacity: .38, marginTop: ".15rem" }}>@{tgUser.username}</div>}
              </div>
            </div>

            {/* Level card */}
            <div style={{ background: bg, border: `1px solid ${br}`, borderRadius: 6, padding: "1.25rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: ".8rem" }}>
                <div>
                  <div className="fm" style={{ fontSize: ".56rem", letterSpacing: ".2em", textTransform: "uppercase", opacity: .35, marginBottom: ".3rem" }}>{t.level} {userXP.level}</div>
                  <div className="fs" style={{ fontSize: "1.4rem", fontStyle: "italic", color: tx }}>{getTitle(userXP.level, lang)}</div>
                </div>
                <div className="fm" style={{ fontSize: "1.1rem", opacity: .6 }}>{userXP.xp} <span style={{ fontSize: ".6rem", opacity: .6 }}>XP</span></div>
              </div>
              {/* XP progress bar */}
              <div style={{ height: 4, background: `${tx}10`, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${prog}%`, background: `${tx}65`, borderRadius: 2, transition: "width .6s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: ".4rem" }}>
                <span className="fm" style={{ fontSize: ".52rem", opacity: .3 }}>{prog}%</span>
                <span className="fm" style={{ fontSize: ".52rem", opacity: .3 }}>{t.nextLevel}: {xpForLevel(userXP.level)} XP</span>
              </div>
            </div>

            {/* Stats grid */}
            <div className="pstat">
              {([
                [userXP.gamesPlayed, t.gamesPlayed],
                [`${wr}%`, t.winRate],
                [userXP.wins, lang==="ru"?"Победы":"Wins"],
                [userXP.losses, lang==="ru"?"Пораж.":"Losses"],
              ] as [any,string][]).map(([v,l]) => (
                <div key={l} className="psc">
                  <div className="fs" style={{ fontSize: "1.6rem", fontStyle: "italic", color: tx, lineHeight: 1 }}>{v}</div>
                  <div className="fm" style={{ fontSize: ".5rem", letterSpacing: ".14em", textTransform: "uppercase", opacity: .35, marginTop: ".25rem" }}>{l}</div>
                </div>
              ))}
            </div>

            {/* XP breakdown */}
            <div style={{ background: bg, border: `1px solid ${br}`, borderRadius: 4, padding: "1rem", marginBottom: ".6rem" }}>
              <p className="fm" style={{ fontSize: ".56rem", letterSpacing: ".2em", textTransform: "uppercase", opacity: .35, marginBottom: ".75rem" }}>XP</p>
              {([
                [lang==="ru"?"Победа":"Win", "+50"],
                [lang==="ru"?"Ничья":"Draw", "+20"],
                [lang==="ru"?"Поражение":"Loss", "+10"],
                [lang==="ru"?"Длинная партия (20+ ходов)":"Long game (20+ moves)", "+15"],
                [lang==="ru"?"Мат":"Checkmate", "+25"],
              ] as [string,string][]).map(([label, xp]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: ".3rem 0", borderBottom: `1px solid ${tx}08` }}>
                  <span className="fm" style={{ fontSize: ".62rem", opacity: .55 }}>{label}</span>
                  <span className="fm" style={{ fontSize: ".62rem", color: "#4ade80", opacity: .8 }}>{xp}</span>
                </div>
              ))}
            </div>

            <button className="signoutbtn" onClick={() => { setTgUser(null); setScreen("menu") }}>
              <LogOut size={13} /> {t.signOut}
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── MENU ──
  if (screen === "menu") return (
    <>
      <style>{BASE + `
        .root{min-height:100vh;background:${theme.boardColors.pageBg};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;color:${tx};animation:screenIn .35s cubic-bezier(.4,0,.2,1);}
        .mbtn{display:block;width:100%;max-width:280px;font-family:'DM Mono',monospace;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;background:none;border:1px solid ${tx}28;color:${tx};padding:.85rem 1.5rem;border-radius:3px;cursor:pointer;transition:all .22s;text-align:center;}
        .mbtn:hover{border-color:${tx}65;background:${tx}07;box-shadow:0 4px 14px -4px rgba(0,0,0,.14);transform:translateY(-1px)}
        .mbtn:active{transform:translateY(0);box-shadow:none}
        .mbtn.hi{border-color:${tx}50;}
        .mbtn.active{border-color:${tx}80;background:${tx}0a;}
        .mbtn.learn{border-style:dashed;opacity:.7;}
        .mbtn.learn:hover{opacity:1;}
        .dcard{width:100%;max-width:280px;border:1px solid ${tx}18;border-radius:3px;overflow:hidden;animation:slideUp .25s ease;}
        .drow{display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;cursor:pointer;transition:all .2s;border-bottom:1px solid ${tx}10;}
        .drow:last-child{border-bottom:none;}
        .drow:hover{background:${tx}06;padding-left:1.15rem;}
        .drow.sel{background:${tx}0a;border-left:2px solid ${tx}60;}
        .score-bar{display:flex;gap:.5rem;align-items:center;margin-top:.5rem;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes screenIn{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:translateX(0)}}
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
            <div className="dcard">
              {(["easy", "medium", "hard", "master"] as Difficulty[]).map(d => (
                <div key={d} className={`drow${difficulty === d ? " sel" : ""}`} onClick={() => setDifficulty(d)}>
                  <div style={{ display: "flex", flexDirection: "column", gap: ".2rem" }}>
                    <span className="fm" style={{ fontSize: ".68rem", letterSpacing: ".12em", textTransform: "uppercase" }}>{t[d]}</span>
                    <span className="fm" style={{ fontSize: ".54rem", opacity: .38 }}>{t[`${d}Desc`]}</span>
                  </div>
                  <div style={{ display: "flex", gap: 3 }}>
                    {Array.from({ length: 4 }).map((_, i) => <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i < DIFFICULTY_DOTS[d] ? tx : "transparent", border: `1px solid ${tx}40`, display: "inline-block" }} />)}
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

          <button className="mbtn learn" onClick={() => setScreen("learn")}>✦ {t.learn}</button>
          <button className="mbtn learn" onClick={() => setScreen("history")}>◈ {t.history}</button>
          <button className="mbtn" onClick={() => setSettingsOpen(true)}>{t.settings}</button>
        </div>

        {/* Telegram auth block */}
        <div style={{ marginTop: "2rem", width: "100%", maxWidth: 280 }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: ".75rem" }}>
            <div style={{ flex: 1, height: "1px", background: `${tx}14` }} />
            <span className="fm" style={{ fontSize: ".54rem", letterSpacing: ".2em", textTransform: "uppercase", opacity: .3 }}>
              {tgUser ? t.profile : t.signIn}
            </span>
            <div style={{ flex: 1, height: "1px", background: `${tx}14` }} />
          </div>

          {tgUser ? (
            // Профиль карточка
            <div style={{ border: `1px solid ${tx}18`, borderRadius: 4, overflow: "hidden" }}>
              {/* User info */}
              <div style={{ display: "flex", alignItems: "center", gap: ".75rem", padding: ".85rem 1rem", cursor: "pointer", transition: "background .2s" }}
                onClick={() => setScreen("profile")}
                onMouseEnter={e => (e.currentTarget.style.background = `${tx}06`)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: `${tx}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {tgUser.photo_url
                    ? <img src={tgUser.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <User size={16} style={{ opacity: .4 }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fm" style={{ fontSize: ".68rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tgUser.first_name}{tgUser.username ? ` @${tgUser.username}` : ""}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: ".4rem", marginTop: ".2rem" }}>
                    <span className="fm" style={{ fontSize: ".54rem", opacity: .5 }}>
                      Lv.{userXP.level} · {getTitle(userXP.level, lang)}
                    </span>
                  </div>
                </div>
                <ChevronRight size={13} style={{ opacity: .25 }} />
              </div>
              {/* XP bar */}
              <div style={{ padding: ".4rem 1rem .7rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".3rem" }}>
                  <span className="fm" style={{ fontSize: ".52rem", opacity: .35 }}>{userXP.xp} XP</span>
                  <span className="fm" style={{ fontSize: ".52rem", opacity: .35 }}>{t.nextLevel}: {xpForLevel(userXP.level)} XP</span>
                </div>
                <div style={{ height: 3, background: `${tx}12`, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round(levelProgress(userXP.xp) * 100)}%`, background: `${tx}60`, borderRadius: 2, transition: "width .5s" }} />
                </div>
              </div>
            </div>
          ) : (
            // Простой вход — только имя
            <TelegramLoginButton onAuth={(user) => setTgUser(user)} tx={tx} t={t} />
          )}
        </div>

        {/* Session score */}
        {(sessionScore.w + sessionScore.l + sessionScore.d) > 0 && (
          <div style={{ marginTop: "1.8rem", textAlign: "center" }}>
            <p className="fm" style={{ fontSize: ".54rem", letterSpacing: ".2em", textTransform: "uppercase", opacity: .28, marginBottom: ".4rem" }}>{t.sessionScore}</p>
            <div className="score-bar">
              <span className="fm" style={{ fontSize: ".62rem", color: "#4ade80", opacity: .8 }}>{sessionScore.w}W</span>
              <span className="fm" style={{ fontSize: ".62rem", opacity: .3 }}>·</span>
              <span className="fm" style={{ fontSize: ".62rem", opacity: .5 }}>{sessionScore.d}D</span>
              <span className="fm" style={{ fontSize: ".62rem", opacity: .3 }}>·</span>
              <span className="fm" style={{ fontSize: ".62rem", color: "#f87171", opacity: .8 }}>{sessionScore.l}L</span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", marginTop: "1.5rem" }}>
          {(Object.keys(UNIFIED_THEMES) as UnifiedThemeKey[]).map(k => (
            <span key={k} onClick={() => setCurrentThemeKey(k)} style={{ width: 13, height: 13, borderRadius: "50%", background: UNIFIED_THEMES[k].boardColors.dark, border: `2px solid ${currentThemeKey === k ? tx : "transparent"}`, cursor: "pointer", display: "inline-block", transition: "transform .2s" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: ".35rem", marginTop: ".8rem" }}>
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

  // ── HISTORY ──
  if (screen === "history") {
    const fmtDur = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`
    const fmtDate = (iso: string) => {
      const d = new Date(iso); const now = new Date()
      const isToday = d.toDateString() === now.toDateString()
      const yest = new Date(now); yest.setDate(yest.getDate()-1)
      const isYest = d.toDateString() === yest.toDateString()
      if (isToday) return `${t.today}, ${d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`
      if (isYest) return `${t.yesterday}, ${d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`
      return d.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-GB", {day:"numeric",month:"short"})
    }
    const wins = localHistory.filter(g => g.result === "win").length
    const losses = localHistory.filter(g => g.result === "loss").length
    const draws = localHistory.filter(g => g.result === "draw").length
    const wr = localHistory.length > 0 ? Math.round((wins/localHistory.length)*100) : 0
    return (
      <>
        <style>{BASE + `
          .hw{min-height:100vh;background:${theme.boardColors.pageBg};color:${tx};padding:2rem 1rem;animation:screenIn .35s cubic-bezier(.4,0,.2,1)}
          .hin{max-width:520px;margin:0 auto}
          .back2{font-family:'DM Mono',monospace;font-size:.62rem;letter-spacing:.15em;text-transform:uppercase;background:none;border:none;color:${tx}50;cursor:pointer;padding:0;margin-bottom:1.8rem;display:flex;align-items:center;gap:.3rem;transition:color .2s}
          .back2:hover{color:${tx}}
          .hsg{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;border:1px solid ${tx}12;border-radius:4px;overflow:hidden;margin-bottom:1.5rem}
          .hsc{padding:1rem .5rem;text-align:center;background:${bg};transition:background .2s}
          .hsc:hover{background:${tx}05}
          .hlist{display:flex;flex-direction:column;gap:0;border:1px solid ${br};border-radius:4px;overflow:hidden}
          .hrow{display:flex;align-items:center;gap:.75rem;padding:.85rem 1rem;border-bottom:1px solid ${tx}08;transition:background .2s;cursor:default}
          .hrow:last-child{border-bottom:none}
          .hrow:hover{background:${tx}04}
          .clrbtn{font-family:'DM Mono',monospace;font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;background:none;border:1px solid ${tx}18;color:${tx}45;padding:.4rem .8rem;border-radius:3px;cursor:pointer;transition:all .2s}
          .clrbtn:hover{border-color:rgba(239,68,68,.4);color:rgba(239,68,68,.7);background:rgba(239,68,68,.05)}
          @keyframes screenIn{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
          @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        `}</style>
        <div className="hw">
          <div className="hin">
            <button className="back2" onClick={() => setScreen("menu")}>
              <ChevronLeft size={12}/> {lang === "ru" ? "В меню" : "Back to menu"}
            </button>
            <p className="fm" style={{fontSize:".58rem",letterSpacing:".35em",textTransform:"uppercase",opacity:.3,marginBottom:".4rem"}}>{lang === "ru" ? "ИСТОРИЯ" : "HISTORY"}</p>
            <h1 className="fs" style={{fontSize:"clamp(2rem,6vw,3rem)",fontStyle:"italic",color:tx,marginBottom:"1.5rem"}}>{t.history}</h1>

            {/* Stats bar */}
            {localHistory.length > 0 && (
              <div className="hsg" style={{marginBottom:"1.5rem"}}>
                {([
                  [localHistory.length, lang==="ru"?"Игр":"Games"],
                  [wins, lang==="ru"?"Победы":"Wins"],
                  [losses, lang==="ru"?"Пораж.":"Losses"],
                  [`${wr}%`, lang==="ru"?"Винрейт":"Win rate"],
                ] as [any,string][]).map(([v,l]) => (
                  <div key={l} className="hsc">
                    <div className="fs" style={{fontSize:"1.6rem",fontStyle:"italic",color:tx,lineHeight:1}}>{v}</div>
                    <div className="fm" style={{fontSize:".5rem",letterSpacing:".14em",textTransform:"uppercase",opacity:.35,marginTop:".25rem"}}>{l}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Games list */}
            {localHistory.length === 0 ? (
              <div style={{textAlign:"center",padding:"3rem 1rem",opacity:.35}}>
                <div style={{fontSize:"2rem",marginBottom:".75rem"}}>♟</div>
                <p className="fb" style={{fontStyle:"italic",fontSize:"1rem"}}>{t.noGames}</p>
              </div>
            ) : (
              <>
                <div className="hlist" style={{marginBottom:"1rem",animation:"slideUp .3s ease"}}>
                  {localHistory.map((g) => (
                    <div key={g.id} className="hrow">
                      <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,background:g.result==="win"?"#4ade80":g.result==="loss"?"#f87171":`${tx}30`}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="fm" style={{fontSize:".68rem",textTransform:"capitalize"}}>
                          {g.result==="win"?t.winLabel:g.result==="loss"?t.lossLabel:t.drawLabel}
                          {" · "}{g.mode==="pve"?t.vsAI:t.vsHuman}
                          {g.difficulty && <span style={{opacity:.45}}> · {g.difficulty}</span>}
                        </div>
                        <div className="fm" style={{fontSize:".54rem",opacity:.32,marginTop:".2rem"}}>
                          {g.moves} {t.movesLabel} · {fmtDur(g.duration)} · {g.reason}
                        </div>
                      </div>
                      <div className="fm" style={{fontSize:".55rem",opacity:.28,flexShrink:0}}>{fmtDate(g.date)}</div>
                    </div>
                  ))}
                </div>
                <button className="clrbtn" onClick={() => { if (confirm(lang==="ru"?"Очистить всю историю?":"Clear all history?")) setLocalHistory([]) }}>
                  {t.clearHistory}
                </button>
              </>
            )}
          </div>
        </div>
      </>
    )
  }

  // ── GAME ──
  return (
    <>
      <style>{BASE + `
        .gw{min-height:100vh;background:${theme.boardColors.pageBg};padding:1.5rem 1rem;animation:screenIn .35s cubic-bezier(.4,0,.2,1)}
        .gl{display:flex;flex-direction:row;align-items:flex-start;gap:2rem;width:100%;max-width:980px;margin:0 auto}
        .bc{flex:0 0 auto;width:min(560px,calc(100vw - 360px));min-width:280px}
        .pc{flex:0 0 280px;width:280px;display:flex;flex-direction:column;gap:.65rem;padding-top:2.5rem}
        @media(max-width:720px){.gl{flex-direction:column;align-items:center}.bc{width:min(560px,calc(100vw - 2rem))}.pc{flex:none;width:min(560px,calc(100vw - 2rem));padding-top:0}}
        .bw{position:relative;width:100%;padding-top:100%}
        .bgrid{position:absolute;inset:0;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);border:1px solid rgba(0,0,0,0.12);box-shadow:0 20px 60px -10px rgba(0,0,0,.3),0 4px 16px -4px rgba(0,0,0,.15);border-radius:2px;overflow:hidden;}
        .sq{position:relative;display:flex;align-items:center;justify-content:center;border:none;padding:0;cursor:pointer;width:100%;height:100%;transition:filter .1s}
        .sq:hover:not([disabled]){filter:brightness(1.06)}
        .sq:active:not([disabled]){filter:brightness(.9)}
        .dot{position:absolute;width:26%;height:26%;border-radius:50%;background:${isDark ? "rgba(255,255,255,.3)" : "rgba(0,0,0,.24)"};pointer-events:none;z-index:3}
        .ring{position:absolute;inset:0;border:3px solid ${theme.boardColors.selected};pointer-events:none;z-index:3}
        .check-ring{position:absolute;inset:0;box-shadow:inset 0 0 0 3px rgba(239,68,68,.7);pointer-events:none;z-index:3;animation:checkPulse 1s ease infinite}
        @keyframes checkPulse{0%,100%{box-shadow:inset 0 0 0 3px rgba(239,68,68,.7)}50%{box-shadow:inset 0 0 0 3px rgba(239,68,68,1),0 0 12px rgba(239,68,68,.4)}}
        .coord{position:absolute;font-size:10px;font-family:'DM Mono',monospace;z-index:1;pointer-events:none;opacity:.58}
        .prow{display:flex;justify-content:space-between;align-items:center;padding:.4rem .1rem}
        .card{background:${bg};border:1px solid ${br};border-radius:4px;overflow:hidden;transition:box-shadow .2s}
        .card:hover{box-shadow:0 4px 16px -4px rgba(0,0,0,.1)}
        .chd{display:flex;justify-content:space-between;align-items:center;padding:.65rem .9rem;border-bottom:1px solid ${br}}
        .lbl{font-family:'DM Mono',monospace;font-size:.58rem;letter-spacing:.2em;text-transform:uppercase;opacity:.38}
        .cscroll{padding:.65rem .9rem;max-height:100px;overflow-y:auto}
        .mwrap{padding:.5rem .9rem .65rem;max-height:70px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:.15rem .3rem}
        .arow{display:flex;gap:.4rem}
        .abtn2{flex:1;font-family:'DM Mono',monospace;font-size:.58rem;letter-spacing:.12em;text-transform:uppercase;background:none;border:1px solid ${tx}1e;color:${tx};padding:.55rem .3rem;border-radius:3px;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:.25rem}
        .abtn2:hover{border-color:${tx}55;background:${tx}08;box-shadow:0 2px 8px -2px rgba(0,0,0,.12);transform:translateY(-1px)}
        .abtn2:active{transform:translateY(0);box-shadow:none}
        .abtn2:disabled{opacity:.2;cursor:default;transform:none;box-shadow:none}
        .blay{position:fixed;inset:0;z-index:200;background:${isDark ? "rgba(0,0,0,.75)" : "rgba(26,25,22,.35)"};backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease}
        .rmod{background:${theme.boardColors.pageBg};border:1px solid ${br};padding:2.5rem 2rem;border-radius:6px;text-align:center;width:290px;max-width:90vw;animation:slideUp .3s ease}
        .pbtn{width:100%;font-family:'DM Mono',monospace;font-size:.68rem;letter-spacing:.15em;text-transform:uppercase;background:none;border:1px solid ${tx}22;color:${tx};padding:.78rem;border-radius:3px;cursor:pointer;transition:all .2s;margin-bottom:.4rem}
        .pbtn:hover{border-color:${tx}55;background:${tx}07;box-shadow:0 2px 10px -3px rgba(0,0,0,.15);transform:translateY(-1px)}
        .pbtn:active{transform:translateY(0);box-shadow:none}
        .timer-warn{animation:timerWarn .5s ease infinite}
        @keyframes timerWarn{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes screenIn{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
      `}</style>
      <div className="gw">
        <div className="gl">
          <div className="bc">
            {/* Black player row */}
            <div className="prow">
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span className="fm" style={{ fontSize: ".68rem", letterSpacing: ".1em", textTransform: "uppercase", opacity: isBA ? 1 : .42, display: "flex", alignItems: "center", gap: ".4rem" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2d2d2d", border: `1.5px solid ${tx}38`, display: "inline-block" }} />
                  {t.black} {isBotThinking && gameMode === "pve" && <span style={{ opacity: .38, fontSize: ".54rem" }}>({t.thinking})</span>}
                </span>
                <CapturedPieces fen={game.fen()} color="b" theme={theme} tx={tx} />
              </div>
              <span className={`fm${blackTime <= 30 && isBA ? " timer-warn" : ""}`} style={{ fontSize: "1rem", opacity: isBA ? 1 : .32, color: blackTime <= 30 && isBA ? "#f87171" : "inherit" }}>{timeControl === 0 ? "∞" : fmt(blackTime)}</span>
            </div>

            <div className="bw">
              <div className="bgrid">
                {RANKS.map(rank => FILES.map(file => {
                  const sq = `${file}${rank}` as Square
                  const piece = game.get(sq)
                  const isL = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
                  const url = piece ? getPieceUrl(piece.color, piece.type, theme) : null
                  const isKingInCheck = checkedColor && piece?.type === "k" && piece?.color === checkedColor
                  return (
                    <button key={sq} className="sq" onClick={() => handleSquareClick(sq)} style={sqStyle(file, rank, sq)} disabled={isBotThinking}>
                      {url && <img src={url} alt="" style={{ width: "84%", height: "84%", zIndex: 2, filter: theme.pieceFilter }} />}
                      {legalMoves.includes(sq) && (piece ? <span className="ring" /> : <span className="dot" />)}
                      {isKingInCheck && <span className="check-ring" />}
                      {file === "a" && <span className="coord" style={{ top: 3, left: 4, color: isL ? theme.boardColors.dark : theme.boardColors.light }}>{rank}</span>}
                      {rank === "1" && <span className="coord" style={{ bottom: 3, right: 4, color: isL ? theme.boardColors.dark : theme.boardColors.light }}>{file}</span>}
                    </button>
                  )
                }))}
              </div>
            </div>

            {/* White player row */}
            <div className="prow">
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span className="fm" style={{ fontSize: ".68rem", letterSpacing: ".1em", textTransform: "uppercase", opacity: isWA ? 1 : .42, display: "flex", alignItems: "center", gap: ".4rem" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f5f0e8", border: `1.5px solid ${tx}25`, display: "inline-block" }} />
                  {t.white}
                </span>
                <CapturedPieces fen={game.fen()} color="w" theme={theme} tx={tx} />
              </div>
              <span className={`fm${whiteTime <= 30 && isWA ? " timer-warn" : ""}`} style={{ fontSize: "1rem", opacity: isWA ? 1 : .32, color: whiteTime <= 30 && isWA ? "#f87171" : "inherit" }}>{timeControl === 0 ? "∞" : fmt(whiteTime)}</span>
            </div>
          </div>

          <div className="pc">
            <div className="card">
              <div className="chd">
                <span className="lbl">{t.status}</span>
                <button onClick={() => { setIsPaused(true); setSettingsOpen(true) }} style={{ background: "none", border: "none", cursor: "pointer", color: tx, opacity: .35, display: "flex", padding: 0 }}><Settings size={14} /></button>
              </div>
              <div className="fs" style={{ fontSize: "1rem", fontStyle: "italic", padding: ".65rem .9rem", lineHeight: 1.4, color: isInCheck ? "#ef4444" : tx, transition: "color .2s" }}>
                {game.isCheckmate() ? `${game.turn() === "w" ? t.black : t.white} ${t.winsMsg}` : game.isDraw() ? t.drawn : game.isCheck() ? `${game.turn() === "w" ? t.white : t.black} ${t.checkMsg}` : `${game.turn() === "w" ? t.white : t.black} ${t.toMove}`}
              </div>
              {gameMode === "pve" && (
                <div style={{ padding: ".2rem .9rem .6rem", display: "flex", gap: 4, alignItems: "center" }}>
                  {Array.from({ length: 4 }).map((_, i) => <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i < DIFFICULTY_DOTS[difficulty] ? `${tx}70` : "transparent", border: `1px solid ${tx}30`, display: "inline-block" }} />)}
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
              <button className="abtn2" onClick={handleUndo} disabled={historyStack.length === 0 || (gameMode === "pve" && game.turn() === "b")}><RotateCcw size={11} />{t.undo}</button>
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
              <p className="fb" style={{ fontStyle: "italic", opacity: .38, marginBottom: "1.5rem" }}>{t.byMsg} {gameResult.reason}</p>
              <div style={{ display: "flex", gap: ".5rem", justifyContent: "center", marginBottom: "1.2rem" }}>
                <span className="fm" style={{ fontSize: ".65rem", color: "#4ade80" }}>{sessionScore.w}W</span>
                <span className="fm" style={{ fontSize: ".65rem", opacity: .3 }}>·</span>
                <span className="fm" style={{ fontSize: ".65rem", opacity: .5 }}>{sessionScore.d}D</span>
                <span className="fm" style={{ fontSize: ".65rem", opacity: .3 }}>·</span>
                <span className="fm" style={{ fontSize: ".65rem", color: "#f87171" }}>{sessionScore.l}L</span>
              </div>
              <button className="pbtn" onClick={resetGame}>{t.playAgain}</button>
              <button className="pbtn" onClick={() => { resetGame(); setScreen("menu") }}>{t.backMenu}</button>
            </div>
          </div>
        )}
        {settingsOpen && <SettingsModal onClose={() => { setIsPaused(false); setSettingsOpen(false) }} inGame />}

        {/* XP Popup */}
        {xpPopup && (
          <div style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 300, animation: "slideUp .4s ease", pointerEvents: "none" }}>
            <div style={{ background: bg, border: `1px solid ${tx}20`, borderRadius: 8, padding: "1rem 1.4rem", boxShadow: "0 8px 32px -8px rgba(0,0,0,.25)", minWidth: 160 }}>
              {xpPopup.levelUp && (
                <div className="fs" style={{ fontSize: "1rem", fontStyle: "italic", color: tx, marginBottom: ".3rem" }}>
                  {t.levelUp} Lv.{userXP.level}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                <span style={{ fontSize: "1.2rem" }}>⭐</span>
                <span className="fm" style={{ fontSize: ".75rem", color: "#4ade80" }}>+{xpPopup.gained} XP</span>
              </div>
              <div className="fm" style={{ fontSize: ".56rem", opacity: .4, marginTop: ".3rem", textTransform: "uppercase", letterSpacing: ".1em" }}>{getTitle(userXP.level, lang)}</div>
            </div>
          </div>
        )}

        {/* Profile mini-button (top right) */}
        {tgUser && (
          <div style={{ position: "fixed", top: "1rem", right: "1rem", zIndex: 50 }}>
            <div onClick={() => setScreen("profile")} style={{ display: "flex", alignItems: "center", gap: ".5rem", background: bg, border: `1px solid ${br}`, borderRadius: 20, padding: ".3rem .7rem .3rem .3rem", cursor: "pointer", transition: "all .2s", boxShadow: "0 2px 8px -2px rgba(0,0,0,.1)" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 14px -4px rgba(0,0,0,.18)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 8px -2px rgba(0,0,0,.1)")}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", overflow: "hidden", background: `${tx}10` }}>
                {tgUser.photo_url ? <img src={tgUser.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={12} style={{ opacity: .4 }} />}
              </div>
              <span className="fm" style={{ fontSize: ".58rem", opacity: .65 }}>Lv.{userXP.level}</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
