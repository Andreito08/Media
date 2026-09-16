import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { db, scattaSnapshotAutomatico, uid, oggiISO, type Anno, type Materia, type Periodo, type Profile, type TipoVoto, type Voto } from './lib/db';
import { COLORI_MATERIE, materieDefaultPerIndirizzo, type Grado } from './data/indirizzi';
import { PREFS_KEY, THEMES, loadPrefs, type Prefs, type TemaId } from './lib/tema';
import type { ScalaPlusMinus } from './lib/grades';

interface Store {
  pronto: boolean;
  profile: Profile | null;
  prefs: Prefs;
  impostaTema: (t: TemaId) => void;
  toggleDark: () => void;
  anni: Anno[];
  anno: Anno | null;
  materie: Materia[];
  voti: Voto[];
  // azioni
  completaOnboarding: (args: { nome: string; grado: Grado; indirizzoId: string; indirizzoNome: string; periodoTipo: Profile['periodoTipo']; scala: ScalaPlusMinus }) => Promise<void>;
  aggiornaProfilo: (patch: Partial<Profile>) => Promise<void>;
  aggiungiMateria: (nome: string) => Promise<void>;
  aggiungiMaterieMancanti: (nomi: string[]) => Promise<number>;
  rinominaMateria: (id: string, nome: string) => Promise<void>;
  toggleNascondiMateria: (id: string) => Promise<void>;
  eliminaMateria: (id: string) => Promise<void>;
  aggiungiVoto: (args: { materiaId: string; valore: number; input: string; peso: number; tipo: TipoVoto; periodo: Periodo; data: string; nota?: string }) => Promise<void>;
  eliminaVoto: (id: string) => Promise<void>;
  cambiaAnno: (id: string) => Promise<void>;
  creaAnno: (label: string, copiaMaterie: boolean) => Promise<void>;
  resetTutto: () => Promise<void>;
  ricarica: () => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

function annoLabelCorrente(): string {
  const ora = new Date();
  const y = ora.getFullYear();
  const m = ora.getMonth(); // 0-11, settembre = 8
  const inizio = m >= 8 ? y : y - 1;
  return `${inizio}/${String((inizio + 1) % 100).padStart(2, '0')}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [pronto, setPronto] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [anni, setAnni] = useState<Anno[]>([]);
  const [materieTutte, setMaterieTutte] = useState<Materia[]>([]);
  const [votiTutti, setVotiTutti] = useState<Voto[]>([]);
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);

  // Applica tema + dark mode al documento e li rende persistenti
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch { /* noop */ }
    const root = document.documentElement;
    root.classList.toggle('dark', prefs.dark);
    const t = THEMES[prefs.tema] ?? THEMES.blu;
    root.style.setProperty('--acc', t.acc);
    root.style.setProperty('--acc-deep', t.deep);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', prefs.dark ? '#0b1220' : '#e9edf6');
  }, [prefs]);

  const impostaTema = useCallback((tema: TemaId) => {
    setPrefs((p) => ({ ...p, tema }));
  }, []);

  const toggleDark = useCallback(() => {
    setPrefs((p) => ({ ...p, dark: !p.dark }));
  }, []);

  const ricarica = useCallback(async () => {
    const [p, a] = await Promise.all([db.profile.get('main'), db.anni.toArray()]);
    const m = await db.materie.toArray();
    const v = await db.voti.orderBy('data').toArray();
    setProfile(p ?? null);
    setAnni(a.sort((x, y) => x.label.localeCompare(y.label)));
    setMaterieTutte(m.sort((x, y) => x.createdAt - y.createdAt));
    setVotiTutti(v);
    setPronto(true);
  }, []);

  useEffect(() => {
    ricarica();
  }, [ricarica]);

  const anno = useMemo(
    () => anni.find((a) => a.id === profile?.annoAttivoId) ?? anni[0] ?? null,
    [anni, profile],
  );

  const materie = useMemo(
    () => (anno ? materieTutte.filter((m) => m.annoId === anno.id) : []),
    [materieTutte, anno],
  );

  const voti = useMemo(() => {
    const ids = new Set(materie.map((m) => m.id));
    return votiTutti.filter((v) => ids.has(v.materiaId));
  }, [votiTutti, materie]);

  const salvaESnapshot = useCallback(async (fn: () => Promise<unknown>) => {
    await fn();
    await scattaSnapshotAutomatico();
    await ricarica();
  }, [ricarica]);

  const completaOnboarding: Store['completaOnboarding'] = useCallback(async (args) => {
    const annoId = uid();
    const label = annoLabelCorrente();
    const nomi = materieDefaultPerIndirizzo(args.grado, args.indirizzoId);
    const nuoveMaterie: Materia[] = nomi.map((nome, i) => ({
      id: uid() + i,
      annoId,
      nome,
      colore: COLORI_MATERIE[i % COLORI_MATERIE.length],
      isCustom: false,
      nascosta: false,
      createdAt: Date.now() + i,
    }));
    await db.transaction('rw', db.profile, db.anni, db.materie, async () => {
      await db.anni.put({ id: annoId, label, createdAt: Date.now() });
      await db.materie.bulkPut(nuoveMaterie);
      await db.profile.put({
        id: 'main',
        nome: args.nome,
        grado: args.grado,
        indirizzoId: args.indirizzoId,
        indirizzoNome: args.indirizzoNome,
        periodoTipo: args.periodoTipo,
        scala: args.scala,
        annoAttivoId: annoId,
        completato: true,
        updatedAt: Date.now(),
      });
    });
    await scattaSnapshotAutomatico();
    await ricarica();
  }, [ricarica]);

  const aggiornaProfilo = useCallback(async (patch: Partial<Profile>) => {
    const p = await db.profile.get('main');
    if (!p) return;
    await db.profile.put({ ...p, ...patch, updatedAt: Date.now() });
    await scattaSnapshotAutomatico();
    await ricarica();
  }, [ricarica]);

  const aggiungiMateria = useCallback(async (nome: string) => {
    if (!anno) return;
    const n = nome.trim();
    if (!n) return;
    const usati = new Set(materieTutte.filter((m) => m.annoId === anno.id).map((m) => m.colore));
    const colore = COLORI_MATERIE.find((c) => !usati.has(c)) ?? COLORI_MATERIE[materie.length % COLORI_MATERIE.length];
    await salvaESnapshot(() => db.materie.put({
      id: uid(), annoId: anno.id, nome: n, colore, isCustom: true, nascosta: false, createdAt: Date.now(),
    }));
  }, [anno, materie.length, materieTutte, salvaESnapshot]);

  /** Aggiunge solo le materie dell'elenco che mancano già (niente duplicati, niente perdite). Ritorna quante ne ha aggiunte. */
  const aggiungiMaterieMancanti = useCallback(async (nomi: string[]): Promise<number> => {
    if (!anno) return 0;
    const presenti = new Set(
      materieTutte.filter((m) => m.annoId === anno.id).map((m) => m.nome.trim().toLowerCase()),
    );
    const viste = new Set<string>();
    const daAggiungere = nomi
      .map((n) => n.trim())
      .filter((n) => {
        const k = n.toLowerCase();
        if (!n || presenti.has(k) || viste.has(k)) return false;
        viste.add(k);
        return true;
      });
    if (daAggiungere.length === 0) return 0;
    const usati = new Set(materieTutte.filter((m) => m.annoId === anno.id).map((m) => m.colore));
    await salvaESnapshot(() => db.materie.bulkPut(daAggiungere.map((nome, i) => {
      const colore = COLORI_MATERIE.find((c) => !usati.has(c)) ?? COLORI_MATERIE[(materieTutte.length + i) % COLORI_MATERIE.length];
      usati.add(colore);
      return {
        id: `${uid()}${i}`, annoId: anno.id, nome, colore,
        isCustom: false, nascosta: false, createdAt: Date.now() + i,
      };
    })));
    return daAggiungere.length;
  }, [anno, materieTutte, salvaESnapshot]);

  const rinominaMateria = useCallback(async (id: string, nome: string) => {
    const n = nome.trim();
    if (!n) return;
    await salvaESnapshot(async () => {
      const m = await db.materie.get(id);
      if (m) await db.materie.put({ ...m, nome: n });
    });
  }, [salvaESnapshot]);

  const toggleNascondiMateria = useCallback(async (id: string) => {
    await salvaESnapshot(async () => {
      const m = await db.materie.get(id);
      if (m) await db.materie.put({ ...m, nascosta: !m.nascosta });
    });
  }, [salvaESnapshot]);

  const eliminaMateria = useCallback(async (id: string) => {
    await salvaESnapshot(() => db.transaction('rw', db.materie, db.voti, async () => {
      await db.materie.delete(id);
      await db.voti.where('materiaId').equals(id).delete();
    }));
  }, [salvaESnapshot]);

  const aggiungiVoto: Store['aggiungiVoto'] = useCallback(async (args) => {
    await salvaESnapshot(() => db.voti.put({
      id: uid(),
      materiaId: args.materiaId,
      valore: args.valore,
      input: args.input,
      peso: args.peso,
      tipo: args.tipo,
      periodo: args.periodo,
      data: args.data || oggiISO(),
      nota: args.nota?.trim() ? args.nota.trim() : undefined,
      createdAt: Date.now(),
    }));
  }, [salvaESnapshot]);

  const eliminaVoto = useCallback(async (id: string) => {
    await salvaESnapshot(() => db.voti.delete(id));
  }, [salvaESnapshot]);

  const cambiaAnno = useCallback(async (id: string) => {
    await aggiornaProfilo({ annoAttivoId: id });
  }, [aggiornaProfilo]);

  const creaAnno = useCallback(async (label: string, copiaMaterie: boolean) => {
    const l = label.trim() || annoLabelCorrente();
    const nuovoId = uid();
    await salvaESnapshot(() => db.transaction('rw', db.profile, db.anni, db.materie, async () => {
      await db.anni.put({ id: nuovoId, label: l, createdAt: Date.now() });
      if (copiaMaterie && anno) {
        const correnti = await db.materie.where('annoId').equals(anno.id).toArray();
        await db.materie.bulkPut(correnti.map((m, i) => ({
          ...m, id: uid() + i, annoId: nuovoId, nascosta: false, createdAt: Date.now() + i,
        })));
      }
      const p = await db.profile.get('main');
      if (p) await db.profile.put({ ...p, annoAttivoId: nuovoId, updatedAt: Date.now() });
    }));
  }, [anno, salvaESnapshot]);

  const resetTutto = useCallback(async () => {
    await scattaSnapshotAutomatico();
    await db.transaction('rw', db.profile, db.anni, db.materie, db.voti, async () => {
      await Promise.all([db.profile.clear(), db.anni.clear(), db.materie.clear(), db.voti.clear()]);
    });
    localStorage.removeItem('medie-snapshots-v1');
    await ricarica();
  }, [ricarica]);

  const value: Store = {
    pronto, profile, prefs, impostaTema, toggleDark, anni, anno, materie, voti,
    completaOnboarding, aggiornaProfilo, aggiungiMateria, aggiungiMaterieMancanti, rinominaMateria,
    toggleNascondiMateria, eliminaMateria, aggiungiVoto, eliminaVoto,
    cambiaAnno, creaAnno, resetTutto, ricarica,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore fuori dal provider');
  return s;
}
