"use client";
import { useState, useCallback } from "react";

export interface WizardStep {
  id: string;
  label: string;
  labelAr: string;
}

export function useBookingWizard<T extends object>(
  steps: WizardStep[],
  initialData: T
) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<T>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep) / (steps.length - 1)) * 100;

  const next = useCallback(() => {
    if (!isLast) setCurrentStep((s) => s + 1);
  }, [isLast]);

  const back = useCallback(() => {
    if (!isFirst) setCurrentStep((s) => s - 1);
    setError(null);
  }, [isFirst]);

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < steps.length) setCurrentStep(index);
  }, [steps.length]);

  const updateData = useCallback((partial: Partial<T>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setData(initialData);
    setError(null);
  }, [initialData]);

  return {
    currentStep,
    step: steps[currentStep],
    steps,
    data,
    isFirst,
    isLast,
    progress,
    isSubmitting,
    error,
    next,
    back,
    goTo,
    updateData,
    setData,
    setIsSubmitting,
    setError,
    reset,
  };
}
