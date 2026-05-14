import type { WorldDocument, Ability, ReferenceItem } from './';

export interface CoreIdentityModule {
  name: string;
  summary: string;
  majorConflict: string | null;
  aestheticKeywords: string | null;
}

export interface TimeStructureModule {
  timeSetting: string | null;
  timeline: string | null;
  temporalRules: string | null;
}

export interface SpaceStructureModule {
  geography: string | null;
  physicsRules: string | null;
  majorLocations: string | null;
}

export interface SocietyModule {
  socialStructure: string | null;
  factions: string | null;
  cultures: string | null;
  languages: string | null;
  religions: string | null;
}

export interface RulesModule {
  rules: string | null;
  magicSystem: string | null;
  technologyLevel: string | null;
  naturalLaws: string | null;
}

export interface ContentModule {
  characters: string | null;
  events: string | null;
  lore: string | null;
}

export interface WorldItem {
  id: string;
  oasisBioId: string;
  name: string;
  summary: string;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;

  coreIdentity?: CoreIdentityModule;
  timeStructure?: TimeStructureModule;
  spaceStructure?: SpaceStructureModule;
  society?: SocietyModule;
  rules?: RulesModule;
  content?: ContentModule;

  documents?: WorldDocument[];
  abilities?: Ability[];
  references?: ReferenceItem[];
}

export interface WorldCompletionBreakdown {
  coreIdentity: number;
  timeStructure: number;
  spaceStructure: number;
  society: number;
  rules: number;
  content: number;
  documents: number;
  abilities: number;
  references: number;
}

export interface WorldCompletionResult {
  score: number;
  breakdown: WorldCompletionBreakdown;
}

const MODULE_WEIGHTS: Record<keyof WorldCompletionBreakdown, number> = {
  coreIdentity: 15,
  timeStructure: 10,
  spaceStructure: 10,
  society: 10,
  rules: 10,
  content: 15,
  documents: 10,
  abilities: 10,
  references: 10,
};

function calculateModuleScore<T extends object>(module: T | undefined): number {
  if (!module) return 0;
  const entries = Object.entries(module);
  if (entries.length === 0) return 0;
  const filledEntries = entries.filter(([_, value]) => value !== null && value !== undefined && value !== '');
  return Math.round((filledEntries.length / entries.length) * MODULE_WEIGHTS[entries[0] as keyof WorldCompletionBreakdown]);
}

export function calculateWorldCompletionScore(world: Partial<WorldItem>): WorldCompletionResult {
  const breakdown: WorldCompletionBreakdown = {
    coreIdentity: calculateModuleScore(world.coreIdentity),
    timeStructure: calculateModuleScore(world.timeStructure),
    spaceStructure: calculateModuleScore(world.spaceStructure),
    society: calculateModuleScore(world.society),
    rules: calculateModuleScore(world.rules),
    content: calculateModuleScore(world.content),
    documents: world.documents && world.documents.length > 0 ? MODULE_WEIGHTS.documents : 0,
    abilities: world.abilities && world.abilities.length > 0 ? MODULE_WEIGHTS.abilities : 0,
    references: world.references && world.references.length > 0 ? MODULE_WEIGHTS.references : 0,
  };

  const totalWeight = Object.values(MODULE_WEIGHTS).reduce((sum, w) => sum + w, 0);
  const achievedScore = Object.values(breakdown).reduce((sum, s) => sum + s, 0);
  const score = Math.round((achievedScore / totalWeight) * 100);

  return { score, breakdown };
}
