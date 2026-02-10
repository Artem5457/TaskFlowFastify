import 'dotenv/config';
import { buildServer } from './server.js';
import { setupShutdown } from './shared/utils/shutdown.js';

const bootstrap = async () => {
  const server = await buildServer();

  try {
    await server.ready();

    const { port } = server.config;
    await server.listen({ port, host: 'localhost' });

    setupShutdown(server);
  } catch (err) {
    server.log.fatal({ err }, 'Failed to start the application');
    process.exit(1);
  }
};

bootstrap();
