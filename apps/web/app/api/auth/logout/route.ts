import { type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE_NAME,
  revokeSessionToken,
  buildLogoutCookieHeader,
} from '@/lib/auth';

async function performLogout(request: NextRequest): Promise<Headers> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  const token = sessionCookie?.value;

  if (token) {
    await revokeSessionToken(token);
  }

  const headers = new Headers();
  headers.append('Set-Cookie', buildLogoutCookieHeader());
  return headers;
}

export async function POST(request: NextRequest) {
  const headers = await performLogout(request);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers,
  });
}

export async function GET(request: NextRequest) {
  const headers = await performLogout(request);
  headers.set('Location', '/');
  return new Response(null, {
    status: 302,
    headers,
  });
}
