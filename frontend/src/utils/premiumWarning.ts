// Global state for triggering premium warning on play attempts
let showPremiumWarningCallback: (() => void) | null = null;

export const triggerPremiumWarning = () => {
  if (showPremiumWarningCallback) {
    showPremiumWarningCallback();
  }
};

export const registerPremiumWarningCallback = (callback: (() => void) | null) => {
  showPremiumWarningCallback = callback;
};
