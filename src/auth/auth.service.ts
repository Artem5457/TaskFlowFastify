import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import {
  IAuthPayload,
  LoginReqBody,
  LoginResBody,
  RegisterReqBody,
} from './auth.interfaces';
import { UniqueConstraintError } from 'sequelize';
import { calcExpirationDate, calcMillisecondsInDays } from '../shared/helpers';
import { TokenService } from '../shared/services/token.service';
import User from '../database/models/user.model';

interface IJwtPayload {
  id: string;
  email: string;
}

export class AuthService {
  constructor(
    private fastify: FastifyInstance,
    private tokenService: TokenService
  ) {}

  async registerUser(data: RegisterReqBody): Promise<User> {
    const hash = await this.hashPassword(data.password);

    try {
      const user = await this.fastify.models.User.create({
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        password: hash,
      });

      this.fastify.log.info(
        { userId: user.id, email: user.email },
        'User successfully created'
      );

      return user;
    } catch (error) {
      if (error instanceof UniqueConstraintError && error.fields?.email) {
        throw this.fastify.httpErrors.conflict(
          `User with email "${data.email}" already exists`
        );
      }

      this.fastify.log.error({ error }, 'Error creating user');
      throw error;
    }
  }

  async loginUser(
    reply: FastifyReply,
    data: LoginReqBody
  ): Promise<LoginResBody> {
    const { nodeEnv, refreshTokenDaysValid } = this.fastify.config;

    const { email, password } = data;
    const user = await this.validateUser(email, password);
    const { accessToken, refreshToken } = this.generateTokenPair(
      user.id,
      email
    );

    await this.storeRefreshToken(user.id, refreshToken);

    reply.setCookie('refreshToken', refreshToken, {
      path: '/',
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: calcMillisecondsInDays(refreshTokenDaysValid),
    });

    this.fastify.log.info(
      { userId: user.id, email: user.email },
      'User logged in'
    );

    return { accessToken };
  }

  async refreshToken(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<LoginResBody> {
    const { nodeEnv, refreshTokenDaysValid } = this.fastify.config;
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      throw this.fastify.httpErrors.unauthorized('Refresh token is required');
    }

    const { id, email } = await this.validateRefreshToken(refreshToken);

    const { accessToken, refreshToken: newRefreshToken } =
      this.generateTokenPair(id, email);

    await this.storeRefreshToken(id, newRefreshToken);

    reply.setCookie('refreshToken', newRefreshToken, {
      path: '/',
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: calcMillisecondsInDays(refreshTokenDaysValid),
    });
    this.fastify.log.info({ userId: id }, 'Token refreshed');

    return { accessToken };
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const { nodeEnv } = this.fastify.config;
    const refreshToken = request.cookies.refreshToken;
    if (refreshToken) {
      await this.revokeRefreshToken(refreshToken);
      this.fastify.log.info('User logged out successfully');
    } else {
      this.fastify.log.warn('Logout attempt without refresh token');
    }

    reply.clearCookie('refreshToken', {
      path: '/',
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'lax',
    });
  }

  async authenticate(request: FastifyRequest) {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw this.fastify.httpErrors.unauthorized('Access token missing');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.verifyAccessToken(token);
      request.user = payload;
    } catch {
      throw this.fastify.httpErrors.unauthorized(
        'Invalid or expired access token'
      );
    }
  }

  private async validateUser(email: string, password: string): Promise<User> {
    const { dummyPasswordHash } = this.fastify.config;

    const user = await User.findOne({ where: { email } });
    const passwordHash = user?.password || dummyPasswordHash;

    const isValid = await this.verifyPassword(password, passwordHash);
    if (!user || !isValid) {
      throw this.fastify.httpErrors.unauthorized('Invalid email or password');
    }

    this.fastify.log.info(
      { userId: user.id, email: user.email },
      'User successfully validated'
    );

    return user;
  }

  private generateTokenPair(userId: string, email: string) {
    const accessToken = this.generateAccessToken({ id: userId, email });
    const refreshToken = this.generateRefreshToken({ id: userId, email });

    this.fastify.log.info('Token pair generated (access + refresh)');

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    const { refreshTokenDaysValid } = this.fastify.config;

    const refreshTokenHash = this.tokenService.hashToken(refreshToken);
    const expiresAt = calcExpirationDate(
      calcMillisecondsInDays(refreshTokenDaysValid)
    );

    await this.fastify.sequelize.transaction(async (t) => {
      await this.fastify.models.RefreshToken.destroy({
        where: { userId },
        transaction: t,
      });
      await this.fastify.models.RefreshToken.create(
        { userId, token: refreshTokenHash, expiresAt },
        { transaction: t }
      );
    });
  }

  private async validateRefreshToken(
    refreshToken: string
  ): Promise<IAuthPayload> {
    let payload: IAuthPayload;
    try {
      payload = this.verifyRefreshToken(refreshToken);
    } catch {
      throw this.fastify.httpErrors.unauthorized('Invalid refresh token');
    }

    const storedToken = await this.fastify.models.RefreshToken.findOne({
      where: { userId: payload.id },
    });
    if (!storedToken) {
      throw this.fastify.httpErrors.unauthorized('Refresh token not found');
    }

    const valid = this.tokenService.verifyToken(
      refreshToken,
      storedToken.token
    );
    if (!valid) {
      throw this.fastify.httpErrors.unauthorized('Refresh token mismatch');
    }

    this.fastify.log.info(
      { userId: payload.id },
      'Refresh token validated successfully'
    );

    return payload;
  }

  private async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = this.tokenService.hashToken(refreshToken);
    await this.fastify.models.RefreshToken.destroy({
      where: { token: tokenHash },
    });
  }

  private generateAccessToken(payload: IJwtPayload) {
    return this.fastify.jwt.sign(payload);
  }

  private generateRefreshToken(payload: IJwtPayload): string {
    const { refreshTokenSecret, refreshTokenExpiresIn } = this.fastify.config;

    return this.fastify.jwt.sign(payload, {
      key: refreshTokenSecret,
      expiresIn: refreshTokenExpiresIn,
    });
  }

  private verifyAccessToken(token: string): IJwtPayload {
    return this.fastify.jwt.verify<IJwtPayload>(token);
  }

  private verifyRefreshToken(token: string): IJwtPayload {
    return this.fastify.jwt.verify<IJwtPayload>(token, {
      key: this.fastify.config.refreshTokenSecret,
    });
  }

  private async hashPassword(password: string): Promise<string> {
    const { salt } = this.fastify.config;
    return bcrypt.hash(password, salt);
  }

  private async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
