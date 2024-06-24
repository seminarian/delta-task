import { Module } from '@nestjs/common';
import { ApiController } from './api/api.controller';
import { SearchService } from './services/search.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import typeorm from './config/typeorm';
import { RedisService } from './services/redis.service';
import { TrendingSearchesService } from './services/trending-searches.service';
import { RecentSearchesService } from './services/recent-searches.service';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.get('typeorm'),
    }),
  ],
  controllers: [ApiController],
  providers: [
    SearchService,
    RedisService,
    TrendingSearchesService,
    RecentSearchesService,
  ],
})
export class AppModule {}
