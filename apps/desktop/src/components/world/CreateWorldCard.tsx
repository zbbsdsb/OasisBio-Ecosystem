import React, { memo } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../ui';

interface CreateWorldCardProps {
  onClick?: () => void;
  worldCount?: number;
}

export const CreateWorldCard: React.FC<CreateWorldCardProps> = memo(({
  onClick,
  worldCount = 0
}) => {
  if (worldCount >= 10) return null;

  return (
    <Card 
      className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 border-dashed border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-500"
      onClick={onClick}
    >
      <CardContent className="p-8 flex flex-col items-center justify-center min-h-[280px]">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
          <Plus size={32} className="text-white" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Create New World
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
          Start building a new fictional world with our guided step-by-step wizard
        </p>

        <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
          <Sparkles size={14} />
          <span>6-step guided creation</span>
        </div>
      </CardContent>
    </Card>
  );
});

CreateWorldCard.displayName = 'CreateWorldCard';
