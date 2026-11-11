#!/usr/bin/env node
// Server locale della chat delle mappe (diagramma-flusso / diagramma-pagina).
// Uso: node chat-mappa-server.js [--sfondo | --ferma]
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const consumi = require('./consumi-claude');

const PORTA = 4517;
const HOST = '127.0.0.1';
const FILE_GETTONE = path.join(os.homedir(), '.claude', 'chat-mappa-token');
const CARTELLA_MAPPE = path.join(os.homedir(), 'flussi');
const MAX_BODY = 2 * 1024 * 1024;
const TIMEOUT_MS = 4 * 60 * 1000;

const ISTRUZIONI = `Sei il tutor di programmazione di uno sviluppatore che sta imparando (React Native, JavaScript).
Ti scrive da una chat dentro una mappa interattiva del suo progetto (i passi del flusso dati si chiamano D1, D2…, gli elementi di una schermata S1, S2…) oppure dalla sua sala di controllo, la pagina in cui gestisce sessioni di Claude Code, branch git e attività del progetto.
In fondo a queste istruzioni hai i dati completi (JSON) della mappa o della sala; nel messaggio la modalità di risposta, cosa sta guardando e la conversazione finora. La cartella corrente è il progetto: leggi il codice con Read, Grep e Glob solo quando serve per rispondere bene.
Regole valide in ogni modalità:
- rispondi sempre in italiano; i termini tecnici restano in inglese e li spieghi la prima volta.
- quando c'entra, collega la risposta alla mappa (es. "in D4…", "S3 è…") o alla sala; niente premesse né convenevoli.
- non dare la soluzione della modifica che l'utente sta progettando né il codice finale da incollare, a meno che la chieda esplicitamente (es. "dammi la soluzione"); se chiede aiuto o indizi, dai suggerimenti che lo indirizzano.
- se la domanda parte da un'idea sbagliata, correggila in modo chiaro.
- non fare domande di verifica o quiz all'utente.
- puoi solo leggere: non proporti di modificare file.
- se una cosa non è nella mappa né nel codice, dillo invece di inventarla.`;

// MODALITÀ DELLA CHAT
// L'utente la sceglie nella chat; le pagine vecchie non la mandano e restano sull'insegnante, lo stile di sempre
const MODALITA = {
  normale: `Modalità NORMALE: risposte CORTE. L'utente odia i muri di testo: meno si legge, meglio è.
- una domanda semplice: 1-3 frasi. Una domanda complessa: al massimo 5-6 righe in totale, salvo che chieda esplicitamente di più.
- più domande o richieste: una voce numerata per ciascuna, nello stesso ordine, nessuna saltata, ognuna di 1-2 righe.
- parti dalla risposta, nella prima riga. Se è sì o no, dillo subito; il motivo solo se serve, in una frase.
- vietati: premesse, ripetere la domanda, riepiloghi finali, frasi di cortesia o di passaggio, elenchi di alternative non richieste, avvertenze ovvie, sezioni con titoli.
- tieni solo i dettagli che servono davvero (nomi di file e funzioni, valori, un'avvertenza critica); niente esempi né spiegazioni a meno che li chieda.
- se c'è altro che potrebbe servire, chiudi con una riga sola ("Posso approfondire X") invece di scriverlo.`,
  traduttore: `Modalità TRADUTTORE: il messaggio dell'utente è un testo da tradurre, non una domanda. Riscrivilo LETTERALMENTE in termini semplici. NON spiegare, NON commentare, NON rispondere, NON fare paragoni o esempi, NON leggere il codice: questa modalità ha la precedenza su ogni altra regola.
- output: lo stesso testo riscritto tra virgolette doppie, con lo stesso significato, le stesse idee e lo stesso ordine; sostituisci i termini difficili con parole di tutti i giorni e accorcia le frasi lunghe senza perdere nulla.
- se il testo ha più frasi, paragrafi o punti elenco, riscrivili uno per uno nello stesso ordine, ognuno tra virgolette.
- dopo le virgolette, fuori da esse, una riga vuota e "Glossario:" con una voce per riga nel formato "termine originale → come l'hai reso in parole semplici", solo per i termini difficili che compaiono davvero nel testo; se non ce ne sono, niente glossario.
- nessuna premessa, nessun commento finale, nessun'altra parola oltre alla traduzione e al glossario.
- se il testo è in un'altra lingua, traducilo in italiano semplice.`,
  insegnante: `Modalità INSEGNANTE: fai una lezione guidata sul concetto richiesto, dall'origine, così l'utente capisce esattamente come funziona e sa riutilizzarlo.
- parti da perché esiste: quale problema risolve e cosa succederebbe senza.
- poi spiega ogni elemento che lo compone, uno alla volta e in ordine logico: cos'è, cosa fa, come si collega agli altri; scrivi tra backtick i pezzi di codice di cui parli.
- mostra come funziona su un esempio concreto, preferibilmente del suo progetto o della mappa, passo per passo.
- chiudi con come riusarlo: in quali altri casi si usa, gli errori tipici da evitare e come riconoscere quando serve.
- blocchi numerati con un titolo in grassetto, che seguono questo percorso.`,
  senior: `Modalità SENIOR DEVELOPER: sei la guida dell'utente per capire e implementare correttamente l'attività o la richiesta. Lo accompagni in 4 fasi, ognuna è una sezione con titolo ## fisso (stile di risposta come tutte le altre modalità).
FASI 1-3 (prima risposta, quando l'utente espone un'attività o una richiesta):
1. ## SPIEGAZIONE: spiega in modo comprensibile di cosa stiamo parlando o cosa stiamo implementando, e perché.
2. ## FILE E FUNZIONI: per ogni file e funzione del progetto interessati, evidenziali e spiega cosa fanno rispetto a ciò che ci serve (un albero file o una tabella aiuta); leggi il codice reale, non inventare.
3. ## IPOTESI: elenca TUTTE le strade possibili per implementarla, in ordine neutro. Ogni ipotesi è un sottotitolo "### IPOTESI N" (N = numero) seguito da tre voci fisse, una per riga:
   - Cosa comporta: cosa cambia nel codice, in una riga.
   - Lati positivi: ognuno con 🟢.
   - Rischi: ognuno con 🟡 se lieve o 🔴 se alto o problematico.
   NON consigliare un'ipotesi e NON metterne una in evidenza: decide l'utente. Se chiede apertamente quale sceglieresti, rispondi solo allora.
   Chiudi la risposta con il blocco "scelta" (vedi BLOCCHI VISIVI) con una voce per ipotesi, così l'utente la sceglie con un clic.
FASE 4 (risposta successiva, quando l'utente sceglie un'ipotesi: di solito il messaggio è "Scelgo l'ipotesi N: ..." dal clic sul blocco scelta):
4. ## IPOTESI SCELTA: apri con un riquadro "nota" che riporta l'ipotesi scelta, poi guidalo passo passo, con elenco numerato: dove guardare (file e funzioni), cosa controllare prima di toccare, come implementarla nell'ordine giusto, cosa verificare alla fine e gli errori tipici da evitare.
REGOLE:
- non scrivere codice pronto da incollare: spiega i passi a parole, l'utente scrive il codice e tu lo rivedi; codice solo se lo chiede esplicitamente (poi in riquadro, modifiche in PRIMA / DOPO).
- se l'utente non sceglie ma pone un'altra domanda, rispondi a quella; se cambia attività, riparti dalla fase 1.`,
};

const testoModalita = (modalita) => (Object.hasOwn(MODALITA, modalita) ? MODALITA[modalita] : MODALITA.insegnante);

// MODELLO
// Risposte brevi o semplici vanno bene con Sonnet; lezioni e consigli da senior restano sul modello predefinito (Opus)
const MODELLI_LEGGERI = { normale: 'sonnet', traduttore: 'sonnet' };

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

// PROPOSTE DI ATTIVITÀ
// Claude resta in sola lettura: scrive solo la proposta, la sala la crea quando l'utente clicca Aggiungi
const PROPOSTA_ATTIVITA = `CREARE ATTIVITÀ: solo se l'utente ti chiede di creare o aggiungere una o più attività, scrivi una riga di risposta e poi, per ogni attività, un blocco di codice con linguaggio "attivita" che contiene un solo oggetto JSON valido, così:
\`\`\`attivita
{"titolo": "...", "obiettivo": "...", "problema": "", "dove": "...", "mappa": "dati", "note": ""}
\`\`\`
- titolo obbligatorio (breve, max 200 caratteri); obiettivo = cosa vuole ottenere; problema solo se è un bug (cosa succede, cosa si aspettava, come riprodurlo); dove = pagina, flusso o file (cercalo nel codice se serve); mappa = "dati", "struttura" o "entrambi"; note = vincoli o dubbi. Lascia "" i campi che non sai.
- l'utente vede ogni blocco come una scheda con il tasto Aggiungi: non dire che l'hai aggiunta, perché la aggiunge lui.
- se non te lo chiede, non scrivere blocchi "attivita".`;

// BLOCCHI VISIVI
// Solo la chat della sala sa disegnarli: la pagina li legge e li trasforma in schemi, Claude non scrive HTML né SVG
const FORMATI_SALA = `BLOCCHI VISIVI: la chat della sala disegna questi blocchi (scrivili esattamente così, ognuno in un blocco di codice con il nome indicato):
1) schema a riquadri e frecce, con linguaggio "flusso":
\`\`\`flusso
titolo: Login con 2FA
A: L'utente inserisce email e password
B: L'app chiama /auth/login
C: Il server chiede il codice OTP
D: L'utente inserisce il codice
A -> B: invia
B -> C: richiesta
C -> D: schermata OTP
\`\`\`
  · righe "id: testo" = un riquadro (id breve senza spazi; testo di 3-10 parole); righe "id -> id: etichetta" = freccia (l'etichetta è facoltativa, 1-3 parole); "titolo: ..." facoltativo.
  · da 3 a 10 riquadri, una sola idea per schema; l'ordine dei riquadri è l'ordine di lettura. Per un ciclo o un "se" usa più frecce dallo stesso riquadro con etichette ("sì", "no", "errore").
2) riquadri di testo, con linguaggio "esempio" (un esempio concreto), "nota" (un concetto da ricordare) o "attenzione" (un errore tipico o un rischio). Dentro: testo breve, elenchi puntati, \`codice\` e **grassetto**; la prima riga può essere "titolo: ...".
3) tabelle markdown (| a | b |) per confronti e riepiloghi.
4) scelta cliccabile, con linguaggio "scelta": la pagina la disegna come bottoni e, al clic, invia da sola "Scelgo l'ipotesi N: testo". Usala solo in SENIOR, a chiusura delle ipotesi:
\`\`\`scelta
titolo: Quale ipotesi scegli?
1: Nome breve della prima ipotesi
2: Nome breve della seconda ipotesi
\`\`\`
  · righe "N: testo" (da 2 a 6 voci, testo di 3-10 parole); "titolo: ..." facoltativo.
5) i blocchi di codice normali (con il linguaggio, es. \`\`\`js) per il codice vero.
Quando usarli, in base alla modalità:
- INSEGNANTE e SENIOR: usali ogni volta che aiutano. Ogni percorso, sequenza di passi o flusso dati va in un "flusso"; ogni esempio in un riquadro "esempio"; confronti in tabella; il resto in elenchi corti. Meglio uno schema chiaro che un paragrafo.
- NORMALE: solo se l'utente chiede uno schema, un grafico o un esempio.
- TRADUTTORE: mai.
Non ripetere a parole ciò che lo schema già mostra: dopo uno schema bastano 1-2 righe di commento.`;

// FORMATO VISIVO
// Solo la chat della sala: la pagina disegna titoli, linee, citazioni e checklist. Le chat delle mappe hanno un altro renderer
const FORMATO_VISIVO_SALA = `FORMATO VISIVO (vince sulle regole di stile della modalità; il TRADUTTORE resta una pura traduzione). L'utente è visivo e ha difficoltà di attenzione: davanti a testo denso salta le parole e non capisce.
- niente muri di testo: poche parole, un'idea per riga, mai paragrafi in prosa. Anche una risposta brevissima ha un titolo e uno schema.
- la risposta è divisa in sezioni; ogni sezione comincia con un titolo "## TITOLO" (massimo 3 parole, MAIUSCOLO, senza emoji). Tra un titolo e il successivo una riga "---", con una riga vuota prima e dopo.
- sottotitolo solo se serve: "### SOTTOTITOLO" (massimo 3 parole, MAIUSCOLO, senza emoji).
- ogni passaggio spiegato è uno schema, che continua sotto ogni titolo.
- elenchi: un'idea per riga, un solo livello, riga vuota tra le voci; numerati (1. 2. 3.) quando l'ordine conta, puntati ("- ") altrimenti.
- parole importanti in **grassetto** (la pagina le colora): solo le parole chiave, mai frasi intere.
- emoji: SOLO queste 5, sempre con questo significato: 🟢 lato positivo / vantaggio · 🟡 rischio lieve · 🔴 rischio alto / problema grave · ⚠️ attenzione · ✅ fatto / corretto. Nessun'altra emoji.
- la prima riga di ogni sezione è la conclusione. Chiudi con una domanda o una richiesta SOLO se serve davvero (mai domande di cortesia come "va bene così?"); in quel caso mettila sotto un titolo ("## DOMANDA" o "## RICHIESTA", preceduto da "---") con una sola riga; mai riepiloghi alla fine.
- stili ammessi quando aiutano: nota = una frase da non perdere in **grassetto** su una riga a sé (niente etichetta "DA RICORDARE", niente emoji, niente citazione ">") · checklist "- [ ]" e "- [x]" · tabella confronto (massimo 3 colonne, celle di 1-4 parole) · albero file in un blocco di testo con ├── e └── · codice vero in blocchi con il linguaggio. Per un prima/dopo di codice: due blocchi con i sottotitoli "### PRIMA" e "### DOPO".`;
const NO_ATTIVITA = 'CREARE ATTIVITÀ: da questa chat non si possono creare attività. Se l\'utente te lo chiede, digli di chiederlo a Chattino nella sala di controllo.';

// COSTRUZIONE PROMPT
// La parte che non cambia tra una domanda e l'altra (istruzioni e dati della mappa) va nel system prompt, che claude
// mette in cache: dalla seconda domanda sulla stessa mappa la rilegge a circa 1/10 del costo.
// Modalità, selezione, conversazione e domanda cambiano a ogni domanda: stanno nel messaggio, così non rompono la cache.
// Con senzaContesto l'utente ha tolto il contesto dalla chat: niente mappa né selezione, anche se arrivassero
function sistemaChat({ tipo, titolo, mappa, senzaContesto }) {
  const contesto = senzaContesto
    ? 'CONTESTO: l\'utente ha scelto di non mandarti né la mappa/sala né l\'elemento selezionato. Rispondi solo alla domanda; leggi il codice del progetto solo se serve.'
    : `${{ struttura: 'MAPPA STRUTTURA (elementi S)', sala: 'SALA DI CONTROLLO (solo il blocco che l\'utente ha selezionato)' }[tipo] || 'MAPPA DATI (passi D)'}: ${titolo || ''}\n${String(mappa || '')}`;
  return [ISTRUZIONI, tipo === 'sala' ? PROPOSTA_ATTIVITA : NO_ATTIVITA, ...(tipo === 'sala' ? [FORMATO_VISIVO_SALA, FORMATI_SALA] : []), contesto].join('\n\n');
}

const PROMEMORIA_FORMATO = 'PROMEMORIA: in questa chat valgono sempre le regole FORMATO VISIVO del sistema (titoli "## ", righe "---", schemi, un\'idea per riga), anche in modalità NORMALE: la brevità resta, la prosa no.';

function messaggioChat({ tipo, modalita, selezione, senzaContesto, storia, domanda }) {
  const conversazione = (Array.isArray(storia) ? storia : [])
    .map((m) => `${m.ruolo === 'utente' ? 'Utente' : 'Tu'}: ${m.testo}`)
    .join('\n\n');
  return [
    testoModalita(modalita),
    tipo === 'sala' && modalita !== 'traduttore' ? PROMEMORIA_FORMATO : '',
    senzaContesto ? '' : `ELEMENTO SELEZIONATO: ${selezione || 'nessuno'}`,
    conversazione ? `CONVERSAZIONE FINORA:\n${conversazione}` : '',
    `NUOVA DOMANDA: ${domanda}`,
  ].filter(Boolean).join('\n\n');
}

// CHIAMATA CLAUDE
// --restricted limita la lettura dei file alla cartella del progetto; --no-session-persistence non salva la chat.
// Il system prompt passa da un file temporaneo: con la mappa dentro supera il limite di lunghezza della riga di comando di Windows
function chiediClaude(progetto, dati) {
  const fileSistema = path.join(os.tmpdir(), `chat-mappa-${process.pid}-${crypto.randomUUID()}.txt`);
  fs.writeFileSync(fileSistema, sistemaChat(dati), { mode: 0o600 });
  const pulisci = () => fs.rm(fileSistema, { force: true }, () => {});
  return new Promise((resolve, reject) => {
    const modello = MODELLI_LEGGERI[dati.modalita];
    const args = [
      '-p', '--output-format', 'json', '--no-session-persistence',
      '--restricted', '--strict-mcp-config', '--tools', 'Read,Grep,Glob',
      '--permission-mode', 'dontAsk', '--system-prompt-file', fileSistema,
      ...(modello ? ['--model', modello] : []),
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
      pulisci();
      reject(new Error(`claude non avviato: ${e.message}`));
    });
    figlio.on('close', () => {
      clearTimeout(timer);
      pulisci();
      let risultato;
      try {
        risultato = JSON.parse(out);
      } catch {
        return reject(new Error((err || out || 'nessuna risposta (tempo scaduto?)').slice(0, 500)));
      }
      const funzione = dati.tipo === 'sala' ? 'chattino' : 'chat-mappa';
      const consumo = consumi.registra(funzione, risultato);
      if (risultato.is_error) return reject(new Error(risultato.result || 'errore di claude'));
      resolve({ risposta: risultato.result, consumo, giornata: consumi.oggi() });
    });
    figlio.stdin.end(messaggioChat(dati));
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
      rispondi(res, 200, await chiediClaude(progetto, dati));
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
