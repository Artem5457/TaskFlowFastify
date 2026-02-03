import fp from 'fastify-plugin';
import { envVars } from './constants';
import { IConfig } from './config.interface';

const getConfigValueOrThrow = (key: string, defaultValue?: string): string => {
  const value = process.env[key] ?? defaultValue;
  if (!value) {
    throw new Error(`No ${key} variable provided`);
  }
  return value;
};

const getConfig = (): IConfig => ({
  nodeEnv: getConfigValueOrThrow(envVars.NODE_ENV),
  dbName: getConfigValueOrThrow(envVars.DB_NAME),
  dbUsername: getConfigValueOrThrow(envVars.DB_USERNAME),
  dbPassword: getConfigValueOrThrow(envVars.DB_PASSWORD),
  dbHost: getConfigValueOrThrow(envVars.DB_HOST),
  port: Number(getConfigValueOrThrow(envVars.PORT)),
  accessTokenSecret: getConfigValueOrThrow(envVars.ACCESS_TOKEN_SECRET),
  refreshTokenSecret: getConfigValueOrThrow(envVars.REFRESH_TOKEN_SECRET),
  accessTokenExpiresIn: getConfigValueOrThrow(envVars.ACCESS_TOKEN_EXPIRES_IN),
  refreshTokenExpiresIn: getConfigValueOrThrow(
    envVars.REFRESH_TOKEN_EXPIRES_IN
  ),
  refreshTokenDaysValid: Number(
    getConfigValueOrThrow(envVars.REFRESH_TOKEN_DAYS_VALID)
  ),
  dummyPasswordHash: getConfigValueOrThrow(envVars.DUMMY_PASSWORD_HASH),
  hmacSecret: getConfigValueOrThrow(envVars.HMAC_SECRET_KEY),
  invitationTokenDaysValid: Number(
    getConfigValueOrThrow(envVars.INVITATION_TOKEN_DAYS_VALID)
  ),
});

export default fp(async (fastify) => {
  const config = getConfig();
  fastify.decorate('config', config);
});
