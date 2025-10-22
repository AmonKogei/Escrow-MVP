import { NextResponse } from 'next/server';
import runSeed from '../../../../lib/devSeed';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, message: 'Not allowed in production' }, { status: 403 });
  }

  try {
    const res = await runSeed();
    if (res.ok) return NextResponse.json({ ok: true, message: 'Seed completed', result: res });
    return NextResponse.json({ ok: false, message: res.message || 'Seed failed' }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message || 'Seed error' }, { status: 500 });
  }
}
