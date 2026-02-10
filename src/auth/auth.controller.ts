import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import {
  LoginReqBody,
  LoginResBody,
  RegisterReqBody,
  RegisterResBody,
} from './auth.interfaces';

export class AuthController {
  constructor(private authService: AuthService) {}

  async registerUser(
    request: FastifyRequest<{ Body: RegisterReqBody }>,
    reply: FastifyReply<{ Reply: RegisterResBody }>
  ) {
    const user = await this.authService.registerUser(request.body);

    reply.status(201).send({
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
    });
  }

  async loginUser(
    request: FastifyRequest<{ Body: LoginReqBody }>,
    reply: FastifyReply<{ Reply: LoginResBody }>
  ) {
    const { accessToken } = await this.authService.loginUser(
      reply,
      request.body
    );

    reply.send({ accessToken });
  }

  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    const { accessToken } = await this.authService.refreshToken(request, reply);

    reply.send({ accessToken });
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    await this.authService.logout(request, reply);
    reply.status(204).send({
      message: 'Successfully logged out',
    });
  }
}
