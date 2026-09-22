import { useMemo, useState } from 'react';
import { StoreProvider, useStore } from './store';
import { IconBook, IconChart, Onboarding } from './components/ui';
import { Dashboard } from './components/Dashboard';
import { SezioneMaterie } from './components/Materie';
import { ImpostazioniModal } from './components/Profilo';
import { GlobalFx } from './components/fx';
import { TrendChartSkeleton } from './components/TrendChart';
import { formatMedia, mediaGenerale, mediaPesata } from './lib/grades';
import { useCountUp } from './lib/useCountUp';

type Tab = 'panoramica' | 'materie';

function Shell() {
  const { pronto, profile, materie, voti } = useStore();
  const [tab, setTab] = useState<Tab>('panoramica');
  const [profiloAperto, setProfiloAperto] = useState(false);

  // MODIFICA 1 — mai più `if (!pronto) return null`: la scocca fissa
  // (header + navbar + contenitori card) è visibile al primo render.
  // `isLoading` pilota solo gli skeleton interni, a parità di altezze.
  const isLoading = !pronto;

  const generale = useMemo(() => {
    if (isLoading) return null;
    const visibili = materie.filter((m) => !m.nascosta);
    const medie = visibili.map((m) => {
      const vv = voti.filter((v) => v.materiaId === m.id).map((v) => ({ valore: v.valore, peso: v.peso }));
      return mediaPesata(vv);
    });
    return mediaGenerale(medie);
  }, [isLoading, materie, voti]);
  const generaleAnimata = useCountUp(generale);

  // L'onboarding richiede di sapere che il DB è davvero vuoto:
  // lo si mostra solo DOPO il caricamento, mai come blocco iniziale.
  if (pronto && !profile?.completato) {
    return (
      <div id="app-root" className="min-h-screen">
        <Onboarding />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'panoramica', label: 'Panoramica', icon: <IconChart className="h-4 w-4" /> },
    { id: 'materie', label: 'Materie e voti', icon: <IconBook className="h-4 w-4" /> },
  ];

  const sottoSei = generale !== null && generale < 6;

  return (
    <div id="app-root" className="min-h-screen pb-10">
      <div className="sticky top-3 z-20 mx-auto w-full max-w-4xl px-3 sm:px-4">
        <header className="glass glass-sheen rounded-[1.75rem] px-4 pt-4 text-slate-800 dark:text-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setProfiloAperto(true)}
              title="Impostazioni"
              aria-label="Apri impostazioni"
              disabled={isLoading}
              className="btn-liquid-primary press flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-black"
            >
              {/* MODIFICA 1b — placeholder immediato, mai schermo vuoto */}
              {isLoading || !profile ? 'M' : (profile.nome.trim().charAt(0) || 'M').toUpperCase()}
            </button>
            <div className="min-w-0 flex-1">
              {isLoading || !profile ? (
                // Skeleton con la stessa impronta del nome reale
                <div className="space-y-1.5" aria-hidden="true">
                  <div className="h-4 w-40 max-w-full animate-pulse rounded-full bg-slate-300/70 dark:bg-white/10" />
                  <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200/70 dark:bg-white/10" />
                </div>
              ) : (
                <>
                  <div className="truncate text-[15px] font-extrabold tracking-tight">
                    {profile.nome} · {profile.indirizzoNome}
                  </div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Medie sempre a due decimali</div>
                </>
              )}
            </div>
            <div className="glass rounded-2xl px-4 py-1.5 text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generale</div>
              {isLoading ? (
                <div className="mx-auto h-7 w-12 animate-pulse rounded-lg bg-slate-300/70 dark:bg-white/10" aria-hidden="true" />
              ) : (
                <div className={`text-2xl font-black leading-none tabular-nums ${sottoSei ? 'text-rose-600' : 'text-[#16294d] dark:text-blue-100'}`}>
                  {formatMedia(generaleAnimata)}
                </div>
              )}
            </div>
          </div>
          {/* Navbar sempre interattiva dal primo frame, anche con Dexie in caricamento */}
          <nav className="mt-3 flex gap-1.5 px-0.5 pb-3.5 pt-1">
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  title={t.label}
                  aria-label={t.label}
                  className={`press flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold transition sm:flex-none sm:px-6 ${
                    active
                      ? 'btn-liquid-primary'
                      : 'text-slate-500 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/10'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              );
            })}
          </nav>
        </header>
      </div>

      <main key={tab} className="mx-auto w-full max-w-4xl px-3 pt-5 sm:px-4">
        {/* MODIFICA 2 — skeleton con le STESSE altezze del contenuto reale:
            niente layout shift quando IndexedDB risolve. */}
        {isLoading ? (
          <div className="space-y-4" aria-label="Caricamento contenuti">
            <div className="glass rounded-[1.75rem] p-5 sm:p-6">
              <div className="flex flex-col items-center gap-5 sm:flex-row">
                <div className="h-36 w-36 animate-pulse rounded-full bg-slate-300/60 dark:bg-white/10" />
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="h-3 w-32 animate-pulse rounded-full bg-slate-300/70 dark:bg-white/10" />
                  <div className="h-5 w-3/4 animate-pulse rounded-full bg-slate-200/80 dark:bg-white/10" />
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-[68px] animate-pulse rounded-2xl bg-slate-200/70 dark:bg-white/10" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="glass rounded-[1.75rem] p-4 sm:p-5">
              <div className="mb-3 h-5 w-48 animate-pulse rounded-full bg-slate-200/80 dark:bg-white/10" />
              <TrendChartSkeleton />
            </div>
          </div>
        ) : (
          <>
            {tab === 'panoramica' && <Dashboard />}
            {tab === 'materie' && <SezioneMaterie />}
          </>
        )}
      </main>

      <ImpostazioniModal aperto={profiloAperto} onChiudi={() => setProfiloAperto(false)} />
    </div>
  );
}

export default function App() {
  return (
    <>
      <div className="glass-wallpaper" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <GlobalFx />
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </>
  );
}
