import 'dotenv/config';
import ormconfig from '../ormconfig.json';

export const ENV = process.env.NODE_ENV || 'production';
export const PORT = +(process.env.PORT || 3000);
export const DB_TYPE = process.env.DB_TYPE || ormconfig.type;
export const DB_HOST = process.env.DB_HOST || 'localhost';
export const DB_PORT = +(process.env.DB_PORT || 27017);
export const DB_USERNAME = process.env.DB_USERNAME || ormconfig.username;
export const DB_PASSWORD = process.env.DB_PASSWORD || ormconfig.password;
export const DB_NAME = process.env.DB_NAME || ormconfig.database;

export const TypeORM = {
  ...ormconfig,
  type: DB_TYPE,
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USERNAME,
  database: DB_NAME,
  password: DB_PASSWORD,
};
