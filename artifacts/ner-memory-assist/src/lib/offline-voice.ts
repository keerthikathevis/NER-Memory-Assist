export type OfflineVoiceStatus = 'ready' | 'downloaded' | 'unavailable' | 'unsupported' | 'failed';

type AvailabilityResult = 'available' | 'downloadable' | 'downloading' | 'unavailable';
type SpeechRecognitionStatic = {
  available?: (options: { langs: string[]; processLocally: boolean }) => Promise<AvailabilityResult>;
  install?: (options: { langs: string[]; processLocally?: boolean }) => Promise<boolean>;
};

function getSpeechRecognitionStatic(): SpeechRecognitionStatic | undefined {
  if (typeof window === 'undefined') return undefined;
  const browser = window as unknown as {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

/**
 * Prepare on-device recognition for one BCP-47 locale.
 * Language-pack APIs are experimental, so callers must keep an online/browser fallback.
 */
export async function prepareOfflineVoiceLanguage(locale: string): Promise<OfflineVoiceStatus> {
  const api = getSpeechRecognitionStatic();
  if (!api?.available) return 'unsupported';

  try {
    const availability = await api.available({ langs: [locale], processLocally: true });
    if (availability === 'available') return 'ready';
    if (availability === 'unavailable') return 'unavailable';

    // Downloading a missing language pack requires connectivity.
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 'unavailable';
    if (!api.install) return 'unsupported';

    const installed = await api.install({ langs: [locale], processLocally: true });
    return installed ? 'downloaded' : 'failed';
  } catch {
    return 'failed';
  }
}

export function hasOfflineVoiceApi(): boolean {
  const api = getSpeechRecognitionStatic();
  return Boolean(api?.available);
}
