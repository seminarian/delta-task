import { registerAs } from '@nestjs/config';
import { SearchEvent } from '..//entities/search-event.entity';
import config from './config';
import { DataSource, DataSourceOptions } from 'typeorm';

const isProduction = process.env.NODE_ENV === 'production';

const migrationPaths: string[] = isProduction
  ? ['./dist/migrations/*{.ts,.js}']
  : process.env.TYPEORM_USE_CLI === 'true'
  ? ['src/migrations/*{.ts,.js}']
  : [];

const typeOrmConfig = {
  type: 'postgres',
  host: config.databaseHost,
  port: config.databasePort,
  username: config.databaseUser,
  password: config.databasePassword,
  database: `${config.databaseName}${
    process.env.NODE_ENV === 'testing' ? 'testing' : ''
  }`,
  entities: [SearchEvent],
  migrations: migrationPaths,
  autoLoadEntities: true,
  migrationsRun: isProduction,
  synchronize: false,
};

export default registerAs('typeorm', () => typeOrmConfig);

export const connectionSource = new DataSource(
  typeOrmConfig as DataSourceOptions,
);
