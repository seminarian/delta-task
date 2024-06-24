import { Injectable, Logger } from '@nestjs/common';
import config from '../config/config';
import { RecentSearchesResponse } from '../types';
import { RedisService } from './redis.service';
import { Redis } from 'ioredis';

@Injectable()
export class RecentSearchesService {
  private readonly redis: Redis;
  private readonly logger = new Logger(RecentSearchesService.name);

  constructor(private readonly redisClientService: RedisService) {
    this.redis = this.redisClientService.getClient();
  }

  /**
   * Save a user's search to Redis. We first remove the assetId from the list if it already exists,
   * then add it to the left of the list. We then trim the list to only keep the last 100 searches.
   */
  async saveUserSearch(userId: number, assetId: number): Promise<void> {
    const userKey = `user:${userId}:searches`;

    await this.redis
      .multi()
      .lrem(userKey, 0, assetId.toString()) // Remove the assetId if it already exists in the list
      .lpush(userKey, assetId.toString()) // Add the assetId to the left of the list
      .ltrim(userKey, 0, config.recentSearchesLimit - 1) // Trim the list to only keep the last x searches
      .exec(); // Execute all commands atomically
  }

  /**
   * Get the recent searches for a user. The most recent search is first in the list.
   */
  async getRecentSearches(userId: number): Promise<RecentSearchesResponse> {
    const userKey = `user:${userId}:searches`;
    const searches = await this.redis.lrange(userKey, 0, -1);
    return { assetIds: searches.map((search) => Number(search)) };
  }
}
