// MAPPE DEI PIANI
// Diagrammi dei piani: file ammessi, collegamento al piano, generazione con Claude e invio alla pagina
const fs = require('fs');
const path = require('path');
const { errore, leggiJson, scriviJson, barre, FILE_PIANI, FILE_GETTONE_CHAT, CARTELLA_CLAUDE, CARTELLA_MAPPE } = require('./base');
const { controllaMappa } = require('../controllo-mappa');
const { avviaClaude } = require('./claude');
const { completaPiano } = require('./modello-piano');

// Solo file dentro ~/flussi, anche seguendo i collegamenti: la sala non mostra né legge nient'altro
function fileDentroFlussi(percorso, estensione) {
  try {
    const reale = fs.realpathSync(path.resolve(String(percorso || '')));
    const relativo = path.relative(fs.realpathSync(CARTELLA_MAPPE), reale);
    const dentro = relativo && !relativo.startsWith('..') && !path.isAbsolute(relativo);
    return dentro && path.extname(reale).toLowerCase() === estensione && fs.statSync(reale).isFile() ? reale : null;
  } catch {
    return null;
  }
}

const fileMappa = (percorso) => fileDentroFlussi(percorso, '.html');

// La skill /piano, dopo aver disegnato la mappa, la aggancia al piano con questo comando.
// avvisi è il numero di incongruenze trovate dalla sala: dal comando della skill non arriva, perché lì il controllo non gira
function collegaMappa(id, tipo, file, avvisi) {
  if (!['dati', 'struttura'].includes(tipo)) throw errore(400, 'tipo di mappa: dati o struttura');
  const reale = fileMappa(file);
  if (!reale) throw errore(400, 'la mappa deve essere un file .html dentro ~/flussi');
  const lista = leggiJson(FILE_PIANI);
  const indice = lista.findIndex((p) => p.id === id);
  if (indice < 0) throw errore(404, 'piano non trovato');
  const piano = completaPiano(lista[indice]);
  piano.mappe = [...piano.mappe.filter((m) => m.tipo !== tipo), { tipo, file: reale, ...(Number.isInteger(avvisi) ? { avvisi } : {}) }];
  piano.aggiornato = Date.now();
  lista[indice] = piano;
  scriviJson(FILE_PIANI, lista);
  return { id, mappe: piano.mappe };
}

// GENERAZIONE MAPPA
// Un claude -p in background disegna la mappa del piano: legge il progetto e le regole, scrive solo dentro ~/flussi
// (--permission-mode dontAsk nega ogni scrittura non elencata in --allowedTools). Senza Bash non potrebbe copiare il template,
// e riscriverlo intero costerebbe minuti: scrive solo il JSON dei dati, la sala copia il template e ce lo inserisce.
// Il gettone della chat e il collegamento al piano li aggiunge la sala: Claude non vede il gettone e non serve Bash.
const TIMEOUT_GENERAZIONE_MS = 15 * 60 * 1000;
const TIPI_DA_GENERARE = { dati: ['dati'], struttura: ['struttura'], entrambi: ['dati', 'struttura'] };
const TEMPLATE_MAPPA = {
  dati: { file: path.join(CARTELLA_CLAUDE, 'shared', 'diagramma-flusso-template.html'), blocco: '<script id="flow-data" type="application/json">' },
  struttura: { file: path.join(CARTELLA_CLAUDE, 'shared', 'diagramma-pagina-template.html'), blocco: '<script id="page-data" type="application/json">' },
};
const generazioni = new Map();

const promptGenerazione = (prog, tipi, testo) => [
  'Sei avviato in automatico dalla sala di controllo e nessuno può risponderti: genera SOLO la mappa del piano qui sotto, poi fermati.',
  `- leggi ${barre(path.join(CARTELLA_CLAUDE, 'skills', 'piano', 'SKILL.md'))} e applica solo le sezioni "## LETTURA" e "## MAPPA"; ignora le altre fasi.`,
  `- mappe da generare: ${tipi.join(' e ')}.`,
  `- le regole citate dalla skill sono in ${barre(path.join(CARTELLA_CLAUDE, 'shared'))}; salva le mappe in ${barre(path.join(CARTELLA_MAPPE, path.basename(prog.cartella)))}.`,
  '- eccezioni rispetto alla skill:',
  '  - NON scrivere il file .html e non copiare il template: lo copia la sala. Scrivi con Write SOLO il JSON dei dati (quello che andrebbe dentro <script id="flow-data"> per la mappa dati o <script id="page-data"> per la struttura), in un file con il nome che avrebbe la mappa ma con estensione .json.',
  '  - le regole del JSON sono in diagramma-flusso-json.md (dati) e diagramma-pagina-json.md (struttura), nella stessa cartella: NON aprire i file *-template.html (pagine da oltre 100 KB che non ti servono) e non leggere chat-mappa.md (la chat la configura la sala).',
  '  - il JSON deve essere valido (niente commenti né virgole finali) e senza la chiave "chat": la aggiunge la sala.',
  '  - non hai Bash: non avviare il server della chat e non lanciare "--piani collega", il collegamento al piano lo fa la sala.',
  '  - puoi scrivere file solo in quella cartella; non modificare nient\'altro.',
  "  - non fare domande: se manca l'obiettivo, non scrivere nessun file. Se manca il Dove, cercalo tu nel codice partendo dall'obiettivo.",
  '- l\'ultima riga della risposta deve essere una sola di queste due:',
  '  MAPPE: {"dati": "<percorso assoluto del file .json>", "struttura": "<percorso assoluto del file .json>"}   (solo i tipi generati)',
  '  ERRORE: <il motivo in una frase>',
  '',
  testo,
].join('\n');

function generaMappa(prog, dati) {
  const piano = leggiJson(FILE_PIANI).find((p) => p.id === dati.id && p.progetto === prog.nome);
  if (!piano) throw errore(404, 'piano non trovato');
  const tipi = TIPI_DA_GENERARE[piano.mappa];
  if (!tipi) throw errore(400, 'scegli prima la mappa da generare');
  if (generazioni.get(piano.id)?.stato === 'in-corso') throw errore(409, 'la mappa di questo piano si sta già generando');
  const testo = String(dati.testo || '');
  if (!testo.includes(`ID PIANO: ${piano.id}`)) throw errore(400, 'testo del piano non valido');
  fs.mkdirSync(path.join(CARTELLA_MAPPE, path.basename(prog.cartella)), { recursive: true });
  generazioni.set(piano.id, { stato: 'in-corso', inizio: Date.now() });
  eseguiGenerazione(prog, piano.id, tipi, testo)
    .then(() => generazioni.delete(piano.id))
    .catch((e) => generazioni.set(piano.id, { stato: 'errore', errore: String(e.message).slice(0, 500) }));
  return { generazione: generazioni.get(piano.id) };
}

// Solo .json: l'HTML lo costruisce la sala dal JSON validato, così un testo malevolo nel codice letto non può scrivere una pagina
const eseguiGenerazione = (prog, id, tipi, testo) => avviaClaude(prog, [
  '--tools', 'Read,Grep,Glob,Write',
  '--add-dir', path.join(CARTELLA_CLAUDE, 'shared'), path.join(CARTELLA_CLAUDE, 'skills', 'piano'), CARTELLA_MAPPE,
  '--allowedTools', 'Write(~/flussi/**/*.json)', 'Edit(~/flussi/**/*.json)',
  '--model', 'opus', '--effort', 'high',
], promptGenerazione(prog, tipi, testo), TIMEOUT_GENERAZIONE_MS, 'mappa').then((risultato) => collegaGenerate(prog, id, tipi, risultato));

// COSTRUZIONE MAPPA
// Si fida solo dei .json dentro ~/flussi: la sala rilegge e riscrive il JSON, quindi nella pagina finisce solo JSON valido.
// I < diventano <: il testo non può chiudere il blocco <script> e il JSON letto dalla pagina resta identico
function collegaGenerate(prog, id, tipi, testo) {
  const righe = testo.trim().split('\n');
  const ultima = righe[righe.length - 1].trim();
  if (ultima.startsWith('ERRORE:')) throw new Error(ultima.slice(7).trim());
  if (!ultima.startsWith('MAPPE:')) throw new Error('claude non ha detto dove ha salvato la mappa');
  let file;
  try {
    file = JSON.parse(ultima.slice(6));
  } catch {
    throw new Error('elenco delle mappe non leggibile');
  }
  const gettone = fs.existsSync(FILE_GETTONE_CHAT) ? fs.readFileSync(FILE_GETTONE_CHAT, 'utf8').trim() : '';
  for (const tipo of tipi) {
    const json = fileDentroFlussi(file[tipo], '.json');
    if (!json) throw new Error(`dati della mappa ${tipo} non trovati in ~/flussi`);
    let dati;
    try {
      dati = JSON.parse(fs.readFileSync(json, 'utf8'));
    } catch (e) {
      throw new Error(`dati della mappa ${tipo} non validi: ${e.message}`);
    }
    dati.chat = { token: gettone, project: barre(prog.cartella) };
    // Gli avvisi li scrive solo la sala: quelli eventualmente messi da Claude si sostituiscono
    dati.avvisi = controllaMappa(tipo, dati);
    const { file: modello, blocco } = TEMPLATE_MAPPA[tipo];
    const template = fs.readFileSync(modello, 'utf8');
    const inizio = template.indexOf(blocco);
    const fine = template.indexOf('</script>', inizio);
    if (inizio < 0 || fine < 0) throw new Error(`template della mappa ${tipo} senza il blocco dei dati`);
    const contenuto = JSON.stringify(dati, null, 2).replace(/</g, '\\u003c');
    const html = json.replace(/\.json$/i, '.html');
    fs.writeFileSync(html, `${template.slice(0, inizio + blocco.length)}\n${contenuto}\n${template.slice(fine)}`);
    fs.unlinkSync(json);
    collegaMappa(id, tipo, html, dati.avvisi.length);
  }
}

function inviaMappa(res, parametri) {
  const piano = leggiJson(FILE_PIANI).find((p) => p.id === parametri.get('piano'));
  const file = fileMappa(piano?.mappe?.find((m) => m.tipo === parametri.get('tipo'))?.file);
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Mappa non trovata: forse il file è stato eliminato. Rigenerala con /piano.');
  }
  // sandbox: la mappa ha un'origine anonima e non può leggere la pagina della sala (e il suo gettone) anche se fosse malevola.
  // allow-top-navigation-to-custom-protocols lascia funzionare i link vscode:// ai file
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Security-Policy': 'sandbox allow-scripts allow-popups allow-top-navigation-to-custom-protocols',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
  });
  res.end(fs.readFileSync(file));
}

module.exports = { fileMappa, generazioni, collegaMappa, generaMappa, inviaMappa };
