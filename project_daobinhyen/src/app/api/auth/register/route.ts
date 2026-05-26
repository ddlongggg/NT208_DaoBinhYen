import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { auth, db } from '@/app/lib/firebaseAdmin';
import { createDefaultUserData } from '@/app/lib/userDefaults';

export async function POST(req: NextRequest) {
  try {
    const { email, password, phone } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Thiếu email hoặc mật khẩu' }, { status: 400 });
    }

    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).{8,}$/;
    if (!regex.test(password)) {
      return NextResponse.json({
        error: 'Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và ký tự đặc biệt'
      }, { status: 400 });
    }

    // Tạo user Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      phoneNumber: phone ? `+84${phone.replace(/^0/, '')}` : undefined,
    });

    // ========================================
    // TẠO FIRESTORE DOCUMENT VỚI TOÀN BỘ SCHEMA MẶC ĐỊNH
    // Nguyên tắc: set sẵn ALL fields → chưa có gì = null/0 → update khi cần
    // ========================================
    await db.collection('users').doc(userRecord.uid).set(
      createDefaultUserData({
        uid: userRecord.uid,
        email,
        provider: 'password',
      })
    );

    // Tạo link verify bằng Firebase Admin
    let verificationLink: string;
    try {
      verificationLink = await auth.generateEmailVerificationLink(email);
    } catch (linkError) {
      // Nếu tạo link thất bại → rollback: xóa Auth user + Firestore doc
      console.error('Lỗi tạo link xác minh:', linkError);
      await auth.deleteUser(userRecord.uid).catch(() => { });
      await db.collection('users').doc(userRecord.uid).delete().catch(() => { });
      return NextResponse.json({ error: 'Không thể tạo link xác minh' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_APP_PASSWORD!,
      },
    });

    try {
      await transporter.sendMail({
        from: `"Đảo Bình Yên" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: '🌴 Chạm tay vào bình yên: Xác minh tài khoản của bạn',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 30px; background: #f9f7f4; border-radius: 20px; text-align: center;">
            <h2 style="color: #4a4036; margin-bottom: 20px;">🌴 Chào mừng bạn đến với Đảo Bình Yên!</h2>
            
            <p style="color: #6c5f52; line-height: 1.6; font-size: 15px; text-align: left;">
              Bạn vừa thực hiện bước đầu tiên để tìm thấy khoảng lặng cho riêng mình. 
              Để cánh cửa đảo nhỏ chính thức mở ra, bạn vui lòng nhấn vào nút bên dưới để xác nhận địa chỉ email nhé.
            </p>

            <div style="margin: 35px 0;">
              <a href="${verificationLink}" 
                 style="background: #6c7a65; color: white; padding: 16px 32px; border-radius: 14px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                 Xác minh Email & Bắt đầu thư giãn
              </a>
            </div>

            <p style="color: #8d7e6d; font-style: italic; margin-top: 25px; font-size: 14px;">
              Hẹn gặp bạn giữa những thanh âm trong lành của Đảo.
            </p>
          </div>
        `,
      });
    } catch (mailError) {
      // Gửi mail thất bại → rollback: xóa Auth user + Firestore doc
      console.error('Lỗi gửi email:', mailError);
      await auth.deleteUser(userRecord.uid).catch(() => { });
      await db.collection('users').doc(userRecord.uid).delete().catch(() => { });
      return NextResponse.json({ error: 'Không thể gửi email xác minh' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Đã gửi email xác minh' });
  } catch (error: unknown) {
    console.error('❌ ERROR:', error);
    const errorCode = error instanceof Error && 'code' in error ? String(error.code) : '';
    const firebaseErrors: Record<string, string> = {
      'auth/email-already-exists': 'Email này đã được sử dụng',
      'auth/invalid-email': 'Email không hợp lệ',
      'auth/phone-number-already-exists': 'Số điện thoại đã được sử dụng',
      'auth/invalid-phone-number': 'Số điện thoại không hợp lệ (VD: 0912345678)',
    };
    return NextResponse.json({ error: firebaseErrors[errorCode] || 'Đăng ký thất bại' }, { status: 400 });
  }
}
