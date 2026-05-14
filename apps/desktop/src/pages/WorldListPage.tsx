import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Search, TrendingUp } from 'lucide-react';
import { Button, Input, Card, CardContent, Spinner } from '../components/ui';
import { WorldCard, CreateWorldCard } from '../components/world';
import { apiClient } from '../services/api';
import type { WorldItem } from '@oasisbio/common-core';

export const WorldListPage: React.FC = () => {
  const [worlds, setWorlds] = useState<WorldItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorlds();
  }, []);

  const fetchWorlds = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const profileResponse = await apiClient.profile.getProfile();
      if (profileResponse.data?.profile?.defaultOasisBioId) {
        const worldsResponse = await apiClient.worlds.listByOasisBioId(
          profileResponse.data.profile.defaultOasisBioId
        );
        if (worldsResponse.data) {
          setWorlds(worldsResponse.data);
        }
      } else {
        const oasisBiosResponse = await apiClient.oasisBios.list();
        if (oasisBiosResponse.data && oasisBiosResponse.data.length > 0) {
          const worldsResponse = await apiClient.worlds.listByOasisBioId(
            oasisBiosResponse.data[0].id
          );
          if (worldsResponse.data) {
            setWorlds(worldsResponse.data);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch worlds:', err);
      setError('Failed to load worlds. Please try again.');
      setWorlds([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = useCallback(() => {
    navigate('/worlds/new');
  }, [navigate]);

  const handleView = useCallback((world: WorldItem) => {
    navigate(`/worlds/${world.id}`);
  }, [navigate]);

  const handleEdit = useCallback((world: WorldItem) => {
    navigate(`/worlds/${world.id}`);
  }, [navigate]);

  const handleDelete = useCallback(async (world: WorldItem) => {
    if (window.confirm(`Are you sure you want to delete "${world.name}"? This action cannot be undone.`)) {
      try {
        await apiClient.worlds.delete(world.id);
        setWorlds(prev => prev.filter(w => w.id !== world.id));
      } catch (err) {
        console.error('Failed to delete world:', err);
        setError('Failed to delete world. Please try again.');
      }
    }
  }, []);

  const filteredWorlds = worlds.filter(world =>
    world.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Worlds</h1>
          <p className="text-gray-600 dark:text-gray-400">Build and manage your fictional worlds</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Globe size={20} className="mr-2" />
          Create World
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {worlds.length > 0 && (
        <div className="max-w-md">
          <Input
            placeholder="Search worlds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {filteredWorlds.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Globe size={40} className="text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No worlds found' : 'No worlds yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? `No worlds match "${searchTerm}". Try a different search term.`
                : 'Create your first fictional world and start building unique stories and characters.'
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleCreateNew}>
                <Globe size={20} className="mr-2" />
                Create Your First World
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CreateWorldCard onClick={handleCreateNew} worldCount={worlds.length} />
          {filteredWorlds.map((world) => (
            <div key={world.id} onClick={() => handleView(world)}>
              <WorldCard
                world={world}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
