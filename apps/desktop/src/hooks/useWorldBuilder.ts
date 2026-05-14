import { useState, useCallback, useMemo } from 'react';
import type { WorldFormData, WorldBuilderState } from '../types/world-builder';
import { WIZARD_STEPS } from '../types/world-builder';

const TOTAL_STEPS = WIZARD_STEPS.length;

const getInitialState = (): WorldBuilderState => ({
  currentStep: 1,
  totalSteps: TOTAL_STEPS,
  data: {},
  isDirty: false,
  isSaving: false,
  isValid: false
});

const getEmptyFormData = (): WorldFormData => ({
  name: '',
  tagline: '',
  genre: '',
  tone: '',
  summary: '',
  
  eraName: '',
  timePeriod: '',
  timeline: '',
  majorEvents: '',
  
  physicsRules: '',
  techLevel: '',
  powerSystem: '',
  limitations: '',
  
  governance: '',
  economy: '',
  factions: '',
  socialStructure: '',
  culture: '',
  
  geography: '',
  cities: '',
  landmarks: '',
  environmentalFeatures: '',
  
  conflict: '',
  themes: '',
  storyHooks: '',
  characterRoles: ''
});

interface UseWorldBuilderReturn {
  state: WorldBuilderState;
  formData: WorldFormData;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateField: <K extends keyof WorldFormData>(field: K, value: WorldFormData[K]) => void;
  updateMultipleFields: (fields: Partial<WorldFormData>) => void;
  setSaving: (isSaving: boolean) => void;
  resetWizard: () => void;
  loadExistingWorld: (data: Partial<WorldFormData>) => void;
  validateCurrentStep: () => boolean;
  canProceed: boolean;
  canGoBack: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  stepProgress: number;
}

export const useWorldBuilder = (): UseWorldBuilderReturn => {
  const [state, setState] = useState<WorldBuilderState>(getInitialState);
  const [formData, setFormData] = useState<WorldFormData>(getEmptyFormData);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setState(prev => ({ ...prev, currentStep: step }));
    }
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, TOTAL_STEPS)
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1)
    }));
  }, []);

  const updateField = useCallback(<K extends keyof WorldFormData>(
    field: K,
    value: WorldFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setState(prev => ({ ...prev, isDirty: true }));
  }, []);

  const updateMultipleFields = useCallback((fields: Partial<WorldFormData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
    setState(prev => ({ ...prev, isDirty: true }));
  }, []);

  const setSaving = useCallback((isSaving: boolean) => {
    setState(prev => ({ ...prev, isSaving }));
  }, []);

  const resetWizard = useCallback(() => {
    setState(getInitialState());
    setFormData(getEmptyFormData());
  }, []);

  const loadExistingWorld = useCallback((data: Partial<WorldFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setState(prev => ({ ...prev, isDirty: false }));
  }, []);

  const validateCurrentStep = useCallback((): boolean => {
    const currentData = formData;
    
    switch (state.currentStep) {
      case 1:
        return !!(currentData.name && currentData.name.trim().length > 0);
      default:
        return true;
    }
  }, [state.currentStep, formData]);

  const canProceed = useMemo(() => {
    return state.currentStep < TOTAL_STEPS || validateCurrentStep();
  }, [state.currentStep, validateCurrentStep]);

  const canGoBack = useMemo(() => {
    return state.currentStep > 1;
  }, [state.currentStep]);

  const isFirstStep = useMemo(() => {
    return state.currentStep === 1;
  }, [state.currentStep]);

  const isLastStep = useMemo(() => {
    return state.currentStep === TOTAL_STEPS;
  }, [state.currentStep]);

  const stepProgress = useMemo(() => {
    return Math.round((state.currentStep / TOTAL_STEPS) * 100);
  }, [state.currentStep]);

  return {
    state,
    formData,
    goToStep,
    nextStep,
    prevStep,
    updateField,
    updateMultipleFields,
    setSaving,
    resetWizard,
    loadExistingWorld,
    validateCurrentStep,
    canProceed,
    canGoBack,
    isFirstStep,
    isLastStep,
    stepProgress
  };
};
