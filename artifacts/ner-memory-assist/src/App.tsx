import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity, ArrowLeft, Bell, BellRing, BookOpen, Brain, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, Clock3,
  CloudOff, Flower2, Gamepad2, Heart, Home as HomeIcon, Languages, Lightbulb, LockKeyhole,
  Menu, Mic, Pause, Pencil, Play, Plus, RotateCcw, Settings as SettingsIcon,
  Download, ShieldAlert, ShieldCheck, Sparkles, Square, Star, Stethoscope, Sun, Trash2, Trophy, UserRound, UsersRound, Volume1, Volume2,
  Wifi, X, type LucideIcon,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { adaptDifficulty, scoreGame, type Difficulty, type GameResult } from '@/lib/adaptive-engine';
import { culturalItems, type CulturalItem } from '@/lib/game-data';
import { languageOptions, resolveVoiceCommand, t, type CopyKey, type Lang, type Role } from '@/lib/i18n';
import { speakText } from '@/lib/voice';
import { getOfflineVoiceCapability, ensureOfflineVoiceLanguage } from '@/lib/offline-voice';
import { getSpeechRecognitionLocale } from '@/lib/voiceLocales';
import { resolveMultilingualVoiceCommand } from '@/lib/voiceCommand';
import { dateKey, isScheduledForDate, type MedicineEvent, type MedicineEventStatus, type MedicineSchedule } from '@/lib/medicine';
import { notificationPermission, requestNotificationPermission, sendMedicineNotification } from '@/lib/notifications';
import { clearLocalDataMirror, clearMedicineData, getEmergencyContacts, saveEmergencyContacts, getGameResults, getMedicineEvents, getMedicineSchedules, getMemoryProfiles, readStore, saveGameResult, saveMedicineEvent, saveMedicineSchedules, type EmergencyContact, type MemoryProfile, writeStore } from '@/lib/storage';
import { clearSyncQueue, getSyncQueue, resolveSyncConflict, syncService, type SyncRecord } from '@/lib/sync-service';

const queryClient = new QueryClient();

const tr = (lang: Lang, key: CopyKey) => t(lang, key);

const relationshipLabels: Record<Lang, Record<string, string>> = {
  en: { Father: 'Father', Mother: 'Mother', Husband: 'Husband', Wife: 'Wife', Son: 'Son', Daughter: 'Daughter', Brother: 'Brother', Sister: 'Sister', Grandfather: 'Grandfather', Grandmother: 'Grandmother', Grandson: 'Grandson', Granddaughter: 'Granddaughter', Uncle: 'Uncle', Aunt: 'Aunt', Cousin: 'Cousin', Nephew: 'Nephew', Niece: 'Niece', Friend: 'Friend', Neighbour: 'Neighbour', Caregiver: 'Caregiver', Teacher: 'Teacher', Other: 'Other' },
  ta: { Father: 'தந்தை', Mother: 'தாய்', Husband: 'கணவர்', Wife: 'மனைவி', Son: 'மகன்', Daughter: 'மகள்', Brother: 'சகோதரர்', Sister: 'சகோதரி', Grandfather: 'தாத்தா', Grandmother: 'பாட்டி', Grandson: 'பேரன்', Granddaughter: 'பேத்தி', Uncle: 'மாமா', Aunt: 'அத்தை', Cousin: 'உறவினர்', Nephew: 'மருமகன்', Niece: 'மருமகள்', Friend: 'நண்பர்', Neighbour: 'அண்டை வீட்டார்', Caregiver: 'பராமரிப்பாளர்', Teacher: 'ஆசிரியர்', Other: 'மற்றவர்' },
  hi: { Father: 'पिता', Mother: 'माता', Husband: 'पति', Wife: 'पत्नी', Son: 'बेटा', Daughter: 'बेटी', Brother: 'भाई', Sister: 'बहन', Grandfather: 'दादा/नाना', Grandmother: 'दादी/नानी', Grandson: 'पोता/नाती', Granddaughter: 'पोती/नातिन', Uncle: 'चाचा/मामा', Aunt: 'चाची/मौसी', Cousin: 'चचेरा/ममेरा भाई-बहन', Nephew: 'भतीजा/भांजा', Niece: 'भतीजी/भांजी', Friend: 'दोस्त', Neighbour: 'पड़ोसी', Caregiver: 'देखभालकर्ता', Teacher: 'शिक्षक', Other: 'अन्य' },
  as: { Father: 'দেউতা', Mother: 'মা', Husband: 'স্বামী', Wife: 'পত্নী', Son: 'পুত্ৰ', Daughter: 'জীয়াৰী', Brother: 'ভাই', Sister: 'ভনী', Grandfather: 'ককা/নানা', Grandmother: 'আইতা/নানী', Grandson: 'নাতি', Granddaughter: 'নাতিনী', Uncle: 'খুৰা/মামা', Aunt: 'খুৰী/মাহী', Cousin: 'খুৰাত ভাই-ভনী/মামাত ভাই-ভনী', Nephew: 'ভতিজা/ভাগিন', Niece: 'ভতিজী/ভাগিনী', Friend: 'বন্ধু', Neighbour: 'চুবুৰীয়া', Caregiver: 'যত্ন লোৱা ব্যক্তি', Teacher: 'শিক্ষক', Other: 'অন্যান্য' },
  bn: { Father: 'বাবা', Mother: 'মা', Husband: 'স্বামী', Wife: 'স্ত্রী', Son: 'ছেলে', Daughter: 'মেয়ে', Brother: 'ভাই', Sister: 'বোন', Grandfather: 'দাদু/নানা', Grandmother: 'দিদা/নানি', Grandson: 'নাতি', Granddaughter: 'নাতনি', Uncle: 'কাকা/মামা', Aunt: 'কাকিমা/মাসি', Cousin: 'খুড়তুতো/মামাতো ভাই-বোন', Nephew: 'ভাইপো/ভাগ্নে', Niece: 'ভাইঝি/ভাগ্নি', Friend: 'বন্ধু', Neighbour: 'প্রতিবেশী', Caregiver: 'পরিচর্যাকারী', Teacher: 'শিক্ষক', Other: 'অন্যান্য' },
  brx: { Father: 'बिदा', Mother: 'बिदाइ', Husband: 'फिसा', Wife: 'फिसानि', Son: 'फिसा', Daughter: 'फिसाजि', Brother: 'भाइ', Sister: 'बोन', Grandfather: 'दादा/नाना', Grandmother: 'दादी/नानी', Grandson: 'नाति', Granddaughter: 'नातिजि', Uncle: 'काका/मामा', Aunt: 'काकी/मामी', Cousin: 'भाइ-बोन', Nephew: 'भतिजा', Niece: 'भतिजी', Friend: 'सोहोर', Neighbour: 'सोला', Caregiver: 'हाग्राफोर', Teacher: 'सिखागुरु', Other: 'गुबुन' },
  mni: { Father: 'ইপা', Mother: 'ইমা', Husband: 'নুপা', Wife: 'নুপী', Son: 'মচা', Daughter: 'মচা', Brother: 'মামা', Sister: 'মচা', Grandfather: 'ইপা', Grandmother: 'ইমা', Grandson: 'মচা', Granddaughter: 'মচা', Uncle: 'মামা', Aunt: 'ইমা', Cousin: 'নুপা-মচা', Nephew: 'মচা', Niece: 'মচা', Friend: 'নুপা', Neighbour: 'নুপা', Caregiver: 'শুমাং', Teacher: 'তামো', Other: 'অন্য' },
  kha: { Father: 'Kpa', Mother: 'Kmie', Husband: 'U kurim', Wife: 'Ka kurim', Son: 'U khun', Daughter: 'Ka khun', Brother: 'U hynmen', Sister: 'Ka hynmen', Grandfather: 'Kpa tymmen', Grandmother: 'Kmie tymmen', Grandson: 'U khun lyndang', Granddaughter: 'Ka khun lyndang', Uncle: 'U mama', Aunt: 'Ka mama', Cousin: 'U/Ka pyrsa', Nephew: 'U khun hynmen', Niece: 'Ka khun hynmen', Friend: 'U paralok', Neighbour: 'U marjan', Caregiver: 'Nongsumar', Teacher: 'Nonghikai', Other: 'Kiwei pat' },
  lus: { Father: 'Pa', Mother: 'Nu', Husband: 'Pasal', Wife: 'Nupui', Son: 'Fapa', Daughter: 'Fanu', Brother: 'Unau', Sister: 'Unau', Grandfather: 'Pu', Grandmother: 'Pi', Grandson: 'Tupa', Granddaughter: 'Tunu', Uncle: 'Pu', Aunt: 'Pi', Cousin: 'Unau', Nephew: 'Fapa', Niece: 'Fanu', Friend: 'Thiante', Neighbour: 'Vengte', Caregiver: 'Enkawltu', Teacher: 'Zirtirtu', Other: 'Dangte' },
  ne: { Father: 'बुबा', Mother: 'आमा', Husband: 'श्रीमान्', Wife: 'श्रीमती', Son: 'छोरा', Daughter: 'छोरी', Brother: 'भाइ', Sister: 'बहिनी', Grandfather: 'हजुरबुबा', Grandmother: 'हजुरआमा', Grandson: 'नाति', Granddaughter: 'नातिनी', Uncle: 'काका/मामा', Aunt: 'काकी/माइजू', Cousin: 'दाजु-भाइ/दिदी-बहिनी', Nephew: 'भतिजा/भान्जा', Niece: 'भतिजी/भान्जी', Friend: 'साथी', Neighbour: 'छिमेकी', Caregiver: 'हेरचाहकर्ता', Teacher: 'शिक्षक', Other: 'अन्य' },
};

const localizedRelationship = (lang: Lang, relationship: string) =>
  relationshipLabels[lang]?.[relationship] ?? relationship;

const culturalTitleLabels: Record<Lang, Record<string, string>> = {
  en: {
    'Kamakhya Temple': 'Kamakhya Temple', 'Umananda Temple': 'Umananda Temple', 'Navagraha Temple': 'Navagraha Temple',
    'Hayagriva Madhava Temple': 'Hayagriva Madhava Temple', 'Nartiang Durga Temple': 'Nartiang Durga Temple',
    'Tripura Sundari Temple': 'Tripura Sundari Temple', 'Tawang Monastery': 'Tawang Monastery',
    'Madan Kamdev Temple': 'Madan Kamdev Temple', 'Dirgheswari Temple': 'Dirgheswari Temple',
    'Kaziranga Rhino': 'Kaziranga Rhino', 'Great Hornbill': 'Great Hornbill', 'Bamboo basket': 'Bamboo basket',
    'Pitha': 'Pitha',
  },
  ta: {
    'Kamakhya Temple': 'காமாக்யா கோவில்', 'Umananda Temple': 'உமானந்தா கோவில்', 'Navagraha Temple': 'நவகிரக கோவில்',
    'Hayagriva Madhava Temple': 'ஹயக்ரீவ மாதவ கோவில்', 'Nartiang Durga Temple': 'நார்டியாங் துர்கா கோவில்',
    'Tripura Sundari Temple': 'திரிபுரா சுந்தரி கோவில்', 'Tawang Monastery': 'தவாங் மடாலயம்',
    'Madan Kamdev Temple': 'மதன் காமதேவ் கோவில்', 'Dirgheswari Temple': 'தீர்கேஸ்வரி கோவில்',
    'Kaziranga Rhino': 'காசிரங்கா காண்டாமிருகம்', 'Great Hornbill': 'பெரிய இருவாச்சி', 'Bamboo basket': 'மூங்கில் கூடை',
    'Pitha': 'பிதா',
  },
  hi: {
    'Kamakhya Temple': 'कामाख्या मंदिर', 'Umananda Temple': 'उमानंद मंदिर', 'Navagraha Temple': 'नवग्रह मंदिर',
    'Hayagriva Madhava Temple': 'हयग्रीव माधव मंदिर', 'Nartiang Durga Temple': 'नार्तियांग दुर्गा मंदिर',
    'Tripura Sundari Temple': 'त्रिपुरा सुंदरी मंदिर', 'Tawang Monastery': 'तवांग मठ',
    'Madan Kamdev Temple': 'मदन कामदेव मंदिर', 'Dirgheswari Temple': 'दीर्घेश्वरी मंदिर',
    'Kaziranga Rhino': 'काजीरंगा गैंडा', 'Great Hornbill': 'ग्रेट हॉर्नबिल', 'Bamboo basket': 'बांस की टोकरी',
    'Pitha': 'पीठा',
  },
  as: {
    'Kamakhya Temple': 'কামাখ্যা মন্দিৰ', 'Umananda Temple': 'উমানন্দ মন্দিৰ', 'Navagraha Temple': 'নৱগ্ৰহ মন্দিৰ',
    'Hayagriva Madhava Temple': 'হয়গ্ৰীৱ মাধৱ মন্দিৰ', 'Nartiang Durga Temple': 'নাৰ্টিয়াং দুৰ্গা মন্দিৰ',
    'Tripura Sundari Temple': 'ত্ৰিপুৰা সুন্দৰী মন্দিৰ', 'Tawang Monastery': 'তৱাং মঠ',
    'Madan Kamdev Temple': 'মদন কামদেৱ মন্দিৰ', 'Dirgheswari Temple': 'দীৰ্ঘেশ্বৰী মন্দিৰ',
    'Kaziranga Rhino': 'কাজিৰঙাৰ গঁড়', 'Great Hornbill': 'ডাঙৰ হৰ্ণবিল', 'Bamboo basket': 'বাঁহৰ টোপোলা', 'Pitha': 'পিঠা',
  },
  bn: {
    'Kamakhya Temple': 'কামাখ্যা মন্দির', 'Umananda Temple': 'উমানন্দ মন্দির', 'Navagraha Temple': 'নবগ্রহ মন্দির',
    'Hayagriva Madhava Temple': 'হয়গ্রীব মাধব মন্দির', 'Nartiang Durga Temple': 'নার্তিয়াং দুর্গা মন্দির',
    'Tripura Sundari Temple': 'ত্রিপুরা সুন্দরী মন্দির', 'Tawang Monastery': 'তাওয়াং মঠ',
    'Madan Kamdev Temple': 'মদন কামদেব মন্দির', 'Dirgheswari Temple': 'দীর্ঘেশ্বরী মন্দির',
    'Kaziranga Rhino': 'কাজিরাঙার গণ্ডার', 'Great Hornbill': 'গ্রেট হর্নবিল', 'Bamboo basket': 'বাঁশের ঝুড়ি', 'Pitha': 'পিঠা',
  },
  brx: {
    'Kamakhya Temple': 'कामाख्या मन्दिर', 'Umananda Temple': 'उमानन्दा मन्दिर', 'Navagraha Temple': 'नवग्रह मन्दिर',
    'Hayagriva Madhava Temple': 'हयग्रीव माधव मन्दिर', 'Nartiang Durga Temple': 'नार्टियांग दुर्गा मन्दिर',
    'Tripura Sundari Temple': 'त्रिपुरा सुन्दरी मन्दिर', 'Tawang Monastery': 'तवांग मठ',
    'Madan Kamdev Temple': 'मदन कामदेव मन्दिर', 'Dirgheswari Temple': 'दिर्घेश्वरी मन्दिर',
    'Kaziranga Rhino': 'काजिराङा गैंडा', 'Great Hornbill': 'ग्रेट हर्नबिल', 'Bamboo basket': 'बांसनि टोपला', 'Pitha': 'पिथा',
  },
  mni: {
    'Kamakhya Temple': 'ꯀꯥꯃꯥꯈ꯭ꯌꯥ ꯃꯅꯗꯤꯔ', 'Umananda Temple': 'ꯎꯃꯥꯅꯟꯗ ꯃꯅꯗꯤꯔ', 'Navagraha Temple': 'ꯅꯋꯒ꯭ꯔꯍ ꯃꯅꯗꯤꯔ',
    'Hayagriva Madhava Temple': 'ꯍꯌꯒ꯭ꯔꯤꯕ ꯃꯥꯙꯕ ꯃꯅꯗꯤꯔ', 'Nartiang Durga Temple': 'ꯅꯥꯔꯇꯤꯌꯥꯡ ꯗꯨꯔꯒꯥ ꯃꯅꯗꯤꯔ',
    'Tripura Sundari Temple': 'ꯇ꯭ꯔꯤꯄꯨꯔꯥ ꯁꯨꯟꯗꯔꯤ ꯃꯅꯗꯤꯔ', 'Tawang Monastery': 'ꯇꯋꯥꯡ ꯃꯊꯛ',
    'Madan Kamdev Temple': 'ꯃꯗꯟ ꯀꯥꯃꯗꯦꯕ ꯃꯅꯗꯤꯔ', 'Dirgheswari Temple': 'ꯗꯤꯔꯒꯦꯁ꯭ꯋꯔꯤ ꯃꯅꯗꯤꯔ',
    'Kaziranga Rhino': 'ꯀꯥꯖꯤꯔꯥꯡꯒꯥ ꯂꯣꯏꯕꯤ', 'Great Hornbill': 'ꯍꯣꯔꯟꯕꯤꯜ', 'Bamboo basket': 'ꯕꯥꯝꯕꯨ ꯕꯥꯁꯀꯦꯠ', 'Pitha': 'ꯄꯤꯊꯥ',
  },
  kha: {
    'Kamakhya Temple': 'Ka Temple Kamakhya', 'Umananda Temple': 'Ka Temple Umananda', 'Navagraha Temple': 'Ka Temple Navagraha',
    'Hayagriva Madhava Temple': 'Ka Temple Hayagriva Madhava', 'Nartiang Durga Temple': 'Ka Temple Nartiang Durga',
    'Tripura Sundari Temple': 'Ka Temple Tripura Sundari', 'Tawang Monastery': 'Ka Tawang Monastery',
    'Madan Kamdev Temple': 'Ka Temple Madan Kamdev', 'Dirgheswari Temple': 'Ka Temple Dirgheswari',
    'Kaziranga Rhino': 'U tyndon Kaziranga', 'Great Hornbill': 'U Hornbill', 'Bamboo basket': 'Ka synduk sieh', 'Pitha': 'Ka Pitha',
  },
  lus: {
    'Kamakhya Temple': 'Kamakhya Temple', 'Umananda Temple': 'Umananda Temple', 'Navagraha Temple': 'Navagraha Temple',
    'Hayagriva Madhava Temple': 'Hayagriva Madhava Temple', 'Nartiang Durga Temple': 'Nartiang Durga Temple',
    'Tripura Sundari Temple': 'Tripura Sundari Temple', 'Tawang Monastery': 'Tawang Monastery',
    'Madan Kamdev Temple': 'Madan Kamdev Temple', 'Dirgheswari Temple': 'Dirgheswari Temple',
    'Kaziranga Rhino': 'Kaziranga Rhino', 'Great Hornbill': 'Great Hornbill', 'Bamboo basket': 'Bamboo basket', 'Pitha': 'Pitha',
  },
  ne: {
    'Kamakhya Temple': 'कामाख्या मन्दिर', 'Umananda Temple': 'उमानन्द मन्दिर', 'Navagraha Temple': 'नवग्रह मन्दिर',
    'Hayagriva Madhava Temple': 'हयग्रीव माधव मन्दिर', 'Nartiang Durga Temple': 'नार्तियाङ दुर्गा मन्दिर',
    'Tripura Sundari Temple': 'त्रिपुरा सुन्दरी मन्दिर', 'Tawang Monastery': 'तवाङ गुम्बा',
    'Madan Kamdev Temple': 'मदन कामदेव मन्दिर', 'Dirgheswari Temple': 'दीर्घेश्वरी मन्दिर',
    'Kaziranga Rhino': 'काजिरङ्गाको गैँडा', 'Great Hornbill': 'ग्रेट हर्नबिल', 'Bamboo basket': 'बाँसको टोकरी', 'Pitha': 'पिठा',
  },
};

const localizedCulturalTitle = (lang: Lang, title: string) =>
  culturalTitleLabels[lang]?.[title] ?? culturalTitleLabels.en[title] ?? title;

const culturalImage = (item: CulturalItem) => item.imageUrl ?? item.imageDataUrl;
const colors: Record<CulturalItem['color'], string> = {
  saffron: 'bg-[hsl(35_75%_76%)]',
  teal: 'bg-[hsl(174_35%_72%)]',
  leaf: 'bg-[hsl(133_30%_70%)]',
  rose: 'bg-[hsl(14_62%_78%)]',
  sky: 'bg-[hsl(201_47%_78%)]',
};

function useAppPrefs() {
  const [lang, setLangState] = useState<Lang>(() => readStore('ner-lang', 'en' as Lang));
  const [role, setRoleState] = useState<Role>(() => readStore('ner-role', 'patient' as Role));
  const setLang = (value: Lang) => { setLangState(value); writeStore('ner-lang', value); };
  const setRole = (value: Role) => { setRoleState(value); writeStore('ner-role', value); };
  return { lang, role, setLang, setRole };
}

type SpeechRecognitionLike = {
  lang: string;
  continuous?: boolean;
  interimResults?: boolean;
  processLocally?: boolean;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event?: unknown) => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  processLocally?: boolean;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition() {
  if (typeof window === 'undefined') return undefined;
  const browser = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

function normalizeCommand(command: string) {
  return command.toLowerCase().replace(/[.,!?]/g, '').trim();
}

function AppFrame({ children, lang, role }: { children: ReactNode; lang: Lang; role: Role }) {
  const [location, setLocation] = useLocation();
  const [listening, setListening] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [drawer, setDrawer] = useState(false);
  const translate = (key: CopyKey) => tr(lang, key);
  const speechSupported = Boolean(getSpeechRecognition());

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    const processQueue = () => { if (navigator.onLine) void syncService.processQueue(); };
    processQueue();
    window.addEventListener('online', processQueue);
    return () => window.removeEventListener('online', processQueue);
  }, []);

  const nav: [string, CopyKey, LucideIcon][] = [
    ['/patient', 'home', HomeIcon], ['/games', 'games', Gamepad2], ['/medicine', 'medicine', Bell],
    ['/memories', 'memories', UsersRound], ['/emergency', 'Emergency & Help', ShieldCheck], ['/progress', 'progress', Activity],
  ];

  const dispatchVoiceCommand = (command: string) => {
    const normalized = normalizeCommand(command);

    // Use the dedicated multilingual command resolver first. The older
    // music/game resolver does not contain every navigation command, so a
    // transcript such as "open games" could be heard correctly but produce
    // no navigation.
    const multilingualCommand = resolveMultilingualVoiceCommand(lang, command);
    const legacyCommand = resolveVoiceCommand(lang, command);
    const canonical = multilingualCommand ?? legacyCommand ?? normalized;

    const navigation: Record<string, string> = {
      HOME: '/patient',
      OPEN_GAMES: '/games',
      OPEN_MEDICINE: '/medicine',
      OPEN_MEMORIES: '/memories',
      OPEN_PROGRESS: '/progress',
      OPEN_SETTINGS: '/settings',
      'go home': '/patient',
      home: '/patient',
      'open games': '/games',
      games: '/games',
      'open medicine': '/medicine',
      medicine: '/medicine',
      'open memories': '/memories',
      memories: '/memories',
      'show progress': '/progress',
      progress: '/progress',
      settings: '/settings',
    };

    const target = navigation[canonical] ?? Object.entries(navigation)
      .find(([phrase]) => normalized === phrase || normalized.includes(phrase))?.[1];

    if (target) setLocation(target);
    window.dispatchEvent(new CustomEvent('ner-voice-command', { detail: canonical }));
    return canonical;
  };

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const speak = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setListening(false);
      return;
    }

    const Speech = getSpeechRecognition();
    if (!Speech) {
      setListening(true);
      speakText(translate('micUnavailable'), lang);
      window.setTimeout(() => setListening(false), 2200);
      return;
    }

    const recognition = new Speech();
    recognitionRef.current = recognition;
    const recognitionLocale = getSpeechRecognitionLocale(lang);
    recognition.lang = recognitionLocale;
    recognition.continuous = false;
    recognition.interimResults = false;

    // When offline, only force local recognition after the browser confirms
    // that the selected language pack is installed and usable on-device.
    if (!navigator.onLine) {
      const offlineVoiceStatus = await prepareOfflineVoiceLanguage(recognitionLocale);
      if (offlineVoiceStatus !== 'ready' && offlineVoiceStatus !== 'downloaded') {
        recognitionRef.current = null;
        setListening(false);
        speakText(translate('micUnavailable'), lang);
        return;
      }
      if ('processLocally' in recognition) {
        try { recognition.processLocally = true; } catch {}
      }
    }

    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    recognition.onerror = () => {
      recognitionRef.current = null;
      setListening(false);
      speakText(translate('micUnavailable'), lang);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      if (!transcript.trim()) return;
      const canonical = dispatchVoiceCommand(transcript);
      const responseKey: Record<string, CopyKey> = {
        HOME: 'home',
        OPEN_GAMES: 'games',
        OPEN_MEDICINE: 'medicine',
        OPEN_MEMORIES: 'memories',
        OPEN_PROGRESS: 'progress',
        OPEN_SETTINGS: 'settings',
        'go home': 'home',
        'open games': 'games',
        games: 'games',
        'open medicine': 'medicine',
        medicine: 'medicine',
        'open memories': 'memories',
        memories: 'memories',
        'show progress': 'progress',
        progress: 'progress',
        settings: 'settings',
      };
      const response = responseKey[canonical] ? translate(responseKey[canonical]) : transcript;
      window.setTimeout(() => { speakText(response, lang); }, 150);
    };

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      speakText(translate('micUnavailable'), lang);
    }
  };

  useEffect(() => () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const titleKey: Record<string, CopyKey> = {
    '/patient': 'home', '/games': 'games', '/medicine': 'medicine', '/music': 'music',
    '/memories': 'memories', '/progress': 'progress', '/caregiver': 'caregiverView',
    '/healthcare': 'healthcareView', '/settings': 'settings',
  };

  return (
    <div className="shell-bg min-h-[100dvh]">
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-[hsl(var(--sidebar))] p-5 text-[hsl(var(--sidebar-foreground))] transition-transform md:translate-x-0 ${drawer ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--accent))]"><Flower2 size={26} /></div>
          <div><p className="serif text-xl">NER</p><p className="text-xs tracking-[.18em] opacity-70">MEMORY ASSIST</p></div>
        </div>
        <nav className="space-y-2">
          {nav.map(([href, key, Icon]) => (
            <Link key={href} href={href} onClick={() => setDrawer(false)} data-testid={`link-${key}`} className={`flex min-h-14 items-center gap-4 rounded-2xl px-4 text-base transition-colors ${location === href ? 'bg-white/15 font-bold' : 'opacity-80 hover:bg-white/10'}`}>
              <Icon size={23} /><span>{translate(key)}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-8 border-t border-white/15 pt-5">
          <Link href={role === 'caregiver' ? '/caregiver' : role === 'healthcare' ? '/healthcare' : '/settings'} className="flex min-h-14 items-center gap-4 rounded-2xl px-4 opacity-85 hover:bg-white/10">
            <ShieldCheck size={22} /><span>{role === 'patient' ? translate('settings') : role === 'caregiver' ? translate('caregiverView') : translate('healthcareView')}</span>
          </Link>
          <Link href="/settings" className="mt-2 flex min-h-14 items-center gap-4 rounded-2xl px-4 opacity-85 hover:bg-white/10"><SettingsIcon size={22} /><span>{translate('settings')}</span></Link>
        </div>
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/10 p-4 text-xs leading-relaxed opacity-85"><LockKeyhole size={16} className="mb-2" />{translate('privacy')}</div>
      </aside>
      {drawer && <button aria-label={translate('close')} className="fixed inset-0 z-20 bg-black/20 md:hidden" onClick={() => setDrawer(false)} />}
      <div className="md:pl-72">
        <header className="sticky top-0 z-10 flex min-h-20 items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.9)] px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-xl p-3 md:hidden" aria-label={translate('open')} onClick={() => setDrawer(true)}><Menu size={24} /></button>
            <div><p className="text-xs uppercase tracking-[.17em] text-[hsl(var(--muted-foreground))]">{translate('appTitle')}</p><h1 className="serif text-2xl font-semibold capitalize">{translate(titleKey[location] ?? 'home')}</h1></div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`hidden items-center gap-2 rounded-full px-3 py-2 text-xs sm:flex ${offline ? 'bg-[hsl(var(--secondary))]' : 'bg-[hsl(var(--primary)/.12)]'}`}>
              {offline ? <CloudOff size={15} /> : <Wifi size={15} />}<span>{offline ? translate('offlineDataSaved') : translate('online')}</span>
            </div>
            <button type="button" className={`flex min-h-12 min-w-12 items-center justify-center rounded-full ${listening ? 'bg-[hsl(var(--accent))] text-white' : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'}`} data-testid="button-voice" onClick={speak} aria-label={translate('voice')} title={translate('voice')}><Mic size={22} /></button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 pb-28 md:p-8">
          {listening && <div className="pop mb-5 flex items-center gap-3 rounded-2xl border border-[hsl(var(--accent)/.3)] bg-[hsl(var(--accent)/.12)] p-4 text-sm"><Volume2 size={20} /><span>{speechSupported ? translate('listening') : translate('micUnavailable')}</span></div>}
          {!speechSupported && <p className="mb-5 text-center text-xs text-[hsl(var(--muted-foreground))]">{translate('speechNote')}</p>}
          {children}
        </main>
        <nav className="fixed bottom-0 left-0 right-0 z-20 flex justify-around border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/.96)] p-2 backdrop-blur md:hidden">
          {nav.slice(0, 5).map(([href, key, Icon]) => <Link key={href} href={href} className={`flex min-h-14 min-w-14 flex-col items-center justify-center gap-1 rounded-xl text-xs ${location === href ? 'bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))] font-bold' : 'text-[hsl(var(--muted-foreground))]'}`}><Icon size={20} /><span>{translate(key)}</span></Link>)}
        </nav>
      </div>
    </div>
  );
}

function Welcome({ lang, role, setLang, setRole }: { lang: Lang; role: Role; setLang: (l: Lang) => void; setRole: (r: Role) => void }) {
  const [, setLocation] = useLocation();
  const translate = (key: CopyKey) => tr(lang, key);
  return (
    <div className="shell-bg min-h-[100dvh] p-4 md:p-10">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-6xl overflow-hidden rounded-[2rem] card-surface md:grid-cols-[.9fr_1.1fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-[hsl(var(--sidebar))] p-7 text-[hsl(var(--sidebar-foreground))] md:p-12">
          <div className="absolute -right-16 -top-10 h-64 w-64 rounded-full border-[34px] border-[hsl(var(--accent)/.4)]" />
          <div className="relative"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--accent))]"><Flower2 size={26} /></div><span className="tracking-[.2em]">NER</span></div>
            <div className="mt-24 max-w-sm"><p className="mb-4 text-sm uppercase tracking-[.2em] opacity-65">{translate('region')}</p><h1 className="serif text-5xl leading-[1.05] md:text-6xl">{translate('welcome')}</h1><p className="mt-6 text-lg leading-relaxed opacity-80">{translate('welcomeSub')}</p></div>
          </div>
          <div className="relative mt-12 flex items-end gap-3"><div className="h-20 w-20 rounded-t-full bg-[hsl(var(--secondary)/.7)]" /><div className="h-28 w-28 rounded-t-full bg-[hsl(var(--accent)/.75)]" /><div className="h-16 w-16 rounded-t-full bg-[hsl(var(--secondary)/.5)]" /></div>
        </section>
        <section className="flex flex-col justify-center p-6 md:p-12"><div className="mx-auto w-full max-w-xl">
          <div className="mb-8"><div className="mb-3 flex items-center gap-2 text-[hsl(var(--primary))]"><Languages size={21} /><span className="font-bold">{translate('chooseLanguage')}</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{languageOptions.map((item) => <button key={item.id} onClick={() => setLang(item.id)} data-testid={`button-language-${item.id}`} className={`min-h-14 rounded-2xl border px-3 text-left transition-all ${lang === item.id ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.12)] ring-2 ring-[hsl(var(--primary)/.2)]' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'}`}><span className="block text-sm font-bold">{item.native}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">{item.label}</span></button>)}</div></div>
          <div className="mb-8"><div className="mb-3 flex items-center gap-2 text-[hsl(var(--primary))]"><UserRound size={21} /><span className="font-bold">{translate('chooseRole')}</span></div><div className="space-y-3">{(['patient', 'caregiver', 'healthcare'] as Role[]).map((item) => { const Icon = item === 'patient' ? UserRound : item === 'caregiver' ? Heart : Stethoscope; return <button key={item} onClick={() => setRole(item)} data-testid={`button-role-${item}`} className={`flex min-h-16 w-full items-center gap-4 rounded-2xl border px-4 text-left ${role === item ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.12)] ring-2 ring-[hsl(var(--primary)/.2)]' : 'border-[hsl(var(--border))]'}`}><Icon size={25} className="text-[hsl(var(--primary))]" /><span className="font-bold">{translate(item)}</span>{role === item && <Check className="ml-auto text-[hsl(var(--primary))]" />}</button>; })}</div></div>
          <button onClick={() => setLocation(role === 'patient' ? '/patient' : role === 'caregiver' ? '/caregiver' : '/healthcare')} data-testid="button-continue" className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-[hsl(var(--primary))] px-6 text-lg font-bold text-[hsl(var(--primary-foreground))] hover:opacity-90">{translate('continue')}<ChevronRight /></button><p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]"><LockKeyhole size={15} className="mt-0.5 shrink-0" />{translate('privacy')}</p>
        </div></section>
      </div>
    </div>
  );
}

function PageIntro({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint: string }) { return <div className="gentle-in mb-7 flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><Icon size={27} /></div><div><h2 className="serif text-3xl font-semibold">{title}</h2><p className="mt-1 text-[hsl(var(--muted-foreground))]">{hint}</p></div></div>; }
function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`card-surface rounded-3xl p-5 md:p-6 ${className}`}>{children}</section>; }
function Badge({ children, tone = 'primary' }: { children: ReactNode; tone?: 'primary' | 'accent' | 'muted' }) { return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${tone === 'accent' ? 'bg-[hsl(var(--accent)/.15)] text-[hsl(var(--accent))]' : tone === 'muted' ? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]' : 'bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]'}`}>{children}</span>; }

function PatientHome({ lang }: { lang: Lang }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const [, setLocation] = useLocation();
  const [med, setMed] = useState<'pending' | 'taken' | 'later'>(() => readStore('ner-med', 'pending' as 'pending'));
  const results = getGameResults();
  const mark = (value: 'taken' | 'later') => { setMed(value); writeStore('ner-med', value); };
  return <div className="gentle-in space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 flex items-center gap-2 text-sm font-bold text-[hsl(var(--primary))]"><Sun size={17} />{translate('today')} · Tuesday</p><h2 className="serif text-4xl md:text-5xl">{translate('goodMorning')}, Amina</h2><p className="mt-2 text-lg text-[hsl(var(--muted-foreground))]">{translate('calmStart')}</p></div><Badge tone="muted"><Wifi size={13} className="mr-1" />{translate('savedOnDevice')}</Badge></div>
    <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><SectionCard className="relative overflow-hidden bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border-2 border-[hsl(var(--primary)/.22)]"><div className="absolute right-0 top-0 h-full w-2/5 soft-pattern opacity-30" /><div className="relative"><p className="text-sm opacity-75">{translate('nextMedicine')}</p><div className="mt-3 flex items-end justify-between gap-3"><div><h3 className="serif text-4xl">Vitamin D</h3><p className="mt-2 flex items-center gap-2 text-base opacity-80"><Clock3 size={18} />{translate('dueAt')} 09:00 · {translate('morning')}</p></div><div className="rounded-2xl bg-white/15 p-4"><Bell size={29} /></div></div><div className="mt-6 flex flex-wrap gap-3">{med === 'pending' ? <><button onClick={() => mark('taken')} className="flex min-h-14 items-center gap-2 rounded-2xl bg-[hsl(var(--accent))] px-5 font-bold"><Check size={21} />{translate('takeNow')}</button><button onClick={() => mark('later')} className="min-h-14 rounded-2xl bg-[hsl(var(--secondary))] px-5 font-bold text-[hsl(var(--secondary-foreground))]">{translate('later')}</button></> : <div className="flex items-center gap-2 rounded-2xl bg-[hsl(var(--secondary))] px-5 py-4 font-bold text-[hsl(var(--secondary-foreground))]"><Check size={21} />{med === 'taken' ? translate('taken') : translate('later')}</div>}</div></div></SectionCard><SectionCard className="flex flex-col justify-between"><div><Badge>{translate('progress')}</Badge><p className="mt-4 text-4xl font-bold">{results.length} <span className="text-base font-normal text-[hsl(var(--muted-foreground))]">{translate('sessions')}</span></p><p className="mt-1 text-[hsl(var(--muted-foreground))]">{translate('thisWeek')}</p></div><button onClick={() => setLocation('/progress')} className="mt-5 flex min-h-12 items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-4 font-bold">{translate('progress')}<ChevronRight size={19} /></button></SectionCard></div>
    <div className="grid gap-5 md:grid-cols-3"><QuickCard icon={Gamepad2} title={translate('personalizedGames')} body={translate('personalizedJigsaw')} href="/games" /><QuickCard icon={Sparkles} title={translate('culturalGames')} body={translate('culturalJigsaw')} href="/games" /><QuickCard icon={Activity} title={translate('progress')} body={translate('recentPerformance')} href="/progress" /></div>
    <div className="rounded-3xl border border-[hsl(var(--accent)/.3)] bg-[hsl(var(--accent)/.1)] p-5"><div className="flex items-start gap-3"><Lightbulb className="mt-1 text-[hsl(var(--accent))]" size={22} /><div><p className="font-bold">{translate('familiarSoundscape')}</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{translate('privacyShort')}</p></div></div></div>
  </div>;
}

function QuickCard({ icon: Icon, title, body, href }: { icon: LucideIcon; title: string; body: string; href: string }) { return <Link href={href} className="card-surface group rounded-3xl p-5 hover:-translate-y-0.5"><Icon className="mb-5 text-[hsl(var(--primary))]" size={27} /><h3 className="text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{body}</p><span className="mt-5 flex items-center gap-1 text-sm font-bold text-[hsl(var(--primary))]"><span>{'Open'}</span><ChevronRight size={16} className="transition-transform group-hover:translate-x-1" /></span></Link>; }

type GameType = GameResult['gameType'];

function Games({ lang }: { lang: Lang }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const [selected, setSelected] = useState<GameType>('personalized-jigsaw');
  const cards: { type: GameType; icon: LucideIcon; title: CopyKey; body: CopyKey }[] = [
    { type: 'personalized-jigsaw', icon: Brain, title: 'personalizedJigsaw', body: 'rememberPlace' },
    { type: 'family-match', icon: UsersRound, title: 'familyMatch', body: 'familyMatchHint' },
    { type: 'cultural-jigsaw', icon: Sparkles, title: 'culturalJigsaw', body: 'culturalGames' },
    { type: 'cultural-match', icon: Trophy, title: 'culturalMatch', body: 'culturalMatchHint' },
  ];
  return <div className="gentle-in"><PageIntro icon={Gamepad2} title={translate('games')} hint={translate('gameHint')} /><div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({ type, icon: Icon, title, body }) => <button key={type} onClick={() => setSelected(type)} className={`rounded-3xl border p-4 text-left transition-all ${selected === type ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.1)] ring-2 ring-[hsl(var(--primary)/.15)]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'}`}><Icon className="mb-4 text-[hsl(var(--primary))]" size={25} /><p className="font-bold">{translate(title)}</p><p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{translate(body)}</p></button>)}</div>{selected === 'personalized-jigsaw' && <JigsawGame lang={lang} gameType="personalized-jigsaw" />}{selected === 'cultural-jigsaw' && <JigsawGame lang={lang} gameType="cultural-jigsaw" />}{selected === 'family-match' && <MatchGame lang={lang} gameType="family-match" />}{selected === 'cultural-match' && <MatchGame lang={lang} gameType="cultural-match" />}</div>;
}

function GameResultPanel({ lang, result, onAgain, photoUrl, photoAlt }: { lang: Lang; result: GameResult; onAgain: () => void; photoUrl?: string; photoAlt?: string }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const adaptation = adaptDifficulty(result, getGameResults());
  const reason = adaptation.reason === 'increase' ? 'increaseDifficulty' : adaptation.reason === 'reduce' ? 'reduceDifficulty' : 'stayDifficulty';
  return <div className="pop space-y-5 rounded-3xl border border-[hsl(var(--primary)/.3)] bg-[hsl(var(--primary)/.08)] p-5 md:p-7">
    {photoUrl && <div className="overflow-hidden rounded-3xl border-2 border-[hsl(var(--primary)/.25)] bg-[hsl(var(--card))] shadow-sm"><img src={photoUrl} alt={photoAlt ?? ''} className="block h-64 w-full object-contain bg-[hsl(var(--muted))] md:h-80" /></div>}
    <div className="flex items-start gap-3"><Trophy className="mt-1 text-[hsl(var(--accent))]" size={27} /><div><h3 className="serif text-3xl">{translate('gameComplete')}</h3><p className="mt-1 text-[hsl(var(--muted-foreground))]">{translate('gameCompleteSub')}</p></div></div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{[[translate('score'), result.score], [translate('accuracy'), Math.round(result.accuracy * 100) + '%'], [translate('attempts'), result.attempts], [translate('hintsUsed'), result.hintsUsed], [translate('completionTime'), result.completionTime + 's']].map(([label, value]) => <div key={String(label)} className="rounded-2xl bg-[hsl(var(--card))] p-3"><p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>)}</div>
    <div className="flex items-start gap-2 rounded-2xl bg-[hsl(var(--accent)/.12)] p-4 text-sm"><Sparkles className="mt-0.5 shrink-0 text-[hsl(var(--accent))]" size={18} /><span><strong>{translate('adaptiveHelp')}:</strong> {translate(reason)}</span></div>
    <p className="text-sm text-[hsl(var(--muted-foreground))]">{translate('resultSaved')}</p>
    <button onClick={onAgain} className="min-h-14 rounded-2xl bg-[hsl(var(--primary))] px-5 font-bold text-[hsl(var(--primary-foreground))]">{translate('playAgain')}</button>
  </div>;
}
function DifficultyPicker({ lang, difficulty, setDifficulty }: { lang: Lang; difficulty: Difficulty; setDifficulty: (value: Difficulty) => void }) {
  const translate = (key: CopyKey) => tr(lang, key);
  return <div><p className="mb-3 font-bold">{translate('chooseDifficulty')}</p><div className="grid grid-cols-3 gap-2">{(['easy', 'medium', 'hard'] as Difficulty[]).map((value) => <button key={value} onClick={() => setDifficulty(value)} className={`min-h-12 rounded-xl border text-sm font-bold ${difficulty === value ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.12)]' : 'border-[hsl(var(--border))]'}`}>{translate(value)}<span className="mt-0.5 block text-xs font-normal text-[hsl(var(--muted-foreground))]">{value === 'easy' ? '4' : value === 'medium' ? '6' : '9'} {translate('pieces')}</span></button>)}</div></div>;
}

function JigsawGame({ lang, gameType }: { lang: Lang; gameType: 'personalized-jigsaw' | 'cultural-jigsaw' }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const cultural = gameType === 'cultural-jigsaw';
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pieces, setPieces] = useState<number[]>([]);
  const [placed, setPlaced] = useState<(number | null)[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hints, setHints] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [personalIndex, setPersonalIndex] = useState(0);
  const [culturalIndex, setCulturalIndex] = useState(0);
  const [personalProfile, setPersonalProfile] = useState<MemoryProfile | null>(() => getMemoryProfiles()[0] ?? null);
  const pieceCount = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 9;
  const culturalItem = culturalItems[culturalIndex % culturalItems.length];
  const personalProfiles = getMemoryProfiles();
  const activePersonalProfile = personalProfile ?? personalProfiles[personalIndex % Math.max(personalProfiles.length, 1)] ?? null;
  const puzzleImage = cultural ? culturalImage(culturalItem) : activePersonalProfile?.photoDataUrl ?? '';
  const [resolvedPuzzleImage, setResolvedPuzzleImage] = useState(puzzleImage);

  useEffect(() => {
    if (!puzzleImage) {
      setResolvedPuzzleImage('');
      return;
    }

    if (!cultural || !puzzleImage.startsWith('http')) {
      setResolvedPuzzleImage(puzzleImage);
      return;
    }

    const image = new Image();
    image.onload = () => setResolvedPuzzleImage(puzzleImage);
    image.onerror = () => setResolvedPuzzleImage(culturalItem.imageDataUrl);
    image.src = puzzleImage;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [puzzleImage, cultural, culturalItem.imageDataUrl]);

  const puzzleCols = pieceCount === 4 ? 2 : 3;
  const puzzleRows = pieceCount === 4 ? 2 : pieceCount === 6 ? 2 : 3;
  const pieceStyle = (piece: number) => ({
    backgroundImage: resolvedPuzzleImage ? `url("${resolvedPuzzleImage}")` : 'none',
    backgroundSize: `${puzzleCols * 100}% ${puzzleRows * 100}%`,
    backgroundPosition: `${(piece % puzzleCols) * (100 / Math.max(puzzleCols - 1, 1))}% ${Math.floor(piece / puzzleCols) * (100 / Math.max(puzzleRows - 1, 1))}%`,
    backgroundRepeat: 'no-repeat',
  });

  const createPuzzle = () => {
    if (cultural) {
      setCulturalIndex((value) => (value + 1) % culturalItems.length);
    } else {
      const latestProfiles = getMemoryProfiles().filter((profile) => Boolean(profile.photoDataUrl));
      if (!latestProfiles.length) {
        setStarted(false);
        setPersonalProfile(null);
        return;
      }
      const nextIndex = personalIndex % latestProfiles.length;
      setPersonalProfile(latestProfiles[nextIndex]);
      setPersonalIndex((value) => (value + 1) % latestProfiles.length);
    }

    const nextPieces = Array.from({ length: pieceCount }, (_, index) => index).sort(() => Math.random() - 0.5);
    setPieces(nextPieces); setPlaced(Array.from({ length: pieceCount }, () => null)); setSelectedPiece(null); setAttempts(0); setHints(0); setHintIndex(null); setElapsed(0); setStartedAt(Date.now()); setStarted(true); setPaused(false); setResult(null);
  };

  const finish = (nextPlaced: (number | null)[], nextAttempts: number) => {
    const accuracy = Math.min(1, nextPlaced.filter((value, index) => value === index).length / Math.max(nextAttempts, pieceCount));
    const gameResult: GameResult = { id: `${gameType}-${Date.now()}`, gameType, accuracy, completionTime: Math.max(1, Math.floor((Date.now() - startedAt) / 1000)), attempts: nextAttempts, hintsUsed: hints, difficulty, score: scoreGame(accuracy, difficulty, nextAttempts, hints), createdAt: Date.now() };
    saveGameResult(gameResult); setResult(gameResult); setStarted(false);
  };

  useEffect(() => {
    if (!started || paused) return;
    const interval = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(interval);
  }, [started, paused, startedAt]);

  useEffect(() => {
    const onCommand = (event: Event) => {
      const command = (event as CustomEvent<string>).detail;
      if (command.includes('start') && !started) createPuzzle();
      else if (command.includes('pause')) setPaused(true);
      else if ((command.includes('continue') || command.includes('start')) && started) setPaused(false);
      else if (command.includes('restart')) createPuzzle();
      else if (command.includes('hint')) giveHint();
      else if (command.includes('easier')) setDifficulty(difficulty === 'hard' ? 'medium' : 'easy');
      else if (command.includes('harder')) setDifficulty(difficulty === 'easy' ? 'medium' : 'hard');
    };
    window.addEventListener('ner-voice-command', onCommand);
    return () => window.removeEventListener('ner-voice-command', onCommand);
  });

  const movePiece = (piece: number, slot: number) => {
    if (!started || paused || placed[slot] !== null) return;
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (piece === slot) {
      const next = [...placed]; next[slot] = piece; setPlaced(next); setSelectedPiece(null); setHintIndex(null);
      if (next.every((value, index) => value === index)) finish(next, nextAttempts);
    } else {
      setSelectedPiece(piece);
    }
  };

  const giveHint = () => {
    if (!started || paused) return;
    const openSlot = placed.findIndex((value) => value === null);
    if (openSlot >= 0) { setHintIndex(openSlot); setHints((value) => value + 1); }
  };

  const slotGrid = pieceCount === 4 ? 'grid-cols-2' : 'grid-cols-3';
  if (result) return <GameResultPanel lang={lang} result={result} onAgain={createPuzzle} photoUrl={puzzleImage} photoAlt={cultural ? localizedCulturalTitle(lang, culturalItem.titleKey) : activePersonalProfile?.name} />;

  if (!cultural && !activePersonalProfile) {
    return <SectionCard><div className="py-10 text-center"><UsersRound className="mx-auto mb-4 text-[hsl(var(--primary))]" size={40} /><h3 className="serif text-2xl font-semibold">{translate('personalMemories')}</h3><p className="mt-2 text-[hsl(var(--muted-foreground))]">{translate('memoriesEmpty')}</p><Link href="/memories" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-[hsl(var(--primary))] px-5 font-bold text-[hsl(var(--primary-foreground))]">{translate('editMemory')}</Link></div></SectionCard>;
  }

  return <SectionCard><div className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><Badge tone="accent">{cultural ? translate('culturalGames') : translate('personalizedGames')}</Badge><h3 className="serif mt-3 text-3xl">{cultural ? culturalItem.titleKey : translate('rememberPlace')}</h3><p className="mt-1 text-[hsl(var(--muted-foreground))]">{translate('gameInstruction')}</p></div><div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]"><Clock3 size={17} />{elapsed}s</div></div>{!started ? <div className="space-y-5"><div className={`cultural-scene ${colors[culturalItem.color]} relative min-h-40 overflow-hidden rounded-2xl`}>{puzzleImage ? <img src={puzzleImage} alt={cultural ? culturalItem.titleKey : activePersonalProfile?.name ?? ''} className="absolute inset-0 h-full w-full object-cover" /> : null}<div className="absolute inset-x-0 bottom-0 bg-black/45 p-4 text-center text-white"><p className="font-bold">{cultural ? culturalItem.detail : activePersonalProfile?.name}</p></div></div><DifficultyPicker lang={lang} difficulty={difficulty} setDifficulty={setDifficulty} /><button onClick={createPuzzle} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[hsl(var(--primary))] font-bold text-[hsl(var(--primary-foreground))]"><Play size={20} />{translate('start')}</button></div> : <div className="space-y-5">{paused && <div className="rounded-2xl bg-[hsl(var(--secondary))] p-4 text-center font-bold">{translate('gamePaused')}</div>}<p className="rounded-2xl bg-[hsl(var(--muted))] p-4 text-center text-sm">{translate('dragPieces')}</p><div className={`mx-auto grid max-w-md ${slotGrid} gap-2 rounded-2xl bg-[hsl(var(--muted))] p-3`}>{placed.map((piece, index) => <button key={index} onClick={() => selectedPiece !== null && movePiece(selectedPiece, index)} onDragOver={(event) => event.preventDefault()} onDrop={() => selectedPiece !== null && movePiece(selectedPiece, index)} className={`flex aspect-square min-h-20 items-center justify-center rounded-xl border-2 border-dashed text-3xl font-bold transition-all ${piece === null ? 'border-[hsl(var(--primary)/.35)] bg-[hsl(var(--card)/.6)]' : 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.18)]'} ${hintIndex === index ? 'ring-4 ring-[hsl(var(--accent)/.55)]' : ''}`}>{piece === null ? '?' : <span className="cultural-tile h-full w-full rounded-lg" data-piece={piece} style={pieceStyle(piece)}><span className="sr-only">{piece + 1}</span></span>}</button>)}</div><div className="flex flex-wrap justify-center gap-2">{pieces.filter((piece) => !placed.includes(piece)).map((piece) => <button key={piece} draggable onDragStart={() => setSelectedPiece(piece)} onClick={() => setSelectedPiece(piece)} className={`flex h-20 w-20 touch-none items-center justify-center overflow-hidden rounded-2xl border-2 bg-[hsl(var(--card))] text-xl font-bold shadow-sm ${selectedPiece === piece ? 'border-[hsl(var(--accent))] ring-4 ring-[hsl(var(--accent)/.25)]' : 'border-[hsl(var(--border))]'}`} style={pieceStyle(piece)}><span className="sr-only">{piece + 1}</span></button>)}</div><div className="flex flex-wrap gap-2"><button onClick={() => setPaused(!paused)} className="flex min-h-12 items-center gap-2 rounded-xl bg-[hsl(var(--secondary))] px-4 font-bold">{paused ? <Play size={18} /> : <Pause size={18} />}{paused ? translate('continueGame') : translate('pause')}</button><button onClick={createPuzzle} className="flex min-h-12 items-center gap-2 rounded-xl border px-4 font-bold"><RotateCcw size={18} />{translate('restart')}</button><button onClick={giveHint} className="flex min-h-12 items-center gap-2 rounded-xl border px-4 font-bold"><Lightbulb size={18} />{translate('hint')}</button><Badge tone="muted">{translate('attempts')}: {attempts} · {translate('hintsUsed')}: {hints}</Badge></div></div>}</SectionCard>;
}
type MatchMode = 'photoToPerson' | 'photoToName' | 'photoToRelationship' | 'landmark' | 'animal' | 'object' | 'food';

function MatchGame({ lang, gameType }: { lang: Lang; gameType: 'family-match' | 'cultural-match' }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const cultural = gameType === 'cultural-match';
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [mode, setMode] = useState<MatchMode>(cultural ? 'landmark' : 'photoToPerson');
  const [round, setRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hints, setHints] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'tryAgain' | null>(null);
  const [hinted, setHinted] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const profiles = getMemoryProfiles();
  const roundTarget = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7;
  const currentProfile = profiles[round % Math.max(profiles.length, 1)];
  const currentCulture = cultural ? (culturalItems.filter((item) => item.category === mode)[round % Math.max(culturalItems.filter((item) => item.category === mode).length, 1)] ?? culturalItems[0]) : culturalItems[0];
  const modes: MatchMode[] = cultural ? ['landmark', 'animal', 'object', 'food'] : ['photoToPerson', 'photoToName', 'photoToRelationship'];
  const culturalPool = culturalItems.filter((item) => item.category === mode);
  const options = cultural
    ? culturalPool.slice(0, 4)
    : profiles.filter((profile) => profile.id === currentProfile.id || profile.id !== currentProfile.id).slice(0, 4);
  const startGame = () => { setStarted(true); setPaused(false); setRound(0); setCorrectCount(0); setAttempts(0); setHints(0); setFeedback(null); setHinted(false); setStartedAt(Date.now()); setResult(null); };
  const finish = (nextAttempts: number, nextCorrect: number) => {
    const accuracy = nextCorrect / Math.max(nextAttempts, 1);
    const gameResult: GameResult = { id: `${gameType}-${Date.now()}`, gameType, accuracy, completionTime: Math.max(1, Math.floor((Date.now() - startedAt) / 1000)), attempts: nextAttempts, hintsUsed: hints, difficulty, score: scoreGame(accuracy, difficulty, nextAttempts, hints), createdAt: Date.now() };
    saveGameResult(gameResult); setResult(gameResult); setStarted(false);
  };
  useEffect(() => {
    const onCommand = (event: Event) => {
      const command = (event as CustomEvent<string>).detail;
      if (command.includes('start') && !started) startGame();
      else if (command.includes('pause')) setPaused(true);
      else if ((command.includes('continue') || command.includes('start')) && started) setPaused(false);
      else if (command.includes('restart')) startGame();
      else if (command.includes('hint')) { setHints((value) => value + 1); setHinted(true); }
      else if (command.includes('easier')) setDifficulty(difficulty === 'hard' ? 'medium' : 'easy');
      else if (command.includes('harder')) setDifficulty(difficulty === 'easy' ? 'medium' : 'hard');
    };
    window.addEventListener('ner-voice-command', onCommand);
    return () => window.removeEventListener('ner-voice-command', onCommand);
  });
  const answerCorrect = (id: string) => cultural ? id === currentCulture.id : id === currentProfile.id;
  const choose = (id: string) => {
    if (!started || paused || feedback === 'correct') return;
    const isCorrect = answerCorrect(id);
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setFeedback(isCorrect ? 'correct' : 'tryAgain');
    if (isCorrect) {
      const nextCorrect = correctCount + 1;
      setCorrectCount(nextCorrect);
      window.setTimeout(() => {
        if (round + 1 >= roundTarget) finish(nextAttempts, nextCorrect);
        else { setRound((value) => value + 1); setFeedback(null); setHinted(false); }
      }, 650);
    } else {
      window.setTimeout(() => setFeedback(null), 800);
    }
  };
  const modeLabel = mode === 'photoToPerson' ? translate('photoToPerson') : mode === 'photoToName' ? translate('photoToName') : mode === 'photoToRelationship' ? translate('photoToRelationship') : translate(mode);
  if (result) return <GameResultPanel lang={lang} result={result} onAgain={startGame} photoUrl={cultural ? culturalImage(currentCulture) : currentProfile.photoDataUrl} photoAlt={cultural ? localizedCulturalTitle(lang, currentCulture.titleKey) : currentProfile.name} />;
  return <SectionCard><div className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><Badge tone="accent">{cultural ? translate('culturalGames') : translate('personalizedGames')}</Badge><h3 className="serif mt-3 text-3xl">{cultural ? translate('culturalMatch') : translate('familyMatch')}</h3><p className="mt-1 text-[hsl(var(--muted-foreground))]">{translate('chooseAnswer')}</p></div>{started && <Badge tone="muted">{translate('round')} {round + 1} / {roundTarget}</Badge>}</div>{!started ? <div className="space-y-5"><div><p className="mb-3 font-bold">{cultural ? translate('culturalContent') : translate('chooseGame')}</p><div className="grid gap-2 sm:grid-cols-3">{modes.map((value) => <button key={value} onClick={() => setMode(value)} className={`min-h-14 rounded-xl border px-3 text-left text-sm font-bold ${mode === value ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.12)]' : 'border-[hsl(var(--border))]'}`}>{value === 'landmark' ? translate('landmark') : value === 'animal' ? translate('animal') : value === 'object' ? translate('object') : value === 'food' ? translate('food') : translate(value)}</button>)}</div></div><button onClick={startGame} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[hsl(var(--primary))] font-bold text-[hsl(var(--primary-foreground))]"><Play size={20} />{translate('start')}</button></div> : <div className="space-y-5">{paused && <div className="rounded-2xl bg-[hsl(var(--secondary))] p-4 text-center font-bold">{translate('gamePaused')}</div>}<div className="flex flex-col items-center rounded-3xl bg-[hsl(var(--muted))] p-6 text-center"><div className={`flex h-32 w-32 items-center justify-center overflow-hidden rounded-full ${cultural ? colors[currentCulture.color] : 'bg-[hsl(var(--secondary))]'} text-4xl font-bold text-[hsl(var(--primary))]`}>{cultural ? <img src={culturalImage(currentCulture)} alt={currentCulture.titleKey} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.src = currentCulture.imageDataUrl; }} /> : currentProfile.photoDataUrl ? <img src={currentProfile.photoDataUrl} alt={currentProfile.name} className="h-full w-full object-cover" /> : currentProfile.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><p className="mt-4 text-lg font-bold">{translate('chooseAnswer')}</p>{hinted && <p className="mt-2 text-sm text-[hsl(var(--accent))]">{cultural ? currentCulture.titleKey : currentProfile.name}</p>}</div><div className="grid gap-3 sm:grid-cols-2">{options.map((option) => { const id = cultural ? (option as CulturalItem).id : (option as MemoryProfile).id; const profile = option as MemoryProfile; const label = cultural ? localizedCulturalTitle(lang, (option as CulturalItem).titleKey) : mode === 'photoToRelationship' ? localizedRelationship(lang, profile.relationship) : profile.name; const showPhoto = cultural || mode === 'photoToPerson'; const showName = !cultural && mode === 'photoToName'; const showRelationship = !cultural && mode === 'photoToRelationship'; return <button key={id} onClick={() => choose(id)} className="flex min-h-16 items-center gap-3 rounded-2xl border bg-[hsl(var(--card))] p-4 text-left font-bold transition-all hover:border-[hsl(var(--primary))]">{showPhoto && <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[hsl(var(--secondary))] text-sm">{cultural ? <img src={culturalImage(option as CulturalItem)} alt="" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.src = (option as CulturalItem).imageDataUrl; }} /> : profile.photoDataUrl ? <img src={profile.photoDataUrl} alt="" className="h-full w-full object-cover" /> : profile.name.charAt(0)}</span>}{showName && <span className="flex-1">{profile.name}</span>}{showRelationship && <span className="flex-1">{localizedRelationship(lang, profile.relationship)}</span>}{cultural && <span className="flex-1">{label}</span>}</button>; })}</div>{feedback && <div className={`rounded-2xl p-4 text-center font-bold ${feedback === 'correct' ? 'bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]' : 'bg-[hsl(var(--accent)/.15)] text-[hsl(var(--accent))]'}`}>{translate(feedback)}</div>}<div className="flex flex-wrap gap-2"><button onClick={() => setPaused(!paused)} className="flex min-h-12 items-center gap-2 rounded-xl bg-[hsl(var(--secondary))] px-4 font-bold">{paused ? <Play size={18} /> : <Pause size={18} />}{paused ? translate('continueGame') : translate('pause')}</button><button onClick={startGame} className="flex min-h-12 items-center gap-2 rounded-xl border px-4 font-bold"><RotateCcw size={18} />{translate('restart')}</button><button onClick={() => { setHints((value) => value + 1); setHinted(true); }} className="flex min-h-12 items-center gap-2 rounded-xl border px-4 font-bold"><Lightbulb size={18} />{translate('hint')}</button></div></div>}</SectionCard>;
}

const blankMedicine = (): MedicineSchedule => ({
  id: '',
  name: '',
  photoDataUrl: '',
  instruction: '',
  time: '09:00',
  frequency: 'daily',
  startDate: dateKey(),
  endDate: '',
  voiceInstruction: '',
  active: true,
});

const latestMedicineStatus = (medicineId: string, events: MedicineEvent[], today: string): MedicineEventStatus =>
  events.filter((event) => event.medicineId === medicineId && event.scheduledFor === today).at(-1)?.status ?? 'scheduled';

function MedicinePhoto({ medicine, large = false }: { medicine: MedicineSchedule; large?: boolean }) {
  return <div className={`flex items-center justify-center overflow-hidden rounded-3xl bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] ${large ? 'h-52 w-52' : 'h-16 w-16'}`}>
    {medicine.photoDataUrl ? <img src={medicine.photoDataUrl} alt="" className="h-full w-full object-cover" /> : <Bell size={large ? 70 : 28} />}
  </div>;
}

function MedicineEditor({ lang, initial, onSave, onCancel }: { lang: Lang; initial: MedicineSchedule; onSave: (medicine: MedicineSchedule) => void; onCancel: () => void }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const [form, setForm] = useState(initial);
  const updatePhoto = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((value) => ({ ...value, photoDataUrl: String(reader.result ?? '') }));
    reader.readAsDataURL(file);
  };
  return <SectionCard className="pop">
    <div className="mb-5 flex items-center justify-between"><div><h3 className="serif text-2xl">{initial.id ? translate('editMedicine') : translate('addMedicine')}</h3><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{translate('caregiverEnteredOnly')}</p></div><button onClick={onCancel} aria-label={translate('close')}><X /></button></div>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-bold">{translate('medicineName')}<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 min-h-14 w-full rounded-xl border bg-transparent px-4" /></label>
      <label className="text-sm font-bold">{translate('medicinePhoto')}<input type="file" accept="image/*" onChange={(event) => updatePhoto(event.target.files?.[0])} className="mt-2 block min-h-14 w-full rounded-xl border bg-transparent p-3" /><span className="mt-1 block text-xs font-normal text-[hsl(var(--muted-foreground))]">{translate('photoOptional')}</span></label>
      <label className="text-sm font-bold md:col-span-2">{translate('instruction')}<textarea value={form.instruction} onChange={(event) => setForm({ ...form, instruction: event.target.value })} rows={3} className="mt-2 w-full rounded-xl border bg-transparent p-4" /></label>
      <label className="text-sm font-bold">{translate('time')}<input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className="mt-2 min-h-14 w-full rounded-xl border bg-transparent px-4" /></label>
      <label className="text-sm font-bold">{translate('frequency')}<select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value as MedicineSchedule['frequency'] })} className="mt-2 min-h-14 w-full rounded-xl border bg-[hsl(var(--card))] px-4"><option value="daily">{translate('daily')}</option><option value="weekdays">{translate('weekdays')}</option><option value="weekly">{translate('weekly')}</option></select></label>
      <label className="text-sm font-bold">{translate('startDate')}<input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className="mt-2 min-h-14 w-full rounded-xl border bg-transparent px-4" /></label>
      <label className="text-sm font-bold">{translate('endDate')}<input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className="mt-2 min-h-14 w-full rounded-xl border bg-transparent px-4" /></label>
      <label className="text-sm font-bold md:col-span-2">{translate('voiceInstruction')}<input value={form.voiceInstruction} onChange={(event) => setForm({ ...form, voiceInstruction: event.target.value })} className="mt-2 min-h-14 w-full rounded-xl border bg-transparent px-4" /></label>
      <label className="flex min-h-14 items-center gap-3 rounded-xl border px-4 font-bold md:col-span-2"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="h-5 w-5" />{form.active ? translate('active') : translate('inactive')}</label>
    </div>
    <div className="mt-5 flex justify-end gap-2"><button onClick={onCancel} className="min-h-12 rounded-xl px-4 font-bold">{translate('cancel')}</button><button disabled={!form.name.trim()} onClick={() => onSave({ ...form, name: form.name.trim() })} className="min-h-12 rounded-xl bg-[hsl(var(--primary))] px-5 font-bold text-[hsl(var(--primary-foreground))] disabled:opacity-50">{translate('saveSchedule')}</button></div>
  </SectionCard>;
}

function MedicineHistory({ lang, events, schedules }: { lang: Lang; events: MedicineEvent[]; schedules: MedicineSchedule[] }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const names = new Map(schedules.map((medicine) => [medicine.id, medicine.name]));
  return <SectionCard><h3 className="mb-4 text-xl font-bold">{translate('medicineHistory')}</h3>{events.length ? <div className="space-y-2">{events.slice(-12).reverse().map((event) => <div key={event.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-[hsl(var(--muted)/.55)] p-3"><CalendarDays size={18} className="text-[hsl(var(--primary))]" /><span className="min-w-32 flex-1 font-bold">{names.get(event.medicineId) ?? event.medicineId}</span><Badge tone={event.status === 'missed' ? 'accent' : event.status === 'taken' ? 'primary' : 'muted'}>{translate(event.status === 'scheduled' ? 'scheduled' : event.status)}</Badge><span className="text-xs text-[hsl(var(--muted-foreground))]">{new Date(event.timestamp).toLocaleString(lang)}</span></div>)}</div> : <p className="text-sm text-[hsl(var(--muted-foreground))]">{translate('noResults')}</p>}</SectionCard>;
}

function Medicine({ lang, role }: { lang: Lang; role: Role }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const [schedules, setSchedules] = useState<MedicineSchedule[]>(() => getMedicineSchedules());
  const [events, setEvents] = useState<MedicineEvent[]>(() => getMedicineEvents());
  const [editing, setEditing] = useState<MedicineSchedule | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [notificationState, setNotificationState] = useState(notificationPermission());
  const [fallbackReminder, setFallbackReminder] = useState(notificationPermission() !== 'granted');
  const today = dateKey();
  const todaySchedules = schedules.filter((medicine) => isScheduledForDate(medicine)).sort((a, b) => a.time.localeCompare(b.time));
  const currentMedicine = todaySchedules[currentIndex % Math.max(todaySchedules.length, 1)];
  const currentStatus = currentMedicine ? latestMedicineStatus(currentMedicine.id, events, today) : 'scheduled';

  useEffect(() => {
    const now = new Date();
    const additions: MedicineEvent[] = [];
    todaySchedules.forEach((medicine) => {
      const dayEvents = events.filter((event) => event.medicineId === medicine.id && event.scheduledFor === today);
      if (dayEvents.length === 0) {
        additions.push({ id: `scheduled-${medicine.id}-${today}`, medicineId: medicine.id, status: 'scheduled', timestamp: new Date().toISOString(), scheduledFor: today });
      }
      const hasAction = dayEvents.some((event) => event.status === 'taken' || event.status === 'delayed' || event.status === 'missed');
      const dueAt = new Date(`${today}T${medicine.time}:00`).getTime();
      if (!hasAction && now.getTime() > dueAt + 2 * 60 * 60 * 1000) {
        additions.push({ id: `missed-${medicine.id}-${today}`, medicineId: medicine.id, status: 'missed', timestamp: new Date().toISOString(), scheduledFor: today });
      }
    });
    if (additions.length) {
      const next = [...events, ...additions];
      setEvents(next);
      writeStore('ner-medicine-events', next);
    }
  }, [today, todaySchedules, events]);

  useEffect(() => {
    let cancelled = false;
    const checkReminders = async () => {
      const now = new Date();
      for (const medicine of todaySchedules) {
        const dueAt = new Date(`${today}T${medicine.time}:00`).getTime();
        const status = latestMedicineStatus(medicine.id, events, today);
        if (now.getTime() < dueAt || status === 'taken' || status === 'missed') continue;
        const key = `ner-notified-${medicine.id}-${today}-${medicine.time}`;
        if (localStorage.getItem(key)) continue;
        const sent = await sendMedicineNotification(medicine, {
          title: translate('notificationTitle'),
          scheduled: translate('scheduled'),
          taken: translate('taken'),
          later: translate('later'),
        });
        if (cancelled) return;
        if (!sent) {
          setFallbackReminder(true);
        } else {
          localStorage.setItem(key, '1');
        }
      }
    };
    void checkReminders();
    const timer = window.setInterval(() => { void checkReminders(); }, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [lang, today, todaySchedules, events]);

  useEffect(() => {
    const handleNotificationAction = (event: MessageEvent<{ type?: string; action?: string; medicineId?: string }>) => {
      if (event.data?.type !== 'MEDICINE_NOTIFICATION_ACTION' || !event.data.medicineId) return;
      const medicine = todaySchedules.find((item) => item.id === event.data.medicineId);
      if (!medicine) return;
      if (event.data.action === 'taken') {
        record(medicine, 'taken');
      } else if (event.data.action === 'later') {
        record(medicine, 'delayed');
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleNotificationAction);
    return () => navigator.serviceWorker?.removeEventListener('message', handleNotificationAction);
  }, [todaySchedules, events]);

  const record = (medicine: MedicineSchedule, status: Exclude<MedicineEventStatus, 'scheduled'>) => {
    const event = { id: `${status}-${medicine.id}-${Date.now()}`, medicineId: medicine.id, status, timestamp: new Date().toISOString(), scheduledFor: today };
    saveMedicineEvent(event);
    setEvents(getMedicineEvents());
    if (status === 'taken') {
      setConfirmation(medicine.name);
      window.setTimeout(() => setConfirmation(null), 3500);
    }
    if (status !== 'missed' && status !== 'taken') setCurrentIndex((value) => Math.min(value + 1, Math.max(todaySchedules.length - 1, 0)));
  };
  const requestNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationState(permission);
    setFallbackReminder(permission !== 'granted');
  };
  const saveSchedule = (medicine: MedicineSchedule) => {
    const next = medicine.id ? schedules.map((item) => item.id === medicine.id ? medicine : item) : [...schedules, { ...medicine, id: `medicine-${Date.now()}` }];
    setSchedules(next);
    saveMedicineSchedules(next);
    setEditing(null);
  };
  const removeSchedule = (id: string) => { const next = schedules.filter((item) => item.id !== id); setSchedules(next); saveMedicineSchedules(next); };

  if (role !== 'patient') {
    const todayStatuses = schedules.filter((medicine) => isScheduledForDate(medicine)).map((medicine) => latestMedicineStatus(medicine.id, events, today));
    const takenCount = todayStatuses.filter((status) => status === 'taken').length;
    const missedCount = todayStatuses.filter((status) => status === 'missed').length;
    const pendingCount = todayStatuses.filter((status) => status === 'scheduled' || status === 'delayed').length;
    return <div className="gentle-in space-y-5"><PageIntro icon={Bell} title={translate('medicineSchedule')} hint={translate('safetyNotice')} />
      <div className="grid gap-3 sm:grid-cols-3"><StatCard label={translate('takenCount')} value={String(takenCount)} detail={translate('todayMedicines')} /><StatCard label={translate('pendingCount')} value={String(pendingCount)} detail={translate('todayMedicines')} /><StatCard label={translate('missedCount')} value={String(missedCount)} detail={translate('todayMedicines')} /></div>
      {editing ? <MedicineEditor lang={lang} initial={editing} onSave={saveSchedule} onCancel={() => setEditing(null)} /> : <button onClick={() => setEditing(blankMedicine())} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[hsl(var(--primary))] font-bold text-[hsl(var(--primary-foreground))]"><Plus size={20} />{translate('addMedicine')}</button>}
      <SectionCard><h3 className="mb-4 text-xl font-bold">{translate('medicineSchedule')}</h3><div className="space-y-3">{schedules.map((medicine) => <div key={medicine.id} className="flex flex-wrap items-center gap-3 rounded-2xl border p-3"><MedicinePhoto medicine={medicine} /><div className="min-w-40 flex-1"><p className="font-bold">{medicine.name}</p><p className="text-sm text-[hsl(var(--muted-foreground))]">{medicine.time} · {translate(medicine.frequency)}</p><Badge tone={medicine.active ? 'primary' : 'muted'}>{medicine.active ? translate('active') : translate('inactive')}</Badge></div><button onClick={() => setEditing(medicine)} className="min-h-12 rounded-xl border px-4 font-bold">{translate('editMedicine')}</button><button onClick={() => removeSchedule(medicine.id)} className="min-h-12 rounded-xl border border-[hsl(var(--destructive)/.4)] px-4 font-bold text-[hsl(var(--destructive))]">{translate('deleteMedicine')}</button></div>)}</div></SectionCard>
      <MedicineHistory lang={lang} events={events} schedules={schedules} />
    </div>;
  }

  return <div className="gentle-in space-y-5"><PageIntro icon={Bell} title={translate('medicine')} hint={translate('safetyNotice')} />
    {confirmation && <div className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--primary)/.3)] bg-[hsl(var(--primary)/.1)] p-4 font-bold text-[hsl(var(--primary))]"><CheckCircle2 size={23} />{translate('taken')}: {confirmation}</div>}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[hsl(var(--primary)/.25)] bg-[hsl(var(--primary)/.07)] p-4"><div className="flex items-center gap-3"><BellRing className="text-[hsl(var(--primary))]" /><span className="text-sm">{notificationState === 'granted' ? translate('notificationsEnabled') : fallbackReminder ? translate('notificationFallback') : translate('notificationPermission')}</span></div>{notificationState !== 'granted' && <button onClick={requestNotifications} className="min-h-12 rounded-xl bg-[hsl(var(--primary))] px-4 font-bold text-[hsl(var(--primary-foreground))]">{translate('requestNotifications')}</button>}</div>
    {currentMedicine ? <SectionCard className="flex flex-col items-center text-center"><MedicinePhoto medicine={currentMedicine} large /><Badge tone={currentStatus === 'taken' ? 'primary' : currentStatus === 'missed' ? 'accent' : 'muted'}>{translate(currentStatus === 'scheduled' ? 'pending' : currentStatus)}</Badge><h3 className="serif mt-4 text-4xl">{currentMedicine.name}</h3><p className="mt-2 flex items-center gap-2 text-lg"><Clock3 size={20} />{currentMedicine.time}</p><p className="mt-4 max-w-xl text-lg leading-relaxed text-[hsl(var(--muted-foreground))]">{currentMedicine.instruction}</p>{currentMedicine.voiceInstruction && <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{currentMedicine.voiceInstruction}</p>}<div className="mt-6 flex w-full max-w-xl flex-wrap justify-center gap-3"><button onClick={() => record(currentMedicine, 'taken')} className="flex min-h-16 flex-1 items-center justify-center gap-2 rounded-2xl bg-[hsl(var(--primary))] px-5 text-lg font-bold text-[hsl(var(--primary-foreground))]"><CheckCircle2 size={22} />{translate('markTaken')}</button><button onClick={() => record(currentMedicine, 'delayed')} className="min-h-16 flex-1 rounded-2xl border px-5 text-lg font-bold">{translate('delayReminder')}</button></div><div className="mt-5 flex gap-2"><button disabled={currentIndex === 0} onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))} className="rounded-xl border p-3 disabled:opacity-40" aria-label={translate('previous')}><ChevronLeft /></button><span className="px-3 py-3 text-sm text-[hsl(var(--muted-foreground))]">{currentIndex + 1} / {todaySchedules.length}</span><button disabled={currentIndex >= todaySchedules.length - 1} onClick={() => setCurrentIndex((value) => Math.min(todaySchedules.length - 1, value + 1))} className="rounded-xl border p-3 disabled:opacity-40" aria-label={translate('next')}><ChevronRight /></button></div></SectionCard> : <SectionCard className="py-14 text-center"><Bell className="mx-auto mb-4 text-[hsl(var(--primary))]" size={42} /><p className="text-lg font-bold">{translate('noMedicines')}</p></SectionCard>}
    <MedicineHistory lang={lang} events={events} schedules={schedules} />
  </div>;
}

const musicCategoryKeys: Record<MusicCategory, CopyKey> = { favorites: 'favorites', calm: 'calm', memories: 'memoriesCategory', regional: 'regional', instrumental: 'instrumental', nature: 'nature' };


function Memories({ lang, role }: { lang: Lang; role: Role }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const [memories, setMemories] = useState<MemoryProfile[]>(() => getMemoryProfiles());
  const [editing, setEditing] = useState<MemoryProfile | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MemoryProfile>({ id: '', name: '', relationship: 'Daughter', voiceNote: '', description: '', photoDataUrl: '', voiceNoteDataUrl: '' });
  const emptyProfile = (): MemoryProfile => ({ id: '', name: '', relationship: 'Daughter', voiceNote: '', description: '', photoDataUrl: '', voiceNoteDataUrl: '' });
  const openForm = (profile?: MemoryProfile) => { setForm(profile ?? emptyProfile()); setEditing(profile ?? null); setOpen(true); };
  const save = () => {
    if (!form.name.trim() || (!editing && memories.length >= 25)) return;
    const next = editing ? memories.map((item) => item.id === form.id ? { ...form, name: form.name.trim() } : item) : [...memories, { ...form, id: `memory-${Date.now()}`, name: form.name.trim() }];
    setMemories(next); writeStore('ner-memory-profiles', next); setOpen(false); setEditing(null);
  };
  const remove = (id: string) => { const next = memories.filter((item) => item.id !== id); setMemories(next); writeStore('ner-memory-profiles', next); };
  const updatePhoto = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => setForm((value) => ({ ...value, photoDataUrl: String(reader.result ?? '') })); reader.readAsDataURL(file); };
  const updateVoiceNote = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => setForm((value) => ({ ...value, voiceNoteDataUrl: String(reader.result ?? '') })); reader.readAsDataURL(file); };
  const playCue = (memory: MemoryProfile) => {
    if (memory.voiceNoteDataUrl) return;
    if ('speechSynthesis' in window && memory.voiceNote) window.speechSynthesis.speak(new SpeechSynthesisUtterance(memory.voiceNote));
  };
  return <div className="gentle-in"><PageIntro icon={UsersRound} title={translate('personalMemories')} hint={translate('demoProfiles')} /><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Badge tone="muted">{translate('personalMemories')}: {memories.length}/25</Badge><button onClick={() => openForm()} disabled={memories.length >= 25} className="flex min-h-12 items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 font-bold text-[hsl(var(--primary-foreground))] disabled:cursor-not-allowed disabled:opacity-50"><Plus size={19} />{translate('addMemory')}</button></div>{memories.length >= 25 && <p className="mb-5 rounded-2xl bg-[hsl(var(--accent)/.12)] p-4 text-sm text-[hsl(var(--accent))]">{translate('memoryLimitReached')}</p>}{open && <SectionCard className="pop mb-5"><div className="mb-4 flex items-center justify-between"><h3 className="serif text-2xl">{editing ? translate('editMemory') : translate('addMemory')}</h3><button onClick={() => setOpen(false)} aria-label={translate('close')}><X /></button></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">{translate('nameField')}<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 min-h-14 w-full rounded-xl border bg-transparent px-4" /></label><label className="text-sm font-bold">{translate('relationshipField')}<select value={form.relationship} onChange={(event) => setForm({ ...form, relationship: event.target.value })} className="mt-2 min-h-14 w-full rounded-xl border bg-[hsl(var(--card))] px-4">${Object.keys(relationshipLabels.en).map((relationship) => <option key={relationship} value={relationship}>{localizedRelationship(lang, relationship)}</option>)}</select></label><label className="text-sm font-bold">{translate('voiceNoteReference')}<input value={form.voiceNote} onChange={(event) => setForm({ ...form, voiceNote: event.target.value })} placeholder={translate('noVoiceNote')} className="mt-2 min-h-14 w-full rounded-xl border bg-transparent px-4" /></label><label className="text-sm font-bold">{translate('descriptionField')}<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 min-h-14 w-full rounded-xl border bg-transparent px-4" /></label><label className="text-sm font-bold sm:col-span-2">{translate('photoField')}<input type="file" accept="image/*" onChange={(event) => updatePhoto(event.target.files?.[0])} className="mt-2 block min-h-14 w-full rounded-xl border bg-transparent p-3" />{form.photoDataUrl && <img src={form.photoDataUrl} alt="" className="mt-3 h-20 w-20 rounded-2xl object-cover" />}</label><label className="text-sm font-bold sm:col-span-2">{translate('voiceNoteReference')}<input type="file" accept="audio/*" onChange={(event) => updateVoiceNote(event.target.files?.[0])} className="mt-2 block min-h-14 w-full rounded-xl border bg-transparent p-3" />{form.voiceNoteDataUrl && <audio controls src={form.voiceNoteDataUrl} className="mt-3 w-full" />}</label></div><div className="mt-5 flex justify-end gap-2"><button onClick={() => setOpen(false)} className="min-h-12 rounded-xl px-4 font-bold">{translate('cancel')}</button><button onClick={save} className="min-h-12 rounded-xl bg-[hsl(var(--primary))] px-5 font-bold text-[hsl(var(--primary-foreground))]">{translate('save')}</button></div></SectionCard>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{memories.length ? memories.map((memory) => <SectionCard key={memory.id} className="relative"><div className="mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--secondary))] text-2xl font-bold text-[hsl(var(--primary))]">{memory.photoDataUrl ? <img src={memory.photoDataUrl} alt="" className="h-full w-full object-cover" /> : memory.name.charAt(0)}</div><div className="flex items-start justify-between gap-2"><div><h3 className="text-lg font-bold">{memory.name}</h3><Badge tone="muted">{localizedRelationship(lang, memory.relationship)}</Badge></div><button onClick={() => openForm(memory)} aria-label={translate('editMemory')} className="rounded-xl p-2 text-[hsl(var(--primary))]"><Pencil size={18} /></button></div><p className="mt-3 min-h-12 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{memory.description || translate('familiarFace')}</p><p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">{memory.voiceNote || translate('noVoiceNote')}</p>{role !== 'patient' && memory.voiceNote && <div className="mt-3 flex flex-wrap items-center gap-2">{memory.voiceNoteDataUrl ? <audio controls src={memory.voiceNoteDataUrl} className="max-w-full" /> : <button onClick={() => playCue(memory)} className="min-h-11 rounded-xl border px-3 text-sm font-bold">{translate('playVoiceCue')}</button>} {!memory.voiceNoteDataUrl && <span className="text-xs text-[hsl(var(--muted-foreground))]">{translate('voicePreview')}</span>}</div>}<button onClick={() => remove(memory.id)} className="mt-4 flex items-center gap-2 text-sm font-bold text-[hsl(var(--destructive))]"><Trash2 size={16} />{translate('remove')}</button></SectionCard>) : <SectionCard className="col-span-full py-14 text-center"><Heart className="mx-auto mb-4 text-[hsl(var(--accent))]" size={36} /><p className="font-bold">{translate('memoriesEmpty')}</p></SectionCard>}</div></div>;
}

function EmergencyHelp({ role }: { lang: Lang; role: Role }) {
  const [contacts, setContacts] = useState<EmergencyContact[]>(() => getEmergencyContacts());
  useEffect(() => {
    const reloadContacts = () => setContacts(getEmergencyContacts());
    reloadContacts();
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'ner-emergency-contacts') reloadContacts();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('ner-sync-updated', reloadContacts);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('ner-sync-updated', reloadContacts);
    };
  }, []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const empty = (): EmergencyContact => ({ id: '', name: '', relationship: '', phone: '', address: '', note: '', isEmergency: false });
  const [form, setForm] = useState<EmergencyContact>(empty());
  const save = () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    const next = editing ? contacts.map((item) => item.id === form.id ? { ...form, name: form.name.trim() } : item) : [...contacts, { ...form, id: `emergency-${Date.now()}`, name: form.name.trim() }];
    setContacts(next); saveEmergencyContacts(next); setOpen(false); setEditing(null); setForm(empty());
  };
  const remove = (id: string) => { const next = contacts.filter((item) => item.id !== id); setContacts(next); saveEmergencyContacts(next); };
  const edit = (item: EmergencyContact) => { setForm(item); setEditing(item); setOpen(true); };
  const openAdd = () => { setForm(empty()); setEditing(null); setOpen(true); };
  return <div className="gentle-in space-y-5">
    <PageIntro icon={ShieldCheck} title="Emergency & Help" hint={role === 'patient' ? "View important contacts, addresses and notes added by the caregiver." : "Add important contacts, addresses and notes for the patient."} />
    {role !== 'patient' && <button onClick={openAdd} className="flex min-h-12 items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 font-bold text-[hsl(var(--primary-foreground))]"><Plus size={19} />Add emergency information</button>}
    {open && role !== 'patient' && <SectionCard className="pop"><div className="mb-4 flex items-center justify-between"><h3 className="serif text-2xl">{editing ? 'Edit contact / note' : 'Add contact / note'}</h3><button onClick={() => setOpen(false)} aria-label="Close"><X /></button></div><div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-bold">Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 min-h-14 w-full rounded-xl border bg-transparent px-4" /></label>
      <label className="text-sm font-bold">Relationship<input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="Daughter, son, caregiver..." className="mt-2 min-h-14 w-full rounded-xl border bg-transparent px-4" /></label>
      <label className="text-sm font-bold">Mobile number<input type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 min-h-14 w-full rounded-xl border bg-transparent px-4" /></label>
      <label className="text-sm font-bold sm:col-span-2">Address<textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} className="mt-2 w-full rounded-xl border bg-transparent p-4" /></label>
      <label className="text-sm font-bold sm:col-span-2">Important note / emergency instruction<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className="mt-2 w-full rounded-xl border bg-transparent p-4" /></label>
      <label className="flex items-center gap-3 text-sm font-bold sm:col-span-2"><input type="checkbox" checked={form.isEmergency} onChange={(e) => setForm({ ...form, isEmergency: e.target.checked })} className="h-5 w-5" />Mark as emergency contact</label>
    </div><div className="mt-5 flex justify-end gap-2"><button onClick={() => setOpen(false)} className="min-h-12 rounded-xl px-4 font-bold">Cancel</button><button onClick={save} className="min-h-12 rounded-xl bg-[hsl(var(--primary))] px-5 font-bold text-[hsl(var(--primary-foreground))]">Save</button></div></SectionCard>}
    {contacts.length === 0 ? <SectionCard className="py-12 text-center"><p className="font-bold">No emergency contacts or notes added yet.</p><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">A caregiver can add important help information here.</p></SectionCard> : <div className="grid gap-4 sm:grid-cols-2">{contacts.slice().sort((a,b) => Number(b.isEmergency)-Number(a.isEmergency)).map((item) => <SectionCard key={item.id} className={item.isEmergency ? 'border-2 border-[hsl(var(--accent))]' : ''}><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-bold">{item.name}</h3>{item.relationship && <Badge tone="muted">{item.relationship}</Badge>}</div>{item.isEmergency && <Badge tone="accent">Emergency</Badge>}</div><a href={`tel:${item.phone}`} className="mt-5 flex min-h-14 items-center justify-center rounded-xl bg-[hsl(var(--primary))] px-4 font-bold text-[hsl(var(--primary-foreground))]">📞 Call {item.phone}</a>{item.address && <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`} className="mt-3 block rounded-xl border p-4 font-bold">📍 {item.address}<span className="mt-1 block text-xs font-normal opacity-70">Open directions</span></a>}{item.note && <div className="mt-3 rounded-xl bg-[hsl(var(--muted)/.55)] p-4"><p className="text-xs font-bold uppercase tracking-wide opacity-70">Important note</p><p className="mt-1">{item.note}</p></div>}{role !== 'patient' && <div className="mt-4 flex gap-3"><button onClick={() => edit(item)} className="rounded-xl border px-4 py-3 font-bold">Edit</button><button onClick={() => remove(item.id)} className="rounded-xl border px-4 py-3 font-bold text-[hsl(var(--destructive))]">Delete</button></div>}</SectionCard>)}</div>}
    <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">Store only information the patient and caregiver are comfortable keeping on this device. This section does not automatically contact emergency services.</p>
  </div>;
}

function Progress({ lang }: { lang: Lang }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const results = getGameResults();
  const average = results.length ? Math.round(results.reduce((sum, result) => sum + result.accuracy, 0) / results.length * 100) : 0;
  return <div className="gentle-in"><PageIntro icon={Activity} title={translate('progress')} hint={translate('activityOnly')} /><div className="grid gap-5 md:grid-cols-3"><StatCard label={translate('sessions')} value={String(results.length)} detail={translate('thisWeek')} /><StatCard label={translate('recentAccuracy')} value={`${average}%`} detail={translate('privacyShort')} /><StatCard label={translate('memoryCount')} value={String(getMemoryProfiles().length)} detail={translate('personalMemories')} /></div><SectionCard className="mt-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-bold">{translate('weekSummary')}</h3><Badge tone="muted">{translate('privacyShort')}</Badge></div>{results.length ? <div className="mt-7 flex h-44 items-end justify-between gap-3 border-b border-l p-3">{results.slice(-7).map((result, index) => <div key={result.id} className="flex flex-1 flex-col items-center gap-2"><div className="w-full max-w-12 rounded-t-xl bg-[hsl(var(--primary))]" style={{ height: `${Math.max(10, result.accuracy * 100)}%` }} /><span className="text-xs text-[hsl(var(--muted-foreground))]">{index + 1}</span></div>)}</div> : <p className="py-12 text-center text-[hsl(var(--muted-foreground))]">{translate('noResults')}</p>}<p className="mt-5 flex gap-2 text-sm text-[hsl(var(--muted-foreground))]"><CircleHelp size={17} />{translate('activityOnly')}</p></SectionCard></div>;
}
function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) { return <SectionCard><p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p><p className="mt-2 text-4xl font-bold text-[hsl(var(--primary))]">{value}</p><p className="mt-2 text-sm">{detail}</p></SectionCard>; }

function Caregiver({ lang }: { lang: Lang }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const allResults = getGameResults();
  const gameResults = allResults;
  const recentGames = gameResults.slice(-5).reverse();
  const accuracy = gameResults.length ? Math.round(gameResults.slice(-5).reduce((sum, item) => sum + item.accuracy, 0) / Math.min(gameResults.length, 5) * 100) : 0;
  const schedules = getMedicineSchedules();
  const events = getMedicineEvents();
  const today = dateKey();
  const todayMedicines = schedules.filter((medicine) => isScheduledForDate(medicine));
  const todayStatuses = todayMedicines.map((medicine) => latestMedicineStatus(medicine.id, events, today));
  const takenCount = todayStatuses.filter((status) => status === 'taken').length;
  const pendingCount = todayStatuses.filter((status) => status === 'scheduled' || status === 'delayed').length;
  const missedCount = todayStatuses.filter((status) => status === 'missed').length;
  const repeatedMisses = schedules.filter((medicine) => events.filter((event) => event.medicineId === medicine.id && event.status === 'missed').length >= 2);
  return <div className="gentle-in space-y-5"><PageIntro icon={Heart} title={translate('caregiverView')} hint={translate('caregiverHint')} /><div className="mb-1 flex items-center justify-between rounded-3xl bg-[hsl(var(--primary))] p-5 text-[hsl(var(--primary-foreground))]"><div><p className="text-sm opacity-75">{translate('patientName')}</p><p className="serif text-3xl">Amina Das</p></div><div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-xl font-bold">AD</div></div>
    {repeatedMisses.length > 0 && <div className="flex items-start gap-3 rounded-2xl border border-[hsl(var(--accent)/.45)] bg-[hsl(var(--accent)/.12)] p-4"><ShieldAlert className="mt-0.5 text-[hsl(var(--accent))]" /><div><p className="font-bold">{translate('repeatedMisses')}</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{repeatedMisses.map((medicine) => medicine.name).join(', ')} · {translate('activityOnly')}</p></div></div>}
    <SectionCard><div className="flex items-center justify-between gap-3"><h3 className="text-xl font-bold">{translate('medicineDashboard')}</h3><Link href="/medicine" className="min-h-11 rounded-xl bg-[hsl(var(--secondary))] px-4 py-3 text-sm font-bold">{translate('editMedicine')}</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><CareRow icon={CheckCircle2} label={translate('takenCount')} value={String(takenCount)} /><CareRow icon={Clock3} label={translate('pendingCount')} value={String(pendingCount)} /><CareRow icon={ShieldAlert} label={translate('missedCount')} value={String(missedCount)} /></div><div className="mt-4 flex flex-wrap gap-2">{todayMedicines.map((medicine) => <Badge key={medicine.id} tone={latestMedicineStatus(medicine.id, events, today) === 'missed' ? 'accent' : 'muted'}>{medicine.name} · {medicine.time}</Badge>)}</div><p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">{translate('recentAdherence')}: {events.slice(-5).reverse().map((event) => `${event.status} · ${new Date(event.timestamp).toLocaleDateString(lang)}`).join(' · ') || translate('noResults')}</p></SectionCard>

    <div className="grid gap-5 md:grid-cols-2"><SectionCard><h3 className="text-xl font-bold">{translate('gamesDashboard')}</h3><div className="mt-4 space-y-3">{recentGames.length ? recentGames.slice(0, 4).map((item) => <div key={item.id} className="flex items-center justify-between rounded-2xl bg-[hsl(var(--muted)/.55)] p-3"><span className="text-sm font-bold">{item.gameType.replaceAll('-', ' ')}</span><span className="text-sm text-[hsl(var(--muted-foreground))]">{Math.round(item.accuracy * 100)}% · {item.score}</span></div>) : <p className="text-sm text-[hsl(var(--muted-foreground))]">{translate('noResults')}</p>}<CareRow icon={Activity} label={translate('recentAccuracy')} value={`${accuracy}%`} /></div></SectionCard><SectionCard><h3 className="text-xl font-bold">{translate('activitiesToday')}</h3><div className="mt-5 space-y-4"><CareRow icon={Gamepad2} label={translate('gamesCompletedToday')} value={String(gameResults.length)} /><CareRow icon={Trophy} label={translate('latestScores')} value={recentGames[0] ? String(recentGames[0].score) : '—'} /><CareRow icon={UsersRound} label={translate('memoryCount')} value={`${getMemoryProfiles().length}/25`} /></div><Link href="/patient" className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] font-bold text-[hsl(var(--primary-foreground))]">{translate('viewPatient')}<ChevronRight size={18} /></Link></SectionCard></div>
  </div>;
}
function CareRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) { return <div className="flex items-center gap-3 rounded-2xl bg-[hsl(var(--muted)/.55)] p-3"><Icon className="text-[hsl(var(--primary))]" size={21} /><span className="flex-1 font-bold">{label}</span><span className="text-sm text-[hsl(var(--muted-foreground))]">{value}</span></div>; }

function Healthcare({ lang }: { lang: Lang }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const results = getGameResults();
  const current = results.at(-1);
  return <div className="gentle-in"><PageIntro icon={Stethoscope} title={translate('healthcareView')} hint={translate('healthcareHint')} /><div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><SectionCard><div className="flex items-center justify-between"><div><p className="text-sm text-[hsl(var(--muted-foreground))]">{translate('memberOverview')}</p><h3 className="serif text-3xl">Amina Das</h3></div><Badge>{translate('savedOnDevice')}</Badge></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><StatCard label={translate('engagement')} value={results.length ? 'Good' : '—'} detail={results.length ? `${Math.min(results.length, 7)} ${translate('activeDays')}` : translate('noResults')} /><StatCard label={translate('currentDifficulty')} value={current?.difficulty ?? '—'} detail={translate('recentPerformance')} /><StatCard label={translate('memoryCount')} value={String(getMemoryProfiles().length)} detail={translate('personalMemories')} /></div></SectionCard><SectionCard><div className="flex items-center gap-3"><ShieldCheck className="text-[hsl(var(--primary))]" size={25} /><h3 className="text-xl font-bold">{translate('sharedWithCare')}</h3></div><p className="mt-4 leading-relaxed text-[hsl(var(--muted-foreground))]">{translate('activityOnly')}</p><div className="mt-5 rounded-2xl bg-[hsl(var(--secondary)/.6)] p-4 text-sm"><p className="font-bold">{translate('lastNote')}</p><p className="mt-1">{translate('familiarSoundscape')}</p></div></SectionCard></div></div>;
}

function Settings({ lang, role, setLang, setRole }: { lang: Lang; role: Role; setLang: (l: Lang) => void; setRole: (r: Role) => void }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const [large, setLarge] = useState(() => readStore('ner-large-text', false));
  const toggleLarge = () => { setLarge(!large); writeStore('ner-large-text', !large); document.documentElement.style.fontSize = !large ? '18px' : '16px'; };
  const reset = () => { ['ner-med', 'ner-meds', 'ner-memory-profiles', 'ner-game-results', 'ner-large-text', 'ner-music-favorites', 'ner-music-volume'].forEach((key) => localStorage.removeItem(key)); clearMedicineData(); window.location.reload(); };
  return <div className="gentle-in max-w-3xl"><PageIntro icon={SettingsIcon} title={translate('settings')} hint={translate('privacy')} /><div className="space-y-4"><SectionCard><div className="flex items-center gap-3"><Languages className="text-[hsl(var(--primary))]" /><div className="flex-1"><h3 className="font-bold">{translate('language')}</h3></div><select value={lang} onChange={(event) => setLang(event.target.value as Lang)} className="min-h-12 rounded-xl border bg-transparent px-3">{languageOptions.map((item) => <option key={item.id} value={item.id}>{item.native}</option>)}</select></div></SectionCard><SectionCard><div className="flex items-center gap-3"><UserRound className="text-[hsl(var(--primary))]" /><div className="flex-1"><h3 className="font-bold">{translate('role')}</h3><p className="text-sm text-[hsl(var(--muted-foreground))]">{translate(role)}</p></div><select value={role} onChange={(event) => setRole(event.target.value as Role)} className="min-h-12 rounded-xl border bg-transparent px-3">{(['patient', 'caregiver', 'healthcare'] as Role[]).map((value) => <option key={value} value={value}>{translate(value)}</option>)}</select></div></SectionCard><SectionCard><div className="flex items-center gap-3"><BookOpen className="text-[hsl(var(--primary))]" /><div className="flex-1"><h3 className="font-bold">{translate('textSize')}</h3><p className="text-sm text-[hsl(var(--muted-foreground))]">{large ? translate('large') : translate('normal')}</p></div><button onClick={toggleLarge} className="min-h-12 rounded-xl bg-[hsl(var(--secondary))] px-4 font-bold">{large ? translate('normal') : translate('large')}</button></div></SectionCard><SectionCard><div className="flex items-center gap-3"><LockKeyhole className="text-[hsl(var(--primary))]" /><div><h3 className="font-bold">{translate('privacyTitle')}</h3><p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{translate('privacy')}</p></div></div></SectionCard><button onClick={reset} className="min-h-14 w-full rounded-2xl border border-[hsl(var(--destructive)/.35)] font-bold text-[hsl(var(--destructive))]">{translate('reset')}</button></div></div>;
}

type DueMedicineReminder = { id: string; name: string; time: string };

function MedicineReminderBanner({ lang }: { lang: Lang }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const [reminders, setReminders] = useState<DueMedicineReminder[]>([]);

  useEffect(() => {
    const handleDue = (event: Event) => {
      const detail = (event as CustomEvent<DueMedicineReminder>).detail;
      if (!detail?.id) return;
      setReminders((current) => current.some((item) => item.id === detail.id) ? current : [...current, detail]);
    };
    window.addEventListener('ner-medicine-due', handleDue);
    return () => window.removeEventListener('ner-medicine-due', handleDue);
  }, []);

  if (!reminders.length) return null;

  return <div className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-xl space-y-3" role="alert">
    {reminders.map((medicine) => (
      <div key={medicine.id} className="rounded-2xl border-2 border-[hsl(var(--primary)/.35)] bg-[hsl(var(--card))] p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <BellRing className="mt-1 shrink-0 text-[hsl(var(--primary))]" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{translate('notificationTitle')}</p>
            <p className="mt-1 text-sm">{medicine.name} · {translate('scheduled')} {medicine.time}</p>
          </div>
          <button
            type="button"
            aria-label={translate('taken')}
            onClick={() => {
              saveMedicineEvent({
                id: `taken-${medicine.id}-${Date.now()}`,
                medicineId: medicine.id,
                status: 'taken',
                timestamp: new Date().toISOString(),
                scheduledFor: dateKey(),
              });
              setReminders((current) => current.filter((item) => item.id !== medicine.id));
            }}
            className="min-h-11 rounded-xl bg-[hsl(var(--primary))] px-4 font-bold text-[hsl(var(--primary-foreground))]"
          >{translate('taken')}</button>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setReminders((current) => current.filter((item) => item.id !== medicine.id))}
            className="min-h-11 rounded-xl px-3 font-bold"
          >×</button>
        </div>
      </div>
    ))}
  </div>;
}

function MedicineNotificationScheduler({ lang }: { lang: Lang }) {
  const translate = (key: CopyKey) => tr(lang, key);

  useEffect(() => {
    let cancelled = false;

    const checkReminders = async () => {
      const schedules = getMedicineSchedules();
      const events = getMedicineEvents();
      const today = dateKey();
      const todaySchedules = schedules
        .filter((medicine) => isScheduledForDate(medicine))
        .sort((a, b) => a.time.localeCompare(b.time));
      const now = new Date();

      for (const medicine of todaySchedules) {
        const dueAt = new Date(`${today}T${medicine.time}:00`).getTime();
        const status = latestMedicineStatus(medicine.id, events, today);
        if (now.getTime() < dueAt || status === 'taken' || status === 'missed') continue;

        const key = `ner-notified-${medicine.id}-${today}-${medicine.time}`;
        if (localStorage.getItem(key)) continue;

        // Always create an in-app reminder. Browser notifications are an
        // additional channel and are not allowed to block the reminder.
        window.dispatchEvent(new CustomEvent('ner-medicine-due', {
          detail: { id: medicine.id, name: medicine.name, time: medicine.time },
        }));

        void sendMedicineNotification(medicine, {
          title: translate('notificationTitle'),
          scheduled: translate('scheduled'),
          taken: translate('taken'),
          later: translate('later'),
        });

        localStorage.setItem(key, '1');
        if (cancelled) return;
      }
    };

    const initialCheck = window.setTimeout(() => { void checkReminders(); }, 0);
    const timer = window.setInterval(() => { void checkReminders(); }, 15000);

    return () => {
      cancelled = true;
      window.clearTimeout(initialCheck);
      window.clearInterval(timer);
    };
  }, [lang]);

  return null;
}

function Router() {
  const { lang, role, setLang, setRole } = useAppPrefs();
  return <Switch><Route path="/"><Welcome lang={lang} role={role} setLang={setLang} setRole={setRole} /></Route><Route><AppFrame lang={lang} role={role}><Switch><Route path="/patient"><PatientHome lang={lang} /></Route><Route path="/games"><Games lang={lang} /></Route><Route path="/medicine"><Medicine lang={lang} role={role} /></Route><Route path="/memories"><Memories lang={lang} role={role} /></Route><Route path="/emergency"><EmergencyHelp lang={lang} role={role} /></Route><Route path="/progress"><Progress lang={lang} /></Route><Route path="/caregiver"><Caregiver lang={lang} /></Route><Route path="/healthcare"><Healthcare lang={lang} /></Route><Route path="/settings"><Settings lang={lang} role={role} setLang={setLang} setRole={setRole} /></Route><Route><Link href="/patient">{tr(lang, 'goHome')}</Link></Route></Switch></AppFrame></Route></Switch>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedErrorBoundary><MedicineNotificationScheduler lang={readStore('ner-lang', 'en' as Lang)} /><MedicineReminderBanner lang={readStore('ner-lang', 'en' as Lang)} /><Router /></RoutedErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;