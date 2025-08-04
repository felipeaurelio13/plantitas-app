import { useState, useCallback, useMemo } from 'react';
import { inputValidationService } from '../services/inputValidationService';
import useAuthStore from '../stores/useAuthStore';

interface UseInputValidationOptions {
  context?: 'plant-chat' | 'garden-chat';
  realTimeValidation?: boolean;
  showCharacterCount?: boolean;
}

interface InputValidationState {
  input: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  characterCount: number;
  wordCount: number;
  hasInteracted: boolean;
}

export const useInputValidation = (options: UseInputValidationOptions = {}) => {
  const {
    context = 'plant-chat',
    realTimeValidation = true,
    showCharacterCount = true,
  } = options;

  const { user } = useAuthStore();
  const [state, setState] = useState<InputValidationState>({
    input: '',
    isValid: false,
    errors: [],
    warnings: [],
    characterCount: 0,
    wordCount: 0,
    hasInteracted: false,
  });

  const validationLimits = useMemo(() => {
    return inputValidationService.getValidationLimits();
  }, []);

  const validateInput = useCallback((input: string, markAsInteracted = false) => {
    const validation = inputValidationService.validateChatInput(
      input,
      user?.id,
      context
    );

    setState(prev => ({
      ...prev,
      input: validation.sanitizedInput || input,
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
      characterCount: validation.characterCount,
      wordCount: validation.wordCount,
      hasInteracted: markAsInteracted || prev.hasInteracted,
    }));

    return validation;
  }, [user?.id, context]);

  const handleInputChange = useCallback((newInput: string) => {
    if (realTimeValidation) {
      validateInput(newInput, true);
    } else {
      setState(prev => ({
        ...prev,
        input: newInput,
        characterCount: newInput.length,
        wordCount: newInput.trim().split(/\s+/).filter(word => word.length > 0).length,
        hasInteracted: true,
      }));
    }
  }, [realTimeValidation, validateInput]);

  const handleSubmit = useCallback((): { isValid: boolean; sanitizedInput: string } => {
    const validation = validateInput(state.input, true);
    return {
      isValid: validation.isValid,
      sanitizedInput: validation.sanitizedInput || state.input,
    };
  }, [state.input, validateInput]);

  const clearInput = useCallback(() => {
    setState({
      input: '',
      isValid: false,
      errors: [],
      warnings: [],
      characterCount: 0,
      wordCount: 0,
      hasInteracted: false,
    });
  }, []);

  const getCharacterCountDisplay = useCallback(() => {
    if (!showCharacterCount) return null;
    
    const remaining = validationLimits.maxLength - state.characterCount;
    const isNearLimit = remaining <= 50;
    const isOverLimit = remaining < 0;

    return {
      current: state.characterCount,
      max: validationLimits.maxLength,
      remaining,
      isNearLimit,
      isOverLimit,
      displayText: `${state.characterCount}/${validationLimits.maxLength}`,
      className: isOverLimit 
        ? 'text-red-500' 
        : isNearLimit 
          ? 'text-yellow-500' 
          : 'text-gray-500',
    };
  }, [showCharacterCount, state.characterCount, validationLimits.maxLength]);

  const getValidationMessages = useCallback(() => {
    // Only show errors/warnings if user has interacted
    if (!state.hasInteracted) return { errors: [], warnings: [] };

    return {
      errors: state.errors,
      warnings: state.warnings,
    };
  }, [state.hasInteracted, state.errors, state.warnings]);

  const isSubmitDisabled = useMemo(() => {
    return !state.isValid || state.input.trim().length === 0;
  }, [state.isValid, state.input]);

  return {
    // State
    input: state.input,
    isValid: state.isValid,
    characterCount: state.characterCount,
    wordCount: state.wordCount,
    hasInteracted: state.hasInteracted,
    
    // Actions
    handleInputChange,
    handleSubmit,
    clearInput,
    validateInput,
    
    // UI helpers
    getCharacterCountDisplay,
    getValidationMessages,
    isSubmitDisabled,
    
    // Config
    validationLimits,
  };
};