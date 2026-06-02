import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function vietnamTimeFallback() {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hour = Number(parts.find((part) => part.type === "hour")?.value ?? new Date().getHours());
    const minute = Number(parts.find((part) => part.type === "minute")?.value ?? new Date().getMinutes());

    return {
        hour,
        minute,
        localTime: new Date().toISOString(),
        source: "local-fallback",
    };
}

export async function GET() {
    try {
        const response = await fetch("https://timeapi.io/api/Time/current/zone?timeZone=Asia/Ho_Chi_Minh", {
            cache: "no-store",
        });

        if (!response.ok) {
            return NextResponse.json(vietnamTimeFallback());
        }

        const data = await response.json();

        if (typeof data.hour !== "number" || typeof data.minute !== "number") {
            return NextResponse.json(vietnamTimeFallback());
        }

        return NextResponse.json({
            hour: data.hour,
            minute: data.minute,
            localTime: data.dateTime,
            source: "timeapi",
        });
    } catch {
        return NextResponse.json(vietnamTimeFallback());
    }
}
