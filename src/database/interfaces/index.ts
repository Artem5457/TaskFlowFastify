export type BaseCreationOmittedFields = 'id' | 'createdAt' | 'updatedAt';

export type OptionalTaskFields =
  | BaseCreationOmittedFields
  | 'status'
  | 'priority'
  | 'description'
  | 'dueDate'
  | 'assignedToId';

export interface IDbConfig {
  dbName: string;
  dbUsername: string;
  dbPassword: string;
  dbHost: string;
}
