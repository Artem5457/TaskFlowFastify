import { FastifyReply, FastifyRequest } from 'fastify';
import { OrganizationService } from './organization.service';
import { InvitedMemberRole } from './organization.interfaces';

export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  async createOrganization(
    request: FastifyRequest<{ Body: { name: string } }>,
    reply: FastifyReply
  ) {
    const { name } = request.body;
    const userId = request.user.id;

    const organization = await this.organizationService.createOrg(userId, name);

    reply.status(201).send(organization);
  }

  async getOrganizations(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const userId = request.user.id;
    const organizations = await this.organizationService.getUserOrgs(userId);

    reply.status(200).send(organizations);
  }

  async getOrganization(
    request: FastifyRequest<{ Params: { orgId: string } }>,
    reply: FastifyReply
  ) {
    const { orgId } = request.params;
    const userId = request.user.id;

    const organization = await this.organizationService.getOrganizationById(
      orgId,
      userId
    );

    reply.status(200).send(organization);
  }

  async updateOrganization(
    request: FastifyRequest<{
      Params: { orgId: string };
      Body: { name: string };
    }>,
    reply: FastifyReply
  ) {
    const { orgId } = request.params;
    const { name } = request.body;
    const userId = request.user.id;

    await this.organizationService.updateOrg(orgId, userId, { name });

    reply.status(204);
  }

  async deleteOrganization(
    request: FastifyRequest<{ Params: { orgId: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const { orgId } = request.params;
    const userId = request.user.id;

    await this.organizationService.deleteOrg(orgId, userId);
    reply.status(204);
  }

  async inviteUser(
    request: FastifyRequest<{
      Params: { orgId: string };
      Body: { email: string; role: InvitedMemberRole };
    }>,
    reply: FastifyReply
  ): Promise<void> {
    const { orgId } = request.params;
    const { email, role } = request.body;
    const inviterUserId = request.user.id;

    const { invitation, token } = await this.organizationService.inviteUser(
      orgId,
      inviterUserId,
      email!,
      role
    );

    reply.status(201).send({ invitation, token }); // Do not return 'token' on production
  }

  async acceptInvitation(
    request: FastifyRequest<{
      Params: { orgId: string };
      Body: { token: string; role: InvitedMemberRole };
    }>,
    reply: FastifyReply
  ): Promise<void> {
    const { orgId } = request.params;
    const { token, role } = request.body;
    const userId = request.user.id;

    await this.organizationService.acceptInvitation(
      orgId,
      userId,
      token!,
      role!
    );

    reply.status(204);
  }
}
