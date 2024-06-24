import { DataSource } from 'typeorm';
import { connectionSource } from '../src/config/typeorm';
import config from '../src/config/config';
import Redis from 'ioredis';
import { TESTING_REDIS_PREFIX } from '../src/constants';
import { Logger } from '@nestjs/common';

const logger = new Logger('TestUtils');

// Define a separate configuration to connect to the default database
const defaultDbConfig: any = {
  ...connectionSource.options,
  database: 'postgres', // Connect to the default database
};

// Define a separate configuration to connect to the default database
const migrationsDbConfig: any = {
  ...connectionSource.options,
  migrations: ['./src/migrations/*{.ts,.js}'],
};

export async function sanitizeRedis() {
  const redis = new Redis({
    host: config.redisHost,
    port: config.redisPort,
    keyPrefix: TESTING_REDIS_PREFIX,
  });

  // Use the 'keys' command to find all keys matching the prefix
  const keysToDelete = await redis.keys(TESTING_REDIS_PREFIX + '*');

  // If there are keys matching the pattern, delete them
  if (keysToDelete.length > 0) {
    await redis.del(...keysToDelete);
  }

  logger.log(`Deleted ${keysToDelete.length} keys.`);

  await redis.quit();
}

export async function setupTestDatabase() {
  try {
    const testDbName = connectionSource.options.database as string;

    // Create a separate datasource for default database connection to postgres database
    const defaultDatasource = new DataSource(defaultDbConfig);

    if (!defaultDatasource.isInitialized) {
      await defaultDatasource.initialize();
    }

    // Drop the existing test database if it exists
    await defaultDatasource.query(`DROP DATABASE IF EXISTS ${testDbName};`);

    // Create the new test database
    await defaultDatasource.query(`CREATE DATABASE ${testDbName};`);

    await defaultDatasource.destroy();

    // Create a separate datasource for default database connection
    const migrationsDatasource = new DataSource(migrationsDbConfig);
    await migrationsDatasource.initialize();
    // // Run migrations
    await migrationsDatasource.runMigrations();
    await migrationsDatasource.destroy();
  } catch (error) {
    logger.error('Error setting up the test database:', error);
    throw error;
  }
}

export async function teardownTestDatabase() {
  if (connectionSource.isInitialized) {
    await connectionSource.destroy();
  }
}
