import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebaseAdmin';

export async function GET() {
    try {
        const snapshot = await db.collection('diaries').orderBy('createdAt', 'desc').get();
        const entries = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString(),
        }));
        return NextResponse.json({ entries }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Lỗi kết nối" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { content } = await req.json();
        const newDoc = await db.collection('diaries').add({
            content,
            createdAt: new Date(),
        });
        return NextResponse.json({ id: newDoc.id }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Lỗi lưu dữ liệu" }, { status: 500 });
    }
}