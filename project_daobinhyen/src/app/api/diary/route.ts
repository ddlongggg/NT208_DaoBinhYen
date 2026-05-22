import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// ==========================================
// KHỞI TẠO FIREBASE ADMIN (DÙNG ENV.LOCAL)
// ==========================================
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Phải có dòng replace này để Next.js hiểu ký tự xuống dòng \n
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            })
        });
    } catch (error) {
        console.error("Lỗi khởi tạo Firebase Admin:", error);
    }
}

const db = admin.firestore();

// ==========================================
// 1. API LƯU NHẬT KÝ MỚI (Method POST)
// ==========================================
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { uid, email, title, content } = body;

        if (!uid || !content) {
            return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
        }

        const docRef = await db.collection("diaries").add({
            uid: uid,
            email: email || '',
            title: title || 'Tâm sự không tên',
            content: content,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, id: docRef.id }, { status: 200 });

    } catch (error) {
        console.error("Lỗi backend khi lưu nhật ký:", error);
        return NextResponse.json({ error: 'Lỗi hệ thống máy chủ' }, { status: 500 });
    }
}

// ==========================================
// 2. API ĐỌC NHẬT KÝ CŨ (Method GET)
// ==========================================
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');

        if (!uid) {
            return NextResponse.json({ error: 'Không tìm thấy ID người dùng' }, { status: 400 });
        }

        const snapshot = await db.collection("diaries")
            .where("uid", "==", uid)
            .orderBy("createdAt", "desc")
            .get();

        const entries = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                content: data.content,
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            };
        });

        return NextResponse.json({ entries: entries }, { status: 200 });

    } catch (error) {
        console.error("Lỗi backend khi tải nhật ký:", error);
        return NextResponse.json({ error: 'Lỗi hệ thống máy chủ' }, { status: 500 });
    }
}