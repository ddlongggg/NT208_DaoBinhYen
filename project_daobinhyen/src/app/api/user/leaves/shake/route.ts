import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/app/lib/firebaseAdmin';

type RewardType = 'leaf' | 'coin' | 'seed';

const getShakeReward = (): { type: RewardType; amount: number } => {
  const randomVal = Math.random();

  if (randomVal < 0.90) {
    return { type: 'leaf', amount: Math.floor(Math.random() * 3) + 1 };
  }

  if (randomVal < 0.93) {
    return { type: 'seed', amount: 1 };
  }

  return { type: 'coin', amount: Math.floor(Math.random() * 3) + 1 };
};

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Chua dang nhap' }, { status: 401 });
    }

    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    const userRef = db.collection('users').doc(decodedToken.uid);
    const reward = getShakeReward();

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(userRef);
      if (!doc.exists) {
        throw new Error('User does not exist');
      }

      const userData = doc.data();

      if (reward.type === 'leaf') {
        transaction.update(userRef, { leaves: (userData?.leaves || 0) + reward.amount });
      } else if (reward.type === 'coin') {
        transaction.update(userRef, { money: (userData?.money || 0) + reward.amount });
      } else {
        transaction.update(userRef, { seeds: (userData?.seeds || 0) + reward.amount });
      }
    });

    return NextResponse.json({
      success: true,
      reward
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Loi may chu' }, { status: 500 });
  }
}
