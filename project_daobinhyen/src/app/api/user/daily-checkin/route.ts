import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    // 1. Xác thực Authentication qua cookie
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    
    // 2. Lấy dữ liệu thân gửi lên
    const body = await req.json();
    const { surveyType, topicStreak, lastScore } = body;

    // 3. Chuẩn bị Object để cập nhật vào Database
    const updateData: Record<string, any> = {
      lastCheckinDate: new Date().toISOString(), // Lưu lại ngày Check-in riêng để tra cứu
    };

    // Đẩy thêm biến loại topic check-in: (study | emotion | sleep) thay vì gộp chung là 1 final
    if (surveyType && ['study', 'emotion', 'sleep'].includes(surveyType)) {
      updateData.lastSurveyType = surveyType;
    }

    if (topicStreak !== undefined) {
      updateData.topicStreak = topicStreak;
    }

    if (lastScore !== undefined) {
      updateData.lastSurveyScore = lastScore; // Vẫn có thể map với trường có sẵn trước đó
      // Nếu bạn muốn lưu tách nhỏ riêng điểm thì ghi thêm dạng này:
      // updateData[`${surveyType}_score`] = lastScore; 
    }

    // 4. Update thẳng vào Firebase Firestore ở Document User
    await db.collection('users').doc(decodedToken.uid).update(updateData);

    // 5. Trả về thành công
    return NextResponse.json({ 
      message: 'Cập nhật tiến độ Check-in thành công!', 
      data: updateData 
    }, { status: 200 });

  } catch (error) {
    console.error('Lỗi API Daily Check-in:', error);
    return NextResponse.json({ error: 'Lỗi server khi lưu Check-in' }, { status: 500 });
  }
}
