import React, { useState, useCallback } from 'react';
import { Modal } from '../Modal';

export interface WizardStep {
  id: string;
  title: string;
  content: React.ReactNode;
  validation?: () => boolean | Promise<boolean>;
  nextButtonText?: string;
  previousButtonText?: string;
  canSkip?: boolean;
  isOptional?: boolean;
}

export interface WizardCaptions {
  nextCaption?: string;
  previousCaption?: string;
  finishCaption?: string;
  cancelCaption?: string;
  skipCaption?: string;
}

export interface WizardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Array of wizard steps.
   */
  steps: WizardStep[];
  /**
   * Whether the wizard is open/visible.
   */
  isOpen: boolean;
  /**
   * Callback when wizard is completed.
   */
  onComplete: (currentStep: number) => void;
  /**
   * Callback when wizard is cancelled.
   */
  onCancel: () => void;
  /**
   * Callback when step changes.
   */
  onStepChange?: (stepIndex: number) => void;
  /**
   * Whether to allow cancellation
   */
  allowCancel?: boolean;
  /**
   * Whether to show progress indicator.
   */
  showProgress?: boolean;
  /**
   * Whether to show step numbers.
   */
  showStepNumbers?: boolean;
  /**
   * Whether users can click on steps to navigate.
   */
  allowStepClick?: boolean;
  /**
   * Size of the wizard modal.
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Custom button captions.
   */
  captions?: WizardCaptions;
}

export interface WizardState {
  currentStep: number;
  completedSteps: Set<number>;
  stepErrors: Map<number, string>;
  isValidating: boolean;
}

const Wizard = React.forwardRef<HTMLDivElement, WizardProps>(
  ({
    steps,
    isOpen,
    onComplete,
    onCancel,
    onStepChange,
    allowCancel = true,
    showProgress = true,
    showStepNumbers = true,
    allowStepClick = false,
    size = 'xl',
    captions = {},
    className = '',
    ...rest
  }, ref) => {
    const [state, setState] = useState<WizardState>({
      currentStep: 0,
      completedSteps: new Set(),
      stepErrors: new Map(),
      isValidating: false
    });

    const {
      nextCaption = 'Next',
      previousCaption = 'Previous',
      finishCaption = 'Finish',
      cancelCaption = 'Cancel',
      skipCaption = 'Skip'
    } = captions;

    const currentStepData = steps[state.currentStep];
    const isFirstStep = state.currentStep === 0;
    const isLastStep = state.currentStep === steps.length - 1;

    const updateState = useCallback((updates: Partial<WizardState>) => {
      setState(prev => ({ ...prev, ...updates }));
    }, []);

    const validateCurrentStep = useCallback(async (): Promise<boolean> => {
      if (!currentStepData?.validation) return true;

      updateState({ isValidating: true });

      try {
        const isValid = await currentStepData.validation();

        if (!isValid) {
          updateState({
            stepErrors: new Map(state.stepErrors.set(state.currentStep, 'Please complete this step before continuing')),
            isValidating: false
          });
          return false;
        }

        // Clear any existing error for this step
        const newErrors = new Map(state.stepErrors);
        newErrors.delete(state.currentStep);

        updateState({
          stepErrors: newErrors,
          isValidating: false
        });

        return true;
      } catch (error) {
        updateState({
          stepErrors: new Map(state.stepErrors.set(state.currentStep, 'Validation failed')),
          isValidating: false
        });
        return false;
      }
    }, [currentStepData, state.currentStep, state.stepErrors, updateState]);

    const goToStep = useCallback(async (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex >= steps.length) return;

      // If moving forward, validate current step
      if (stepIndex > state.currentStep) {
        const isValid = await validateCurrentStep();
        if (!isValid) return;

        // Mark current step as completed
        updateState({
          completedSteps: new Set([...state.completedSteps, state.currentStep])
        });
      }

      updateState({ currentStep: stepIndex });
      onStepChange?.(stepIndex);
    }, [steps.length, state.currentStep, state.completedSteps, validateCurrentStep, updateState, onStepChange]);

    const handleNext = useCallback(async () => {
      if (isLastStep) {
        const isValid = await validateCurrentStep();
        if (isValid) {
          onComplete(state.currentStep);
        }
      } else {
        await goToStep(state.currentStep + 1);
      }
    }, [isLastStep, state.currentStep, validateCurrentStep, onComplete, goToStep]);

    const handlePrevious = useCallback(() => {
      goToStep(state.currentStep - 1);
    }, [state.currentStep, goToStep]);

    const handleStepClick = useCallback((stepIndex: number) => {
      if (!allowStepClick) return;

      // Only allow clicking on completed steps or the current step
      if (stepIndex <= state.currentStep || state.completedSteps.has(stepIndex)) {
        goToStep(stepIndex);
      }
    }, [allowStepClick, state.currentStep, state.completedSteps, goToStep]);

    const handleSkip = useCallback(() => {
      if (currentStepData?.canSkip) {
        goToStep(state.currentStep + 1);
      }
    }, [currentStepData, state.currentStep, goToStep]);

    const getStepStatus = useCallback((stepIndex: number) => {
      if (state.completedSteps.has(stepIndex)) return 'completed';
      if (stepIndex === state.currentStep) return 'current';
      if (stepIndex < state.currentStep) return 'completed';
      return 'pending';
    }, [state.completedSteps, state.currentStep]);

    const renderProgressIndicator = () => {
      if (!showProgress) return null;

      return (
        <div
          className="wizard__progress"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '24px'
          }}
        >
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable = allowStepClick && (index <= state.currentStep || state.completedSteps.has(index));

            return (
              <React.Fragment key={step.id}>
                <div
                  className={`wizard__step ${status === 'current' ? 'wizard__step--current' : ''} ${status === 'completed' ? 'wizard__step--completed' : ''} ${status === 'pending' ? 'wizard__step--pending' : ''} ${isClickable ? 'wizard__step--clickable' : ''}`.trim()}
                  onClick={() => handleStepClick(index)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: isClickable ? 'pointer' : 'default',
                    opacity: status === 'pending' ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Step circle */}
                  <div
                    className="wizard__step-circle"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: '2px solid',
                      borderColor: status === 'completed' ? '#22c55e' : status === 'current' ? '#3b82f6' : 'rgba(255, 255, 255, 0.3)',
                      backgroundColor: status === 'completed' ? 'rgba(34, 197, 94, 0.2)' : status === 'current' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: status === 'completed' ? '#22c55e' : status === 'current' ? '#3b82f6' : 'rgba(255, 255, 255, 0.7)'
                    }}
                  >
                    {status === 'completed' ? (
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : showStepNumbers ? (
                      index + 1
                    ) : null}
                  </div>

                  {/* Step title */}
                  <span
                    className="wizard__step-title"
                    style={{
                      fontSize: '12px',
                      color: status === 'current' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                      textAlign: 'center',
                      maxWidth: '80px',
                      wordBreak: 'break-word'
                    }}
                  >
                    {step.title}
                  </span>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={`wizard__connector ${index < state.currentStep ? 'wizard__connector--completed' : ''}`.trim()}
                    style={{
                      width: '40px',
                      height: '2px',
                      backgroundColor: index < state.currentStep ? '#22c55e' : 'rgba(255, 255, 255, 0.2)',
                      transition: 'background-color 0.2s'
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      );
    };

    const renderStepContent = () => {
      const hasError = state.stepErrors.has(state.currentStep);
      const errorMessage = state.stepErrors.get(state.currentStep);

      return (
        <div
          className="wizard__content"
          style={{
            padding: '0 24px 24px 24px',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {/* Step title */}
          <h2
            className="wizard__step-content-title"
            style={{
              margin: '0 0 24px 0',
              fontSize: '24px',
              fontWeight: '600',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {currentStepData?.title}
            {currentStepData?.isOptional && (
              <span
                className="wizard__optional-label"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '12px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                (Optional)
              </span>
            )}
          </h2>

          {/* Error message */}
          {hasError && (
            <div
              className="wizard__error"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '20px',
                color: '#ef4444',
                fontSize: '14px'
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Step content */}
          <div className="wizard__step-body">
            {currentStepData?.content}
          </div>
        </div>
      );
    };

    const renderFooter = () => {
      // Add spinner animation CSS if not already present
      if (!document.querySelector('#wizard-spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'wizard-spinner-styles';
        style.textContent = `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }

      return (
        <div
          className="wizard__footer"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div className="wizard__footer-left">
            {currentStepData?.canSkip && !isLastStep && (
              <button
                className="wizard__skip-button"
                onClick={handleSkip}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.1)';
                  (e.target as HTMLButtonElement).style.color = '#ffffff';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.05)';
                  (e.target as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.7)';
                }}
              >
                {skipCaption}
              </button>
            )}
          </div>

          <div
            className="wizard__footer-right"
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}
          >
            {allowCancel && cancelCaption && (
              <button
                className="wizard__cancel-button"
                onClick={onCancel}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.1)';
                  (e.target as HTMLButtonElement).style.color = '#ffffff';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.05)';
                  (e.target as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.7)';
                }}
              >
                {cancelCaption}
              </button>
            )}

            {!isFirstStep && (
              <button
                className="wizard__previous-button"
                onClick={handlePrevious}
                disabled={state.isValidating}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  cursor: state.isValidating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: state.isValidating ? 0.6 : 1
                }}
                onMouseOver={(e) => {
                  if (!state.isValidating) {
                    (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                {currentStepData?.previousButtonText || previousCaption}
              </button>
            )}

            <button
              className="wizard__next-button"
              onClick={handleNext}
              disabled={state.isValidating}
              style={{
                background: state.isValidating ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#3b82f6',
                borderRadius: '6px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: state.isValidating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: state.isValidating ? 0.8 : 1
              }}
              onMouseOver={(e) => {
                if (!state.isValidating) {
                  (e.target as HTMLButtonElement).style.background = 'rgba(59, 130, 246, 0.3)';
                  (e.target as HTMLButtonElement).style.borderColor = 'rgba(59, 130, 246, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.background = state.isValidating ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)';
                (e.target as HTMLButtonElement).style.borderColor = 'rgba(59, 130, 246, 0.3)';
              }}
            >
              {state.isValidating && (
                <div
                  className="wizard__loading-spinner"
                  style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(59, 130, 246, 0.3)',
                    borderTop: '2px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
              )}
              {isLastStep
                ? finishCaption
                : currentStepData?.nextButtonText || nextCaption}
            </button>
          </div>
        </div>
      );
    };

    if (!isOpen) return null;

    return (
      <Modal
        isOpen={isOpen}
        onClose={onCancel}
        size={size}
        closeOnOverlayClick={false}
        showCloseButton={false}
      >
        <div
          ref={ref}
          className={`wizard ${className}`.trim()}
          {...rest}
        >
          {renderProgressIndicator()}
          {renderStepContent()}
          {renderFooter()}
        </div>
      </Modal>
    );
  }
);

Wizard.displayName = "Wizard";

export { Wizard };
export default Wizard;