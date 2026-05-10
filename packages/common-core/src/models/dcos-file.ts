import type { EraIdentity } from './';

export interface DcosFile {
  id: string;
  oasisBioId: string;
  title: string;
  slug: string;
  content: string;
  folderPath: string;
  status: string;
  version: number;
  eraId: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  era?: EraIdentity | null;
}
