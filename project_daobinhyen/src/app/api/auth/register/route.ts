import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebaseAdmin';

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

    // Tạo user Firebase Auth luôn
    const userRecord = await auth.createUser({
      email,
      password,
      phoneNumber: phone ? `+84${phone.replace(/^0/, '')}` : undefined,
    });

    // Tạo link verify bằng Firebase Admin
    const verificationLink = await auth.generateEmailVerificationLink(email);

    // Gửi email bằng Gmail SMTP
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_APP_PASSWORD!,
      },
    });

    console.log('=== REGISTER DEBUG ===');
    console.log('Gửi đến:', email);
    console.log('GMAIL_USER:', process.env.GMAIL_USER);
    console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅' : '❌');

    const info = await transporter.sendMail({
      from: `"Đảo Bình Yên" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🌴 Xác minh tài khoản Đảo Bình Yên',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f9f7f4; border-radius: 16px;">
          <h2 style="color: #4a4036; text-align: center;">🌴 Chào mừng đến Đảo Bình Yên!</h2>
          <p style="color: #6c5f52;">Hãy nhấn nút bên dưới để xác minh email.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}"
               style="background: #6c7a65; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px;">
              ✅ Xác minh Email
            </a>
          </div>
        </div>
      `,
    });

    console.log('✅ MAIL SENT:', info.messageId);

    return NextResponse.json({ message: 'Đã gửi email xác minh' });
  } catch (error: any) {
    console.error('❌ ERROR:', error);
    const firebaseErrors: Record<string, string> = {
      'auth/email-already-exists': 'Email này đã được sử dụng',
      'auth/invalid-email': 'Email không hợp lệ',
      'auth/phone-number-already-exists': 'Số điện thoại đã được sử dụng',
      'auth/invalid-phone-number': 'Số điện thoại không hợp lệ (VD: 0912345678)',
    };
    return NextResponse.json({ error: firebaseErrors[error.code] || 'Đăng ký thất bại' }, { status: 400 });
  }
}