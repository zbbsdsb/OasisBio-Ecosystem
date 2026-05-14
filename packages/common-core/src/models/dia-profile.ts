import type { User } from './';

export interface DiaProfile {
  id: string;
  userId: string;
  systemPrompt: string;
  apiEndpoint: string | null;
  apiKey: string | null;
  model: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  user?: User;
}
