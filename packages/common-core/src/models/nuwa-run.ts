import type { OasisBio, NuwaSuggestion } from './';

export interface NuwaRun {
  id: string;
  oasisBioId: string;
  userId: string;
  status: string;
  mode: string;
  sourcePolicy: string;
  scopes: string[];
  snapshotHash: string | null;
  promptVersion: string | null;
  provider: string | null;
  model: string | null;
  summary: any;
  distilled: any;
  error: any;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  oasisBio?: OasisBio;
  suggestions?: NuwaSuggestion[];
}
