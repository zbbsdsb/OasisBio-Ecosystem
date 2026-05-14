import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, TrendingUp, Users, Map, BookOpen, Sparkles, Clock, Shield, Building, Globe2, AlertTriangle } from 'lucide-react';
import { Button, Card, CardContent, Spinner } from '../components/ui';
import { ModuleSection, CharacterSection } from '../components/world';
import { apiClient } from '../services/api';
import { useCompletionScore } from '../hooks';
import type { WorldItem, OasisBio } from '@oasisbio/common-core';

const MODULES = [
  {
    id: 'core-identity',
    title: 'Core Identity',
    icon: Sparkles,
    fields: [
      { key: 'name' as keyof WorldItem, label: 'World Name' },
      { key: 'summary' as keyof WorldItem, label: 'Summary' }
    ]
  },
  {
    id: 'time-structure',
    title: 'Time Structure',
    icon: Clock,
    fields: [
      { key: 'timeSetting' as keyof WorldItem, label: 'Time Setting' },
      { key: 'timeline' as keyof WorldItem, label: 'Timeline' }
    ]
  },
  {
    id: 'world-rules',
    title: 'World Rules',
    icon: Shield,
    fields: [
      { key: 'physicsRules' as keyof WorldItem, label: 'Physics Rules' },
      { key: 'rules' as keyof WorldItem, label: 'Laws & Limitations' }
    ]
  },
  {
    id: 'civilization',
    title: 'Civilization',
    icon: Building,
    fields: [
      { key: 'socialStructure' as keyof WorldItem, label: 'Social Structure' },
      { key: 'factions' as keyof WorldItem, label: 'Factions' }
    ]
  },
  {
    id: 'environment',
    title: 'Environment',
    icon: Globe2,
    fields: [
      { key: 'geography' as keyof WorldItem, label: 'Geography' }
    ]
  },
  {
    id: 'narrative-context',
    title: 'Narrative Context',
    icon: AlertTriangle,
    fields: [
      { key: 'majorConflict' as keyof WorldItem, label: 'Major Conflict' },
      { key: 'aestheticKeywords' as keyof WorldItem, label: 'Aesthetic Keywords' }
    ]
  }
];

export const WorldDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [world, setWorld] = useState<WorldItem | null>(null);
  const [characters, setCharacters] = useState<OasisBio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  
  const { score, breakdown } = useCompletionScore(world);

  useEffect(() => {
    if (id) {
      fetchWorldData(id);
    }
  }, [id]);

  const fetchWorldData = async (worldId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const worldResponse = await apiClient.worlds.getById(worldId);
      if (worldResponse.data) {
        setWorld(worldResponse.data);
        
        if (worldResponse.data.oasisBioId) {
          const charsResponse = await apiClient.oasisBios.list();
          if (charsResponse.data) {
            const linkedChars = charsResponse.data.filter(
              char => char.relatedWorldId === worldId
            );
            setCharacters(linkedChars);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch world:', err);
      setError('Failed to load world data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateField = useCallback(async (fieldKey: keyof WorldItem, value: string) => {
    if (!world) return;
    
    try {
      setIsSaving(true);
      const updateData = { [fieldKey]: value };
      const response = await apiClient.worlds.update(world.id, updateData);
      
      if (response.data) {
        setWorld(prev => prev ? { ...prev, [fieldKey]: value } : null);
      }
    } catch (err) {
      console.error('Failed to update field:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [world]);

  const handleModuleSave = useCallback(() => {
    setEditingModule(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!world) return;
    
    if (window.confirm('Are you sure you want to delete this world? This action cannot be undone.')) {
      try {
        await apiClient.worlds.delete(world.id);
        navigate('/worlds');
      } catch (err) {
        console.error('Failed to delete world:', err);
        setError('Failed to delete world. Please try again.');
      }
    }
  }, [world, navigate]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-gray-100 dark:bg-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !world) {
    return (
      <div className="space-y-6">
        <Link to="/worlds">
          <Button variant="ghost">
            <ArrowLeft size={20} className="mr-2" />
            Back to Worlds
          </Button>
        </Link>
        
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-red-600 dark:text-red-400">{error || 'World not found'}</p>
            <Button onClick={() => navigate('/worlds')} className="mt-4">
              Return to Worlds List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <Link to="/worlds">
          <Button variant="ghost">
            <ArrowLeft size={20} className="mr-2" />
            Back to Worlds
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getScoreBgColor(score)}`}>
            <TrendingUp size={18} className={getScoreColor(score)} />
            <span className={`text-lg font-bold ${getScoreColor(score)}`}>
              {score}%
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Complete</span>
          </div>
          
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={18} className="mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Globe2 size={32} className="text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {world.name || 'Untitled World'}
              </h1>
              {world.summary && (
                <p className="text-gray-600 dark:text-gray-400">
                  {world.summary}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Created {new Date(world.createdAt).toLocaleDateString()}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Updated {new Date(world.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {Object.entries(breakdown).map(([key, { filled, total }]) => (
              <div key={key} className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {filled}/{total}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-600 dark:text-blue-400" />
            Characters in this World
          </h2>
          <CharacterSection
            characters={characters}
            worldId={world.id}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          World Modules
        </h2>
        
        {MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <div key={module.id}>
              <ModuleSection
                moduleId={module.id}
                title={module.title}
                fields={module.fields.map(f => ({
                  ...f,
                  value: world[f.key] as string | null
                }))}
                world={world}
                onUpdateField={handleUpdateField}
                isEditing={editingModule === module.id}
                onEdit={() => setEditingModule(module.id)}
                onCancel={() => setEditingModule(null)}
                onSave={handleModuleSave}
              />
            </div>
          );
        })}
      </div>

      {isSaving && (
        <div className="fixed bottom-6 right-6 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg flex items-center gap-2">
          <Spinner size="sm" />
          <span>Saving...</span>
        </div>
      )}
    </div>
  );
};
