import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { BaseCreationOmittedFields } from '../interfaces';

interface TeamAttributes {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type TeamCreationAttributes = Optional<
  TeamAttributes,
  BaseCreationOmittedFields | 'description'
>;

class Team
  extends Model<TeamAttributes, TeamCreationAttributes>
  implements TeamAttributes
{
  public id!: string;
  public organizationId!: string;
  public name!: string;
  public description?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initTeamModel(sequelize: Sequelize) {
  Team.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      organizationId: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
    },
    { sequelize, tableName: 'team', modelName: 'Team', timestamps: true }
  );

  return Team;
}

export default Team;
