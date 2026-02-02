import Fastify from 'fastify';

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

  fastify.get('/', async () => ({ hello: 'world' }));

  return fastify;
}
