import React, { memo } from 'react';
import { Textarea } from '../ui';
import type { WorldFormData } from '../../types/world-builder';

interface EnvironmentStepProps {
  formData: Partial<WorldFormData>;
  updateField: <K extends keyof WorldFormData>(field: K, value: WorldFormData[K]) => void;
  isReadOnly?: boolean;
}

export const EnvironmentStep: React.FC<EnvironmentStepProps> = memo(({
  formData,
  updateField,
  isReadOnly = false
}) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Geography
        </label>
        <textarea
          value={formData.geography || ''}
          onChange={(e) => updateField('geography', e.target.value)}
          disabled={isReadOnly}
          rows={5}
          placeholder="Describe the physical landscape. Continents, oceans, mountain ranges, forests, deserts, climate zones..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example: The world consists of three vast continents separated by the Endless Sea. The northern Frostlands are permafrost tundra, while the southern Shattered Isles experience eternal monsoon seasons.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cities
        </label>
        <textarea
          value={formData.cities || ''}
          onChange={(e) => updateField('cities', e.target.value)}
          disabled={isReadOnly}
          rows={4}
          placeholder="Describe major population centers. Their architecture, culture, size, and what makes each unique."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example:
          {'\n'}- Veranthas: Floating city built on massive ancient machines, home to the Mage Council
          {'\n'}- Ironhaven: Fortress-city in the mountain pass, never breached in 500 years
          {'\n'}- Coral Crown: Underwater metropolis where merfolk and surface dwellers trade
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Landmarks
        </label>
        <textarea
          value={formData.landmarks || ''}
          onChange={(e) => updateField('landmarks', e.target.value)}
          disabled={isReadOnly}
          rows={4}
          placeholder="Describe significant locations that define your world. Ancient ruins, sacred sites, natural wonders..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example:
          {'\n'}- The Spire of Eternity: A mile-high tower at the world's center, source of all magic
          {'\n'}- The Bone Fields: Desert of fossilized giants, forbidden due to collapse hazards
          {'\n'}- Whispering Woods: Forest where trees can speak and time flows differently
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Environmental Features
        </label>
        <textarea
          value={formData.environmentalFeatures || ''}
          onChange={(e) => updateField('environmentalFeatures', e.target.value)}
          disabled={isReadOnly}
          rows={4}
          placeholder="Unique environmental phenomena, magical zones, hazardous regions, or living ecosystems."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example: The Shimmering Mists appear randomly, teleporting anything inside to random locations. The Blood Moon rises every century, awakening dormant ancient evils.
        </p>
      </div>
    </div>
  );
});

EnvironmentStep.displayName = 'EnvironmentStep';
