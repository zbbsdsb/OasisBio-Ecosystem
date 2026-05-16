import { renderHook, act } from '@testing-library/react';
import { useWorldBuilder } from './useWorldBuilder';
import { WIZARD_STEPS } from '../types/world-builder';

describe('useWorldBuilder Hook', () => {
  const TOTAL_STEPS = WIZARD_STEPS.length;

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useWorldBuilder());

      expect(result.current.state.currentStep).toBe(1);
      expect(result.current.state.totalSteps).toBe(TOTAL_STEPS);
      expect(result.current.state.isDirty).toBe(false);
      expect(result.current.state.isSaving).toBe(false);
      expect(result.current.state.isValid).toBe(false);
    });

    it('should initialize with empty form data', () => {
      const { result } = renderHook(() => useWorldBuilder());

      expect(result.current.formData.name).toBe('');
      expect(result.current.formData.tagline).toBe('');
      expect(result.current.formData.genre).toBe('');
    });

    it('should have correct computed properties on first step', () => {
      const { result } = renderHook(() => useWorldBuilder());

      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isLastStep).toBe(false);
      expect(result.current.canGoBack).toBe(false);
      expect(result.current.stepProgress).toBe(Math.round((1 / TOTAL_STEPS) * 100));
    });
  });

  describe('navigation', () => {
    describe('nextStep', () => {
      it('should increment step', () => {
        const { result } = renderHook(() => useWorldBuilder());

        act(() => {
          result.current.nextStep();
        });

        expect(result.current.state.currentStep).toBe(2);
        expect(result.current.isFirstStep).toBe(false);
      });

      it('should not exceed total steps', () => {
        const { result } = renderHook(() => useWorldBuilder());

        act(() => {
          for (let i = 0; i < TOTAL_STEPS + 5; i++) {
            result.current.nextStep();
          }
        });

        expect(result.current.state.currentStep).toBe(TOTAL_STEPS);
        expect(result.current.isLastStep).toBe(true);
      });
    });

    describe('prevStep', () => {
      it('should decrement step', () => {
        const { result } = renderHook(() => useWorldBuilder());

        act(() => {
          result.current.nextStep();
          result.current.nextStep();
        });

        expect(result.current.state.currentStep).toBe(3);

        act(() => {
          result.current.prevStep();
        });

        expect(result.current.state.currentStep).toBe(2);
      });

      it('should not go below step 1', () => {
        const { result } = renderHook(() => useWorldBuilder());

        act(() => {
          result.current.prevStep();
          result.current.prevStep();
        });

        expect(result.current.state.currentStep).toBe(1);
      });
    });

    describe('goToStep', () => {
      it('should go to specific step', () => {
        const { result } = renderHook(() => useWorldBuilder());

        act(() => {
          result.current.goToStep(4);
        });

        expect(result.current.state.currentStep).toBe(4);
      });

      it('should ignore invalid step numbers', () => {
        const { result } = renderHook(() => useWorldBuilder());

        act(() => {
          result.current.goToStep(0);
        });

        expect(result.current.state.currentStep).toBe(1);

        act(() => {
          result.current.goToStep(TOTAL_STEPS + 10);
        });

        expect(result.current.state.currentStep).toBe(1);
      });

      it('should update computed properties correctly', () => {
        const { result } = renderHook(() => useWorldBuilder());

        act(() => {
          result.current.goToStep(TOTAL_STEPS);
        });

        expect(result.current.isLastStep).toBe(true);
        expect(result.current.canProceed).toBe(true);
        expect(result.current.stepProgress).toBe(100);
      });
    });
  });

  describe('form data management', () => {
    describe('updateField', () => {
      it('should update single field', () => {
        const { result } = renderHook(() => useWorldBuilder());

        act(() => {
          result.current.updateField('name', 'My World');
        });

        expect(result.current.formData.name).toBe('My World');
      });

      it('should set isDirty to true', () => {
        const { result } = renderHook(() => useWorldBuilder());

        expect(result.current.state.isDirty).toBe(false);

        act(() => {
          result.current.updateField('name', 'My World');
        });

        expect(result.current.state.isDirty).toBe(true);
      });

      it('should update different field types', () => {
        const { result } = renderHook(() => useWorldBuilder());

        act(() => {
          result.current.updateField('genre', 'fantasy');
          result.current.updateField('tone', 'dark');
          result.current.updateField('summary', 'A dark fantasy world');
        });

        expect(result.current.formData.genre).toBe('fantasy');
        expect(result.current.formData.tone).toBe('dark');
        expect(result.current.formData.summary).toBe('A dark fantasy world');
      });
    });

    describe('updateMultipleFields', () => {
      it('should update multiple fields at once', () => {
        const { result } = renderHook(() => useWorldBuilder());

        act(() => {
          result.current.updateMultipleFields({
            name: 'Test World',
            tagline: 'A test world',
            genre: 'scifi'
          });
        });

        expect(result.current.formData.name).toBe('Test World');
        expect(result.current.formData.tagline).toBe('A test world');
        expect(result.current.formData.genre).toBe('scifi');
      });

      it('should set isDirty to true', () => {
        const { result } = renderHook(() => useWorldBuilder());

        act(() => {
          result.current.updateMultipleFields({ name: 'Test' });
        });

        expect(result.current.state.isDirty).toBe(true);
      });
    });
  });

  describe('saving state', () => {
    it('should set saving state', () => {
      const { result } = renderHook(() => useWorldBuilder());

      act(() => {
        result.current.setSaving(true);
      });

      expect(result.current.state.isSaving).toBe(true);

      act(() => {
        result.current.setSaving(false);
      });

      expect(result.current.state.isSaving).toBe(false);
    });
  });

  describe('resetWizard', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useWorldBuilder());

      act(() => {
        result.current.updateField('name', 'Test World');
        result.current.nextStep();
        result.current.nextStep();
      });

      expect(result.current.state.currentStep).toBe(3);
      expect(result.current.formData.name).toBe('Test World');
      expect(result.current.state.isDirty).toBe(true);

      act(() => {
        result.current.resetWizard();
      });

      expect(result.current.state.currentStep).toBe(1);
      expect(result.current.formData.name).toBe('');
      expect(result.current.state.isDirty).toBe(false);
    });

    it('should clear all form data', () => {
      const { result } = renderHook(() => useWorldBuilder());

      act(() => {
        result.current.updateMultipleFields({
          name: 'Test',
          genre: 'fantasy',
          tone: 'dark',
          summary: 'Summary'
        });
      });

      act(() => {
        result.current.resetWizard();
      });

      expect(result.current.formData.name).toBe('');
      expect(result.current.formData.genre).toBe('');
      expect(result.current.formData.tone).toBe('');
      expect(result.current.formData.summary).toBe('');
    });
  });

  describe('loadExistingWorld', () => {
    it('should load existing world data', () => {
      const { result } = renderHook(() => useWorldBuilder());

      act(() => {
        result.current.loadExistingWorld({
          name: 'Existing World',
          tagline: 'Already created',
          genre: 'horror'
        });
      });

      expect(result.current.formData.name).toBe('Existing World');
      expect(result.current.formData.tagline).toBe('Already created');
      expect(result.current.formData.genre).toBe('horror');
    });

    it('should set isDirty to false', () => {
      const { result } = renderHook(() => useWorldBuilder());

      act(() => {
        result.current.updateField('name', 'Test');
      });

      expect(result.current.state.isDirty).toBe(true);

      act(() => {
        result.current.loadExistingWorld({ name: 'Loaded World' });
      });

      expect(result.current.state.isDirty).toBe(false);
    });

    it('should preserve existing fields not in update', () => {
      const { result } = renderHook(() => useWorldBuilder());

      act(() => {
        result.current.updateField('name', 'Original');
        result.current.updateField('genre', 'fantasy');
      });

      act(() => {
        result.current.loadExistingWorld({ name: 'Updated Name' });
      });

      expect(result.current.formData.name).toBe('Updated Name');
      expect(result.current.formData.genre).toBe('fantasy');
    });
  });

  describe('validation', () => {
    describe('validateCurrentStep', () => {
      it('should validate step 1 requires name', () => {
        const { result } = renderHook(() => useWorldBuilder());

        expect(result.current.state.currentStep).toBe(1);
        expect(result.current.validateCurrentStep()).toBe(false);

        act(() => {
          result.current.updateField('name', 'My World');
        });

        expect(result.current.validateCurrentStep()).toBe(true);
      });

      it('should validate name with whitespace', () => {
        const { result } = renderHook(() => useWorldBuilder());

        act(() => {
          result.current.updateField('name', '   ');
        });

        expect(result.current.validateCurrentStep()).toBe(false);
      });

      it('should return true for other steps', () => {
        const { result } = renderHook(() => useWorldBuilder());

        act(() => {
          result.current.goToStep(2);
        });

        expect(result.current.validateCurrentStep()).toBe(true);

        act(() => {
          result.current.goToStep(3);
        });

        expect(result.current.validateCurrentStep()).toBe(true);
      });
    });

    describe('canProceed', () => {
      it('should allow proceeding when not on last step', () => {
        const { result } = renderHook(() => useWorldBuilder());

        expect(result.current.canProceed).toBe(true);
      });

      it('should require validation on last step', () => {
        const { result } = renderHook(() => useWorldBuilder());

        act(() => {
          result.current.goToStep(TOTAL_STEPS);
        });

        expect(result.current.canProceed).toBe(true);
      });
    });
  });

  describe('computed properties', () => {
    describe('canGoBack', () => {
      it('should be false on first step', () => {
        const { result } = renderHook(() => useWorldBuilder());

        expect(result.current.canGoBack).toBe(false);
      });

      it('should be true after moving to second step', () => {
        const { result } = renderHook(() => useWorldBuilder());

        act(() => {
          result.current.nextStep();
        });

        expect(result.current.canGoBack).toBe(true);
      });
    });

    describe('stepProgress', () => {
      it('should calculate correct progress', () => {
        const { result } = renderHook(() => useWorldBuilder());

        expect(result.current.stepProgress).toBe(Math.round((1 / TOTAL_STEPS) * 100));

        act(() => {
          result.current.goToStep(3);
        });

        expect(result.current.stepProgress).toBe(Math.round((3 / TOTAL_STEPS) * 100));
      });

      it('should be 100 on last step', () => {
        const { result } = renderHook(() => useWorldBuilder());

        act(() => {
          result.current.goToStep(TOTAL_STEPS);
        });

        expect(result.current.stepProgress).toBe(100);
      });
    });
  });

  describe('complete workflow', () => {
    it('should support complete world creation workflow', () => {
      const { result } = renderHook(() => useWorldBuilder());

      act(() => {
        result.current.updateField('name', 'My Fantasy World');
        result.current.updateField('tagline', 'A magical realm');
        result.current.updateField('genre', 'fantasy');
        result.current.updateField('tone', 'epic');
      });

      expect(result.current.state.isDirty).toBe(true);
      expect(result.current.validateCurrentStep()).toBe(true);

      act(() => {
        result.current.nextStep();
      });

      act(() => {
        result.current.updateField('timePeriod', 'medieval');
        result.current.updateField('timeline', '1000 years of history');
      });

      act(() => {
        result.current.nextStep();
      });

      act(() => {
        result.current.updateField('physicsRules', 'Magic exists');
        result.current.updateField('techLevel', 'pre-industrial');
      });

      act(() => {
        for (let i = result.current.state.currentStep; i < TOTAL_STEPS; i++) {
          result.current.nextStep();
        }
      });

      expect(result.current.isLastStep).toBe(true);
    });
  });
});
