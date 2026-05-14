import React, { memo } from 'react';
import { Textarea } from '../ui';
import type { WorldFormData } from '../../types/world-builder';

interface CivilizationStepProps {
  formData: Partial<WorldFormData>;
  updateField: <K extends keyof WorldFormData>(field: K, value: WorldFormData[K]) => void;
  isReadOnly?: boolean;
}

export const CivilizationStep: React.FC<CivilizationStepProps> = memo(({
  formData,
  updateField,
  isReadOnly = false
}) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Governance
        </label>
        <textarea
          value={formData.governance || ''}
          onChange={(e) => updateField('governance', e.target.value)}
          disabled={isReadOnly}
          rows={3}
          placeholder="How are societies ruled? Monarchies, democracies, councils, dictatorships, theocracies?"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example: The Seven Kingdoms operate under a feudal system where lords pledge loyalty to the Phoenix Throne in exchange for autonomy in domestic affairs.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Economy
        </label>
        <textarea
          value={formData.economy || ''}
          onChange={(e) => updateField('economy', e.target.value)}
          disabled={isReadOnly}
          rows={3}
          placeholder="What drives trade and commerce? Currency, resources, barter systems, magical commodities?"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example: The economy revolves around Spirit Stones—crystallized magical energy used for powering devices, currency, and cultivation. Mining operations control global wealth.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Factions
        </label>
        <textarea
          value={formData.factions || ''}
          onChange={(e) => updateField('factions', e.target.value)}
          disabled={isReadOnly}
          rows={4}
          placeholder="Describe the major organizations, guilds, religions, or political groups that vie for power."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example:
          {'\n'}- The Iron Guild: Merchant consortium controlling all maritime trade
          {'\n'}- Order of the Silver Flame: Warrior-monks protecting ancient shrines
          {'\n'}- The Shadow Council: Secretive group manipulating events from behind the throne
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Social Structure
        </label>
        <textarea
          value={formData.socialStructure || ''}
          onChange={(e) => updateField('socialStructure', e.target.value)}
          disabled={isReadOnly}
          rows={3}
          placeholder="How is society organized? Classes, castes, guilds, family structures?"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Culture
        </label>
        <textarea
          value={formData.culture || ''}
          onChange={(e) => updateField('culture', e.target.value)}
          disabled={isReadOnly}
          rows={4}
          placeholder="What are the customs, traditions, values, art, and daily life like? How do people celebrate, mourn, greet each other?"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example: Warriors compose death poems before battle. Music is considered sacred, with instruments reserved for religious ceremonies. Family honor depends on scholarly achievement.
        </p>
      </div>
    </div>
  );
});

CivilizationStep.displayName = 'CivilizationStep';
