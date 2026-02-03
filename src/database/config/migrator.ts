import path from 'path';
import { Umzug, SequelizeStorage } from 'umzug';
import type { Logger } from 'pino';
import { Sequelize } from 'sequelize';

const migrationsGlob: [string, { ignore: string[] }] = [
  path.join(__dirname, '../migrations/*.{ts,js}'),
  {
    ignore: [path.join(__dirname, '../migrations/*.d.ts')],
  },
];

export function createMigrator(logger: Logger, sequelize: Sequelize) {
  return new Umzug({
    migrations: {
      glob: migrationsGlob,
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: {
      info: (msg) => logger.info(msg),
      warn: (msg) => logger.warn(msg),
      error: (msg) => logger.error(msg),
      debug: (msg) => (logger.debug ? logger.debug(msg) : logger.info(msg)),
    },
  });
}
