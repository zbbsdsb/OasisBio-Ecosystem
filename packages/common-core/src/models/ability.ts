import type { WorldItem, EraIdentity } from './';

export interface Ability {
  id: string;
  oasisBioId: string;
  name: string;
  category: string;
  sourceType: string;
  level: number;
  description: string | null;
  relatedWorldId: string | null;
  relatedEraId: string | null;
  
  relatedWorld?: WorldItem | null;
  relatedEra?: EraIdentity | null;
}
