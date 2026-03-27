import { NextResponse } from 'next/server';

export async function GET() {
  // Lấy thời gian hiện tại
  const now = new Date();
  
  // Định dạng giờ Việt Nam chuẩn
  const localTime = now.toLocaleString('vi-VN', { 
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Trả về dữ liệu JSON cho bất kỳ ai gọi đến
  return NextResponse.json({ 
    island: "Đảo Bình Yên",
    status: "Yên bình",
    localTime: localTime,
    timestamp: now.getTime()
  });
}