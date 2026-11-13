import { pool } from "./db";
import type { PoolClient, QueryResult } from "pg";

/**
 * Runs `callback` inside a single PostgreSQL transaction.
 *
 * - Begins a transaction, runs the callback with a dedicated `PoolClient`.
 * - Commits on success, rolls back on any error, then releases the client.
 * - The same client is used for every query so row locks (SELECT ... FOR UPDATE)
 *   and session state stay consistent across the whole unit of work.
 *
 * Application rule 1 & 3 & 4: order placement and fulfilment use this so that
 * inventory locking, reservation, order/items/history/movement inserts all
 * commit or roll back atomically.
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {
      /* swallow rollback errors; the original error must surface */
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Executes a parameterized query within an open transaction.
 * Prefer this over `pool.query` inside a transaction so locks are held on the
 * same connection.
 */
export async function txQuery(
  client: PoolClient,
  text: string,
  params?: unknown[]
): Promise<QueryResult<any>> {
  return client.query(text, params);
}

export type { PoolClient };
