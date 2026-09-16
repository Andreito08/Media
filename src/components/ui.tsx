import { useMemo, useState } from 'react';
import { GRADI, INDIRIZZI_SUPERIORI, materieDefaultPerIndirizzo, type Grado } from '../data/indirizzi';
import { useStore } from '../store';

// ---------------- Icone SVG (niente emoji, stile coerente) ----------------

type IconProps = { className?: string };

export const IconChart = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M7 14l4-4 3 3 5-6" />
  </svg>
);

export const IconBook = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
  </svg>
);

export const IconShield = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10z" /><path d="M9 11.5l2 2 4-4.5" />
  </svg>
);

export const IconPlus = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconSpark = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2zM19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15z" />
  </svg>
);

export const IconPalette = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9" /><circle cx="8.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="8" r="1.2" fill="currentColor" stroke="none" /><circle cx="15.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" /><path d="M12 21a2 2 0 0 0 2-2c0-1.5-2-2-2-3.5" />
  </svg>
);

export const IconMoon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

export const IconSun = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" className={className}>
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const IconCheck = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const IconChevronDown = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const IconEdit = ({ className = 'h-3.5 w-3.5' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

export const IconEye = ({ className = 'h-3.5 w-3.5' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconX = ({ className = 'h-3.5 w-3.5' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" className={className}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const IconDownload = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

export const IconUpload = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
);

export const IconPrint = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
  </svg>
);

export const IconGrid = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const IconUser = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
export const IconGear = ({ className = 'h-5 w-5' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// ---------------- Primitivi ----------------

export function Card({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <section className={`glass glass-sheen card animate-fade-up p-4 sm:p-5 ${className}`} style={delay ? { animationDelay: `${delay}ms` } : undefined}>{children}</section>;
}

export function Btn({
  children, onClick, variant = 'primary', type = 'button', disabled, className = '',
}: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'danger' | 'soft';
  type?: 'button' | 'submit'; disabled?: boolean; className?: string;
}) {
  const base =
    'press inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold disabled:opacity-50';
  const styles: Record<string, string> = {
    primary: 'btn-liquid-primary shadow-lg',
    soft: 'btn-liquid-soft',
    ghost: 'btn-liquid-ghost',
    danger: 'btn-liquid-soft text-rose-600! dark:text-rose-300!',
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-slate-600 dark:text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'input-liquid w-full rounded-full border px-4 py-2.5 text-[15px] font-medium placeholder:font-normal placeholder:text-slate-400';

// ---------------- Input solo-numerici ----------------

/**
 * Props condivise per tutti gli inserimenti che NON necessitano di caratteri
 * alfanumerici (pesi, +/-, obiettivo): tastierino numerico nativo su mobile
 * (inputMode="decimal" → su iOS/Android mostra cifre + virgola/punto) e niente
 * autocomplete/correzioni. type resta "text" per accettare la virgola italiana.
 */
export const numDecProps = {
  type: 'text',
  inputMode: 'decimal',
  pattern: '[0-9]*[.,]?[0-9]*',
  autoComplete: 'off',
  autoCorrect: 'off',
  spellCheck: false,
  enterKeyHint: 'done',
} as const;

/**
 * Tiene solo cifre + un unico separatore decimale (virgola o punto).
 * Usato onChange per impedire lettere/simboli ("tastierino a solo numeri").
 */
export function soloNumeriDecimali(v: string): string {
  const pulito = v.replace(/[^0-9.,]/g, '');
  const i = pulito.search(/[.,]/);
  if (i === -1) return pulito;
  const testa = pulito.slice(0, i + 1);
  const coda = pulito.slice(i + 1).replace(/[.,]/g, '');
  return testa + coda;
}

export function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="acc-chip flex h-9 w-9 items-center justify-center rounded-2xl">
        {icon}
      </span>
      <span>
        <span className="block text-[15px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">{title}</span>
        {sub && <span className="block text-xs font-medium text-slate-400">{sub}</span>}
      </span>
    </div>
  );
}

// ---------------- Onboarding ----------------

export function Onboarding() {
  const { completaOnboarding } = useStore();
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState('');
  const [grado, setGrado] = useState<Grado>('superiori');
  const [indirizzoId, setIndirizzoId] = useState('scientifico');
  const [periodoTipo, setPeriodoTipo] = useState<'trimestre-penta' | 'quadrimestre' | 'unico'>('quadrimestre');
  const [plus, setPlus] = useState('0,25');
  const [minus, setMinus] = useState('0,25');
  const [salvataggio, setSalvataggio] = useState(false);
  const [errore, setErrore] = useState('');

  const indirizzoNome = useMemo(() => {
    if (grado === 'medie') return 'Secondaria di I grado';
    if (grado === 'elementari') return 'Scuola primaria';
    if (grado === 'universita') return 'Università';
    return INDIRIZZI_SUPERIORI.find((i) => i.id === indirizzoId)?.nome ?? 'Indirizzo personalizzato';
  }, [grado, indirizzoId]);

  const anteprima = useMemo(() => materieDefaultPerIndirizzo(grado, indirizzoId), [grado, indirizzoId]);

  const avvia = async () => {
    setErrore('');
    const p = Number(plus.replace(',', '.'));
    const m = Number(minus.replace(',', '.'));
    if (!Number.isFinite(p) || p < 0 || p > 1 || !Number.isFinite(m) || m < 0 || m > 1) {
      setErrore('I valori di + e − devono stare tra 0 e 1 (es. 0,25).');
      return;
    }
    setSalvataggio(true);
    try {
      await completaOnboarding({
        nome: nome.trim() || 'Studente',
        grado,
        indirizzoId: grado === 'superiori' ? indirizzoId : grado,
        indirizzoNome,
        periodoTipo,
        scala: { plus: p, minus: m },
      });
    } catch {
      setErrore('Qualcosa è andato storto, riprova.');
      setSalvataggio(false);
    }
  };

  const steps = ['Tu', 'Scuola', 'Voti'];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <header className="glass-dark glass-sheen animate-fade-up relative mb-6 overflow-hidden rounded-[2rem] p-7 text-white sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl font-black ring-1 ring-white/30 backdrop-blur">
              M
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Medie Scolastiche</h1>
              <p className="text-sm text-sky-100/90">Voti, medie a due decimali e grafici. Offline, sui tuoi dispositivi.</p>
            </div>
          </div>
          <ol className="mt-6 flex items-center gap-2">
            {steps.map((l, i) => {
              const n = i + 1;
              const active = step === n;
              const done = step > n;
              return (
                <li key={l} className="flex flex-1 items-center gap-2 last:flex-none">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition ${active ? 'bg-white text-[#1e3a5f]' : done ? 'bg-emerald-300 text-emerald-950' : 'bg-white/20 text-white/80'}`}>
                    {done ? <IconCheck className="h-3.5 w-3.5" /> : n}
                  </span>
                  <span className={`text-xs font-bold ${active ? 'text-white' : 'text-white/60'}`}>{l}</span>
                  {n < 3 && <span className="mx-1 h-0.5 flex-1 rounded-full bg-white/20"><span className={`block h-full rounded-full bg-white/80 transition-all ${done ? 'w-full' : 'w-0'}`} /></span>}
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      <Card key={step} delay={0} className="rounded-[1.75rem]! p-6! sm:p-7!">
        {step === 1 && (
          <div className="space-y-5">
            <Field label="Come ti chiami?">
              <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Es. Giulia" autoFocus />
            </Field>
            <Field label="Che scuola fai?">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {GRADI.map((g) => {
                  const sel = grado === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setGrado(g.id)}
                      className={`press rounded-3xl border-2 p-3.5 text-left ${sel ? 'border-blue-500 bg-blue-50/70 shadow-md shadow-blue-100 dark:border-blue-400 dark:bg-blue-500/15 dark:shadow-none' : 'border-slate-100 bg-slate-50/60 hover:border-slate-200 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'}`}
                    >
                      <div className={`text-sm font-extrabold ${sel ? 'text-[#1e3a5f] dark:text-blue-100' : 'text-slate-700 dark:text-slate-200'}`}>{g.nome}</div>
                      <div className="text-xs text-slate-400">{g.descrizione}</div>
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="flex justify-end"><Btn onClick={() => setStep(2)}>Avanti →</Btn></div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {grado === 'superiori' ? (
              <Field label="Scegli l'indirizzo" hint="Carico le materie giuste. Poi potrai aggiungere e togliere a piacere.">
                <select className={inputCls} value={indirizzoId} onChange={(e) => setIndirizzoId(e.target.value)}>
                  {INDIRIZZI_SUPERIORI.map((i) => (
                    <option key={i.id} value={i.id}>{i.nome}</option>
                  ))}
                </select>
              </Field>
            ) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                Per <b>{indirizzoNome}</b> ho già pronto il set di materie standard. Potrai personalizzarlo dopo.
              </p>
            )}
            <div>
              <div className="mb-2.5 text-[13px] font-bold text-slate-600 dark:text-slate-300">Anteprima materie · {anteprima.length}</div>
              <div className="flex flex-wrap gap-1.5">
                {anteprima.map((m, i) => (
                  <span
                    key={m}
                    className="animate-pop-in rounded-full bg-gradient-to-r from-slate-100 to-blue-50 px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200/70 dark:from-white/10 dark:to-white/5 dark:text-slate-300 dark:ring-white/10"
                    style={{ animationDelay: `${Math.min(i * 30, 400)}ms` }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <Btn variant="ghost" onClick={() => setStep(1)}>← Indietro</Btn>
              <Btn onClick={() => setStep(3)}>Avanti →</Btn>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <Field label="Come è diviso l'anno nella tua scuola?">
              <select className={inputCls} value={periodoTipo} onChange={(e) => setPeriodoTipo(e.target.value as typeof periodoTipo)}>
                <option value="quadrimestre">Quadrimestre + Quadrimestre</option>
                <option value="trimestre-penta">Trimestre + Pentamestre</option>
                <option value="unico">Anno unico (senza periodi)</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quanto vale '+'?" hint="Tipico 0,25 → 6+ = 6,25">
                <input className={inputCls} value={plus} onChange={(e) => setPlus(soloNumeriDecimali(e.target.value))} {...numDecProps} maxLength={4} placeholder="0,25" />
              </Field>
              <Field label="Quanto vale '−'?" hint="Tipico 0,25 → 6− = 5,75">
                <input className={inputCls} value={minus} onChange={(e) => setMinus(soloNumeriDecimali(e.target.value))} {...numDecProps} maxLength={4} placeholder="0,25" />
              </Field>
            </div>
            <div className="flex gap-2.5 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 p-4 text-[13px] leading-relaxed text-[#1e3a5f] ring-1 ring-blue-100 dark:from-blue-500/15 dark:to-cyan-500/10 dark:text-blue-100 dark:ring-white/10">
              <IconSpark className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <span>Accetto voti come <b>6 · 6,5 · 6+ · 6− · 6½ · 7/8</b>. Il peso è opzionale (100% = normale). I dati restano sul tuo dispositivo con backup automatico.</span>
            </div>
            {errore && <p className="text-sm font-bold text-rose-600 dark:text-rose-300">{errore}</p>}
            <div className="flex justify-between">
              <Btn variant="ghost" onClick={() => setStep(2)}>← Indietro</Btn>
              <Btn onClick={avvia} disabled={salvataggio}>{salvataggio ? 'Creazione…' : <>Crea la mia app <IconCheck className="h-4 w-4" /></>}</Btn>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
