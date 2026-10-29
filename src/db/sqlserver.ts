import sql from 'mssql';

// Configuration for Microsoft SQL Server
const rawServer = process.env.MSSQL_SERVER || 'DESKTOP-JN61NSF\\SQLEXPRESS';
const [serverHost, serverInstance] = rawServer.includes('\\')
  ? rawServer.split('\\')
  : [rawServer, process.env.MSSQL_INSTANCE || 'SQLEXPRESS'];

export const mssqlConfig: sql.config = {
  server: serverHost,
  database: process.env.MSSQL_DATABASE || 'HospeteFresh',
  user: process.env.MSSQL_USER || undefined,
  password: process.env.MSSQL_PASSWORD || undefined,
  port: process.env.MSSQL_PORT ? parseInt(process.env.MSSQL_PORT, 10) : undefined,
  options: {
    instanceName: serverInstance || undefined,
    encrypt: process.env.MSSQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE !== 'false', // true by default for local SQLEXPRESS
    enableArithAbort: true,
    connectTimeout: 4000,
    requestTimeout: 15000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

export const mssqlFullInstance = `${serverHost}\\${serverInstance}`;

let mssqlPool: sql.ConnectionPool | null = null;
let mssqlConnectionAttempted = false;
let mssqlIsConnected = false;
let mssqlLastError: string | null = null;

export async function getMssqlPool(): Promise<sql.ConnectionPool | null> {
  if (mssqlPool && mssqlPool.connected) {
    return mssqlPool;
  }

  try {
    mssqlConnectionAttempted = true;
    mssqlPool = new sql.ConnectionPool(mssqlConfig);
    mssqlPool.on('error', err => {
      console.error('[MSSQL Pool Error]', err);
      mssqlIsConnected = false;
    });

    await mssqlPool.connect();
    mssqlIsConnected = true;
    mssqlLastError = null;
    console.log(`[MSSQL] Successfully connected to SQL Server: ${mssqlConfig.server}/${mssqlConfig.database}`);
    return mssqlPool;
  } catch (err: any) {
    mssqlIsConnected = false;
    mssqlLastError = err.message || 'Connection failed';
    console.warn(`[MSSQL Notice] Local SQL Server (${mssqlConfig.server}/${mssqlConfig.database}) not reachable in current network environment: ${mssqlLastError}. Using PostgreSQL fallback provider.`);
    return null;
  }
}

export async function isMssqlAvailable(): Promise<boolean> {
  try {
    const pool = await getMssqlPool();
    if (!pool || !pool.connected) return false;
    const result = await pool.request().query('SELECT 1 as is_alive');
    return result.recordset[0]?.is_alive === 1;
  } catch {
    return false;
  }
}

export function getMssqlStatus() {
  return {
    server: mssqlFullInstance,
    database: mssqlConfig.database,
    connected: mssqlIsConnected,
    attempted: mssqlConnectionAttempted,
    lastError: mssqlLastError,
  };
}

export async function executeMssqlQuery<T = any>(
  queryString: string,
  parameters?: Record<string, { value: any; type?: any }>
): Promise<T[]> {
  const pool = await getMssqlPool();
  if (!pool) {
    throw new Error('MSSQL Pool is not available.');
  }

  const req = pool.request();
  if (parameters) {
    for (const [key, param] of Object.entries(parameters)) {
      if (param.type) {
        req.input(key, param.type, param.value);
      } else {
        req.input(key, param.value);
      }
    }
  }

  const result = await req.query(queryString);
  return (result.recordset || []) as T[];
}

export async function executeMssqlTransaction<T>(
  callback: (tx: sql.Transaction, req: sql.Request) => Promise<T>
): Promise<T> {
  const pool = await getMssqlPool();
  if (!pool) {
    throw new Error('MSSQL Pool is not available for transaction.');
  }

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const request = new sql.Request(transaction);
    const result = await callback(transaction, request);
    await transaction.commit();
    return result;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
