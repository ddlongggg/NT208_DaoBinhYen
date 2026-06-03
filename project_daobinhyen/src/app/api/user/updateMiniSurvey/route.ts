import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { ONBOARDING_COOKIE, ONBOARDING_COOKIE_OPTIONS } from '@/app/lib/onboarding';
import { FieldValue } from 'firebase-admin/firestore'; // Dùng để cộng dồn đồ

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const currentOnboardingStep = cookieStore.get(ONBOARDING_COOKIE)?.value;
        const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);

        const { topic, newScore } = await req.json();
        if (!topic || newScore === undefined) return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });

        // 1. LẤY ĐIỂM CŨ ĐỂ SO SÁNH LEVEL
        const userRef = db.collection('users').doc(decodedClaims.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        const oldScore = userData?.[`survey_${topic}`] ?? 0;

        // Tính Level (1-10)
        let oldLevel = Math.floor(oldScore / 10) + 1;
        let newLevel = Math.floor(newScore / 10) + 1;
        if (oldLevel > 10) oldLevel = 10;
        if (newLevel > 10) newLevel = 10;

        let updates: any = {
            [`survey_${topic}`]: newScore,
            lastSurveyScore: newScore,
            lastSurveyType: topic
        };

        let reward = null;

        // 2. NẾU THĂNG CẤP (Lên Level) -> TẶNG QUÀ NGẪU NHIÊN
        if (newLevel > oldLevel && newScore > oldScore) {
            const rand = Math.random();
            let rewardType = '';
            let rewardAmount = 1;
            let rewardName = '';

            // Tỉ lệ rớt đồ: 40% Tiền, 30% Hạt giống, 15% Lam, 10% Tím, 4% Vàng, 1% Cam
            if (rand < 0.40) { rewardType = 'money'; rewardAmount = Math.floor(Math.random() * 50) + 50; rewardName = 'Đồng Vàng'; }
            else if (rand < 0.70) { rewardType = 'seeds'; rewardAmount = Math.floor(Math.random() * 3) + 1; rewardName = 'Hạt Giống'; }
            else if (rand < 0.85) { rewardType = 'essence_lam'; rewardName = 'Tinh Hoa Lam'; }
            else if (rand < 0.95) { rewardType = 'essence_tim'; rewardName = 'Tinh Hoa Tím'; }
            else if (rand < 0.99) { rewardType = 'essence_vang'; rewardName = 'Tinh Hoa Vàng'; }
            else { rewardType = 'essence_cam'; rewardName = 'Tinh Hoa Cam'; }

            updates[rewardType] = FieldValue.increment(rewardAmount); // Cộng thẳng vào kho

            reward = { type: rewardType, amount: rewardAmount, name: rewardName, newLevel };
        }

        // 3. CẬP NHẬT DATABASE
        await userRef.update(updates);

        // 🔥 LOGIC COOKIE: Check user mới hay cũ
        let nextOnboardingStep: 'survey' | 'daily' | 'done' = 'daily';
        
        console.log('🔍 updateMiniSurvey - currentOnboardingStep:', currentOnboardingStep);
        
        if (currentOnboardingStep === 'done') {
          nextOnboardingStep = 'done';
        } else if (currentOnboardingStep === 'survey') {
          // User mới vừa setup username + làm survey lần đầu → set to 'done' để vào homepage
          // (Lần sau login sẽ thành 'daily')
          nextOnboardingStep = 'done';
        }

        console.log('✅ updateMiniSurvey - Setting cookie to:', nextOnboardingStep);

        // Trả về kết quả kèm phần thưởng (nếu có)
        const response = NextResponse.json({ success: true, newScore, reward, debugCookie: nextOnboardingStep });
        response.cookies.set(ONBOARDING_COOKIE, nextOnboardingStep, ONBOARDING_COOKIE_OPTIONS);
        return response;
    } catch (error) {
        console.error("Lỗi API updateMiniSurvey:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
