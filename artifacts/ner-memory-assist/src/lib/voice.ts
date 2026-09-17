import { languageOptions, type Lang } from './i18n';

function languagePrefix(locale: string): string {
  return locale.toLowerCase().split('-')[0];
}

function findMatchingVoice(locale: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const prefix = languagePrefix(locale);
  return voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase())
    ?? voices.find((voice) => languagePrefix(voice.lang) === prefix);
}

function speakNow(text: string, locale: string): boolean {
  const synthesis = window.speechSynthesis;
  const matchingVoice = findMatchingVoice(locale);
  const prefix = languagePrefix(locale);

  // Never silently read non-English text with an unrelated English voice.
  if (!matchingVoice && prefix !== 'en') return false;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = matchingVoice?.lang ?? locale;
  if (matchingVoice) utterance.voice = matchingVoice;
  utterance.rate = 0.85;
  utterance.pitch = 1;
  utterance.volume = 1;
  synthesis.speak(utterance);
  return true;
}

/**
 * Speak using the selected language when the browser/device provides a
 * matching voice. Some browsers populate their voice list asynchronously,
 * so we retry once after the voiceschanged event.
 */
export function speakText(text: string, lang: Lang): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const cleanText = text.trim();
  if (!cleanText) return false;

  const speechLocale = languageOptions.find((item) => item.id === lang)?.speechLocale ?? 'en-IN';
  const synthesis = window.speechSynthesis;

  try {
    synthesis.cancel();
    if (speakNow(cleanText, speechLocale)) return true;

    let handled = false;
    const retry = () => {
      if (handled) return;
      handled = true;
      synthesis.removeEventListener('voiceschanged', retry);
      try {
        speakNow(cleanText, speechLocale);
      } catch {
        // Ignore browser-specific synthesis errors.
      }
    };

    synthesis.addEventListener('voiceschanged', retry, { once: true });
    window.setTimeout(() => {
      if (!handled) {
        handled = true;
        synthesis.removeEventListener('voiceschanged', retry);
      }
    }, 1500);
    return false;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
