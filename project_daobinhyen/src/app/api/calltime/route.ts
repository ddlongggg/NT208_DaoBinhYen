import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Gọi đến một API thời gian miễn phí và cực chuẩn trên thế giới
    const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Ho_Chi_Minh', {
      cache: 'no-store'
    });
    
    const data = await response.json();
    
    // data.dateTime sẽ có dạng "{"localTime":"18:29:53 27/3/2026"}"
    const standardTime = new Date(data.dateTime).toLocaleString('vi-VN');

    return NextResponse.json({ 
      localTime: standardTime
    });
  } catch (error) {
    return NextResponse.json({ error: "Không thể kết nối với vệ tinh thời gian" }, { status: 500 });
  }
}