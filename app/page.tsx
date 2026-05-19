"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Chess, Square, Move } from "chess.js"
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
      lastLight: "rgba(237,121,
