import React from 'react'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { customRender, createMockSession, createMockWorld, flushPromises } from '../test-utils'
import { WorldBuilderPage } from '../../pages/WorldBuilderPage'
import { WorldListPage } from '../../pages/WorldListPage'
import { useWorldBuilder } from '../../hooks/useWorldBuilder'
import type { WorldFormData, WorldBuilderState } from '../../types/world-builder'
import { WIZARD_STEPS, GENRE_OPTIONS, TONE_OPTIONS } from '../../types/world-builder'
import { server, createMockWorldState, createWorldHandlers, resetHandlers } from '../mocks/server'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('World Builder Flow Integration Tests', () => {
  let worldState: ReturnType<typeof createMockWorldState>
  const userId = 'test-user-id'

  beforeAll(() => {
    server.listen()
  })

  afterAll(() => {
    server.close()
  })

  beforeEach(() => {
    worldState = createMockWorldState()
    resetHandlers()
    mockNavigate.mockClear()
  })

  describe('World Creation Flow', () => {
    function WorldBuilderTestWrapper() {
      const {
        state,
        formData,
        goToStep,
        nextStep,
        prevStep,
        updateField,
        updateMultipleFields,
        resetWizard,
        validateCurrentStep,
        canProceed,
        canGoBack,
        isFirstStep,
        isLastStep,
        stepProgress,
      } = useWorldBuilder()

      const handleSave = async () => {
        const response = await fetch('/api/worlds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        return response.json()
      }

      return (
        <div>
          <div data-testid="current-step">{state.currentStep}</div>
          <div data-testid="total-steps">{state.totalSteps}</div>
          <div data-testid="progress">{stepProgress}</div>
          <div data-testid="is-dirty">{state.isDirty ? 'true' : 'false'}</div>
          <div data-testid="can-proceed">{canProceed ? 'true' : 'false'}</div>
          <div data-testid="can-go-back">{canGoBack ? 'true' : 'false'}</div>
          <div data-testid="is-first">{isFirstStep ? 'true' : 'false'}</div>
          <div data-testid="is-last">{isLastStep ? 'true' : 'false'}</div>
          
          <input
            data-testid="name-input"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="World Name"
          />
          
          <select
            data-testid="genre-select"
            value={formData.genre}
            onChange={(e) => updateField('genre', e.target.value)}
          >
            <option value="">Select Genre</option>
            {GENRE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          <select
            data-testid="tone-select"
            value={formData.tone}
            onChange={(e) => updateField('tone', e.target.value)}
          >
            <option value="">Select Tone</option>
            {TONE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          <button onClick={nextStep} data-testid="next-step">Next</button>
          <button onClick={prevStep} data-testid="prev-step}>Previous</button>
          <button onClick={resetWizard} data-testid="reset">Reset</button>
          <button onClick={handleSave} data-testid="save">Save</button>
        </div>
      )
    }

    it('should initialize wizard with correct default state', async () => {
      customRender(<WorldBuilderTestWrapper />)

      expect(screen.getByTestId('current-step')).toHaveTextContent('1')
      expect(screen.getByTestId('total-steps')).toHaveTextContent(String(WIZARD_STEPS.length))
      expect(screen.getByTestId('is-first')).toHaveTextContent('true')
      expect(screen.getByTestId('is-last')).toHaveTextContent('false')
      expect(screen.getByTestId('is-dirty')).toHaveTextContent('false')
    })

    it('should navigate through all 6 steps', async () => {
      const user = userEvent.setup()
      
      customRender(<WorldBuilderTestWrapper />)

      for (let step = 1; step < WIZARD_STEPS.length; step++) {
        const nextButton = screen.getByTestId('next-step')
        await user.click(nextButton)
        
        await waitFor(() => {
          expect(screen.getByTestId('current-step')).toHaveTextContent(String(step + 1))
        })
      }

      expect(screen.getByTestId('is-last')).toHaveTextContent('true')
    })

    it('should not proceed from first step without required fields', async () => {
      const user = userEvent.setup()
      
      customRender(<WorldBuilderTestWrapper />)

      const nextButton = screen.getByTestId('next-step')
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByTestId('current-step')).toHaveTextContent('1')
      })
    })

    it('should complete step 1: Core Identity', async () => {
      const user = userEvent.setup()
      
      customRender(<WorldBuilderTestWrapper />)

      const nameInput = screen.getByTestId('name-input')
      await user.type(nameInput, 'My Fantasy World')

      const genreSelect = screen.getByTestId('genre-select')
      await user.selectOptions(genreSelect, 'fantasy')

      const toneSelect = screen.getByTestId('tone-select')
      await user.selectOptions(toneSelect, 'epic')

      await waitFor(() => {
        expect(screen.getByTestId('is-dirty')).toHaveTextContent('true')
      })

      const nextButton = screen.getByTestId('next-step')
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByTestId('current-step')).toHaveTextContent('2')
      })
    })

    it('should track progress correctly', async () => {
      const user = userEvent.setup()
      
      customRender(<WorldBuilderTestWrapper />)

      expect(screen.getByTestId('progress')).toHaveTextContent('17')

      const nameInput = screen.getByTestId('name-input')
      await user.type(nameInput, 'Test World')

      const nextButton = screen.getByTestId('next-step')
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByTestId('progress')).toHaveTextContent('33')
      })
    })

    it('should go back to previous step', async () => {
      const user = userEvent.setup()
      
      customRender(<WorldBuilderTestWrapper />)

      const nameInput = screen.getByTestId('name-input')
      await user.type(nameInput, 'Test World')

      const nextButton = screen.getByTestId('next-step')
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByTestId('current-step')).toHaveTextContent('2')
      })

      const prevButton = screen.getByTestId('prev-step')
      await user.click(prevButton)

      await waitFor(() => {
        expect(screen.getByTestId('current-step')).toHaveTextContent('1')
      })
    })

    it('should reset wizard to initial state', async () => {
      const user = userEvent.setup()
      
      customRender(<WorldBuilderTestWrapper />)

      const nameInput = screen.getByTestId('name-input')
      await user.type(nameInput, 'Test World')

      await waitFor(() => {
        expect(screen.getByTestId('is-dirty')).toHaveTextContent('true')
      })

      const resetButton = screen.getByTestId('reset')
      await user.click(resetButton)

      await waitFor(() => {
        expect(screen.getByTestId('is-dirty')).toHaveTextContent('false')
        expect(screen.getByTestId('current-step')).toHaveTextContent('1')
        expect(nameInput).toHaveValue('')
      })
    })
  })

  describe('Full Wizard Completion', () => {
    function FullWizardTestWrapper() {
      const {
        state,
        formData,
        nextStep,
        prevStep,
        updateField,
        updateMultipleFields,
        isLastStep,
      } = useWorldBuilder()

      const [savedWorld, setSavedWorld] = React.useState<{ id: string; name: string } | null>(null)
      const [isSaving, setIsSaving] = React.useState(false)

      const handleSave = async () => {
        setIsSaving(true)
        try {
          const response = await fetch('/api/worlds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.name,
              summary: formData.summary,
              timeSetting: formData.timePeriod,
              physicsRules: formData.physicsRules,
              socialStructure: formData.socialStructure,
              geography: formData.geography,
              majorConflict: formData.conflict,
            }),
          })
          const data = await response.json()
          setSavedWorld(data)
        } finally {
          setIsSaving(false)
        }
      }

      return (
        <div>
          <div data-testid="current-step">{state.currentStep}</div>
          <div data-testid="is-last">{isLastStep ? 'true' : 'false'}</div>
          
          {state.currentStep === 1 && (
            <div data-testid="step-1">
              <input
                data-testid="name-input"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="World Name"
              />
              <input
                data-testid="tagline-input"
                value={formData.tagline}
                onChange={(e) => updateField('tagline', e.target.value)}
                placeholder="Tagline"
              />
              <textarea
                data-testid="summary-input"
                value={formData.summary}
                onChange={(e) => updateField('summary', e.target.value)}
                placeholder="Summary"
              />
            </div>
          )}

          {state.currentStep === 2 && (
            <div data-testid="step-2">
              <input
                data-testid="era-name-input"
                value={formData.eraName}
                onChange={(e) => updateField('eraName', e.target.value)}
                placeholder="Era Name"
              />
              <input
                data-testid="time-period-input"
                value={formData.timePeriod}
                onChange={(e) => updateField('timePeriod', e.target.value)}
                placeholder="Time Period"
              />
            </div>
          )}

          {state.currentStep === 3 && (
            <div data-testid="step-3">
              <textarea
                data-testid="physics-input"
                value={formData.physicsRules}
                onChange={(e) => updateField('physicsRules', e.target.value)}
                placeholder="Physics Rules"
              />
            </div>
          )}

          {state.currentStep === 4 && (
            <div data-testid="step-4">
              <textarea
                data-testid="social-input"
                value={formData.socialStructure}
                onChange={(e) => updateField('socialStructure', e.target.value)}
                placeholder="Social Structure"
              />
            </div>
          )}

          {state.currentStep === 5 && (
            <div data-testid="step-5">
              <textarea
                data-testid="geography-input"
                value={formData.geography}
                onChange={(e) => updateField('geography', e.target.value)}
                placeholder="Geography"
              />
            </div>
          )}

          {state.currentStep === 6 && (
            <div data-testid="step-6">
              <textarea
                data-testid="conflict-input"
                value={formData.conflict}
                onChange={(e) => updateField('conflict', e.target.value)}
                placeholder="Major Conflict"
              />
            </div>
          )}

          <button onClick={prevStep} data-testid="prev-step">Previous</button>
          {!isLastStep ? (
            <button onClick={nextStep} data-testid="next-step">Next</button>
          ) : (
            <button onClick={handleSave} data-testid="save-world">Save World</button>
          )}
          
          {isSaving && <div data-testid="saving">Saving...</div>}
          {savedWorld && (
            <div data-testid="saved-world">
              Saved: {savedWorld.name}
            </div>
          )}
        </div>
      )
    }

    it('should complete all 6 steps and save world', async () => {
      const user = userEvent.setup()
      
      setHandlers(...createWorldHandlers(worldState, userId))

      customRender(<FullWizardTestWrapper />)

      const nameInput = screen.getByTestId('name-input')
      await user.type(nameInput, 'Epic Fantasy World')

      const nextButton = screen.getByTestId('next-step')
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByTestId('step-2')).toBeInTheDocument()
      })

      const eraNameInput = screen.getByTestId('era-name-input')
      await user.type(eraNameInput, 'Age of Heroes')

      await user.click(screen.getByTestId('next-step'))

      await waitFor(() => {
        expect(screen.getByTestId('step-3')).toBeInTheDocument()
      })

      const physicsInput = screen.getByTestId('physics-input')
      await user.type(physicsInput, 'Magic exists alongside technology')

      await user.click(screen.getByTestId('next-step'))

      await waitFor(() => {
        expect(screen.getByTestId('step-4')).toBeInTheDocument()
      })

      const socialInput = screen.getByTestId('social-input')
      await user.type(socialInput, 'Feudal system with magical guilds')

      await user.click(screen.getByTestId('next-step'))

      await waitFor(() => {
        expect(screen.getByTestId('step-5')).toBeInTheDocument()
      })

      const geographyInput = screen.getByTestId('geography-input')
      await user.type(geographyInput, 'Vast continents with floating islands')

      await user.click(screen.getByTestId('next-step'))

      await waitFor(() => {
        expect(screen.getByTestId('step-6')).toBeInTheDocument()
        expect(screen.getByTestId('is-last')).toHaveTextContent('true')
      })

      const conflictInput = screen.getByTestId('conflict-input')
      await user.type(conflictInput, 'War between ancient gods and new order')

      const saveButton = screen.getByTestId('save-world')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByTestId('saved-world')).toBeInTheDocument()
      })

      expect(screen.getByTestId('saved-world')).toHaveTextContent('Epic Fantasy World')
    })
  })

  describe('World Editing', () => {
    function WorldEditTestWrapper({ worldId }: { worldId: string }) {
      const [world, setWorld] = React.useState<WorldFormData | null>(null)
      const [isLoading, setIsLoading] = React.useState(true)
      const [isSaving, setIsSaving] = React.useState(false)

      const loadWorld = async () => {
        setIsLoading(true)
        const response = await fetch(`/api/worlds/${worldId}`)
        const data = await response.json()
        setWorld(data)
        setIsLoading(false)
      }

      const saveWorld = async () => {
        setIsSaving(true)
        await fetch(`/api/worlds/${worldId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(world),
        })
        setIsSaving(false)
      }

      React.useEffect(() => {
        loadWorld()
      }, [worldId])

      if (isLoading) {
        return <div data-testid="loading">Loading...</div>
      }

      return (
        <div>
          <input
            data-testid="name-input"
            value={world?.name || ''}
            onChange={(e) => setWorld(prev => prev ? { ...prev, name: e.target.value } : null)}
          />
          <textarea
            data-testid="summary-input"
            value={world?.summary || ''}
            onChange={(e) => setWorld(prev => prev ? { ...prev, summary: e.target.value } : null)}
          />
          <button onClick={saveWorld} data-testid="save-button">Save</button>
          {isSaving && <div data-testid="saving">Saving...</div>}
        </div>
      )
    }

    it('should load existing world for editing', async () => {
      worldState.worlds = [
        {
          id: 'world-1',
          userId,
          name: 'Existing World',
          summary: 'A world to edit',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      
      setHandlers(...createWorldHandlers(worldState, userId))

      customRender(<WorldEditTestWrapper worldId="world-1" />)

      await waitFor(() => {
        expect(screen.getByTestId('name-input')).toHaveValue('Existing World')
        expect(screen.getByTestId('summary-input')).toHaveValue('A world to edit')
      })
    })

    it('should save changes to existing world', async () => {
      const user = userEvent.setup()
      
      worldState.worlds = [
        {
          id: 'world-1',
          userId,
          name: 'Existing World',
          summary: 'A world to edit',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      
      setHandlers(...createWorldHandlers(worldState, userId))

      customRender(<WorldEditTestWrapper worldId="world-1" />)

      await waitFor(() => {
        expect(screen.getByTestId('name-input')).toBeInTheDocument()
      })

      const nameInput = screen.getByTestId('name-input')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated World Name')

      const saveButton = screen.getByTestId('save-button')
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByTestId('saving')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.queryByTestId('saving')).not.toBeInTheDocument()
      })

      expect(worldState.worlds[0].name).toBe('Updated World Name')
    })
  })

  describe('World List and Loading', () => {
    function WorldListTestWrapper() {
      const [worlds, setWorlds] = React.useState<typeof worldState.worlds>([])
      const [isLoading, setIsLoading] = React.useState(true)

      React.useEffect(() => {
        fetch('/api/worlds')
          .then(res => res.json())
          .then(data => {
            setWorlds(data)
            setIsLoading(false)
          })
      }, [])

      if (isLoading) {
        return <div data-testid="loading">Loading...</div>
      }

      return (
        <ul data-testid="world-list">
          {worlds.map(world => (
            <li key={world.id} data-testid={`world-${world.id}`}>
              {world.name}
            </li>
          ))}
        </ul>
      )
    }

    it('should load and display world list', async () => {
      worldState.worlds = [
        { id: 'world-1', userId, name: 'World One', summary: '', createdAt: new Date(), updatedAt: new Date() },
        { id: 'world-2', userId, name: 'World Two', summary: '', createdAt: new Date(), updatedAt: new Date() },
      ]
      
      setHandlers(...createWorldHandlers(worldState, userId))

      customRender(<WorldListTestWrapper />)

      await waitFor(() => {
        expect(screen.getByTestId('world-world-1')).toBeInTheDocument()
        expect(screen.getByTestId('world-world-2')).toBeInTheDocument()
      })
    })

    it('should show empty state when no worlds exist', async () => {
      setHandlers(...createWorldHandlers(worldState, userId))

      customRender(<WorldListTestWrapper />)

      await waitFor(() => {
        expect(screen.getByTestId('world-list')).toBeInTheDocument()
        expect(screen.queryByTestId(/world-/)).not.toBeInTheDocument()
      })
    })

    it('should delete a world', async () => {
      const user = userEvent.setup()
      
      worldState.worlds = [
        { id: 'world-1', userId, name: 'World to Delete', summary: '', createdAt: new Date(), updatedAt: new Date() },
      ]
      
      setHandlers(...createWorldHandlers(worldState, userId))

      function WorldListWithDelete() {
        const [worlds, setWorlds] = React.useState(worldState.worlds)

        const deleteWorld = async (id: string) => {
          await fetch(`/api/worlds/${id}`, { method: 'DELETE' })
          setWorlds(prev => prev.filter(w => w.id !== id))
        }

        return (
          <ul>
            {worlds.map(world => (
              <li key={world.id} data-testid={`world-${world.id}`}>
                {world.name}
                <button onClick={() => deleteWorld(world.id)} data-testid={`delete-${world.id}`}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )
      }

      customRender(<WorldListWithDelete />)

      const deleteButton = screen.getByTestId('delete-world-1')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.queryByTestId('world-world-1')).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    function ValidationTestWrapper() {
      const {
        formData,
        updateField,
        validateCurrentStep,
        state,
      } = useWorldBuilder()

      const [validationError, setValidationError] = React.useState<string | null>(null)

      const handleValidate = () => {
        const isValid = validateCurrentStep()
        setValidationError(isValid ? null : 'Name is required')
      }

      return (
        <div>
          <input
            data-testid="name-input"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="World Name"
          />
          <button onClick={handleValidate} data-testid="validate">Validate</button>
          {validationError && (
            <div data-testid="validation-error">{validationError}</div>
          )}
          <div data-testid="current-step">{state.currentStep}</div>
        </div>
      )
    }

    it('should validate required fields on step 1', async () => {
      const user = userEvent.setup()
      
      customRender(<ValidationTestWrapper />)

      const validateButton = screen.getByTestId('validate')
      await user.click(validateButton)

      await waitFor(() => {
        expect(screen.getByTestId('validation-error')).toHaveTextContent('Name is required')
      })
    })

    it('should pass validation when required fields are filled', async () => {
      const user = userEvent.setup()
      
      customRender(<ValidationTestWrapper />)

      const nameInput = screen.getByTestId('name-input')
      await user.type(nameInput, 'Valid World Name')

      const validateButton = screen.getByTestId('validate')
      await user.click(validateButton)

      await waitFor(() => {
        expect(screen.queryByTestId('validation-error')).not.toBeInTheDocument()
      })
    })
  })
})

function setHandlers(...handlers: Parameters<typeof server.use>[0]) {
  server.use(...handlers)
}
