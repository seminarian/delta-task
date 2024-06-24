import {
  sanitizeRedis,
  setupTestDatabase,
  teardownTestDatabase,
} from './test-utils';

beforeAll(async () => {
  await setupTestDatabase();
  await sanitizeRedis();
});

afterAll(async () => {
  await teardownTestDatabase();
});
