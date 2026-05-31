import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    // 1. Xác thực người dùng đang đăng nhập
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;

    // 2. Thuật toán ngẫu nhiên rơi đồ (Gacha)
    const rand = Math.random();
    let type: 'leaf' | 'coin' | 'seed' = 'leaf';
    let amount = 1;

    if (rand < 0.60) {
      // 60% tỉ lệ rơi Lá vàng (từ 1 đến 3 lá)
      type = 'leaf';
      amount = Math.floor(Math.random() * 3) + 1;
    } else if (rand < 0.90) {
      // 30% tỉ lệ rơi Xu vàng (từ 5 đến 20 xu)
      type = 'coin';
      amount = Math.floor(Math.random() * 16) + 5;
    } else {
      // 10% tỉ lệ rơi Hạt giống (chỉ 1 hạt cực hiếm)
      type = 'seed';
      amount = 1;
    }

    // 3. Khớp tên biến để lưu vào Firebase
    let updateField = '';
    if (type === 'leaf') updateField = 'leaves';
    if (type === 'coin') updateField = 'money';
    if (type === 'seed') updateField = 'seeds';

    // 4. Lưu trực tiếp vào Firebase (Cộng dồn vào số cũ)
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      [updateField]: FieldValue.increment(amount)
    });

    // 5. Trả kết quả về cho Frontend để hiển thị hiệu ứng
    return NextResponse.json({
      success: true,
      reward: { type, amount }
    });

  } catch (error) {
    console.error("Lỗi khi rung cây thần thụ:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}