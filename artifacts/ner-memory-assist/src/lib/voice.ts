import { languageOptions, type Lang } from './i18n';

/**
 * Speak text using the browser/device speech engine in the currently selected language.
 * Returns true when speech was queued successfully and false when speech synthesis is unavailable.
 */
export function speakText(text: string, lang: Lang): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const cleanText = text.trim();
  if (!cleanText) return false;

  const speechLocale =
    languageOptions.find((item) => item.id === lang)?.speechLocale ?? 'en-IN';

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = speechLocale;
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
