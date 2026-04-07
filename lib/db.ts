import { createClient } from '@libsql/client';
import { nanoid } from 'nanoid';
import path from 'path';
import { randomBytes, createHash } from 'crypto';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  key_hash: string;
  provider: 'claude' | 'openai';
  created_at: number;
  last_used_at: number | null;
  usage_count: number;
}

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'keys.db');

let db: ReturnType<typeof createClient> | null = null;

function getDb() {
  if (!db) {
    try {
      // Ensure the data directory exists
      const dbDir = path.dirname(DB_PATH);
      const fs = require('fs');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      db = createClient({
        url: `file:${DB_PATH}`
      });

      initDatabase();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      console.error('Database path:', DB_PATH);
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  return db;
}

async function initDatabase() {
  if (!db) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      provider TEXT NOT NULL CHECK(provider IN ('claude', 'openai')),
      created_at INTEGER NOT NULL,
      last_used_at INTEGER,
      usage_count INTEGER DEFAULT 0
    )
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_key_hash ON api_keys(key_hash)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_provider ON api_keys(provider)`);
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function generateApiKey(): string {
  // Generate a secure random API key
  const prefix = 'sk-';
  const randomPart = randomBytes(32).toString('base64url');
  return prefix + randomPart;
}

export async function createApiKey(name: string, provider: 'claude' | 'openai'): Promise<ApiKey> {
  const database = getDb();
  const id = nanoid();
  const key = generateApiKey();
  const key_hash = hashKey(key);
  const created_at = Date.now();

  await database.execute({
    sql: `INSERT INTO api_keys (id, name, key_hash, provider, created_at, last_used_at, usage_count)
          VALUES (?, ?, ?, ?, ?, NULL, 0)`,
    args: [id, name, key_hash, provider, created_at]
  });

  return {
    id,
    name,
    key, // Only returned on creation
    key_hash,
    provider,
    created_at,
    last_used_at: null,
    usage_count: 0,
  };
}

export async function listApiKeys(): Promise<Omit<ApiKey, 'key'>[]> {
  const database = getDb();
  const result = await database.execute(
    `SELECT id, name, key_hash, provider, created_at, last_used_at, usage_count
     FROM api_keys
     ORDER BY created_at DESC`
  );

  return result.rows.map(row => ({
    id: row.id as string,
    name: row.name as string,
    key_hash: row.key_hash as string,
    provider: row.provider as 'claude' | 'openai',
    created_at: row.created_at as number,
    last_used_at: row.last_used_at as number | null,
    usage_count: row.usage_count as number,
  }));
}

export async function deleteApiKey(id: string): Promise<boolean> {
  const database = getDb();
  const result = await database.execute({
    sql: 'DELETE FROM api_keys WHERE id = ?',
    args: [id]
  });
  return result.rowsAffected > 0;
}

export async function validateApiKey(key: string): Promise<{ valid: boolean; keyData?: Omit<ApiKey, 'key'> }> {
  const database = getDb();
  const key_hash = hashKey(key);

  const result = await database.execute({
    sql: `SELECT id, name, key_hash, provider, created_at, last_used_at, usage_count
          FROM api_keys
          WHERE key_hash = ?`,
    args: [key_hash]
  });

  if (result.rows.length > 0) {
    const row = result.rows[0];
    const keyData = {
      id: row.id as string,
      name: row.name as string,
      key_hash: row.key_hash as string,
      provider: row.provider as 'claude' | 'openai',
      created_at: row.created_at as number,
      last_used_at: row.last_used_at as number | null,
      usage_count: row.usage_count as number,
    };

    // Update last used timestamp and usage count
    await database.execute({
      sql: `UPDATE api_keys
            SET last_used_at = ?, usage_count = usage_count + 1
            WHERE id = ?`,
      args: [Date.now(), keyData.id]
    });

    return { valid: true, keyData };
  }

  return { valid: false };
}

export async function getApiKeyById(id: string): Promise<Omit<ApiKey, 'key'> | null> {
  const database = getDb();
  const result = await database.execute({
    sql: `SELECT id, name, key_hash, provider, created_at, last_used_at, usage_count
          FROM api_keys
          WHERE id = ?`,
    args: [id]
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id as string,
    name: row.name as string,
    key_hash: row.key_hash as string,
    provider: row.provider as 'claude' | 'openai',
    created_at: row.created_at as number,
    last_used_at: row.last_used_at as number | null,
    usage_count: row.usage_count as number,
  };
}

export async function closeDb() {
  if (db) {
    await db.close();
    db = null;
  }
}
