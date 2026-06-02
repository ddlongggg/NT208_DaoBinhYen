import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/app/lib/firebaseAdmin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

type BotMessageSender = "me" | "bot";

const WELCOME_TEXT = "Mình ở đây để lắng nghe bạn. Hôm nay trong lòng bạn đang có điều gì muốn kể không?";
const SUMMARY_LIMIT = 1200;

async function getUid(req: NextRequest) {
    const sessionCookie = req.cookies.get("session")?.value;
    if (!sessionCookie) return null;
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    return decodedToken.uid;
}

function messageFromDoc(doc: FirebaseFirestore.QueryDocumentSnapshot) {
    const data = doc.data();
    return {
        id: doc.id,
        text: typeof data.text === "string" ? data.text : "",
        sender: data.sender === "me" ? "me" : "bot",
        timestamp: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
    };
}

function buildSummary(oldSummary: string, sender: BotMessageSender, text: string) {
    const line = `${sender === "me" ? "User" : "Bot"}: ${text.trim()}`;
    const next = [oldSummary, line].filter(Boolean).join("\n");
    return next.length > SUMMARY_LIMIT ? next.slice(next.length - SUMMARY_LIMIT) : next;
}

async function getLatestSession(uid: string) {
    const sessionsSnap = await db
        .collection("users")
        .doc(uid)
        .collection("bot_chats")
        .orderBy("updatedAt", "desc")
        .limit(1)
        .get();

    return sessionsSnap.empty ? null : sessionsSnap.docs[0];
}

async function createSession(uid: string) {
    const sessionRef = await db.collection("users").doc(uid).collection("bot_chats").add({
        summary: "",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        deletedAt: null,
    });

    const welcomeRef = await sessionRef.collection("messages").add({
        sender: "bot",
        text: WELCOME_TEXT,
        createdAt: FieldValue.serverTimestamp(),
        deletedAt: null,
    });

    return {
        sessionId: sessionRef.id,
        summary: "",
        messages: [
            {
                id: welcomeRef.id,
                text: WELCOME_TEXT,
                sender: "bot",
                timestamp: new Date().toISOString(),
            },
        ],
    };
}

async function loadSession(uid: string, sessionId: string) {
    const sessionRef = db.collection("users").doc(uid).collection("bot_chats").doc(sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists || sessionSnap.data()?.deletedAt) return null;

    const messagesSnap = await sessionRef
        .collection("messages")
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

    return {
        sessionId,
        summary: sessionSnap.data()?.summary || "",
        messages: messagesSnap.docs
            .filter((doc) => !doc.data()?.deletedAt)
            .map(messageFromDoc)
            .filter((message) => message.text)
            .reverse(),
    };
}

async function listSessions(uid: string) {
    const sessionsSnap = await db
        .collection("users")
        .doc(uid)
        .collection("bot_chats")
        .orderBy("updatedAt", "desc")
        .limit(10)
        .get();

    return sessionsSnap.docs
        .filter((doc) => !doc.data()?.deletedAt)
        .map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                summary: data.summary || "",
                updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            };
        });
}

export async function GET(req: NextRequest) {
    try {
        const uid = await getUid(req);
        if (!uid) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

        const latestSession = await getLatestSession(uid);
        if (!latestSession) {
            const created = await createSession(uid);
            return NextResponse.json(created);
        }

        const loaded = await loadSession(uid, latestSession.id);
        if (!loaded) {
            const created = await createSession(uid);
            return NextResponse.json(created);
        }

        return NextResponse.json(loaded);
    } catch (error) {
        console.error("Bot chat GET error:", error);
        return NextResponse.json({ error: "Không tải được lịch sử bot" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const uid = await getUid(req);
        if (!uid) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

        const body = await req.json();
        const action = body.action;

        if (action === "createSession") {
            const created = await createSession(uid);
            return NextResponse.json(created);
        }

        if (action === "listSessions") {
            return NextResponse.json({ sessions: await listSessions(uid) });
        }

        if (action === "loadSession") {
            const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
            if (!sessionId) return NextResponse.json({ error: "Thiếu sessionId" }, { status: 400 });

            const loaded = await loadSession(uid, sessionId);
            if (!loaded) return NextResponse.json({ error: "Không tìm thấy phiên chat" }, { status: 404 });

            return NextResponse.json(loaded);
        }

        if (action === "saveMessage") {
            const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
            const sender = body.sender === "me" || body.sender === "bot" ? body.sender : null;
            const text = typeof body.text === "string" ? body.text.trim() : "";

            if (!sessionId || !sender || !text) {
                return NextResponse.json({ error: "Dữ liệu tin nhắn không hợp lệ" }, { status: 400 });
            }

            const sessionRef = db.collection("users").doc(uid).collection("bot_chats").doc(sessionId);
            const sessionSnap = await sessionRef.get();
            if (!sessionSnap.exists || sessionSnap.data()?.deletedAt) {
                return NextResponse.json({ error: "Không tìm thấy phiên chat" }, { status: 404 });
            }

            const messageRef = await sessionRef.collection("messages").add({
                sender,
                text,
                createdAt: FieldValue.serverTimestamp(),
                deletedAt: null,
            });

            const currentSummary = sessionSnap.data()?.summary || "";
            const summary = buildSummary(currentSummary, sender, text);
            await sessionRef.update({
                summary,
                updatedAt: FieldValue.serverTimestamp(),
            });

            return NextResponse.json({ success: true, messageId: messageRef.id, summary });
        }

        if (action === "deleteSession") {
            const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
            if (!sessionId) return NextResponse.json({ error: "Thiếu sessionId" }, { status: 400 });

            await db.collection("users").doc(uid).collection("bot_chats").doc(sessionId).set(
                {
                    deletedAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

            return NextResponse.json({ success: true });
        }

        if (action === "exportSession") {
            const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
            if (!sessionId) return NextResponse.json({ error: "Thiếu sessionId" }, { status: 400 });

            const sessionRef = db.collection("users").doc(uid).collection("bot_chats").doc(sessionId);
            const sessionSnap = await sessionRef.get();
            if (!sessionSnap.exists || sessionSnap.data()?.deletedAt) {
                return NextResponse.json({ error: "Không tìm thấy phiên chat" }, { status: 404 });
            }

            const messagesSnap = await sessionRef.collection("messages").orderBy("createdAt", "asc").get();
            const messages = messagesSnap.docs
                .filter((doc) => !doc.data()?.deletedAt)
                .map(messageFromDoc)
                .filter((message) => message.text);

            return NextResponse.json({
                sessionId,
                summary: sessionSnap.data()?.summary || "",
                exportedAt: Timestamp.now().toDate().toISOString(),
                messages,
            });
        }

        return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
    } catch (error) {
        console.error("Bot chat POST error:", error);
        return NextResponse.json({ error: "Không xử lý được bot chat" }, { status: 500 });
    }
}
