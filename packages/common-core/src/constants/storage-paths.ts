export const STORAGE_PATHS = {
  AVATAR: (userId: string, ext: string = 'webp') => `${userId}/avatar.${ext}`,
  CHARACTER_COVER: (userId: string, characterId: string, ext: string = 'webp') => `${userId}/${characterId}/cover.${ext}`,
  MODEL_PREVIEW: (userId: string, characterId: string, ext: string = 'webp') => `${userId}/${characterId}/preview.${ext}`,
  MODEL: (userId: string, characterId: string, fileName: string) => `models/${userId}/${characterId}/${fileName}`,
  EXPORT: (userId: string, timestamp: number, fileName: string) => `exports/${userId}/${timestamp}/${fileName}`,
  TEXTURE: (userId: string, characterId: string, fileName: string) => `textures/${userId}/${characterId}/${fileName}`
} as const;

export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  CHARACTER_COVERS: 'character-covers',
  MODEL_PREVIEWS: 'model-previews'
} as const;
