import type { AssistantSession } from './';

export interface AssistantMessage {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  metadata: any;
  createdAt: Date;
  
  session?: AssistantSession;
}
