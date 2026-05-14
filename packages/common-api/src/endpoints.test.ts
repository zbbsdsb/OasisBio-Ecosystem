import { ApiEndpoints } from './endpoints';

describe('common-api ApiEndpoints', () => {
  it('should match the common-core ApiEndpoints structure', () => {
    expect(ApiEndpoints.AUTH.LOGIN).toBe('/api/auth/login');
    expect(ApiEndpoints.AUTH.VERIFY).toBe('/api/auth/verify');
  });

  it('should have world builder endpoints', () => {
    expect(ApiEndpoints.WORLDS.LIST).toBe('/api/worlds');
    expect(ApiEndpoints.WORLDS.CREATE).toBe('/api/worlds');
  });

  it('should have assistant endpoints', () => {
    expect(ApiEndpoints.ASSISTANTS.SESSIONS).toBe('/api/assistants/sessions');
    expect(ApiEndpoints.ASSISTANTS.CHAT).toBe('/api/assistants/chat');
  });
});
