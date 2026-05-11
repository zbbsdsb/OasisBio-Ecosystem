export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-z0-9_-]+$/i
  },
  OTP_CODE: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 6
  },
  DISPLAY_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  BIO: {
    MAX_LENGTH: 500
  },
  WEBSITE: {
    PATTERN: /^https?:\/\/.+/
  },
  OASISBIO_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200
  },
  SLUG: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200,
    PATTERN: /^[a-z0-9-_]+$/i
  },
  SUMMARY: {
    MAX_LENGTH: 2000
  },
  DESCRIPTION: {
    MAX_LENGTH: 10000
  },
  TAGLINE: {
    MAX_LENGTH: 200
  },
  ABILITY_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100
  },
  ABILITY_CATEGORY: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50
  },
  ABILITY_DESCRIPTION: {
    MAX_LENGTH: 2000
  },
  ABILITY_LEVEL: {
    MIN: 1,
    MAX: 5
  },
  WORLD_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200
  },
  WORLD_SUMMARY: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 2000
  },
  DCOS_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200
  },
  DCOS_CONTENT: {
    MAX_LENGTH: 100000
  },
  REFERENCE_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200
  },
  REFERENCE_URL: {
    PATTERN: /^https?:\/\/.+/
  },
  ERA_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200
  },
  ERA_YEAR: {
    MIN: -9999,
    MAX: 9999
  },
  WORLD_DOCUMENT_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200
  },
  WORLD_DOCUMENT_CONTENT: {
    MAX_LENGTH: 100000
  },
  FILE_SIZE: {
    AVATAR: 512 * 1024,
    CHARACTER_COVER: 800 * 1024,
    MODEL_PREVIEW: 600 * 1024,
    MODEL: 12 * 1024 * 1024,
    EXPORT: 20 * 1024 * 1024,
    TEXTURE: 5 * 1024 * 1024
  }
} as const;
