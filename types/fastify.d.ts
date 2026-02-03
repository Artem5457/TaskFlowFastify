import 'fastify';
import { IConfig } from '../src/env-config/config.interface';
import { Sequelize } from 'sequelize';
import User from '../src/database/models/user.model';

declare module 'fastify' {
  interface FastifyInstance {
    config: IConfig;
    sequelize: Sequelize;
    models: {
      User: typeof User;
      Organization: typeof Organization;
      OrganizationMember: typeof OrganizationMember;
      Team: typeof Team;
      TeamMembership: typeof TeamMembership;
      Task: typeof Task;
      Comment: typeof Comment;
      Invitation: typeof Invitation;
      RefreshToken: typeof RefreshToken;
    };
  }
}
