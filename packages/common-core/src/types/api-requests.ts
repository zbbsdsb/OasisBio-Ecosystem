export interface CreateOasisBioRequest {
  title: string;
  tagline?: string;
  identityMode?: string;
  birthDate?: Date;
  gender?: string;
  pronouns?: string;
  placeOfOrigin?: string;
  currentEra?: string;
  species?: string;
  status?: string;
  description?: string;
}

export interface UpdateOasisBioRequest {
  title?: string;
  tagline?: string;
  summary?: string;
  identityMode?: string;
  birthDate?: Date;
  gender?: string;
  pronouns?: string;
  placeOfOrigin?: string;
  currentEra?: string;
  species?: string;
  status?: string;
  description?: string;
  visibility?: string;
}

export interface CreateAbilityRequest {
  name: string;
  category: string;
  sourceType?: string;
  level?: number;
  description?: string;
  relatedWorldId?: string;
  relatedEraId?: string;
}

export interface UpdateAbilityRequest {
  name?: string;
  category?: string;
  sourceType?: string;
  level?: number;
  description?: string;
  relatedWorldId?: string;
  relatedEraId?: string;
}

export interface CreateDcosRequest {
  title: string;
  content: string;
  slug?: string;
  folderPath?: string;
  status?: string;
  eraId?: string;
}

export interface UpdateDcosRequest {
  name?: string;
  content?: string;
  type?: string;
}

export interface CreateReferenceRequest {
  url: string;
  title: string;
  description?: string;
  sourceType?: string;
  provider?: string;
  coverImage?: string;
  metadata?: string;
  eraId?: string;
  worldId?: string;
  tags?: string;
}

export interface UpdateReferenceRequest {
  url?: string;
  title?: string;
  description?: string;
  sourceType?: string;
  provider?: string;
  coverImage?: string;
  metadata?: string;
  eraId?: string;
  worldId?: string;
  tags?: string;
}

export interface CreateEraRequest {
  name: string;
  eraType: string;
  description?: string;
  startYear?: number;
  endYear?: number;
}

export interface UpdateEraRequest {
  name?: string;
  eraType?: string;
  description?: string;
  startYear?: number;
  endYear?: number;
}

export interface CreateWorldRequest {
  name: