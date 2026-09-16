// Temi colore + dark mode. L'accento è guidato da variabili CSS (--acc, --acc-deep),
// così bottoni, hero e chip cambiano colore senza toccare i componenti.

export type TemaId = 'blu' | 'ciano' | 'verde' | 'ambra' | 'rosa';

export interface Tema {
  nome: string;
  acc: string; // colore principale
  deep: string; // variante scura per gradienti
}

export const THEMES: Record<TemaId, Tema> = {
  blu: { nome: 'Blu', acc: '#2563eb', deep: '#16294d' },
  ciano: { nome: 'Ciano', acc: '#0891b2', deep: '#0b3546' },
  verde: { nome: 'Verde', acc: '#059669', deep: '#07352a' },
  ambra: { nome: 'Ambra', acc: '#d97706', deep: '#472a02' },
  rosa: { nome: 'Rosa', acc: '#db2777', deep: '#4d0f2c' },
};

export interface Prefs {
  tema: TemaId;
  dark: boolean;
}

export const DEFAULT_PREFS: Prefs = { tema: 'blu', dark: false };
export const PREFS_KEY = 'medie-prefs-v1';

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const p = JSON.parse(raw) as Partial<Prefs>;
    return {
      tema: p.tema && p.tema in THEMES ? p.tema : 'blu',
      dark: p.dark === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** #rrggbb + alpha 0..1 -> rgba() */
export function hexA(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Scurisce (amt<0) o schiarisce (amt>0) un #rrggbb di amt (-100..100) */
export function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt) / 100;
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
