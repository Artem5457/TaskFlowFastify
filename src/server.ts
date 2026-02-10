import Fastify from 'fastify';
import sensiblePlugin from '@fastify/sensible';
import cookiePlugin from '@fastify/cookie';
import configPlugin from './env-config/config.plugin';
import dbPlugin from './database/database.plugin';
import authPlugin from './auth/auth.plugin';
import organizationRoutes from './organization/organization.routes';
import { errorHandler } from './shared/utils/error-handler.plugin';

export async function buildServer() {
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
    // disableRequestLogging: true,
  });

  fastify.register(configPlugin);
  await fastify.register(dbPlugin);
  fastify.register(sensiblePlugin);
  fastify.register(cookiePlugin, {
    secret: fastify.config.cookieSecret,
    hook: 'onRequest',
  });

  errorHandler(fastify);

  // Routes
  await fastify.register(authPlugin);
  fastify.register(organizationRoutes, { prefix: '/api/organizations' });

  return fastify;
}
