import Fastify from 'fastify';
import configPlugin from './env-config/config.plugin';
import dbPlugin from './database/database.plugin';

export function buildServer() {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
    disableRequestLogging: true,
  });

  fastify.register(configPlugin);
  fastify.register(dbPlugin);

  return fastify;
}
