import crypto from 'crypto';
import { FastifyInstance } from 'fastify';

export class TokenService {
  constructor(private fastify: FastifyInstance) {}

  hashToken(token: string) {
    const { hmacSecret } = this.fastify.config;
    const key = Buffer.from(hmacSecret, 'base64');

    return crypto.createHmac('sha256', key).update(token).digest('hex');
  }

  verifyToken(token: string, tokenHash: string): boolean {
    const hashedToken = this.hashToken(token);

    return crypto.timingSafeEqual(
      Buffer.from(hashedToken, 'hex'),
      Buffer.from(tokenHash, 'hex')
    );
  }
}
