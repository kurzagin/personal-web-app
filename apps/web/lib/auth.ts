import crypto from 'node:crypto';
import { getD1 } from './d1';

export interface SessionUser {
  id: string;
  username: string;
}

export interface CookieReader {
  get(name: string): { name?: string; value: string } | undefined;
  set?: (...args: any[]) => any;
  delete?: (...args: any[]) => any;
}

export const SESSION_COOKIE_NAME = 'kurzagin_session';

/**
 * Hash password with PBKDF2 (salt:hash format)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against salt:hash format
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return false;
    const derived = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Authenticate operator credentials against Cloudflare D1 `admin_users` table
 * and create a session token in `admin_sessions` table.
 */
export async function authenticateOperator(
  username: string,
  passphrase: string
): Promise<{ success: boolean; token?: string; user?: SessionUser; error?: string }> {
  const d1 = getD1();
  const trimmedUser = username.trim();

  try {
    const userRes = await d1.query<{ id: string; username: string; password_hash: string }>(
      'SELECT id, username, password_hash FROM admin_users WHERE username = ? LIMIT 1;',
      [trimmedUser]
    );

    if (!userRes.success || userRes.results.length === 0) {
      return { success: false, error: 'Invalid operator credentials' };
    }

    const user = userRes.results[0];
    const isValid = verifyPassword(passphrase, user.password_hash);
    if (!isValid) {
      return { success: false, error: 'Invalid operator credentials' };
    }

    // Generate cryptographically secure session token (stored in Cloudflare D1)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days validity

    await d1.query(
      'INSERT INTO admin_sessions (token, user_id, expires_at) VALUES (?, ?, ?);',
      [token, user.id, expiresAt]
    );

    return {
      success: true,
      token,
      user: { id: user.id, username: user.username },
    };
  } catch (err: any) {
    console.error('[auth] Authentication error:', err);
    return { success: false, error: 'Internal authentication failure' };
  }
}

/**
 * Validates session token from token string against Cloudflare D1 `admin_sessions`
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  if (!token) return null;
  const d1 = getD1();

  try {
    const nowIso = new Date().toISOString();
    const res = await d1.query<{ id: string; username: string }>(
      `SELECT u.id, u.username
       FROM admin_sessions s
       INNER JOIN admin_users u ON s.user_id = u.id
       WHERE s.token = ? AND s.expires_at > ?
       LIMIT 1;`,
      [token, nowIso]
    );

    if (res.success && res.results.length > 0) {
      return {
        id: res.results[0].id,
        username: res.results[0].username,
      };
    }
  } catch (err) {
    console.warn('[auth] Session verification error:', err);
  }

  return null;
}

/**
 * Revokes a session token from Cloudflare D1
 */
export async function revokeSessionToken(token: string): Promise<boolean> {
  if (!token) return false;
  const d1 = getD1();
  try {
    const res = await d1.query('DELETE FROM admin_sessions WHERE token = ?;', [token]);
    return res.success;
  } catch {
    return false;
  }
}

/**
 * Helper to resolve operator session from cookie store or Authorization header
 */
export async function getSession(
  cookies?: CookieReader,
  request?: Request
): Promise<SessionUser | null> {
  // 1. Try Bearer token in Authorization header (Mobile App / API)
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) {
        return verifySessionToken(match[1].trim());
      }
    }
  }

  // 2. Try cookie (Web Client)
  if (cookies) {
    const sessionCookie = cookies.get(SESSION_COOKIE_NAME);
    if (sessionCookie && sessionCookie.value) {
      return verifySessionToken(sessionCookie.value.trim());
    }
  }

  // 3. Fallback: parse cookie header from request
  if (request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match) {
      return verifySessionToken(match[1].trim());
    }
  }

  return null;
}

export async function isAuthenticated(
  cookies?: CookieReader,
  request?: Request
): Promise<boolean> {
  const session = await getSession(cookies, request);
  return session !== null;
}

export function buildSessionCookieHeader(token: string): string {
  const maxAge = 90 * 24 * 60 * 60; // 90 days in seconds
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`;
}

export function buildLogoutCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax`;
}
