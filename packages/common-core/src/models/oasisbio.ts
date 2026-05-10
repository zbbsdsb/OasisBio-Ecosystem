import type { Ability, EraIdentity, DcosFile, ReferenceItem, WorldItem, ModelItem, OasisBioPublication, CharacterRelationship, NuwaRun } from './';

export interface OasisBio {
  id: string;
  userId: string;
  title: string;
  slug: string;
  tagline: string | null;
  summary: string | null;
  identityMode: string;
  birthDate: Date | null;
  gender: string | null;
  pronouns: string | null;
  placeOfOrigin: string | null;
  currentEra: string | null;
  species: string | null;
  status: string;
  description: string | null;
  coverImageUrl: string | null;
  defaultLanguage: string;
  visibility: string;
  featured: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  abilities?: Ability[];
  eras?: EraIdentity[];
  dcosFiles?: DcosFile[];
  references?: ReferenceItem[];
  worlds?: WorldItem[];
  models?: ModelItem[];
  publication?: OasisBioPublication | null;
  relationshipsA?: CharacterRelationship[];
  relationshipsB?: CharacterRelationship[];
  nuwaRuns?: NuwaRun[];
}
