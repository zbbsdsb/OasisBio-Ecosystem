'use client';

import React, { useState, memo } from 'react';
import { Save, Loader2, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { PermissionLevel, AssistantPermissions } from '../../types/assistant';

interface PermissionManagerProps {
  currentLevel: PermissionLevel;
  permissions: AssistantPermissions;
  onUpdate: (level: PermissionLevel, permissions: Partial<AssistantPermissions>) => Promise<void>;
}

const PERMISSION_ITEMS: { key: keyof AssistantPermissions; label: string; description: string }[] = [
  { key: 'canRead', label: 'Read Data', description: 'View and search your data' },
  { key: 'canWrite', label: 'Write Data', description: 'Create and modify data' },
  { key: 'canDelete', label: 'Delete Data', description: 'Delete your data and content' },
  { key: 'canManageAssistant', label: 'Manage Assistant', description: 'Configure Deo & Dia assistant settings' },
  { key: 'canManageUsers', label: 'User Management', description: 'Invite and manage other users' },
  { key: 'canExportData', label: 'Export Data', description: 'Export and download your data' }
];

export const PermissionManager = memo(function PermissionManager({
  currentLevel,
  permissions,
  onUpdate
}: PermissionManagerProps) {
  const [level, setLevel] = useState<PermissionLevel>(currentLevel);
  const [perms, setPerms] = useState<AssistantPermissions>(permissions);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const levelIcons = {
    read: Shield,
    write: ShieldAlert,
    admin: ShieldCheck
  };

  const levelDescriptions = {
    read: 'Read-only access - Can only view data, cannot modify',
    write: 'Read/Write access - Can read and modify data',
    admin: 'Full control - Can perform all operations including delete'
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      await onUpdate(level, perms);
      setMessage({ type: 'success', text: 'Permission settings saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save permissions' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-bold mb-4 text-slate-800">Deo & Dia Permission Settings</h2>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2 text-slate-700">Permission Level</h3>
        <div className="space-y-2">
          {(Object.keys(levelIcons) as PermissionLevel[]).map((lvl) => {
            const Icon = levelIcons[lvl];
            return (
              <label
                key={lvl}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  level === lvl ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="level"
                  value={lvl}
                  checked={level === lvl}
                  onChange={() => setLevel(lvl)}
                  className="sr-only"
                />
                <Icon className={`w-5 h-5 ${level === lvl ? 'text-blue-600' : 'text-gray-400'}`} />
                <div>
                  <div className="font-medium text-slate-800">{levelDescriptions[lvl]}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {level !== 'admin' && (
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2 text-slate-700">Specific Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {PERMISSION_ITEMS.map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!perms[item.key]}
                  onChange={(e) => setPerms({ ...perms, [item.key]: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-slate-700">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Permission Settings
      </button>
    </div>
  );
});

export default PermissionManager;
