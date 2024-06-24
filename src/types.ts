import { z } from 'zod';

export interface TrendingSearchesResponse {
  assetIds: TrendingSearchesValueType;
}

export interface RecentSearchesResponse {
  assetIds: number[];
}

export interface SearchResponse {
  assetId: number;
  name: string;
}

export const trendingSearchesValueSchema = z.array(z.number());

export type TrendingSearchesValueType = z.infer<
  typeof trendingSearchesValueSchema
>;
