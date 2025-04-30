import { useConsentStore } from '../store/consentStore';

type ConsentOptions = {
  title: string;
  message: string;
};

/**
 * Hook for requesting user consent
 * Returns a function that can be used to request user consent
 * for various application actions
 */
export function useConsent() {
  const { addConsentRequest } = useConsentStore();

  /**
   * Request user consent for an action
   * @param options The consent request options
   * @returns A promise that resolves when the user approves, rejects when denied
   */
  const requestConsent = (options: ConsentOptions): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      addConsentRequest({
        title: options.title,
        message: options.message,
        onApprove: () => resolve(true),
        onDeny: () => reject(new Error('User denied consent'))
      });
    });
  };

  return {
    requestConsent
  };
}