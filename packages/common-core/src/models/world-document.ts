import type { WorldItem } from './';

export interface WorldDocument {
  id: string;
  worldId: string;
  title: string;
  docType: string;
  slug: string;
  content: string;
  folderPath: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  
  world?: WorldItem;
}
