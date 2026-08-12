/**
 * useRegistrationEvents.ts
 * ========================
 * React hook for managing registration event state and lifecycle.
 * Tracks event dispatch progress, errors, and completion status.
 */

import { useCallback, useState } from "react";
import { registrationEventDispatcher, type EventDispatchResult } from "@/lib/services/registration-event-dispatcher";

interface UseRegistrationEventsState {
  isProcessing: boolean;
  error: string | null;
  lastEventId: string | null;
  lastResult: EventDispatchResult | null;
}

interface UseRegistrationEventsReturn extends UseRegistrationEventsState {
  dispatchUserRegistered: (
    userId: string,
    email: string,
    firstName?: string,
    lastName?: string,
    phone?: string
  ) => Promise<EventDispatchResult>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing user registration event dispatch.
 * Usage:
 *   const { isProcessing, error, lastEventId, dispatchUserRegistered } = useRegistrationEvents();
 *   await dispatchUserRegistered(userId, email, firstName, lastName, phone);
 */
export function useRegistrationEvents(): UseRegistrationEventsReturn {
  const [state, setState] = useState<UseRegistrationEventsState>({
    isProcessing: false,
    error: null,
    lastEventId: null,
    lastResult: null,
  });

  const dispatchUserRegistered = useCallback(
    async (
      userId: string,
      email: string,
      firstName?: string,
      lastName?: string,
      phone?: string
    ): Promise<EventDispatchResult> => {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      try {
        const result = await registrationEventDispatcher.dispatchUserRegistered({
          eventType: "UserRegistered",
          timestamp: Date.now(),
          user: {
            id: userId,
            email,
            firstName,
            lastName,
            phone,
          },
          source: "portal",
        });

        setState(prev => ({
          ...prev,
          isProcessing: false,
          lastEventId: result.eventId,
          lastResult: result,
          error: result.success ? null : result.message,
        }));

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: errorMsg,
        }));

        return {
          success: false,
          eventId: "",
          timestamp: Date.now(),
          message: errorMsg,
          errors: [errorMsg],
        };
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      error: null,
      lastEventId: null,
      lastResult: null,
    });
  }, []);

  return {
    ...state,
    dispatchUserRegistered,
    clearError,
    reset,
  };
}
