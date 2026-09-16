export type OfflineVoiceRecognition = {
  available: boolean;
  processLocally: boolean;
  install?: () => Promise<void>;
};

/**
 * Detects the experimental Web Speech on-device recognition capability.
 * Browsers that expose SpeechRecognition.available/install can optionally
 * download a language pack and then process recognition locally.
 */
export function getOfflineVoiceCapability(): OfflineVoiceRecognition {
  if (typeof window === 'undefined') return { available: false, processLocally: false };

  const browser = window as unknown as {
    SpeechRecognition?: { available?: () => Promise<boolean>; install?: (options: { langs: string[] }) => Promise<boolean> };
    webkitSpeechRecognition?: { available?: () => Promise<boolean>; install?: (options: { langs: string[] }) => Promise<boolean> };
  };

  const api = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
  return {
    available: typeof api?.available === 'function',
    processLocally: typeof api?.install === 'function',
    install: typeof api?.install === 'function' ? undefined : undefined,
  };
}

export async function ensureOfflineVoiceLanguage(locale: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const browser = window as unknown as {
    SpeechRecognition?: { available?: () => Promise<boolean>; install?: (options: { langs: string[] }) => Promise<boolean> };
    webkitSpeechRecognition?: { available?: () => Promise<boolean>; install?: (options: { langs: string[] }) => Promise<boolean> };
  };
  const api = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
  if (!api?.install) return false;

  try {
    const installed = await api.install({ langs: [locale] });
    return installed !== false;
  } catch {
    return false;
  }
}
