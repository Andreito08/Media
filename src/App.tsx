import { useMemo, useState } from 'react';
import { StoreProvider, useStore } from './store';
import { IconBook, IconChart, Onboarding } from './components/ui';
import { Dashboard } from './components/Dashboard';
import { SezioneMaterie } from './components/Materie';
import { ImpostazioniModal } from './components/Profilo';
import { GlobalFx } from './components/fx';
import { formatMedia, mediaGenerale, mediaPesata } from './lib/grades';
import { useCountUp } from './lib/useCountUp';

type Tab = 'panoramica' | 'materie';

function Shell() {
  const { pronto, profile, materie, voti } = useStore();
  const [tab, setTab] = useState<Tab>('panoramica');
  const [profiloAperto, setProfiloAperto] = useState(false);

  const generale = useMemo(() => {
    const visibili = materie.filter((m) => !m.nascosta);
    const medie = visibili.map((m) => {
      const vv = voti.filter((v) => v.materiaId === m.id).map((v) => ({ valore: v.valore, peso: v.peso }));
      return mediaPesata(vv);
    });
    return mediaGenerale(medie);
  }, [materie, voti]);
  const generaleAnimata = useCountUp(generale);

  if (!pronto) {
    return (
      <div id="app-root" className="flex min-h-screen items-center justify-center">
        <div className="glass glass-sheen flex items-center gap-3 rounded-full px-6 py-4">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Caricamento voti…</p>
        </div>
      </div>
    );
  }

  if (!profile?.completato) {
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
              className="btn-liquid-primary press flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-black"
            >
              {(profile.nome.trim().charAt(0) || 'M').toUpperCase()}
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-extrabold tracking-tight">
                {profile.nome} · {profile.indirizzoNome}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Medie sempre a due decimali</div>
            </div>
            <div className="glass rounded-2xl px-4 py-1.5 text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generale</div>
              <div className={`text-2xl font-black leading-none tabular-nums ${sottoSei ? 'text-rose-600' : 'text-[#16294d] dark:text-blue-100'}`}>
                {formatMedia(generaleAnimata)}
              </div>
            </div>
          </div>
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

      <main key={tab} className="animate-fade-up mx-auto w-full max-w-4xl px-3 pt-5 sm:px-4">
        {tab === 'panoramica' && <Dashboard />}
        {tab === 'materie' && <SezioneMaterie />}
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
