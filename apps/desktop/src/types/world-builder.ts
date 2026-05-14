import type { WorldItem } from '@oasisbio/common-core';

export interface WorldBuilderState {
  currentStep: number;
  totalSteps: number;
  data: Partial<WorldFormData>;
  isDirty: boolean;
  isSaving: boolean;
  isValid: boolean;
}

export interface WorldFormData {
  name: string;
  tagline: string;
  genre: string;
  tone: string;
  summary: string;
  
  eraName: string;
  timePeriod: string;
  timeline: string;
  majorEvents: string;
  
  physicsRules: string;
  techLevel: string;
  powerSystem: string;
  limitations: string;
  
  governance: string;
  economy: string;
  factions: string;
  socialStructure: string;
  culture: string;
  
  geography: string;
  cities: string;
  landmarks: string;
  environmentalFeatures: string;
  
  conflict: string;
  themes: string;
  storyHooks: string;
  characterRoles: string;
}

export interface WizardStepConfig {
  id: number;
  title: string;
  description: string;
  shortTitle: string;
}

export const WIZARD_STEPS: WizardStepConfig[] = [
  {
    id: 1,
    title: 'Core Identity',
    shortTitle: 'Identity',
    description: 'Define the fundamental essence of your world — its name, genre, tone, and core concept.'
  },
  {
    id: 2,
    title: 'Time Structure',
    shortTitle: 'Time',
    description: 'Establish when your world exists, its historical periods, and pivotal events that shaped it.'
  },
  {
    id: 3,
    title: 'World Rules',
    shortTitle: 'Rules',
    description: 'Define the laws of physics, technology level, and any magical or supernatural systems.'
  },
  {
    id: 4,
    title: 'Civilization',
    shortTitle: 'Society',
    description: 'Shape the societies that inhabit your world — governments, economies, cultures, and factions.'
  },
  {
    id: 5,
    title: 'Environment',
    shortTitle: 'Geography',
    description: 'Describe the physical world — landscapes, cities, landmarks, and natural phenomena.'
  },
  {
    id: 6,
    title: 'Narrative Context',
    shortTitle: 'Story',
    description: 'Define the conflicts, themes, and storytelling opportunities that drive narratives in your world.'
  }
];

export const GENRE_OPTIONS = [
  { value: 'fantasy', label: 'Fantasy', description: 'Magic, mythical creatures, medieval settings' },
  { value: 'scifi', label: 'Science Fiction', description: 'Futuristic technology, space exploration, dystopia' },
  { value: 'modern', label: 'Modern', description: 'Contemporary real-world settings' },
  { value: 'historical', label: 'Historical', description: 'Past eras with historical accuracy' },
  { value: 'horror', label: 'Horror', description: 'Dark themes, supernatural threats, survival' },
  { value: 'romance', label: 'Romance', description: 'Focus on relationships and emotional journeys' },
  { value: 'mystery', label: 'Mystery', description: 'Investigation, puzzles, uncovering secrets' },
  { value: 'post-apocalyptic', label: 'Post-Apocalyptic', description: 'World after catastrophic events' },
  { value: 'steampunk', label: 'Steampunk', description: 'Victorian era with steam-powered technology' },
  { value: 'cyberpunk', label: 'Cyberpunk', description: 'High tech, low life, corporate dominance' },
  { value: 'superhero', label: 'Superhero', description: 'Powered individuals, vigilantes, saving the world' },
  { value: 'alternate-history', label: 'Alternate History', description: 'Historical divergence points' }
];

export const TONE_OPTIONS = [
  { value: 'serious', label: 'Serious', description: 'Grounded, realistic, consequences matter' },
  { value: 'dark', label: 'Dark', description: 'Grim, pessimistic, moral ambiguity' },
  { value: 'light', label: 'Light', description: 'Optimistic, hopeful, fun adventure' },
  { value: 'humorous', label: 'Humorous', description: 'Comedy, satire, witty dialogue' },
  { value: 'epic', label: 'Epic', description: 'Grand scale, heroic, legendary' },
  { value: 'intimate', label: 'Intimate', description: 'Personal stakes, character-driven' },
  { value: 'mysterious', label: 'Mysterious', description: 'Unknowns, secrets, intrigue' },
  { value: 'action', label: 'Action-Oriented', description: 'Fast-paced, combat, adventure' }
];

export const TIME_PERIOD_OPTIONS = [
  { value: 'prehistoric', label: 'Prehistoric', description: 'Before recorded history' },
  { value: 'ancient', label: 'Ancient', description: 'Classical civilizations' },
  { value: 'medieval', label: 'Medieval', description: 'Feudal systems, castles' },
  { value: 'renaissance', label: 'Renaissance', description: 'Cultural rebirth, exploration' },
  { value: 'industrial', label: 'Industrial Age', description: 'Steam power, factories' },
  { value: 'modern', label: 'Modern Era', description: 'Contemporary technology' },
  { value: 'near-future', label: 'Near Future', description: 'Slightly advanced technology' },
  { value: 'distant-future', label: 'Distant Future', description: 'Centuries or millennia ahead' },
  { value: 'far-future', label: 'Far Future', description: 'Millennia or beyond' },
  { value: 'timeless', label: 'Timeless', description: 'No fixed time period' }
];

export const TECH_LEVEL_OPTIONS = [
  { value: 'primitive', label: 'Primitive', description: 'Stone age, basic tools' },
  { value: 'pre-industrial', label: 'Pre-Industrial', description: 'Bronze/iron age, agriculture' },
  { value: 'industrial', label: 'Industrial', description: 'Steam, factories, mass production' },
  { value: 'information', label: 'Information Age', description: 'Computers, internet, digital' },
  { value: 'post-scarcity', label: 'Post-Scarcity', description: 'Abundant resources, automation' },
  { value: 'transhuman', label: 'Transhuman', description: 'Human augmentation, AI' },
  { value: 'spacefaring', label: 'Spacefaring', description: 'Interplanetary civilization' },
  { value: 'interstellar', label: 'Interstellar', description: 'Faster-than-light, galactic reach' },
  { value: 'multiverse', label: 'Multiverse', description: 'Cross-dimensional travel' },
  { value: 'magitech', label: 'Magitech', description: 'Magic and technology merged' }
];

export interface WorldWithScore extends WorldItem {
  completionScore: number;
}

export interface ModuleSection {
  id: string;
  title: string;
  fields: ModuleField[];
}

export interface ModuleField {
  key: keyof WorldItem;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'tags';
  required?: boolean;
  placeholder?: string;
  example?: string;
}

export const WORLD_MODULES: ModuleSection[] = [
  {
    id: 'core-identity',
    title: 'Core Identity',
    fields: [
      { key: 'name', label: 'World Name', type: 'text', required: true },
      { key: 'summary', label: 'Summary', type: 'textarea' }
    ]
  },
  {
    id: 'time-structure',
    title: 'Time Structure',
    fields: [
      { key: 'timeSetting', label: 'Time Setting', type: 'textarea' }
    ]
  },
  {
    id: 'world-rules',
    title: 'World Rules',
    fields: [
      { key: 'physicsRules', label: 'Physics Rules', type: 'textarea' },
      { key: 'rules', label: 'Laws & Limitations', type: 'textarea' }
    ]
  },
  {
    id: 'civilization',
    title: 'Civilization',
    fields: [
      { key: 'socialStructure', label: 'Social Structure', type: 'textarea' },
      { key: 'factions', label: 'Factions', type: 'textarea' }
    ]
  },
  {
    id: 'environment',
    title: 'Environment',
    fields: [
      { key: 'geography', label: 'Geography', type: 'textarea' }
    ]
  },
  {
    id: 'narrative-context',
    title: 'Narrative Context',
    fields: [
      { key: 'majorConflict', label: 'Major Conflict', type: 'textarea' },
      { key: 'aestheticKeywords', label: 'Aesthetic Keywords', type: 'tags' }
    ]
  }
];
