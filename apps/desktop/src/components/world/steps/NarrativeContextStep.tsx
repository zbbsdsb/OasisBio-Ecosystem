import React, { memo } from 'react';
import { Textarea } from '../ui';
import type { WorldFormData } from '../../types/world-builder';

interface NarrativeContextStepProps {
  formData: Partial<WorldFormData>;
  updateField: <K extends keyof WorldFormData>(field: K, value: WorldFormData[K]) => void;
  isReadOnly?: boolean;
}

export const NarrativeContextStep: React.FC<NarrativeContextStepProps> = memo(({
  formData,
  updateField,
  isReadOnly = false
}) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Major Conflict
        </label>
        <textarea
          value={formData.conflict || ''}
          onChange={(e) => updateField('conflict', e.target.value)}
          disabled={isReadOnly}
          rows={4}
          placeholder="What are the central tensions and conflicts that drive stories in this world? Wars, ideological struggles, survival challenges?"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example: The Succession Crisis threatens to tear the empire apart. Three claimants to the throne wage shadow warfare while an ancient evil stirs in the north.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Themes
        </label>
        <textarea
          value={formData.themes || ''}
          onChange={(e) => updateField('themes', e.target.value)}
          disabled={isReadOnly}
          rows={3}
          placeholder="What recurring ideas and questions does your world explore? Redemption, sacrifice, power, identity?"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example: Power corrupts, but true strength comes from sacrifice. The line between hero and villain is often a matter of perspective. Knowledge carries a heavy price.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Story Hooks
        </label>
        <textarea
          value={formData.storyHooks || ''}
          onChange={(e) => updateField('storyHooks', e.target.value)}
          disabled={isReadOnly}
          rows={5}
          placeholder="What compelling story opportunities exist? Mysteries, quests, character arcs, dramatic situations..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example:
          {'\n'}- A discovered map leads to the lost treasury of the first emperor
          {'\n'}- The protagonist's mentor is revealed to be the enemy they've been hunting
          {'\n'}- An ancient prophecy suggests the only hope requires sacrificing someone beloved
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Character Roles
        </label>
        <textarea
          value={formData.characterRoles || ''}
          onChange={(e) => updateField('characterRoles', e.target.value)}
          disabled={isReadOnly}
          rows={4}
          placeholder="What archetypal roles or archetypes fit naturally in this world? Warriors, mages, rogues, leaders, outcasts?"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example:
          {'\n'}- The Reluctant Hero: Ordinary person thrust into extraordinary circumstances
          {'\n'}- The Shadow Knight: Warrior bound by honor while serving a corrupt master
          {'\n'}- The Wandering Sage: Ancient teacher seeking a worthy student to pass on knowledge
        </p>
      </div>
    </div>
  );
});

NarrativeContextStep.displayName = 'NarrativeContextStep';
