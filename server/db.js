const { Pool } = require('pg');

// SSL solo si la DB es remota (no localhost/127.0.0.1)
const url = process.env.DATABASE_URL || '';
const isLocal = url.includes('localhost') || url.includes('127.0.0.1');

const pool = new Pool({
  connectionString: url,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

module.exports = pool;
