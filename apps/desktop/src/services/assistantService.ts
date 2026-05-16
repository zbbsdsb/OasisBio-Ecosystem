import { apiClient } from './api';
import type {
  AgentType,
  ChatRequest,
  ChatResponse,
  ProfileConfig,
  DeoProfile,
  DiaProfile,
  AssistantSession,
  AssistantPermission,
  PermissionLevel,
  AssistantPermissions
} from '../types/assistant';
import { DEO_DEFAULT_PROMPT, DIA_DEFAULT_PROMPT, DEFAULT_PERMISSIONS } from '../types/assistant';
import { OasisBioError, ERROR_CODES, isOasisBioError } from '../utils/errors';

const ASSISTANT_API_BASE = '/api/assistants';

export interface AssistantProfiles {
  deo: ProfileConfig;
  dia: ProfileConfig;
}

function handleApiError(error: unknown, operation: string): never {
  if (isOasisBioError(error)) {
    throw error;
  }
  if (error instanceof Error) {
    throw new OasisBioError(`${operation}: ${error.message}`, {
      code: ERROR_CODES.INTERNAL_ERROR,
      details: error
    });
  }
  throw new OasisBioError(`${operation} failed`, {
    code: ERROR_CODES.INTERNAL_ERROR,
    details: error
  });
}

class AssistantService {
  async getProfiles(): Promise<AssistantProfiles> {
    try {
      const [deoResponse, diaResponse] = await Promise.all([
        apiClient.request<DeoProfile>('GET', `${ASSISTANT_API_BASE}/profiles/deo`),
        apiClient.request<DiaProfile>('GET', `${ASSISTANT_API_BASE}/profiles/dia`)
      ]);

      return {
        deo: {
          systemPrompt: deoResponse.data?.systemPrompt || DEO_DEFAULT_PROMPT,
          apiEndpoint: deoResponse.data?.apiEndpoint || null,
          apiKey: deoResponse.data?.apiKey || null,
          model: deoResponse.data?.model || 'gpt-4o',
          enabled: deoResponse.data?.enabled ?? true,
          configured: !!(deoResponse.data?.apiEndpoint && deoResponse.data?.apiKey)
        },
        dia: {
          systemPrompt: diaResponse.data?.systemPrompt || DIA_DEFAULT_PROMPT,
          apiEndpoint: diaResponse.data?.apiEndpoint || null,
          apiKey: diaResponse.data?.apiKey || null,
          model: diaResponse.data?.model || 'gpt-4o',
          enabled: diaResponse.data?.enabled ?? true,
          configured: !!(diaResponse.data?.apiEndpoint && diaResponse.data?.apiKey)
        }
      };
    } catch (error) {
      if (isOasisBioError(error) && error.code === ERROR_CODES.UNAUTHORIZED) {
        throw error;
      }
      return {
        deo: {
          systemPrompt: DEO_DEFAULT_PROMPT,
          apiEndpoint: null,
          apiKey: null,
          model: 'gpt-4o',
          enabled: true,
          configured: false
        },
        dia: {
          systemPrompt: DIA_DEFAULT_PROMPT,
          apiEndpoint: null,
          apiKey: null,
          model: 'gpt-4o',
          enabled: true,
          configured: false
        }
      };
    }
  }

  async updateProfile(agent: AgentType, data: Partial<ProfileConfig>): Promise<void> {
    try {
      await apiClient.request(`${ASSISTANT_API_BASE}/profiles/${agent}`, 'PUT', data);
    } catch (error) {
      handleApiError(error, 'Failed to update profile');
    }
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await apiClient.request<ChatResponse>('POST', `${ASSISTANT_API_BASE}/chat`, request);
      if (!response.data) {
        throw new OasisBioError('No response received from assistant', {
          code: ERROR_CODES.INTERNAL_ERROR
        });
      }
      return response.data;
    } catch (error) {
      if (isOasisBioError(error)) {
        throw error;
      }
      handleApiError(error, 'Failed to send message');
    }
  }

  async getSessions(): Promise<AssistantSession[]> {
    try {
      const response = await apiClient.request<AssistantSession[]>('GET', `${ASSISTANT_API_BASE}/sessions`);
      return response.data || [];
    } catch (error) {
      if (isOasisBioError(error) && error.code === ERROR_CODES.UNAUTHORIZED) {
        throw error;
      }
      return [];
    }
  }

  async getSession(sessionId: string): Promise<AssistantSession | null> {
    try {
      const response = await apiClient.request<AssistantSession>('GET', `${ASSISTANT_API_BASE}/sessions/${sessionId}`);
      return response.data || null;
    } catch (error) {
      if (isOasisBioError(error) && error.code === ERROR_CODES.NOT_FOUND) {
        return null;
      }
      if (isOasisBioError(error) && error.code === ERROR_CODES.UNAUTHORIZED) {
        throw error;
      }
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      await apiClient.request('DELETE', `${ASSISTANT_API_BASE}/sessions/${sessionId}`);
    } catch (error) {
      handleApiError(error, 'Failed to delete session');
    }
  }

  async getMessages(sessionId: string): Promise<{ id: string; role: 'user' | AgentType; content: string; createdAt: Date }[]> {
    try {
      const response = await apiClient.request<{ id: string; role: 'user' | AgentType; content: string; createdAt: string }[]>(
        'GET',
        `${ASSISTANT_API_BASE}/messages?sessionId=${sessionId}`
      );
      return (response.data || []).map(msg => ({
        ...msg,
        createdAt: new Date(msg.createdAt)
      }));
    } catch (error) {
      if (isOasisBioError(error) && error.code === ERROR_CODES.UNAUTHORIZED) {
        throw error;
      }
      return [];
    }
  }

  async getPermissions(): Promise<{ level: PermissionLevel; permissions: AssistantPermissions }> {
    try {
      const response = await apiClient.request<AssistantPermission>('GET', `${ASSISTANT_API_BASE}/permissions`);
      return {
        level: response.data?.level || 'read',
        permissions: response.data?.permissions || DEFAULT_PERMISSIONS
      };
    } catch (error) {
      if (isOasisBioError(error) && error.code === ERROR_CODES.UNAUTHORIZED) {
        throw error;
      }
      return {
        level: 'read',
        permissions: DEFAULT_PERMISSIONS
      };
    }
  }

  async updatePermissions(level: PermissionLevel, permissions: Partial<AssistantPermissions>): Promise<void> {
    try {
      await apiClient.request('PUT', `${ASSISTANT_API_BASE}/permissions`, { level, permissions });
    } catch (error) {
      handleApiError(error, 'Failed to update permissions');
    }
  }

  async createNewSession(agent: AgentType): Promise<string> {
    try {
      const response = await apiClient.request<{ sessionId: string }>('POST', `${ASSISTANT_API_BASE}/sessions`, { agent });
      if (!response.data?.sessionId) {
        throw new OasisBioError('Failed to create session: No session ID returned', {
          code: ERROR_CODES.INTERNAL_ERROR
        });
      }
      return response.data.sessionId;
    } catch (error) {
      if (isOasisBioError(error)) {
        throw error;
      }
      handleApiError(error, 'Failed to create new session');
    }
  }
}

export const assistantService = new AssistantService();
export default assistantService;
