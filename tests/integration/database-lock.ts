import type { Pool, PoolClient } from "pg";

const integrationDatabaseLockId = 2_026_072_901;

export function createIntegrationDatabaseLock(pool: Pool) {
  let client: PoolClient | undefined;

  return {
    async acquire(): Promise<void> {
      client = await pool.connect();
      try {
        await client.query("select pg_advisory_lock($1)", [
          integrationDatabaseLockId,
        ]);
      } catch (error) {
        client.release();
        client = undefined;
        throw error;
      }
    },
    async release(): Promise<void> {
      if (!client) {
        return;
      }

      const lockedClient = client;
      client = undefined;
      try {
        await lockedClient.query("select pg_advisory_unlock($1)", [
          integrationDatabaseLockId,
        ]);
      } finally {
        lockedClient.release();
      }
    },
  };
}
