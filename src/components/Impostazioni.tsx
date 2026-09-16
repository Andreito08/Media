import { useRef, useState } from 'react';
import { useStore } from '../store';
import { esportaJSON, importaJSON, leggiSnapshots } from '../lib/db';
import { formatMedia, mediaGenerale, mediaPesata } from '../lib/grades';
import { Btn, Card, IconCheck, IconDownload, IconGrid, IconMoon, IconPalette, IconPrint, IconShield, IconSun, IconUpload, SectionTitle, inputCls } from './ui';
import { THEMES, type TemaId } from '../lib/tema';

export function SezioneImpostazioni() {
  const { profile, prefs, impostaTema, toggleDark, anni, anno, materie, voti, cambiaAnno, creaAnno, resetTutto } = useStore();

  const [msg, setMsg] = useState('');
  const [nuovoAnno, setNuovoAnno] = useState('');
  const [copia, setCopia] = useState(true);
  const [pericolo, setPericolo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const snaps = leggiSnapshots();

  const scaricaBackup = async () => {
    try {
      const json = await esportaJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medie-backup-${anno?.label.replace('/', '-') ?? 'anno'}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg('Backup scaricato. Conservalo (Drive, email, chat): con quel file recuperi tutto.');
    } catch {
      setMsg('Backup non riuscito, riprova.');
    }
  };

  const suFile = async (f: File) => {
    try {
      const testo = await f.text();
      const r = await importaJSON(testo);
      setMsg(`Ripristinati ${r.voti} voti, ${r.materie} materie, ${r.anni} anni. Snapshot di sicurezza creato prima dell'import.`);
    } catch {
      setMsg('File non valido: usa un backup .json creato da questa app.');
    }
  };

  const stampaPagella = () => {
    const righe = materie.filter((m) => !m.nascosta).map((m) => {
      const vv = voti.filter((v) => v.materiaId === m.id).map((v) => ({ valore: v.valore, peso: v.peso }));
      return { nome: m.nome, n: vv.length, media: mediaPesata(vv) };
    });
    const gen = mediaGenerale(righe.map((r) => r.media));
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Pagella ${anno?.label}</title><style>
      body{font-family:Arial,sans-serif;padding:32px;color:#111} table{width:100%;border-collapse:collapse;margin-top:16px}
      td,th{border:1px solid #ccc;padding:8px;text-align:left} h1{color:#1e3a5f}
    </style></head><body>
      <h1>Medie scolastiche — ${profile?.nome ?? ''} (${anno?.label ?? ''})</h1>
      <p>${profile?.indirizzoNome ?? ''} · Media generale: <b>${formatMedia(gen)}</b> · Generato il ${new Date().toLocaleDateString('it-IT')}</p>
      <table><tr><th>Materia</th><th>Voti</th><th>Media</th></tr>
      ${righe.map((r) => `<tr><td>${r.nome}</td><td>${r.n}</td><td>${formatMedia(r.media)}</td></tr>`).join('')}
      </table><script>window.print()<\/script></body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={<IconPalette className="h-4 w-4" />} title="Aspetto" sub="Colore principale e modalità scura" />
        <div className="text-[13px] font-bold text-slate-600 dark:text-slate-300">Colore principale</div>
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          {(Object.keys(THEMES) as TemaId[]).map((id) => {
            const t = THEMES[id];
            const active = prefs.tema === id;
            return (
              <button
                key={id}
                onClick={() => impostaTema(id)}
                title={t.nome}
                aria-label={`Tema ${t.nome}`}
                aria-pressed={active}
                className={`press flex items-center gap-2 rounded-full py-2 pl-2 pr-4 text-[13px] font-bold transition ${
                  active
                    ? 'bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-900'
                    : 'bg-white/50 text-slate-600 ring-1 ring-white/60 hover:bg-white/80 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10'
                }`}
              >
                <span
                  className={`h-6 w-6 rounded-full shadow-inner ${active ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-transparent' : 'ring-1 ring-black/10'}`}
                  style={{ background: `linear-gradient(135deg, ${t.deep}, ${t.acc})` }}
                />
                {t.nome}
                {active && <IconCheck className="h-3 w-3" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        <button
          onClick={toggleDark}
          aria-pressed={prefs.dark}
          className="press mt-3 flex w-full items-center gap-3 rounded-full bg-white/50 p-2 pl-2.5 pr-2 text-left ring-1 ring-white/60 hover:bg-white/70 dark:bg-white/5 dark:ring-white/10 dark:hover:bg-white/10"
        >
          <span className={`flex h-9 w-9 items-center justify-center rounded-full text-white shadow ${prefs.dark ? 'bg-gradient-to-br from-slate-700 to-slate-900' : 'bg-gradient-to-br from-amber-300 to-orange-400'}`}>
            {prefs.dark ? <IconMoon className="h-4 w-4" /> : <IconSun className="h-4 w-4" />}
          </span>
          <span className="flex-1">
            <span className="block text-sm font-extrabold text-slate-700 dark:text-slate-200">
              {prefs.dark ? 'Modalità scura attiva' : 'Modalità chiara attiva'}
            </span>
            <span className="block text-xs font-medium text-slate-400">Tocca per passare {prefs.dark ? 'alla chiara' : 'alla scura'}</span>
          </span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${prefs.dark ? 'bg-slate-700' : 'bg-slate-300'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${prefs.dark ? 'left-6' : 'left-1'}`} />
          </span>
        </button>
      </Card>

      <section className="glass-emerald glass-sheen animate-fade-up relative overflow-hidden rounded-[1.75rem] p-5 text-white sm:p-6">
        <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <IconShield className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-[15px] font-black tracking-tight">I tuoi voti sono al sicuro</h2>
              <p className="text-xs font-medium text-emerald-100/80">Salvataggio sul dispositivo + {snaps.length}/10 backup automatici interni · funziona offline</p>
            </div>
          </div>
          {/* barra snapshot */}
          <div className="mt-3.5 flex gap-1.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < snaps.length ? 'bg-emerald-300' : 'bg-white/20'}`} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={scaricaBackup} className="press inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-black text-emerald-950 shadow-lg">
              <IconDownload /> Backup .json
            </button>
            <button onClick={() => fileRef.current?.click()} className="press inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/20">
              <IconUpload /> Ripristina
            </button>
            <button onClick={stampaPagella} className="press inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/20">
              <IconPrint /> Pagella / PDF
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) suFile(f); e.target.value = ''; }} />
          {msg && <p className="animate-pop-in mt-3 rounded-2xl bg-white/10 px-3.5 py-2.5 text-[13px] font-bold ring-1 ring-white/20">{msg}</p>}
          <p className="mt-3 text-[11px] font-medium leading-relaxed text-emerald-100/70">
            Sul telefono: Android (Chrome → ⋮ → Installa app), iPhone (Safari → Condividi → Aggiungi a schermata Home). Scarica il .json ogni mese: è la tua assicurazione.
          </p>
        </div>
      </section>

      <Card delay={60}>
        <SectionTitle icon={<IconGrid className="h-4 w-4" />} title="Anni scolastici" sub="Passa da un anno all'altro senza perdere nulla" />
        <div className="flex flex-wrap gap-2">
          {anni.map((a) => (
            <button
              key={a.id}
              onClick={() => cambiaAnno(a.id)}
              className={`press rounded-full px-4 py-2 text-sm font-black ring-1 ${a.id === anno?.id ? 'acc-chip ring-transparent' : 'bg-slate-50 text-slate-500 ring-slate-200 hover:bg-white dark:bg-white/5 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/10'}`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <input className={inputCls} placeholder="Nuovo anno, es. 2026/27" value={nuovoAnno} onChange={(e) => setNuovoAnno(e.target.value)} />
          <Btn variant="soft" onClick={() => { creaAnno(nuovoAnno, copia); setNuovoAnno(''); }}>Crea anno</Btn>
        </div>
        <div
          data-glow
          role="switch"
          aria-checked={copia}
          tabIndex={0}
          onClick={() => setCopia(!copia)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCopia(!copia); } }}
          className="mt-2.5 flex w-full cursor-pointer items-center gap-3 rounded-full bg-white/50 p-2 pl-2.5 pr-2 text-left ring-1 ring-white/60 transition hover:bg-white/70 dark:bg-white/5 dark:ring-white/10 dark:hover:bg-white/10"
        >
          <span className={`glow-switch relative h-7 w-12 shrink-0 rounded-full transition ${copia ? 'acc-chip' : 'bg-slate-300 dark:bg-white/15'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${copia ? 'left-6' : 'left-1'}`} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-extrabold text-slate-700 dark:text-slate-200">Copia materie</span>
            <span className="block text-xs font-medium text-slate-400">Ricomincia l'anno con le stesse materie</span>
          </span>
        </div>
      </Card>

      {!pericolo ? (
        <button
          onClick={() => setPericolo(true)}
          className="press w-full rounded-[1.4rem] bg-rose-50/80 p-4 text-center ring-1 ring-rose-200/70 backdrop-blur-md hover:bg-rose-100/70 dark:bg-rose-500/10 dark:ring-rose-400/20 dark:hover:bg-rose-500/15"
        >
          <span className="text-sm font-extrabold text-rose-600 dark:text-rose-300">Zona pericolosa: ricomincia da zero…</span>
        </button>
      ) : (
        <div className="animate-fade-up rounded-[1.4rem] bg-rose-50/80 p-3 ring-1 ring-rose-200/70 backdrop-blur-md dark:bg-rose-500/10 dark:ring-rose-400/20">
          <div className="animate-pop-in flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-200">Elimina TUTTO (voti, materie, anni)? Viene fatto uno snapshot prima.</span>
            <Btn variant="danger" onClick={() => resetTutto()}>Sì, elimina tutto</Btn>
            <Btn variant="ghost" onClick={() => setPericolo(false)}>Annulla</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
