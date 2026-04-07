import mysql from 'mysql2/promise';
import { nanoid } from 'nanoid';
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

// MySQL connection configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'mysql',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'ollama_user',
  password: process.env.MYSQL_PASSWORD || 'ollama_password',
  database: process.env.MYSQL_DATABASE || 'ollama_keys',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool: mysql.Pool | null = null;
let dbInitPromise: Promise<void> | null = null;

async function getDb(): Promise<mysql.Pool> {
  if (!pool) {
    try {
      console.log(`Connecting to MySQL at ${dbConfig.host}:${dbConfig.port}`);
      pool = mysql.createPool(dbConfig);

      // Test the connection
      const connection = await pool.getConnection();
      console.log('MySQL connection established successfully');
      connection.release();

      // Initialize database and wait for it to complete
      if (!dbInitPromise) {
        dbInitPromise = initDatabase();
      }
      await dbInitPromise;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      console.error('MySQL config:', {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database,
      });
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else if (dbInitPromise) {
    // If pool exists but initialization is still in progress, wait for it
    await dbInitPromise;
  }
  return pool;
}

async function initDatabase() {
  if (!pool) return;

  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id VARCHAR(21) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        key_hash VARCHAR(64) NOT NULL UNIQUE,
        provider ENUM('claude', 'openai') NOT NULL,
        created_at BIGINT NOT NULL,
        last_used_at BIGINT,
        usage_count INT DEFAULT 0,
        INDEX idx_key_hash (key_hash),
        INDEX idx_provider (provider)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } catch (error) {
    console.error('Failed to create table:', error);
    throw error;
  }
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
  const database = await getDb();
  const id = nanoid();
  const key = generateApiKey();
  const key_hash = hashKey(key);
  const created_at = Date.now();

  await database.execute(
    `INSERT INTO api_keys (id, name, key_hash, provider, created_at, last_used_at, usage_count)
     VALUES (?, ?, ?, ?, ?, NULL, 0)`,
    [id, name, key_hash, provider, created_at]
  );

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
  const database = await getDb();
  const [rows] = await database.execute(
    `SELECT id, name, key_hash, provider, created_at, last_used_at, usage_count
     FROM api_keys
     ORDER BY created_at DESC`
  );

  return (rows as any[]).map(row => ({
    id: row.id,
    name: row.name,
    key_hash: row.key_hash,
    provider: row.provider,
    created_at: row.created_at,
    last_used_at: row.last_used_at,
    usage_count: row.usage_count,
  }));
}

export async function deleteApiKey(id: string): Promise<boolean> {
  const database = await getDb();
  const [result] = await database.execute(
    'DELETE FROM api_keys WHERE id = ?',
    [id]
  );
  return (result as any).affectedRows > 0;
}

export async function validateApiKey(key: string): Promise<{ valid: boolean; keyData?: Omit<ApiKey, 'key'> }> {
  const database = await getDb();
  const key_hash = hashKey(key);

  const [rows] = await database.execute(
    `SELECT id, name, key_hash, provider, created_at, last_used_at, usage_count
     FROM api_keys
     WHERE key_hash = ?`,
    [key_hash]
  );

  const results = rows as any[];
  if (results.length > 0) {
    const row = results[0];
    const keyData = {
      id: row.id,
      name: row.name,
      key_hash: row.key_hash,
      provider: row.provider,
      created_at: row.created_at,
      last_used_at: row.last_used_at,
      usage_count: row.usage_count,
    };

    // Update last used timestamp and usage count
    await database.execute(
      `UPDATE api_keys
       SET last_used_at = ?, usage_count = usage_count + 1
       WHERE id = ?`,
      [Date.now(), keyData.id]
    );

    return { valid: true, keyData };
  }

  return { valid: false };
}

export async function getApiKeyById(id: string): Promise<Omit<ApiKey, 'key'> | null> {
  const database = await getDb();
  const [rows] = await database.execute(
    `SELECT id, name, key_hash, provider, created_at, last_used_at, usage_count
     FROM api_keys
     WHERE id = ?`,
    [id]
  );

  const results = rows as any[];
  if (results.length === 0) {
    return null;
  }

  const row = results[0];
  return {
    id: row.id,
    name: row.name,
    key_hash: row.key_hash,
    provider: row.provider,
    created_at: row.created_at,
    last_used_at: row.last_used_at,
    usage_count: row.usage_count,
  };
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    dbInitPromise = null;
  }
}
