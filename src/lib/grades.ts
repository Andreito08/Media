// Logica voti italiani: decimali, +, -, mezzi voti, pesi. Isolata qui per testabilità.

export interface ScalaPlusMinus {
  /** quanto vale "+" (default 0.25) */
  plus: number;
  /** quanto vale "-" in valore assoluto (default 0.25) */
  minus: number;
}

export const SCALA_DEFAULT: ScalaPlusMinus = { plus: 0.25, minus: 0.25 };

export interface ParseResult {
  ok: boolean;
  valore?: number;
  errore?: string;
}

/**
 * Accetta: "6" "6.5" "6,5" "6+" "6-" "6½" "6 1/2" "7/8" "7 - 8" "nc" no.
 * Ritorna valore 1..10 (clamp 0..10).
 */
export function parseVoto(raw: string, scala: ScalaPlusMinus = SCALA_DEFAULT): ParseResult {
  if (!raw) return { ok: false, errore: 'Inserisci un voto' };
  let s = raw.trim().toLowerCase().replace(',', '.');

  // simboli mezzo
  s = s.replace(/½/g, '.5').replace(/1\/2/g, '.5');

  // range "7/8" o "7-8" o "7 8" con due numeri -> media dei due, solo se entrambi 0..10
  const rangeMatch = s.match(/^(\d+(?:\.\d+)?)\s*[/\-–;]\s*(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    const a = Number(rangeMatch[1]);
    const b = Number(rangeMatch[2]);
    if (Number.isFinite(a) && Number.isFinite(b) && a >= 0 && a <= 10 && b >= 0 && b <= 10) {
      return { ok: true, valore: round2((a + b) / 2) };
    }
    // se non è un range valido, continua col parsing normale (darà errore sotto)
  }

  // suffisso + / - / più segni (es. "6++" raro ma gestito)
  let delta = 0;
  let base = s;
  const suffix = s.match(/^(\d+(?:\.\d+)?)\s*([+\-−]+)$/);
  if (suffix) {
    base = suffix[1];
    for (const ch of suffix[2]) {
      if (ch === '+') delta += scala.plus;
      else delta -= scala.minus;
    }
  }

  // caso "+"/"-" da soli non validi
  if (base === '' || base === '+' || base === '-') {
    return { ok: false, errore: `"${raw}" non è un voto valido. Esempi: 6, 6.5, 6+, 6-, 6½` };
  }

  const n = Number(base);
  if (!Number.isFinite(n)) {
    return { ok: false, errore: `"${raw}" non è un voto valido. Esempi: 6, 6.5, 6+, 6-, 6½` };
  }
  const valore = round2(n + delta);
  if (valore < 0 || valore > 10) {
    return { ok: false, errore: 'Il voto deve stare tra 1 e 10' };
  }
  if (valore < 1) {
    return { ok: false, errore: 'Il voto deve stare tra 1 e 10' };
  }
  return { ok: true, valore };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Due decimali stile italiano (7,25), ma senza decimali se sono ,00 (7). */
export function formatMedia(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const s = n.toFixed(2);
  if (s.endsWith('00')) return String(Math.round(n));
  return s.replace('.', ',');
}

export interface VotoPesato {
  valore: number;
  peso: number; // percentuale, 100 = peso pieno
}

export function mediaPesata(voti: VotoPesato[]): number | null {
  const validi = voti.filter((v) => Number.isFinite(v.valore) && v.peso > 0);
  if (validi.length === 0) return null;
  const sommaPesata = validi.reduce((acc, v) => acc + v.valore * v.peso, 0);
  const sommaPesi = validi.reduce((acc, v) => acc + v.peso, 0);
  if (sommaPesi === 0) return null;
  return round2(sommaPesata / sommaPesi);
}

/** Media generale = media delle medie di materia (standard scolastico italiano) */
export function mediaGenerale(medieMaterie: (number | null)[]): number | null {
  const validi = medieMaterie.filter((m): m is number => typeof m === 'number' && Number.isFinite(m));
  if (validi.length === 0) return null;
  return round2(validi.reduce((a, b) => a + b, 0) / validi.length);
}

/** Che voto (peso 100) servirebbe nel prossimo voto di una materia per portare la sua media a un obiettivo? */
export function votoNecessarioPerObiettivo(
  votiAttuali: VotoPesato[],
  obiettivo: number,
): number | null {
  // ipotesi: prossimo voto peso 100
  const sommaPesata = votiAttuali.reduce((a, v) => a + v.valore * v.peso, 0);
  const sommaPesi = votiAttuali.reduce((a, v) => a + v.peso, 0);
  const pesoNuovo = 100;
  // (sommaPesata + x*pesoNuovo) / (sommaPesi+pesoNuovo) = obiettivo
  const x = (obiettivo * (sommaPesi + pesoNuovo) - sommaPesata) / pesoNuovo;
  if (!Number.isFinite(x)) return null;
  return round2(x);
}

export function classeColoreMedia(m: number | null): string {
  if (m === null) return 'text-slate-400';
  if (m < 6) return 'text-red-600';
  if (m < 7) return 'text-amber-600';
  if (m < 8) return 'text-[#2c5282]';
  return 'text-emerald-700';
}

export function pillColoreMedia(m: number | null): string {
  if (m === null) return 'bg-slate-100 text-slate-500';
  if (m < 6) return 'bg-red-50 text-red-700 ring-red-200';
  if (m < 7) return 'bg-amber-50 text-amber-700 ring-amber-200';
  if (m < 8) return 'bg-blue-50 text-[#1e3a5f] ring-blue-200';
  return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
}
