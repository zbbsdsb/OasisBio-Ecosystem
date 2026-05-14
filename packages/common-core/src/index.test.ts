import * as CommonCore from './index';

describe('common-core package exports', () => {
  it('should export enums', () => {
    expect(CommonCore.Status).toBeDefined();
    expect(CommonCore.Visibility).toBeDefined();
  });

  it('should export constants', () => {
    expect(CommonCore.ApiEndpoints).toBeDefined();
  });

  it('should export utilities', () => {
    expect(CommonCore.calculateCompletionScore).toBeDefined();
  });

  it('should export all enums', () => {
    const expectedEnums = [
      'Status',
      'Visibility',
      'AbilitySourceType',
      'EraType',
      'IdentityMode',
      'NuwaMode',
      'NuwaStatus',
      'ReferenceSourceType',
    ];
    expectedEnums.forEach((enumName) => {
      expect(CommonCore).toHaveProperty(enumName);
    });
  });
});
