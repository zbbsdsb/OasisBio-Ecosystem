import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { StepWizard } from '../components/world';
import {
  CoreIdentityStep,
  TimeStructureStep,
  WorldRulesStep,
  CivilizationStep,
  EnvironmentStep,
  NarrativeContextStep
} from '../components/world';
import { Button, Spinner } from '../components/ui';
import { apiClient } from '../services/api';
import type { WorldFormData } from '../types/world-builder';

interface WorldBuilderPageProps {
  worldId?: string;
  oasisBioId?: string;
}

export const WorldBuilderPage: React.FC<WorldBuilderPageProps> = ({ 
  worldId,
  oasisBioId: propOasisBioId 
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = useCallback(async (formData: WorldFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      let targetOasisBioId = propOasisBioId;
      if (!targetOasisBioId) {
        const profileResponse = await apiClient.profile.getProfile();
        if (profileResponse.data?.profile?.defaultOasisBioId) {
          targetOasisBioId = profileResponse.data.profile.defaultOasisBioId;
        }
      }

      if (!targetOasisBioId) {
        const oasisBiosResponse = await apiClient.oasisBios.list();
        if (oasisBiosResponse.data && oasisBiosResponse.data.length > 0) {
          targetOasisBioId = oasisBiosResponse.data[0].id;
        }
      }

      if (!targetOasisBioId) {
        throw new Error('No OasisBio ID available. Please create an identity first.');
      }

      const createData = {
        name: formData.name,
        summary: formData.summary || '',
        timeSetting: formData.eraName || null,
        geography: formData.geography || null,
        physicsRules: formData.physicsRules || null,
        socialStructure: formData.socialStructure || null,
        aestheticKeywords: formData.storyHooks || null,
        majorConflict: formData.conflict || null,
        timeline: formData.timeline || null,
        rules: formData.limitations || null,
        factions: formData.factions || null,
        genre: formData.genre || null,
        tone: formData.tone || null
      };

      const response = await apiClient.worlds.create(targetOasisBioId, createData);
      
      if (response.data) {
        navigate(`/worlds/${response.data.id}`);
      }
    } catch (err) {
      console.error('Failed to create world:', err);
      setError(err instanceof Error ? err.message : 'Failed to create world. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, propOasisBioId]);

  const handleCancel = useCallback(() => {
    navigate('/worlds');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-900/20">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Worlds
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                World Builder
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create a new fictional world with our guided wizard
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <StepWizard
          onComplete={handleComplete}
          onCancel={handleCancel}
          isLoading={isLoading}
        >
          <CoreIdentityStep />
          <TimeStructureStep />
          <WorldRulesStep />
          <CivilizationStep />
          <EnvironmentStep />
          <NarrativeContextStep />
        </StepWizard>
      </div>
    </div>
  );
};
