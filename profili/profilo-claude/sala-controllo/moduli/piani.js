// PIANI
// Piani di lavoro: elenco, creazione, aggiornamento, chiusura dopo il quiz e materiale per il quiz
const crypto = require('crypto');
const { errore, testo, leggiJson, scriviJson, FILE_PIANI, FILE_ATTIVITA } = require('./base');
const { git, elencoBranch, MAX_COMMIT } = require('./git');
const { blocchiBackend, conBlocco, senzaBlocco } = require('./messaggi-backend');
const { FASI_PIANO, MAPPE_PIANO } = require('./fasi-piano');
const { pianoVuoto, completaPiano } = require('./modello-piano');
const { fileMappa, generazioni } = require('./mappe');
const { generazioniSintesi } = require('./richiesta');

// MESSAGGI BACKEND DEI PIANI
function cambiaBackend(dati, cambia) {
  const lista = leggiJson(FILE_PIANI);
  const indice = lista.findIndex((p) => p.id === dati.id);
  if (indice < 0) throw errore(404, 'piano non trovato');
  const piano = completaPiano(lista[indice]);
  piano.backend = cambia(piano.backend);
  piano.aggiornato = Date.now();
  lista[indice] = piano;
  scriviJson(FILE_PIANI, lista);
  return { backend: piano.backend };
}

const aggiungiBackend = (dati) => cambiaBackend(dati, conBlocco(dati));
const eliminaBackend = (dati) => cambiaBackend(dati, senzaBlocco(dati));

// La pagina vede se il file di ogni mappa collegata esiste ancora e se ne sta generando una
const piani = (prog) => leggiJson(FILE_PIANI).filter((p) => p.progetto === prog.nome).map(completaPiano)
  .map((p) => ({
    ...p,
    mappe: p.mappe.map((m) => ({ ...m, esiste: Boolean(fileMappa(m.file)) })),
    generazione: generazioni.get(p.id) || null,
    generazioneSintesi: generazioniSintesi.get(p.id) || null,
  }));

// Da un'attività: obiettivo, note e «dove» diventano la Richiesta del piano; se c'è un problema scritto si compila anche la fase Bug
function creaPiano(prog, dati) {
  const attivita = dati.attivita ? leggiJson(FILE_ATTIVITA).find((a) => a.id === dati.attivita && a.progetto === prog.nome) : null;
  if (dati.attivita && !attivita) throw errore(404, 'attività non trovata');
  const adesso = Date.now();
  const piano = {
    id: crypto.randomUUID(), progetto: prog.nome, titolo: testo(dati.titolo || attivita?.titolo, 200),
    mappa: MAPPE_PIANO.includes(attivita?.mappa) ? attivita.mappa : '', mappe: [],
    attivita: attivita?.id || '', backend: blocchiBackend(attivita?.backend, adesso), fasi: pianoVuoto(), creato: adesso, aggiornato: adesso,
  };
  if (attivita) {
    const richiesta = piano.fasi.richiesta.campi;
    const note = [attivita.note, attivita.dove ? `Dove: ${attivita.dove}` : ''].filter(Boolean).join('\n');
    Object.assign(richiesta, { note });
    piano.fasi.bug.campi.problema = attivita.problema || '';
    richiesta.obiettivo = attivita.obiettivo || '';
  }
  scriviJson(FILE_PIANI, [...leggiJson(FILE_PIANI), piano]);
  return piano;
}

// Si accettano solo le fasi, i campi e le spunte definiti in fasi-piano.js
function aggiornaPiano(dati) {
  const lista = leggiJson(FILE_PIANI);
  const indice = lista.findIndex((p) => p.id === dati.id);
  if (indice < 0) throw errore(404, 'piano non trovato');
  const piano = completaPiano(lista[indice]);
  if (dati.titolo !== undefined) piano.titolo = testo(dati.titolo, 200);
  // Terminare un piano si può solo superando il quiz (/api/quiz/rispondi); riaprirlo no
  if (!piano.terminato && (dati.terminato === true || dati.stato === 'fatto')) throw errore(409, 'per terminare il piano supera il quiz');
  if (dati.terminato !== undefined) {
    piano.terminato = dati.terminato === true;
    piano.terminatoIl = piano.terminato ? (piano.terminatoIl || Date.now()) : null;
    piano.stato = piano.terminato ? 'fatto' : 'in-corso';
  }
  if (dati.stato !== undefined) {
    if (!['da-fare', 'in-corso', 'fatto'].includes(dati.stato)) throw errore(400, 'stato non valido');
    piano.terminato = dati.stato === 'fatto';
    piano.terminatoIl = piano.terminato ? (piano.terminatoIl || Date.now()) : null;
    piano.stato = dati.stato;
  }
  if (dati.mappa !== undefined) {
    if (dati.mappa !== '' && !MAPPE_PIANO.includes(dati.mappa)) throw errore(400, 'mappa non valida');
    if (generazioni.get(piano.id)?.stato === 'in-corso' && dati.mappa !== piano.mappa) throw errore(409, 'la mappa si sta generando: cambiala quando ha finito');
    piano.mappa = dati.mappa;
  }
  for (const fase of FASI_PIANO) {
    const nuova = dati.fasi?.[fase.id];
    if (!nuova) continue;
    for (const c of fase.campi) if (nuova.campi?.[c.id] !== undefined) piano.fasi[fase.id].campi[c.id] = String(nuova.campi[c.id]).slice(0, 5000);
    for (const s of fase.spunte) if (nuova.spunte?.[s.id] !== undefined) piano.fasi[fase.id].spunte[s.id] = nuova.spunte[s.id] === true;
  }
  piano.aggiornato = Date.now();
  lista[indice] = piano;
  scriviJson(FILE_PIANI, lista);
  return piano;
}

function eliminaPiano(dati) {
  const lista = leggiJson(FILE_PIANI);
  if (!lista.some((p) => p.id === dati.id)) throw errore(404, 'piano non trovato');
  scriviJson(FILE_PIANI, lista.filter((p) => p.id !== dati.id));
  return { eliminato: dati.id };
}

// QUIZ DI FINE PIANO
// Il piano si chiude solo qui, a quiz superato e lezione salvata
function terminaPiano(id) {
  const lista = leggiJson(FILE_PIANI);
  const indice = lista.findIndex((p) => p.id === id);
  if (indice < 0) throw errore(404, 'piano non trovato');
  const adesso = Date.now();
  lista[indice] = { ...completaPiano(lista[indice]), terminato: true, terminatoIl: adesso, stato: 'fatto', aggiornato: adesso };
  scriviJson(FILE_PIANI, lista);
}

// Dà al quiz i campi scritti nel piano e, se l'attività collegata ha un branch, i commit e il codice cambiato rispetto al principale.
// I file con segreti restano fuori dal diff: il testo parte per claude
const ESCLUDI_DAL_DIFF = ['.env*', '*.pem', '*.key', '*.p12', '*.pfx', '*.keystore', '*.jks', 'google-services.json', 'GoogleService-Info.plist'].map((p) => `:(exclude,glob)**/${p}`);
const MAX_DIFF = 20000;

async function codiceDelPiano(prog, branch) {
  const stato = await elencoBranch(prog);
  if (!branch || !stato.principale || branch === stato.principale || !stato.branch.some((b) => b.nome === branch)) return '';
  const [commit, diff] = await Promise.all([
    git(prog.cartella, ['log', '-n', String(MAX_COMMIT), '--format=%h %s', `${stato.principale}..${branch}`, '--']),
    git(prog.cartella, ['diff', `${stato.principale}...${branch}`, '--', '.', ...ESCLUDI_DAL_DIFF]),
  ]);
  return ['', `COMMIT DEL BRANCH ${branch}:`, commit.trim() || '(nessuno)', '', `CODICE CAMBIATO (${diff.length > MAX_DIFF ? `primi ${MAX_DIFF} caratteri` : 'intero'}):`, diff.slice(0, MAX_DIFF)].join('\n');
}

async function materialePiano(prog, id) {
  const grezzo = leggiJson(FILE_PIANI).find((p) => p.id === id && p.progetto === prog.nome);
  if (!grezzo) throw errore(404, 'piano non trovato');
  const piano = completaPiano(grezzo);
  if (piano.terminato) throw errore(409, 'il piano è già terminato');
  const campi = FASI_PIANO.filter((f) => !(f.soloBug && piano.fasi[f.id].spunte.nonBug)).flatMap((f) => f.campi
    .filter((c) => String(piano.fasi[f.id].campi[c.id] || '').trim())
    .map((c) => `${f.nome} › ${c.nome}: ${String(piano.fasi[f.id].campi[c.id]).trim()}`));
  const branch = leggiJson(FILE_ATTIVITA).find((a) => a.id === piano.attivita)?.branch || '';
  const codice = await codiceDelPiano(prog, branch).catch(() => '');
  const testoPiano = [`PIANO: ${piano.titolo || 'Senza titolo'}`, '', ...campi, codice].join('\n');
  return { piano, testo: testoPiano };
}

module.exports = {
  aggiungiBackend, eliminaBackend, piani, creaPiano, aggiornaPiano, eliminaPiano, terminaPiano, materialePiano,
};
