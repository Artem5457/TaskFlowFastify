import Invitation from '../database/models/invitation.model';
import { Role } from '../shared/interfaces';

export interface UserInvitation {
  invitation: Invitation;
  token: string;
}

export interface InvitationToken {
  token: string;
  tokenHash: string;
}

export type InvitedMemberRole = Role.MEMBER | Role.ADMIN;
