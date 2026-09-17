import { languageOptions, type Lang } from './i18n';

function languagePrefix(locale: string): string {
  return locale.toLowerCase().split('-')[0];
}

/**
 * Speak using a voice installed on the device that matches the selected app
 * language. We deliberately do not silently fall back to English: if the
 * device has no voice for the selected language, the caller can show its
 * unsupported-language fallback instead.
 */
export function speakText(text: string, lang: Lang): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const cleanText = text.trim();
  if (!cleanText) return false;

  const speechLocale =
    languageOptions.find((item) => item.id === lang)?.speechLocale ?? 'en-IN';
  const synthesis = window.speechSynthesis;

  try {
    synthesis.cancel();

    const voices = synthesis.getVoices();
    const prefix = languagePrefix(speechLocale);
    const matchingVoice =
      voices.find((voice) => voice.lang.toLowerCase() === speechLocale.toLowerCase()) ??
      voices.find((voice) => languagePrefix(voice.lang) === prefix);

    // Do not speak Indic text with an unrelated English voice.
    if (!matchingVoice && prefix !== 'en') return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = matchingVoice?.lang ?? speechLocale;
    if (matchingVoice) utterance.voice = matchingVoice;
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;
    synthesis.speak(utterance);
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
