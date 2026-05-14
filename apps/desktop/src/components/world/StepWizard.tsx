import React, { memo, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Save, SkipForward, X } from 'lucide-react';
import { WizardProgress } from './WizardProgress';
import { Button, Spinner } from '../ui';
import { useWorldBuilder } from '../../hooks';
import { WIZARD_STEPS } from '../../types/world-builder';

interface StepWizardProps {
  onComplete?: (data: any) => void;
  onCancel?: () => void;
  onSaveDraft?: (data: any) => void;
  initialData?: any;
  isLoading?: boolean;
}

export const StepWizard: React.FC<StepWizardProps> = memo(({
  onComplete,
  onCancel,
  onSaveDraft,
  initialData,
  isLoading = false
}) => {
  const {
    state,
    formData,
    goToStep,
    nextStep,
    prevStep,
    updateField,
    updateMultipleFields,
    setSaving,
    resetWizard,
    validateCurrentStep,
    canGoBack,
    isFirstStep,
    isLastStep,
    stepProgress
  } = useWorldBuilder();

  const [stepError, setStepError] = useState<string>('');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const currentStepConfig = WIZARD_STEPS[state.currentStep - 1];

  const handleNext = useCallback(() => {
    setStepError('');

    if (!validateCurrentStep()) {
      setStepError('Please fill in the required fields before continuing.');
      return;
    }

    setCompletedSteps(prev => {
      if (!prev.includes(state.currentStep)) {
        return [...prev, state.currentStep];
      }
      return prev;
    });

    if (isLastStep) {
      onComplete?.(formData);
    } else {
      nextStep();
    }
  }, [state.currentStep, isLastStep, formData, nextStep, validateCurrentStep, onComplete]);

  const handleBack = useCallback(() => {
    setStepError('');
    prevStep();
  }, [prevStep]);

  const handleStepClick = useCallback((step: number) => {
    if (step < state.currentStep || completedSteps.includes(step)) {
      goToStep(step);
    }
  }, [state.currentStep, completedSteps, goToStep]);

  const handleSkip = useCallback(() => {
    if (isLastStep) {
      onComplete?.(formData);
    } else {
      setCompletedSteps(prev => {
        if (!prev.includes(state.currentStep)) {
          return [...prev, state.currentStep];
        }
        return prev;
      });
      nextStep();
    }
  }, [isLastStep, state.currentStep, formData, nextStep, onComplete]);

  const handleCancel = useCallback(() => {
    if (window.confirm('Are you sure you want to cancel? All unsaved progress will be lost.')) {
      resetWizard();
      onCancel?.();
    }
  }, [resetWizard, onCancel]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-xl border border-blue-100 dark:border-gray-700">
        <WizardProgress
          currentStep={state.currentStep}
          totalSteps={state.totalSteps}
          onStepClick={handleStepClick}
          completedSteps={completedSteps}
        />
      </div>

      <div className="min-h-[400px]">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white text-lg font-bold">
              {state.currentStep}
            </span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentStepConfig?.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Step {state.currentStep} of {state.totalSteps}
              </p>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-13">
            {currentStepConfig?.description}
          </p>
        </div>

        {stepError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700 dark:text-red-300">{stepError}</p>
          </div>
        )}

        <div className="space-y-6">
          {React.Children.map(children, (child, index) => {
            if (index + 1 === state.currentStep) {
              return React.isValidElement(child)
                ? React.cloneElement(child as React.ReactElement<any>, { formData, updateField, updateMultipleFields })
                : null;
            }
            return null;
          })}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <Button variant="secondary" onClick={handleBack} disabled={isLoading}>
                <ChevronLeft size={20} className="mr-1" />
                Back
              </Button>
            )}
            <Button variant="ghost" onClick={handleCancel} disabled={isLoading}>
              <X size={20} className="mr-1" />
              Cancel
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {!isLastStep && (
              <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
                Skip for now
                <SkipForward size={20} className="ml-1" />
              </Button>
            )}
            <Button onClick={handleNext} disabled={isLoading || state.isSaving}>
              {state.isSaving ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : isLastStep ? (
                <>
                  <Save size={20} className="mr-1" />
                  Create World
                </>
              ) : (
                <>
                  Next
                  <ChevronRight size={20} className="ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

StepWizard.displayName = 'StepWizard';
