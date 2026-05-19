"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Chess, Square, Move } from "chess.js"

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]
const SKAK_PIECES_URL = "https://raw.githubusercontent.com/MuTsunTsai/skak-svg/main/svg/{color}{piece}.svg"

const UNIFIED_THEMES = {
  arcticCobalt: {
    name: "Arctic Cobalt",
    boardImageUrl: "/aluminium.png",
    boardColors: { light: "#A3B8CC", dark: "#4C5A66", pageBg: "#EAF4FC", lastLight: "rgba(23,59,240,0.2)", lastDark: "rgba(23,59,240,0.3)", selected: "rgba(23,59,240,0.5)" },
    coachUI: { bg: "#FFFFFF", border: "rgba(60,69,75,0.2)", text: "#1a1916" },
    pieceFilter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
    pieceSetUrl: SKAK_PIECES_URL,
  },
  amberOak: {
    name: "Amber Oak",
    boardImageUrl: "/wood.png",
    boardColors: { light: "#EBDDCB", dark: "#614332", pageBg: "#FDF5E6", lastLight: "rgba(214,176,57,0.3)", lastDark: "rgba(214,176,57,0.4)", selected: "rgba(214,176,57,0.6)" },
    coachUI: { bg: "#FFFFFF", border: "rgba(97,67,50,0.2)", text: "#3d2b1f" },
    pieceFilter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
    pieceSetUrl: SKAK_PIECES_URL,
  },
  neonDusk: {
    name: "Neon Dusk",
    boardImageUrl: "",
    boardColors: { light: "#2C3341", dark: "#1D222B", pageBg: "#161920", lastLight: "#3D4452", lastDark: "#2E333C", selected: "rgba(0,240,255,0.3)" },
    coachUI: { bg: "#1D222B", border: "rgba(255,255,255,0.1)", text: "#e5e5e5" },
    pieceFilter: "invert(1) hue-rotate(180deg) brightness(2) drop-shadow(0 0 6px #00F0FF)",
    pieceSetUrl: SKAK_PIECES_URL,
  },
  softSmoke: {
    name: "Soft Smoke",
    boardImageUrl: "/marble.png",
    boardColors: { light: "#E3C8C8", dark: "#7E8E99", pageBg: "#DFE2E5", lastLight: "rgba(237,121,121,0.3)", lastDark: "rgba(237,121,121,0.4)", selected: "rgba(237,121,121,0.6)" },
    coachUI: { bg: "#FFFFFF", border: "rgba(142,156,165,0.2)", text: "#4a555e" },
    pieceFilter: "opacity(0.85) drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
    pieceSetUrl: SKAK_PIECES_URL,
  },
} as const

type UnifiedThemeKey = keyof typeof UNIFIED_THEMES

export default function ChessPage() {
  const [game, setGame] = useState(() => new Chess())
  const [currentThemeKey, setCurrentThemeKey] = useState<UnifiedThemeKey>("amberOak")
  const theme = UNIFIED_THEMES[currentThemeKey]

  const getSquareStyle = (file: string, rank: string, sq: Square): React.CSSProperties => {
    const isLightSq = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0
    return {
      backgroundImage: theme.boardImageUrl ? `url("${theme.boardImageUrl}")` : "none",
      backgroundSize: "100% 200%",
      backgroundPosition: isLightSq ? "top" : "bottom",
      backgroundColor: theme.boardImageUrl ? "transparent" : (isLightSq ? theme.boardColors.light : theme.boardColors.dark),
    }
  }

  return (
    <div style={{ backgroundColor: theme.boardColors.pageBg, minHeight: "100vh", padding: "20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", width: "500px", aspectRatio: "1" }}>
        {RANKS.map((rank) => FILES.map((file) => {
          const sq = `${file}${rank}` as Square
          const piece = game.get(sq)
          const pieceUrl = piece ? SKAK_PIECES_URL.replace("{color}", piece.color).replace("{piece}", piece.type) : null
          
          return (
            <button key={sq} style={{ ...getSquareStyle(file, rank, sq), border: "none", cursor: "pointer" }}>
              {pieceUrl && <img src={pieceUrl} style={{ width: "80%" }} />}
            </button>
          )
        }))}
      </div>
      <button onClick={() => setCurrentThemeKey(currentThemeKey === "amberOak" ? "arcticCobalt" : "amberOak")}>
        Сменить тему
      </button>
    </div>
  )
}
