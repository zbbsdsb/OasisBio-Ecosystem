import type { User } from './';

export interface AssistantPermission {
  id: string;
  userId: string;
  level: string;
  permissions: any;
  createdAt: Date;
  updatedAt: Date;
  
  user?: User;
}
