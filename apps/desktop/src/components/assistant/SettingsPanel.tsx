'use client';

import React, { useState, memo } from 'react';
import { Save, Loader2 } from 'lucide-react';
import type { ProfileConfig } from '../../types/assistant';

interface SettingsPanelProps {
  deoProfile: ProfileConfig;
  diaProfile: ProfileConfig;
  onUpdate: (agent: 'deo' | 'dia', data: Partial<ProfileConfig>) => Promise<void>;
}

export const SettingsPanel = memo(function SettingsPanel({
  deoProfile,
  diaProfile,
  onUpdate
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'deo' | 'dia'>('deo');
  const [deoForm, setDeoForm] = useState(deoProfile);
  const [diaForm, setDiaForm] = useState(diaProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentForm = activeTab === 'deo' ? deoForm : diaForm;
  const setCurrentForm = activeTab === 'deo' ? setDeoForm : setDiaForm;

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      await onUpdate(activeTab, currentForm);
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-bold mb-4 text-slate-800">AI Assistant Settings</h2>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('deo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'deo'
              ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <img src="/assets/deo/deo.png" alt="Deo" className="w-6 h-6 rounded-full" />
          Deo - Technical Guide
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('dia')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'dia'
              ? 'bg-rose-100 text-rose-700 border-2 border-rose-500'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <img src="/assets/deo/dia.png" alt="Dia" className="w-6 h-6 rounded-full" />
          Dia - Creative Partner
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">API Endpoint</label>
          <input
            type="text"
            value={currentForm.apiEndpoint || ''}
            onChange={(e) => setCurrentForm({ ...currentForm, apiEndpoint: e.target.value || null })}
            placeholder="https://api.openai.com/v1/chat/completions"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">API Key</label>
          <input
            type="password"
            value={currentForm.apiKey || ''}
            onChange={(e) => setCurrentForm({ ...currentForm, apiKey: e.target.value || null })}
            placeholder={currentForm.configured ? 'Configured (enter new value to change)' : 'sk-...'}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">Model</label>
          <input
            type="text"
            value={currentForm.model}
            onChange={(e) => setCurrentForm({ ...currentForm, model: e.target.value })}
            placeholder="gpt-4o"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700">System Prompt</label>
          <textarea
            value={currentForm.systemPrompt}
            onChange={(e) => setCurrentForm({ ...currentForm, systemPrompt: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`${activeTab}-enabled`}
            checked={currentForm.enabled}
            onChange={(e) => setCurrentForm({ ...currentForm, enabled: e.target.checked })}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor={`${activeTab}-enabled`} className="text-sm text-slate-700">Enable this assistant</label>
        </div>

        {message && (
          <div className={`p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
          Save Settings
        </button>
      </div>
    </div>
  );
});

export default SettingsPanel;
