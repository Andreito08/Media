import Dexie, { type Table } from 'dexie';
import type { Grado } from '../data/indirizzi';
import type { ScalaPlusMinus } from '../lib/grades';

export interface Profile {
  id: string; // sempre 'main'
  nome: string;
  grado: Grado;
  indirizzoId: string;
  indirizzoNome: string;
  periodoTipo: 'trimestre-penta' | 'quadrimestre' | 'unico';
  scala: ScalaPlusMinus;
  annoAttivoId: string;
  completato: boolean;
  updatedAt: number;
}

export interface Anno {
  id: string;
  label: string; // es. "2025/26"
  createdAt: number;
}

export interface Materia {
  id: string;
  annoId: string;
  nome: string;
  colore: string;
  isCustom: boolean;
  nascosta: boolean;
  createdAt: number;
}

export type TipoVoto = 'orale' | 'scritto' | 'pratico' | 'verifica';
export type Periodo = 'primo' | 'secondo';

export interface Voto {
  id: string;
  materiaId: string;
  valore: number; // valore numerico reale (es. 6.25)
  input: string; // testo originale (es. "6+")
  peso: number; // 100 default
  tipo: TipoVoto;
  periodo: Periodo;
  data: string; // ISO yyyy-mm-dd
  nota?: string;
  createdAt: number;
}

class MedieDB extends Dexie {
  profile!: Table<Profile, string>;
  anni!: Table<Anno, string>;
  materie!: Table<Materia, string>;
  voti!: Table<Voto, string>;

  constructor() {
    super('medie-scolastiche');
    this.version(1).stores({
      profile: 'id',
      anni: 'id',
      materie: 'id, annoId',
      voti: 'id, materiaId, data',
    });
  }
}

export const db = new MedieDB();

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const oggiISO = () => new Date().toISOString().slice(0, 10);

// ---- Snapshot anti-perdita: ultimi 10 backup automatici in localStorage ----
const SNAP_KEY = 'medie-snapshots-v1';

// Copia in memoria: prima ogni salvataggio (e ogni render delle impostazioni)
// rifaceva JSON.parse di 10 copie dell'intero DB, pesante sui telefoni lenti.
let snapCache: { at: number }[] | null = null;
let snapTimer: ReturnType<typeof setTimeout> | undefined;
const snapListeners = new Set<() => void>();

/** Per useSyncExternalStore: il contatore backup si aggiorna anche se lo snapshot arriva dopo il render. */
export function iscrivitiSnapshots(fn: () => void) {
  snapListeners.add(fn);
  return () => { snapListeners.delete(fn); };
}

function snapshots(): { at: number }[] {
  if (!snapCache) {
    try {
      const raw = localStorage.getItem(SNAP_KEY);
      snapCache = raw ? (JSON.parse(raw) as { at: number }[]) : [];
    } catch {
      snapCache = [];
    }
  }
  return snapCache;
}

export async function scattaSnapshotAutomatico() {
  clearTimeout(snapTimer); // uno snapshot immediato assorbe quello in coda
  try {
    const [profile, anni, materie, voti] = await Promise.all([
      db.profile.toArray(),
      db.anni.toArray(),
      db.materie.toArray(),
      db.voti.toArray(),
    ]);
    const arr = [{ at: Date.now(), profile, anni, materie, voti }, ...snapshots()].slice(0, 10);
    localStorage.setItem(SNAP_KEY, JSON.stringify(arr));
    snapCache = arr;
    snapListeners.forEach((fn) => fn());
  } catch {
    // mai bloccare l'app per il backup
  }
}

/**
 * Snapshot dopo una raffica di modifiche: uno solo, fuori dal tocco.
 * ponytail: se l'app viene chiusa entro 1,5s salta solo lo snapshot; i dati sono già in IndexedDB.
 */
export function programmaSnapshot() {
  clearTimeout(snapTimer);
  snapTimer = setTimeout(scattaSnapshotAutomatico, 1500);
}

export function leggiSnapshots(): { at: number }[] {
  return snapshots();
}

export function cancellaSnapshots() {
  clearTimeout(snapTimer);
  snapCache = null;
  localStorage.removeItem(SNAP_KEY);
  snapListeners.forEach((fn) => fn());
}

export async function esportaJSON(): Promise<string> {
  const [profile, anni, materie, voti] = await Promise.all([
    db.profile.toArray(),
    db.anni.toArray(),
    db.materie.toArray(),
    db.voti.toArray(),
  ]);
  return JSON.stringify({ app: 'medie-scolastiche', v: 1, exportedAt: Date.now(), profile, anni, materie, voti }, null, 2);
}

export async function importaJSON(testo: string): Promise<{ anni: number; materie: number; voti: number }> {
  const data = JSON.parse(testo) as {
    profile?: Profile[]; anni?: Anno[]; materie?: Materia[]; voti?: Voto[];
  };
  if (!data || (!data.materie && !data.voti && !data.anni)) {
    throw new Error('File non riconosciuto');
  }
  await scattaSnapshotAutomatico(); // sicurezza prima di sovrascrivere
  await db.transaction('rw', db.profile, db.anni, db.materie, db.voti, async () => {
    if (data.profile?.length) await db.profile.bulkPut(data.profile);
    if (data.anni?.length) await db.anni.bulkPut(data.anni);
    if (data.materie?.length) await db.materie.bulkPut(data.materie);
    if (data.voti?.length) await db.voti.bulkPut(data.voti);
  });
  return {
    anni: data.anni?.length ?? 0,
    materie: data.materie?.length ?? 0,
    voti: data.voti?.length ?? 0,
  };
}
