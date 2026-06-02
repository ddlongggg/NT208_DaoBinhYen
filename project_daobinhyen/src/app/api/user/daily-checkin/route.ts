import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/lib/firebaseAdmin';
import { ONBOARDING_COOKIE, ONBOARDING_COOKIE_OPTIONS } from '@/app/lib/onboarding';

export async function POST(req: NextRequest) {
  try {
    // 1. Xác thực Authentication qua cookie
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    
    // 2. Lấy dữ liệu gửi lên — CHỈ CẦN surveyType, server tự tính streak
    const body = await req.json();
    const { surveyType } = body;

    if (!surveyType || !['study', 'emotion', 'sleep'].includes(surveyType)) {
      return NextResponse.json({ error: 'Loại khảo sát không hợp lệ' }, { status: 400 });
    }

    // 3. Đọc dữ liệu hiện tại để SERVER tự tính topicStreak
    const userRef = db.collection('users').doc(decodedToken.uid);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'Không tìm thấy user' }, { status: 404 });
    }

    const userData = userSnap.data();
    const currentStreak = userData?.topicStreak ?? 0;
    const lastType = userData?.lastSurveyType ?? null;

    // Tính streak: cùng chủ đề → +1, đổi chủ đề → reset về 1
    const newStreak = (surveyType === lastType) ? currentStreak + 1 : 1;

    // 4. Chuẩn bị Object để cập nhật
    const updateData: Record<string, any> = {
      lastCheckinDate: new Date().toISOString(),
      lastSurveyType: surveyType,
      topicStreak: newStreak,
      updatedAt: new Date().toISOString(),
    };

    // 5. Update vào Firestore
    await userRef.update(updateData);

    // 6. Trả về thành công (kèm streak mới để client cập nhật UI)
    const response = NextResponse.json({ 
      message: 'Cập nhật tiến độ Check-in thành công!', 
      data: { ...updateData, topicStreak: newStreak }
    }, { status: 200 });
    response.cookies.set(ONBOARDING_COOKIE, 'done', ONBOARDING_COOKIE_OPTIONS);

    return response;

  } catch (error) {
    console.error('Lỗi API Daily Check-in:', error);
    return NextResponse.json({ error: 'Lỗi server khi lưu Check-in' }, { status: 500 });
  }
}
