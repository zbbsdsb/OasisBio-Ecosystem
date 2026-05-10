import type { AbilityPreset } from './';

export interface AbilityCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  createdAt: Date;
  
  presets?: AbilityPreset[];
}
