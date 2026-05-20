import { createHmac } from "crypto"
import { NextResponse } from "next/server"

// Верификация данных от Telegram Login Widget
function verifyTelegramAuth(data: Record<string, string>, botToken: string): boolean {
  const { hash, ...rest } = data
  if (!hash) return false

  // Сортируем поля и склеиваем через \n
  const checkString = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join("\n")

  // Создаём секретный ключ из токена бота
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest()
  const expectedHash = createHmac("sha256", secretKey).update(checkString).digest("hex")

  // Проверяем что данные не старше 1 дня
  const authDate = parseInt(rest.auth_date || "0")
  const isExpired = Date.now() / 1000 - authDate > 86400

  return expectedHash === hash && !isExpired
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      return NextResponse.json({ error: "Bot token not configured" }, { status: 500 })
    }

    const isValid = verifyTelegramAuth(body, botToken)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid auth data" }, { status: 401 })
    }

    // Возвращаем профиль пользователя
    return NextResponse.json({
      ok: true,
      user: {
        id: body.id,
        first_name: body.first_name,
        last_name: body.last_name || "",
        username: body.username || "",
        photo_url: body.photo_url || "",
      }
    })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
