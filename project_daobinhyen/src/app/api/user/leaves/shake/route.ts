import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const SHAKE_COOLDOWN_MS = 5000;

type RewardType = "leaf" | "coin" | "seed";

function rollReward() {
  const rand = Math.random();
  let type: RewardType = "leaf";
  let amount = 1;

  if (rand < 0.60) {
    type = "leaf";
    amount = Math.floor(Math.random() * 3) + 1;
  } else if (rand < 0.90) {
    type = "coin";
    amount = Math.floor(Math.random() * 8) + 3;
  } else {
    type = "seed";
    amount = 1;
  }

  const updateField = type === "leaf" ? "leaves" : type === "coin" ? "money" : "seeds";
  return { type, amount, updateField };
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;
    const userRef = db.collection("users").doc(uid);

    const result = await db.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      const now = Date.now();
      const lastShakeAt = userSnap.data()?.lastShakeAt;
      const lastShakeMs = lastShakeAt?.toMillis ? lastShakeAt.toMillis() : 0;
      const retryAfterMs = SHAKE_COOLDOWN_MS - (now - lastShakeMs);

      if (retryAfterMs > 0) {
        return { limited: true, retryAfterMs };
      }

      const reward = rollReward();
      transaction.set(
        userRef,
        {
          [reward.updateField]: FieldValue.increment(reward.amount),
          lastShakeAt: Timestamp.now(),
        },
        { merge: true }
      );

      return { limited: false, reward: { type: reward.type, amount: reward.amount } };
    });

    if (result.limited) {
      return NextResponse.json(
        { success: false, error: "Cooldown", retryAfterMs: result.retryAfterMs },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      reward: result.reward,
    });
  } catch (error) {
    console.error("Shake tree error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
