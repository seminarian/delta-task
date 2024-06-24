import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';
import { Logger } from '@nestjs/common';

// Source environment variables from .env file
dotenvConfig({ path: '.env' });

const hostnameRegex = /^(?!:\/\/)([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/;
const ipAddressRegex = /^(\d{1,3}\.){3}\d{1,3}$/;

const logger = new Logger('config.ts');

// The main schema for the app config JSON
const createAppConfigSchema = z
  .object({
    databaseHost: z
      .string()
      .min(1, { message: 'Database host cannot be empty' })
      .refine(
        (value) => hostnameRegex.test(value) || ipAddressRegex.test(value),
        { message: 'Invalid IP address or hostname' },
      ),
    databasePort: z
      .number()
      .int()
      .min(1, { message: 'Port number must be between 1 and 65535' })
      .max(65535, { message: 'Port number must be between 1 and 65535' }),
    databaseName: z
      .string()
      .min(1, { message: 'Database name cannot be empty' }),
    databaseUser: z
      .string()
      .min(1, { message: 'Database user cannot be empty' }),
    databasePassword: z
      .string()
      .min(1, { message: 'Database password cannot be empty' }),
    redisHost: z
      .string()
      .min(1, { message: 'Redis host cannot be empty' })
      .refine(
        (value) => hostnameRegex.test(value) || ipAddressRegex.test(value),
        { message: 'Invalid IP address or hostname' },
      ),
    redisPort: z
      .number()
      .int()
      .min(1, { message: 'Port number must be between 1 and 65535' })
      .max(65535, { message: 'Port number must be between 1 and 65535' }),
    recentSearchesLimit: z
      .number()
      .int()
      .min(10, { message: 'Recent searches limit must be at least 10' })
      .max(1000, { message: 'Recent searches limit must be at most 1000' }),
    trendingSearchesWindowHours: z
      .number()
      .int()
      .min(1, { message: 'Trending searches window must be at least 1 hour' })
      .max(48, {
        message: 'Trending searches window must be at most 48 hours',
      }),
    sanitizeSearchEventsIntervalHours: z
      .number()
      .int()
      .min(1, {
        message: 'Sanitize search events interval must be at least 1 hour',
      })
      .max(48, {
        message: 'Sanitize search events interval must be at most 48 hours',
      }),
    precomputeTrendingSearchesIntervalSeconds: z
      .number()
      .int()
      .min(30, {
        message:
          'Precompute trending searches interval must be at least 30 seconds',
      })
      .max(3600, {
        message:
          'Precompute trending searches interval must be at most 3600 seconds',
      }),
  })
  .strict();

const config = {
  databaseHost: process.env.DATABASE_HOST,
  databasePort: parseInt(process.env.DATABASE_PORT),
  databaseName: process.env.DATABASE_NAME,
  databaseUser: process.env.DATABASE_USERNAME,
  databasePassword: process.env.DATABASE_PASSWORD,
  redisHost: process.env.REDIS_HOST,
  redisPort: parseInt(process.env.REDIS_PORT),
  recentSearchesLimit: parseInt(process.env.RECENT_SEARCHES_LIMIT),
  trendingSearchesWindowHours: parseInt(
    process.env.TRENDING_SEARCHES_WINDOW_HOURS,
  ),
  sanitizeSearchEventsIntervalHours: parseInt(
    process.env.SANITIZE_SEARCH_EVENTS_INTERVAL_HOURS,
  ),
  precomputeTrendingSearchesIntervalSeconds: parseInt(
    process.env.PRECOMPUTE_TRENDING_SEARCHES_INTERVAL_SECONDS,
  ),
};

let validatedConfig: AppConfig;
try {
  // Validate the parsed config against the schema
  validatedConfig = createAppConfigSchema.parse(config);
} catch (error) {
  logger.error('Invalid config:', error);
  logger.error('Please check your .env file');
  process.exit(1);
}

export type AppConfig = z.infer<typeof createAppConfigSchema>;

export default validatedConfig;
