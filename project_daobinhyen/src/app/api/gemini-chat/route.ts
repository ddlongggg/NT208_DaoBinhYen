import { NextRequest, NextResponse } from "next/server";

type GeminiHistoryItem = {
    role: "user" | "model";
    text: string;
};

const SYSTEM_PROMPT = `
You are "Ban Suoi Nguon", a gentle Vietnamese AI companion inside a healing app.
Always reply in natural Vietnamese.
Your job is to listen like a warm friend, not a doctor, teacher, expert, search engine, or quote generator.
Keep each reply complete and concise: 1 to 3 short sentences.
Do not write Source, citation, reference, markdown footnote, JSON, logs, or repeat the input as a quoted source.
If the user sends a short greeting like "alo", "hello", "hi", "jel", answer warmly and invite them to share.
If the user shares pain, reflect the feeling first, then ask one gentle open question.
If the user mentions self-harm, immediate danger, violence, or severe despair, encourage them to contact a trusted person or local emergency service right away, while staying calm and supportive.
Never claim to be a real human. If needed, say you are an AI friend here to listen.
End every response with a complete sentence.
`.trim();

const DEFAULT_MODEL = "gemini-3-flash-preview";

function getApiKeys() {
    const pooledKeys = process.env.GEMINI_API_KEYS
        ?.split(",")
        .map((key) => key.trim())
        .filter(Boolean);

    if (pooledKeys?.length) return pooledKeys;

    return process.env.GEMINI_API_KEY ? [process.env.GEMINI_API_KEY] : [];
}

function getTextFromGeminiResponse(data: unknown) {
    const response = data as {
        candidates?: Array<{
            finishReason?: string;
            content?: {
                parts?: Array<{ text?: string }>;
            };
        }>;
    };

    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    return {
        text,
        finishReason: candidate?.finishReason,
    };
}

function isLikelyIncomplete(text: string) {
    if (!text) return true;
    if (/^(source|nguon|nguồn|citation|references?)\s*:/i.test(text)) return true;
    if (/^```/.test(text)) return true;
    if (text.length < 12) return false;
    return !/[.!?…。！？)"']$/.test(text.trim());
}

function fallbackReply(message: string) {
    const trimmed = message.trim();
    const shortGreeting = /^(alo|hello|hi|chào|chao|jel|ê|e)$/i.test(trimmed);

    if (shortGreeting) {
        return "Mình nghe đây. Hôm nay bạn muốn kể mình nghe chuyện gì?";
    }

    return "Mình nghe bạn rồi. Bạn kể thêm một chút để mình hiểu rõ hơn nhé.";
}

function cleanReply(reply: string | undefined, message: string, finishReason?: string) {
    const text = reply?.trim() || "";

    if (finishReason === "MAX_TOKENS" || isLikelyIncomplete(text)) {
        return fallbackReply(message);
    }

    return text
        .replace(/^(source|nguon|nguồn|citation|references?)\s*:\s*/i, "")
        .trim();
}

function normalizeHistory(history: unknown, message: string) {
    if (!Array.isArray(history)) {
        return [{ role: "user" as const, text: message }];
    }

    const safeHistory = history
        .filter((item): item is GeminiHistoryItem => {
            return (
                item &&
                typeof item === "object" &&
                "role" in item &&
                "text" in item &&
                ((item as GeminiHistoryItem).role === "user" || (item as GeminiHistoryItem).role === "model") &&
                typeof (item as GeminiHistoryItem).text === "string" &&
                Boolean((item as GeminiHistoryItem).text.trim())
            );
        })
        .slice(-20);

    const last = safeHistory[safeHistory.length - 1];
    if (last?.role === "user" && last.text.trim() === message) {
        return safeHistory;
    }

    return [...safeHistory, { role: "user" as const, text: message }];
}

function buildContents(history: unknown, message: string, summary: string) {
    const contents = normalizeHistory(history, message);

    if (!summary.trim()) {
        return contents;
    }

    return [
        {
            role: "user" as const,
            text: `Conversation memory summary. Use this only as background context, do not quote it directly:\n${summary.trim()}`,
        },
        {
            role: "model" as const,
            text: "Mình đã ghi nhớ bối cảnh chính của cuộc trò chuyện.",
        },
        ...contents,
    ];
}

async function readJsonSafely(response: Response) {
    const raw = await response.text();
    if (!raw) return {};

    try {
        return JSON.parse(raw);
    } catch {
        return { error: { message: raw } };
    }
}

function isQuotaError(status: number, data: unknown) {
    const errorData = data as { error?: { message?: string; status?: string } };
    const message = errorData.error?.message?.toLowerCase() || "";
    return status === 429 || errorData.error?.status === "RESOURCE_EXHAUSTED" || message.includes("quota");
}

export async function POST(request: NextRequest) {
    try {
        const apiKeys = getApiKeys();
        const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

        if (!apiKeys.length) {
            return NextResponse.json({ error: "Thieu GEMINI_API_KEY hoac GEMINI_API_KEYS trong .env.local." }, { status: 500 });
        }

        const body = await request.json();
        const message = typeof body.message === "string" ? body.message.trim() : "";
        const summary = typeof body.summary === "string" ? body.summary.slice(-1200) : "";

        if (!message) {
            return NextResponse.json({ error: "Tin nhan dang trong." }, { status: 400 });
        }

        const contents = buildContents(body.history, message, summary).map((item) => ({
            role: item.role,
            parts: [{ text: item.text.trim() }],
        }));

        let data: unknown = null;
        let geminiStatus = 500;
        let geminiOk = false;

        for (const apiKey of apiKeys) {
            const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{ text: SYSTEM_PROMPT }],
                        },
                        contents,
                        generationConfig: {
                            temperature: 0.6,
                            topP: 0.85,
                            maxOutputTokens: 1024,
                            thinkingConfig: {
                                thinkingBudget: 0,
                            },
                        },
                    }),
                }
            );

            data = await readJsonSafely(geminiResponse);
            geminiStatus = geminiResponse.status;
            geminiOk = geminiResponse.ok;

            if (geminiOk || !isQuotaError(geminiStatus, data)) break;
        }

        if (!geminiOk) {
            console.error("Gemini API error:", data);
            const errorData = data as { error?: { message?: string } };
            return NextResponse.json({ error: errorData.error?.message || "Gemini chua phan hoi duoc." }, { status: geminiStatus });
        }

        const result = getTextFromGeminiResponse(data);
        const reply = cleanReply(result.text, message, result.finishReason);

        return NextResponse.json({ reply });
    } catch (error) {
        console.error("Gemini chat route error:", error);
        return NextResponse.json({ error: "Khong the ket noi Gemini luc nay." }, { status: 500 });
    }
}
