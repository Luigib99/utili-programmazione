// RICHIESTA DEL PIANO
// Due aiuti di Claude in sola lettura: proposta dei campi della Richiesta e riassunto "in breve"
const { errore, testo, leggiJson, scriviJson, FILE_PIANI } = require('./base');
const { FASI_PIANO } = require('./fasi-piano');
const { blocchiBackend } = require('./messaggi-backend');
const { avviaClaude } = require('./claude');
const { completaPiano } = require('./modello-piano');

// COMPILA LA RICHIESTA
// Un claude -p in sola lettura legge i messaggi del backend del piano e propone il testo dei campi della Richiesta.
// Risponde subito con le proposte: la pagina decide dove scriverle (solo nei campi vuoti)
const TIMEOUT_COMPILA_MS = 3 * 60 * 1000;
const CAMPI_RICHIESTA = FASI_PIANO.find((f) => f.id === 'richiesta').campi;

const promptCompila = (campi, messaggi) => [
  'Sei avviato in automatico dalla sala di controllo e nessuno può risponderti. Non modificare nessun file.',
  `Qui sotto ci sono i messaggi che il backend ha mandato per un piano di lavoro sull'app del progetto della cartella corrente. Capisci cosa chiedono e proponi il testo dei campi della Richiesta.`,
  'Campi (id: nome, cosa scrivere):',
  ...campi.map((c) => `- ${c.id}: ${c.nome}${c.aiuto ? `, ${c.aiuto}` : ''}`),
  'Regole:',
  '- scrivi come lo scriverebbe chi usa l\'app: italiano semplice, 1-3 frasi per campo, senza ripetere i messaggi per intero.',
  '- nei campi che sono elenchi (vincoli, note) una voce per riga, ognuna che comincia con "- ".',
  '- puoi leggere il codice dei punti citati per capire di cosa si parla; non inventare nomi di file o funzioni che non esistono.',
  '- se i messaggi non dicono nulla su un campo, lascia "" in quel campo: niente supposizioni.',
  `L'ultima riga della risposta deve essere solo questa, con JSON valido su una riga e solo gli id dei campi qui sopra:`,
  'COMPILA: {"id_campo": "testo", ...}',
  '',
  'MESSAGGI DEL BACKEND:',
  ...messaggi.map((m, i) => `--- messaggio ${i + 1} ---\n${m}`),
].join('\n');

async function compilaRichiesta(prog, dati) {
  const piano = leggiJson(FILE_PIANI).find((p) => p.id === dati.id && p.progetto === prog.nome);
  if (!piano) throw errore(404, 'piano non trovato');
  const messaggi = blocchiBackend(piano.backend, piano.aggiornato).map((b) => b.testo).filter(Boolean);
  if (!messaggi.length) throw errore(400, 'aggiungi prima un messaggio del backend');
  const campi = CAMPI_RICHIESTA;
  const risultato = await avviaClaude(prog, ['--tools', 'Read,Grep,Glob', '--model', 'sonnet'], promptCompila(campi, messaggi), TIMEOUT_COMPILA_MS, 'compila');
  const riga = risultato.trim().split('\n').reverse().find((r) => r.trim().startsWith('COMPILA:'));
  if (!riga) throw errore(502, 'claude non ha restituito i campi');
  let valori;
  try {
    valori = JSON.parse(riga.trim().slice(8));
  } catch {
    throw errore(502, 'risposta di claude non leggibile');
  }
  const proposte = Object.fromEntries(campi.map((c) => [c.id, testo(valori?.[c.id], 5000)]).filter(([, v]) => v));
  return { campi: proposte };
}

// IN BREVE
// Un claude -p in sola lettura riassume la Richiesta in due riquadri: com'è oggi e come deve essere dopo, per chi usa l'app.
// Non è la mappa e non è la soluzione: niente file, funzioni né cause, solo comportamento visibile
const TIMEOUT_SINTESI_MS = 5 * 60 * 1000;
const MAX_SINTESI = 2000;
const generazioniSintesi = new Map();

const promptSintesi = (testo) => [
  'Sei avviato in automatico dalla sala di controllo e nessuno può risponderti. Non modificare nessun file.',
  'Qui sotto c\'è la Richiesta di un piano di lavoro sul progetto della cartella corrente. Leggi il codice dei punti citati quanto basta per capire com\'è oggi, poi scrivi due testi:',
  '- "oggi": cosa fa oggi l\'app riguardo alla richiesta (per un Bug fix: cosa succede, cioè il sintomo).',
  '- "dopo": cosa deve fare dopo la modifica.',
  'Regole per i due testi:',
  '- italiano semplice e chiaro, dal punto di vista di chi usa l\'app; 2-4 frasi brevi ciascuno, non prolisso.',
  '- niente nomi di file, funzioni, variabili o endpoint; niente causa del problema, punto del codice da cambiare o modo di implementarlo.',
  '- se la richiesta è incomprensibile, contraddittoria o troppo vaga per capire di cosa parla, metti "chiaro": false e in entrambi i testi scrivi cosa non si capisce e cosa andrebbe precisato.',
  'L\'ultima riga della risposta deve essere solo questa, con JSON valido su una riga:',
  'SINTESI: {"chiaro": true, "oggi": "...", "dopo": "..."}',
  '',
  testo,
].join('\n');

function generaSintesi(prog, dati) {
  const piano = leggiJson(FILE_PIANI).find((p) => p.id === dati.id && p.progetto === prog.nome);
  if (!piano) throw errore(404, 'piano non trovato');
  if (generazioniSintesi.get(piano.id)?.stato === 'in-corso') throw errore(409, 'il riassunto di questo piano si sta già generando');
  const testoRichiesta = testo(dati.testo, 40000);
  if (!testoRichiesta) throw errore(400, 'scrivi qualcosa nella Richiesta prima di generare');
  const firma = testo(dati.firma, 40000);
  generazioniSintesi.set(piano.id, { stato: 'in-corso', inizio: Date.now() });
  // Un riassunto di poche frasi non ha bisogno di Opus: Sonnet pesa meno sui limiti dell'abbonamento
  avviaClaude(prog, ['--tools', 'Read,Grep,Glob', '--model', 'sonnet'], promptSintesi(testoRichiesta), TIMEOUT_SINTESI_MS, 'sintesi')
    .then((risultato) => salvaSintesi(piano.id, leggiSintesi(risultato), firma))
    .then(() => generazioniSintesi.delete(piano.id))
    .catch((e) => generazioniSintesi.set(piano.id, { stato: 'errore', errore: String(e.message).slice(0, 500) }));
  return { generazioneSintesi: generazioniSintesi.get(piano.id) };
}

function leggiSintesi(risultato) {
  const riga = risultato.trim().split('\n').reverse().find((r) => r.trim().startsWith('SINTESI:'));
  if (!riga) throw new Error('claude non ha restituito il riassunto');
  let valore;
  try {
    valore = JSON.parse(riga.trim().slice(8));
  } catch {
    throw new Error('riassunto non leggibile');
  }
  const oggi = testo(valore?.oggi, MAX_SINTESI);
  const dopo = testo(valore?.dopo, MAX_SINTESI);
  if (!oggi || !dopo) throw new Error('riassunto incompleto');
  return { chiaro: valore.chiaro !== false, oggi, dopo };
}

// Il piano si rilegge qui: mentre claude lavorava l'utente può aver continuato a scrivere
function salvaSintesi(id, sintesi, firma) {
  const lista = leggiJson(FILE_PIANI);
  const indice = lista.findIndex((p) => p.id === id);
  if (indice < 0) return;
  lista[indice] = { ...completaPiano(lista[indice]), sintesi: { ...sintesi, firma, data: Date.now() } };
  scriviJson(FILE_PIANI, lista);
}

module.exports = { compilaRichiesta, generaSintesi, generazioniSintesi };
