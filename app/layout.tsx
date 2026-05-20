import type { Metadata, Viewport } from "next"
import "./globals.css"

const SITE_URL = "https://chess-c-rho.vercel.app"
const TITLE = "Chess — Play, Learn & Improve"
const DESCRIPTION = "A beautiful chess app with AI opponent, interactive tutorials, AI coach powered by Stockfish and Llama. Play with friends or train against AI at 4 difficulty levels."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Chess",
  },
  description: DESCRIPTION,
  keywords: [
    "chess", "chess game", "play chess online", "chess AI", "chess coach",
    "learn chess", "chess tutorial", "stockfish", "chess app", "шахматы",
    "играть в шахматы", "шахматы онлайн", "шахматный тренер",
  ],
  authors: [{ name: "sofya0206" }],
  creator: "sofya0206",

  // Open Graph — для превью в соцсетях (Telegram, VK, Twitter)
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Chess",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Chess — Play, Learn & Improve",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },

  // Иконки
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Canonical URL
  alternates: {
    canonical: SITE_URL,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDF5E6" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* JSON-LD структурированные данные для Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Chess",
              url: SITE_URL,
              description: DESCRIPTION,
              applicationCategory: "GameApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Play chess against AI (Stockfish)",
                "Play with a friend",
                "Interactive chess tutorials",
                "AI coach powered by Llama",
                "4 difficulty levels",
                "Multiple board themes",
                "Move history and analysis",
              ],
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
