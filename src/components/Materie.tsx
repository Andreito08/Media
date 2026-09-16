import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { mediaPesata, parseVoto, formatMedia, pillColoreMedia } from '../lib/grades';
import { Btn, Card, Field, IconBook, IconChevronDown, IconEdit, IconEye, IconPlus, IconX, SectionTitle, inputCls, numDecProps, soloNumeriDecimali } from './ui';
import type { Periodo, TipoVoto } from '../lib/db';

function etichettaPeriodo(p: Periodo, tipo: string): string {
  if (tipo === 'unico') return 'Anno unico';
  if (tipo === 'trimestre-penta') return p === 'primo' ? 'Trimestre' : 'Pentamestre';
  return p === 'primo' ? '1° Quadrimestre' : '2° Quadrimestre';
}

const TIPO_META: Record<TipoVoto, { label: string; cls: string }> = {
  orale: { label: 'Orale', cls: 'bg-sky-100 text-sky-700' },
  scritto: { label: 'Scritto', cls: 'bg-blue-100 text-blue-700' },
  pratico: { label: 'Pratico', cls: 'bg-teal-100 text-teal-700' },
  verifica: { label: 'Verifica', cls: 'bg-orange-100 text-orange-700' },
};

export function SezioneMaterie() {
  const { materie, voti, profile, aggiungiMateria, rinominaMateria, toggleNascondiMateria, eliminaMateria, aggiungiVoto, eliminaVoto } = useStore();
  const [nuova, setNuova] = useState('');
  const [aperta, setAperta] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [nomeEdit, setNomeEdit] = useState('');

  const [input, setInput] = useState('');
  const [peso, setPeso] = useState('100');
  const [tipo, setTipo] = useState<TipoVoto>('orale');
  const [periodo, setPeriodo] = useState<Periodo>('primo');
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [nota, setNota] = useState('');
  const [errore, setErrore] = useState('');
  const [confermaElimina, setConfermaElimina] = useState<string | null>(null);

  const medie = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const m of materie) {
      const vv = voti.filter((v) => v.materiaId === m.id).map((v) => ({ valore: v.valore, peso: v.peso }));
      map.set(m.id, mediaPesata(vv));
    }
    return map;
  }, [materie, voti]);

  const visibili = materie.filter((m) => !m.nascosta);
  const nascoste = materie.filter((m) => m.nascosta);

  const salvaVoto = async (materiaId: string) => {
    setErrore('');
    const r = parseVoto(input, profile?.scala ?? { plus: 0.25, minus: 0.25 });
    if (!r.ok || r.valore === undefined) {
      setErrore(r.errore ?? 'Voto non valido');
      return;
    }
    const p = Number(peso.replace(',', '.'));
    if (!Number.isFinite(p) || p <= 0 || p > 300) {
      setErrore('Il peso deve stare tra 1 e 300 (100 = normale).');
      return;
    }
    await aggiungiVoto({ materiaId, valore: r.valore, input: input.trim(), peso: p, tipo, periodo, data, nota });
    setInput('');
    setNota('');
    setPeso('100');
  };

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={<IconBook className="h-4 w-4" />} title="Le tue materie" sub={`${visibili.length} visibili · indirizzo ${profile?.indirizzoNome}`} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={inputCls}
            placeholder="Aggiungi una tua materia (es. Robotica)"
            value={nuova}
            onChange={(e) => setNuova(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { aggiungiMateria(nuova); setNuova(''); } }}
          />
          <Btn onClick={() => { aggiungiMateria(nuova); setNuova(''); }} className="shrink-0"><IconPlus className="h-4 w-4" /> Aggiungi</Btn>
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
          Nascondi (es. Religione) invece di eliminare se non vuoi perdere i voti.
        </p>
      </Card>

      {visibili.length === 0 && (
        <Card><p className="py-4 text-center text-sm font-semibold text-slate-400">Nessuna materia visibile. Aggiungine una sopra.</p></Card>
      )}

      {visibili.map((m, idx) => {
        const vv = voti.filter((v) => v.materiaId === m.id).sort((a, b) => b.data.localeCompare(a.data));
        const media = medie.get(m.id) ?? null;
        const isOpen = aperta === m.id;
        return (
          <Card key={m.id} delay={Math.min(idx * 60, 300)} className="lift overflow-hidden p-0!">
            <button
              onClick={() => setAperta(isOpen ? null : m.id)}
              className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-white/50 dark:hover:bg-white/10"
            >
              <span className="h-11 w-2 shrink-0 rounded-full shadow-sm" style={{ backgroundImage: `linear-gradient(180deg, ${m.colore}, ${m.colore}99)` }} />
              <span className="min-w-0 flex-1">
                {editing === m.id ? (
                  <span className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <input className={inputCls} value={nomeEdit} onChange={(e) => setNomeEdit(e.target.value)} autoFocus />
                    <Btn variant="soft" onClick={() => { rinominaMateria(m.id, nomeEdit); setEditing(null); }}>OK</Btn>
                  </span>
                ) : (
                  <>
                    <span className="block truncate text-[15px] font-extrabold tracking-tight text-slate-800 dark:text-slate-100">{m.nome}</span>
                    <span className="mt-0.5 block text-xs font-medium text-slate-400">
                      {vv.length === 0 ? 'Nessun voto ancora' : `${vv.length} ${vv.length === 1 ? 'voto' : 'voti'} · ultimo ${vv[0].input}`}
                    </span>
                  </>
                )}
              </span>
              <span className={`rounded-2xl px-3.5 py-1.5 text-[15px] font-black tabular-nums ring-1 ${pillColoreMedia(media)}`}>
                {formatMedia(media)}
              </span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-transform dark:bg-white/10 dark:text-slate-400 ${isOpen ? 'rotate-180' : ''}`}><IconChevronDown className="h-4 w-4" /></span>
            </button>

            {isOpen && (
              <div className="animate-fade-up space-y-3 border-t border-white/60 bg-white/25 p-4 dark:border-white/10 dark:bg-black/20">
                <div className="flex flex-wrap gap-2">
                  <MiniAction onClick={() => { setEditing(m.id); setNomeEdit(m.nome); }}><IconEdit /> Rinomina</MiniAction>
                  <MiniAction onClick={() => toggleNascondiMateria(m.id)}><IconEye /> Nascondi</MiniAction>
                  {confermaElimina === m.id ? (
                    <>
                      <button className="press rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-rose-200" onClick={() => eliminaMateria(m.id)}>Conferma elimina + voti</button>
                      <MiniAction onClick={() => setConfermaElimina(null)}>Annulla</MiniAction>
                    </>
                  ) : (
                    <button className="press rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100" onClick={() => setConfermaElimina(m.id)}>Elimina</button>
                  )}
                </div>

                <div className="rounded-2xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                  <div className="mb-2.5 flex items-center gap-2 text-sm font-extrabold text-slate-700 dark:text-slate-200">
                    <span className="acc-chip flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black">+</span>
                    Nuovo voto in {m.nome}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <Field label="Voto">
                      <input className={inputCls} placeholder="6+ · 7,5 · 6½" value={input} onChange={(e) => setInput(e.target.value)} inputMode="text" />
                    </Field>
                    <Field label="Peso %" hint="100 = normale">
                      <input className={inputCls} value={peso} onChange={(e) => setPeso(soloNumeriDecimali(e.target.value))} {...numDecProps} maxLength={5} />
                    </Field>
                    <Field label="Tipo">
                      <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value as TipoVoto)}>
                        <option value="orale">Orale</option>
                        <option value="scritto">Scritto</option>
                        <option value="pratico">Pratico</option>
                        <option value="verifica">Verifica</option>
                      </select>
                    </Field>
                    <Field label="Periodo">
                      <select className={inputCls} value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
                        <option value="primo">{etichettaPeriodo('primo', profile?.periodoTipo ?? 'quadrimestre')}</option>
                        <option value="secondo">{etichettaPeriodo('secondo', profile?.periodoTipo ?? 'quadrimestre')}</option>
                      </select>
                    </Field>
                  </div>
                  <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-[150px_1fr_auto]">
                    <input className={inputCls} type="date" value={data} onChange={(e) => setData(e.target.value)} />
                    <input className={inputCls} placeholder="Nota (es. interrogazione cap. 3)" value={nota} onChange={(e) => setNota(e.target.value)} />
                    <Btn onClick={() => salvaVoto(m.id)}>Salva voto</Btn>
                  </div>
                  {errore && <p className="animate-pop-in mt-2 rounded-xl bg-rose-50 px-3 py-2 text-[13px] font-bold text-rose-600 ring-1 ring-rose-200">{errore}</p>}
                </div>

                {vv.length === 0 ? (
                  <p className="py-2 text-center text-[13px] font-medium text-slate-400">Ancora nessun voto: scrivi sopra “6+” e premi Salva.</p>
                ) : (
                  <ul className="stagger space-y-1.5">
                    {vv.map((v) => (
                      <li key={v.id} className="press flex items-center gap-3 rounded-2xl border border-white/60 bg-white/60 px-3 py-2.5 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                        <span className="w-14 shrink-0 rounded-full bg-gradient-to-br from-[#101f38] to-[#1e3a5f] px-2 py-1.5 text-center text-sm font-black tabular-nums text-white" title={`Vale ${formatMedia(v.valore)}`}>
                          {v.input}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                            <span className={`rounded-full px-2 py-0.5 ${TIPO_META[v.tipo].cls}`}>{TIPO_META[v.tipo].label}</span>
                            <span className="text-slate-400">{v.data} · peso {v.peso}%</span>
                          </span>
                          {v.nota && <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{v.nota}</span>}
                        </span>
                        <span className="text-xs font-black tabular-nums text-slate-400">= {formatMedia(v.valore)}</span>
                        <button className="press flex h-7 w-7 items-center justify-center rounded-full text-slate-300 hover:bg-rose-50 hover:text-rose-500 dark:text-slate-500 dark:hover:bg-rose-500/15" onClick={() => eliminaVoto(v.id)} title="Elimina voto"><IconX /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {nascoste.length > 0 && (
        <Card delay={60}>
          <div className="text-sm font-extrabold text-slate-500 dark:text-slate-400">Nascoste · {nascoste.length} <span className="font-medium text-slate-400">— tocca per mostrare di nuovo</span></div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {nascoste.map((m) => (
              <button key={m.id} onClick={() => toggleNascondiMateria(m.id)} className="press inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200 hover:bg-white dark:bg-white/10 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/15">
                <IconEye /> {m.nome}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function MiniAction({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="press inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-xs font-bold text-slate-500 backdrop-blur-md hover:text-slate-700 dark:border-white/15 dark:bg-white/10 dark:text-slate-300 dark:hover:text-white">
      {children}
    </button>
  );
}
