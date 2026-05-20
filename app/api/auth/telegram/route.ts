import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const error = url.searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(new URL(`/?tgerror=${error || "no_code"}`, url.origin))
  }

  const clientId = process.env.TELEGRAM_CLIENT_ID
  const clientSecret = process.env.TELEGRAM_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/?tgerror=config", url.origin))
  }

  try {
    // Exchange code for tokens using Basic auth
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    const redirectUri = `${url.origin}/api/auth/telegram`

    const tokenRes = await fetch("https://oauth.telegram.org/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
      }).toString(),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token && !tokenData.id_token) {
      console.error("Token error:", tokenData)
      return NextResponse.redirect(new URL("/?tgerror=token", url.origin))
    }

    // Decode id_token (JWT) — just parse payload, no need to verify on client
    let user: { id: string; first_name: string; username: string; photo_url: string }

    if (tokenData.id_token) {
      const payload = JSON.parse(
        Buffer.from(tokenData.id_token.split(".")[1], "base64url").toString()
      )
      user = {
        id: String(payload.id || payload.sub || ""),
        first_name: payload.name || payload.given_name || "User",
        username: payload.preferred_username || "",
        photo_url: payload.picture || "",
      }
    } else {
      // Fallback: try userinfo endpoint
      const userRes = await fetch("https://oauth.telegram.org/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const userInfo = await userRes.json()
      user = {
        id: String(userInfo.id || userInfo.sub || ""),
        first_name: userInfo.name || userInfo.first_name || "User",
        username: userInfo.preferred_username || userInfo.username || "",
        photo_url: userInfo.picture || userInfo.photo_url || "",
      }
    }

    if (!user.id) {
      return NextResponse.redirect(new URL("/?tgerror=no_user", url.origin))
    }

    const userData = encodeURIComponent(JSON.stringify(user))
    return NextResponse.redirect(new URL(`/?tguser=${userData}`, url.origin))

  } catch (e) {
    console.error("Auth error:", e)
    return NextResponse.redirect(new URL("/?tgerror=server", url.origin))
  }
}
