// FUNZIONI DI BASE
// Aiuti usati da tutti i moduli della sala: percorsi dei dati, errori con stato HTTP, testi puliti, file JSON e gettone
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

// PERCORSI
// dati/ sta accanto a server.js, una cartella sopra questo file: non va mai copiato in una repo
const CARTELLA_CLAUDE = path.join(os.homedir(), '.claude');
const CARTELLA_DATI = path.join(__dirname, '..', 'dati');
const FILE_GETTONE = path.join(CARTELLA_DATI, 'gettone');
const FILE_PROGETTI = path.join(CARTELLA_DATI, 'progetti.json');
const FILE_ATTIVITA = path.join(CARTELLA_DATI, 'attivita.json');
const FILE_ARCHIVIO = path.join(CARTELLA_DATI, 'archivio.json');
const FILE_PIANI = path.join(CARTELLA_DATI, 'piani.json');
const FILE_LEZIONI = path.join(CARTELLA_DATI, 'lezioni.json');
const FILE_CONTESTI = path.join(CARTELLA_DATI, 'contesti.json');
const FILE_QUIZ = path.join(CARTELLA_DATI, 'quiz.json');
const FILE_LEZIONI_MD = path.join(os.homedir(), 'Lezioni.md');
const CARTELLA_MAPPE = path.join(os.homedir(), 'flussi');
const FILE_GETTONE_CHAT = path.join(CARTELLA_CLAUDE, 'chat-mappa-token');

const errore = (status, messaggio) => Object.assign(new Error(messaggio), { status });

function testo(valore, massimo) {
  return String(valore ?? '').trim().slice(0, massimo);
}

function leggiJson(file) {
  try {
    const valore = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(valore) ? valore : [];
  } catch {
    return [];
  }
}

// Scrive su un file temporaneo e poi lo rinomina: un arresto a metà non lascia il file troncato
function scriviJson(file, valore) {
  const temporaneo = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporaneo, `${JSON.stringify(valore, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporaneo, file);
}

const barre = (p) => p.split(path.sep).join('/');
const giorno = (ms) => new Date(ms).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

// DATI PRIVATI
// Gettone, progetti e attività stanno in dati/, che non va mai copiato in una repo
function preparaDati() {
  fs.mkdirSync(CARTELLA_DATI, { recursive: true, mode: 0o700 });
  if (!fs.existsSync(FILE_PROGETTI)) fs.writeFileSync(FILE_PROGETTI, '[]\n', { mode: 0o600 });
  if (!fs.existsSync(FILE_ATTIVITA)) fs.writeFileSync(FILE_ATTIVITA, '[]\n', { mode: 0o600 });
  if (!fs.existsSync(FILE_ARCHIVIO)) fs.writeFileSync(FILE_ARCHIVIO, '[]\n', { mode: 0o600 });
  if (!fs.existsSync(FILE_PIANI)) fs.writeFileSync(FILE_PIANI, '[]\n', { mode: 0o600 });
  if (!fs.existsSync(FILE_LEZIONI)) fs.writeFileSync(FILE_LEZIONI, '[]\n', { mode: 0o600 });
  if (!fs.existsSync(FILE_CONTESTI)) fs.writeFileSync(FILE_CONTESTI, '[]\n', { mode: 0o600 });
}

function leggiGettone() {
  try {
    return fs.readFileSync(FILE_GETTONE, 'utf8').trim();
  } catch {
    const gettone = crypto.randomBytes(24).toString('hex');
    fs.writeFileSync(FILE_GETTONE, gettone, { mode: 0o600 });
    return gettone;
  }
}

const stessoGettone = (atteso, ricevuto) => {
  const a = Buffer.from(atteso);
  const b = Buffer.from(String(ricevuto || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = {
  errore, testo, leggiJson, scriviJson, barre, giorno, preparaDati, leggiGettone, stessoGettone,
  CARTELLA_CLAUDE, CARTELLA_DATI, FILE_GETTONE, FILE_PROGETTI, FILE_ATTIVITA, FILE_ARCHIVIO,
  FILE_PIANI, FILE_LEZIONI, FILE_CONTESTI, FILE_QUIZ, FILE_LEZIONI_MD, CARTELLA_MAPPE, FILE_GETTONE_CHAT,
};
