import { useMemo, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useStore } from '../store';
import { THEMES, hexA, shade } from '../lib/tema';
import { useCountUp } from '../lib/useCountUp';
import { formatMedia, mediaGenerale, mediaPesata, votoNecessarioPerObiettivo, pillColoreMedia } from '../lib/grades';
import { Btn, Card, IconBook, IconChart, IconShield, IconSpark, SectionTitle, inputCls, numDecProps, soloNumeriDecimali } from './ui';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const gridLight = 'rgba(100, 116, 139, 0.12)';
const gridDark = 'rgba(148, 163, 184, 0.16)';
const tickColor = '#94a3b8';

/** Telefono / touch / reduced-motion: niente animazioni canvas (PC invariato). */
function graficaLeggera(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(max-width: 768px), (pointer: coarse), (prefers-reduced-motion: reduce)').matches;
}

function makeOpts(grid: string, animate: boolean, leggera: boolean) {
  return {
    responsive: true,
    maintainAspectRatio: false as const,
    // Su telefono: canvas a risoluzione dimezzata + niente ridisegni a raffica
    // quando la barra URL di Chrome/Safari si mostra/nasconde in scroll.
    ...(leggera ? { devicePixelRatio: 1.5, resizeDelay: 200 } : {}),
    animation: animate ? { duration: 750, easing: 'easeOutQuart' as const } : (false as const),
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f2440',
        padding: 10,
        cornerRadius: 12,
        titleFont: { weight: 'bold' as const },
      },
    },
    scales: {
      y: { min: 1, max: 10, ticks: { stepSize: 1, color: tickColor, font: { size: 10, weight: 'bold' as const } } as never, grid: { color: grid } },
      x: { ticks: { color: tickColor, font: { size: 10 } } as never, grid: { display: false } },
    },
  };
}

/** Riempimento sfumato sotto le linee */
function areaFill(top: string, bottom: string) {
  return (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) => {
    const { ctx: c, chartArea } = ctx.chart;
    if (!chartArea) return top;
    const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    return g;
  };
}

/** Anello SVG della media generale (numero con count-up) */
function Gauge({ value, acc }: { value: number | null; acc: string }) {
  const animata = useCountUp(value);
  const leggera = useMemo(() => graficaLeggera(), []);
  const r = 54;
  const c = 2 * Math.PI * r;
  const pct = animata === null ? 0 : Math.min(100, Math.max(0, (animata / 10) * 100));
  const col = animata === null ? '#cbd5e1' : animata < 6 ? '#f43f5e' : animata < 7 ? '#f59e0b' : animata < 8 ? acc : '#10b981';
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="11" />
        <circle
          cx="64" cy="64" r={r} fill="none" stroke={col} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
          style={leggera ? undefined : { transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1), stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black tabular-nums text-white">{formatMedia(animata)}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">media</span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { materie, voti, profile, prefs } = useStore();
  const T = THEMES[prefs.tema] ?? THEMES.blu;
  const leggera = useMemo(() => graficaLeggera(), []);
  const animare = !leggera;
  const opts = useMemo(() => makeOpts(prefs.dark ? gridDark : gridLight, animare, leggera), [prefs.dark, animare, leggera]);
  const [obiettivo, setObiettivo] = useState('7,50');
  const [materiaObiettivo, setMateriaObiettivo] = useState('');

  const visibili = useMemo(() => materie.filter((m) => !m.nascosta), [materie]);

  const righe = useMemo(() => visibili.map((m) => {
    const vv = voti.filter((v) => v.materiaId === m.id);
    const media = mediaPesata(vv.map((v) => ({ valore: v.valore, peso: v.peso })));
    return { m, n: vv.length, media };
  }), [visibili, voti]);

  const generale = useMemo(() => mediaGenerale(righe.map((r) => r.media)), [righe]);
  const insufficienti = righe.filter((r) => r.media !== null && r.media < 6).length;
  const miglior = useMemo(() => [...righe].filter((r) => r.media !== null).sort((a, b) => (b.media ?? 0) - (a.media ?? 0))[0], [righe]);

  const trend = useMemo(() => {
    const ordinati = [...voti].sort((a, b) => a.data.localeCompare(b.data));
    const labels: string[] = [];
    const data: number[] = [];
    let acc = 0;
    let pesi = 0;
    for (const v of ordinati) {
      acc += v.valore * v.peso;
      pesi += v.peso;
      labels.push(v.data.slice(5));
      data.push(Math.round((acc / pesi) * 100) / 100);
    }
    return { labels: labels.slice(-30), data: data.slice(-30) };
  }, [voti]);

  const confronto = useMemo(() => ({
    labels: righe.map((r) => r.m.nome),
    datasets: [{
      data: righe.map((r) => r.media ?? 0),
      backgroundColor: righe.map((r) => (r.media !== null && r.media < 6 ? '#ef4444' : r.m.colore)),
      hoverBackgroundColor: righe.map((r) => (r.media !== null && r.media < 6 ? '#dc2626' : T.acc)),
      borderRadius: 9 as const,
      borderSkipped: false as const,
      barThickness: 14 as const,
    }],
  }), [righe, T.acc]);

  const [dettaglioId, setDettaglioId] = useState<string>('');
  const dettaglio = useMemo(() => {
    const id = dettaglioId || visibili[0]?.id;
    const mat = visibili.find((m) => m.id === id);
    if (!mat) return null;
    const vv = voti.filter((v) => v.materiaId === mat.id).sort((a, b) => a.data.localeCompare(b.data));
    return {
      mat,
      labels: vv.map((v) => v.data.slice(5)),
      valori: vv.map((v) => v.valore),
      media: mediaPesata(vv.map((v) => ({ valore: v.valore, peso: v.peso }))),
    };
  }, [dettaglioId, visibili, voti]);

  const simulazione = useMemo(() => {
    const ob = Number(obiettivo.replace(',', '.'));
    if (!Number.isFinite(ob) || ob < 1 || ob > 10) return null;
    const id = materiaObiettivo || visibili[0]?.id;
    const mat = visibili.find((m) => m.id === id);
    if (!mat) return null;
    const vv = voti.filter((v) => v.materiaId === mat.id).map((v) => ({ valore: v.valore, peso: v.peso }));
    const serve = votoNecessarioPerObiettivo(vv, ob);
    return { mat, serve, ob };
  }, [obiettivo, materiaObiettivo, visibili, voti]);

  return (
    <div className="space-y-4">
      {/* HERO */}
      <section className="glass-dark glass-sheen animate-fade-up relative overflow-hidden rounded-[1.75rem] p-5 text-white sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
          <Gauge value={generale} acc={T.acc} />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="text-xs font-black uppercase tracking-widest text-sky-200">Media generale · {profile?.indirizzoNome}</div>
            <div className="mt-1 text-xl font-black tracking-tight">
              {generale === null ? 'Aggiungi i primi voti per partire' : generale < 6 ? 'Sotto il 6: si recupera, un voto alla volta' : generale < 7.5 ? 'Buon passo, punta in alto' : 'Ottimo ritmo, continua così'}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { k: 'Materie', v: String(visibili.length) },
                { k: 'Voti', v: String(voti.length) },
                { k: 'Sotto il 6', v: String(insufficienti) },
              ].map((s) => (
                <div key={s.k} className="rounded-2xl bg-white/10 px-2 py-2.5 ring-1 ring-white/15 backdrop-blur">
                  <div className="text-xl font-black tabular-nums">{s.v}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-sky-100/80">{s.k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {miglior && miglior.media !== null && (
          <div className="relative mt-4 flex items-center gap-2 rounded-2xl bg-white/10 px-3.5 py-2.5 text-[13px] font-semibold text-sky-50 ring-1 ring-white/15">
            <IconSpark className="h-4 w-4 shrink-0 text-amber-300" />
            Materia più forte: <b>{miglior.m.nome}</b> con {formatMedia(miglior.media)}
          </div>
        )}
      </section>

      <Card delay={60}>
        <SectionTitle icon={<IconChart className="h-4 w-4" />} title="Andamento nel tempo" sub="La tua media dopo ogni voto" />
        {trend.labels.length === 0 ? (
          <EmptyState testo="Aggiungi i primi voti e qui vedrai la curva crescere." />
        ) : (
          <div className="h-52">
            <Line
              options={opts}
              data={{
                labels: trend.labels,
                datasets: [{
                  data: trend.data,
                  borderColor: T.acc,
                  backgroundColor: areaFill(hexA(T.acc, 0.3), hexA(T.acc, 0.02)),
                  fill: true,
                  tension: 0.38,
                  pointRadius: trend.data.map((v) => (v < 6 ? 4.5 : 0)),
                  pointHoverRadius: 6,
                  pointBackgroundColor: trend.data.map((v) => (v < 6 ? '#ef4444' : T.acc)),
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2,
                  segment: { borderColor: (c: any) => (c.p0.parsed.y < 6 || c.p1.parsed.y < 6 ? '#ef4444' : T.acc) },
                  borderWidth: 2.5,
                }],
              }}
            />
          </div>
        )}
      </Card>

      <Card delay={120}>
        <SectionTitle icon={<IconChart className="h-4 w-4" />} title="Confronto tra materie" sub="In rosso quelle sotto il 6" />
        {righe.length === 0 ? (
          <EmptyState testo="Nessuna materia." />
        ) : (
          <div className="h-64">
            <Bar options={{ ...opts, indexAxis: 'y' as const }} data={confronto} />
          </div>
        )}
        <ul className="stagger mt-4 space-y-1.5">
          {righe.map((r) => (
            <li key={r.m.id} className="press flex items-center gap-2.5 rounded-2xl px-2.5 py-2 hover:bg-white/60 dark:hover:bg-white/10">
              <span className="h-8 w-1.5 shrink-0 rounded-full shadow-sm" style={{ backgroundImage: `linear-gradient(180deg, ${r.m.colore}, ${r.m.colore}88)` }} />
              <span className="flex-1 truncate text-sm font-bold text-slate-700 dark:text-slate-200">{r.m.nome}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">{r.n} voti</span>
              <span className={`rounded-full px-3 py-1 text-[13px] font-black tabular-nums ring-1 ${pillColoreMedia(r.media)}`}>{formatMedia(r.media)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card delay={180}>
          <SectionTitle icon={<IconBook className="h-4 w-4" />} title="Dettaglio materia" sub="Voto per voto" />
          <select className={`${inputCls} mb-3`} value={dettaglio?.mat.id ?? ''} onChange={(e) => setDettaglioId(e.target.value)}>
            {visibili.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
          {!dettaglio || dettaglio.valori.length === 0 ? (
            <EmptyState testo="Nessun voto per questa materia." />
          ) : (
            <>
              <div className="h-48">
                <Line
                  options={opts}
                  data={{
                    labels: dettaglio.labels,
                    datasets: [{
                      data: dettaglio.valori,
                      borderColor: dettaglio.mat.colore,
                      backgroundColor: areaFill(`${dettaglio.mat.colore}55`, `${dettaglio.mat.colore}08`),
                      fill: true,
                      tension: 0.3,
                      pointRadius: dettaglio.valori.map((v) => (v < 6 ? 5.5 : 3.5)),
                      pointHoverRadius: 6,
                      pointBackgroundColor: dettaglio.valori.map((v) => (v < 6 ? '#ef4444' : '#fff')),
                      pointBorderColor: dettaglio.valori.map((v) => (v < 6 ? '#ef4444' : dettaglio.mat.colore)),
                      pointBorderWidth: 2.5,
                      segment: { borderColor: (c: any) => (c.p0.parsed.y < 6 || c.p1.parsed.y < 6 ? '#ef4444' : dettaglio.mat.colore) },
                      borderWidth: 2.5,
                    }],
                  }}
                />
              </div>
              <p className="mt-3 rounded-2xl border border-white/50 bg-white/45 py-2.5 text-center text-sm font-semibold text-slate-600 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                Media <b className="tabular-nums text-[#16294d] dark:text-blue-100">{formatMedia(dettaglio.media)}</b> su {dettaglio.valori.length} voti
              </p>
            </>
          )}
        </Card>

        <Card delay={240}>
          <SectionTitle icon={<IconShield className="h-4 w-4" />} title="Stato e obiettivo" sub="Dove sei e dove vuoi arrivare" />
          <div className="mx-auto h-44 max-w-[240px]">
            <Doughnut
              options={{
                responsive: true,
                maintainAspectRatio: false,
                ...(leggera ? { devicePixelRatio: 1.5, resizeDelay: 200 } : {}),
                cutout: '68%',
                plugins: {
                  legend: { position: 'bottom' as const, labels: { boxWidth: 10, boxHeight: 10, borderRadius: 5, useBorderRadius: true, font: { size: 11, weight: 'bold' as const }, color: prefs.dark ? '#94a3b8' : '#64748b' } },
                  tooltip: { backgroundColor: '#0f2440', padding: 10, cornerRadius: 12 },
                },
                animation: animare ? { duration: 750, easing: 'easeOutQuart' as const } : (false as const),
              }}
              data={{
                labels: ['Voti ≥ 6', 'Voti < 6'],
                datasets: [{ data: [voti.filter((v) => v.valore >= 6).length, voti.filter((v) => v.valore < 6).length], backgroundColor: [T.acc, '#ef4444'], hoverBackgroundColor: [shade(T.acc, -18), '#dc2626'], borderWidth: 3, borderColor: '#fff' }],
              }}
            />
          </div>
          <div className="mt-4 rounded-2xl border border-white/50 bg-white/45 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#16294d] dark:text-blue-100">
              <IconSpark className="h-4 w-4" /> Simulatore: che voto mi serve?
            </div>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_110px_auto]">
              <select className={inputCls} value={simulazione?.mat.id ?? ''} onChange={(e) => setMateriaObiettivo(e.target.value)}>
                {visibili.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
              <input className={inputCls} value={obiettivo} onChange={(e) => setObiettivo(soloNumeriDecimali(e.target.value))} placeholder="7,50" {...numDecProps} maxLength={5} aria-label="Media obiettivo" />
              <Btn variant="soft" onClick={() => {}}>Calcola</Btn>
            </div>
            {simulazione && (
              <p className="animate-pop-in mt-2.5 text-[13px] font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                {simulazione.serve === null ? '—' : simulazione.serve > 10
                  ? <>Non si può fare con un solo voto: servirebbe più di 10. Punta a più voti alti di fila.</>
                  : simulazione.serve <= 0
                    ? <>Obiettivo già in tasca: ti basta <b className="text-emerald-700 dark:text-emerald-300">qualsiasi voto</b>.</>
                    : <>Al prossimo voto in <b>{simulazione.mat.nome}</b> ti serve <b className="text-[#16294d] dark:text-blue-100">{formatMedia(simulazione.serve)}</b> per arrivare a <b>{formatMedia(simulazione.ob)}</b>.</>}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function EmptyState({ testo }: { testo: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/70 bg-white/30 px-4 py-8 text-center backdrop-blur-md">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200"><IconChart className="h-5 w-5" /></span>
      <p className="text-sm font-semibold text-slate-400">{testo}</p>
    </div>
  );
}
