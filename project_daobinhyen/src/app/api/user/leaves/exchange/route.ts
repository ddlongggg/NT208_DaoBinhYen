import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Tinh nang quy doi da tat. Leaves, seeds va money duoc nhan truc tiep khi rung cay.' },
    { status: 410 }
  );
}
