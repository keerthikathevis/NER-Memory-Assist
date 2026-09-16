import type { Lang } from './i18n';

const commandAliases: Record<Lang, Record<string, string>> = {
  en: { help:'HELP', repeat:'REPEAT', start:'START', pause:'PAUSE', stop:'STOP', continue:'CONTINUE', home:'HOME', easier:'EASIER', harder:'HARDER', games:'OPEN_GAMES', medicine:'OPEN_MEDICINE', music:'OPEN_MUSIC', memories:'OPEN_MEMORIES', progress:'OPEN_PROGRESS', settings:'OPEN_SETTINGS' },
  ta: { 'உதவி':'HELP', 'மீண்டும்':'REPEAT', 'தொடங்கு':'START', 'இடைநிறுத்து':'PAUSE', 'நிறுத்து':'STOP', 'தொடரவும்':'CONTINUE', 'முகப்பு':'HOME', 'எளிதாக':'EASIER', 'கடினமாக':'HARDER', 'விளையாட்டுகள்':'OPEN_GAMES', 'மருந்து':'OPEN_MEDICINE', 'இசை':'OPEN_MUSIC', 'நினைவுகள்':'OPEN_MEMORIES', 'முன்னேற்றம்':'OPEN_PROGRESS', 'அமைப்புகள்':'OPEN_SETTINGS' },
  hi: { 'मदद':'HELP', 'दोहराएं':'REPEAT', 'शुरू':'START', 'रोकें':'PAUSE', 'बंद':'STOP', 'जारी':'CONTINUE', 'होम':'HOME', 'आसान':'EASIER', 'कठिन':'HARDER', 'गेम':'OPEN_GAMES', 'दवा':'OPEN_MEDICINE', 'संगीत':'OPEN_MUSIC', 'यादें':'OPEN_MEMORIES', 'प्रगति':'OPEN_PROGRESS', 'सेटिंग्स':'OPEN_SETTINGS' },
  as: { 'সহায়':'HELP', 'সহায়তা':'HELP', 'পুনৰাবৃত্তি':'REPEAT', 'আৰম্ভ':'START', 'ৰখাওক':'PAUSE', 'বন্ধ':'STOP', 'আগবাঢ়ক':'CONTINUE', 'ঘৰ':'HOME', 'সহজ':'EASIER', 'কঠিন':'HARDER', 'খেল':'OPEN_GAMES', 'ঔষধ':'OPEN_MEDICINE', 'সংগীত':'OPEN_MUSIC', 'স্মৃতি':'OPEN_MEMORIES', 'অগ্ৰগতি':'OPEN_PROGRESS', 'ছেটিংছ':'OPEN_SETTINGS' },
  bn: { 'সাহায্য':'HELP', 'আবার':'REPEAT', 'শুরু':'START', 'বিরতি':'PAUSE', 'থামুন':'STOP', 'চালিয়ে':'CONTINUE', 'হোম':'HOME', 'সহজ':'EASIER', 'কঠিন':'HARDER', 'খেলা':'OPEN_GAMES', 'ওষুধ':'OPEN_MEDICINE', 'সঙ্গীত':'OPEN_MUSIC', 'স্মৃতি':'OPEN_MEMORIES', 'অগ্রগতি':'OPEN_PROGRESS', 'সেটিংস':'OPEN_SETTINGS' },
  brx: {}, mni: {}, kha: {}, lus: {}, ne: { 'मद्दत':'HELP', 'सहायता':'HELP', 'दोहोऱ्याउनुहोस्':'REPEAT', 'सुरु':'START', 'रोक्नुहोस्':'PAUSE', 'बन्द':'STOP', 'जारी':'CONTINUE', 'गृह':'HOME', 'सजिलो':'EASIER', 'गाह्रो':'HARDER', 'खेल':'OPEN_GAMES', 'औषधि':'OPEN_MEDICINE', 'संगीत':'OPEN_MUSIC', 'स्मृति':'OPEN_MEMORIES', 'प्रगति':'OPEN_PROGRESS', 'सेटिङ':'OPEN_SETTINGS' },
};

const normalize = (value: string) => value.trim().toLocaleLowerCase();

export function resolveMultilingualVoiceCommand(lang: Lang, transcript: string): string | undefined {
  const text = normalize(transcript);
  const aliases = commandAliases[lang] ?? {};
  for (const [phrase, command] of Object.entries(aliases)) {
    if (text === phrase || text.includes(phrase)) return command;
  }
  return undefined;
}
