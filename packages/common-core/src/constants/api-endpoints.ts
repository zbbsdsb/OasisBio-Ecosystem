export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    SUPABASE_WEBHOOK: '/api/auth/supabase-webhook'
  },
  PROFILE: {
    BASE: '/api/profile'
  },
  OASISBIOS: {
    BASE: '/api/oasisbios',
    PUBLIC: '/api/oasisbios/public',
    BY_ID: (id: string) => `/api/oasisbios/${id}`,
    PUBLISH: (id: string) => `/api/oasisbios/${id}/publish`,
    ABILITIES: (id: string) => `/api/oasisbios/${id}/abilities`,
    DCOS: (id: string) => `/api/oasisbios/${id}/dcos`,
    REFERENCES: (id: string) => `/api/oasisbios/${id}/references`,
    ERAS: (id: string) => `/api/oasisbios/${id}/eras`,
    WORLDS: (id: string) => `/api/oasisbios/${id}/worlds`,
    NUWA_RUNS: (id: string) => `/api/oasisbios/${id}/nuwa/runs`
  },
  ABILITIES: {
    BY_ID: (id: string) => `/api/abilities/${id}`
  },
  DCOS: {
    BY_ID: (id: string) => `/api/dcos/${id}`
  },
  REFERENCES: {
    BY_ID: (id: string) => `/api/references/${id}`
  },
  ERAS: {
    BY_ID: (id: string) => `/api/eras/${id}`
  },
  WORLDS: {
    BASE: '/api/worlds',
    BY_ID: (id: string) => `/api/worlds/${id}`,
    DOCUMENTS: (id: string) => `/api/worlds/${id}/documents`
  },
  WORLD_DOCUMENTS: {
    BY_ID: (id: string) => `/api/worlddocuments/${id}`
  },
  MODELS: {
    BASE: '/api/models',
    BY_ID: (id: string) => `/api/models/${id}`
  },
  DASHBOARD: {
    BASE: '/api/dashboard'
  },
  SETTINGS: {
    BASE: '/api/settings'
  },
  EXPORT: {
    BASE: '/api/export'
  },
  IMPORT: {
    BASE: '/api/import'
  },
  OAUTH: {
    AUTHORIZE: '/api/oauth/authorize',
    TOKEN: '/api/oauth/token',
    REVOKE: '/api/oauth/revoke',
    USERINFO: '/api/oauth/userinfo',
    WELL_KNOWN: {
      OPENID_CONFIG: '/api/oauth/.well-known/openid-configuration',
      JWKS: '/api/oauth/.well-known/jwks.json'
    },
    RESOURCES: {
      OASISBIOS: '/api/oauth/resources/oasisbios',
      OASISBIOS_BY_ID: (id: string) => `/api/oauth/resources/oasisbios/${id}`,
      DCOS: (id: string) => `/api/oauth/resources/oasisbios/${id}/dcos`
    }
  },
  DEVELOPER: {
    APPS: '/api/developer/apps',
    APP_BY_ID: (id: string) => `/api/developer/apps/${id}`,
    APP_SECRET: (id: string) => `/api/developer/apps/${id}/secret`
  },
  ASSET_TOKEN: {
    BASE: '/api/asset-token'
  },
  CSRF_TOKEN: {
    BASE: '/api/csrf-token'
  }
} as const;
