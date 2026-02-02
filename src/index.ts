import { buildServer } from './server.js';

const server = buildServer();

const bootstrap = async () => {
  try {
    await server.listen({ port: 3000 });
  } catch (err) {
    server.log.fatal(
      `Failed to start the application. Reason: ${err instanceof Error ? err.message : String(err)}`
    );
    process.exit(1);
  }
};

bootstrap();
