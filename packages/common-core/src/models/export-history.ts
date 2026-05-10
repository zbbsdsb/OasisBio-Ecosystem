import type { User } from './';

export interface ExportHistory {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  characterCount: number;
  createdAt: Date;
  
  user?: User;
}
