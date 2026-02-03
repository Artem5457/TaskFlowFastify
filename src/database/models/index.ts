import { Sequelize } from 'sequelize';
import { initUserModel } from './user.model';
import { initOrganizationModel } from './organization.model';
import { initOrganizationMemberModel } from './organization-member.model';
import { initTeamModel } from './team.model';
import { initTeamMembershipModel } from './team-membership.model';
import { initTaskModel } from './task.model';
import { initInvitationModel } from './invitation.model';
import { initRefreshTokenModel } from './refresh-token.model';
import { initCommentModel } from './comment.model';

export function initModels(sequelize: Sequelize) {
  const User = initUserModel(sequelize);
  const Organization = initOrganizationModel(sequelize);
  const OrganizationMember = initOrganizationMemberModel(sequelize);
  const Team = initTeamModel(sequelize);
  const TeamMembership = initTeamMembershipModel(sequelize);
  const Task = initTaskModel(sequelize);
  const Comment = initCommentModel(sequelize);
  const Invitation = initInvitationModel(sequelize);
  const RefreshToken = initRefreshTokenModel(sequelize);

  /* ===== Associations ===== */

  // USER ↔ ORGANIZATION
  User.hasMany(Organization, {
    foreignKey: 'ownerId',
    as: 'ownedOrganizations',
  });
  Organization.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

  User.hasMany(OrganizationMember, { foreignKey: 'userId' });
  OrganizationMember.belongsTo(User, { foreignKey: 'userId' });

  Organization.hasMany(OrganizationMember, { foreignKey: 'organizationId' });
  OrganizationMember.belongsTo(Organization, {
    foreignKey: 'organizationId',
  });

  // INVITATIONS
  Organization.hasMany(Invitation, { foreignKey: 'organizationId' });
  Invitation.belongsTo(Organization, { foreignKey: 'organizationId' });

  // TEAM ↔ ORGANIZATION
  Organization.hasMany(Team, { foreignKey: 'organizationId' });
  Team.belongsTo(Organization, { foreignKey: 'organizationId' });

  // TEAM → MEMBERSHIPS
  Team.hasMany(TeamMembership, {
    as: 'members',
    foreignKey: 'teamId',
    onDelete: 'CASCADE',
  });

  TeamMembership.belongsTo(Team, {
    foreignKey: 'teamId',
  });

  // USER → TEAM MEMBERSHIPS
  User.hasMany(TeamMembership, {
    as: 'teamMemberships',
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  });

  TeamMembership.belongsTo(User, {
    foreignKey: 'userId',
  });

  // TASK ↔ TEAM
  Team.hasMany(Task, { foreignKey: 'teamId', as: 'tasks' });
  Task.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });

  // TASK ↔ USER
  User.hasMany(Task, { foreignKey: 'creatorId', as: 'createdTasks' });
  Task.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

  User.hasMany(Task, { foreignKey: 'assignedToId', as: 'assignedTasks' });
  Task.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignee' });

  // COMMENTS
  Task.hasMany(Comment, { foreignKey: 'taskId', as: 'comments' });
  Comment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

  User.hasMany(Comment, { foreignKey: 'authorId', as: 'authoredComments' });
  Comment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

  // REFRESH TOKEN
  User.hasMany(RefreshToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
  RefreshToken.belongsTo(User, { foreignKey: 'userId' });

  return {
    User,
    Organization,
    OrganizationMember,
    Team,
    TeamMembership,
    Task,
    Comment,
    Invitation,
    RefreshToken,
  };
}
