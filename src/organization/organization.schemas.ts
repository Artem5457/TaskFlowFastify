import { InvitationStatus, Role } from '../shared/interfaces';

export const orgParamsSchema = {
  type: 'object',
  required: ['orgId'],
  properties: {
    orgId: { type: 'string', format: 'uuid' },
  },
};

export const orgBodySchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 1 },
  },
};

export const inviteUserBodySchema = {
  type: 'object',
  required: ['email', 'role'],
  properties: {
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: [Role.MEMBER, Role.ADMIN] },
  },
};

export const acceptInvitationBodySchema = {
  type: 'object',
  required: ['token', 'role'],
  properties: {
    token: {
      type: 'string',
      minLength: 128,
      maxLength: 128,
      pattern: '^[0-9a-f]+$',
    },
    role: { type: 'string', enum: [Role.MEMBER, Role.ADMIN] },
  },
};

export const organizationResponseSchema = {
  type: 'object',
  required: ['id', 'name', 'ownerId'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    ownerId: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const organizationsResponseSchema = {
  type: 'array',
  items: organizationResponseSchema,
};

const userInvitationSchema = {
  type: 'object',
  required: [
    'id',
    'email',
    'organizationId',
    'token',
    'status',
    'invitedMemberRole',
    'expiresAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    organizationId: { type: 'string', format: 'uuid' },
    token: { type: 'string' },
    status: {
      type: 'string',
      enum: [
        InvitationStatus.PENDING,
        InvitationStatus.ACCEPTED,
        InvitationStatus.EXPIRED,
      ],
    },
    invitedMemberRole: { type: 'string', enum: [Role.MEMBER, Role.ADMIN] },
    expiresAt: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const inviteUserResponseSchema = {
  type: 'object',
  required: ['invitation', 'token'],
  properties: {
    invitation: userInvitationSchema,
    token: { type: 'string' },
  },
};
