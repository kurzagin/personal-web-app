#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

// 1. Connect to .env.local (and fallbacks)
function loadEnv() {
  const possiblePaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'apps/web/.env.local'),
    path.resolve(process.cwd(), '../.env.local'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'apps/web/.env'),
    path.resolve(process.cwd(), '../.env'),
  ];

  let loadedFrom = null;

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx === -1) return;
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        });
        loadedFrom = envPath;
        break;
      } catch (err) {
        console.warn(`[env] Warning reading ${envPath}:`, err.message);
      }
    }
  }

  return loadedFrom;
}

// 2. Hash password with PBKDF2 (salt:hash format)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// 3. CLI Argument parser
function parseArgs() {
  const args = process.argv.slice(2);
  let username = null;
  let password = null;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--username' || arg === '-u' || arg === '--name' || arg === '-n') {
      username = args[i + 1];
      i++;
    } else if (arg === '--password' || arg === '-p') {
      password = args[i + 1];
      i++;
    } else if (!username && !arg.startsWith('-')) {
      username = arg;
    } else if (!password && !arg.startsWith('-')) {
      password = arg;
    }
  }

  return { username, password, help };
}

// 4. Resolve Wrangler OAuth token or API token
function resolveToken() {
  if (process.env.CLOUDFLARE_API_TOKEN) {
    return process.env.CLOUDFLARE_API_TOKEN;
  }
  const wranglerConfigPaths = [
    '/root/.config/.wrangler/config/default.toml',
    process.env.HOME ? `${process.env.HOME}/.config/.wrangler/config/default.toml` : null,
  ].filter(Boolean);

  for (const p of wranglerConfigPaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf-8');
        const match = content.match(/oauth_token\s*=\s*"([^"]+)"/);
        if (match && match[1]) {
          return match[1];
        }
      } catch {}
    }
  }
  return null;
}

async function executeD1Query(sql, params = []) {
  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID || '8ad3f9b7260f39b307bc5f9650e33e6c';
  const databaseId =
    process.env.CLOUDFLARE_D1_DATABASE_ID || '942a6afe-bbc5-4558-832e-761c02d90d0f';
  const token = resolveToken();

  if (token) {
    try {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql, params }),
        }
      );
      const data = await res.json();
      if (data.success && data.result) {
        return { success: true, result: data.result[0]?.results || [] };
      }
    } catch (err) {
      // Fall through to wrangler CLI
    }
  }

  // Fallback to wrangler CLI
  let formatted = sql;
  for (const p of params) {
    const val =
      p === null ? 'NULL' : typeof p === 'number' ? String(p) : `'${String(p).replace(/'/g, "''")}'`;
    formatted = formatted.replace('?', val);
  }

  const cmd = `wrangler d1 execute kurzagin --remote --command=${JSON.stringify(formatted)} --json`;
  const out = execSync(cmd, { encoding: 'utf-8' });
  const data = JSON.parse(out);
  return { success: data[0]?.success, result: data[0]?.results || [] };
}

async function main() {
  console.log('\n========================================');
  console.log('  kurzagin // OPERATOR USER CREATOR');
  console.log('  Cloudflare D1 Database Provisioning');
  console.log('========================================\n');

  const envFile = loadEnv();
  if (envFile) {
    console.log(`[env] Configuration connected from: ${envFile}`);
  }

  let { username, password, help } = parseArgs();

  if (help) {
    console.log('Usage:');
    console.log('  node scripts/create-account.mjs [options]');
    console.log('  npm run create-account -- [options]\n');
    console.log('Options:');
    console.log('  -u, --username <handle>   Operator username / handle (default: kurzagin)');
    console.log('  -p, --password <secret>   Security passphrase');
    console.log('  -h, --help                Show this help screen\n');
    process.exit(0);
  }

  if (!username || !password) {
    const rl = readline.createInterface({ input, output });

    if (!username) {
      const inputUser = await rl.question('// Enter operator handle (default: kurzagin): ');
      username = inputUser.trim() || 'kurzagin';
    }

    if (!password) {
      const inputPass = await rl.question('// Enter security passphrase: ');
      password = inputPass.trim();
    }

    rl.close();
  }

  if (!username) {
    console.error('\n❌ Error: Username cannot be empty.');
    process.exit(1);
  }

  if (!password) {
    console.error('\n❌ Error: Password cannot be empty.');
    process.exit(1);
  }

  const passwordHash = hashPassword(password);
  const userId = crypto.randomUUID();

  console.log(`\n[d1] Provisioning operator @${username} in Cloudflare D1...`);

  try {
    const sql = `
      INSERT INTO admin_users (id, username, password_hash)
      VALUES (?, ?, ?)
      ON CONFLICT (username)
      DO UPDATE SET password_hash = excluded.password_hash;
    `;

    const res = await executeD1Query(sql, [userId, username, passwordHash]);

    if (!res.success) {
      throw new Error('D1 query returned unsuccessful execution');
    }

    console.log('\n========================================');
    console.log('✓ SUCCESS: Operator user saved in Cloudflare D1!');
    console.log('========================================');
    console.log(`  Operator Handle: @${username}`);
    console.log(`  Database Target: Cloudflare D1 (kurzagin)`);
    console.log(`  Web Login:       http://localhost:4321/login or /login on production`);
    console.log(`  Mobile App Auth: Supported via /api/auth/operator`);
    console.log('========================================\n');
  } catch (err) {
    console.error('\n❌ Error inserting user into Cloudflare D1:', err.message || err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
