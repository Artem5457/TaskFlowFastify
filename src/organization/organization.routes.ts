import { FastifyInstance } from 'fastify';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { TokenService } from '../shared/services/token.service';
import {
  acceptInvitationBodySchema,
  inviteUserBodySchema,
  inviteUserResponseSchema,
  organizationResponseSchema,
  organizationsResponseSchema,
  orgBodySchema,
  orgParamsSchema,
} from './organization.schemas';

export default function (fastify: FastifyInstance) {
  const tokenService = new TokenService(fastify);
  const organizationService = new OrganizationService(fastify, tokenService);
  const organizationController = new OrganizationController(
    organizationService
  );

  // Create a new organization
  fastify.post(
    '/',
    {
      schema: {
        body: orgBodySchema,
        response: {
          201: organizationResponseSchema,
        },
      },
    },
    organizationController.createOrganization.bind(organizationController)
  );

  // Get a list of all organizations
  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: organizationsResponseSchema,
        },
      },
    },
    organizationController.getOrganizations.bind(organizationController)
  );

  // Get a specific organization by ID
  fastify.get(
    '/:orgId',
    {
      schema: {
        params: orgParamsSchema,
        response: {
          200: {
            anyOf: [organizationResponseSchema, { type: 'null' }],
          },
        },
      },
    },
    organizationController.getOrganization.bind(organizationController)
  );

  // Update an existing organization
  fastify.patch(
    '/:orgId',
    {
      schema: {
        params: orgParamsSchema,
        body: orgBodySchema,
        response: {
          204: { type: 'null' },
        },
      },
    },
    organizationController.updateOrganization.bind(organizationController)
  );

  // Delete an organization by ID
  fastify.delete(
    '/:orgId',
    {
      schema: {
        params: orgParamsSchema,
        response: {
          204: { type: 'null' },
        },
      },
    },
    organizationController.deleteOrganization.bind(organizationController)
  );

  // Invite a user to the organization
  fastify.post(
    '/:orgId/invite',
    {
      schema: {
        params: orgParamsSchema,
        body: inviteUserBodySchema,
        response: {
          201: inviteUserResponseSchema,
        },
      },
    },
    organizationController.inviteUser.bind(organizationController)
  );

  // Accept an invitation to join the organization
  fastify.post(
    '/:orgId/accept',
    {
      schema: {
        params: orgParamsSchema,
        body: acceptInvitationBodySchema,
        response: {
          204: { type: 'null' },
        },
      },
    },
    organizationController.acceptInvitation.bind(organizationController)
  );
}
