import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity, ArrowLeft, Bell, BookOpen, Brain, Check, ChevronRight, CircleHelp, Clock3,
  CloudOff, Flower2, Gamepad2, Heart, Home as HomeIcon, Languages, Lightbulb, LockKeyhole,
  Menu, Mic, Music2, Pause, Pencil, Play, Plus, RotateCcw, Settings as SettingsIcon,
  ShieldCheck, Sparkles, Stethoscope, Sun, Trash2, Trophy, UserRound, UsersRound, Volume2,
  Wifi, X, type LucideIcon,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { adaptDifficulty, scoreGame, type Difficulty, type GameResult } from '@/lib/adaptive-engine';
import { culturalItems, demoMemoryProfiles, type CulturalItem } from '@/lib/game-data';
import { languageOptions, t, type CopyKey, type Lang, type Role } from '@/lib/i18n';
import { getGameResults, getMemoryProfiles, readStore, saveGameResult, type MemoryProfile, writeStore } from '@/lib/storage';

const queryClient = new QueryClient();

const tr = (lang: Lang, key: CopyKey) => t(lang, key);
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
  start: () => void;
  stop: () => void;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition() {
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

  const nav: [string, CopyKey, LucideIcon][] = [
    ['/patient', 'home', HomeIcon], ['/games', 'games', Gamepad2], ['/medicine', 'medicine', Bell],
    ['/music', 'music', Music2], ['/memories', 'memories', UsersRound], ['/progress', 'progress', Activity],
  ];

  const dispatchVoiceCommand = (command: string) => {
    const normalized = normalizeCommand(command);
    const navigation: Record<string, string> = {
      'go home': '/patient', home: '/patient', 'open games': '/games', games: '/games',
      'open medicine': '/medicine', medicine: '/medicine', 'open memories': '/memories', memories: '/memories',
      'open music': '/music', music: '/music', 'show progress': '/progress', progress: '/progress',
      settings: '/settings',
    };
    const target = Object.entries(navigation).find(([phrase]) => normalized.includes(phrase))?.[1];
    if (target) setLocation(target);
    window.dispatchEvent(new CustomEvent('ner-voice-command', { detail: normalized }));
  };

  const speak = () => {
    const Speech = getSpeechRecognition();
    if (!Speech) {
      setListening(true);
      window.setTimeout(() => setListening(false), 1800);
      return;
    }
    const recognition = new Speech();
    recognition.lang = languageOptions.find((item) => item.id === lang)?.speechLocale ?? 'en-IN';
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      dispatchVoiceCommand(transcript);
    };
    setListening(true);
    try { recognition.start(); } catch { setListening(false); }
  };

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
              {offline ? <CloudOff size={15} /> : <Wifi size={15} />}<span>{offline ? translate('offline') : translate('savedOnDevice')}</span>
            </div>
            <button className={`flex min-h-12 min-w-12 items-center justify-center rounded-full ${listening ? 'bg-[hsl(var(--accent))] text-white' : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'}`} data-testid="button-voice" onClick={speak} title={translate('voice')}><Mic size={22} /></button>
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
    <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><SectionCard className="relative overflow-hidden bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><div className="absolute right-0 top-0 h-full w-2/5 soft-pattern opacity-30" /><div className="relative"><p className="text-sm opacity-75">{translate('nextMedicine')}</p><div className="mt-3 flex items-end justify-between gap-3"><div><h3 className="serif text-4xl">Vitamin D</h3><p className="mt-2 flex items-center gap-2 text-base opacity-80"><Clock3 size={18} />{translate('dueAt')} 09:00 · {translate('morning')}</p></div><div className="rounded-2xl bg-white/15 p-4"><Bell size={29} /></div></div><div className="mt-6 flex flex-wrap gap-3">{med === 'pending' ? <><button onClick={() => mark('taken')} className="flex min-h-14 items-center gap-2 rounded-2xl bg-[hsl(var(--accent))] px-5 font-bold"><Check size={21} />{translate('takeNow')}</button><button onClick={() => mark('later')} className="min-h-14 rounded-2xl bg-white/15 px-5 font-bold">{translate('later')}</button></> : <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-5 py-4 font-bold"><Check size={21} />{med === 'taken' ? translate('taken') : translate('later')}</div>}</div></div></SectionCard><SectionCard className="flex flex-col justify-between"><div><Badge>{translate('progress')}</Badge><p className="mt-4 text-4xl font-bold">{results.length} <span className="text-base font-normal text-[hsl(var(--muted-foreground))]">{translate('sessions')}</span></p><p className="mt-1 text-[hsl(var(--muted-foreground))]">{translate('thisWeek')}</p></div><button onClick={() => setLocation('/progress')} className="mt-5 flex min-h-12 items-center justify-between rounded-xl bg-[hsl(var(--muted))] px-4 font-bold">{translate('progress')}<ChevronRight size={19} /></button></SectionCard></div>
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

function GameResultPanel({ lang, result, onAgain }: { lang: Lang; result: GameResult; onAgain: () => void }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const adaptation = adaptDifficulty(result, getGameResults());
  const reason = adaptation.reason === 'increase' ? 'increaseDifficulty' : adaptation.reason === 'reduce' ? 'reduceDifficulty' : 'stayDifficulty';
  return <div className="pop space-y-5 rounded-3xl border border-[hsl(var(--primary)/.3)] bg-[hsl(var(--primary)/.08)] p-5 md:p-7"><div className="flex items-start gap-3"><Trophy className="mt-1 text-[hsl(var(--accent))]" size={27} /><div><h3 className="serif text-3xl">{translate('gameComplete')}</h3><p className="mt-1 text-[hsl(var(--muted-foreground))]">{translate('gameCompleteSub')}</p></div></div><div className="grid grid-cols-2 gap-3 md:grid-cols-5">{[[translate('score'), result.score], [translate('accuracy'), `${Math.round(result.accuracy * 100)}%`], [translate('attempts'), result.attempts], [translate('hintsUsed'), result.hintsUsed], [translate('completionTime'), `${result.completionTime}s`]].map(([label, value]) => <div key={String(label)} className="rounded-2xl bg-[hsl(var(--card))] p-3"><p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>)}</div><div className="flex items-start gap-2 rounded-2xl bg-[hsl(var(--accent)/.12)] p-4 text-sm"><Sparkles className="mt-0.5 shrink-0 text-[hsl(var(--accent))]" size={18} /><span><strong>{translate('adaptiveHelp')}:</strong> {translate(reason)}</span></div><p className="text-sm text-[hsl(var(--muted-foreground))]">{translate('resultSaved')}</p><button onClick={onAgain} className="min-h-14 rounded-2xl bg-[hsl(var(--primary))] px-5 font-bold text-[hsl(var(--primary-foreground))]">{translate('playAgain')}</button></div>;
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
  const pieceCount = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 9;
  const culturalItem = culturalItems[0];

  const createPuzzle = () => {
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
  const slotGrid = pieceCount === 4 ? 'grid-cols-2' : pieceCount === 6 ? 'grid-cols-3' : 'grid-cols-3';
  if (result) return <GameResultPanel lang={lang} result={result} onAgain={createPuzzle} />;
  return <SectionCard><div className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><Badge tone="accent">{cultural ? translate('culturalGames') : translate('personalizedGames')}</Badge><h3 className="serif mt-3 text-3xl">{cultural ? culturalItem.titleKey : translate('rememberPlace')}</h3><p className="mt-1 text-[hsl(var(--muted-foreground))]">{translate('gameInstruction')}</p></div><div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]"><Clock3 size={17} />{elapsed}s</div></div>{!started ? <div className="space-y-5"><div className={`cultural-scene ${colors[culturalItem.color]} relative flex min-h-40 items-center justify-center overflow-hidden rounded-2xl`}><div className="absolute bottom-0 h-1/2 w-full bg-[hsl(171_38%_26%/.5)]" /><div className="relative text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/60 text-4xl font-bold text-[hsl(var(--primary))]">{culturalItem.symbol}</div><p className="mt-3 font-bold">{cultural ? culturalItem.detail : translate('rememberPlace')}</p></div></div><DifficultyPicker lang={lang} difficulty={difficulty} setDifficulty={setDifficulty} /><button onClick={createPuzzle} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[hsl(var(--primary))] font-bold text-[hsl(var(--primary-foreground))]"><Play size={20} />{translate('start')}</button></div> : <div className="space-y-5">{paused && <div className="rounded-2xl bg-[hsl(var(--secondary))] p-4 text-center font-bold">{translate('gamePaused')}</div>}<p className="rounded-2xl bg-[hsl(var(--muted))] p-4 text-center text-sm">{translate('dragPieces')}</p><div className={`mx-auto grid max-w-md ${slotGrid} gap-2 rounded-2xl bg-[hsl(var(--muted))] p-3`}>{placed.map((piece, index) => <button key={index} onClick={() => selectedPiece !== null && movePiece(selectedPiece, index)} onDragOver={(event) => event.preventDefault()} onDrop={() => selectedPiece !== null && movePiece(selectedPiece, index)} className={`flex aspect-square min-h-20 items-center justify-center rounded-xl border-2 border-dashed text-3xl font-bold transition-all ${piece === null ? 'border-[hsl(var(--primary)/.35)] bg-[hsl(var(--card)/.6)]' : 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.18)]'} ${hintIndex === index ? 'ring-4 ring-[hsl(var(--accent)/.55)]' : ''}`}>{piece === null ? '?' : <span className="cultural-tile h-full w-full rounded-lg" data-piece={piece}>{piece + 1}</span>}</button>)}</div><div className="flex flex-wrap justify-center gap-2">{pieces.filter((piece) => !placed.includes(piece)).map((piece) => <button key={piece} draggable onDragStart={() => setSelectedPiece(piece)} onClick={() => setSelectedPiece(piece)} className={`flex h-20 w-20 touch-none items-center justify-center rounded-2xl border-2 bg-[hsl(var(--card))] text-xl font-bold shadow-sm ${selectedPiece === piece ? 'border-[hsl(var(--accent))] ring-4 ring-[hsl(var(--accent)/.25)]' : 'border-[hsl(var(--border))]'}`}>{piece + 1}</button>)}</div><div className="flex flex-wrap gap-2"><button onClick={() => setPaused(!paused)} className="flex min-h-12 items-center gap-2 rounded-xl bg-[hsl(var(--secondary))] px-4 font-bold">{paused ? <Play size={18} /> : <Pause size={18} />}{paused ? translate('continueGame') : translate('pause')}</button><button onClick={createPuzzle} className="flex min-h-12 items-center gap-2 rounded-xl border px-4 font-bold"><RotateCcw size={18} />{translate('restart')}</button><button onClick={giveHint} className="flex min-h-12 items-center gap-2 rounded-xl border px-4 font-bold"><Lightbulb size={18} />{translate('hint')}</button><Badge tone="muted">{translate('attempts')}: {attempts} · {translate('hintsUsed')}: {hints}</Badge></div></div>}</SectionCard>;
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
  const currentProfile = profiles[round % Math.max(profiles.length, 1)] ?? demoMemoryProfiles[0];
  const currentCulture = culturalItems[round % culturalItems.length];
  const modes: MatchMode[] = cultural ? ['landmark', 'animal', 'object', 'food'] : ['photoToPerson', 'photoToName', 'photoToRelationship'];
  const options = cultural
    ? culturalItems.filter((item) => item.category === mode || item.id === currentCulture.id).slice(0, 4).concat(culturalItems.filter((item) => item.id !== currentCulture.id && item.category !== mode).slice(0, 2)).slice(0, 4)
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
  if (result) return <GameResultPanel lang={lang} result={result} onAgain={startGame} />;
  return <SectionCard><div className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><Badge tone="accent">{cultural ? translate('culturalGames') : translate('personalizedGames')}</Badge><h3 className="serif mt-3 text-3xl">{cultural ? translate('culturalMatch') : translate('familyMatch')}</h3><p className="mt-1 text-[hsl(var(--muted-foreground))]">{translate('chooseAnswer')}</p></div>{started && <Badge tone="muted">{translate('round')} {round + 1} / {roundTarget}</Badge>}</div>{!started ? <div className="space-y-5"><DifficultyPicker lang={lang} difficulty={difficulty} setDifficulty={setDifficulty} /><div><p className="mb-3 font-bold">{cultural ? translate('culturalContent') : translate('chooseGame')}</p><div className="grid gap-2 sm:grid-cols-3">{modes.map((value) => <button key={value} onClick={() => setMode(value)} className={`min-h-14 rounded-xl border px-3 text-left text-sm font-bold ${mode === value ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.12)]' : 'border-[hsl(var(--border))]'}`}>{value === 'landmark' ? translate('landmark') : value === 'animal' ? translate('animal') : value === 'object' ? translate('object') : value === 'food' ? translate('food') : translate(value)}</button>)}</div></div><button onClick={startGame} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[hsl(var(--primary))] font-bold text-[hsl(var(--primary-foreground))]"><Play size={20} />{translate('start')}</button></div> : <div className="space-y-5">{paused && <div className="rounded-2xl bg-[hsl(var(--secondary))] p-4 text-center font-bold">{translate('gamePaused')}</div>}<div className="flex flex-col items-center rounded-3xl bg-[hsl(var(--muted))] p-6 text-center"><div className={`flex h-32 w-32 items-center justify-center rounded-full ${cultural ? colors[currentCulture.color] : 'bg-[hsl(var(--secondary))]'} text-4xl font-bold text-[hsl(var(--primary))]`}>{cultural ? currentCulture.symbol : currentProfile.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><p className="mt-4 text-lg font-bold">{translate('chooseAnswer')}</p>{hinted && <p className="mt-2 text-sm text-[hsl(var(--accent))]">{cultural ? currentCulture.titleKey : currentProfile.name}</p>}</div><div className="grid gap-3 sm:grid-cols-2">{options.map((option) => { const id = cultural ? (option as CulturalItem).id : (option as MemoryProfile).id; const label = cultural ? (option as CulturalItem).titleKey : mode === 'photoToRelationship' ? (option as MemoryProfile).relationship : (option as MemoryProfile).name; return <button key={id} onClick={() => choose(id)} className="flex min-h-16 items-center gap-3 rounded-2xl border bg-[hsl(var(--card))] p-4 text-left font-bold transition-all hover:border-[hsl(var(--primary))]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--secondary))] text-sm">{cultural ? (option as CulturalItem).symbol : (option as MemoryProfile).name.charAt(0)}</span>{label}</button>; })}</div>{feedback && <div className={`rounded-2xl p-4 text-center font-bold ${feedback === 'correct' ? 'bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]' : 'bg-[hsl(var(--accent)/.15)] text-[hsl(var(--accent))]'}`}>{translate(feedback)}</div>}<div className="flex flex-wrap gap-2"><button onClick={() => setPaused(!paused)} className="flex min-h-12 items-center gap-2 rounded-xl bg-[hsl(var(--secondary))] px-4 font-bold">{paused ? <Play size={18} /> : <Pause size={18} />}{paused ? translate('continueGame') : translate('pause')}</button><button onClick={startGame} className="flex min-h-12 items-center gap-2 rounded-xl border px-4 font-bold"><RotateCcw size={18} />{translate('restart')}</button><button onClick={() => { setHints((value) => value + 1); setHinted(true); }} className="flex min-h-12 items-center gap-2 rounded-xl border px-4 font-bold"><Lightbulb size={18} />{translate('hint')}</button></div></div>}</SectionCard>;
}

function Medicine({ lang }: { lang: Lang }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const [items, setItems] = useState(() => readStore('ner-meds', [{ id: 1, name: 'Vitamin D', time: '09:00', period: 'morning', status: 'pending' }, { id: 2, name: 'Warm water', time: '13:00', period: 'afternoon', status: 'pending' }, { id: 3, name: 'Calcium', time: '20:00', period: 'evening', status: 'pending' }]) as { id: number; name: string; time: string; period: string; status: string }[]);
  const change = (id: number, status: string) => { const next = items.map((item) => item.id === id ? { ...item, status } : item); setItems(next); writeStore('ner-meds', next); };
  return <div className="gentle-in"><PageIntro icon={Bell} title={translate('medicine')} hint={translate('privacyShort')} /><div className="space-y-4">{items.map((item) => <SectionCard key={item.id} className="flex flex-wrap items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--secondary))]"><Clock3 size={25} /></div><div className="min-w-[150px] flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-bold">{item.name}</h3>{item.status !== 'pending' && <Badge tone={item.status === 'later' ? 'accent' : 'primary'}>{item.status === 'taken' ? translate('taken') : translate('later')}</Badge>}</div><p className="mt-1 text-[hsl(var(--muted-foreground))]">{item.time} · {translate(item.period as CopyKey)}</p></div>{item.status === 'pending' ? <div className="flex gap-2"><button onClick={() => change(item.id, 'taken')} className="min-h-12 rounded-xl bg-[hsl(var(--primary))] px-4 font-bold text-[hsl(var(--primary-foreground))]">{translate('taken')}</button><button onClick={() => change(item.id, 'later')} className="min-h-12 rounded-xl border px-4 font-bold">{translate('later')}</button></div> : <button onClick={() => change(item.id, 'pending')} className="min-h-12 rounded-xl border px-4 font-bold">{translate('restart')}</button>}</SectionCard>)}</div></div>;
}

function Music({ lang }: { lang: Lang }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const tracks = ['Bihu morning rhythm', 'Bamboo flute at dawn', 'Monsoon on the hills'];
  return <div className="gentle-in"><PageIntro icon={Music2} title={translate('music')} hint={translate('familiarSoundscape')} /><div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><SectionCard className="overflow-hidden bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]"><div className="relative flex min-h-72 flex-col justify-between overflow-hidden rounded-2xl bg-[hsl(var(--primary)/.35)] p-6"><div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border-[25px] border-[hsl(var(--accent)/.6)]" /><div className="relative flex justify-between"><Badge tone="accent">{translate('music')}</Badge><Volume2 size={21} /></div><div className="relative"><p className="text-sm opacity-70">{translate('region')}</p><h3 className="serif mt-1 text-3xl">{tracks[track]}</h3><div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full w-2/5 bg-[hsl(var(--accent))]" /></div><div className="mt-5 flex items-center justify-center gap-5"><button onClick={() => setTrack(track === 0 ? tracks.length - 1 : track - 1)} aria-label={translate('previous')} className="rounded-full p-3 hover:bg-white/10"><ArrowLeft size={20} /></button><button onClick={() => setPlaying(!playing)} aria-label={playing ? translate('pause') : translate('play')} className="flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-white">{playing ? <Pause /> : <Play className="ml-1" />}</button><button onClick={() => setTrack((track + 1) % tracks.length)} aria-label={translate('next')} className="rotate-180 rounded-full p-3 hover:bg-white/10"><ArrowLeft size={20} /></button></div></div></div></SectionCard><SectionCard><h3 className="mb-4 text-xl font-bold">{translate('chooseGame')}</h3><div className="space-y-3">{tracks.map((name, index) => <button key={name} onClick={() => { setTrack(index); setPlaying(true); }} className={`flex min-h-16 w-full items-center gap-4 rounded-2xl border px-4 text-left ${track === index ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.1)]' : 'border-[hsl(var(--border))]'}`}><div className="rounded-xl bg-[hsl(var(--secondary))] p-3"><Music2 size={20} /></div><div className="flex-1"><p className="font-bold">{name}</p><p className="text-xs text-[hsl(var(--muted-foreground))]">3 minutes</p></div>{track === index && playing ? <Pause size={18} /> : <Play size={18} />}</button>)}</div><button onClick={() => setRepeat(!repeat)} className={`mt-5 flex min-h-12 items-center gap-2 rounded-xl border px-4 font-bold ${repeat ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.1)]' : ''}`}><RotateCcw size={17} />{translate('repeat')}</button></SectionCard></div></div>;
}

function Memories({ lang }: { lang: Lang }) {
  const translate = (key: CopyKey) => tr(lang, key);
  const [memories, setMemories] = useState<MemoryProfile[]>(() => getMemoryProfiles());
  const [editing, setEditing] = useState<MemoryProfile | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MemoryProfile>({ id: '', name: '', relationship: 'Daughter', voiceNote: '', description: '', photoDataUrl: '' });
  const openForm = (profile?: MemoryProfile) => { setForm(profile ?? { id: '', name: '', relationship: 'Daughter', voiceNote: '', description: '', photoDataUrl: '' }); setEditing(profile ?? null); setOpen(true); };
  const save = () => {
    if (!form.name.trim() || (!editing && memories.length >= 25)) return;
    const next = editing ? memories.map((item) => item.id === form.id ? { ...form, name: form.name.trim() } : item) : [...memories, { ...form, id: `memory-${Date.now()}`, name: form.name.trim() }];
    setMemories(next); writeStore('ner-memory-profiles', next); setOpen(false); setEditing(null);
  };
  const remove = (id: string) => { const next = memories.filter((item) => item.id !== id); setMemories(next); writeStore('ner-memory-profiles', next); };
  const updatePhoto = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => setForm((value) => ({ ...value, photoDataUrl: String(reader.result ?? '') })); reader.readAsDataURL(file); };
  return <div className="gentle-in"><PageIntro icon={UsersRound} title={translate('personalMemories')} hint={translate('demoProfiles')} /><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Badge tone="muted">{translate('personalMemories')}: {memories.length}/25</Badge><button onClick={() => openForm()} disabled={memories.length >= 25} className="flex min-h-12 items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 font-bold text-[hsl(var(--primary-foreground))] disabled:cursor-not-allowed disabled:opacity-50"><Plus size={19} />{translate('addMemory')}</button></div>{memories.length >= 25 && <p className="mb-5 rounded-2xl bg-[hsl(var(--accent)/.12)] p-4 text-sm text-[hsl(var(--accent))]">{translate('memoryLimitReached')}</p>}{open && <SectionCard className="pop mb-5"><div className="mb-4 flex items-center justify-between"><h3 className="serif text-2xl">{editing ? translate('editMemory') : translate('addMemory')}</h3><button onClick={() => setOpen(false)} aria-label={translate('close')}><X /></button></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">{translate('nameField')}<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 min-h-14 w-full rounded-xl border bg-transparent px-4" /></label><label className="text-sm font-bold">{translate('relationshipField')}<select value={form.relationship} onChange={(event) => setForm({ ...form, relationship: event.target.value })} className="mt-2 min-h-14 w-full rounded-xl border bg-[hsl(var(--card))] px-4"><option>Daughter</option><option>Son</option><option>Grandchild</option><option>Neighbour</option><option>Friend</option><option>Caregiver</option></select></label><label className="text-sm font-bold">{translate('voiceNoteReference')}<input value={form.voiceNote} onChange={(event) => setForm({ ...form, voiceNote: event.target.value })} placeholder={translate('noVoiceNote')} className="mt-2 min-h-14 w-full rounded-xl border bg-transparent px-4" /></label><label className="text-sm font-bold">{translate('descriptionField')}<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 min-h-14 w-full rounded-xl border bg-transparent px-4" /></label><label className="text-sm font-bold sm:col-span-2">{translate('photoField')}<input type="file" accept="image/*" onChange={(event) => updatePhoto(event.target.files?.[0])} className="mt-2 block min-h-14 w-full rounded-xl border bg-transparent p-3" />{form.photoDataUrl && <img src={form.photoDataUrl} alt="" className="mt-3 h-20 w-20 rounded-2xl object-cover" />}</label></div><div className="mt-5 flex justify-end gap-2"><button onClick={() => setOpen(false)} className="min-h-12 rounded-xl px-4 font-bold">{translate('cancel')}</button><button onClick={save} className="min-h-12 rounded-xl bg-[hsl(var(--primary))] px-5 font-bold text-[hsl(var(--primary-foreground))]">{translate('save')}</button></div></SectionCard>}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{memories.length ? memories.map((memory) => <SectionCard key={memory.id} className="relative"><div className="mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--secondary))] text-2xl font-bold text-[hsl(var(--primary))]">{memory.photoDataUrl ? <img src={memory.photoDataUrl} alt="" className="h-full w-full object-cover" /> : memory.name.charAt(0)}</div><div className="flex items-start justify-between gap-2"><div><h3 className="text-lg font-bold">{memory.name}</h3><Badge tone="muted">{memory.relationship}</Badge></div><button onClick={() => openForm(memory)} aria-label={translate('editMemory')} className="rounded-xl p-2 text-[hsl(var(--primary))]"><Pencil size={18} /></button></div><p className="mt-3 min-h-12 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{memory.description || translate('familiarFace')}</p><p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">{memory.voiceNote || translate('noVoiceNote')}</p><button onClick={() => remove(memory.id)} className="mt-4 flex items-center gap-2 text-sm font-bold text-[hsl(var(--destructive))]"><Trash2 size={16} />{translate('remove')}</button></SectionCard>) : <SectionCard className="col-span-full py-14 text-center"><Heart className="mx-auto mb-4 text-[hsl(var(--accent))]" size={36} /><p className="font-bold">{translate('memoriesEmpty')}</p></SectionCard>}</div></div>;
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
  const results = getGameResults();
  const recent = results.slice(-5).reverse();
  const accuracy = results.length ? Math.round(results.slice(-5).reduce((sum, item) => sum + item.accuracy, 0) / Math.min(results.length, 5) * 100) : 0;
  return <div className="gentle-in"><PageIntro icon={Heart} title={translate('caregiverView')} hint={translate('caregiverHint')} /><div className="mb-5 flex items-center justify-between rounded-3xl bg-[hsl(var(--primary))] p-5 text-[hsl(var(--primary-foreground))]"><div><p className="text-sm opacity-75">{translate('patientName')}</p><p className="serif text-3xl">Amina Das</p></div><div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-xl font-bold">AD</div></div><div className="grid gap-5 md:grid-cols-2"><SectionCard><h3 className="text-xl font-bold">{translate('activitiesToday')}</h3><div className="mt-5 space-y-4"><CareRow icon={Gamepad2} label={translate('gamesCompletedToday')} value={String(results.length)} /><CareRow icon={Trophy} label={translate('latestScores')} value={recent[0] ? String(recent[0].score) : '—'} /><CareRow icon={Activity} label={translate('recentAccuracy')} value={`${accuracy}%`} /><CareRow icon={UsersRound} label={translate('memoryCount')} value={`${getMemoryProfiles().length}/25`} /></div></SectionCard><SectionCard><h3 className="text-xl font-bold">{translate('recentPerformance')}</h3>{recent.length ? <div className="mt-4 space-y-3">{recent.slice(0, 3).map((item) => <div key={item.id} className="flex items-center justify-between rounded-2xl bg-[hsl(var(--muted)/.55)] p-3"><span className="text-sm font-bold">{item.gameType.replaceAll('-', ' ')}</span><span className="text-sm text-[hsl(var(--muted-foreground))]">{Math.round(item.accuracy * 100)}% · {item.difficulty}</span></div>)}</div> : <p className="mt-4 text-[hsl(var(--muted-foreground))]">{translate('noResults')}</p>}<Link href="/patient" className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] font-bold text-[hsl(var(--primary-foreground))]">{translate('viewPatient')}<ChevronRight size={18} /></Link></SectionCard></div></div>;
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
  const reset = () => { ['ner-med', 'ner-meds', 'ner-memory-profiles', 'ner-game-results', 'ner-large-text'].forEach((key) => localStorage.removeItem(key)); window.location.reload(); };
  return <div className="gentle-in max-w-3xl"><PageIntro icon={SettingsIcon} title={translate('settings')} hint={translate('privacy')} /><div className="space-y-4"><SectionCard><div className="flex items-center gap-3"><Languages className="text-[hsl(var(--primary))]" /><div className="flex-1"><h3 className="font-bold">{translate('language')}</h3></div><select value={lang} onChange={(event) => setLang(event.target.value as Lang)} className="min-h-12 rounded-xl border bg-transparent px-3">{languageOptions.map((item) => <option key={item.id} value={item.id}>{item.native}</option>)}</select></div></SectionCard><SectionCard><div className="flex items-center gap-3"><UserRound className="text-[hsl(var(--primary))]" /><div className="flex-1"><h3 className="font-bold">{translate('role')}</h3><p className="text-sm text-[hsl(var(--muted-foreground))]">{translate(role)}</p></div><select value={role} onChange={(event) => setRole(event.target.value as Role)} className="min-h-12 rounded-xl border bg-transparent px-3">{(['patient', 'caregiver', 'healthcare'] as Role[]).map((value) => <option key={value} value={value}>{translate(value)}</option>)}</select></div></SectionCard><SectionCard><div className="flex items-center gap-3"><BookOpen className="text-[hsl(var(--primary))]" /><div className="flex-1"><h3 className="font-bold">{translate('textSize')}</h3><p className="text-sm text-[hsl(var(--muted-foreground))]">{large ? translate('large') : translate('normal')}</p></div><button onClick={toggleLarge} className="min-h-12 rounded-xl bg-[hsl(var(--secondary))] px-4 font-bold">{large ? translate('normal') : translate('large')}</button></div></SectionCard><SectionCard><div className="flex items-center gap-3"><LockKeyhole className="text-[hsl(var(--primary))]" /><div><h3 className="font-bold">{translate('privacyTitle')}</h3><p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{translate('privacy')}</p></div></div></SectionCard><button onClick={reset} className="min-h-14 w-full rounded-2xl border border-[hsl(var(--destructive)/.35)] font-bold text-[hsl(var(--destructive))]">{translate('reset')}</button></div></div>;
}

function Router() {
  const { lang, role, setLang, setRole } = useAppPrefs();
  return <Switch><Route path="/"><Welcome lang={lang} role={role} setLang={setLang} setRole={setRole} /></Route><Route><AppFrame lang={lang} role={role}><Switch><Route path="/patient"><PatientHome lang={lang} /></Route><Route path="/games"><Games lang={lang} /></Route><Route path="/medicine"><Medicine lang={lang} /></Route><Route path="/music"><Music lang={lang} /></Route><Route path="/memories"><Memories lang={lang} /></Route><Route path="/progress"><Progress lang={lang} /></Route><Route path="/caregiver"><Caregiver lang={lang} /></Route><Route path="/healthcare"><Healthcare lang={lang} /></Route><Route path="/settings"><Settings lang={lang} role={role} setLang={setLang} setRole={setRole} /></Route><Route><Link href="/patient">{tr(lang, 'goHome')}</Link></Route></Switch></AppFrame></Route></Switch>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) { const [location] = useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedErrorBoundary><Router /></RoutedErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;