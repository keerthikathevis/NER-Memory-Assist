import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import {
  Activity, AlertTriangle, BarChart3, Bell, CheckCircle2, ClipboardCheck, Clock3,
  HeartPulse, Home, Languages, LockKeyhole, Menu, Mic, Moon, ShieldCheck, UserRound,
  Users, X, LogOut, Settings, ChevronRight, Brain, CalendarDays, Dumbbell, Database,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, Router } from 'wouter';
import { predictiveRiskScore, MODEL_VALIDATION } from './lib/welfare-model';

type Lang = 'en' | 'ta' | 'hi';
type Role = 'personnel' | 'clinician' | 'welfare' | 'commander' | 'admin';
type Risk = 'LOWER' | 'MODERATE' | 'ELEVATED';

type Wellness = {
  stress: number; sleep: number; fatigue: number; workload: number; connection: number;
  updatedAt: string;
};

type Personnel = {
  id: string; name: string; rank: string; unit: string;
  contactNumber: string; email: string; dateOfJoining: string; serviceExperience: string; emergencyContact: string;
  currentDuty: string; deploymentLocation: string; deploymentHistory: string; transferHistory: string; trainingCommitments: string;
  deploymentDays: number; dutyHours: number; leaveGap: number; trainingLoad: number; restHours: number; transferCount: number;
  wellness: Wellness;
};

const seedPersonnel: Personnel[] = [
  { id:'PF-1024', name:'A. Kumar', rank:'Inspector', unit:'Unit Alpha', contactNumber:'Demo contact', email:'demo@example.org', dateOfJoining:'2018-06-12', serviceExperience:'8 years', emergencyContact:'Demo emergency contact', currentDuty:'Unit operations', deploymentLocation:'Unit Alpha', deploymentHistory:'Current assignment', transferHistory:'2 recorded transfers', trainingCommitments:'Annual operational training', deploymentDays:42, dutyHours:58, leaveGap:18, trainingLoad:82, restHours:7, transferCount:2, wellness:{stress:4,sleep:2,fatigue:4,workload:5,connection:3,updatedAt:'Today'} },
  { id:'PF-1087', name:'R. Singh', rank:'Sub-Inspector', unit:'Unit Alpha', contactNumber:'Demo contact', email:'demo@example.org', dateOfJoining:'2020-01-15', serviceExperience:'6 years', emergencyContact:'Demo emergency contact', currentDuty:'Field supervision', deploymentLocation:'Unit Alpha', deploymentHistory:'Current assignment', transferHistory:'1 recorded transfer', trainingCommitments:'Leadership training', deploymentDays:27, dutyHours:49, leaveGap:26, trainingLoad:61, restHours:7, transferCount:1, wellness:{stress:3,sleep:3,fatigue:3,workload:4,connection:4,updatedAt:'Today'} },
  { id:'PF-1142', name:'S. Das', rank:'Constable', unit:'Unit Bravo', contactNumber:'Demo contact', email:'demo@example.org', dateOfJoining:'2022-03-08', serviceExperience:'4 years', emergencyContact:'Demo emergency contact', currentDuty:'Patrol duty', deploymentLocation:'Unit Bravo', deploymentHistory:'Current assignment', transferHistory:'No recorded transfer', trainingCommitments:'Routine training', deploymentDays:19, dutyHours:44, leaveGap:12, trainingLoad:48, restHours:8, transferCount:0, wellness:{stress:2,sleep:4,fatigue:2,workload:3,connection:4,updatedAt:'Yesterday'} },
  { id:'PF-1198', name:'M. Devi', rank:'Head Constable', unit:'Unit Bravo', contactNumber:'Demo contact', email:'demo@example.org', dateOfJoining:'2017-09-21', serviceExperience:'9 years', emergencyContact:'Demo emergency contact', currentDuty:'Team supervision', deploymentLocation:'Unit Bravo', deploymentHistory:'Current assignment', transferHistory:'2 recorded transfers', trainingCommitments:'Advanced operational training', deploymentDays:35, dutyHours:54, leaveGap:31, trainingLoad:74, restHours:6, transferCount:2, wellness:{stress:4,sleep:2,fatigue:4,workload:4,connection:2,updatedAt:'Today'} },
  { id:'PF-1210', name:'N. Ali', rank:'Constable', unit:'Unit Charlie', contactNumber:'Demo contact', email:'demo@example.org', dateOfJoining:'2023-02-10', serviceExperience:'3 years', emergencyContact:'Demo emergency contact', currentDuty:'Support duty', deploymentLocation:'Unit Charlie', deploymentHistory:'Current assignment', transferHistory:'No recorded transfer', trainingCommitments:'Routine training', deploymentDays:11, dutyHours:41, leaveGap:9, trainingLoad:38, restHours:8, transferCount:0, wellness:{stress:2,sleep:4,fatigue:2,workload:2,connection:4,updatedAt:'Today'} },
];

function riskScore(p: Personnel) {
  return predictiveRiskScore({
    stress:p.wellness.stress, sleep:p.wellness.sleep, fatigue:p.wellness.fatigue,
    workload:p.wellness.workload, connection:p.wellness.connection,
    dutyHours:p.dutyHours, deploymentDays:p.deploymentDays, leaveGap:p.leaveGap,
    trainingLoad:p.trainingLoad, restHours:p.restHours, transferCount:p.transferCount
  });
}
function riskOf(p: Personnel): Risk {
  const s=riskScore(p);
  return s>=65?'ELEVATED':s>=42?'MODERATE':'LOWER';
}
function riskLabel(r: Risk) { return r==='LOWER'?'Lower indicators':r==='MODERATE'?'Moderate attention':'Elevated support indicators'; }

function riskBreakdown(p: Personnel) {
  const w = p.wellness;
  const factors = [
    { label: 'Duty / workload', value: Math.round(p.dutyHours * 0.45 + p.deploymentDays * 0.22 + p.leaveGap * 0.18 + p.trainingLoad * 0.08), detail: `${p.dutyHours}h duty, ${p.deploymentDays}d deployment, ${p.leaveGap}d since leave` },
    { label: 'Fatigue', value: Math.max(0, 8 - p.restHours) * 6 + w.fatigue * 5, detail: `${w.fatigue}/5 fatigue, ${p.restHours}h rest/night` },
    { label: 'Perceived stress', value: w.stress * 5, detail: `${w.stress}/5 self-reported stress` },
    { label: 'Sleep / recovery', value: (6 - w.sleep) * 5, detail: `${w.sleep}/5 sleep quality` },
    { label: 'Perceived workload', value: w.workload * 5, detail: `${w.workload}/5 perceived workload` },
  ];
  return factors.sort((a,b)=>b.value-a.value).slice(0,3);
}

const copy = {
  en:{title:'NeuroFlex',subtitle:'AI-Powered Personnel Stress & Welfare Support',home:'Dashboard',profile:'My Profile',assessment:'Occupational Health Assessment',check:'Wellness Check-In',trends:'Wellness Trends',workload:'Duty & Workload',welfare:'Welfare Dashboard',alerts:'Alerts',privacy:'Privacy & Consent',counselling:'Counselling & Support',settings:'Settings',credentials:'Credential Verification',welcome:'Personnel Wellness Dashboard',startCheck:'Complete wellness check-in',myStatus:'My wellness status',risk:'Welfare indicator',recommend:'Recommendations',save:'Save check-in',stress:'Stress',sleep:'Sleep quality',fatigue:'Fatigue',workloadScore:'Workload',connection:'Support connection',hours:'Duty hours/week',deployment:'Deployment days',leave:'Days since leave',rest:'Rest hours/night',training:'Training load',consent:'Consent & privacy',consentText:'Wellness data is voluntary. This prototype is for welfare support, not diagnosis or disciplinary decisions.',language:'Language',role:'Role',personnel:'Personnel',clinician:'Clinician',welfareOfficer:'Welfare Officer',commander:'Commander',admin:'Administrator',privacyTitle:'Privacy by design',privacyBody:'Use consent, role-based access, data minimization, secure storage and audit trails before any real deployment.',explain:'Why this indicator?',recommendations:'Welfare recommendations',view:'View details',noAlerts:'No new welfare alerts.',demo:'Synthetic demo data',signOut:'Sign out'},
  ta:{title:'NeuroFlex',subtitle:'AI அடிப்படையிலான பணியாளர் நலன் ஆதரவு',home:'டாஷ்போர்டு',profile:'என் சுயவிவரம்',assessment:'தொழில்சார் நலன் மதிப்பீடு',check:'நலன் மதிப்பீடு',trends:'நலன் போக்குகள்',workload:'பணி மற்றும் சுமை',welfare:'நல அலுவலர் டாஷ்போர்டு',alerts:'எச்சரிக்கைகள்',privacy:'தனியுரிமை மற்றும் ஒப்புதல்',counselling:'ஆலோசனை மற்றும் ஆதரவு',settings:'அமைப்புகள்',credentials:'சான்றிதழ் சரிபார்ப்பு',welcome:'பணியாளர் நலன் டாஷ்போர்டு',startCheck:'நலன் மதிப்பீட்டை தொடங்குங்கள்',myStatus:'என் நல நிலை',risk:'நல குறியீடு',recommend:'பரிந்துரைகள்',save:'மதிப்பீட்டை சேமி',stress:'மன அழுத்தம்',sleep:'தூக்க தரம்',fatigue:'சோர்வு',workloadScore:'பணி சுமை',connection:'ஆதரவு தொடர்பு',hours:'வார பணி நேரம்',deployment:'பணியமர்த்தல் நாட்கள்',leave:'கடைசி விடுப்பிலிருந்து நாட்கள்',rest:'இரவு ஓய்வு நேரம்',training:'பயிற்சி சுமை',consent:'ஒப்புதல் மற்றும் தனியுரிமை',consentText:'நலன் தரவு தன்னார்வமானது. இது மருத்துவ நோயறிதல் அல்லது ஒழுங்கு நடவடிக்கைக்கான கருவி அல்ல.',language:'மொழி',role:'பங்கு',personnel:'பணியாளர்',clinician:'மருத்துவ ஆலோசகர்',welfareOfficer:'நல அலுவலர்',commander:'தளபதி',admin:'நிர்வாகி',privacyTitle:'தனியுரிமை முதன்மை',privacyBody:'உண்மையான பயன்பாட்டிற்கு முன் ஒப்புதல், பங்கு அடிப்படையிலான அணுகல், அடையாளமற்ற பகுப்பாய்வு மற்றும் audit பதிவுகள் பயன்படுத்தப்பட வேண்டும்.',explain:'இந்த குறியீடு ஏன்?',recommendations:'நலன் பரிந்துரைகள்',view:'விவரங்களை பார்க்க',noAlerts:'புதிய நல எச்சரிக்கைகள் இல்லை.',demo:'செயற்கை டெமோ தரவு',signOut:'வெளியேறு'},
  hi:{title:'NeuroFlex',subtitle:'AI आधारित कार्मिक तनाव और कल्याण सहायता',home:'डैशबोर्ड',profile:'मेरी प्रोफ़ाइल',assessment:'व्यावसायिक स्वास्थ्य आकलन',check:'कल्याण जांच',trends:'कल्याण रुझान',workload:'ड्यूटी और कार्यभार',welfare:'कल्याण डैशबोर्ड',alerts:'अलर्ट',privacy:'गोपनीयता और सहमति',counselling:'परामर्श और सहायता',settings:'सेटिंग्स',credentials:'क्रेडेंशियल सत्यापन',welcome:'कार्मिक कल्याण डैशबोर्ड',startCheck:'कल्याण जांच पूरी करें',myStatus:'मेरी कल्याण स्थिति',risk:'कल्याण संकेतक',recommend:'सिफारिशें',save:'जांच सेव करें',stress:'तनाव',sleep:'नींद की गुणवत्ता',fatigue:'थकान',workloadScore:'कार्यभार',connection:'सहायता संपर्क',hours:'साप्ताहिक ड्यूटी घंटे',deployment:'तैनाती के दिन',leave:'अवकाश से दिन',rest:'रात्रि विश्राम घंटे',training:'प्रशिक्षण भार',consent:'सहमति और गोपनीयता',consentText:'कल्याण डेटा स्वैच्छिक है। यह चिकित्सा निदान या अनुशासनात्मक निर्णय के लिए नहीं है।',language:'भाषा',role:'भूमिका',personnel:'कार्मिक',clinician:'क्लिनिशियन',welfareOfficer:'कल्याण अधिकारी',commander:'कमांडर',admin:'प्रशासक',privacyTitle:'गोपनीयता पहले',privacyBody:'वास्तविक उपयोग से पहले सहमति, भूमिका-आधारित पहुंच, अनाम विश्लेषण और ऑडिट ट्रेल आवश्यक हैं।',explain:'यह संकेतक क्यों?',recommendations:'कल्याण सिफारिशें',view:'विवरण देखें',noAlerts:'कोई नया कल्याण अलर्ट नहीं।',demo:'सिंथेटिक डेमो डेटा',signOut:'साइन आउट'}
};

function Card({children,className='' }:{children:ReactNode;className?:string}){return <section className={'rounded-2xl border bg-card p-5 shadow-sm '+className}>{children}</section>}
function Badge({risk}:{risk:Risk}){return <span className={'rounded-full px-3 py-1 text-xs font-semibold '+(risk==='ELEVATED'?'bg-red-100 text-red-700':risk==='MODERATE'?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700')}>{riskLabel(risk)}</span>}
function Metric({label,value,icon:Icon}:{label:string;value:string|number;icon:any}){return <div className="rounded-xl border p-4"><Icon className="mb-2 h-5 w-5"/><div className="text-2xl font-bold">{value}</div><div className="text-sm text-muted-foreground">{label}</div></div>}

function DemoAccess({onLogin}:{onLogin:(role:Role,username:string)=>void}) {
  const roles: Array<[Role,string,string]> = [
    ['personnel','Demo Personnel','Personnel'],
    ['clinician','Demo Clinician','Clinician'],
    ['welfare','Demo Welfare Officer','Welfare Officer'],
    ['commander','Demo Commander','Commander'],
    ['admin','Demo Administrator','Administrator'],
  ];

  return <div className="min-h-screen bg-background px-4 py-10">
    <div className="mx-auto max-w-md">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">NeuroFlex</h1>
            <p className="mt-1 text-sm text-muted-foreground">Personnel Stress & Welfare Support</p>
          </div>
          <div className="rounded-xl bg-primary p-2 text-primary-foreground"><HeartPulse/></div>
        </div>

        <div className="mt-6 rounded-xl border bg-muted/30 p-4">
          <p className="text-base font-semibold">Prototype Access</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No email, password, account creation, or email verification is required for this prototype.
          </p>
        </div>

        <div className="mt-5 space-y-2">
          {roles.map(([role, username, label]) => (
            <button
              key={role}
              type="button"
              onClick={() => onLogin(role, username)}
              className="w-full rounded-xl border px-4 py-3 text-left font-medium hover:bg-muted"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-xl border p-3 text-xs text-muted-foreground">
          <b>Access control:</b> these role buttons are demonstration access for the prototype. Production deployment should use secure server-side authentication and role authorization.
        </div>
      </Card>
    </div>
  </div>;
}

function AppShell({lang,setLang,role,username,onLogout,children}:{lang:Lang;setLang:(l:Lang)=>void;role:Role;username:string;onLogout:()=>void;children:ReactNode}){
  const c=copy[lang]; const [open,setOpen]=useState(false); const [location]=useLocation();
  const links: Array<{href:string;key:string;Icon:any}> = [
    {href:'/',key:'home',Icon:Home},
    ...(role==='personnel' ? [
      {href:'/profile',key:'profile',Icon:UserRound},
      {href:'/health-assessment',key:'assessment',Icon:ClipboardCheck},
      {href:'/check-in',key:'check',Icon:ClipboardCheck},
      {href:'/trends',key:'trends',Icon:BarChart3},
      {href:'/workload',key:'workload',Icon:CalendarDays},
      {href:'/counselling',key:'counselling',Icon:HeartPulse}
    ] : []),
    ...(role==='clinician' ? [
      {href:'/clinician',key:'clinician',Icon:HeartPulse},
      {href:'/health-assessment',key:'assessment',Icon:ClipboardCheck},
      {href:'/counselling',key:'counselling',Icon:HeartPulse},
      {href:'/credentials',key:'credentials',Icon:ShieldCheck}
    ] : []),
    ...(role==='welfare' ? [
      {href:'/welfare',key:'welfare',Icon:Users},
      {href:'/workload',key:'workload',Icon:CalendarDays},
      {href:'/alerts',key:'alerts',Icon:Bell},
      {href:'/credentials',key:'credentials',Icon:ShieldCheck}
    ] : []),
    ...(role==='commander' ? [
      {href:'/welfare',key:'welfare',Icon:Users},
      {href:'/workload',key:'workload',Icon:CalendarDays},
      {href:'/alerts',key:'alerts',Icon:Bell}
    ] : []),
    ...(role==='admin' ? [
      {href:'/welfare',key:'welfare',Icon:Users},
      {href:'/alerts',key:'alerts',Icon:Bell},
      {href:'/credentials',key:'credentials',Icon:ShieldCheck}
    ] : []),
    {href:'/privacy',key:'privacy',Icon:LockKeyhole}
  ];
  return <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3"><button className="md:hidden" onClick={()=>setOpen(!open)}><Menu/></button><div className="rounded-xl bg-primary p-2 text-primary-foreground"><HeartPulse/></div><div><div className="font-bold">{c.title}</div><div className="text-xs text-muted-foreground">{c.subtitle}</div></div></div>
      <div className="flex items-center gap-2"><select aria-label={c.language} value={lang} onChange={e=>setLang(e.target.value as Lang)} className="rounded-lg border bg-background px-2 py-1 text-sm"><option value="en">English</option><option value="ta">தமிழ்</option><option value="hi">हिन्दी</option></select><div className="hidden text-right sm:block"><div className="text-xs font-medium">{username}</div></div><span className="rounded-lg border px-2 py-1 text-xs font-medium">{role}</span><button type="button" onClick={onLogout} title={c.signOut} className="rounded-lg border p-2 hover:bg-muted"><LogOut className="h-4 w-4"/></button></div>
    </div></header>
    <div className="mx-auto flex max-w-7xl"><aside className={(open?'block':'hidden')+' fixed inset-x-0 top-[65px] z-30 bg-background p-3 md:static md:block md:w-64 md:border-r md:bg-transparent md:p-4'}><nav className="space-y-1">{links.map(({href,key,Icon})=><Link key={href} href={href as string}><a onClick={()=>setOpen(false)} className={'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm '+(location===href?'bg-primary text-primary-foreground':'hover:bg-muted')}><Icon className="h-4 w-4"/>{c[key as keyof typeof c]}</a></Link>)}</nav></aside><main className="min-w-0 flex-1 p-4 md:p-6">{children}</main></div>
  </div>
}

function HomePage({c,personnel}:{c:any;personnel:Personnel[]}){
  const me=personnel[0], risk=riskOf(me), elevated=personnel.filter(p=>riskOf(p)==='ELEVATED').length;
  return <div className="space-y-6"><div><p className="text-sm text-muted-foreground">{c.demo}</p><h1 className="text-3xl font-bold">{c.welcome}</h1><p className="mt-1 text-muted-foreground">AI-assisted welfare indicators combine organizational work-pattern data with voluntary self-reported wellness data. Prototype uses transparent feature scoring; it is not a medical diagnosis or disciplinary assessment.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label={c.risk} value={riskLabel(risk)} icon={ShieldCheck}/><Metric label="Personnel monitored" value={personnel.length} icon={Users}/><Metric label="Elevated indicators" value={elevated} icon={AlertTriangle}/><Metric label="Average duty hours" value={Math.round(personnel.reduce((a,p)=>a+p.dutyHours,0)/personnel.length)+'h'} icon={Clock3}/></div>
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-semibold">Explainable AI Welfare Indicator</h2><p className="text-sm text-muted-foreground">Transparent prototype scoring combines organizational work-pattern data with voluntary wellness inputs. The indicator supports human review; it is not a diagnosis or disciplinary decision.</p></div>
        <Badge risk={risk}/>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {riskBreakdown(me).map(f=><div key={f.label} className="rounded-xl border p-4"><div className="text-sm font-semibold">{f.label}</div><div className="mt-2 text-xs text-muted-foreground">{f.detail}</div><div className="mt-3 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{width:Math.min(100,Math.round(f.value/35*100))+'%'}}/></div></div>)}
      </div>
      <div className="mt-4 rounded-xl border p-4 text-sm">
        <b>Suggested next step:</b> {risk==='ELEVATED'?'Confidential welfare review and workload/rest assessment.':risk==='MODERATE'?'Continue check-ins and consider a confidential welfare review if the pattern persists.':'Continue routine wellness check-ins and healthy work/rest practices.'}
      </div>
    </Card>
    <Card>
      <div className="flex items-center gap-2 font-semibold"><Brain className="h-5 w-5"/>Predictive Model Validation</div>
      <p className="mt-1 text-sm text-muted-foreground">Development model validated on 2,000 synthetic prototype records.</p>
      <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-5">
        <Metric label="Accuracy" value={Math.round(MODEL_VALIDATION.accuracy*100)+'%'} icon={CheckCircle2}/>
        <Metric label="Precision" value={Math.round(MODEL_VALIDATION.precision*100)+'%'} icon={ShieldCheck}/>
        <Metric label="Recall" value={Math.round(MODEL_VALIDATION.recall*100)+'%'} icon={Activity}/>
        <Metric label="F1" value={Math.round(MODEL_VALIDATION.f1*100)+'%'} icon={BarChart3}/>
        <Metric label="ROC-AUC" value={MODEL_VALIDATION.rocAuc.toFixed(3)} icon={Brain}/>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">5-fold CV ROC-AUC: {MODEL_VALIDATION.fiveFoldCvRocAuc.toFixed(3)} ± {MODEL_VALIDATION.fiveFoldCvStd.toFixed(3)}. Synthetic development evidence; production validation requires governed representative institutional data.</p>
    </Card>
    <div className="grid gap-5 lg:grid-cols-3"><Card className="lg:col-span-2"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">{c.myStatus}</h2><p className="text-sm text-muted-foreground">Synthetic personnel profile: {me.id}</p></div><Badge risk={risk}/></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label={c.stress} value={me.wellness.stress+'/5'} icon={Brain}/><Metric label={c.sleep} value={me.wellness.sleep+'/5'} icon={Moon}/><Metric label={c.fatigue} value={me.wellness.fatigue+'/5'} icon={Activity}/><Metric label={c.workloadScore} value={me.wellness.workload+'/5'} icon={BarChart3}/></div></Card>
    <Card><h2 className="font-semibold">{c.recommendations}</h2><ul className="mt-3 space-y-3 text-sm">{recommendations(me).map(x=><li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0"/>{x}</li>)}</ul></Card></div>
    <Card><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5"/>{c.consent}</div><p className="mt-2 text-sm text-muted-foreground">{c.consentText}</p></Card>
  </div>
}
function recommendations(p:Personnel){const r=riskOf(p); const a:string[]=[]; if(p.dutyHours>52)a.push('Review workload and duty rotation.'); if(p.restHours<7)a.push('Consider a rest/recovery review.'); if(p.leaveGap>28)a.push('Review leave availability and welfare needs.'); if(p.wellness.fatigue>=4)a.push('Offer a confidential welfare check-in.'); if(!a.length)a.push('Continue current wellness routine and periodic check-ins.'); if(r==='ELEVATED')a.push('Authorized welfare personnel should review the pattern confidentially.'); return a}

function Profile({lang,personnel,setPersonnel}:{lang:Lang;personnel:Personnel[];setPersonnel:Dispatch<SetStateAction<Personnel[]>>}) {
  const p=personnel[0];
  const [form,setForm]=useState({name:p.name,id:p.id,rank:p.rank,unit:p.unit,contactNumber:p.contactNumber,email:p.email,dateOfJoining:p.dateOfJoining,serviceExperience:p.serviceExperience,emergencyContact:p.emergencyContact,currentDuty:p.currentDuty,deploymentLocation:p.deploymentLocation,deploymentHistory:p.deploymentHistory,transferHistory:p.transferHistory,trainingCommitments:p.trainingCommitments});
  const [saved,setSaved]=useState(false);
  const update=(key:string,value:string)=>setForm(v=>({...v,[key]:value}));
  const save=()=>{setPersonnel(ps=>ps.map((item,i)=>i?item:{...item,...form}));setSaved(true);};
  const field=(key:keyof typeof form,label:string)=><label className="block text-sm">{label}<input value={form[key]} onChange={e=>update(key,e.target.value)} className="mt-1 w-full rounded-xl border bg-background p-3"/></label>;
  return <div className="space-y-5">
    <div><p className="text-sm text-muted-foreground">Personnel-entered profile</p><h1 className="text-2xl font-bold">My Profile</h1><p className="mt-1 text-sm text-muted-foreground">Enter your service information. In production, these fields should be verified against the authorized personnel/HR source.</p></div>
    <Card><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5"/>Official / service profile</div><p className="mt-1 text-xs text-muted-foreground">Administrative information is kept separate from voluntary wellness measurements.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{field("name","Full name")}{field("id","Personnel ID / service number")}{field("rank","Rank / designation")}{field("unit","Unit / department")}{field("contactNumber","Official contact number")}{field("email","Official email")}{field("dateOfJoining","Date of joining")}{field("serviceExperience","Service experience")}{field("emergencyContact","Emergency contact")}</div>
    </Card>
    <Card><div className="flex items-center gap-2 font-semibold"><CalendarDays className="h-5 w-5"/>Duty & assignment record</div><p className="mt-1 text-xs text-muted-foreground">Work-pattern fields should connect to authorized organizational records when available; personnel entry is provided for this prototype.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{field("currentDuty","Current duty / role")}{field("deploymentLocation","Current deployment / posting location")}{field("deploymentHistory","Deployment history")}{field("transferHistory","Transfer / posting history")}{field("trainingCommitments","Training commitments")}</div>
    </Card>
    <Card><div className="flex items-center gap-2 font-semibold"><LockKeyhole className="h-5 w-5"/>Data source & privacy</div><p className="mt-2 text-sm text-muted-foreground">Profile data is service information. Wellness responses are voluntary and stored separately. Production deployment should verify identity, enforce role-based access, encrypt sensitive data, and maintain audit logs.</p>
      <button onClick={save} className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-primary-foreground">Save profile</button>{saved&&<span className="ml-3 text-sm text-muted-foreground">Saved locally for this prototype.</span>}
    </Card>
  </div>;
}

function CheckIn({lang,setPersonnel}:{lang:Lang;setPersonnel:Dispatch<SetStateAction<Personnel[]>>}) {
  const c=copy[lang];
  const [consent]=useState(()=>localStorage.getItem('nf-consent')==='yes');
  const [vals,setVals]=useState({stress:3,sleep:3,fatigue:3,workload:3,connection:3});
  const fields=[['stress',c.stress],['sleep',c.sleep],['fatigue',c.fatigue],['workload',c.workloadScore],['connection',c.connection]] as const;
  const save=()=>{
    if(!consent){
      window.alert('Please enable voluntary wellness consent in Privacy & Consent before saving this check-in.');
      return;
    }
    setPersonnel(ps=>ps.map((p,i)=>i ? p : {...p,wellness:{...vals,updatedAt:'Just now'}}));
  };
  return <Card>
    <h1 className="text-2xl font-bold">{c.check}</h1>
    <p className="mt-1 text-sm text-muted-foreground">Voluntary self-reported wellness assessment. These responses are not official service records and do not diagnose a medical condition.</p>
    <div className="mt-6 space-y-5">
      {fields.map(([k,label])=><label key={k} className="block">
        <div className="mb-2 flex justify-between"><span>{label}</span><b>{vals[k]}/5</b></div>
        <input className="w-full" type="range" min="1" max="5" value={vals[k]} onChange={e=>setVals(v=>({...v,[k]:Number(e.target.value)}))}/>
      </label>)}
    </div>
    <button onClick={save} className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-primary-foreground">{c.save}</button>
  </Card>;
}
function Trends({personnel}:{personnel:Personnel[]}){const p=personnel[0]; return <div className="space-y-5"><h1 className="text-2xl font-bold">Wellness Trends</h1><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Stress" value={p.wellness.stress+'/5'} icon={Brain}/><Metric label="Fatigue" value={p.wellness.fatigue+'/5'} icon={Activity}/><Metric label="Sleep" value={p.wellness.sleep+'/5'} icon={Moon}/><Metric label="Workload" value={p.wellness.workload+'/5'} icon={BarChart3}/></div><Card><h2 className="font-semibold">Recent pattern</h2><div className="mt-5 space-y-4">{[['Stress',p.wellness.stress],['Sleep quality',p.wellness.sleep],['Fatigue',p.wellness.fatigue],['Workload',p.wellness.workload]].map(([l,v])=><div key={l as string}><div className="mb-1 flex justify-between text-sm"><span>{l}</span><span>{v}/5</span></div><div className="h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-primary" style={{width:(Number(v)/5*100)+'%'}}/></div></div>)}</div></Card></div>}
function Workload({personnel}:{personnel:Personnel[]}){return <div className="space-y-5"><h1 className="text-2xl font-bold">Duty & Workload Analytics</h1><div className="grid gap-4 md:grid-cols-3"><Metric label="Average duty hours" value={Math.round(personnel.reduce((a,p)=>a+p.dutyHours,0)/personnel.length)+'h'} icon={Clock3}/><Metric label="Average deployment" value={Math.round(personnel.reduce((a,p)=>a+p.deploymentDays,0)/personnel.length)+' days'} icon={CalendarDays}/><Metric label="Average rest" value={(personnel.reduce((a,p)=>a+p.restHours,0)/personnel.length).toFixed(1)+'h'} icon={Moon}/></div><Card><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Personnel</th><th className="p-3">Duty</th><th className="p-3">Deployment</th><th className="p-3">Leave gap</th><th className="p-3">Training</th><th className="p-3">Rest</th><th className="p-3">Indicator</th></tr></thead><tbody>{personnel.map(p=><tr key={p.id} className="border-b last:border-0"><td className="p-3 font-medium">{p.id}</td><td className="p-3">{p.dutyHours}h</td><td className="p-3">{p.deploymentDays}d</td><td className="p-3">{p.leaveGap}d</td><td className="p-3">{p.trainingLoad}%</td><td className="p-3">{p.restHours}h</td><td className="p-3"><Badge risk={riskOf(p)}/></td></tr>)}</tbody></table></div></Card></div>}
function Welfare({personnel,role}:{personnel:Personnel[];role:Role}) {
  const elevated=personnel.filter(p=>riskOf(p)==='ELEVATED');
  const moderate=personnel.filter(p=>riskOf(p)==='MODERATE');
  const lower=personnel.filter(p=>riskOf(p)==='LOWER');
  const avgDuty=Math.round(personnel.reduce((a,p)=>a+p.dutyHours,0)/personnel.length);
  const avgRest=(personnel.reduce((a,p)=>a+p.restHours,0)/personnel.length).toFixed(1);
  const avgFatigue=(personnel.reduce((a,p)=>a+p.wellness.fatigue,0)/personnel.length).toFixed(1);
  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold">Welfare Officer Dashboard</h1><p className="text-sm text-muted-foreground">Confidential welfare overview for authorized human review. Indicators are not diagnoses or disciplinary decisions.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Personnel monitored" value={personnel.length} icon={Users}/><Metric label="Elevated indicators" value={elevated.length} icon={ShieldCheck}/><Metric label="Moderate indicators" value={moderate.length} icon={AlertTriangle}/><Metric label="Average duty hours" value={avgDuty+'h'} icon={Clock3}/>
    </div>
    <div className="grid gap-5 lg:grid-cols-3">
      {role==='welfare' ? <Card className="lg:col-span-2"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Personnel welfare overview</h2><p className="text-sm text-muted-foreground">Current wellness signals and welfare indicators.</p></div><span className="rounded-full border px-3 py-1 text-xs">{personnel.length} cases</span></div>
        <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Case</th><th className="p-3">Unit</th><th className="p-3">Stress</th><th className="p-3">Sleep</th><th className="p-3">Fatigue</th><th className="p-3">Workload</th><th className="p-3">Indicator</th></tr></thead><tbody>{personnel.map(p=><tr key={p.id} className="border-b last:border-0"><td className="p-3 font-medium">{p.id}<div className="text-xs text-muted-foreground">{p.rank}</div></td><td className="p-3">{p.unit}</td><td className="p-3">{p.wellness.stress}/5</td><td className="p-3">{p.wellness.sleep}/5</td><td className="p-3">{p.wellness.fatigue}/5</td><td className="p-3">{p.wellness.workload}/5</td><td className="p-3"><Badge risk={riskOf(p)}/></td></tr>)}</tbody></table></div>
      </Card> : <Card className="lg:col-span-2"><h2 className="text-lg font-semibold">Organizational welfare overview</h2><p className="mt-1 text-sm text-muted-foreground">Aggregated view for command/governance roles. Individual wellness details are intentionally withheld.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Personnel monitored" value={personnel.length} icon={Users}/><Metric label="Elevated indicators" value={elevated.length} icon={AlertTriangle}/><Metric label="Moderate indicators" value={moderate.length} icon={ShieldCheck}/><Metric label="Average rest" value={avgRest+'h'} icon={Moon}/></div><div className="mt-4 rounded-xl border p-4 text-sm"><b>Governance note:</b> Commander and Administrator views use aggregated welfare information; identifiable wellness details remain restricted to authorized welfare/clinical review.</div></Card>}
      <Card><h2 className="font-semibold">Welfare snapshot</h2><div className="mt-4 space-y-3"><div className="rounded-xl border p-3"><div className="text-xs text-muted-foreground">Lower indicators</div><div className="text-2xl font-bold">{lower.length}</div></div><div className="rounded-xl border p-3"><div className="text-xs text-muted-foreground">Average fatigue</div><div className="text-2xl font-bold">{avgFatigue}/5</div></div><div className="rounded-xl border p-3"><div className="text-xs text-muted-foreground">Average rest</div><div className="text-2xl font-bold">{avgRest}h/night</div></div><div className="rounded-xl border p-3"><div className="text-xs text-muted-foreground">Cases for review</div><div className="text-2xl font-bold">{elevated.length+moderate.length}</div></div></div></Card>
    </div>
    <Card><h2 className="text-lg font-semibold">Recommended welfare actions</h2><p className="mt-1 text-sm text-muted-foreground">Human review is required before intervention.</p><div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-xl border p-4"><b>Elevated cases</b><p className="mt-1 text-sm text-muted-foreground">{elevated.length ? 'Confidential welfare review and counselling offer.' : 'No elevated indicators currently.'}</p></div><div className="rounded-xl border p-4"><b>Workload review</b><p className="mt-1 text-sm text-muted-foreground">{personnel.filter(p=>p.dutyHours>52).length} personnel above 52 duty hours/week.</p></div><div className="rounded-xl border p-4"><b>Rest / recovery</b><p className="mt-1 text-sm text-muted-foreground">{personnel.filter(p=>p.restHours<7).length} personnel below 7 hours rest/night.</p></div></div></Card>
  </div>;
}
function Alerts({personnel}:{personnel:Personnel[]}){const alerts=personnel.filter(p=>riskOf(p)!=='LOWER'); return <div className="space-y-5"><h1 className="text-2xl font-bold">Welfare Alerts</h1>{alerts.length?<div className="space-y-3">{alerts.map(p=><Card key={p.id}><div className="flex gap-3"><AlertTriangle className="h-5 w-5 shrink-0"/><div className="flex-1"><div className="flex flex-wrap items-center gap-2 font-semibold">{p.id}<Badge risk={riskOf(p)}/></div><p className="mt-2 text-sm text-muted-foreground">Pattern includes {p.dutyHours} duty hours/week, {p.restHours} hours rest/night and fatigue {p.wellness.fatigue}/5.</p><p className="mt-2 text-sm">Suggested action: confidential welfare review and workload/rest assessment.</p></div></div></Card>)}</div>:<Card>{copy.en.noAlerts}</Card>}</div>}
function ClinicianDashboard({personnel}:{personnel:Personnel[]}) {
  const cases=personnel.filter(p=>riskOf(p)!=='LOWER');
  const [selected,setSelected]=useState(cases[0]?.id || personnel[0]?.id || '');
  const person=personnel.find(p=>p.id===selected) || personnel[0];
  const [note,setNote]=useState('');
  const [saved,setSaved]=useState(false);

  if(!person) return <Card><h1 className="text-xl font-bold">Clinician Dashboard</h1><p className="mt-2 text-sm text-muted-foreground">No authorized cases are available.</p></Card>;

  const saveNote=()=>{
    if(!note.trim()) return;
    localStorage.setItem('nf-clinician-note-'+person.id,note.trim());
    setSaved(true);
  };

  return <div className="space-y-5">
    <div>
      <p className="text-sm text-muted-foreground">Authorized clinical access</p>
      <h1 className="text-2xl font-bold">Clinician Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Review voluntary wellness information for confidential human follow-up. Risk indicators are not diagnoses.</p>
    </div>

    <Card>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm md:col-span-2">Personnel / Case
          <select value={selected} onChange={e=>{setSelected(e.target.value);setSaved(false)}} className="mt-1 w-full rounded-xl border bg-background p-3">
            {personnel.map(p=><option key={p.id} value={p.id}>{p.id} · {p.rank} · {p.unit}</option>)}
          </select>
        </label>
        <div className="rounded-xl border p-3"><div className="text-xs text-muted-foreground">Welfare indicator</div><div className="mt-1"><Badge risk={riskOf(person)}/></div></div>
      </div>
    </Card>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Stress" value={person.wellness.stress+'/5'} icon={Brain}/>
      <Metric label="Sleep" value={person.wellness.sleep+'/5'} icon={Moon}/>
      <Metric label="Fatigue" value={person.wellness.fatigue+'/5'} icon={Activity}/>
      <Metric label="Workload" value={person.wellness.workload+'/5'} icon={BarChart3}/>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <h2 className="font-semibold">Work & recovery context</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border p-3"><span className="text-muted-foreground">Duty</span><div className="font-semibold">{person.dutyHours} h/week</div></div>
          <div className="rounded-xl border p-3"><span className="text-muted-foreground">Deployment</span><div className="font-semibold">{person.deploymentDays} days</div></div>
          <div className="rounded-xl border p-3"><span className="text-muted-foreground">Leave gap</span><div className="font-semibold">{person.leaveGap} days</div></div>
          <div className="rounded-xl border p-3"><span className="text-muted-foreground">Rest</span><div className="font-semibold">{person.restHours} h/night</div></div>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Clinician actions</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/counselling"><a className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">Start consultation</a></Link>
          <button onClick={()=>window.alert('Confidential welfare follow-up flagged for human review.')} className="rounded-xl border px-4 py-2 text-sm">Flag for follow-up</button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Only authorized clinicians should access identifiable welfare information. Production deployment should add authenticated accounts, server-side authorization and audit logging.</p>
      </Card>
    </div>

    <Card>
      <h2 className="font-semibold">Confidential clinician note</h2>
      <textarea value={note} onChange={e=>{setNote(e.target.value);setSaved(false)}} placeholder="Record a brief follow-up note for this prototype..." className="mt-3 min-h-28 w-full rounded-xl border bg-background p-3 text-sm"/>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={saveNote} className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">Save note</button>
        {saved && <span className="text-sm text-muted-foreground">Saved locally for this demo.</span>}
      </div>
    </Card>

    <Card>
      <h2 className="font-semibold">Cases needing human review</h2>
      <div className="mt-3 space-y-2">{cases.length ? cases.map(p=><button key={p.id} onClick={()=>setSelected(p.id)} className="flex w-full items-center justify-between rounded-xl border p-3 text-left hover:bg-muted"><span><b>{p.id}</b><span className="ml-2 text-sm text-muted-foreground">{p.rank} · {p.unit}</span></span><Badge risk={riskOf(p)}/></button>) : <p className="text-sm text-muted-foreground">No elevated or moderate indicators.</p>}</div>
    </Card>
  </div>;
}

function HealthAssessment({personnel}:{personnel:Personnel[]}) {
  const person=personnel[0];
  const storageKey='nf-occupational-assessment-'+person.id;
  const [form,setForm]=useState(() => {
    try {
      const saved=localStorage.getItem(storageKey);
      if(saved) return JSON.parse(saved);
    } catch {}
    return {
      dutyHours: person.dutyHours,
      averageDutyDuration: '',
      consecutiveDutyDays: '',
      nightShifts: '',
      trainingHours: '',
      restInterval: '',
      deploymentDays: person.deploymentDays,
      leaveGap: person.leaveGap,
      additionalAssignments: '',
      sleepHours: '',
      sleepQuality: person.wellness.sleep,
      perceivedStress: person.wellness.stress,
      fatigue: person.wellness.fatigue,
      workloadPerception: person.wellness.workload,
      concentrationConcern: '',
      emotionalWellbeing: '',
      supportConnection: person.wellness.connection,
      workLifeConcern: '',
      counsellingInterest: '',
      assessmentFramework: 'Structured worker well-being assessment',
      clinicianReview: 'Pending human review',
      clinicianNotes: ''
    };
  });
  const [saved,setSaved]=useState(false);

  const update=(key:string,value:string|number)=>setForm((v:any)=>({...v,[key]:value}));
  const save=()=>{
    localStorage.setItem(storageKey,JSON.stringify(form));
    setSaved(true);
  };
  const field=(key:string,label:string,type='text',placeholder='')=>
    <label className="block text-sm">{label}
      <input type={type} value={form[key] ?? ''} onChange={e=>update(key,type==='number'?Number(e.target.value):e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-xl border bg-background p-3"/>
    </label>;
  const select=(key:string,label:string,options:string[])=>
    <label className="block text-sm">{label}
      <select value={form[key] ?? ''} onChange={e=>update(key,e.target.value)} className="mt-1 w-full rounded-xl border bg-background p-3">
        <option value="">Select</option>{options.map(o=><option key={o}>{o}</option>)}
      </select>
    </label>;

  return <div className="space-y-5">
    <div>
      <p className="text-sm text-muted-foreground">Occupational health & psychosocial risk</p>
      <h1 className="text-2xl font-bold">Occupational Health & Wellness Assessment</h1>
      <p className="mt-1 text-sm text-muted-foreground">A structured section that separates official work-pattern information from voluntary self-reported wellness information for authorized human review.</p>
    </div>

    <Card>
      <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5"/>1. Official work & recovery data</div>
      <p className="mt-1 text-xs text-muted-foreground">These fields should come from authorized duty, deployment, training and personnel systems in production—not be inferred by AI.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {field('dutyHours','Duty hours / week','number')}
        {field('averageDutyDuration','Average duty duration / hours','number')}
        {field('consecutiveDutyDays','Consecutive duty days','number')}
        {field('nightShifts','Night shifts / month','number')}
        {field('trainingHours','Training hours / week','number')}
        {field('restInterval','Typical rest interval / hours','number')}
        {field('deploymentDays','Current deployment days','number')}
        {field('leaveGap','Days since last leave','number')}
        {field('additionalAssignments','Additional assignments','text','Optional description')}
      </div>
    </Card>

    <Card>
      <div className="flex items-center gap-2 font-semibold"><HeartPulse className="h-5 w-5"/>2. Voluntary self-reported wellness</div>
      <p className="mt-1 text-xs text-muted-foreground">This section records the person's own experience. It is not an official service record and should never be treated as a diagnosis.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {field('sleepHours','Typical sleep / hours per night','number')}
        {field('sleepQuality','Sleep / recovery quality (1–5)','number')}
        {field('perceivedStress','Perceived stress (1–5)','number')}
        {field('fatigue','Fatigue (1–5)','number')}
        {field('workloadPerception','Perceived workload (1–5)','number')}
        {field('supportConnection','Support connection (1–5)','number')}
        {select('concentrationConcern','Concentration concern',['None reported','Occasional concern','Frequent concern','Needs human review'])}
        {select('emotionalWellbeing','Emotional well-being',['No concern reported','Some concern','Significant concern','Needs human review'])}
        {select('workLifeConcern','Work-life concern',['None reported','Some concern','Significant concern','Needs human review'])}
        {select('counsellingInterest','Counselling / support preference',['Not requested','Would like information','Would like an appointment'])}
      </div>
    </Card>

    <Card>
      <div className="flex items-center gap-2 font-semibold"><ClipboardCheck className="h-5 w-5"/>3. Professional assessment workflow</div>
      <p className="mt-1 text-xs text-muted-foreground">NeuroFlex can organize information for review, but a clinician—not the AI—determines whether further assessment or support is appropriate.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {select('assessmentFramework','Assessment framework',['Structured worker well-being assessment','Occupational health interview','Clinician-selected validated instrument'])}
        {select('clinicianReview','Clinician review status',['Pending human review','Further evaluation recommended','Support / counselling recommended','Assessment completed — no current concern identified'])}
      </div>
      <label className="mt-4 block text-sm">Clinician assessment notes
        <textarea value={form.clinicianNotes ?? ''} onChange={e=>update('clinicianNotes',e.target.value)} placeholder="For authorized clinician use only" className="mt-1 min-h-28 w-full rounded-xl border bg-background p-3"/>
      </label>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={save} className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">Save assessment</button>
        {saved && <span className="text-sm text-muted-foreground">Saved locally for this prototype.</span>}
      </div>
    </Card>

    <Card>
      <div className="rounded-xl border p-4">
        <h2 className="font-semibold">Clinical interpretation boundary</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Workload, long hours, shift work, time pressure and limited support are recognized psychosocial risk factors; they are not diagnostic on their own.</li>
          <li>Sleep, fatigue, perceived stress and well-being can support a structured assessment, but they do not by themselves confirm a mental health condition.</li>
          <li>A clinician should combine the person's report with interview, relevant records and an appropriate validated instrument when clinically indicated.</li>
          <li>NeuroFlex produces a welfare indicator for human review; it does not diagnose stress, burnout, anxiety, depression or another medical condition.</li>
        </ul>
      </div>
    </Card>
  </div>;
}

function Privacy({c}:{c:any}){const [consent,setConsent]=useState(()=>localStorage.getItem('nf-consent')==='yes'); return <div className="space-y-5"><h1 className="text-2xl font-bold">{c.privacyTitle}</h1><Card><div className="grid gap-4 md:grid-cols-2"><Metric label="Consent" value="Required" icon={CheckCircle2}/><Metric label="Access" value="Role-based" icon={LockKeyhole}/><Metric label="Analytics" value="Prototype" icon={Database}/><Metric label="Audit" value="Production required" icon={ShieldCheck}/></div><p className="mt-5 text-sm text-muted-foreground">{c.privacyBody}</p><label className="mt-5 flex items-start gap-3 rounded-xl border p-4"><input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);localStorage.setItem('nf-consent',e.target.checked?'yes':'no')}} className="mt-1"/><span className="text-sm"><b>Voluntary wellness consent</b><br/>Allow this prototype to store your wellness check-in on this device. Optional motion/biometric-style measurements remain separate and require an explicit start action.</span></label></Card><Card><h2 className="font-semibold">Data handling principles</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm"><li>Collect only necessary welfare information.</li><li>Separate voluntary wellness data from organizational records.</li><li>Show individual details only to authorized roles.</li><li>Use synthetic/demo data during development and evaluation.</li><li>Keep human welfare review in the decision loop.</li></ul></Card></div>}
function Counselling() {
  const [clinician, setClinician] = useState('Dr. Ananya Rao');
  const [slot, setSlot] = useState('Today, 4:30 PM');
  const [booked, setBooked] = useState(() => localStorage.getItem('nf-consultation') || '');
  const [room, setRoom] = useState(false);
  const [chat, setChat] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);

  const join = async () => {
    setRoom(true);
    try {
      const st = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(st);
    } catch {
      // Camera/microphone access is optional for the prototype.
    }
  };

  useEffect(() => {
    if (!room || !stream) return;
    const video = document.getElementById('nf-local-video') as HTMLVideoElement | null;
    if (video) {
      video.srcObject = stream;
      video.play().catch(() => {});
    }
    return () => {
      stream.getTracks().forEach((track) => track.stop());
    };
  }, [room, stream]);

  const leave = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setRoom(false);
  };

  const book = () => {
    const value = clinician + ' · ' + slot;
    setBooked(value);
    localStorage.setItem('nf-consultation', value);
  };

  const send = () => {
    const trimmed = msg.trim();
    if (!trimmed) return;
    setChat((items) => [...items, 'You: ' + trimmed]);
    setMsg('');
    setTimeout(() => {
      setChat((items) => [
        ...items,
        'Clinician: Thank you. We can discuss this during the consultation.'
      ]);
    }, 300);
  };

  if (room) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Secure Consultation Room</h1>
            <p className="text-sm text-muted-foreground">
              Demo clinician: {clinician} · Welfare support prototype
            </p>
          </div>
          <button onClick={leave} className="rounded-xl bg-red-600 px-4 py-2 text-white">
            End consultation
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-950">
              <div className="flex h-full items-center justify-center text-white">
                <div className="text-center">
                  <HeartPulse className="mx-auto h-12 w-12" />
                  <p className="mt-2 font-semibold">{clinician}</p>
                  <p className="text-sm text-slate-300">Clinician video placeholder</p>
                </div>
              </div>
              <video
                id="nf-local-video"
                muted
                playsInline
                className="absolute bottom-4 right-4 h-32 w-48 rounded-xl border-2 border-white bg-black object-cover"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => stream?.getAudioTracks().forEach((track) => { track.enabled = !track.enabled; })}
                className="rounded-xl border px-4 py-2"
              >
                🎤 Mute
              </button>
              <button
                onClick={() => stream?.getVideoTracks().forEach((track) => { track.enabled = !track.enabled; })}
                className="rounded-xl border px-4 py-2"
              >
                📹 Camera
              </button>
              <button className="rounded-xl border px-4 py-2">🔒 Private session</button>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold">Consultation chat</h2>
            <div className="mt-3 h-64 space-y-2 overflow-y-auto rounded-xl bg-muted p-3 text-sm">
              {chat.length ? (
                chat.map((item, index) => <p key={index}>{item}</p>)
              ) : (
                <p className="text-muted-foreground">
                  Your consultation messages will appear here.
                </p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={msg}
                onChange={(event) => setMsg(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') send();
                }}
                placeholder="Type a message..."
                className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-2"
              />
              <button
                onClick={send}
                className="rounded-xl bg-primary px-4 py-2 text-primary-foreground"
              >
                Send
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Confidential welfare support</p>
        <h1 className="text-2xl font-bold">Counselling & Teleconsultation</h1>
        <p className="mt-1 text-muted-foreground">
          Request a demo consultation with a clinician and enter a browser-based consultation room.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Available clinicians</h2>
          <div className="mt-4 space-y-3">
            <label className="block text-sm">
              Clinician
              <select
                value={clinician}
                onChange={(event) => setClinician(event.target.value)}
                className="mt-1 w-full rounded-xl border bg-background p-3"
              >
                <option>Dr. Ananya Rao</option>
                <option>Dr. Rahul Menon</option>
                <option>Ms. Priya Sharma — Counsellor</option>
              </select>
            </label>

            <label className="block text-sm">
              Appointment
              <select
                value={slot}
                onChange={(event) => setSlot(event.target.value)}
                className="mt-1 w-full rounded-xl border bg-background p-3"
              >
                <option>Today, 4:30 PM</option>
                <option>Today, 6:00 PM</option>
                <option>Tomorrow, 10:00 AM</option>
              </select>
            </label>

            <button
              onClick={book}
              className="w-full rounded-xl bg-primary px-4 py-3 text-primary-foreground"
            >
              Request consultation
            </button>

            {booked && (
              <div className="mt-3 rounded-xl border p-3 text-sm">
                <b>Booked:</b> {booked}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">How support works</h2>
          <ol className="mt-4 space-y-3 text-sm">
            <li>1. Choose a clinician and available time.</li>
            <li>2. Join the consultation room when ready.</li>
            <li>3. Allow camera/microphone access for the demo.</li>
            <li>4. Use chat and video controls during the session.</li>
            <li>5. Follow-up can be recorded in the production system by authorized professionals.</li>
          </ol>

          <button
            onClick={join}
            className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-primary-foreground"
          >
            {booked ? 'Join consultation' : 'Open demo consultation room'}
          </button>

          <p className="mt-3 text-xs text-muted-foreground">
            Demo clinician profiles are placeholders. This prototype does not provide medical diagnosis or replace qualified clinical care.
          </p>
        </Card>
      </div>
    </div>
  );
}

function CredentialVerification({role}:{role:Role}) { const [submitted,setSubmitted]=useState(false); const [type,setType]=useState('Medical doctor'); const [reg,setReg]=useState(''); const [council,setCouncil]=useState(''); return <div className="space-y-5"><div><p className="text-sm text-muted-foreground">Professional credential control</p><h1 className="text-2xl font-bold">Clinician Credential Verification</h1><p className="mt-1 text-sm text-muted-foreground">Credentials must be checked against the applicable professional register before a clinician is marked verified.</p></div><Card><div className="grid gap-4 md:grid-cols-2"><label className="text-sm">Professional type<select value={type} onChange={e=>setType(e.target.value)} className="mt-1 w-full rounded-xl border bg-background p-3"><option>Medical doctor</option><option>Clinical psychologist</option><option>Other regulated professional</option></select></label><label className="text-sm">Registration number<input value={reg} onChange={e=>setReg(e.target.value)} className="mt-1 w-full rounded-xl border bg-background p-3" placeholder="Registration / CRR number"/></label><label className="text-sm">Regulator / council<input value={council} onChange={e=>setCouncil(e.target.value)} className="mt-1 w-full rounded-xl border bg-background p-3" placeholder="NMC / State Medical Council / RCI"/></label></div><div className="mt-5 rounded-xl border p-4 text-sm"><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5"/>Status: {submitted?'Pending authorized review':'Not submitted'}</div><p className="mt-2 text-muted-foreground">This prototype does not claim a clinician is verified until an authorized reviewer confirms identity, registration, qualification and current standing.</p></div>{role==='clinician'&&<button onClick={()=>setSubmitted(true)} className="mt-4 rounded-xl bg-primary px-4 py-2 text-primary-foreground">Submit credentials</button>}{role==='admin'&&<p className="mt-4 rounded-xl border p-4 text-sm">Admin review: verify the submitted details against the applicable regulator, record the reviewer and verification date, then mark Verified, Rejected or Suspended.</p>}</Card></div>; }

function Protected({allowed,role,children}:{allowed:Role[];role:Role;children:ReactNode}){return allowed.includes(role)?<>{children}</>:<Card><h1 className="text-xl font-bold">Authorized role required</h1><p className="mt-2 text-sm text-muted-foreground">This welfare information is restricted to authorized roles.</p></Card>}
function App() {
  const [lang, setLang] = useState<Lang>('en');
  const [role, setRole] = useState<Role|null>(null);
  const [username, setUsername] = useState('');
  const [personnel, setPersonnel] = useState<Personnel[]>(seedPersonnel);

  useEffect(() => {
    const savedLang = localStorage.getItem('nf-lang');
    const savedPersonnel = localStorage.getItem('nf-personnel');

    if (savedLang === 'en' || savedLang === 'ta' || savedLang === 'hi') {
      setLang(savedLang);
    }
    if (savedPersonnel) {
      try {
        const parsed = JSON.parse(savedPersonnel) as Personnel[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPersonnel(parsed);
        }
      } catch {
        // Keep synthetic seed data if stored data is invalid.
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('nf-lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('nf-personnel', JSON.stringify(personnel));
  }, [personnel]);

  const logout = () => {
    setRole(null);
    setUsername('');
  };

  if (!role) {
    return <DemoAccess onLogin={(r,u)=>{setRole(r);setUsername(u)}} />;
  }

  const c = copy[lang];

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      role={role}
      username={username}
      onLogout={logout}
    >
      <Switch>
        <Route path="/profile"><Protected allowed={["personnel"]} role={role}><Profile lang={lang} personnel={personnel} setPersonnel={setPersonnel} /></Protected></Route>
        <Route path="/health-assessment"><Protected allowed={["personnel","clinician"]} role={role}><HealthAssessment personnel={personnel} /></Protected></Route>
        <Route path="/check-in"><Protected allowed={["personnel"]} role={role}><CheckIn lang={lang} setPersonnel={setPersonnel} /></Protected></Route>
        <Route path="/trends"><Protected allowed={["personnel"]} role={role}><Trends personnel={personnel} /></Protected></Route>
        <Route path="/workload"><Protected allowed={["personnel","welfare","commander"]} role={role}><Workload personnel={personnel} /></Protected></Route>
        <Route path="/clinician">
          <Protected allowed={['clinician']} role={role}>
            <ClinicianDashboard personnel={personnel} />
          </Protected>
        </Route>
        <Route path="/credentials">
          <Protected allowed={['clinician','welfare','admin']} role={role}>
            <CredentialVerification role={role} />
          </Protected>
        </Route>
        <Route path="/welfare">
          <Protected allowed={['welfare', 'commander', 'admin']} role={role}>
            <Welfare personnel={personnel} />
          </Protected>
        </Route>
        <Route path="/alerts">
          <Protected allowed={['welfare', 'commander', 'admin']} role={role}>
            <Alerts personnel={personnel} />
          </Protected>
        </Route>
        <Route path="/counselling"><Protected allowed={["personnel","clinician"]} role={role}><Counselling /></Protected></Route>
        <Route path="/privacy"><Privacy c={c} /></Route>
        <Route><HomePage c={c} personnel={personnel} /></Route>
      </Switch>
    </AppShell>
  );
}

export default function Root() {
  return (
    <Router>
      <App />
    </Router>
  );
}
