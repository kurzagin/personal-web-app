import { type NextRequest } from 'next/server';
import { authenticateOperator, buildSessionCookieHeader } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = (body.identifier || body.username || body.email || '').trim();
    const password = (body.password || '').trim();

    if (!username) {
      return new Response(JSON.stringify({ error: 'Operator handle or identifier is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!password) {
      return new Response(JSON.stringify({ error: 'Security passphrase is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await authenticateOperator(username, password);

    if (!result.success || !result.token) {
      return new Response(JSON.stringify({ error: result.error || 'Invalid operator credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const headers = new Headers({ 'Content-Type': 'application/json' });
    // Set HTTP-only session cookie for the web app
    headers.append('Set-Cookie', buildSessionCookieHeader(result.token));

    return new Response(
      JSON.stringify({
        success: true,
        token: result.token,
        username: result.user?.username || username,
      }),
      {
        status: 200,
        headers,
      }
    );
  } catch (err: any) {
    console.error('[auth/login] Error during login:', err);
    return new Response(JSON.stringify({ error: 'Authentication service error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
