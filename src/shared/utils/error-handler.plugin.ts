import { FastifyInstance, FastifyError } from 'fastify';

export function errorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    fastify.log.error(error);

    const status = error.statusCode ?? 500;
    const message = error.statusCode ? error.message : 'Internal server error';

    reply.status(status).send({ message });
  });
}
