import fs from 'node:fs';
import { execSync } from 'node:child_process';

export interface D1QueryResult<T = any> {
  results: T[];
  success: boolean;
  meta?: any;
}

const CF_CLIENT_ID = '54d11594-84e4-41aa-b438-e81b8fa78ee7';

/**
 * Cloudflare D1 Database Client
 * Works directly in Node.js / Next.js server runtime using Cloudflare REST API with automatic OAuth token refresh.
 */
export class D1Client {
  private accountId: string;
  private databaseId: string;
  private apiToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(accountId?: string, databaseId?: string, apiToken?: string) {
    this.accountId =
      accountId ||
      process.env.CLOUDFLARE_ACCOUNT_ID ||
      '8ad3f9b7260f39b307bc5f9650e33e6c';
    this.databaseId =
      databaseId ||
      process.env.CLOUDFLARE_D1_DATABASE_ID ||
      '942a6afe-bbc5-4558-832e-761c02d90d0f';
    this.apiToken = apiToken || process.env.CLOUDFLARE_API_TOKEN || null;
    this.refreshToken = process.env.CLOUDFLARE_REFRESH_TOKEN || null;

    // Only fallback to wrangler config file if no static token is configured
    if (!this.apiToken && !this.refreshToken) {
      this.resolveWranglerConfig();
    }
  }

  private resolveWranglerConfig(): void {
    const wranglerConfigPaths = [
      '/root/.config/.wrangler/config/default.toml',
      process.env.HOME ? `${process.env.HOME}/.config/.wrangler/config/default.toml` : null,
    ].filter(Boolean) as string[];

    for (const p of wranglerConfigPaths) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, 'utf-8');
          const tokenMatch = content.match(/oauth_token\s*=\s*"([^"]+)"/);
          if (tokenMatch && tokenMatch[1]) {
            this.apiToken = tokenMatch[1];
          }
          const refreshMatch = content.match(/refresh_token\s*=\s*"([^"]+)"/);
          if (refreshMatch && refreshMatch[1]) {
            this.refreshToken = refreshMatch[1];
          }
          const expMatch = content.match(/expiration_time\s*=\s*"([^"]+)"/);
          if (expMatch && expMatch[1]) {
            this.tokenExpiresAt = new Date(expMatch[1]).getTime();
          }
          if (this.apiToken) return;
        } catch {
          // ignore error
        }
      }
    }
  }

  /**
   * Refreshes the OAuth access token if a refresh token is present
   */
  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) return null;

    try {
      const res = await fetch('https://dash.cloudflare.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: CF_CLIENT_ID,
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.access_token) {
        this.apiToken = data.access_token;
        if (data.refresh_token) {
          this.refreshToken = data.refresh_token;
        }
        if (data.expires_in) {
          this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
        }
        return this.apiToken;
      } else {
        console.warn('[d1-client] Failed to refresh Cloudflare OAuth token:', data);
      }
    } catch (err) {
      console.warn('[d1-client] Error contacting Cloudflare OAuth endpoint:', err);
    }
    return null;
  }

  /**
   * Returns a valid access token, auto-refreshing if expired
   */
  private async getValidToken(): Promise<string | null> {
    if (this.refreshToken && (!this.apiToken || (this.tokenExpiresAt > 0 && Date.now() >= this.tokenExpiresAt))) {
      await this.refreshAccessToken();
    }
    return this.apiToken;
  }

  /**
   * Executes a single SQL query with optional parameters
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<D1QueryResult<T>> {
    const token = await this.getValidToken();

    // 1. Try Cloudflare REST API with token
    if (token) {
      try {
        const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;
        let res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql, params }),
        });

        // If unauthorized and we have a refresh token, try refreshing and retry once
        if (res.status === 401 || res.status === 403) {
          if (this.refreshToken) {
            const newToken = await this.refreshAccessToken();
            if (newToken) {
              res = await fetch(url, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${newToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sql, params }),
              });
            }
          }
        }

        const data = await res.json().catch(() => null);
        if (res.ok && data?.success && data?.result && data?.result[0]) {
          return {
            results: (data.result[0].results as T[]) || [],
            success: true,
            meta: data.result[0].meta,
          };
        } else {
          console.error('[d1-client] Cloudflare API error status:', res.status, JSON.stringify(data?.errors || data));
        }
      } catch (err) {
        console.warn('[d1-client] REST query error, falling back to wrangler CLI:', err);
      }
    }

    // 2. Fallback to wrangler CLI if running in local environment
    try {
      let formattedSql = sql.trim();
      if (params.length > 0) {
        for (const param of params) {
          const escaped =
            param === null || param === undefined
              ? 'NULL'
              : typeof param === 'number'
              ? String(param)
              : `'${String(param).replace(/'/g, "''")}'`;
          formattedSql = formattedSql.replace('?', escaped);
        }
      }

      const cmd = `wrangler d1 execute kurzagin --remote --command=${JSON.stringify(formattedSql)} --json`;
      const out = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      const data = JSON.parse(out);
      if (Array.isArray(data) && data[0]) {
        return {
          results: (data[0].results as T[]) || [],
          success: true,
          meta: data[0].meta,
        };
      }
    } catch (err: any) {
      console.error('[d1-client] Execution failed:', err?.message || err);
    }

    return { results: [], success: false };
  }
}

let d1Instance: D1Client | null = null;
export function getD1(): D1Client {
  if (!d1Instance) {
    d1Instance = new D1Client();
  }
  return d1Instance;
}
