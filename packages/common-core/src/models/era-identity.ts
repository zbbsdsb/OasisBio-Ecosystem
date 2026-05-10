import type { Ability, DcosFile, ReferenceItem } from './';

export interface EraIdentity {
  id: string;
  oasisBioId: string;
  name: string;
  eraType: string;
  startYear: number | null;
  endYear: number | null;
  description: string | null;
  sortOrder: number;
  
  abilities?: Ability[];
  dcosFiles?: DcosFile[];
  references?: ReferenceItem[];
}
