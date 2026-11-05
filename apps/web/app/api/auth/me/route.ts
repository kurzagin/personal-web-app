import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/serverSession';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.id,
        username: session.username,
      },
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}
