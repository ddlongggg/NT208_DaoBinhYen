import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
    });
}
const db = admin.firestore();

export async function POST(request: Request) {
    try {
        // 👇 SỬA Ở ĐÂY: Hứng thêm biến `name` từ Front-end gửi lên
        const { uid, emotionScore, name } = await request.json();

        if (!uid || emotionScore === undefined) {
            return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
        }

        // 1. Tính toán Rank cảm xúc
        const myRank = Math.floor(emotionScore / 10);
        const allowedRanks = [myRank - 2, myRank - 1, myRank, myRank + 1, myRank + 2];
        const waitingRoomRef = db.collection('waiting_room');

        // 2. Tìm đối thủ phù hợp trong phòng chờ
        const snapshot = await waitingRoomRef
            .where('status', '==', 'waiting')
            .where('rank', 'in', allowedRanks)
            .limit(1)
            .get();

        const validDocs = snapshot.docs.filter(doc => doc.data().uid !== uid);

        if (validDocs.length > 0) {
            // ==========================================
            // TRƯỜNG HỢP 1: TÌM THẤY ĐỐI THỦ PHÙ HỢP
            // ==========================================
            const opponentDoc = validDocs[0];
            const opponentData = opponentDoc.data();
            const opponentId = opponentData.uid;

            const opponentName = opponentData.name || 'Người lạ giấu tên';
            // 👇 THÊM DÒNG NÀY: Lấy điểm cảm xúc thật của đối thủ
            const opponentScore = opponentData.emotionScore || 0;

            const roomRef = await db.collection('chat_rooms').add({
                users: [uid, opponentId],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // 👇 SỬA Ở ĐÂY: Truyền `matchedWithScore` cho đối thủ
            await opponentDoc.ref.update({
                status: 'matched',
                roomId: roomRef.id,
                matchedWith: uid,
                matchedWithName: name || 'Người lữ khách',
                matchedWithScore: emotionScore // Truyền điểm của mình sang
            });

            // 👇 SỬA Ở ĐÂY: Trả về `opponentScore` cho Front-end
            return NextResponse.json({
                matched: true,
                roomId: roomRef.id,
                opponentName: opponentName,
                opponentScore: opponentScore
            });

        } else {
            // ==========================================
            // TRƯỜNG HỢP 2: KHÔNG TÌM THẤY -> ĐƯA VÀO HÀNG ĐỢI
            // ==========================================
            const oldTickets = await waitingRoomRef.where('uid', '==', uid).get();
            oldTickets.forEach(doc => doc.ref.delete());

            // 👇 SỬA Ở ĐÂY: Tạo vé chờ mới CÓ KÈM THEO TÊN
            const newTicket = await waitingRoomRef.add({
                uid: uid,
                name: name || 'Người lữ khách', // Nhét name vào đây
                emotionScore: emotionScore,
                rank: myRank,
                status: 'waiting',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return NextResponse.json({ matched: false, waitingId: newTicket.id });
        }

    } catch (error) {
        console.error("Lỗi Matchmaking:", error);
        return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
    }
}