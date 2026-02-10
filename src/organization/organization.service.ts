import crypto from 'crypto';
import { Op } from 'sequelize';
import { FastifyInstance } from 'fastify';
import { InvitationStatus, Role } from '../shared/interfaces';
import {
  InvitationToken,
  InvitedMemberRole,
  UserInvitation,
} from './organization.interfaces';
import Organization from '../database/models/organization.model';
import OrganizationMember from '../database/models/organization-member.model';
import { calcExpirationDate } from '../shared/helpers';
import User from '../database/models/user.model';
import Invitation from '../database/models/invitation.model';
import { TokenService } from '../shared/services/token.service';

export class OrganizationService {
  constructor(
    private fastify: FastifyInstance,
    private tokenService: TokenService
  ) {}

  async createOrg(userId: string, name: string): Promise<Organization> {
    return this.fastify.sequelize.transaction(async (t) => {
      const organization = await this.fastify.models.Organization.create(
        { name, ownerId: userId },
        { transaction: t }
      );

      await this.fastify.models.OrganizationMember.create(
        {
          userId,
          organizationId: organization.id,
          role: Role.OWNER,
        },
        { transaction: t }
      );

      this.fastify.log.info(`Organization '${name}' was created`);

      return organization;
    });
  }

  async getUserOrgs(userId: string): Promise<Organization[]> {
    return this.fastify.models.Organization.findAll({
      include: [
        {
          model: OrganizationMember,
          where: { userId },
        },
      ],
    });
  }

  async getOrganizationById(
    orgId: string,
    userId: string
  ): Promise<Organization | null> {
    const member = await this.fastify.models.OrganizationMember.findOne({
      where: { organizationId: orgId, userId },
    });

    if (!member) {
      throw this.fastify.httpErrors.forbidden('Access denied');
    }

    this.fastify.log.info('Organization access granted');

    return this.fastify.models.Organization.findByPk(orgId);
  }

  async updateOrg(
    orgId: string,
    userId: string,
    data: { name: string }
  ): Promise<void> {
    const member = await this.fastify.models.OrganizationMember.findOne({
      where: { organizationId: orgId, userId },
    });
    const hasPermission =
      !member || ![Role.OWNER, Role.ADMIN].includes(member.role);

    if (hasPermission) {
      throw this.fastify.httpErrors.forbidden(
        'Only owner or admin can update organization'
      );
    }

    await this.fastify.models.Organization.update(data, {
      where: { id: orgId },
    });

    this.fastify.log.info('Organization is updated');
  }

  async deleteOrg(orgId: string, userId: string): Promise<void> {
    const member = await this.fastify.models.OrganizationMember.findOne({
      where: { organizationId: orgId, userId, role: Role.OWNER },
    });

    if (!member) {
      throw this.fastify.httpErrors.forbidden(
        'Only owner can delete organization'
      );
    }

    await this.fastify.models.Organization.destroy({ where: { id: orgId } });

    this.fastify.log.info('Organization deleted');
  }

  async inviteUser(
    organizationId: string,
    inviterUserId: string,
    email: string,
    role: InvitedMemberRole
  ): Promise<UserInvitation> {
    this.fastify.log.info(
      {
        inviterUserId,
        orgId: organizationId,
        invitedUserEmail: email,
        invitedUserRole: role,
      },
      'Inviting user to organization'
    );

    await this.checkInviterPermissions(organizationId, inviterUserId);

    const [existingUser, existingInvitation] = await Promise.all([
      this.fastify.models.User.findOne({ where: { email } }),
      this.fastify.models.Invitation.findOne({
        where: {
          organizationId,
          email,
          status: InvitationStatus.PENDING,
        },
      }),
    ]);

    if (existingUser) {
      await this.checkExistingMember(organizationId, existingUser);
    }

    if (existingInvitation) {
      throw this.fastify.httpErrors.conflict('Invitation already sent');
    }

    const { token, tokenHash } = this.generateInvitationToken();

    const { invitationTokenDaysValid } = this.fastify.config;
    const INVITATION_PERIOD_IN_MS =
      invitationTokenDaysValid * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(calcExpirationDate(INVITATION_PERIOD_IN_MS));

    const invitation = await this.fastify.models.Invitation.create({
      organizationId,
      email,
      token: tokenHash,
      status: InvitationStatus.PENDING,
      invitedMemberRole: role,
      expiresAt,
    });

    this.fastify.log.info('Invitation created');

    return { invitation, token };
  }

  async acceptInvitation(
    organizationId: string,
    userId: string,
    token: string,
    role: InvitedMemberRole
  ): Promise<void> {
    this.fastify.log.info('Accepting invitation');

    await this.fastify.models.Invitation.update(
      { status: InvitationStatus.EXPIRED },
      {
        where: {
          organizationId,
          status: InvitationStatus.PENDING,
          expiresAt: { [Op.lte]: new Date() },
        },
      }
    );

    const invitation = await this.getPendingInvitation(organizationId);

    this.validateInvitationToken(token, invitation);

    const user = await this.getUserOrFail(userId);

    if (user.email !== invitation.email) {
      throw this.fastify.httpErrors.forbidden('Invitation email mismatch');
    }

    await this.ensureNotOrganizationMember(organizationId, userId);
    await this.addMemberAndAcceptInvitation(
      organizationId,
      userId,
      invitation,
      role
    );

    this.fastify.log.info('Invitation accepted');
  }

  private async checkInviterPermissions(
    organizationId: string,
    inviterUserId: string
  ): Promise<void> {
    const member = await this.fastify.models.OrganizationMember.findOne({
      where: { organizationId, userId: inviterUserId },
    });

    if (!member) {
      throw this.fastify.httpErrors.forbidden('Only members can invite users');
    }
    if (member.role === Role.MEMBER) {
      throw this.fastify.httpErrors.forbidden(
        'Insufficient permissions to invite users'
      );
    }
  }

  private async checkExistingMember(organizationId: string, invitedUser: User) {
    const membership = await this.fastify.models.OrganizationMember.findOne({
      where: {
        organizationId,
        userId: invitedUser.id,
      },
    });

    if (membership) {
      throw this.fastify.httpErrors.conflict(
        'User is already a member of this organization'
      );
    }
  }

  private generateInvitationToken(): InvitationToken {
    const token = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.tokenService.hashToken(token);

    return { token, tokenHash };
  }

  private async getPendingInvitation(
    organizationId: string
  ): Promise<Invitation> {
    const invitation = await this.fastify.models.Invitation.findOne({
      where: {
        organizationId,
        status: InvitationStatus.PENDING,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!invitation) {
      throw this.fastify.httpErrors.notFound(
        'Active invitation not found or invitation has expired'
      );
    }

    return invitation;
  }

  private validateInvitationToken(
    rawToken: string,
    invitation: Invitation
  ): void {
    const tokenValid = this.tokenService.verifyToken(
      rawToken,
      invitation.token
    );

    if (!tokenValid) {
      throw this.fastify.httpErrors.unauthorized('Invalid invitation token');
    }
  }

  private async getUserOrFail(userId: string): Promise<User> {
    const user = await this.fastify.models.User.findByPk(userId);

    if (!user) {
      throw this.fastify.httpErrors.unauthorized('User not found');
    }

    return user;
  }

  private async ensureNotOrganizationMember(
    organizationId: string,
    userId: string
  ): Promise<void> {
    const member = await this.fastify.models.OrganizationMember.findOne({
      where: { organizationId, userId },
    });

    if (member) {
      throw this.fastify.httpErrors.conflict(
        'User already member of organization'
      );
    }
  }

  private async addMemberAndAcceptInvitation(
    organizationId: string,
    userId: string,
    invitation: Invitation,
    role: InvitedMemberRole
  ): Promise<void> {
    await this.fastify.sequelize.transaction(async (t) => {
      await this.fastify.models.OrganizationMember.create(
        {
          organizationId,
          userId,
          role,
        },
        { transaction: t }
      );

      await invitation.update(
        { status: InvitationStatus.ACCEPTED },
        { transaction: t }
      );
    });
  }
}
