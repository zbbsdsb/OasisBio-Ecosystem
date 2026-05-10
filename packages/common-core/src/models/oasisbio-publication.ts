import type { OasisBio } from './';

export interface OasisBioPublication {
  id: string;
  oasisBioId: string;
  publicSlug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  socialImageUrl: string | null;
  customDomain: string | null;
  isSearchable: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
  
  oasisBio?: OasisBio;
}
