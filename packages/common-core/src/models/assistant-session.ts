import type { User, AssistantMessage } from './';

export interface AssistantSession {
  id: string;
  userId: string;
  agent: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  user?: User;
  messages?: AssistantMessage[];
}
