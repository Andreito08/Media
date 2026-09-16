import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { GRADI, INDIRIZZI_SUPERIORI, materieDefaultPerIndirizzo, type Grado } from '../data/indirizzi';
import { Btn, Field, IconGear, IconUser, IconX, SectionTitle, inputCls, numDecProps, soloNumeriDecimali } from './ui';
import { SezioneImpostazioni } from './Impostazioni';

/** Form profilo e scuola (le stesse scelte del primo avvio). */
function ProfiloForm() {
  const { profile, aggiornaProfilo, aggiungiMaterieMancanti } = useStore();
  const [msgMaterie, setMsgMaterie] = useState('');
  // Bozze locali: permettono di digitare "0," senza che la virgola sparisca
  // (il valore salvato è numerico, la bozza è stringa solo-numeri).
  const [plusTxt, setPlusTxt] = useState<string | null>(null);
  const [minusTxt, setMinusTxt] = useState<string | null>(null);

  // Sincronizza le bozze quando il profilo arriva/cambia dall'esterno
  useEffect(() => {
    if (profile) {
      setPlusTxt((t) => (t === null ? String(profile.scala.plus).replace('.', ',') : t));
      setMinusTxt((t) => (t === null ? String(profile.scala.minus).replace('.', ',') : t));
    }
  }, [profile?.scala.plus, profile?.scala.minus]);

  if (!profile) return null;

  const plusMostrato = plusTxt ?? String(profile.scala.plus).replace('.', ',');
  const minusMostrato = minusTxt ?? String(profile.scala.minus).replace('.', ',');

  const commitPlus = (grezzo: string) => {
    const f = soloNumeriDecimali(grezzo);
    setPlusTxt(f);
    if (f === '' || f === ',' || f === '.') return;
    const v = Number(f.replace(',', '.'));
    if (Number.isFinite(v) && v >= 0 && v <= 1) aggiornaProfilo({ scala: { plus: v, minus: profile.scala.minus } });
  };

  const commitMinus = (grezzo: string) => {
    const f = soloNumeriDecimali(grezzo);
    setMinusTxt(f);
    if (f === '' || f === ',' || f === '.') return;
    const v = Number(f.replace(',', '.'));
    if (Number.isFinite(v) && v >= 0 && v <= 1) aggiornaProfilo({ scala: { plus: profile.scala.plus, minus: v } });
  };

  const cambiaGrado = async (g: Grado) => {
    setMsgMaterie('');
    if (g === 'superiori') {
      const idValido = INDIRIZZI_SUPERIORI.some((i) => i.id === profile.indirizzoId)
        ? profile.indirizzoId
        : 'scientifico';
      const nome = INDIRIZZI_SUPERIORI.find((i) => i.id === idValido)?.nome ?? 'Liceo Scientifico';
      await aggiornaProfilo({ grado: g, indirizzoId: idValido, indirizzoNome: nome });
    } else {
      const nomi: Record<Exclude<Grado, 'superiori'>, string> = {
        medie: 'Secondaria di I grado',
        elementari: 'Scuola primaria',
        universita: 'Università',
      };
      await aggiornaProfilo({ grado: g, indirizzoId: g, indirizzoNome: nomi[g] });
    }
  };

  const cambiaIndirizzo = async (id: string) => {
    setMsgMaterie('');
    const nome = INDIRIZZI_SUPERIORI.find((i) => i.id === id)?.nome ?? '';
    await aggiornaProfilo({ indirizzoId: id, indirizzoNome: nome });
  };

  const caricaMaterieIndirizzo = async () => {
    const nomi = materieDefaultPerIndirizzo(profile.grado, profile.indirizzoId);
    const n = await aggiungiMaterieMancanti(nomi);
    setMsgMaterie(n === 0
      ? 'Hai già tutte le materie di questo indirizzo.'
      : `Aggiunte ${n} ${n === 1 ? 'materia' : 'materie'} dell'indirizzo. Le tue restano tutte.`);
  };

  return (
    <section className="glass glass-sheen card animate-fade-up p-4 sm:p-5">
      <SectionTitle icon={<IconUser className="h-4 w-4" />} title="Profilo e scuola" sub="Le stesse scelte del primo avvio" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nome alunno">
          <input className={inputCls} value={profile.nome} onChange={(e) => aggiornaProfilo({ nome: e.target.value })} placeholder="Es. Giulia" />
        </Field>
        <Field label="Grado di scuola">
          <select className={inputCls} value={profile.grado} onChange={(e) => cambiaGrado(e.target.value as Grado)}>
            {GRADI.map((g) => (
              <option key={g.id} value={g.id}>{g.nome}</option>
            ))}
          </select>
        </Field>
        {profile.grado === 'superiori' ? (
          <Field label="Indirizzo">
            <select className={inputCls} value={profile.indirizzoId} onChange={(e) => cambiaIndirizzo(e.target.value)}>
              {INDIRIZZI_SUPERIORI.map((i) => (
                <option key={i.id} value={i.id}>{i.nome}</option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Indirizzo">
            <input className={inputCls} value={profile.indirizzoNome} disabled />
          </Field>
        )}
        <Field label="Divisione anno">
          <select className={inputCls} value={profile.periodoTipo}
            onChange={(e) => aggiornaProfilo({ periodoTipo: e.target.value as typeof profile.periodoTipo })}>
            <option value="quadrimestre">Quadrimestri</option>
            <option value="trimestre-penta">Trimestre + Penta</option>
            <option value="unico">Anno unico</option>
          </select>
        </Field>
        <Field label="Quanto vale '+'?" hint="Es. 0,25 → 6+ = 6,25">
          <input className={inputCls} value={plusMostrato}
            onChange={(e) => commitPlus(e.target.value)} {...numDecProps} maxLength={4} placeholder="0,25" />
        </Field>
        <Field label="Quanto vale '−'?" hint="Es. 0,25 → 6− = 5,75">
          <input className={inputCls} value={minusMostrato}
            onChange={(e) => commitMinus(e.target.value)} {...numDecProps} maxLength={4} placeholder="0,25" />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Btn variant="soft" onClick={caricaMaterieIndirizzo}>Aggiungi materie dell'indirizzo</Btn>
        {msgMaterie && <span className="animate-pop-in text-[13px] font-bold text-slate-500 dark:text-slate-300">{msgMaterie}</span>}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        Cambiare indirizzo non cancella nulla: aggiunge solo le materie che mancano. Le tue personalizzate e i voti restano.
      </p>
    </section>
  );
}

/** Finestra unica delle impostazioni: profilo + aspetto + backup + anni. */
export function ImpostazioniModal({ aperto, onChiudi }: { aperto: boolean; onChiudi: () => void }) {
  // mentre la finestra è aperta, la pagina dietro resta ferma
  useEffect(() => {
    if (!aperto) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [aperto]);

  if (!aperto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-3 backdrop-blur-sm sm:items-center"
      onClick={onChiudi}
      role="dialog"
      aria-modal="true"
      aria-label="Impostazioni"
    >
      <div
        className="glass glass-sheen animate-pop-in modal-scroll max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle icon={<IconGear className="h-4 w-4" />} title="Impostazioni" sub="Profilo, aspetto, backup e anni" />
          <button
            onClick={onChiudi}
            aria-label="Chiudi impostazioni"
            className="press press-grow flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/60 text-slate-500 ring-1 ring-white/60 hover:text-slate-800 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <ProfiloForm />
          <SezioneImpostazioni />
          <Btn onClick={onChiudi} className="w-full">Fatto</Btn>
        </div>
      </div>
    </div>
  );
}
