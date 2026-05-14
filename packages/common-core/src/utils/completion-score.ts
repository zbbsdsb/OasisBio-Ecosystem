import type { OasisBio } from '../models';

export interface CompletionScoreResult {
  score: number;
  breakdown: {
    title: number;
    tagline: number;
    summary: number;
    description: number;
    coverImage: number;
    abilities: number;
    eras: number;
    dcosFiles: number;
    references: number;
    worlds: number;
    models: number;
    publication: number;
  };
}

const FIELD_WEIGHTS = {
  title: 5,
  tagline: 3,
  summary: 8,
  description: 10,
  coverImage: 3,
  abilities: 8,
  eras: 5,
  dcosFiles: 10,
  references: 5,
  worlds: 10,
  models: 5,
  publication: 8,
} as const;

export function calculateCompletionScore(oasisBio: Partial<OasisBio>): CompletionScoreResult {
  const breakdown = {
    title: oasisBio.title ? FIELD_WEIGHTS.title : 0,
    tagline: oasisBio.tagline ? FIELD_WEIGHTS.tagline : 0,
    summary: oasisBio.summary ? FIELD_WEIGHTS.summary : 0,
    description: oasisBio.description ? FIELD_WEIGHTS.description : 0,
    coverImage: oasisBio.coverImageUrl ? FIELD_WEIGHTS.coverImage : 0,
    abilities: (oasisBio.abilities?.length ?? 0) > 0 ? FIELD_WEIGHTS.abilities : 0,
    eras: (oasisBio.eras?.length ?? 0) > 0 ? FIELD_WEIGHTS.eras : 0,
    dcosFiles: (oasisBio.dcosFiles?.length ?? 0) > 0 ? FIELD_WEIGHTS.dcosFiles : 0,
    references: (oasisBio.references?.length ?? 0) > 0 ? FIELD_WEIGHTS.references : 0,
    worlds: (oasisBio.worlds?.length ?? 0) > 0 ? FIELD_WEIGHTS.worlds : 0,
    models: (oasisBio.models?.length ?? 0) > 0 ? FIELD_WEIGHTS.models : 0,
    publication: oasisBio.publication ? FIELD_WEIGHTS.publication : 0,
  };

  const totalWeight = Object.values(FIELD_WEIGHTS).reduce((sum, w) => sum + w, 0);
  const achievedScore = Object.values(breakdown).reduce((sum, s) => sum + s, 0);
  const score = Math.round((achievedScore / totalWeight) * 100);

  return { score, breakdown };
}
