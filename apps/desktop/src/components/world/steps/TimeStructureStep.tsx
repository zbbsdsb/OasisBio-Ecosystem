import React, { memo } from 'react';
import { Input, Textarea } from '../ui';
import { TIME_PERIOD_OPTIONS } from '../../types/world-builder';
import type { WorldFormData } from '../../types/world-builder';

interface TimeStructureStepProps {
  formData: Partial<WorldFormData>;
  updateField: <K extends keyof WorldFormData>(field: K, value: WorldFormData[K]) => void;
  isReadOnly?: boolean;
}

export const TimeStructureStep: React.FC<TimeStructureStepProps> = memo(({
  formData,
  updateField,
  isReadOnly = false
}) => {
  return (
    <div className="space-y-6">
      <Input
        label="Era Name"
        placeholder="e.g., The Age of Dragons, The Great Depression, The Golden Century..."
        value={formData.eraName || ''}
        onChange={(e) => updateField('eraName', e.target.value)}
        disabled={isReadOnly}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Time Period
        </label>
        <select
          value={formData.timePeriod || ''}
          onChange={(e) => updateField('timePeriod', e.target.value)}
          disabled={isReadOnly}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a time period...</option>
          {TIME_PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {formData.timePeriod && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {TIME_PERIOD_OPTIONS.find(t => t.value === formData.timePeriod)?.description}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Timeline
        </label>
        <textarea
          value={formData.timeline || ''}
          onChange={(e) => updateField('timeline', e.target.value)}
          disabled={isReadOnly}
          rows={5}
          placeholder="Describe the key events that shaped your world. Use bullet points or a narrative format."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example:
          {'\n'}- Year 0: The Great Cataclysm reshapes the continent
          {'\n'}- Year 250: The first unified kingdom is established
          {'\n'}- Year 500: Discovery of magic crystals transforms society
          {'\n'}- Year 750: The War of Shadows threatens to engulf the world
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Major Events
        </label>
        <textarea
          value={formData.majorEvents || ''}
          onChange={(e) => updateField('majorEvents', e.target.value)}
          disabled={isReadOnly}
          rows={4}
          placeholder="Describe pivotal moments that define your world's history and continue to influence the present."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>
    </div>
  );
});

TimeStructureStep.displayName = 'TimeStructureStep';
