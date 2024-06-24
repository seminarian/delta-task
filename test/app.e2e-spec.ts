import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import config from '../src/config/config';
import { TrendingSearchesService } from '../src/services/trending-searches.service';

describe('Tests application functionality', () => {
  let app: INestApplication;
  let trendingSearchesService: TrendingSearchesService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    trendingSearchesService = moduleFixture.get<TrendingSearchesService>(
      TrendingSearchesService,
    );
  });

  async function makeRequest(url) {
    const response = await request(app.getHttpServer()).get(url);
    expect(response.status).toBe(200);
    return response.body;
  }

  it('Tests trending searches endpoint', async () => {
    // 2 unique users search for assetId 71
    const response = await makeRequest('/api/search_asset/71?userId=2');
    expect(response).toEqual({ assetId: 71, name: 'Asset name' });
    await makeRequest('/api/search_asset/71?userId=2');
    await makeRequest('/api/search_asset/71?userId=3');
    // 3 unique users search for assetId 72
    await makeRequest('/api/search_asset/72?userId=2');
    await makeRequest('/api/search_asset/72?userId=3');
    await makeRequest('/api/search_asset/72?userId=4');
    // 1 unique users search for assetId 73
    await makeRequest('/api/search_asset/73?userId=3');
    await makeRequest('/api/search_asset/73?userId=3');
    await makeRequest('/api/search_asset/73?userId=3');
    await makeRequest('/api/search_asset/73?userId=3');
    await makeRequest('/api/search_asset/73?userId=3');

    // Log search is not executed synchronously so we need to wait a bit for the last search to be logged
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Fetch trending searches
    const trendingSearchesResponse = await makeRequest(
      '/api/trending_searches',
    );

    // The trending searches should be empty initially because it is not yet precomputed
    expect(trendingSearchesResponse).toEqual({ assetIds: [] });

    await trendingSearchesService.preComputeAndCacheTrendingSearches();

    const trendingSearchesResponse2 = await makeRequest(
      '/api/trending_searches',
    );

    expect(trendingSearchesResponse2).toEqual({ assetIds: [72, 71, 73] });
  });

  it('Tests recent searches endpoint', async () => {
    const recentSearches = [];

    for (let i = 1; i <= 150; i++) {
      await makeRequest(`/api/search_asset/${i}?userId=100`);
      recentSearches.push(i);

      // Ensure recentSearches array does not exceed "recentSearchesLimit" items
      if (recentSearches.length > config.recentSearchesLimit) {
        recentSearches.shift();
      }
    }

    // Log search is not executed synchronously so we need to wait a bit for the last search to be logged
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Fetch recent searches for userId=100
    const recentSearchesResponse = await makeRequest(
      '/api/recent_searches?userId=100',
    );

    // Assert the length of recent searches to ensure it has only the last 'recentSearchesLimit' items
    expect(recentSearchesResponse.assetIds.length).toBe(
      config.recentSearchesLimit,
    );

    // Last searched assets should be at the beginning of the array
    recentSearches.reverse();
    expect(recentSearchesResponse.assetIds).toEqual(recentSearches);

    // We now search again for assetId 149 and it should be move to the beginning of the list
    await makeRequest('/api/search_asset/149?userId=100');

    // Wait a bit for the last search to be logged
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Fetch recent searches again
    const updatedRecentSearchesResponse = await makeRequest(
      '/api/recent_searches?userId=100',
    );

    // Assert that assetId 149 is now at the beginning of the recent searches list
    expect(updatedRecentSearchesResponse.assetIds[0]).toBe(149);
    // Assert that the length of the recent searches list is still the same
    expect(updatedRecentSearchesResponse.assetIds.length).toBe(
      config.recentSearchesLimit,
    );
    // Assert that 149 is only once in the list
    expect(
      updatedRecentSearchesResponse.assetIds.filter((id) => id === 149),
    ).toHaveLength(1);
  });
});
