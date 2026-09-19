import pg from 'pg';
import { config } from './config';

// NUMERIC (oid 1700) comes back as a string by default; the API contract (like the old .NET one) uses JSON numbers.
pg.types.setTypeParser(1700, (value: string) => parseFloat(value));

export type Queryable = Pick<pg.Pool, 'query'>;

let pool: pg.Pool | undefined;

/** Lazily created so importing the app (e.g. in tests) never opens a connection. */
export function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
    });
  }
  return pool;
}

/** Runs `work` in a single transaction on one connection; rolls back if it throws. */
export async function withTransaction<T>(work: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
