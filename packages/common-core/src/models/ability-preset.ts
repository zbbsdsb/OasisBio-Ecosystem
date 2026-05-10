import type { AbilityCategory } from './';

export interface AbilityPreset {
  id: string;
  categoryId: string | null;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  
  category?: AbilityCategory | null;
}
