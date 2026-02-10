import { FastifyInstance } from 'fastify';
import { loginSchema, registerSchema } from './auth.schemas';
import { AuthService } from './auth.service';
import {
  LoginReqBody,
  LoginResBody,
  RegisterReqBody,
  RegisterResBody,
} from './auth.interfaces';
import { AuthController } from './auth.controller';
import { TokenService } from '../shared/services/token.service';

export default function (fastify: FastifyInstance) {
  const tokenService = new TokenService(fastify);
  const authService = new AuthService(fastify, tokenService);
  const authController = new AuthController(authService);

  fastify.post<{ Body: RegisterReqBody; Reply: RegisterResBody }>(
    '/register',
    { schema: registerSchema },
    authController.registerUser.bind(authController)
  );
  fastify.post<{ Body: LoginReqBody; Reply: LoginResBody }>(
    '/login',
    { schema: loginSchema },
    authController.loginUser.bind(authController)
  );
  fastify.post(
    '/refresh-token',
    authController.refreshToken.bind(authController)
  );
  fastify.post('/logout', authController.logout.bind(authController));
}
