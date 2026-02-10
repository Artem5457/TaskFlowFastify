import fp from 'fastify-plugin';
import type { Logger } from 'pino';
import { FastifyInstance } from 'fastify';
import { createSequelize } from './config/db-instance';
import { createMigrator } from './config/migrator';
import { initModels } from './models';

export default fp(
  async (fastify: FastifyInstance) => {
    const { dbName, dbUsername, dbPassword, dbHost } = fastify.config;

    const sequelize = createSequelize({
      dbName,
      dbUsername,
      dbPassword,
      dbHost,
    });

    try {
      await sequelize.authenticate();
      fastify.log.info('Database connected successfully');

      fastify.decorate('sequelize', sequelize);

      const models = initModels(sequelize);
      fastify.decorate('models', models);

      const migrator = createMigrator(fastify.log as Logger, sequelize);
      await migrator.up();

      fastify.addHook('onClose', async () => {
        await sequelize.close();
        fastify.log.info('Database connection closed');
      });
    } catch (error) {
      fastify.log.error(
        error,
        'Failed to connect to database or run migrations.'
      );
      throw error;
    }
  },
  { name: 'dbPlugin', dependencies: ['configPlugin'] }
);
