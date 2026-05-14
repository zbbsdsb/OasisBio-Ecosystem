import { useMemo } from 'react';
import type { WorldItem } from '@oasisbio/common-core';
import { calculateWorldCompletionScore as calculateScore } from '@oasisbio/common-core';

interface CompletionBreakdown {
  coreIdentity: number;
  timeStructure: number;
  spaceStructure: number;
  society: number;
  rules: number;
  content: number;
  documents: number;
  abilities: number;
  references: number;
}

interface CompletionScoreResult {
  score: number;
  breakdown: CompletionBreakdown;
}

export const useCompletionScore = (world: Partial<WorldItem> | null): CompletionScoreResult => {
  return useMemo(() => {
    if (!world) {
      return {
        score: 0,
        breakdown: {
          coreIdentity: 0,
          timeStructure: 0,
          spaceStructure: 0,
          society: 0,
          rules: 0,
          content: 0,
          documents: 0,
          abilities: 0,
          references: 0
        }
      };
    }

    const result = calculateScore(world);
    return result;
  }, [world]);
};

export const calculateWorldCompletionScore = (world: Partial<WorldItem>): CompletionScoreResult => {
  return calculateScore(world);
};
