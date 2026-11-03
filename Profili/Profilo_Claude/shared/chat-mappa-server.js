#!/usr/bin/env node
// Server locale della chat delle mappe (diagramma-flusso / diagramma-pagina).
// Uso: node chat-mappa-server.js [--sfondo | --ferma]
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const PORTA = 4517;
const HOST = '127.0.0.1';
const FILE_GETTONE = path.join(os.homedir(), '.claude', 'chat-mappa-token');
const CARTELLA_MAPPE = path.join(os.homedir(), 'flussi');
const MAX_BODY = 2 * 1024 * 1024;
const TIMEOUT_MS = 4 * 60 * 1000;

const ISTRUZIONI = `Sei il tutor di programmazione di uno sviluppatore che sta imparando (React Native, JavaScript).
Ti scrive da una chat dentro una mappa interattiva del suo progetto: i passi del flusso dati si chiamano D1, D2…, gli elementi di una schermata S1, S2…
Nel messaggio hai la mappa completa (JSON), l'elemento selezionato e la conversazione finora. La cartella corrente è il progetto: leggi il codice con Read, Grep e Glob solo quando serve per rispondere bene.
Regole:
- rispondi sempre in italiano; i termini tecnici restano in inglese e li spieghi la prima volta.
- stile mini-lezione: spiega in modo semplice, con un esempio concreto (un paragone della vita reale o un mini snippet generico di poche righe) e collega la spiegazione alla mappa (es. "in D4…", "S3 è…").
- breve: al massimo 3 blocchi numerati con un titolo in grassetto, ognuno di 2-4 righe; niente premesse né convenevoli.
- non dare la soluzione della modifica che l'utente sta progettando né il codice finale da incollare, a meno che la chieda esplicitamente (es. "dammi la soluzione"); se chiede aiuto o indizi, dai suggerimenti che lo indirizzano.
- se la domanda parte da un'idea sbagliata, correggila in modo chiaro.
- non fare domande di verifica o quiz all'utente.
- puoi solo leggere: non proporti di modificare file.
- se una cosa non è nella mappa né nel codice, dillo invece di inventarla.`;

// GETTONE
// Senza gettone qualsiasi pagina web aperta nel browser potrebbe usare il server.
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

// RICERCA CLAUDE
// Il percorso dell'eseguibile dell'estensione VS Code cambia a ogni aggiornamento.
function trovaClaude() {
  if (process.env.CHAT_MAPPA_CLAUDE) return process.env.CHAT_MAPPA_CLAUDE;
  const binario = process.platform === 'win32' ? 'claude.exe' : 'claude';
  const cartella = path.join(os.homedir(), '.vscode', 'extensions');
  try {
    const candidati = fs.readdirSync(cartella)
      .filter((nome) => nome.startsWith('anthropic.claude-code-'))
      .map((nome) => path.join(cartella, nome, 'resources', 'native-binary', binario))
      .filter((file) => fs.existsSync(file))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    if (candidati.length) return candidati[0];
  } catch {}
  return 'claude';
}

// COSTRUZIONE PROMPT
function costruisciPrompt({ tipo, titolo, mappa, selezione, storia, domanda }) {
  const conversazione = (Array.isArray(storia) ? storia : [])
    .map((m) => `${m.ruolo === 'utente' ? 'Utente' : 'Tu'}: ${m.testo}`)
    .join('\n\n');
  return [
    `MAPPA ${tipo === 'struttura' ? 'STRUTTURA (elementi S)' : 'DATI (passi D)'}: ${titolo || ''}`,
    String(mappa || ''),
    `ELEMENTO SELEZIONATO: ${selezione || 'nessuno'}`,
    conversazione ? `CONVERSAZIONE FINORA:\n${conversazione}` : '',
    `NUOVA DOMANDA: ${domanda}`,
  ].filter(Boolean).join('\n\n');
}

// CHIAMATA CLAUDE
// --restricted limita la lettura dei file alla cartella del progetto; --no-session-persistence non salva la chat.
function chiediClaude(progetto, prompt) {
  return new Promise((resolve, reject) => {
    const args = [
      '-p', '--output-format', 'json', '--no-session-persistence',
      '--restricted', '--strict-mcp-config', '--tools', 'Read,Grep,Glob',
      '--permission-mode', 'dontAsk', '--system-prompt', ISTRUZIONI,
    ];
    // Senza chiavi API nell'ambiente claude può usare solo il login dell'abbonamento, mai la fatturazione a consumo
    const { ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, ...ambiente } = process.env;
    const figlio = spawn(trovaClaude(), args, { cwd: progetto, windowsHide: true, env: ambiente });
    let out = '';
    let err = '';
    const timer = setTimeout(() => figlio.kill(), TIMEOUT_MS);

    figlio.stdout.on('data', (d) => { out += d; });
    figlio.stderr.on('data', (d) => { err += d; });
    figlio.on('error', (e) => {
      clearTimeout(timer);
      reject(new Error(`claude non avviato: ${e.message}`));
    });
    figlio.on('close', () => {
      clearTimeout(timer);
      try {
        const risultato = JSON.parse(out);
        if (risultato.is_error) return reject(new Error(risultato.result || 'errore di claude'));
        resolve(risultato.result);
      } catch {
        reject(new Error((err || out || 'nessuna risposta (tempo scaduto?)').slice(0, 500)));
      }
    });
    figlio.stdin.end(prompt);
  });
}

// FILE DELLA MAPPA
// Solo file .html dentro ~/flussi (anche seguendo i collegamenti): il server non tocca nient'altro
function fileMappa(percorso) {
  try {
    const reale = fs.realpathSync(path.resolve(String(percorso || '')));
    const relativo = path.relative(fs.realpathSync(CARTELLA_MAPPE), reale);
    const dentro = relativo && !relativo.startsWith('..') && !path.isAbsolute(relativo);
    return dentro && path.extname(reale).toLowerCase() === '.html' && fs.statSync(reale).isFile() ? reale : null;
  } catch {
    return null;
  }
}

// APERTURA CARTELLA
// Apre la cartella della mappa nel gestore dei file, con il file già selezionato
function apriCartella(file) {
  const opzioni = { detached: true, stdio: 'ignore' };
  if (process.platform === 'win32') spawn('explorer.exe', [`/select,"${file}"`], { ...opzioni, windowsVerbatimArguments: true }).unref();
  else if (process.platform === 'darwin') spawn('open', ['-R', file], opzioni).unref();
  else spawn('xdg-open', [path.dirname(file)], opzioni).unref();
}

function rispondi(res, status, corpo) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Private-Network': 'true',
  });
  res.end(JSON.stringify(corpo));
}

function leggiCorpo(req) {
  return new Promise((resolve, reject) => {
    let corpo = '';
    req.on('data', (d) => {
      corpo += d;
      if (corpo.length > MAX_BODY) {
        reject(new Error('richiesta troppo grande'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(corpo));
      } catch {
        reject(new Error('JSON non valido'));
      }
    });
  });
}

// AVVIO SERVER
function avvia() {
  const gettone = leggiGettone();
  let occupato = false;

  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') return rispondi(res, 204, {});
    if (req.method === 'GET' && req.url === '/stato') return rispondi(res, 200, { attivo: true });
    if (req.method !== 'POST' || !['/chiedi', '/ferma', '/cartella', '/elimina'].includes(req.url)) return rispondi(res, 404, { errore: 'non trovato' });

    let dati;
    try {
      dati = await leggiCorpo(req);
    } catch (e) {
      return rispondi(res, 400, { errore: e.message });
    }
    if (!stessoGettone(gettone, dati.token)) return rispondi(res, 403, { errore: 'gettone non valido: rigenera la mappa' });

    if (req.url === '/ferma') {
      rispondi(res, 200, { fermato: true });
      return server.close(() => process.exit(0));
    }

    if (req.url === '/cartella' || req.url === '/elimina') {
      const file = fileMappa(dati.file);
      if (!file) return rispondi(res, 400, { errore: 'si possono aprire o eliminare solo mappe .html dentro ~/flussi' });
      if (req.url === '/cartella') {
        apriCartella(file);
        return rispondi(res, 200, { aperta: true });
      }
      fs.unlinkSync(file);
      return rispondi(res, 200, { eliminata: true });
    }

    const progetto = String(dati.project || '');
    if (!path.isAbsolute(progetto) || !fs.existsSync(progetto) || !fs.statSync(progetto).isDirectory()) {
      return rispondi(res, 400, { errore: `cartella del progetto non trovata: ${progetto}` });
    }
    if (!String(dati.domanda || '').trim()) return rispondi(res, 400, { errore: 'domanda vuota' });
    if (occupato) return rispondi(res, 429, { errore: 'sto già rispondendo a un\'altra domanda: aspetta la risposta' });

    occupato = true;
    try {
      rispondi(res, 200, { risposta: await chiediClaude(progetto, costruisciPrompt(dati)) });
    } catch (e) {
      rispondi(res, 500, { errore: e.message });
    } finally {
      occupato = false;
    }
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`Chat mappe già attiva su http://${HOST}:${PORTA}`);
      process.exit(0);
    }
    throw e;
  });
  server.listen(PORTA, HOST, () => console.log(`Chat mappe attiva su http://${HOST}:${PORTA}`));
}

// AVVIO IN SFONDO
// Il processo staccato resta acceso anche dopo la chiusura della sessione di Claude Code, fino al riavvio del PC.
function avviaInSfondo() {
  leggiGettone();
  const prova = http.get({ host: HOST, port: PORTA, path: '/stato', timeout: 1500 }, (res) => {
    res.resume();
    console.log(`Chat mappe già attiva su http://${HOST}:${PORTA}`);
  });
  prova.on('timeout', () => prova.destroy());
  prova.on('error', () => {
    const figlio = spawn(process.execPath, [__filename], { detached: true, stdio: 'ignore', windowsHide: true });
    figlio.unref();
    console.log(`Chat mappe avviata in sfondo su http://${HOST}:${PORTA}`);
  });
}

// ARRESTO
function ferma() {
  const corpo = JSON.stringify({ token: leggiGettone() });
  const req = http.request({ host: HOST, port: PORTA, path: '/ferma', method: 'POST', headers: { 'Content-Type': 'application/json' } }, (res) => {
    console.log(res.statusCode === 200 ? 'Chat mappe fermata' : `Arresto non riuscito (${res.statusCode})`);
  });
  req.on('error', () => console.log('Chat mappe già spenta'));
  req.end(corpo);
}

const comando = process.argv[2];
if (comando === '--sfondo') avviaInSfondo();
else if (comando === '--ferma') ferma();
else avvia();
