import { Request, Response } from "express";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export const chatWithAssistant = async (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: "Assistant unavailable. Missing Gemini API key." });
  }

  const { message } = req.body as { message?: string };
  if (!message) {
    return res.status(400).json({ message: "Message is required." });
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are TanRid's delivery copilot. Provide concise, actionable answers about technology services, training plans, and delivery best practices.\n\nUser: ${message}`,
            },
          ],
        },
      ],
    };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Gemini error:", errorBody);
      return res.status(502).json({ message: "Assistant service error." });
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const reply =
      data.candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join(" ").trim() ||
      "I don't have an answer right now.";

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to reach assistant." });
  }
};
