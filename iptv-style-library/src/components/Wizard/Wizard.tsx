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
    showProgress = true,
    showStepNumbers = true,
    allowStepClick = false,
    size = 'lg',
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
        <div className="wizard__progress">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable = allowStepClick && (index <= state.currentStep || state.completedSteps.has(index));

            return (
              <React.Fragment key={step.id}>
                <div
                  className={`wizard__step ${status === 'current' ? 'wizard__step--current' : ''} ${status === 'completed' ? 'wizard__step--completed' : ''} ${status === 'pending' ? 'wizard__step--pending' : ''} ${isClickable ? 'wizard__step--clickable' : ''}`.trim()}
                  onClick={() => handleStepClick(index)}
                >
                  {/* Step circle */}
                  <div className="wizard__step-circle">
                    {status === 'completed' ? (
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : showStepNumbers ? (
                      index + 1
                    ) : null}
                  </div>

                  {/* Step title */}
                  <span className="wizard__step-title">
                    {step.title}
                  </span>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className={`wizard__connector ${index < state.currentStep ? 'wizard__connector--completed' : ''}`.trim()} />
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
        <div className="wizard__content">
          {/* Step title */}
          <h2 className="wizard__step-content-title">
            {currentStepData?.title}
            {currentStepData?.isOptional && (
              <span className="wizard__optional-label">(Optional)</span>
            )}
          </h2>

          {/* Error message */}
          {hasError && (
            <div className="wizard__error">
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
      return (
        <div className="wizard__footer">
          <div className="wizard__footer-left">
            {currentStepData?.canSkip && !isLastStep && (
              <button
                className="wizard__skip-button"
                onClick={handleSkip}
              >
                {skipCaption}
              </button>
            )}
          </div>

          <div className="wizard__footer-right">
            <button
              className="wizard__cancel-button"
              onClick={onCancel}
            >
              {cancelCaption}
            </button>

            {!isFirstStep && (
              <button
                className="wizard__previous-button"
                onClick={handlePrevious}
                disabled={state.isValidating}
              >
                {currentStepData?.previousButtonText || previousCaption}
              </button>
            )}

            <button
              className="wizard__next-button"
              onClick={handleNext}
              disabled={state.isValidating}
            >
              {state.isValidating && (
                <div className="wizard__loading-spinner" />
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