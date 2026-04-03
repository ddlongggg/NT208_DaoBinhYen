import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Gọi đến API thời gian chuẩn
        const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Ho_Chi_Minh', {
            cache: 'no-store'
        });

        const data = await response.json();

        // data từ timeapi.io ĐÃ CÓ SẴN trường "hour" (ví dụ: 18, 20, 23,...)
        // Ta chỉ cần ném thẳng nó về cho Front-End
        return NextResponse.json({
            hour: data.hour,
            minute: data.minute,
            localTime: data.dateTime
        });

    } catch (error) {
        return NextResponse.json({ error: "Không thể kết nối với vệ tinh thời gian" }, { status: 500 });
    }
}