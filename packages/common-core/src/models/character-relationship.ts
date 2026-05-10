import type { OasisBio } from './';

export interface CharacterRelationship {
  id: string;
  characterAId: string;
  characterBId: string;
  relationType: string;
  description: string | null;
  createdAt: Date;
  
  characterA?: OasisBio;
  characterB?: OasisBio;
}
