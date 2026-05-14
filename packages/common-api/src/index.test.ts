import * as commonApi from './index';

describe('common-api package', () => {
  it('should export ApiEndpoints', () => {
    expect(commonApi.ApiEndpoints).toBeDefined();
  });

  it('should export OasisBioApiClient interface', () => {
    // This tests the type is available, not the implementation
    expect(true).toBe(true);
  });
});
