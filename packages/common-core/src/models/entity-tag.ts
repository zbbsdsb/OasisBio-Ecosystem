import type { Tag } from './';

export interface EntityTag {
  id: string;
  tagId: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
  
  tag?: Tag;
}
