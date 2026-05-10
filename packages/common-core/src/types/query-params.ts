export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

export interface ListParams extends PaginationParams, SortParams, FilterParams {}

export interface OasisBioListParams extends ListParams {
  userId?: string;
  visibility?: string;
  featured?: boolean;
  search?: string;
}

export interface PublicOasisBioListParams extends ListParams {
  search?: string;
  featured?: boolean;
}
