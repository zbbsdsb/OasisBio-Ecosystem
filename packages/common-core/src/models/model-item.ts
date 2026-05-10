export interface ModelItem {
  id: string;
  oasisBioId: string;
  name: string;
  filePath: string;
  modelFormat: string;
  previewImage: string | null;
  relatedWorldId: string | null;
  relatedEraId: string | null;
  isPrimary: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
