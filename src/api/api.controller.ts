import { Controller, Get, Param, Query, ValidationPipe } from '@nestjs/common';
import {
  RecentSearchesResponse,
  SearchResponse,
  TrendingSearchesResponse,
} from '../types';
import { SearchService } from '../services/search.service';
import { QueryParamSearchDto } from './validation-dto/query-search-asset.dto';
import { ParamSearchDto } from './validation-dto/param-search-asset.dto';
import { QueryParamTrendingSearchesDto } from './validation-dto/query-trending-searches.dto';
import { TrendingSearchesService } from '../services/trending-searches.service';
import { RecentSearchesService } from '../services/recent-searches.service';

@Controller('api')
export class ApiController {
  constructor(
    private readonly searchService: SearchService,
    private readonly trendingSearchesService: TrendingSearchesService,
    private readonly recentSearchesService: RecentSearchesService,
  ) {}

  @Get('search_asset/:assetId')
  async searchAsset(
    @Param(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        forbidNonWhitelisted: true,
      }),
    )
    params: ParamSearchDto,
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        forbidNonWhitelisted: true,
      }),
    )
    query: QueryParamSearchDto,
  ): Promise<SearchResponse> {
    return await this.searchService.performSearch(query.userId, params.assetId);
  }

  @Get('trending_searches')
  async trendingSearches(): Promise<TrendingSearchesResponse> {
    return this.trendingSearchesService.getCachedTrendingSearches();
  }

  @Get('recent_searches')
  recentSearches(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        forbidNonWhitelisted: true,
      }),
    )
    query: QueryParamTrendingSearchesDto,
  ): Promise<RecentSearchesResponse> {
    return this.recentSearchesService.getRecentSearches(query.userId);
  }
}
