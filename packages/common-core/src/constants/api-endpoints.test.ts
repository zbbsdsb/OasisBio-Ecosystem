import { ApiEndpoints } from './api-endpoints';

describe('ApiEndpoints constants', () => {
  describe('AUTH endpoints', () => {
    it('should have LOGIN endpoint', () => {
      expect(ApiEndpoints.AUTH.LOGIN).toBe('/api/auth/login');
    });

    it('should have VERIFY endpoint', () => {
      expect(ApiEndpoints.AUTH.VERIFY).toBe('/api/auth/verify');
    });
  });

  describe('IDENTITY endpoints', () => {
    it('should have LIST endpoint', () => {
      expect(ApiEndpoints.IDENTITY.LIST).toBe('/api/identities');
    });

    it('should have CREATE endpoint', () => {
      expect(ApiEndpoints.IDENTITY.CREATE).toBe('/api/identities');
    });
  });

  describe('ASSISTANT endpoints', () => {
    it('should have SESSIONS endpoint', () => {
      expect(ApiEndpoints.ASSISTANTS.SESSIONS).toBe('/api/assistants/sessions');
    });

    it('should have CHAT endpoint', () => {
      expect(ApiEndpoints.ASSISTANTS.CHAT).toBe('/api/assistants/chat');
    });
  });
});
