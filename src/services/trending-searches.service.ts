import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import {
  TrendingSearchesResponse,
  trendingSearchesValueSchema,
  TrendingSearchesValueType,
} from '../types';
import { RedisService } from './redis.service';
import { SearchEvent } from '..//entities/search-event.entity';
import { DataSource } from 'typeorm';
import config from '../config/config';
import { Redis } from 'ioredis';

@Injectable()
export class TrendingSearchesService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly redis: Redis;
  private readonly logger = new Logger(TrendingSearchesService.name);

  private intervalPrecompute: NodeJS.Timeout;
  private intervalSanitize: NodeJS.Timeout;

  constructor(
    private readonly redisClientService: RedisService,
    private readonly connection: DataSource,
  ) {
    this.redis = this.redisClientService.getClient();
  }

  onApplicationBootstrap() {
    // Pre compute the trending searches initially and then once every x seconds after that.
    this.preComputeAndCacheTrendingSearches();
    this.intervalPrecompute = setInterval(
      () => this.preComputeAndCacheTrendingSearches(),
      config.precomputeTrendingSearchesIntervalSeconds * 1000,
    );
    // Run immediately on startup and then every hour
    this.sanitizeSearchEvents();
    this.intervalSanitize = setInterval(
      () => this.sanitizeSearchEvents(),
      60 * 60 * 1000,
    );
  }

  async onApplicationShutdown() {
    if (this.intervalPrecompute) {
      clearInterval(this.intervalPrecompute);
    }
    if (this.intervalSanitize) {
      clearInterval(this.intervalSanitize);
    }
  }

  /**
   * Save a search event to the database.
   */
  async saveSearchEvent(userId: number, assetId: number): Promise<void> {
    const searchEvent = new SearchEvent();
    searchEvent.timestamp = new Date();
    searchEvent.userId = userId;
    searchEvent.assetId = assetId;

    await this.connection.getRepository(SearchEvent).save(searchEvent);
  }

  /**
   * Get the trending searches from the database.
   * This takes the unique searches for each asset in the last x hours and returns the top y assets.
   */
  async computeTrendingSearches(
    limit: number,
  ): Promise<TrendingSearchesResponse> {
    const result = await this.connection
      .getRepository(SearchEvent)
      .createQueryBuilder('search_event')
      .select('search_event.assetId', 'assetId')
      .addSelect('COUNT(DISTINCT search_event.userId)', 'unique_searches')
      .where(
        `search_event.timestamp >= NOW() - INTERVAL '${config.trendingSearchesWindowHours} hours'`,
      )
      .groupBy('search_event.assetId')
      .orderBy('unique_searches', 'DESC')
      .limit(limit)
      .getRawMany();

    return { assetIds: result.map((row) => Number(row.assetId)) };
  }

  /**
   * Pre-compute the trending searches and cache them in Redis.
   */
  async preComputeAndCacheTrendingSearches() {
    try {
      this.logger.log('Precomputing trending searches...');
      const trendingSearches = await this.computeTrendingSearches(
        config.trendingSearchesWindowHours,
      );
      await this.cacheTrendingSearches(trendingSearches);
      this.logger.log('Precomputing trending searches done.');
    } catch (error) {
      this.logger.error('Error occurred in preComputeTrendingSearches:', error);
      // Log the error or trigger an alert.
    }
  }

  /**
   * Sanitize the search events by removing events older than the configured window.
   * This is done periodically to keep the table size manageable.
   */
  private async sanitizeSearchEvents(): Promise<void> {
    try {
      this.logger.log('Sanitizing search events...');
      const windowTimeAgo = new Date();
      windowTimeAgo.setHours(
        windowTimeAgo.getHours() - config.trendingSearchesWindowHours,
      );

      await this.connection
        .createQueryBuilder()
        .delete()
        .from(SearchEvent)
        .where('timestamp < :windowTimeAgo', {
          windowTimeAgo: windowTimeAgo,
        })
        .execute();

      this.logger.log('Sanitizing search events done.');
    } catch (error) {
      this.logger.error('Error occurred in sanitizeSearchEvents:', error);
      // Log the error or trigger an alert.
    }
  }

  /**
   * Cache the trending searches in Redis.
   */
  async cacheTrendingSearches(data: TrendingSearchesResponse): Promise<void> {
    const trendingKey = 'trendingSearches';
    await this.redis.set(trendingKey, JSON.stringify(data.assetIds));
  }

  /**
   * Get the trending searches from Redis.
   */
  async getCachedTrendingSearches(): Promise<TrendingSearchesResponse> {
    const trendingKey = 'trendingSearches';

    // Retrieve the JSON string from Redis
    const jsonString = await this.redis.get(trendingKey);

    if (!jsonString) {
      // We should return an empty array if no data is found and probably log this / trigger an alert.
      return { assetIds: [] };
    }

    // Parse JSON string into array of assetIds
    let assetIds: TrendingSearchesValueType;
    try {
      assetIds = JSON.parse(jsonString);
      // Validate parsed data against the schema
      trendingSearchesValueSchema.parse(assetIds);
    } catch (error) {
      // Handle validation error
      this.logger.error('Error parsing or validating assetIds:', error.message);
      return { assetIds: [] };
    }

    return { assetIds };
  }
}
