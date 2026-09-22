import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Tree-shaking stretto: solo i moduli necessari al grafico Line.
// Niente `chart.js/auto`. Filler serve per `fill: true` (area sfumata),
// Tooltip per gli hover; Legend non serve (legend.display: false).
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

// Stessa impronta fisica del grafico reale -> zero layout shift.
// Il padre del canvas deve restare: relative + altezza esplicita + min-w-0
// (min-w-0 evita il bug di flexbox che allarga il canvas su schermi stretti).
export const TREND_CHART_CLASS = 'relative h-64 w-full min-w-0 sm:h-80';

export function TrendChartSkeleton() {
  return (
    <div className={TREND_CHART_CLASS} aria-hidden="true" aria-label="Caricamento grafico">
      <div className="absolute inset-0 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-white/10" />
      <div className="absolute inset-x-4 top-4 flex justify-between">
        <div className="h-3 w-16 animate-pulse rounded-full bg-slate-300/80 dark:bg-white/10" />
        <div className="h-3 w-10 animate-pulse rounded-full bg-slate-300/80 dark:bg-white/10" />
      </div>
      <div className="absolute inset-x-6 bottom-6 top-12 animate-pulse rounded-xl bg-gradient-to-t from-slate-300/40 to-transparent dark:from-white/5" />
    </div>
  );
}

interface TrendChartProps {
  labels: string[];
  data: number[];
  color: string;
  isLoading?: boolean;
}

/** Curva dell'andamento medio: animazione minima + resize non aggressivo su mobile. */
export function TrendChart({ labels, data, color, isLoading = false }: TrendChartProps) {
  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      // Feedback rapido al primo paint su smartphone, niente jank da resize
      // quando la URL-bar di Chrome/Safari appare/scompare.
      resizeDelay: 50,
      animation: { duration: 200 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f2440',
          padding: 10,
          cornerRadius: 12,
          titleFont: { weight: 'bold' },
        },
      },
      scales: {
        y: {
          min: 1,
          max: 10,
          ticks: { stepSize: 1, color: '#94a3b8', font: { size: 10, weight: 'bold' } },
          grid: { color: 'rgba(100, 116, 139, 0.12)' },
        },
        x: {
          ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 8 },
          grid: { display: false },
        },
      },
    }),
    [],
  );

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data,
          borderColor: color,
          backgroundColor: (ctx: unknown) => {
            const { ctx: c, chartArea } = (ctx as { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }).chart;
            if (!chartArea) return `${color}33`;
            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, `${color}4D`);
            g.addColorStop(1, `${color}05`);
            return g;
          },
          fill: true,
          tension: 0.38,
          borderWidth: 2.5,
          pointRadius: data.map((v) => (v < 6 ? 4.5 : 0)),
          pointHoverRadius: 6,
          pointBackgroundColor: data.map((v) => (v < 6 ? '#ef4444' : color)),
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          segment: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            borderColor: (c: any) => (c.p0.parsed.y < 6 || c.p1.parsed.y < 6 ? '#ef4444' : color),
          },
        },
      ],
    }),
    [labels, data, color],
  );

  if (isLoading) return <TrendChartSkeleton />;
  if (labels.length === 0) return null;

  return (
    <div className={TREND_CHART_CLASS}>
      <Line options={options} data={chartData} />
    </div>
  );
}
