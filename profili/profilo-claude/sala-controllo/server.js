#!/usr/bin/env node
// Sala di controllo locale: sessioni di Claude Code, branch e attività dei progetti.
// Uso: node server.js [--sfondo | --apri | --ferma | --terminale | --aggiungi | --attivita ... | --piani ...]
// Lanciato da dentro un progetto (--apri, --terminale, --aggiungi) lo registra da solo e apre la sala su quello.
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFile } = require('child_process');

const PORTA = 4518;
const HOST = '127.0.0.1';
const ORIGINE = `http://${HOST}:${PORTA}`;
const HOST_AMMESSI = [`${HOST}:${PORTA}`, `localhost:${PORTA}`];
const ORIGINI_AMMESSE = HOST_AMMESSI.map((h) => `http://${h}`);
const CARTELLA_CLAUDE = path.join(os.homedir(), '.claude');
const CARTELLA_DATI = path.join(__dirname, 'dati');
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
const FILE_PAGINA = path.join(__dirname, 'pagina.html');
const FILE_TASK = path.join(__dirname, 'tasks.json');
const CARTELLA_LETTURA = path.join(__dirname, 'lettura-codice');
const FILE_STATICI = {
  '/lettura-codice/analisi.js': [path.join(CARTELLA_LETTURA, 'analisi.js'), 'text/javascript; charset=utf-8'],
  '/lettura-codice/pagina.js': [path.join(CARTELLA_LETTURA, 'pagina.js'), 'text/javascript; charset=utf-8'],
  '/lettura-codice/pagina.css': [path.join(CARTELLA_LETTURA, 'pagina.css'), 'text/css; charset=utf-8'],
};
const SERVER_CHAT = 'http://127.0.0.1:4517';
const FILE_GETTONE_CHAT = path.join(CARTELLA_CLAUDE, 'chat-mappa-token');
const FILE_SERVER_CHAT = path.join(CARTELLA_CLAUDE, 'shared', 'chat-mappa-server.js');
const MAX_BODY = 64 * 1024;
const ATTIVA_DA_MS = 2 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const consumi = require(path.join(CARTELLA_CLAUDE, 'shared', 'consumi-claude.js'));
const { controllaMappa } = require('./controllo-mappa');
const STATI_ATTIVITA = ['da-fare', 'in-corso', 'fatto', 'atteso-backend'];
const CAMPI_ATTIVITA = { titolo: 200, obiettivo: 5000, problema: 5000, dove: 1000, mappa: 20, note: 5000, branch: 100 };
const MAPPE = ['', 'dati', 'struttura', 'entrambi'];
const MAX_COMMIT = 40;

const errore = (status, messaggio) => Object.assign(new Error(messaggio), { status });

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

// PROGETTI
function progetti() {
  return leggiJson(FILE_PROGETTI).filter((p) =>
    p && typeof p.nome === 'string' && typeof p.cartella === 'string'
    && path.isAbsolute(p.cartella) && fs.existsSync(p.cartella));
}

function progetto(dati) {
  const trovato = progetti().find((p) => p.nome === dati.progetto);
  if (!trovato) throw errore(400, `progetto sconosciuto: ${dati.progetto}`);
  return trovato;
}

// SCELTA CARTELLA
// Il browser non può dare il percorso di una cartella: la finestra di Windows la apre il server.
// Lo script è fisso e non contiene nulla che arrivi dalla pagina; il percorso scelto viene solo controllato, non eseguito.
// windowsHide nasconde la prima finestra che il processo apre: la consuma una finestra invisibile (trasparente, 1×1),
// così la finestra di scelta compare davvero, in primo piano
const SCRIPT_CARTELLA = [
  '[Console]::OutputEncoding = [Text.Encoding]::UTF8',
  'Add-Type -AssemblyName System.Windows.Forms',
  '$finestra = New-Object System.Windows.Forms.FolderBrowserDialog',
  "$finestra.Description = 'Scegli la cartella del progetto da aggiungere alla sala di controllo'",
  '$finestra.ShowNewFolderButton = $false',
  '$sopra = New-Object System.Windows.Forms.Form -Property @{ TopMost = $true; ShowInTaskbar = $false; Opacity = 0; FormBorderStyle = 0; Width = 1; Height = 1; StartPosition = 1 }',
  '$sopra.Show()',
  '$sopra.Activate()',
  "if ($finestra.ShowDialog($sopra) -eq 'OK') { $finestra.SelectedPath }",
  '$sopra.Close()',
].join('; ');
let sceltaAperta = false;

function scegliCartella() {
  if (process.platform !== 'win32') throw errore(501, 'la scelta della cartella c\'è solo su Windows');
  if (sceltaAperta) throw errore(409, 'la finestra per scegliere la cartella è già aperta');
  sceltaAperta = true;
  return new Promise((resolve, reject) => {
    execFile('powershell.exe', ['-NoProfile', '-STA', '-Command', SCRIPT_CARTELLA], { windowsHide: true, timeout: 4 * 60 * 1000 }, (e, out) => {
      sceltaAperta = false;
      if (e) return reject(errore(500, 'finestra di scelta chiusa o non avviata'));
      const scelta = out.trim();
      if (!scelta) return resolve({ annullato: true });
      const radice = radiceGit(scelta);
      if (!radice) return reject(errore(400, `${scelta} non è dentro un repo git: la sala lavora solo sui repo`));
      const esistente = progetti().find((p) => stessaCartella(p.cartella, radice));
      resolve({ cartella: radice, nome: esistente?.nome || path.basename(radice), esiste: Boolean(esistente) });
    });
  });
}

const stessaCartella = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();

// Si riconferma che sia la radice di un repo: la pagina potrebbe mandare un percorso qualsiasi
function aggiungiDaPagina(cartella) {
  if (typeof cartella !== 'string' || !path.isAbsolute(cartella) || !fs.existsSync(cartella)) throw errore(400, 'cartella non valida');
  const radice = radiceGit(cartella);
  if (!radice || !stessaCartella(radice, cartella)) throw errore(400, 'la cartella deve essere la radice di un repo git');
  return registraProgetto(radice);
}

// Toglie solo la voce dalla lista: cartella, attività e piani restano dove sono
function rimuoviProgetto(nome) {
  const lista = leggiJson(FILE_PROGETTI);
  if (!lista.some((p) => p?.nome === nome)) throw errore(404, 'progetto non trovato');
  scriviJson(FILE_PROGETTI, lista.filter((p) => p?.nome !== nome));
  return { rimosso: nome };
}

// CARTELLE DELLE SESSIONI
// Claude salva le chat in ~/.claude/projects/<percorso del progetto con i simboli sostituiti da ->; la lettera del disco può cambiare maiuscola
function cartelleSessioni(cartella) {
  const chiave = cartella.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const radice = path.join(CARTELLA_CLAUDE, 'projects');
  try {
    return fs.readdirSync(radice).filter((n) => n.toLowerCase() === chiave).map((n) => path.join(radice, n));
  } catch {
    return [];
  }
}

const processoVivo = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
};

// SESSIONI APERTE
// Ogni processo di Claude scrive ~/.claude/sessions/<pid>.json con l'id della chat: è aperta finché il processo è vivo
function sessioniAperte() {
  const aperte = new Map();
  const cartella = path.join(CARTELLA_CLAUDE, 'sessions');
  let nomi = [];
  try {
    nomi = fs.readdirSync(cartella).filter((n) => /^\d+\.json$/.test(n));
  } catch {}
  for (const nome of nomi) {
    try {
      const s = JSON.parse(fs.readFileSync(path.join(cartella, nome), 'utf8'));
      if (s.sessionId && Number.isInteger(s.pid) && processoVivo(s.pid)) aperte.set(s.sessionId, { pid: s.pid, lavoro: s.status || '' });
    } catch {}
  }
  return aperte;
}

function cartellaVsCode() {
  if (process.platform === 'win32') return path.join(process.env.APPDATA || '', 'Code');
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'Code');
  return path.join(os.homedir(), '.config', 'Code');
}

// CHAT ARCHIVIATE
// L'archivio lo tiene l'estensione nel database di VS Code: qui si legge soltanto, scriverci con VS Code aperto lo rovinerebbe
function chatArchiviate() {
  try {
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(path.join(cartellaVsCode(), 'User', 'globalStorage', 'state.vscdb'), { readOnly: true });
    try {
      const riga = db.prepare("SELECT value FROM ItemTable WHERE key = 'Anthropic.claude-code'").get();
      return new Set(JSON.parse(riga?.value || '{}').hiddenSessionIds || []);
    } finally {
      db.close();
    }
  } catch {
    return new Set();
  }
}

// DATI DI UNA SESSIONE
// I file delle chat arrivano a decine di MB: si rileggono solo se sono cambiati
const cacheSessioni = new Map();

function ultimoValore(testo, campo) {
  const inizio = testo.lastIndexOf(`"${campo}":"`);
  if (inizio < 0) return '';
  const trovato = testo.slice(inizio, inizio + 2000).match(new RegExp(`^"${campo}":("(?:[^"\\\\]|\\\\.)*")`));
  try {
    return trovato ? JSON.parse(trovato[1]) : '';
  } catch {
    return '';
  }
}

// Finestra di contesto: 1M per i modelli attuali, 200K per quelli più vecchi
function finestraModello(modello) {
  return /claude-(3|haiku-4|sonnet-4-5|opus-4-5|opus-4-1|opus-4-0|sonnet-4-0)/.test(modello) ? 200000 : 1000000;
}

// CONTESTO ATTUALE
// L'ultimo messaggio della chat principale (non dei subagent) dice quanti token Claude rilegge a ogni risposta
function contestoAttuale(testo) {
  const righe = testo.slice(-4 * 1024 * 1024).split('\n');
  for (let i = righe.length - 1; i >= 0; i--) {
    if (!righe[i].includes('"usage"') || !righe[i].includes('"type":"assistant"')) continue;
    try {
      const riga = JSON.parse(righe[i]);
      const uso = riga.message?.usage;
      if (riga.type !== 'assistant' || riga.isSidechain || !uso) continue;
      const token = (uso.input_tokens || 0) + (uso.cache_read_input_tokens || 0) + (uso.cache_creation_input_tokens || 0) + (uso.output_tokens || 0);
      return { token, modello: riga.message.model || '' };
    } catch {}
  }
  return { token: 0, modello: '' };
}

function datiSessione(file, stat) {
  const chiave = `${stat.size}:${stat.mtimeMs}`;
  const memorizzato = cacheSessioni.get(file);
  if (memorizzato?.chiave === chiave) return memorizzato.dati;
  const testo = fs.readFileSync(file, 'utf8');
  const { token, modello } = contestoAttuale(testo);
  const dati = {
    titolo: ultimoValore(testo, 'customTitle') || ultimoValore(testo, 'aiTitle') || 'Senza titolo',
    token,
    finestra: finestraModello(modello),
    compattazioni: testo.split('"subtype":"compact_boundary"').length - 1,
  };
  cacheSessioni.set(file, { chiave, dati });
  return dati;
}

// ELENCO SESSIONI
function elencoSessioni(prog) {
  const aperte = sessioniAperte();
  const archiviate = chatArchiviate();
  const archivioSala = new Set(leggiJson(FILE_ARCHIVIO));
  const adesso = Date.now();
  const sessioni = [];
  for (const cartella of cartelleSessioni(prog.cartella)) {
    for (const nome of fs.readdirSync(cartella)) {
      const id = nome.replace(/\.jsonl$/, '');
      if (!nome.endsWith('.jsonl') || !UUID.test(id)) continue;
      const file = path.join(cartella, nome);
      const stat = fs.statSync(file);
      const aperta = aperte.has(id) || adesso - stat.mtimeMs < ATTIVA_DA_MS;
      const archiviataDa = archiviate.has(id) ? 'vscode' : archivioSala.has(id) ? 'sala' : '';
      sessioni.push({
        id,
        ...datiSessione(file, stat),
        modificata: stat.mtimeMs,
        mb: Math.round(stat.size / 104857.6) / 10,
        stato: aperta ? 'aperta' : archiviataDa ? 'archiviata' : 'ferma',
        archiviataDa,
        lavoro: aperte.get(id)?.lavoro || '',
        pid: aperte.get(id)?.pid || 0,
        file,
      });
    }
  }
  return sessioni.sort((a, b) => b.modificata - a.modificata);
}

function sessione(prog, id) {
  if (!UUID.test(String(id))) throw errore(400, 'id di sessione non valido');
  const trovata = elencoSessioni(prog).find((s) => s.id === id);
  if (!trovata) throw errore(404, 'sessione non trovata');
  return trovata;
}

// ELIMINAZIONE SESSIONE
// Una chat aperta continua a scrivere sul suo file: cancellarla la rovinerebbe
function eliminaSessione(prog, id) {
  const s = sessione(prog, id);
  if (s.stato === 'aperta') throw errore(409, 'la chat è aperta: chiudila prima di eliminarla');
  fs.rmSync(s.file, { force: true });
  fs.rmSync(s.file.replace(/\.jsonl$/, ''), { recursive: true, force: true });
  if (s.archiviataDa === 'sala') scriviJson(FILE_ARCHIVIO, leggiJson(FILE_ARCHIVIO).filter((a) => a !== s.id));
  return { eliminata: id };
}

// ARCHIVIO SESSIONI
// La sala tiene un archivio suo: quello dell'estensione sta nel database di VS Code, che con VS Code aperto non si può scrivere
function archiviaSessione(prog, id, archivia) {
  const s = sessione(prog, id);
  if (!archivia && s.archiviataDa === 'vscode') throw errore(409, 'archiviata dall\'estensione: si ripristina dalla barra di Claude in VS Code');
  const archivio = new Set(leggiJson(FILE_ARCHIVIO));
  if (archivia) archivio.add(s.id);
  else archivio.delete(s.id);
  scriviJson(FILE_ARCHIVIO, [...archivio]);
  return { id, archiviata: archivia };
}

// NOME PROCESSO
// Windows riassegna i PID: prima di terminare si controlla che quel numero sia ancora un processo di Claude
function nomeProcesso(pid) {
  return new Promise((resolve) => {
    const [comando, args] = process.platform === 'win32'
      ? ['tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH']]
      : ['ps', ['-p', String(pid), '-o', 'comm=']];
    execFile(comando, args, { windowsHide: true, timeout: 10000 }, (e, out) => {
      if (e) return resolve('');
      const riga = out.trim();
      resolve(process.platform === 'win32' ? (riga.match(/^"([^"]+)"/)?.[1] || '') : path.basename(riga));
    });
  });
}

// CHIUSURA SESSIONE
// Termina il processo di una chat in attesa: la conversazione resta salvata, ma la scheda di VS Code resta scollegata
async function chiudiSessione(prog, id) {
  const s = sessione(prog, id);
  if (!s.pid) throw errore(409, 'nessun processo noto per questa chat: chiudi la scheda in VS Code');
  if (s.lavoro === 'busy') throw errore(409, 'la chat sta lavorando: aspetta che finisca');
  if (!/^claude(\.exe)?$/i.test(await nomeProcesso(s.pid))) throw errore(409, 'il processo non è più Claude: aggiorna la pagina');
  process.kill(s.pid);
  return { chiusa: id };
}

// COMANDI GIT
// execFile senza shell: gli argomenti arrivano a git così come sono, senza poter diventare altri comandi.
// core.fsmonitor spento: un .git/config estraneo non può far eseguire un programma già con git status
const GIT_SICURO = ['-c', 'core.fsmonitor=false'];

function git(cartella, args) {
  return new Promise((resolve, reject) => {
    execFile('git', [...GIT_SICURO, '-C', cartella, ...args], { windowsHide: true, timeout: 15000, maxBuffer: 4 * 1024 * 1024 }, (e, out, err) => {
      if (e) reject(errore(500, (err || e.message).trim()));
      else resolve(out);
    });
  });
}

const letturaCodice = require('./lettura-codice/server')({ gitSicuro: GIT_SICURO });
const catalogo = require('./lettura-codice/catalogo')({ lettura: letturaCodice, trovaClaude, cartellaDati: CARTELLA_DATI, registraConsumo: consumi.registra });

// ELENCO BRANCH
async function elencoBranch(prog) {
  const [corrente, refs, modifiche] = await Promise.all([
    git(prog.cartella, ['branch', '--show-current']),
    git(prog.cartella, ['for-each-ref', 'refs/heads', '--sort=-committerdate', '--format=%(refname:short)%09%(committerdate:unix)%09%(upstream:track)%09%(subject)']),
    git(prog.cartella, ['status', '--porcelain']),
  ]);
  const branch = refs.split('\n').filter(Boolean).map((riga) => {
    const [nome, data, remoto, ...messaggio] = riga.split('\t');
    return { nome, data: Number(data) * 1000, remoto, messaggio: messaggio.join('\t') };
  });
  const principale = ['main', 'master'].find((n) => branch.some((b) => b.nome === n)) || '';
  await Promise.all(branch.filter((b) => principale && b.nome !== principale).map(async (b) => {
    const [indietro, avanti] = (await git(prog.cartella, ['rev-list', '--left-right', '--count', `${principale}...${b.nome}`])).trim().split(/\s+/).map(Number);
    Object.assign(b, { indietro, avanti });
  }));
  const file = modifiche.split('\n').filter(Boolean).map((riga) => ({ stato: riga.slice(0, 2).trim(), percorso: riga.slice(3) }));
  return { corrente: corrente.trim(), modifiche: file.length, file: file.slice(0, 300), principale, branch };
}

const FORMATO_COMMIT = '--format=%H%x09%h%x09%ct%x09%an%x09%s';

function leggiCommit(out) {
  return out.split('\n').filter(Boolean).map((riga) => {
    const [hash, breve, data, autore, ...messaggio] = riga.split('\t');
    return { hash, breve, data: Number(data) * 1000, autore, messaggio: messaggio.join('\t') };
  });
}

// STORIA DI UN BRANCH
// Un branch contiene anche la storia di quello da cui è nato: principale..branch tiene solo i commit fatti sul branch,
// e il punto in cui si è staccato dal principale si mostra a parte
async function commitBranch(prog, nome) {
  const stato = await elencoBranch(prog);
  if (!stato.branch.some((b) => b.nome === nome)) throw errore(400, `branch inesistente: ${nome}`);
  if (!stato.principale || nome === stato.principale) {
    return { commit: leggiCommit(await git(prog.cartella, ['log', '-n', String(MAX_COMMIT), FORMATO_COMMIT, nome, '--'])), base: null, da: '' };
  }
  const commit = leggiCommit(await git(prog.cartella, ['log', '-n', String(MAX_COMMIT), FORMATO_COMMIT, `${stato.principale}..${nome}`, '--']));
  const hashBase = (await git(prog.cartella, ['merge-base', stato.principale, nome]).catch(() => '')).trim();
  const base = hashBase ? leggiCommit(await git(prog.cartella, ['log', '-n', '1', FORMATO_COMMIT, hashBase, '--']))[0] : null;
  return { commit, base, da: stato.principale };
}

// COMMIT DI TUTTE LE MODIFICHE
// git add -A prende anche i file nuovi: la pagina mostra l'elenco prima di confermare
async function committaTutto(prog, messaggio) {
  messaggio = String(messaggio ?? '').trim();
  if (!messaggio) throw errore(400, 'scrivi il messaggio del commit');
  if (messaggio.length > 2000) throw errore(400, 'messaggio troppo lungo');
  const stato = await elencoBranch(prog);
  if (!stato.corrente) throw errore(409, 'non sei su nessun branch: fai prima il checkout di un branch');
  if (!stato.modifiche) throw errore(409, 'non ci sono modifiche da committare');
  await git(prog.cartella, ['add', '-A']);
  await git(prog.cartella, ['commit', '-m', messaggio]);
  return { committati: stato.modifiche, branch: stato.corrente };
}

// RITORNO A UN COMMIT
// reset --hard toglie dal branch i commit successivi: solo sul branch attuale, senza modifiche in corso
// e mai su commit già pubblicati, che riscriverebbero la storia anche per chi li ha scaricati
async function tornaACommit(prog, hash) {
  if (!/^[0-9a-f]{40}$/.test(String(hash))) throw errore(400, 'commit non valido');
  const stato = await elencoBranch(prog);
  if (!stato.corrente) throw errore(409, 'non sei su nessun branch');
  if (stato.modifiche) throw errore(409, `ci sono ${stato.modifiche} file modificati: committali o mettili da parte prima`);
  await git(prog.cartella, ['merge-base', '--is-ancestor', hash, 'HEAD']).catch(() => {
    throw errore(400, 'il commit non fa parte del branch attuale');
  });
  const tolti = (await git(prog.cartella, ['rev-list', `${hash}..HEAD`])).split('\n').filter(Boolean);
  if (!tolti.length) throw errore(409, 'sei già su questo commit');
  const remoto = await git(prog.cartella, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']).then((r) => r.trim()).catch(() => '');
  if (remoto) {
    const nonPubblicati = (await git(prog.cartella, ['rev-list', `${hash}..HEAD`, '--not', remoto])).split('\n').filter(Boolean);
    if (nonPubblicati.length < tolti.length) throw errore(409, `alcuni di questi commit sono già su ${remoto}: tornare indietro qui riscriverebbe la storia pubblicata. Usa git revert`);
  }
  const prima = (await git(prog.cartella, ['rev-parse', 'HEAD'])).trim();
  await git(prog.cartella, ['reset', '--hard', hash]);
  return { tolti: tolti.length, prima };
}

// CAMBIO BRANCH
// Solo verso branch esistenti e senza modifiche non salvate, così il cambio non porta con sé lavoro a metà
async function cambiaBranch(prog, nome) {
  const stato = await elencoBranch(prog);
  if (!stato.branch.some((b) => b.nome === nome)) throw errore(400, `branch inesistente: ${nome}`);
  if (stato.modifiche) throw errore(409, `ci sono ${stato.modifiche} file modificati: salva o metti da parte le modifiche prima di cambiare branch`);
  await git(prog.cartella, ['switch', '--no-guess', nome]);
  return { corrente: nome };
}

// CREAZIONE BRANCH
async function creaBranch(prog, nome) {
  nome = String(nome || '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/.test(nome)) throw errore(400, 'nome non valido: lettere, numeri, . _ / - e niente spazi');
  await git(prog.cartella, ['check-ref-format', '--branch', nome]).catch(() => { throw errore(400, `nome non valido per git: ${nome}`); });
  await git(prog.cartella, ['branch', nome]);
  return { creato: nome };
}

// ELIMINAZIONE BRANCH
// Un branch con commit che non sono in quello principale si elimina solo con forza: quei commit si perdono
async function eliminaBranch(prog, nome, forza) {
  const stato = await elencoBranch(prog);
  const branch = stato.branch.find((b) => b.nome === nome);
  if (!branch) throw errore(400, `branch inesistente: ${nome}`);
  if (nome === stato.corrente) throw errore(409, 'sei su questo branch: passa a un altro prima di eliminarlo');
  if (nome === stato.principale) throw errore(409, 'il branch principale non si elimina da qui');
  if (!stato.principale && !forza) throw errore(409, 'nessun branch principale per controllare i commit: serve la conferma forzata');
  if (branch.avanti > 0 && !forza) throw errore(409, `${nome} ha ${branch.avanti} commit che non sono in ${stato.principale}: serve la conferma forzata`);
  await git(prog.cartella, ['branch', '-D', nome]);
  return { eliminato: nome };
}

// ATTIVITÀ
// I campi ricalcano la Richiesta dei piani: "Pianifica" li porta lì senza riscriverli
function testo(valore, massimo) {
  return String(valore ?? '').trim().slice(0, massimo);
}

function applicaCampi(attivita, dati) {
  for (const [campo, massimo] of Object.entries(CAMPI_ATTIVITA)) {
    if (dati[campo] !== undefined) attivita[campo] = testo(dati[campo], massimo);
  }
  if (!attivita.titolo) throw errore(400, 'il titolo è obbligatorio');
  if (!MAPPE.includes(attivita.mappa || '')) throw errore(400, `mappa non valida: ${MAPPE.filter(Boolean).join(', ')} o vuota`);
}

// Le nuove vanno in cima all'elenco del progetto
function creaAttivita(prog, dati) {
  const adesso = Date.now();
  const lista = leggiJson(FILE_ATTIVITA);
  const ordini = lista.filter((a) => a.progetto === prog.nome && Number.isFinite(a.ordine)).map((a) => a.ordine);
  const attivita = {
    id: crypto.randomUUID(), progetto: prog.nome, ...Object.fromEntries(Object.keys(CAMPI_ATTIVITA).map((c) => [c, ''])),
    backend: [], stato: 'da-fare', ordine: ordini.length ? Math.min(...ordini) - 1 : 0, creata: adesso, aggiornata: adesso,
  };
  applicaCampi(attivita, dati);
  scriviJson(FILE_ATTIVITA, [...lista, attivita]);
  return attivita;
}

// ORDINE ATTIVITÀ
// L'ordine lo decide l'utente trascinando: ogni attività del progetto riceve la sua posizione nell'elenco
function riordinaAttivita(prog, ids) {
  if (!Array.isArray(ids) || ids.length > 5000) throw errore(400, 'elenco non valido');
  const posizione = new Map(ids.map((id, i) => [String(id), i]));
  const lista = leggiJson(FILE_ATTIVITA);
  for (const a of lista) {
    if (a.progetto === prog.nome && posizione.has(a.id)) a.ordine = posizione.get(a.id);
  }
  scriviJson(FILE_ATTIVITA, lista);
  return { riordinate: posizione.size };
}

function aggiornaAttivita(dati) {
  const lista = leggiJson(FILE_ATTIVITA);
  const attivita = lista.find((a) => a.id === dati.id);
  if (!attivita) throw errore(404, 'attività non trovata');
  applicaCampi(attivita, dati);
  if (dati.stato !== undefined) {
    if (!STATI_ATTIVITA.includes(dati.stato)) throw errore(400, 'stato non valido');
    attivita.stato = dati.stato;
  }
  attivita.aggiornata = Date.now();
  scriviJson(FILE_ATTIVITA, lista);
  return attivita;
}

function eliminaAttivita(dati) {
  const lista = leggiJson(FILE_ATTIVITA);
  if (!lista.some((a) => a.id === dati.id)) throw errore(404, 'attività non trovata');
  scriviJson(FILE_ATTIVITA, lista.filter((a) => a.id !== dati.id));
  return { eliminata: dati.id };
}

const MAPPE_PIANO = ['dati', 'struttura', 'entrambi'];

// FASI DEI PIANI
// Il ragionamento che un senior fa prima di scrivere codice: la pagina disegna i campi da qui.
// Un unico piano per ogni lavoro. soloBug: la fase serve solo se il lavoro è un bug, altrimenti resta vuota
// I campi facoltativi non bloccano la fase
const FASI_PIANO = [
  {
    id: 'richiesta', nome: 'Richiesta',
    campi: [
      { id: 'obiettivo', nome: 'Obiettivo', aiuto: 'cosa vuoi ottenere, visto da chi usa l\'app; per un bug, cosa dovrebbe succedere', esempio: "Dalle Impostazioni l'utente cambia la lingua dell'app e la vede subito, senza riavviarla." },
      { id: 'cambia', facoltativo: true, nome: 'Cosa deve cambiare rispetto a oggi', aiuto: 'prima succede questo, dopo deve succedere quest\'altro', esempio: "Oggi dopo il login si apre sempre la Dashboard; dopo, deve aprirsi l'ultima sezione usata." },
      { id: 'vincoli', nome: 'Cosa non deve cambiare', facoltativo: true, esempio: "Il flusso di accesso resta com'è: cambia solo cosa si apre dopo il login." },
      { id: 'note', nome: 'Note', aiuto: 'vincoli, dubbi, esempi', facoltativo: true, esempio: "Il backend è già pronto su beta; non so se va gestito anche il caso senza rete." },
    ],
    spunte: [
      { id: 'frase', nome: 'So dire in una frase cosa cambia per chi usa l\'app' },
      { id: 'invariato', nome: 'So cosa NON deve cambiare' },
    ],
  },
  {
    id: 'bug', nome: 'Bug', soloBug: true,
    campi: [
      { id: 'problema', facoltativo: true, nome: 'Problema', aiuto: 'cosa succede invece, su quale piattaforma o dispositivo', esempio: "Su Android 14 il messaggio resta grigio con l'orologio e compare solo riaprendo la chat; su iOS va." },
      { id: 'ambiente', nome: 'Dove lo provi', aiuto: 'dispositivo, sistema, account e dati usati', facoltativo: true, esempio: "Pixel 7, Android 14, account di test." },
      { id: 'passi', nome: 'Passi per riprodurlo', aiuto: 'un passo per riga', facoltativo: true, esempio: "1. apro una chat · 2. spengo il Wi-Fi · 3. invio un messaggio · 4. riaccendo il Wi-Fi." },
      { id: 'quando', nome: 'Quando succede', aiuto: 'sempre, a volte, solo in certi casi', facoltativo: true, esempio: "Sempre al primo invio dopo che la rete torna; dal secondo invio in poi no." },
      { id: 'dove', facoltativo: true, nome: 'Dove pensi che sia', aiuto: 'file e funzione', esempio: "chatService.js, funzione sendMessage, oppure la riconnessione in SocketManager.jsx." },
      { id: 'ipotesi', facoltativo: true, nome: 'La tua ipotesi sulla causa', aiuto: 'perché secondo te succede', esempio: "Quando la rete torna il socket si ricollega, ma il messaggio rimasto in coda non viene rimandato." },
      { id: 'verificato', facoltativo: true, nome: 'Cosa hai verificato', aiuto: 'log, breakpoint, prove fatte e cosa ti hanno detto', esempio: "Con un console.log in sendMessage ho visto che la chiamata parte, ma in quel momento il socket è \"disconnected\"." },
    ],
    spunte: [
      { id: 'nonBug', nome: 'Non è un bug' },
      { id: 'riprodotto', nome: 'L\'ho riprodotto almeno una volta' },
      { id: 'sparito', nome: 'Il bug non si riproduce più' },
    ],
  },
  {
    id: 'indagare', nome: 'Indagare',
    campi: [
      { id: 'come', nome: 'Come funziona adesso', aiuto: 'con parole tue, scritto a testo', esempio: "L'utente preme Accedi, l'app chiama /auth/login e, se va bene, apre sempre la Dashboard." },
      { id: 'zone', nome: 'Zone interessate', aiuto: 'a parole, quali zone dell\'app sono interessate', esempio: "La schermata di accesso, il salvataggio della sessione e la navigazione che si apre subito dopo il login." },
    ],
    spunte: [
      { id: 'provato', nome: 'L\'ho provato di persona com\'è adesso' },
      { id: 'letto', nome: 'Ho letto il codice intorno, non solo il punto che mi interessa' },
      { id: 'cercato', nome: 'Ho cercato se nel progetto esiste già qualcosa di simile' },
    ],
  },
  {
    id: 'progettare', nome: 'Progettare',
    campi: [
      { id: 'modifica', nome: 'La modifica a parole', aiuto: 'cosa cambi, senza scrivere codice', esempio: "Dopo il login leggo l'ultima sezione salvata e, se c'è, apro quella invece della Dashboard." },
      { id: 'alternative', nome: 'Alternative scartate e perché', aiuto: "un'altra strada possibile e perché non la scegli, oppure perché non ce ne sono", esempio: "Salvarla nel backend: scartata, serve solo su questo dispositivo e richiederebbe una API nuova." },
    ],
    spunte: [
      { id: 'minima', nome: 'È la modifica più piccola che fa quello che serve' },
      { id: 'convenzioni', nome: 'Rispetta nomi, cartelle e struttura del progetto' },
    ],
  },
  {
    id: 'codice', nome: 'Codice',
    campi: [
      { id: 'chiamate', nome: 'Chiamate al backend', facoltativo: true, chiamate: true },
      { id: 'file', nome: 'File', facoltativo: true, elencoFile: true },
    ],
    spunte: [],
  },
  {
    id: 'rischi', nome: 'Rischi',
    campi: [
      { id: 'limite', nome: 'Casi limite', facoltativo: true, soloPulsanti: true, aiuto: 'scegli cosa deve succedere in ogni situazione che riguarda la tua modifica', esempio: "Sezione salvata che non esiste più (es. \"Gestione utenti\" per chi non è ADMG); primo accesso senza nulla di salvato." },
      { id: 'sicurezza', nome: 'Sicurezza e dati', facoltativo: true, opzioneVuoto: { nome: 'Non salvo dati', testo: 'Nessun dato salvato' }, aiuto: 'quali dati salvi, dove e chi li legge', esempio: "Salvo solo il nome della sezione, niente token né dati dell'utente; al logout lo cancello." },
    ],
    spunte: [
      { id: 'chiamanti', nome: 'Ho controllato chi altro usa quello che cambio' },
      { id: 'errori', nome: 'Ho pensato a cosa succede quando qualcosa va storto' },
    ],
  },
  {
    id: 'verifica', nome: 'Verifica',
    campi: [
      { id: 'prova', nome: 'Come provi che funziona', aiuto: 'passi manuali o test automatici', esempio: "Login, vado in Agenda, chiudo l'app e rientro: si apre Agenda. Poi lo stesso con un utente non ADMG." },
      { id: 'finito', nome: 'Quando è davvero finito', aiuto: 'criteri concreti, non "quando sembra andare"', esempio: "Va su Android e iOS, il primo accesso apre la Dashboard, il logout cancella la sezione salvata." },
    ],
    spunte: [
      { id: 'richiesto', nome: 'Fa quello che chiedeva la Richiesta' },
      { id: 'resto', nome: 'Le parti collegate funzionano ancora' },
    ],
  },
];

// GUIDA ALLA SCRITTURA
// Per ogni campo dei piani: forma del testo (elenco puntato, passi numerati o traccia da completare),
// come scriverlo e quali controlli fa la pagina mentre scrivi. I controlli sono locali: non costano token.
// forma: "elenco" (•) o "passi" (1. 2. …); traccia: testo di partenza da completare;
// controlli: "vago" (parole come "sistemo", "non va"), "file" (serve un file o una funzione), "breve" (troppo corto)
const GUIDA_CAMPI = {
  'richiesta.obiettivo': { guida: ['Cosa potrà fare chi usa l\'app dopo la modifica, che oggi non può fare. Per un bug: cosa dovrebbe succedere.'], controlli: ['vago', 'breve'] },
  'richiesta.cambia': { traccia: 'Oggi: \nDopo: ', guida: ['Cosa succede oggi e cosa deve succedere dopo, visto da chi usa l\'app.'], controlli: ['vago'] },
  'bug.problema': { traccia: 'Cosa succede: \nDispositivo e piattaforma: \nDa quando (se lo sai): ', guida: ['Cosa vedi succedere e su quale dispositivo, non la causa che immagini.'], controlli: ['vago'] },
  'richiesta.vincoli': { guida: ['Ciò che deve restare com\'è, una cosa per riga.'] },
  'richiesta.note': { guida: ['Vincoli, dubbi o esempi; va bene anche ciò che non sai.'] },
  'indagare.come': { guida: ['Come funziona adesso, scritto a parole, in modo che si capisca anche senza il codice davanti.'], controlli: ['breve'] },
  'indagare.zone': { guida: ['Spiega a parole quali zone dell\'app (schermate, flussi, servizi) sono interessate e perché.'], controlli: ['vago', 'breve'] },
  'bug.ambiente': { guida: ['Dispositivo, sistema, account e dati usati per provarlo.'] },
  'bug.passi': { forma: 'passi', guida: ['Cosa tocchi o digiti, un passo per riga, fino a vedere il problema.'] },
  'bug.quando': { guida: ['Se succede sempre, a volte o solo in certi casi.'], controlli: ['vago'] },
  'bug.dove': { guida: ['File e funzione dove pensi sia il problema, dal più probabile.'], controlli: ['file'] },
  'bug.ipotesi': { guida: ['Perché secondo te succede, in una frase che puoi verificare.'], controlli: ['vago'] },
  'bug.verificato': { guida: ['Le prove fatte e cosa hanno mostrato, una per riga.'] },
  'progettare.modifica': { guida: ['Cosa cambi, a parole, senza scrivere codice.'], controlli: ['vago', 'breve'] },
  'codice.chiamate': { guida: ['Vuoto = il piano non coinvolge il backend. Con + aggiungi una chiamata: NUOVA (il backend deve crearla), MODIFICA (cambia: prima e dopo) o ESISTENTE (c\'è già e la usi così com\'è).'] },
  'codice.file': { guida: ['Vuoto = nessun file coinvolto. Con + aggiungi un file: NUOVO (lo crei tu), MODIFICA (esiste e cambia) o ESISTENTE (esiste e lo usi così com\'è). Dentro ogni file, con + aggiungi le funzioni che ti interessano.'] },
  'progettare.alternative': {
    traccia: 'Alternativa 1: \nPerché la scarto: ',
    tutte: true,
    guida: ['Un\'altra strada possibile e perché non la scegli; se non ce ne sono scrivi "Unica strada:" e il motivo.'],
  },
  'rischi.limite': {
    traccia: 'Valore vuoto o mancante: \nErrore di rete o del server: \nUtente senza permessi o con ruolo diverso: \nDoppio tocco o azione ripetuta: \nApp messa in background o chiusa a metà: ',
    guida: ['Per ogni situazione scegli cosa deve succedere; salta quelle che non c\'entrano con la tua modifica.'],
  },
  'rischi.sicurezza': {
    traccia: 'Cosa salvo e dove: \nChi può leggerlo: \nCosa resta dopo il logout: ',
    guida: ['Se non salvi niente premi «Non salvo dati»; altrimenti scrivi cosa salvi e dove, chi può leggerlo e cosa resta dopo il logout.'],
  },
  'verifica.prova': { forma: 'passi', guida: ['I passi per provare che funziona, con cosa devi vedere alla fine.'] },
  'verifica.finito': { guida: ['I criteri per dire "finito", ciascuno controllabile con un sì o un no.'], controlli: ['vago'] },
};
// RIPRENDI DA
// Un campo si può partire dal testo già scritto in un altro: il tasto compare solo a campo vuoto e con la fonte compilata
const RIPRENDI_DA = {
};

// STRUMENTI DEI CAMPI
// Cosa può fare la pagina per te invece di chiederti di scrivere a memoria:
// codice = VEDI NEL CODICE (cerca il nome nel progetto e apre VS Code), riempi = mette i file trovati nel campo,
// diagramma = VEDI NEL DIAGRAMMA (apre la mappa sul passo D/S citato), domanda = CHIEDI A CHATTINO (domanda già scritta, la invii tu),
// scelte = risposte rapide a pulsante per le righe del campo
const CASI_LIMITE = [
  ['Valore vuoto o mancante', ['non succede nulla', 'mostra un errore', 'usa un valore di default']],
  ['Errore di rete o del server', ['mostra un errore', 'riprova da solo', 'non succede nulla']],
  ['Utente senza permessi o con ruolo diverso', ['non vede la funzione', 'riceve un errore', 'si comporta come prima']],
  ['Doppio tocco o azione ripetuta', ['la seconda viene ignorata', 'si ripete due volte']],
  ['App messa in background o chiusa a metà', ['riprende da dove era', 'riparte da zero']],
].map(([titolo, opzioni]) => ({ titolo, opzioni: [...opzioni, 'non applicabile', 'da provare'] }));

const STRUMENTI_CAMPI = {
  'indagare.zone': { codice: true, diagramma: true, domanda: 'Quali zone dell\'app sono interessate dal comportamento di questo piano? Spiegamelo a parole, senza elenchi. Cerca nel codice.' },
  'indagare.come': { diagramma: true },
  'bug.dove': { codice: true },
  'codice.chiamate': { domanda: 'Per la modifica di questo piano: quali chiamate al backend servono? Una riga per chiamata: NUOVA, MODIFICA (prima e dopo) o ESISTENTE, con metodo, rotta, body o params e cosa fa. Se non ne servono dimmelo.' },
  'codice.file': { codice: true },
  'progettare.alternative': { domanda: 'Che alternative ha la modifica di questo piano? Massimo 3, ognuna con "Perché la scarto". Dimmi quale consiglieresti.' },
  'rischi.limite': { scelte: CASI_LIMITE, domanda: 'Per la modifica di questo piano: cosa succede oggi, nel codice, con valore vuoto, errore di rete, ruolo diverso, doppio tocco, app in background? Una riga per caso.' },
  'rischi.sicurezza': {
    scelte: [
      { titolo: 'Cosa salvo e dove', opzioni: ['solo in memoria', 'AsyncStorage', 'Keychain', 'backend'] },
      { titolo: 'Chi può leggerlo', opzioni: ['solo l\'utente', 'anche il backend', 'altri utenti', 'nessuno'] },
      { titolo: 'Cosa resta dopo il logout', opzioni: ['niente (viene cancellato)', 'resta sul telefono', 'da verificare'] },
    ],
    domanda: 'La modifica di questo piano salva dati? Cosa, dove (memoria, AsyncStorage, Keychain, backend), chi può leggerli e cosa resta dopo il logout?',
  },
};

FASI_PIANO.forEach((f) => f.campi.forEach((c) => Object.assign(c, GUIDA_CAMPI[`${f.id}.${c.id}`], STRUMENTI_CAMPI[`${f.id}.${c.id}`], RIPRENDI_DA[`${f.id}.${c.id}`] ? { riprendi: RIPRENDI_DA[`${f.id}.${c.id}`] } : {})));

// PIANI
function pianoVuoto() {
  return Object.fromEntries(FASI_PIANO.map((f) => [f.id, {
    campi: Object.fromEntries(f.campi.map((c) => [c.id, ''])),
    spunte: Object.fromEntries(f.spunte.map((s) => [s.id, false])),
  }]));
}

// MESSAGGI BACKEND
// Una lista di blocchi { id, testo, data }: ognuno si aggiunge e si elimina da solo.
// Il vecchio testo unico diventa il blocco "primo": un id fisso, perché questa conversione si ripete a ogni lettura finché non si salva
const blocchiBackend = (valore, data) => {
  if (Array.isArray(valore)) return valore.filter((b) => b && typeof b.testo === 'string' && b.testo.trim() && typeof b.id === 'string');
  return typeof valore === 'string' && valore.trim() ? [{ id: 'primo', testo: valore.trim(), data: data || Date.now() }] : [];
};

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

// Le due modifiche valgono sia per i piani sia per le attività
function conBlocco(dati) {
  const blocco = testo(dati.testo, 20000);
  if (!blocco) throw errore(400, 'il messaggio è vuoto');
  return (blocchi) => {
    if (blocchi.length >= 100) throw errore(400, 'troppi messaggi');
    return [...blocchi, { id: crypto.randomUUID(), testo: blocco, data: Date.now() }];
  };
}

const senzaBlocco = (dati) => (blocchi) => {
  if (!blocchi.some((b) => b.id === dati.blocco)) throw errore(404, 'messaggio non trovato');
  return blocchi.filter((b) => b.id !== dati.blocco);
};

const aggiungiBackend = (dati) => cambiaBackend(dati, conBlocco(dati));
const eliminaBackend = (dati) => cambiaBackend(dati, senzaBlocco(dati));

function cambiaBackendAttivita(dati, cambia) {
  const lista = leggiJson(FILE_ATTIVITA);
  const attivita = lista.find((a) => a.id === dati.id);
  if (!attivita) throw errore(404, 'attività non trovata');
  attivita.backend = cambia(blocchiBackend(attivita.backend, attivita.aggiornata));
  attivita.aggiornata = Date.now();
  scriviJson(FILE_ATTIVITA, lista);
  return { backend: attivita.backend };
}

// I piani salvati prima di una fase o di un campo nuovo ricevono le parti mancanti vuote
function completaPiano(piano) {
  const vuoto = pianoVuoto();
  const fasi = Object.fromEntries(FASI_PIANO.map((f) => [f.id, {
    campi: { ...vuoto[f.id].campi, ...piano.fasi?.[f.id]?.campi },
    spunte: { ...vuoto[f.id].spunte, ...piano.fasi?.[f.id]?.spunte },
  }]));
  // I piani nati con i tipi: il comportamento atteso o "cosa cambiare" diventano l'Obiettivo
  const vecchi = piano.fasi || {};
  const vecchiRichiesta = vecchi.richiesta?.campi || {};
  if (!String(fasi.richiesta.campi.obiettivo || '').trim()) fasi.richiesta.campi.obiettivo = vecchiRichiesta.atteso || vecchiRichiesta.cosa || '';
  // I campi solo bug stavano in Richiesta, Com'è oggi, Indagare e Riprodurre: ora sono tutti nella fase Bug
  const doveStavano = { problema: ['richiesta'], ambiente: ['oggi', 'riprodurre'], passi: ['oggi', 'riprodurre'], quando: ['oggi', 'riprodurre'], dove: ['indagare'], ipotesi: ['indagare'], verificato: ['indagare'] };
  for (const [id, fasiVecchie] of Object.entries(doveStavano)) {
    if (String(fasi.bug.campi[id] || '').trim()) continue;
    const fase = fasiVecchie.find((f) => String(vecchi[f]?.campi?.[id] || '').trim());
    fasi.bug.campi[id] = fase ? vecchi[fase].campi[id] : '';
  }
  // Com'è oggi e Indagare sono confluite in Indagare: Come funziona adesso e Zone interessate
  const oggi = vecchi.oggi?.campi || {};
  const indagare = vecchi.indagare?.campi || {};
  if (!String(fasi.indagare.campi.come || '').trim()) fasi.indagare.campi.come = oggi.come || '';
  if (!String(fasi.indagare.campi.zone || '').trim()) fasi.indagare.campi.zone = [indagare.file, oggi.chi, indagare.posizione, indagare.dipendenze].filter((x) => String(x || '').trim()).join('\n');
  const { branch, tipo, ...resto } = piano;
  return {
    ...resto,
    mappa: MAPPE_PIANO.includes(piano.mappa) ? piano.mappa : '',
    mappe: Array.isArray(piano.mappe) ? piano.mappe : [],
    backend: blocchiBackend(piano.backend, piano.aggiornato),
    terminato: piano.terminato === true,
    terminatoIl: piano.terminato === true && Number.isFinite(piano.terminatoIl) ? piano.terminatoIl : null,
    // Come le attività: da fare, in corso, fatto. "Fatto" coincide con terminato
    stato: piano.terminato === true ? 'fatto' : ['da-fare', 'in-corso'].includes(piano.stato) ? piano.stato : 'da-fare',
    fasi,
  };
}

// LEZIONI
// Si generano solo a quiz superato (quiz-lezione.js), da Chattino insegnante o dal piano da terminare, e stanno in dati/lezioni.json.
// ~/Lezioni.md si riscrive da solo a ogni cambiamento, le più recenti in alto: è generato, non va modificato a mano
const ORIGINI_LEZIONE = ['chattino', 'piano'];
const giorno = (ms) => new Date(ms).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
const NOMI_ORIGINE_LEZIONE = { chattino: 'Chattino', piano: 'Piano', lezione: 'Lezione' };

function elencoLezioni() {
  return leggiJson(FILE_LEZIONI).filter((l) => l && l.titolo).map((l) => ({
    id: l.id, origine: ORIGINI_LEZIONE.includes(l.origine) ? l.origine : 'lezione', data: l.data, progetto: l.progetto || '', titolo: l.titolo,
    parti: [['Argomento', l.argomento], ['', l.testo]].filter(([, v]) => String(v || '').trim()),
  })).sort((a, b) => b.data - a.data);
}

function scriviLezioni() {
  const blocchi = elencoLezioni().map((l) => [
    `## ${giorno(l.data)} · ${NOMI_ORIGINE_LEZIONE[l.origine]}: ${l.titolo}${l.progetto ? ` (${l.progetto})` : ''}`,
    '',
    ...l.parti.map(([nome, valore]) => (nome ? `**${nome}**\n\n${String(valore).trim()}\n` : `${String(valore).trim()}\n`)),
  ].join('\n'));
  const md = [
    '# Lezioni',
    '',
    '> Generato dalla sala di controllo (sezione Lezioni), le più recenti in alto. Non modificarlo a mano: si riscrive da solo.',
    '',
    blocchi.length ? blocchi.join('\n---\n\n') : '_Ancora nessuna lezione._\n',
  ].join('\n');
  const temporaneo = `${FILE_LEZIONI_MD}.tmp`;
  fs.writeFileSync(temporaneo, md);
  fs.renameSync(temporaneo, FILE_LEZIONI_MD);
}

// Una lezione di piano sostituisce la precedente dello stesso piano: succede se lo riapri e lo termini di nuovo
function aggiungiLezione(dati) {
  const titolo = testo(dati?.titolo, 200);
  if (!titolo) throw errore(400, 'il titolo della lezione è obbligatorio');
  if (!ORIGINI_LEZIONE.includes(dati.origine)) throw errore(400, 'origine della lezione non valida');
  const lezione = {
    id: crypto.randomUUID(), data: Date.now(), origine: dati.origine, titolo, argomento: testo(dati.argomento, 1000),
    progetto: testo(dati.progetto, 200), testo: testo(dati.testo, 20000), ...(dati.piano ? { piano: dati.piano } : {}),
  };
  const altre = leggiJson(FILE_LEZIONI).filter((l) => !lezione.piano || l.piano !== lezione.piano);
  scriviJson(FILE_LEZIONI, [...altre, lezione]);
  scriviLezioni();
  return lezione;
}

function eliminaLezione(id) {
  const lista = leggiJson(FILE_LEZIONI);
  if (!lista.some((l) => l.id === id)) throw errore(404, 'lezione non trovata');
  scriviJson(FILE_LEZIONI, lista.filter((l) => l.id !== id));
  scriviLezioni();
  return { eliminata: id };
}

// CONTESTI
// Il passaggio tra una chat e la successiva: /chat-termina lo salva (dati/contesti.json), /chat-riprendi lo rilegge
const CAMPI_CONTESTO = { obiettivo: 3000, fatto: 3000, file: 3000, decisioni: 3000, prossimo: 3000 };

function aggiungiContesto(dati) {
  const titolo = testo(dati?.titolo, 200);
  if (!titolo) throw errore(400, 'il titolo del contesto è obbligatorio');
  const contesto = {
    id: crypto.randomUUID(), data: Date.now(), progetto: testo(dati.progetto, 200), titolo,
    ...Object.fromEntries(Object.entries(CAMPI_CONTESTO).map(([c, massimo]) => [c, testo(dati[c], massimo)])),
  };
  scriviJson(FILE_CONTESTI, [...leggiJson(FILE_CONTESTI), contesto]);
  return contesto;
}

function eliminaContesto(id) {
  const lista = leggiJson(FILE_CONTESTI);
  if (!lista.some((c) => c.id === id)) throw errore(404, 'contesto non trovato');
  scriviJson(FILE_CONTESTI, lista.filter((c) => c.id !== id));
  return { eliminato: id };
}

const contestiDi = (progetto) => leggiJson(FILE_CONTESTI).filter((c) => !progetto || c.progetto === progetto).sort((a, b) => b.data - a.data);

// Il testo che /chat-riprendi legge: stessi campi che scrive /chat-termina
const testoContesto = (c) => [
  `CONTESTO: ${c.titolo} (${c.progetto || 'nessun progetto'}, ${giorno(c.data)})`,
  ...[['OBIETTIVO', c.obiettivo], ['FATTO', c.fatto], ['FILE TOCCATI', c.file], ['DECISIONI', c.decisioni], ['PROSSIMO PASSO', c.prossimo]]
    .filter(([, v]) => v).map(([nome, v]) => `${nome}:\n${v}`),
].join('\n\n');

// La pagina vede se il file di ogni mappa collegata esiste ancora e se ne sta generando una
const piani = (prog) => leggiJson(FILE_PIANI).filter((p) => p.progetto === prog.nome).map(completaPiano)
  .map((p) => ({
    ...p,
    mappe: p.mappe.map((m) => ({ ...m, esiste: Boolean(fileMappa(m.file)) })),
    generazione: generazioni.get(p.id) || null,
    generazioneSintesi: generazioniSintesi.get(p.id) || null,
  }));

// MAPPE DEI PIANI
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
const barre = (p) => p.split(path.sep).join('/');

// Il percorso dell'eseguibile dell'estensione VS Code cambia a ogni aggiornamento (stessa ricerca del server della chat)
function trovaClaude() {
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

// AVVIO CLAUDE
// claude -p nella cartella del progetto, senza sessione salvata né server MCP; risolve con il testo della risposta
// e registra i token usati sotto il nome della funzione
function avviaClaude(prog, strumenti, prompt, timeout, funzione) {
  return new Promise((resolve, reject) => {
    const args = [
      '-p', '--output-format', 'json', '--no-session-persistence', '--restricted', '--strict-mcp-config',
      ...strumenti,
      '--permission-mode', 'dontAsk',
    ];
    // Senza chiavi API nell'ambiente claude può usare solo il login dell'abbonamento, mai la fatturazione a consumo
    const { ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, ...ambiente } = process.env;
    const figlio = spawn(trovaClaude(), args, { cwd: prog.cartella, windowsHide: true, env: ambiente });
    let out = '';
    let err = '';
    const timer = setTimeout(() => figlio.kill(), timeout);
    figlio.stdout.on('data', (d) => { out += d; });
    figlio.stderr.on('data', (d) => { err += d; });
    figlio.on('error', (e) => {
      clearTimeout(timer);
      reject(new Error(`claude non avviato: ${e.message}`));
    });
    figlio.on('close', () => {
      clearTimeout(timer);
      try {
        resolve(risultatoClaude(out, err, funzione));
      } catch (e) {
        reject(e);
      }
    });
    figlio.stdin.end(prompt);
  });
}

// Anche una risposta in errore ha consumato token: si registra prima di controllare l'esito
function risultatoClaude(out, err, funzione) {
  let risultato;
  try {
    risultato = JSON.parse(out);
  } catch {
    throw new Error((err || out || 'nessuna risposta (tempo scaduto?)').trim().slice(0, 500));
  }
  consumi.registra(funzione, risultato);
  if (risultato.is_error) throw new Error(risultato.result || 'errore di claude');
  return String(risultato.result || '');
}

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

// Da un'attività: se ha un problema scritto è un bug fix, altrimenti un'aggiunta; il tipo si cambia dopo
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

// Si accettano solo il tipo, le fasi, i campi e le spunte previsti qui sopra; i campi nascosti dal tipo restano salvati
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

const quiz = require('./quiz-lezione')({
  avviaClaude, testo, materialePiano, salvaLezione: aggiungiLezione, terminaPiano,
  archivio: { leggi: () => leggiJson(FILE_QUIZ), scrivi: (lista) => scriviJson(FILE_QUIZ, lista) },
});

const senzaFile = (sessioni) => sessioni.map(({ file, ...s }) => s);

const AZIONI = {
  '/api/progetti': () => progetti().map(({ nome, cartella }) => ({ nome, cartella })),
  '/api/progetti/scegli': () => scegliCartella(),
  '/api/progetti/aggiungi': (d) => aggiungiDaPagina(d.cartella),
  '/api/progetti/rimuovi': (d) => rimuoviProgetto(d.nome),
  '/api/sessioni': (d) => senzaFile(elencoSessioni(progetto(d))),
  '/api/sessioni/elimina': (d) => eliminaSessione(progetto(d), d.id),
  '/api/sessioni/chiudi': (d) => chiudiSessione(progetto(d), d.id),
  '/api/sessioni/archivia': (d) => archiviaSessione(progetto(d), d.id, d.archivia === true),
  '/api/branch': (d) => elencoBranch(progetto(d)),
  '/api/branch/cambia': (d) => cambiaBranch(progetto(d), d.nome),
  '/api/branch/crea': (d) => creaBranch(progetto(d), d.nome),
  '/api/branch/elimina': (d) => eliminaBranch(progetto(d), d.nome, d.forza === true),
  '/api/branch/commit': (d) => commitBranch(progetto(d), d.nome),
  '/api/branch/committa': (d) => committaTutto(progetto(d), d.messaggio),
  '/api/branch/torna': (d) => tornaACommit(progetto(d), d.hash),
  '/api/attivita': (d) => leggiJson(FILE_ATTIVITA).filter((a) => a.progetto === progetto(d).nome)
    .map((a) => ({ ...a, backend: blocchiBackend(a.backend, a.aggiornata) })),
  '/api/attivita/backend/aggiungi': (d) => cambiaBackendAttivita(d, conBlocco(d)),
  '/api/attivita/backend/elimina': (d) => cambiaBackendAttivita(d, senzaBlocco(d)),
  '/api/attivita/crea': (d) => creaAttivita(progetto(d), d),
  '/api/attivita/aggiorna': (d) => aggiornaAttivita(d),
  '/api/attivita/elimina': (d) => eliminaAttivita(d),
  '/api/attivita/riordina': (d) => riordinaAttivita(progetto(d), d.ids),
  '/api/piani': (d) => ({ fasi: FASI_PIANO, piani: piani(progetto(d)) }),
  '/api/piani/crea': (d) => creaPiano(progetto(d), d),
  '/api/piani/aggiorna': (d) => aggiornaPiano(d),
  '/api/piani/elimina': (d) => eliminaPiano(d),
  '/api/piani/genera-mappa': (d) => generaMappa(progetto(d), d),
  '/api/piani/genera-sintesi': (d) => generaSintesi(progetto(d), d),
  '/api/piani/compila': (d) => compilaRichiesta(progetto(d), d),
  '/api/consumi': () => consumi.oggi(),
  '/api/piani/backend/aggiungi': (d) => aggiungiBackend(d),
  '/api/piani/backend/elimina': (d) => eliminaBackend(d),
  '/api/contesti': (d) => contestiDi(progetto(d).nome),
  '/api/contesti/elimina': (d) => eliminaContesto(d.id),
  '/api/lezioni': () => ({ lezioni: elencoLezioni(), file: barre(FILE_LEZIONI_MD) }),
  '/api/lezioni/elimina': (d) => eliminaLezione(d.id),
  '/api/quiz/avvia': (d) => quiz.avvia(progetto(d), d),
  '/api/quiz/rispondi': (d) => quiz.rispondi(progetto(d), d),
  '/api/quiz/elenco': (d) => quiz.elenco(progetto(d)),
  '/api/quiz/riprendi': (d) => quiz.riprendi(progetto(d), d),
  '/api/quiz/elimina': (d) => quiz.elimina(progetto(d), d),
  '/api/codice/albero': (d) => letturaCodice.albero(progetto(d)),
  '/api/codice/file': (d) => letturaCodice.file(progetto(d), d.percorso),
  '/api/codice/importato-da': (d) => letturaCodice.importatoDa(progetto(d), d.percorso),
  '/api/codice/cerca': (d) => letturaCodice.cerca(progetto(d), d.testo),
  '/api/codice/segui': (d) => letturaCodice.segui(progetto(d), d.percorso, Number(d.inizio), Number(d.fine)),
  '/api/funzionalita': (d) => catalogo.elenco(progetto(d)),
  '/api/funzionalita/stato': (d) => catalogo.stato(progetto(d)),
  '/api/funzionalita/crea': (d) => catalogo.crea(progetto(d)),
  '/api/funzionalita/assegna-nuovi': (d) => catalogo.assegnaNuovi(progetto(d)),
  '/api/funzionalita/apri': (d) => catalogo.apri(progetto(d), String(d.id || '')),
  '/api/funzionalita/correlate': (d) => catalogo.correlate(progetto(d), String(d.percorso || ''), Number(d.inizio), Number(d.fine)),
};

function rispondi(res, status, corpo) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(corpo));
}

function leggiCorpo(req) {
  return new Promise((resolve, reject) => {
    let corpo = '';
    req.on('data', (d) => {
      corpo += d;
      if (corpo.length > MAX_BODY) {
        reject(errore(413, 'richiesta troppo grande'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(corpo ? JSON.parse(corpo) : {});
      } catch {
        reject(errore(400, 'JSON non valido'));
      }
    });
  });
}

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

// PROGETTO CORRENTE
// La radice della repo git della cartella da cui si lancia: se non è tra i progetti, si aggiunge con il nome della cartella
function progettoCorrente() {
  const radice = radiceGit(process.cwd());
  if (!radice) return null;
  preparaDati();
  return registraProgetto(radice);
}

function radiceGit(cartella) {
  try {
    const radice = require('child_process').execFileSync('git', [...GIT_SICURO, 'rev-parse', '--show-toplevel'], { cwd: cartella, stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }).toString().trim();
    return radice || null;
  } catch {
    return null;
  }
}

function registraProgetto(radice) {
  const lista = leggiJson(FILE_PROGETTI);
  const esistente = lista.find((p) => p && typeof p.cartella === 'string' && stessaCartella(p.cartella, radice));
  if (esistente) return esistente;
  const base = path.basename(radice);
  let nome = base;
  for (let n = 2; lista.some((p) => p?.nome === nome); n++) nome = `${base}-${n}`;
  const nuovo = { nome, cartella: radice };
  scriviJson(FILE_PROGETTI, [...lista, nuovo]);
  console.log(`Progetto aggiunto alla sala: ${nome} (${radice})`);
  return nuovo;
}

// TERMINALE AUTOMATICO
// Copia nel progetto il task di VS Code che apre il terminale "Sala di controllo"; git non lo vede, senza toccare il .gitignore
function aggiungiProgetto() {
  const prog = progettoCorrente();
  if (!prog) {
    console.error('errore: lancialo da dentro la cartella di un progetto git');
    process.exitCode = 1;
    return;
  }
  const destinazione = path.join(prog.cartella, '.vscode', 'tasks.json');
  if (fs.existsSync(destinazione)) {
    console.log(`${destinazione} esiste già: non lo tocco. Se non ha il task "Sala di controllo", copialo da ${FILE_TASK}`);
  } else {
    fs.mkdirSync(path.dirname(destinazione), { recursive: true });
    fs.copyFileSync(FILE_TASK, destinazione);
    console.log(`Creato ${destinazione}`);
  }
  let ignorato = false;
  try {
    require('child_process').execFileSync('git', ['check-ignore', '-q', '.vscode/tasks.json'], { cwd: prog.cartella, stdio: 'ignore', windowsHide: true });
    ignorato = true;
  } catch {}
  if (!ignorato) {
    const exclude = path.join(prog.cartella, '.git', 'info', 'exclude');
    fs.mkdirSync(path.dirname(exclude), { recursive: true });
    fs.appendFileSync(exclude, '\n.vscode/tasks.json\n');
    console.log('Aggiunto .vscode/tasks.json a .git/info/exclude: non finirà nei commit');
  }
  console.log('Ricarica VS Code: in basso, tra i terminali, compare "Sala di controllo".');
}

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
    spawn(process.execPath, [__filename], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
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

const comando = process.argv[2];
if (comando === '--terminale') attendiTasti();
else if (comando === '--piani') pianiDaTerminale(process.argv.slice(3));
else if (comando === '--attivita') attivitaDaTerminale(process.argv.slice(3));
else if (comando === '--contesto') contestoDaTerminale(process.argv.slice(3));
else if (comando === '--lezioni') lezioniDaTerminale(process.argv[3]);
else if (comando === '--sfondo') avviaInSfondo(false);
else if (comando === '--apri') avviaInSfondo(true);
else if (comando === '--aggiungi') aggiungiProgetto();
else if (comando === '--ferma') ferma();
else avvia();
