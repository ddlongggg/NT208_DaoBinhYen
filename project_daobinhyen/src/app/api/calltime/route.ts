import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Gọi đến một API thời gian miễn phí và cực chuẩn trên thế giới
    const response = await fetch('http://worldtimeapi.org/api/timezone/Asia/Ho_Chi_Minh', {
      cache: 'no-store'
    });
    
    const data = await response.json();
    
    // data.datetime sẽ có dạng "2026-03-27T18:05:00.123456+07:00"
    const standardTime = new Date(data.datetime).toLocaleString('vi-VN');

    return NextResponse.json({ 
      localTime: standardTime
    });
  } catch (error) {
    return NextResponse.json({ error: "Không thể kết nối với vệ tinh thời gian" }, { status: 500 });
  }
}