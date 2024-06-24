import { Injectable } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';
import config from '../config/config';
import { TESTING_REDIS_PREFIX } from '../constants';

@Injectable()
export class RedisService {
  private readonly redis: RedisClient;

  constructor() {
    this.redis = new Redis({
      host: config.redisHost,
      port: config.redisPort,
      keyPrefix: process.env.NODE_ENV === 'testing' ? TESTING_REDIS_PREFIX : '',
    });
  }

  getClient(): RedisClient {
    return this.redis;
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
