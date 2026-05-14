import React, { memo, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Edit2, Save, X, Check } from 'lucide-react';
import { Button, Textarea } from '../ui';
import { useCompletionScore } from '../../hooks';
import type { WorldItem } from '@oasisbio/common-core';

interface ModuleSectionProps {
  moduleId: string;
  title: string;
  fields: Array<{
    key: keyof WorldItem;
    label: string;
    value: string | null;
  }>;
  world: WorldItem;
  onUpdateField: (key: keyof WorldItem, value: string) => void;
  isEditing?: boolean;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
}

export const ModuleSection: React.FC<ModuleSectionProps> = memo(({
  moduleId,
  title,
  fields,
  world,
  onUpdateField,
  isEditing = false,
  onEdit,
  onCancel,
  onSave
}) => {
  const [localValues, setLocalValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    fields.forEach(field => {
      initial[field.key as string] = world[field.key] as string || '';
    });
    return initial;
  });
  const [isExpanded, setIsExpanded] = useState(true);

  const filledCount = fields.filter(f => {
    const value = isEditing ? localValues[f.key as string] : world[f.key];
    return value && value.trim().length > 0;
  }).length;
  
  const totalFields = fields.length;
  const completionPercent = Math.round((filledCount / totalFields) * 100);

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleFieldChange = useCallback((key: string, value: string) => {
    setLocalValues(prev => ({ ...prev, [key]: value }));
    onUpdateField(key as keyof WorldItem, value);
  }, [onUpdateField]);

  const getCompletionColor = () => {
    if (completionPercent >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (completionPercent >= 50) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3">
          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCompletionColor()}`}>
            {filledCount}/{totalFields} filled
          </span>
        </div>

        {!isEditing && onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setLocalValues(() => {
                const initial: Record<string, string> = {};
                fields.forEach(field => {
                  initial[field.key as string] = world[field.key] as string || '';
                });
                return initial;
              });
              onEdit();
            }}
          >
            <Edit2 size={16} className="mr-1" />
            Edit
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          {isEditing ? (
            <div className="space-y-4 pt-2">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.label}
                  </label>
                  <Textarea
                    value={localValues[field.key as string] || ''}
                    onChange={(e) => handleFieldChange(field.key as string, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    rows={3}
                    className="w-full"
                  />
                </div>
              ))}
              
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  <X size={16} className="mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={onSave}>
                  <Save size={16} className="mr-1" />
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {fields.map((field) => {
                const value = world[field.key];
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                      {field.label}
                    </label>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {value && value.trim().length > 0 ? value : (
                        <span className="italic text-gray-400 dark:text-gray-500">
                          Not specified yet
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ModuleSection.displayName = 'ModuleSection';
