import React, { memo } from 'react';
import { Input, Textarea } from '../ui';
import { GENRE_OPTIONS, TONE_OPTIONS } from '../../types/world-builder';
import type { WorldFormData } from '../../types/world-builder';

interface CoreIdentityStepProps {
  formData: Partial<WorldFormData>;
  updateField: <K extends keyof WorldFormData>(field: K, value: WorldFormData[K]) => void;
  isReadOnly?: boolean;
}

export const CoreIdentityStep: React.FC<CoreIdentityStepProps> = memo(({
  formData,
  updateField,
  isReadOnly = false
}) => {
  return (
    <div className="space-y-6">
      <Input
        label="World Name *"
        placeholder="e.g., The Realm of Eldoria, Mars Colony Alpha..."
        value={formData.name || ''}
        onChange={(e) => updateField('name', e.target.value)}
        disabled={isReadOnly}
      />

      <Input
        label="Tagline"
        placeholder="A brief, evocative phrase that captures your world's essence..."
        value={formData.tagline || ''}
        onChange={(e) => updateField('tagline', e.target.value)}
        disabled={isReadOnly}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Genre *
          </label>
          <select
            value={formData.genre || ''}
            onChange={(e) => updateField('genre', e.target.value)}
            disabled={isReadOnly}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a genre...</option>
            {GENRE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {formData.genre && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {GENRE_OPTIONS.find(g => g.value === formData.genre)?.description}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tone *
          </label>
          <select
            value={formData.tone || ''}
            onChange={(e) => updateField('tone', e.target.value)}
            disabled={isReadOnly}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a tone...</option>
            {TONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {formData.tone && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {TONE_OPTIONS.find(t => t.value === formData.tone)?.description}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Summary
        </label>
        <textarea
          value={formData.summary || ''}
          onChange={(e) => updateField('summary', e.target.value)}
          disabled={isReadOnly}
          rows={4}
          placeholder="Describe your world in a few sentences. What makes it unique? What stories could unfold here?"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Example: A post-apocalyptic Earth where humanity has retreated underground after the Great Collapse, maintaining fragile civilization in vast subterranean metro networks.
        </p>
      </div>
    </div>
  );
});

CoreIdentityStep.displayName = 'CoreIdentityStep';
