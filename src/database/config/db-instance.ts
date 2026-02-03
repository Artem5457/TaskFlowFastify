import { Sequelize } from 'sequelize';

export function createSequelize(config: {
  dbName: string;
  dbUsername: string;
  dbPassword: string;
  dbHost: string;
}) {
  const { dbName, dbUsername, dbPassword, dbHost } = config;

  return new Sequelize(dbName, dbUsername, dbPassword, {
    host: dbHost,
    dialect: 'postgres',
    logging: true,
  });
}
