import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

function loadEnv() {
  const envFiles = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), 'apps/web/.env'),
    path.resolve(process.cwd(), 'apps/web/.env.local'),
  ];
  for (const f of envFiles) {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL not found in .env or .env.local');
  process.exit(1);
}

const sql = neon(dbUrl);

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (typeof val === 'object') {
    // Stringify JSON fields or Date
    if (val instanceof Date) {
      return `'${val.toISOString().replace(/'/g, "''")}'`;
    }
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function exportToD1() {
  console.log('🔄 Connecting to Neon Postgres...');
  
  const tables = [
    'admin_users',
    'site_stats',
    'games',
    'posts',
    'post_media',
    'comments',
    'guestbook_entries',
    'tracks',
    'post_likes',
    'profiles',
    'anime_watchlist',
    'anime_reviews',
    'wiki_visual_references',
    'media_assets',
  ];

  let fullSql = `-- Generated Cloudflare D1 Migration Dump\n-- Source: Neon Postgres\n-- Generated on: ${new Date().toISOString()}\n\n`;
  fullSql += `PRAGMA foreign_keys = OFF;\n\n`;

  for (const table of tables) {
    try {
      console.log(`📦 Fetching table: ${table}...`);
      const rows = await sql.query(`SELECT * FROM ${table}`);
      console.log(`   Found ${rows.length} rows in ${table}`);

      if (rows.length === 0) continue;

      fullSql += `-- Table: ${table}\n`;
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = columns.map((col) => escapeSql(row[col]));
        fullSql += `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
      }
      fullSql += '\n';
    } catch (err) {
      console.warn(`⚠️  Could not read table ${table}:`, err.message);
    }
  }

  fullSql += `PRAGMA foreign_keys = ON;\n`;

  const outDir = path.resolve(process.cwd(), 'drizzle');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, 'neon-to-d1-dump.sql');
  fs.writeFileSync(outFile, fullSql, 'utf8');

  console.log(`\n✅ Migration dump generated successfully at:\n   ${outFile}`);
  console.log('\nTo apply this dump to your Cloudflare D1 database:');
  console.log('  1. Local test: npx wrangler d1 execute <DB_NAME> --local --file=drizzle/neon-to-d1-dump.sql');
  console.log('  2. Remote/Prod: npx wrangler d1 execute <DB_NAME> --remote --file=drizzle/neon-to-d1-dump.sql\n');
}

exportToD1().catch((err) => {
  console.error('Fatal export error:', err);
  process.exit(1);
});
