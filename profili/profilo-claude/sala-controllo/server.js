#!/usr/bin/env node
// Sala di controllo locale: sessioni di Claude Code, branch e attività dei progetti.
// Uso: node server.js [comando]; l'elenco dei comandi è nella costante USO di moduli/comandi-terminale.js.
// Lanciato da dentro un progetto (--apri, --terminale) lo registra da solo e apre la sala su quello.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { preparaDati, leggiGettone, stessoGettone, CARTELLA_CLAUDE, FILE_GETTONE_CHAT } = require('./moduli/base');
const { PORTA, HOST, ORIGINE, HOST_AMMESSI, ORIGINI_AMMESSE } = require('./moduli/rete');
const { scriviLezioni } = require('./moduli/lezioni');
const { inviaMappa } = require('./moduli/mappe');
const {
  USO, avviaInSfondo, ferma, attendiTasti, attivitaDaTerminale, contestoDaTerminale,
  lezioniDaTerminale, pianiDaTerminale,
} = require('./moduli/comandi-terminale');
const { AZIONI, rispondi, leggiCorpo } = require('./moduli/rotte');

const FILE_PAGINA = path.join(__dirname, 'pagina.html');
const CARTELLA_LETTURA = path.join(__dirname, 'lettura-codice');
const FILE_STATICI = {
  '/lettura-codice/analisi.js': [path.join(CARTELLA_LETTURA, 'analisi.js'), 'text/javascript; charset=utf-8'],
  '/lettura-codice/pagina.js': [path.join(CARTELLA_LETTURA, 'pagina.js'), 'text/javascript; charset=utf-8'],
  '/lettura-codice/pagina.css': [path.join(CARTELLA_LETTURA, 'pagina.css'), 'text/css; charset=utf-8'],
};
const SERVER_CHAT = 'http://127.0.0.1:4517';
const FILE_SERVER_CHAT = path.join(CARTELLA_CLAUDE, 'shared', 'chat-mappa-server.js');
const consumi = require(path.join(CARTELLA_CLAUDE, 'shared', 'consumi-claude.js'));

// PAGINA
// Le intestazioni impediscono di caricare la pagina dentro altri siti e di farle contattare altri indirizzi
// Chattino parla con il server della chat delle mappe: è l'unico altro indirizzo che la pagina può contattare
function inviaPagina(res, gettone) {
  let gettoneChat = '';
  try {
    gettoneChat = fs.readFileSync(FILE_GETTONE_CHAT, 'utf8').trim();
  } catch {}
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Security-Policy': `default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ${SERVER_CHAT}; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  res.end(fs.readFileSync(FILE_PAGINA, 'utf8').replace('__GETTONE__', gettone).replace('__GETTONE_CHAT__', /^[0-9a-f]+$/.test(gettoneChat) ? gettoneChat : ''));
}

// FILE STATICI
// Solo i file elencati in FILE_STATICI: nessun percorso arriva dalla richiesta
function inviaStatico(res, [file, tipo]) {
  res.writeHead(200, { 'Content-Type': tipo, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(fs.readFileSync(file));
}

// AVVIO SERVER
// Controllo dell'Host: blocca i siti che si fingono 127.0.0.1 cambiando il proprio DNS (DNS rebinding)
function avvia() {
  preparaDati();
  scriviLezioni();
  consumi.pulisci();
  const gettone = leggiGettone();
  // Se il server della chat è già acceso, --sfondo non fa nulla
  if (fs.existsSync(FILE_SERVER_CHAT)) spawn(process.execPath, [FILE_SERVER_CHAT, '--sfondo'], { stdio: 'ignore', windowsHide: true });

  const server = http.createServer(async (req, res) => {
    if (!HOST_AMMESSI.includes(req.headers.host)) return rispondi(res, 403, { errore: 'host non ammesso' });
    const url = req.url.split('?')[0];
    if (req.method === 'GET' && url === '/') return inviaPagina(res, gettone);
    if (req.method === 'GET' && Object.hasOwn(FILE_STATICI, url)) return inviaStatico(res, FILE_STATICI[url]);
    if (req.method === 'GET' && url === '/api/stato') return rispondi(res, 200, { attivo: true });
    if (req.method === 'GET' && url === '/mappa') return inviaMappa(res, new URL(req.url, ORIGINE).searchParams);
    if (req.method !== 'POST' || !(url in AZIONI || url === '/api/ferma')) return rispondi(res, 404, { errore: 'non trovato' });
    if (!ORIGINI_AMMESSE.includes(req.headers.origin) && req.headers.origin !== undefined) return rispondi(res, 403, { errore: 'origine non ammessa' });
    if (!stessoGettone(gettone, req.headers['x-gettone'])) return rispondi(res, 403, { errore: 'gettone non valido: ricarica la pagina' });

    try {
      const dati = await leggiCorpo(req);
      if (url === '/api/ferma') {
        rispondi(res, 200, { fermato: true });
        return server.close(() => process.exit(0));
      }
      rispondi(res, 200, await AZIONI[url](dati));
    } catch (e) {
      rispondi(res, e.status || 500, { errore: e.message });
    }
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`Sala di controllo già attiva su ${ORIGINE}`);
      process.exit(0);
    }
    throw e;
  });
  server.listen(PORTA, HOST, () => console.log(`Sala di controllo attiva su ${ORIGINE}`));
}

const comando = process.argv[2];
if (comando === '--terminale') attendiTasti();
else if (comando === '--piani') pianiDaTerminale(process.argv.slice(3));
else if (comando === '--attivita') attivitaDaTerminale(process.argv.slice(3));
else if (comando === '--contesto') contestoDaTerminale(process.argv.slice(3));
else if (comando === '--lezioni') lezioniDaTerminale(process.argv[3]);
else if (comando === '--sfondo') avviaInSfondo(false);
else if (comando === '--apri') avviaInSfondo(true);
else if (comando === '--ferma') ferma();
else if (comando === undefined) avvia();
else {
  console.error(`comando sconosciuto: ${comando}\n${USO}`);
  process.exitCode = 1;
}
