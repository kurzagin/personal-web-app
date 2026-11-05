import { connection, type NextRequest } from 'next/server';
import { authenticateOperator, buildSessionCookieHeader } from '@/lib/auth';

export async function POST(request: NextRequest) {
  await connection();

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.username || !body.password) {
      return Response.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const result = await authenticateOperator(body.username, body.password);
    if (!result.success) {
      return Response.json({ error: result.error || 'Authentication failed' }, { status: 401 });
    }

    const headers = new Headers();
    if (result.token) {
      headers.append('Set-Cookie', buildSessionCookieHeader(result.token));
    }

    return Response.json(
      {
        success: true,
        token: result.token,
        user: result.user,
      },
      { headers }
    );
  } catch (err: any) {
    console.error('[auth/operator] Error during login:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
