import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit, Trash2, Globe, TrendingUp } from 'lucide-react';
import { Card, CardContent, Button } from '../ui';
import type { WorldItem } from '@oasisbio/common-core';
import { calculateWorldCompletionScore } from '../../hooks';

interface WorldCardProps {
  world: WorldItem;
  onEdit?: (world: WorldItem) => void;
  onDelete?: (world: WorldItem) => void;
  onView?: (world: WorldItem) => void;
}

export const WorldCard: React.FC<WorldCardProps> = memo(({
  world,
  onEdit,
  onDelete,
  onView
}) => {
  const completionScore = calculateWorldCompletionScore(world);
  
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

  const truncateText = (text: string | null, maxLength: number = 80) => {
    if (!text) return 'No description yet';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group">
      <CardContent className="p-0">
        <div className="relative">
          <div className="h-32 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-indigo-500/20 rounded-t-xl flex items-center justify-center">
            <Globe className="w-12 h-12 text-blue-500/50 dark:text-blue-400/50" />
          </div>
          
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${getScoreBgColor(completionScore)} ${getScoreColor(completionScore)}`}>
            <div className="flex items-center gap-1">
              <TrendingUp size={12} />
              {completionScore}%
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {world.name || 'Untitled World'}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {truncateText(world.summary)}
          </p>

          {world.aestheticKeywords && (
            <div className="flex flex-wrap gap-1 mb-3">
              {world.aestheticKeywords.split(',').slice(0, 3).map((keyword, index) => (
                <span 
                  key={index}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                >
                  {keyword.trim()}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Updated {formatDate(world.updatedAt)}
            </span>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.(world);
                }}
                className="p-1.5"
              >
                <Eye size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(world);
                }}
                className="p-1.5"
              >
                <Edit size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(world);
                }}
                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

WorldCard.displayName = 'WorldCard';
