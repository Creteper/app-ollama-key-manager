#!/usr/bin/env node

/**
 * Database test script
 * Run with: node scripts/test-db.mjs
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const dataDir = join(projectRoot, 'data');
const dbPath = join(dataDir, 'keys.db');

console.log('🧪 Testing Database Setup');
console.log('========================\n');

console.log('Project root:', projectRoot);
console.log('Data directory:', dataDir);
console.log('Database path:', dbPath);
console.log();

// Ensure data directory exists
if (!existsSync(dataDir)) {
  console.log('📁 Creating data directory...');
  mkdirSync(dataDir, { recursive: true });
  console.log('✅ Data directory created\n');
} else {
  console.log('✅ Data directory exists\n');
}

// Try to open database
try {
  console.log('🔌 Opening database connection...');
  const db = new Database(dbPath);
  console.log('✅ Database connection successful\n');

  // Set WAL mode
  console.log('⚙️  Setting WAL mode...');
  db.pragma('journal_mode = WAL');
  console.log('✅ WAL mode set\n');

  // Create table
  console.log('📋 Creating tables...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      provider TEXT NOT NULL CHECK(provider IN ('claude', 'openai')),
      created_at INTEGER NOT NULL,
      last_used_at INTEGER,
      usage_count INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_key_hash ON api_keys(key_hash);
    CREATE INDEX IF NOT EXISTS idx_provider ON api_keys(provider);
  `);
  console.log('✅ Tables created\n');

  // Test insert
  console.log('➕ Testing insert...');
  const stmt = db.prepare(`
    INSERT INTO api_keys (id, name, key_hash, provider, created_at, last_used_at, usage_count)
    VALUES (?, ?, ?, ?, ?, NULL, 0)
  `);

  const testId = 'test-' + Date.now();
  const testHash = 'hash-' + Date.now();
  stmt.run(testId, 'Test Key', testHash, 'claude', Date.now());
  console.log('✅ Insert successful\n');

  // Test select
  console.log('🔍 Testing select...');
  const selectStmt = db.prepare('SELECT * FROM api_keys WHERE id = ?');
  const result = selectStmt.get(testId);
  console.log('✅ Select successful');
  console.log('   Result:', result);
  console.log();

  // Clean up test data
  console.log('🧹 Cleaning up test data...');
  const deleteStmt = db.prepare('DELETE FROM api_keys WHERE id = ?');
  deleteStmt.run(testId);
  console.log('✅ Cleanup successful\n');

  // Close database
  console.log('🔒 Closing database...');
  db.close();
  console.log('✅ Database closed\n');

  console.log('🎉 All tests passed!');
  console.log('Your database is working correctly.');

} catch (error) {
  console.error('❌ Error:', error);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
}
