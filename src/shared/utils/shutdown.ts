import type { FastifyInstance } from 'fastify';

let isShuttingDown = false;

export const setupShutdown = (server: FastifyInstance) => {
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    server.log.info(`Received ${signal}, shutting down...`);

    try {
      await server.close(); // call onClose hooks
      server.log.info('Server closed successfully');
      process.exit(0);
    } catch (err) {
      server.log.error(err, 'Error during server shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};
