import React, { memo } from 'react';
import { AlertCircle } from 'lucide-react';

interface WizardStepProps {
  stepNumber: number;
  title: string;
  description: string;
  children: React.ReactNode;
  isActive?: boolean;
  error?: string;
  className?: string;
}

export const WizardStep: React.FC<WizardStepProps> = memo(({
  stepNumber,
  title,
  description,
  children,
  isActive = true,
  error,
  className = ''
}) => {
  if (!isActive) return null;

  return (
    <div className={`animate-fadeIn ${className}`}>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white text-lg font-bold">
            {stepNumber}
          </span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 ml-13">
          {description}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        {children}
      </div>
    </div>
  );
});

WizardStep.displayName = 'WizardStep';
