/**
 * Database helpers for integration testing
 */

export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string, params?: unknown[]): Promise<unknown>;
  execute(sql: string, params?: unknown[]): Promise<void>;
  transaction<T>(fn: (conn: DatabaseConnection) => Promise<T>): Promise<T>;
  seed(data: Record<string, unknown[]>): Promise<void>;
  clear(tables?: string[]): Promise<void>;
}

export interface DatabaseConfig {
  url: string;
  poolSize?: number;
  timeout?: number;
  ssl?: boolean;
}

/**
 * Database client wrapper for testing
 */
export class TestDatabase implements DatabaseConnection {
  private connected = false;
  private seedData: Record<string, unknown[]> = {};

  constructor(private config: DatabaseConfig) {}

  async connect(): Promise<void> {
    if (this.connected) return;

    // Validate connection URL
    if (!this.config.url) {
      throw new Error('Database URL is required');
    }

    // In real implementation, would establish actual connection
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this.connected) return;
    this.connected = false;
  }

  async query(sql: string, params?: unknown[]): Promise<unknown> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    // In real implementation, would execute query
    return {
      rows: [],
      rowCount: 0,
    };
  }

  async execute(sql: string, params?: unknown[]): Promise<void> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    // In real implementation, would execute statement
  }

  async transaction<T>(fn: (conn: DatabaseConnection) => Promise<T>): Promise<T> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    try {
      const result = await fn(this);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async seed(data: Record<string, unknown[]>): Promise<void> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    this.seedData = data;

    for (const [table, records] of Object.entries(data)) {
      for (const record of records) {
        // In real implementation, would insert records
      }
    }
  }

  async clear(tables?: string[]): Promise<void> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    const tablesToClear = tables || Object.keys(this.seedData);

    for (const table of tablesToClear) {
      // In real implementation, would clear table
    }
  }

  getConnectionStatus(): { connected: boolean; url: string } {
    return {
      connected: this.connected,
      url: this.config.url,
    };
  }
}

/**
 * Create a test database instance
 */
export function createTestDatabase(config: DatabaseConfig): TestDatabase {
  return new TestDatabase(config);
}

/**
 * Database fixture for test setup/teardown
 */
export function createDatabaseFixture(config: DatabaseConfig) {
  const db = createTestDatabase(config);

  return {
    async setup() {
      await db.connect();
      return db;
    },
    async teardown() {
      await db.disconnect();
    },
  };
}

/**
 * Data builder for fluent database seeding
 */
export class DatabaseDataBuilder {
  private tables: Map<string, unknown[]> = new Map();

  add(tableName: string, records: unknown[]): this {
    this.tables.set(tableName, records);
    return this;
  }

  addSingle(tableName: string, record: unknown): this {
    const records = this.tables.get(tableName) || [];
    records.push(record);
    this.tables.set(tableName, records);
    return this;
  }

  async seedInto(db: DatabaseConnection): Promise<void> {
    const data = Object.fromEntries(this.tables);
    await db.seed(data);
  }

  getData(): Record<string, unknown[]> {
    return Object.fromEntries(this.tables);
  }

  clear(): this {
    this.tables.clear();
    return this;
  }
}

/**
 * Create a data builder instance
 */
export function createDataBuilder(): DatabaseDataBuilder {
  return new DatabaseDataBuilder();
}

/**
 * Reset database and seed with fresh data
 */
export async function resetDatabaseWithSeed(
  db: DatabaseConnection,
  seedData: Record<string, unknown[]>
): Promise<void> {
  await db.clear();
  await db.seed(seedData);
}

/**
 * Verify data in database
 */
export async function verifyDatabaseData(
  db: DatabaseConnection,
  table: string,
  expectedData: unknown[]
): Promise<boolean> {
  const result = await db.query(`SELECT * FROM ${table}`);
  const rows = (result as any).rows || [];
  return JSON.stringify(rows) === JSON.stringify(expectedData);
}
