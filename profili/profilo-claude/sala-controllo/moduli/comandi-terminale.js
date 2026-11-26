// COMANDI DA TERMINALE
// Avvio e arresto della sala, apertura nel browser e comandi per attività, contesti, lezioni e piani
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const { errore, leggiJson, preparaDati, leggiGettone, barre, giorno, FILE_ATTIVITA, FILE_LEZIONI_MD } = require('./base');
const { PORTA, HOST, ORIGINE, HOST_AMMESSI } = require('./rete');
const { progetti, progetto, progettoCorrente } = require('./progetti');
const { STATI_ATTIVITA, CAMPI_ATTIVITA, MAPPE, creaAttivita, aggiornaAttivita } = require('./attivita');
const { scriviLezioni } = require('./lezioni');
const { aggiungiContesto, contestiDi, testoContesto } = require('./contesti');
const { collegaMappa } = require('./mappe');

// server.js sta una cartella sopra questo file: serve per riavviare la sala in sfondo
const FILE_SERVER = path.join(__dirname, '..', 'server.js');

function apriBrowser(prog) {
  const indirizzo = prog ? `${ORIGINE}/?progetto=${encodeURIComponent(prog.nome)}` : ORIGINE;
  const opzioni = { detached: true, stdio: 'ignore' };
  // In cmd la & separa i comandi: tra virgolette l'indirizzo arriva intero
  if (process.platform === 'win32') spawn('cmd.exe', ['/c', `start "" "${indirizzo}"`], { ...opzioni, windowsVerbatimArguments: true }).unref();
  else spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [indirizzo], opzioni).unref();
}

// AVVIO IN SFONDO
// Il processo staccato resta acceso anche dopo la chiusura del terminale, fino al riavvio del PC
function avviaInSfondo(apri) {
  const prog = apri ? progettoCorrente() : null;
  const prova = http.get({ host: HOST, port: PORTA, path: '/api/stato', headers: { host: HOST_AMMESSI[0] }, timeout: 1500 }, (res) => {
    res.resume();
    console.log(`Sala di controllo già attiva su ${ORIGINE}`);
    if (apri) apriBrowser(prog);
  });
  prova.on('timeout', () => prova.destroy());
  prova.on('error', () => {
    spawn(process.execPath, [FILE_SERVER], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
    console.log(`Sala di controllo avviata in sfondo su ${ORIGINE}`);
    if (apri) setTimeout(() => apriBrowser(prog), 800);
  });
}

// ARRESTO
function ferma() {
  preparaDati();
  const req = http.request({
    host: HOST, port: PORTA, path: '/api/ferma', method: 'POST',
    headers: { host: HOST_AMMESSI[0], 'Content-Type': 'application/json', 'X-Gettone': leggiGettone() },
  }, (res) => {
    console.log(res.statusCode === 200 ? 'Sala di controllo fermata' : `Arresto non riuscito (${res.statusCode})`);
  });
  req.on('error', () => console.log('Sala di controllo già spenta'));
  req.end('{}');
}

// USO
// Elenco dei comandi: lo stampa il messaggio di errore per un comando sconosciuto
const USO = 'uso: node server.js [--sfondo | --apri | --ferma | --terminale | --attivita ... | --piani ... | --contesto ... | --lezioni rigenera]';

// ATTIVITÀ DA TERMINALE
// Claude aggiunge le attività su richiesta dell'utente scrivendo il file direttamente, senza server né gettone
const USO_ATTIVITA = `uso: node server.js --attivita <azione>
  progetti                              elenca i progetti configurati
  elenco [progetto]                     elenca le attività
  aggiungi <progetto> <titolo> [campi]  aggiunge un'attività in "da fare"
  modifica <id> [campi]                 cambia i campi di un'attività
  stato <id> <stato>                    sposta un'attività (${STATI_ATTIVITA.join(', ')})
campi (gli stessi della Richiesta di un piano): --obiettivo, --problema, --dove,
  --mappa (${MAPPE.filter(Boolean).join(', ')}), --note, --branch, --titolo (solo in modifica)`;

// Trasforma [--obiettivo, testo, --dove, testo] in { obiettivo: testo, dove: testo }
function leggiCampi(args) {
  const campi = {};
  for (let i = 0; i < args.length; i += 2) {
    const campo = args[i].replace(/^--/, '');
    if (!args[i].startsWith('--') || !(campo in CAMPI_ATTIVITA) || args[i + 1] === undefined) throw errore(400, `campo non valido: ${args[i]}`);
    campi[campo] = args[i + 1];
  }
  return campi;
}

// LEZIONI DA TERMINALE
// Le lezioni si aggiungono solo superando un quiz nella sala: da qui si può solo rigenerare ~/Lezioni.md
function lezioniDaTerminale(azione) {
  preparaDati();
  if (azione !== 'rigenera') {
    console.log('uso: node server.js --lezioni rigenera');
    process.exitCode = 1;
    return;
  }
  scriviLezioni();
  console.log(`Aggiornato ${barre(FILE_LEZIONI_MD)}`);
}

// CONTESTI DA TERMINALE
// /chat-termina manda il JSON sullo standard input; /chat-riprendi legge l'ultimo (o quello con l'id dato) di un progetto
function contestoDaTerminale([azione, nome, id]) {
  preparaDati();
  if (azione === 'aggiungi') {
    let corpo = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (d) => { corpo += d; });
    process.stdin.on('end', () => {
      try {
        console.log(`Contesto salvato: ${aggiungiContesto(JSON.parse(corpo)).titolo}`);
      } catch (e) {
        console.error(`errore: ${e.message}`);
        process.exitCode = 1;
      }
    });
    return;
  }
  if (azione === 'elenco') {
    console.log(contestiDi(nome).slice(0, 15).map((c) => `${c.id.slice(0, 8)}  ${giorno(c.data)}  ${c.titolo}`).join('\n') || 'nessun contesto salvato');
    return;
  }
  if (azione === 'ultimo') {
    const lista = contestiDi(nome);
    const scelto = id ? lista.find((c) => c.id.startsWith(id)) : lista[0];
    if (!scelto) {
      console.log('nessun contesto salvato per questo progetto');
      process.exitCode = 1;
      return;
    }
    console.log(testoContesto(scelto));
    return;
  }
  console.log('uso: node server.js --contesto aggiungi   (JSON su stdin: { "titolo", "progetto", "obiettivo", "fatto", "file", "decisioni", "prossimo" })\n     node server.js --contesto ultimo <progetto> [id]\n     node server.js --contesto elenco <progetto>');
  process.exitCode = 1;
}

function attivitaDaTerminale([azione, ...args]) {
  preparaDati();
  const stampa = (valore) => console.log(JSON.stringify(valore, null, 2));
  try {
    if (azione === 'progetti') return stampa(progetti().map((p) => p.nome));
    if (azione === 'elenco') return stampa(leggiJson(FILE_ATTIVITA).filter((a) => !args[0] || a.progetto === args[0]));
    if (azione === 'aggiungi') {
      const [nome, titolo, ...resto] = args;
      return stampa(creaAttivita(progetto({ progetto: nome }), { ...leggiCampi(resto), titolo }));
    }
    if (azione === 'modifica') return stampa(aggiornaAttivita({ ...leggiCampi(args.slice(1)), id: args[0] }));
    if (azione === 'stato') return stampa(aggiornaAttivita({ id: args[0], stato: args[1] }));
    console.log(USO_ATTIVITA);
  } catch (e) {
    console.error(`errore: ${e.message}`);
  }
  process.exitCode = 1;
}

// TERMINALE DI VS CODE
// Il task "Sala di controllo" lancia questa modalità all'apertura del progetto: mostra se la sala è accesa e aspetta un tasto
// (Invio = avvia o apri nel browser, F = ferma, Ctrl+C = esce dal terminale ma lascia la sala com'è)
function attendiTasti() {
  let ultimoStato = null;
  const leggiStato = (fine) => {
    const prova = http.get({ host: HOST, port: PORTA, path: '/api/stato', headers: { host: HOST_AMMESSI[0] }, timeout: 1500 }, (res) => {
      res.resume();
      fine(true);
    });
    prova.on('timeout', () => prova.destroy());
    prova.on('error', () => fine(false));
  };
  const mostra = (attiva) => process.stdout.write(`\nSala di controllo: ${attiva ? 'ATTIVA' : 'SPENTA'} su ${ORIGINE}\nInvio → ${attiva ? 'apri nel browser' : 'avvia e apri'} · F → ferma\n`);
  const controlla = () => leggiStato((attiva) => {
    if (attiva === ultimoStato) return;
    ultimoStato = attiva;
    mostra(attiva);
  });

  if (process.stdin.isTTY) process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (tasto) => {
    if (tasto.includes('\u0003')) process.exit(0);
    if (tasto.trim().toLowerCase() === 'f') ferma();
    else if (!tasto.trim()) avviaInSfondo(true);
    else return;
    setTimeout(controlla, 1500);
  });
  setInterval(controlla, 3000);
  controlla();
}

// PIANI DA TERMINALE
function pianiDaTerminale([azione, ...args]) {
  preparaDati();
  try {
    if (azione === 'collega') return console.log(JSON.stringify(collegaMappa(...args), null, 2));
    console.log('uso: node server.js --piani collega <id piano> <dati|struttura> <file della mappa>');
  } catch (e) {
    console.error(`errore: ${e.message}`);
  }
  process.exitCode = 1;
}

module.exports = {
  USO, avviaInSfondo, ferma, attendiTasti, attivitaDaTerminale, contestoDaTerminale,
  lezioniDaTerminale, pianiDaTerminale,
};
