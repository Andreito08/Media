# Media

> PWA offline-first per gestire voti, medie e grafici per ogni materia, dalla primaria all'università.

**Demo live:** https://andreito08.github.io/Media/

> Versione Flutter (prototipo per confronto): https://github.com/Andreito08/MediaFlutter

<p align="center">
  Voti italiani smart, medie pesate a due decimali, grafici di andamento e backup JSON.
  Si installa su Android e iPhone senza store e funziona anche senza connessione.
</p>

---

## Panoramica

**Media** è un'app web in italiano per studenti:

- **Onboarding guidato** — nome, grado (primaria, secondaria di I grado, superiori, università), indirizzo di studio, tipo di periodo (trimestre/pentamestre, quadrimestre, anno unico) e valore di `+` / `-`.
- **Materie automatiche** — catalogo pronto per medie, elementari e 12 indirizzi delle superiori (classico, scientifico, linguistico, informatica, AFM, turismo e altri), più materie custom.
- **Voti smart** — medie pesate per materia e media generale come a scuola (media delle medie), sempre a due decimali in formato italiano (`7,25`).
- **Dashboard** — gauge animata della media generale, grafici a linee, barre e ciambella, andamento nel tempo e calcolo del voto necessario per raggiungere un obiettivo.
- **Multi-anno** — anni scolastici (es. `2025/26`), passaggio di anno con copia delle materie.
- **Offline-first e anti-perdita** — salvataggio locale con IndexedDB, snapshot automatici ed export/import JSON.
- **PWA installabile** — installabile da browser su Android e iOS, tema chiaro/scuro e accenti colore.

Tutto resta sul dispositivo: nessun account, nessun server.

---

## Funzionalità

| Funzione | Descrizione |
|---|---|
| **Parsing voti italiani** | Accetta `6`, `6.5`, `6,5`, `6+`, `6-`, `6++`, `6½`, `6 1/2`, `7/8` (media del range) |
| **Scala +/- configurabile** | Quanto vale `+` e `-` (default `0,25`), modificabile dal profilo |
| **Pesi** | Ogni voto ha un peso `1-300` (`100` = normale) per verifiche che contano di più |
| **Tipi e periodi** | Tipo `orale / scritto / pratico / verifica`, periodo `primo / secondo` mappato su trimestre, pentamestre o quadrimestre |
| **Medie di materia e generale** | Pesata per materia + generale, formattazione `—` se senza voti, colori per fascia (sotto `6` in rosso) |
| **Obiettivo** | Calcolo del voto necessario al prossimo voto (peso 100) per arrivare a una media target |
| **Materie** | Aggiunta, rinomina, nascondi (esclusa dalla generale), elimina con i suoi voti |
| **Anni** | Crea anno, cambia anno attivo, copia materie dell'anno precedente |
| **Backup** | Snapshot automatici (ultimi 10) + export/import JSON completo |
| **Temi** | Dark mode + temi colore, salva preferenze in `localStorage` |

---

## Parsing dei voti

Esempi accettati (con scala default `+=0,25`, `-=0,25`):

| Input | Valore |
|---|---|
| `6` | `6` |
| `6,5` / `6.5` | `6,50` |
| `6+` | `6,25` |
| `6-` | `5,75` |
| `6½` | `6,50` |
| `7/8` | `7,50` (media) |

Voti fuori `1-10` rifiutati con messaggio di errore.

---

## Struttura della repository

```bash
Media/
├── index.html            # meta PWA, font Inter, mount point
├── public/
│   ├── icon-192.png      # icona PWA
│   ├── icon-512.png      # icona PWA
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── App.tsx           # shell + tab Panoramica / Materie e voti
│   ├── main.tsx
│   ├── store.tsx         # stato globale + azioni (Dexie)
│   ├── index.css         # Tailwind + glass UI
│   ├── components/
│   │   ├── Dashboard.tsx   # gauge, grafici, obiettivo
│   │   ├── Materie.tsx     # CRUD materie e voti
│   │   ├── Profilo.tsx     # profilo e scuola
│   │   ├── Impostazioni.tsx# temi, backup, reset
│   │   ├── ui.tsx          # card, bottoni, input
│   │   └── fx.tsx          # effetti globali
│   ├── lib/
│   │   ├── db.ts         # Dexie IndexedDB + snapshot + JSON
│   │   ├── grades.ts     # parse, medie, formattazione
│   │   ├── tema.ts       # temi e preferenze
│   │   └── useCountUp.ts # animazione numeri
│   └── data/
│       └── indirizzi.ts  # gradi, indirizzi, materie default
├── vite.config.ts        # Vite + Tailwind + VitePWA
├── package.json
└── README.md
```

---

## Come avviare

Requisiti: Node.js 20+.

```bash
npm install
npm run dev
```

Altri comandi:

```bash
npm run build    # tsc + build di produzione in dist/
npm run preview  # anteprima locale della build
npm run lint     # oxlint
```

Prova sulla stessa rete Wi-Fi dal telefono:

```bash
npm run dev -- --host
# oppure dopo la build:
npm run preview -- --host --port 4173
```

Poi apri `http://IP-DEL-PC:5173` (o `:4173`) dal browser del telefono.

---

## Uso su telefono

L'app è una PWA (`vite-plugin-pwa` + Workbox, manifest in `vite.config.ts`):

1. Pubblica `dist/` su un hosting HTTPS (Vercel, Netlify, GitHub Pages).
2. Apri l'URL dal telefono.
3. **Android / Chrome:** menu `⋮` > `Installa app` / `Aggiungi a schermata Home`.
4. **iPhone / Safari:** `Condividi` > `Aggiungi a schermata Home`.

Dopo l'installazione si apre in `standalone`, con icone e splash, e resta usabile offline.

---

## Dati e privacy

- DB locale `medie-scolastiche` in IndexedDB via Dexie: `profile`, `anni`, `materie`, `voti`.
- Snapshot anti-perdita in `localStorage` (`medie-snapshots-v1`, ultimi 10).
- Export file JSON con `app: medie-scolastiche`, import con snapshot di sicurezza prima di sovrascrivere.
- Nessun tracking, nessun backend: cancellare i dati del sito cancella anche voti e backup locali.

---

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS 4
- Dexie (IndexedDB)
- Chart.js + react-chartjs-2
- vite-plugin-pwa (Workbox)

---

## Autore

Progetto realizzato da **Andreito08**
— [GitHub](https://github.com/Andreito08)

---

## Licenza

Distribuito sotto licenza **MIT**, vedi `LICENSE`.
