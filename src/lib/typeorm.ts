import { DataSource } from 'typeorm';
import { Url } from '../entities/Url';
import { User } from '../entities/User';


export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true, // Auto-create tables (dev only)
  logging: false,
  entities: [Url, User],
  migrations: ['src/migrations/*.ts'],
  migrationsRun: true,
});
