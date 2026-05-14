import { calculateCompletionScore } from './completion-score';

describe('completion-score utils', () => {
  describe('calculateCompletionScore', () => {
    it('should return 0 for empty object', () => {
      const result = calculateCompletionScore({});
      expect(result.score).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should return 100 when all fields are filled', () => {
      const testObject = {
        name: 'Test Name',
        description: 'Test description',
        summary: 'Test summary',
      };
      const result = calculateCompletionScore(testObject);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should handle null and undefined values correctly', () => {
      const testObject = {
        field1: null,
        field2: undefined,
        field3: '',
      };
      const result = calculateCompletionScore(testObject);
      expect(result.completed).toBe(0);
    });

    it('should count non-empty strings as completed', () => {
      const testObject = {
        name: 'Test Name',
      };
      const result = calculateCompletionScore(testObject);
      expect(result.completed).toBe(1);
    });
  });
});
