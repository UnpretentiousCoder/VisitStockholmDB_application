import { executeSql } from './inMemoryDatabase';

export interface DatabaseQueryResult {
  rows: any[];
  rowCount: number;
  source: 'postgresql' | 'in-memory-fallback';
  error?: string;
}

/**
 * Checks if the backend database bridge and PostgreSQL container are connected.
 */
export async function checkDatabaseHealth(): Promise<{ online: boolean; database?: string; error?: string }> {
  try {
    const res = await fetch('/api/db/health');
    if (!res.ok) {
      return { online: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { online: false, error: err.message };
  }
}

/**
 * Executes a SELECT query by attempting to send it to the PostgreSQL database backend.
 * If the PostgreSQL database or backend is unavailable, it automatically falls back
 * to the client-side in-memory Alasql database.
 */
export async function executeDatabaseQuery(sqlQuery: string): Promise<DatabaseQueryResult> {
  try {
    const response = await fetch('/api/db/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sqlQuery }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.rows)) {
        console.log(`[DB Client] Successfully executed query on PostgreSQL (${data.rowCount} rows returned).`);
        return {
          rows: data.rows,
          rowCount: data.rowCount,
          source: 'postgresql',
        };
      } else if (data.error) {
        console.warn(`[DB Client] PostgreSQL execution warning: ${data.error}. Falling back to in-memory database.`);
      }
    }
  } catch (fetchErr: any) {
    console.info('[DB Client] Backend API / PostgreSQL container unreachable. Using in-memory database.', fetchErr.message);
  }

  // Graceful fallback to in-memory database
  try {
    const fallbackRows = executeSql(sqlQuery);
    return {
      rows: fallbackRows,
      rowCount: fallbackRows.length,
      source: 'in-memory-fallback',
    };
  } catch (alasqlErr: any) {
    console.error('[DB Client] In-memory database also failed:', alasqlErr.message);
    return {
      rows: [],
      rowCount: 0,
      source: 'in-memory-fallback',
      error: alasqlErr.message,
    };
  }
}

