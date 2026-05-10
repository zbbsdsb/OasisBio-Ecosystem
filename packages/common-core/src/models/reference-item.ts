import type { EraIdentity, WorldItem } from './';

export interface ReferenceItem {
  id: string;
  oasisBioId: string;
  url: string;
  title: string;
  description: string | null;
  sourceType: string;
  provider: string | null;
  coverImage: string | null;
  metadata: string | null;
  eraId: string | null;
  worldId: string | null;
  tags: string;
  
  era?: EraIdentity | null;
  world?: WorldItem | null;
}
