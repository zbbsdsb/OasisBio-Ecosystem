'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SettingsPanel, PermissionManager } from '../components/assistant';
import { assistantService } from '../services/assistantService';
import type { ProfileConfig, PermissionLevel, AssistantPermissions } from '../types/assistant';
import { DEFAULT_PERMISSIONS, DEO_DEFAULT_PROMPT, DIA_DEFAULT_PROMPT } from '../types/assistant';
import { Spinner } from '../components/ui';

function AssistantSettingsContent() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'settings' | 'permissions'>('settings');
  const [isLoading, setIsLoading] = useState(true);
  const [deoProfile, setDeoProfile] = useState<ProfileConfig>({
    systemPrompt: DEO_DEFAULT_PROMPT,
    apiEndpoint: null,
    apiKey: null,
    model: 'gpt-4o',
    enabled: true,
    configured: false
  });
  const [diaProfile, setDiaProfile] = useState<ProfileConfig>({
    systemPrompt: DIA_DEFAULT_PROMPT,
    apiEndpoint: null,
    apiKey: null,
    model: 'gpt-4o',
    enabled: true,
    configured: false
  });
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>('read');
  const [permissions, setPermissions] = useState<AssistantPermissions>(DEFAULT_PERMISSIONS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [profiles, perms] = await Promise.all([
        assistantService.getProfiles(),
        assistantService.getPermissions()
      ]);
      setDeoProfile(profiles.deo);
      setDiaProfile(profiles.dia);
      setPermissionLevel(perms.level);
      setPermissions(perms.permissions);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (agent: 'deo' | 'dia', data: Partial<ProfileConfig>) => {
    await assistantService.updateProfile(agent, data);
    if (agent === 'deo') {
      setDeoProfile(prev => ({ ...prev, ...data }));
    } else {
      setDiaProfile(prev => ({ ...prev, ...data }));
    }
  };

  const handleUpdatePermissions = async (level: PermissionLevel, perms: Partial<AssistantPermissions>) => {
    await assistantService.updatePermissions(level, perms);
    setPermissionLevel(level);
    setPermissions(prev => ({ ...prev, ...perms }));
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/assistant')}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Assistant Settings</h1>
            <p className="text-sm text-slate-500">Configure Deo & Dia AI assistants</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              AI Settings
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'permissions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Permissions
            </button>
          </div>

          {activeTab === 'settings' && (
            <SettingsPanel
              deoProfile={deoProfile}
              diaProfile={diaProfile}
              onUpdate={handleUpdateProfile}
            />
          )}

          {activeTab === 'permissions' && (
            <PermissionManager
              currentLevel={permissionLevel}
              permissions={permissions}
              onUpdate={handleUpdatePermissions}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export const AssistantSettingsPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <AssistantSettingsContent />
    </Suspense>
  );
};

export default AssistantSettingsPage;
