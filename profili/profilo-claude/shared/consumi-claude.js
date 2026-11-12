// Registro dei consumi dei claude -p avviati da sala di controllo, catalogo e chat delle mappe.
// Una riga JSON per chiamata in ~/.claude/consumi-claude.jsonl: i numeri sono quelli che claude restituisce, non stime.
const fs = require('fs');
const os = require('os');
const path = require('path');

const FILE = path.join(os.homedir(), '.claude', 'consumi-claude.jsonl');
const CONSERVA_MS = 7 * 24 * 60 * 60 * 1000;

// REGISTRAZIONE
// input e scritti pesano come token pieni (scritti = messi in cache ora), cache = riletti dalla cache, pesano molto meno
function registra(funzione, risultato) {
  const u = risultato?.usage || {};
  const voce = {
    quando: Date.now(),
    funzione,
    modelli: Object.keys(risultato?.modelUsage || {}),
    input: u.input_tokens || 0,
    scritti: u.cache_creation_input_tokens || 0,
    cache: u.cache_read_input_tokens || 0,
    output: u.output_tokens || 0,
    costo: risultato?.total_cost_usd || 0,
  };
  try {
    fs.appendFileSync(FILE, `${JSON.stringify(voce)}\n`, { mode: 0o600 });
  } catch {}
  return voce;
}

function leggi() {
  try {
    return fs.readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map((riga) => {
      try {
        return JSON.parse(riga);
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

const vuoto = () => ({ chiamate: 0, token: 0, cache: 0, costo: 0 });

const somma = (t, v) => ({
  chiamate: t.chiamate + 1,
  token: t.token + v.input + v.scritti + v.output,
  cache: t.cache + v.cache,
  costo: t.costo + v.costo,
});

// GIORNATA
// Dalla mezzanotte locale di oggi (00:00) alle 23:59: a mezzanotte il conteggio riparte da zero
function oggi() {
  const inizio = new Date();
  inizio.setHours(0, 0, 0, 0);
  const fine = new Date(inizio);
  fine.setDate(fine.getDate() + 1);
  const perFunzione = {};
  let totale = vuoto();
  for (const v of leggi()) {
    if (v.quando < inizio.getTime() || v.quando >= fine.getTime()) continue;
    perFunzione[v.funzione] = somma(perFunzione[v.funzione] || vuoto(), v);
    totale = somma(totale, v);
  }
  return { inizio: inizio.getTime(), fine: fine.getTime(), perFunzione, totale };
}

// PULIZIA
// Tiene solo l'ultima settimana: il file non cresce per sempre
function pulisci() {
  const da = Date.now() - CONSERVA_MS;
  const tenute = leggi().filter((v) => v.quando >= da);
  try {
    const temporaneo = `${FILE}.${process.pid}.tmp`;
    fs.writeFileSync(temporaneo, tenute.map((v) => `${JSON.stringify(v)}\n`).join(''), { mode: 0o600 });
    fs.renameSync(temporaneo, FILE);
  } catch {}
}

module.exports = { registra, oggi, pulisci };
