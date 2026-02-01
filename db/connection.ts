/**
 * Database Connection Module
 *
 * Manages PostgreSQL connection pooling for the application.
 *
 * Architecture notes:
 * - Uses connection pooling to efficiently manage database connections
 * - Pool is created lazily (on first query) to avoid connection issues during build
 * - Connection string is read from environment variables for security
 */

import { Pool, QueryResult, QueryResultRow } from "pg";

// Connection pool instance (singleton pattern)
let pool: Pool | null = null;

/**
 * Get or create the database connection pool
 * Uses lazy initialization to avoid issues during Next.js build
 */
function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL environment variable is not set. " +
          "Please add it to your .env.local file."
      );
    }

    pool = new Pool({
      connectionString,
      // Connection pool settings optimized for serverless environments
      max: 10,                    // Maximum number of connections in the pool
      idleTimeoutMillis: 30000,   // Close idle connections after 30 seconds
      connectionTimeoutMillis: 5000, // Fail fast if can't connect in 5 seconds
    });

    // Log connection errors (but don't crash the application)
    pool.on("error", (err) => {
      console.error("Unexpected database pool error:", err);
    });
  }

  return pool;
}

/**
 * Execute a SQL query with parameters
 *
 * @param text - SQL query string with $1, $2, etc. placeholders
 * @param params - Array of parameter values
 * @returns Query result with typed rows
 *
 * @example
 * const result = await query<Property>(
 *   'SELECT * FROM properties WHERE region_id = $1',
 *   [regionId]
 * );
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();

  try {
    const result = await pool.query<T>(text, params);

    // Log slow queries in development
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development" && duration > 100) {
      console.log(`Slow query (${duration}ms):`, text.substring(0, 100));
    }

    return result;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Execute a query and return the first row or null
 * Useful for single-record lookups
 */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

/**
 * Execute a query and return all rows
 * Convenience wrapper that returns just the rows array
 */
export async function queryAll<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

/**
 * Close the database connection pool
 * Call this during graceful shutdown
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Check if database connection is healthy
 * Useful for health check endpoints
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
