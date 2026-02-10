import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { AuthService } from './auth.service';
import authRoutes from './auth.routes';

export default fp(
  async (fastify: FastifyInstance) => {
    const { accessTokenSecret, accessTokenExpiresIn } = fastify.config;

    fastify.register(fastifyJwt, {
      secret: accessTokenSecret,
      sign: { expiresIn: accessTokenExpiresIn },
    });

    const authService = new AuthService(fastify);
    fastify.addHook('preHandler', async (request) => {
      if (!request.url.startsWith('/api/auth')) {
        await authService.authenticate(request);
      }
    });

    fastify.register(authRoutes, { prefix: '/api/auth' });
  },
  {
    name: 'authPlugin',
    dependencies: ['configPlugin', 'dbPlugin'],
  }
);
