import type { EntityTag } from './';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  
  entityTags?: EntityTag[];
}
