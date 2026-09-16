// Catalogo gradi + indirizzi + materie di default. Modificare qui = aggiungere scuole senza toccare il resto.

export type Grado = 'elementari' | 'medie' | 'superiori' | 'universita';

export interface Indirizzo {
  id: string;
  grado: Grado;
  nome: string;
  materie: string[];
}

export const GRADI: { id: Grado; nome: string; descrizione: string }[] = [
  { id: 'elementari', nome: 'Primaria', descrizione: 'Scuola elementare' },
  { id: 'medie', nome: 'Secondaria di I grado', descrizione: 'Scuole medie' },
  { id: 'superiori', nome: 'Secondaria di II grado', descrizione: 'Superiori: licei, tecnici, professionali' },
  { id: 'universita', nome: 'Università', descrizione: 'Esami universitari (voti in trentesimi convertiti)' },
];

export const MATERIE_MEDIE = [
  'Italiano', 'Storia', 'Geografia', 'Matematica', 'Scienze',
  'Inglese', 'Seconda lingua', 'Tecnologia', 'Arte', 'Musica',
  'Ed. Fisica', 'Religione / Alternativa', 'Ed. Civica',
];

export const MATERIE_ELEMENTARI = [
  'Italiano', 'Matematica', 'Storia', 'Geografia', 'Scienze',
  'Inglese', 'Arte', 'Musica', 'Ed. Fisica', 'Religione / Alternativa', 'Ed. Civica',
];

export const INDIRIZZI_SUPERIORI: Indirizzo[] = [
  { id: 'classico', grado: 'superiori', nome: 'Liceo Classico', materie: ['Italiano', 'Latino', 'Greco', 'Inglese', 'Storia', 'Filosofia', 'Matematica', 'Fisica', 'Scienze', 'Storia dell’arte', 'Ed. Fisica', 'Religione / Alternativa', 'Ed. Civica'] },
  { id: 'scientifico', grado: 'superiori', nome: 'Liceo Scientifico', materie: ['Italiano', 'Latino', 'Inglese', 'Storia', 'Filosofia', 'Matematica', 'Fisica', 'Scienze', 'Disegno', 'Ed. Fisica', 'Religione / Alternativa', 'Ed. Civica'] },
  { id: 'scienze-applicate', grado: 'superiori', nome: 'Scientifico – Scienze Applicate', materie: ['Italiano', 'Inglese', 'Storia', 'Filosofia', 'Matematica', 'Fisica', 'Scienze', 'Informatica', 'Disegno', 'Ed. Fisica', 'Religione / Alternativa', 'Ed. Civica'] },
  { id: 'linguistico', grado: 'superiori', nome: 'Liceo Linguistico', materie: ['Italiano', 'Inglese', 'Francese', 'Spagnolo/Tedesco', 'Latino', 'Storia', 'Filosofia', 'Matematica', 'Fisica', 'Scienze', 'Storia dell’arte', 'Ed. Fisica', 'Religione / Alternativa', 'Ed. Civica'] },
  { id: 'scienze-umane', grado: 'superiori', nome: 'Liceo Scienze Umane', materie: ['Italiano', 'Latino', 'Inglese', 'Storia', 'Filosofia', 'Scienze umane', 'Matematica', 'Fisica', 'Scienze', 'Storia dell’arte', 'Ed. Fisica', 'Religione / Alternativa', 'Ed. Civica'] },
  { id: 'artistico', grado: 'superiori', nome: 'Liceo Artistico', materie: ['Italiano', 'Inglese', 'Storia', 'Filosofia', 'Matematica', 'Fisica', 'Scienze', 'Discipline grafiche', 'Discipline plastiche', 'Storia dell’arte', 'Ed. Fisica', 'Religione / Alternativa', 'Ed. Civica'] },
  { id: 'afm', grado: 'superiori', nome: 'Tecnico AFM (Ragioneria)', materie: ['Italiano', 'Inglese', 'Seconda lingua', 'Storia', 'Matematica', 'Economia aziendale', 'Diritto', 'Economia politica', 'Informatica', 'Ed. Fisica', 'Religione / Alternativa', 'Ed. Civica'] },
  { id: 'informatica', grado: 'superiori', nome: 'Tecnico Informatica e Telecomunicazioni', materie: ['Italiano', 'Inglese', 'Storia', 'Matematica', 'Informatica', 'Sistemi e reti', 'TPSIT', 'Telecomunicazioni', 'Fisica', 'Ed. Fisica', 'Religione / Alternativa', 'Ed. Civica'] },
  { id: 'meccanica', grado: 'superiori', nome: 'Tecnico Meccanica / Energia', materie: ['Italiano', 'Inglese', 'Storia', 'Matematica', 'Fisica', 'Meccanica', 'Sistemi', 'Disegno tecnico', 'Tecnologie', 'Ed. Fisica', 'Religione / Alternativa', 'Ed. Civica'] },
  { id: 'turismo', grado: 'superiori', nome: 'Tecnico Turismo', materie: ['Italiano', 'Inglese', 'Seconda lingua', 'Terza lingua', 'Storia', 'Matematica', 'Discipline turistiche', 'Diritto', 'Arte e territorio', 'Ed. Fisica', 'Religione / Alternativa', 'Ed. Civica'] },
  { id: 'enogastronomia', grado: 'superiori', nome: 'Professionale Enogastronomia', materie: ['Italiano', 'Inglese', 'Seconda lingua', 'Storia', 'Matematica', 'Enogastronomia', 'Sala e vendita', 'Accoglienza', 'Diritto', 'Ed. Fisica', 'Religione / Alternativa', 'Ed. Civica'] },
  { id: 'manutenzione', grado: 'superiori', nome: 'Professionale Manutenzione e Assistenza', materie: ['Italiano', 'Inglese', 'Storia', 'Matematica', 'Fisica', 'Tecnologie meccaniche', 'Tecnologie elettriche', 'Laboratorio', 'Ed. Fisica', 'Religione / Alternativa', 'Ed. Civica'] },
];

export function materieDefaultPerIndirizzo(grado: Grado, indirizzoId?: string): string[] {
  if (grado === 'elementari') return MATERIE_ELEMENTARI;
  if (grado === 'medie') return MATERIE_MEDIE;
  if (grado === 'universita') return ['Esame 1'];
  const found = INDIRIZZI_SUPERIORI.find((i) => i.id === indirizzoId);
  if (found) return found.materie;
  return ['Italiano', 'Matematica', 'Inglese', 'Storia'];
}

export const COLORI_MATERIE = [
  '#1e3a5f', '#2563eb', '#0d9488', '#0ea5e9', '#db2777',
  '#ea580c', '#65a30d', '#0891b2', '#3b82f6', '#be123c',
  '#0f766e', '#a16207', '#6d28d9', '#0369a1', '#9a3412',
];
