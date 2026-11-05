import fs from 'node:fs';
import { execSync } from 'node:child_process';

export interface D1QueryResult<T = any> {
  results: T[];
  success: boolean;
  meta?: any;
}

/**
 * Cloudflare D1 Database Client
 * Works directly in Node.js / Next.js server runtime using Cloudflare REST API or Wrangler.
 */
export class D1Client {
  private accountId: string;
  private databaseId: string;
  private apiToken: string | null = null;

  constructor(accountId?: string, databaseId?: string, apiToken?: string) {
    this.accountId =
      accountId ||
      process.env.CLOUDFLARE_ACCOUNT_ID ||
      '8ad3f9b7260f39b307bc5f9650e33e6c';
    this.databaseId =
      databaseId ||
      process.env.CLOUDFLARE_D1_DATABASE_ID ||
      '942a6afe-bbc5-4558-832e-761c02d90d0f';
    this.apiToken =
      apiToken ||
      process.env.CLOUDFLARE_API_TOKEN ||
      this.resolveWranglerToken();
  }

  private resolveWranglerToken(): string | null {
    const wranglerConfigPaths = [
      '/root/.config/.wrangler/config/default.toml',
      process.env.HOME ? `${process.env.HOME}/.config/.wrangler/config/default.toml` : null,
    ].filter(Boolean) as string[];

    for (const p of wranglerConfigPaths) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, 'utf-8');
          const match = content.match(/oauth_token\s*=\s*"([^"]+)"/);
          if (match && match[1]) {
            return match[1];
          }
        } catch {
          // ignore error
        }
      }
    }
    return null;
  }

  /**
   * Executes a single SQL query with optional parameters
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<D1QueryResult<T>> {
    // 1. Try Cloudflare REST API if token is available
    if (this.apiToken) {
      try {
        const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql, params }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.result && data.result[0]) {
            return {
              results: (data.result[0].results as T[]) || [],
              success: true,
              meta: data.result[0].meta,
            };
          }
        }
      } catch (err) {
        console.warn('[d1-client] REST query error, falling back to wrangler CLI:', err);
      }
    }

    // 2. Fallback to wrangler CLI
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
