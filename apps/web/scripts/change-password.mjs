#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { stdin as input, stdout as output } from 'node:process';
import { Writable } from 'node:stream';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Connect to .env.local (and fallbacks)
function loadEnv() {
  const possiblePaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'apps/web/.env.local'),
    path.resolve(process.cwd(), '../.env.local'),
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../../.env.local'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'apps/web/.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
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

// 2. Hash & verify password with PBKDF2 (for admin_users schema)
function hashPbkdf2Password(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPbkdf2Password(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const derived = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
}

// 3. Interactive prompt helpers
function askText(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input, output });
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

function askSecret(query) {
  return new Promise((resolve) => {
    if (!input.isTTY) {
      const rl = readline.createInterface({ input, output });
      rl.question(query, (ans) => {
        rl.close();
        resolve(ans.trim());
      });
      return;
    }

    let muted = false;
    const mutableStdout = new Writable({
      write(chunk, encoding, callback) {
        if (!muted) {
          output.write(chunk, encoding);
        }
        callback();
      },
    });

    const rl = readline.createInterface({
      input,
      output: mutableStdout,
      terminal: true,
    });

    output.write(query);
    muted = true;

    rl.question('', (ans) => {
      muted = false;
      output.write('\n');
      rl.close();
      resolve(ans.trim());
    });
  });
}

// 4. CLI Argument parser
function parseArgs() {
  const args = process.argv.slice(2);
  let username = null;
  let newPassword = null;
  let currentPassword = null;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--force' || arg === '-f') {
      force = true;
    } else if (arg === '--username' || arg === '-u' || arg === '--name' || arg === '-n') {
      username = args[i + 1];
      i++;
    } else if (arg === '--password' || arg === '--new-password' || arg === '-p') {
      newPassword = args[i + 1];
      i++;
    } else if (arg === '--current-password' || arg === '--old-password' || arg === '-c') {
      currentPassword = args[i + 1];
      i++;
    } else if (!username && !arg.startsWith('-')) {
      username = arg;
    } else if (!newPassword && !arg.startsWith('-')) {
      newPassword = arg;
    }
  }

  return { username, newPassword, currentPassword, force };
}

function resolveToken() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  const paths = [
    '/root/.config/.wrangler/config/default.toml',
    process.env.HOME ? `${process.env.HOME}/.config/.wrangler/config/default.toml` : null,
  ].filter(Boolean);

  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf-8');
        const match = content.match(/oauth_token\s*=\s*"([^"]+)"/);
        if (match && match[1]) return match[1];
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
        return { success: true, results: data.result[0]?.results || [] };
      }
    } catch {}
  }

  let formatted = sql;
  for (const p of params) {
    const val =
      p === null ? 'NULL' : typeof p === 'number' ? String(p) : `'${String(p).replace(/'/g, "''")}'`;
    formatted = formatted.replace('?', val);
  }

  const cmd = `wrangler d1 execute kurzagin --remote --command=${JSON.stringify(formatted)} --json`;
  const out = execSync(cmd, { encoding: 'utf-8' });
  const data = JSON.parse(out);
  return { success: data[0]?.success, results: data[0]?.results || [] };
}

async function main() {
  console.log('\n========================================');
  console.log('  kurzagin // OPERATOR PASSWORD MANAGER');
  console.log('  Cloudflare D1 Database Passphrase Update');
  console.log('========================================\n');

  loadEnv();

  let { username, newPassword, currentPassword, force } = parseArgs();

  if (!username) {
    username = await askText('// Enter operator handle (default: kurzagin): ');
    username = username || 'kurzagin';
  }

  // Fetch operator record from D1
  const fetchRes = await executeD1Query(
    'SELECT id, username, password_hash FROM admin_users WHERE username = ? LIMIT 1;',
    [username]
  );

  if (!fetchRes.success || fetchRes.results.length === 0) {
    console.error(`\n❌ Error: Operator @${username} was not found in Cloudflare D1.`);
    process.exit(1);
  }

  const user = fetchRes.results[0];

  if (!force && !currentPassword) {
    currentPassword = await askSecret('// Enter CURRENT operator passphrase: ');
    if (!verifyPbkdf2Password(currentPassword, user.password_hash)) {
      console.error('\n❌ Error: Current passphrase verification failed.');
      process.exit(1);
    }
  }

  if (!newPassword) {
    newPassword = await askSecret('// Enter NEW operator passphrase: ');
    const confirm = await askSecret('// Confirm NEW operator passphrase: ');
    if (newPassword !== confirm) {
      console.error('\n❌ Error: Passphrases do not match.');
      process.exit(1);
    }
  }

  const newHash = hashPbkdf2Password(newPassword);

  console.log(`\n[d1] Updating passphrase for @${username} in Cloudflare D1...`);
  const updateRes = await executeD1Query(
    'UPDATE admin_users SET password_hash = ? WHERE id = ?;',
    [newHash, user.id]
  );

  // Revoke active sessions
  await executeD1Query('DELETE FROM admin_sessions WHERE user_id = ?;', [user.id]);

  if (updateRes.success) {
    console.log('\n========================================');
    console.log('✓ SUCCESS: Operator passphrase updated in Cloudflare D1!');
    console.log('========================================');
    console.log(`  Operator Handle: @${username}`);
    console.log('  Active Sessions: All prior sessions revoked for security');
    console.log('========================================\n');
  } else {
    console.error('\n❌ Error: Failed to update passphrase in Cloudflare D1.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\nFatal error in change-password script:', err);
  process.exit(1);
});
