import type { WorldDocument, Ability, ReferenceItem } from './';

export interface WorldItem {
  id: string;
  oasisBioId: string;
  name: string;
  summary: string;
  timeSetting: string | null;
  geography: string | null;
  physicsRules: string | null;
  socialStructure: string | null;
  aestheticKeywords: string | null;
  majorConflict: string | null;
  visibility: string;
  timeline: string | null;
  rules: string | null;
  factions: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  documents?: WorldDocument[];
  abilities?: Ability[];
  references?: ReferenceItem[];
}
