import { Injectable, Logger } from '@nestjs/common';
import { SearchResponse } from 'src/types';
import { RedisService } from './redis.service';
import { RecentSearchesService } from './recent-searches.service';
import { TrendingSearchesService } from './trending-searches.service';
import { Redis } from 'ioredis';

@Injectable()
export class SearchService {
  private readonly redis: Redis;
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly recentSearchesService: RecentSearchesService,
    private readonly trendingSearchesService: TrendingSearchesService,
  ) {
    this.redis = this.redisService.getClient();
  }

  /**
   * Perform a search for an asset to an external microservice. The search is logged and the asset is returned.
   */
  async performSearch(
    userId: number,
    assetId: number,
  ): Promise<SearchResponse> {
    // We mock a successful search to the external search microservice.
    // In the case an asset is not found, the search microservice should return a 404.

    // Here we assume the asset was found so we log the search and return the asset.
    // We don't await the logSearch function because we don't need to wait for it to finish before returning the asset.
    this.logSearch(userId, assetId).catch((err: unknown) => {
      // Log the error or trigger an alert.
      this.logger.error('Error occurred:', err);
      console.error(err);
    });

    return { assetId, name: 'Asset name' };
  }

  /**
   * Log a search event for a user. The search event is stored in the time series database and the user's recent searches in Redis.
   */
  private async logSearch(userId: number, assetId: number): Promise<void> {
    // Store the search event to the time series database and the user's recent searches in Redis.
    await this.recentSearchesService.saveUserSearch(userId, assetId);
    await this.trendingSearchesService.saveSearchEvent(userId, assetId);
  }
}
