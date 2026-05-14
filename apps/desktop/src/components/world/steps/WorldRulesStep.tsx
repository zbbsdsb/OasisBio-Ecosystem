import React, { memo } from 'react';
import { Textarea } from '../ui';
import { TECH_LEVEL_OPTIONS } from '../../types/world-builder';
import type { WorldFormData } from '../../types/world-builder';

interface WorldRulesStepProps {
  formData: Partial<WorldFormData>;
  updateField: <K extends keyof WorldFormData>(field: K, value: WorldFormData[K]) => void;
  isReadOnly?: boolean;
}

export const WorldRulesStep: React.FC<WorldRulesStepProps> = memo(({
  formData,
  updateField,
  isReadOnly = false
}) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Physics Rules
        </label>
        <textarea
          value={formData.physicsRules || ''}
          onChange={(e) => updateField('physicsRules', e.target.value)}
          disabled={isReadOnly}
          rows={4}
          placeholder="Describe how physics work in your world. Are there gravity wells, magical forces, or alternate laws of nature?"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example: Magic exists as a fundamental force that bends space-time. Practitioners can create wormholes, freeze time locally, or travel between dimensions.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Technology Level
        </label>
        <select
          value={formData.techLevel || ''}
          onChange={(e) => updateField('techLevel', e.target.value)}
          disabled={isReadOnly}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select technology level...</option>
          {TECH_LEVEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {formData.techLevel && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {TECH_LEVEL_OPTIONS.find(t => t.value === formData.techLevel)?.description}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Power System
        </label>
        <textarea
          value={formData.powerSystem || ''}
          onChange={(e) => updateField('powerSystem', e.target.value)}
          disabled={isReadOnly}
          rows={4}
          placeholder="If your world has magic, superpowers, or supernatural abilities, describe how they work."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example: Chi cultivation follows a nine-tier system. Cultivators absorb spiritual energy from meditation, herbs, and combat, progressively refining their body and soul.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Limitations
        </label>
        <textarea
          value={formData.limitations || ''}
          onChange={(e) => updateField('limitations', e.target.value)}
          disabled={isReadOnly}
          rows={4}
          placeholder="What are the costs, risks, or restrictions on powers and abilities? Great limitations create great stories."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example: Every use of magic consumes lifespan. The greater the spell, the more years sacrificed. This creates natural limits on power abuse.
        </p>
      </div>
    </div>
  );
});

WorldRulesStep.displayName = 'WorldRulesStep';
