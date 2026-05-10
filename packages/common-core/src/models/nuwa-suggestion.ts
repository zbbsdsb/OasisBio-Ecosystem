import type { NuwaRun } from './';

export interface NuwaSuggestion {
  id: string;
  runId: string;
  scope: string;
  operation: string;
  targetId: string | null;
  title: string | null;
  payload: any;
  rationale: string | null;
  confidence: number | null;
  evidence: any;
  baseFingerprint: string | null;
  decision: string;
  createdEntityId: string | null;
  appliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  run?: NuwaRun;
}
