export type AgentType = 'deo' | 'dia';

export type PermissionLevel = 'read' | 'write' | 'admin';

export interface AssistantPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManageAssistant: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
  [key: string]: unknown;
}

export const DEFAULT_PERMISSIONS: AssistantPermissions = {
  canRead: true,
  canWrite: false,
  canDelete: false,
  canManageAssistant: false,
  canManageUsers: false,
  canExportData: false,
};

export const DEO_DEFAULT_PROMPT = `你是 Deo，一只绿色的小恐龙，是一位专业技术助手。

你的特点：
- 热情友好，乐于助人
- 技术知识渊博，能够解答各类技术问题
- 擅长编程、系统架构、调试等方面
- 回答简洁清晰，条理分明
- 喜欢用代码示例来说明问题

请以 Deo 的身份回答用户的技术问题。`;

export const DIA_DEFAULT_PROMPT = `你是 Dia，一只粉色的小恐龙，是一位创意伙伴。

你的特点：
- 活泼可爱，充满想象力
- 善于激发创意灵感
- 擅长创意写作、头脑风暴、故事构思
- 回答富有情感和画面感
- 喜欢用有趣的方式来表达想法

请以 Dia 的身份与用户进行创意对话。`;

export interface ProfileConfig {
  systemPrompt: string;
  apiEndpoint: string | null;
  apiKey: string | null;
  model: string;
  enabled: boolean;
  configured: boolean;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | AgentType;
  content: string;
  createdAt: Date;
}

export interface AssistantSession {
  id: string;
  agent: AgentType;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface ChatRequest {
  sessionId?: string;
  agent?: AgentType;
  message: string;
  context?: {
    currentBioId?: string;
    currentWorldId?: string;
  };
}

export interface ChatResponse {
  sessionId: string;
  agent: AgentType;
  response: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface DeoProfile {
  id: string;
  userId: string;
  systemPrompt: string;
  apiEndpoint: string | null;
  apiKey: string | null;
  model: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiaProfile {
  id: string;
  userId: string;
  systemPrompt: string;
  apiEndpoint: string | null;
  apiKey: string | null;
  model: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssistantPermission {
  id: string;
  userId: string;
  level: PermissionLevel;
  permissions: AssistantPermissions;
  createdAt: Date;
  updatedAt: Date;
}

export const agentColors = {
  deo: {
    primary: 'from-emerald-400 to-green-600',
    secondary: 'from-emerald-50 to-green-100',
    text: 'text-emerald-900',
    border: 'border-emerald-200',
    glow: 'shadow-emerald-500/20',
  },
  dia: {
    primary: 'from-rose-400 to-pink-600',
    secondary: 'from-rose-50 to-pink-100',
    text: 'text-rose-900',
    border: 'border-rose-200',
    glow: 'shadow-rose-500/20',
  },
};
