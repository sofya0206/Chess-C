import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { history } = await req.json();
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: "You are a professional chess coach. Give short, punchy advice (max 15 words) based on game history." },
          { role: "user", content: `History: ${history.join(", ")}. What's the best next idea?` }
        ],
      }),
    });

    const data = await response.json();
    return NextResponse.json({ comment: data.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ comment: "Focus on center control and piece development." });
  }
}
