import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { AuthService } from './auth.service';
import authRoutes from './auth.routes';
import { TokenService } from '../shared/services/token.service';

export default fp(
  async (fastify: FastifyInstance) => {
    const { accessTokenSecret, accessTokenExpiresIn } = fastify.config;

    fastify.register(fastifyJwt, {
      secret: accessTokenSecret,
      sign: { expiresIn: accessTokenExpiresIn },
    });

    const tokenService = new TokenService(fastify);
    const authService = new AuthService(fastify, tokenService);

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
