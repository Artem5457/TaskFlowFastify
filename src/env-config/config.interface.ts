export interface IConfig {
  nodeEnv: string;
  dbName: string;
  dbUsername: string;
  dbPassword: string;
  dbHost: string;
  port: number;
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
  refreshTokenDaysValid: number;
  dummyPasswordHash: string;
  hmacSecret: string;
  invitationTokenDaysValid: number;
  salt: number;
  cookieSecret: string;
}
