import { NextResponse } from 'next/server';
import { authenticateUser } from '../../../../lib/utils';

export async function GET(request: Request) {
  try {
    // Try to authenticate (will throw if missing/invalid)
    const user = await authenticateUser(request, 'ANY').catch(() => null);

    // Always return { user: null } for unauthenticated clients instead of 401 so layouts can
    // render gracefully. If you need a 401 for API-only usage, adjust here.
    return NextResponse.json({ user: user ? user : null }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
