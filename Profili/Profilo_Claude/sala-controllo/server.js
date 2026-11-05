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
const CARTELLA_MAPPE = path.join(os.homedir(), 'flussi');
const FILE_PAGINA = path.join(__dirname, 'pagina.html');
const FILE_TASK = path.join(__dirname, 'tasks.json');
const SERVER_CHAT = 'http://127.0.0.1:4517';
const FILE_GETTONE_CHAT = path.join(CARTELLA_CLAUDE, 'chat-mappa-token');
const FILE_SERVER_CHAT = path.join(CARTELLA_CLAUDE, 'shared', 'chat-mappa-server.js');
const MAX_BODY = 64 * 1024;
const ATTIVA_DA_MS = 2 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const STATI_ATTIVITA = ['da-fare', 'in-corso', 'fatto'];
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
// execFile senza shell: gli argomenti arrivano a git così come sono, senza poter diventare altri comandi
function git(cartella, args) {
  return new Promise((resolve, reject) => {
    execFile('git', ['-C', cartella, ...args], { windowsHide: true, timeout: 15000, maxBuffer: 4 * 1024 * 1024 }, (e, out, err) => {
      if (e) reject(errore(500, (err || e.message).trim()));
      else resolve(out);
    });
  });
}

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
    stato: 'da-fare', ordine: ordini.length ? Math.min(...ordini) - 1 : 0, creata: adesso, aggiornata: adesso,
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

// TIPI E FASI DEI PIANI
// Il ragionamento che un senior fa prima di scrivere codice, diverso per ogni tipo di lavoro: la pagina disegna i campi da qui.
// tipi dice in quali tipi compare una fase, un campo o una spunta (assente = in tutti); i campi facoltativi non bloccano la fase
const TIPI_PIANO = [
  { id: 'aggiunta', nome: 'Aggiunta' },
  { id: 'modifica', nome: 'Modifica' },
  { id: 'bug', nome: 'Bug fix' },
  { id: 'minore', nome: 'Modifica minore' },
];
const GRANDI = ['aggiunta', 'modifica', 'bug'];
const MAPPE_PIANO = ['dati', 'struttura', 'entrambi', 'nessuna'];

const FASI_PIANO = [
  {
    id: 'richiesta', nome: 'Richiesta',
    campi: [
      { id: 'obiettivo', nome: 'Obiettivo', aiuto: 'cosa vuoi ottenere, visto da chi usa l\'app', tipi: ['aggiunta', 'modifica'] },
      { id: 'cambia', nome: 'Cosa deve cambiare rispetto a oggi', aiuto: 'prima succede questo, dopo deve succedere quest\'altro', tipi: ['modifica'] },
      { id: 'atteso', nome: 'Comportamento atteso', aiuto: 'cosa dovrebbe succedere', tipi: ['bug'] },
      { id: 'problema', nome: 'Problema', aiuto: 'cosa succede invece, su quale piattaforma o dispositivo', tipi: ['bug'] },
      { id: 'cosa', nome: 'Cosa cambiare', aiuto: 'testo, colore, dimensione, posizione, formattazione', tipi: ['minore'] },
      { id: 'dove', nome: 'Dove', aiuto: 'pagina, flusso o file' },
      { id: 'valore', nome: 'Valore nuovo', aiuto: 'il valore finale (vuoto: lo scegli guardando il resto del progetto)', tipi: ['minore'], facoltativo: true },
      { id: 'vincoli', nome: 'Cosa non deve cambiare', tipi: ['minore'], facoltativo: true },
      { id: 'note', nome: 'Note', aiuto: 'vincoli, dubbi, esempi', tipi: GRANDI, facoltativo: true },
    ],
    spunte: [
      { id: 'frase', nome: 'So dire in una frase cosa cambia per chi usa l\'app', tipi: GRANDI },
      { id: 'invariato', nome: 'So cosa NON deve cambiare', tipi: GRANDI },
      { id: 'elemento', nome: 'So esattamente quale elemento cambio', tipi: ['minore'] },
    ],
  },
  {
    id: 'oggi', nome: 'Com\'è oggi', tipi: ['modifica'],
    campi: [
      { id: 'come', nome: 'Come funziona adesso', aiuto: 'con parole tue, passo per passo' },
      { id: 'chi', nome: 'Chi lo usa', aiuto: 'schermate, componenti o funzioni che dipendono da questo comportamento' },
    ],
    spunte: [{ id: 'provato', nome: 'L\'ho provato di persona com\'è adesso' }],
  },
  {
    id: 'riprodurre', nome: 'Riprodurre', tipi: ['bug'],
    campi: [
      { id: 'passi', nome: 'Passi per riprodurlo', aiuto: 'dispositivo, account, dati usati' },
      { id: 'quando', nome: 'Quando succede', aiuto: 'sempre, a volte, solo in certi casi' },
    ],
    spunte: [
      { id: 'riprodotto', nome: 'L\'ho riprodotto almeno una volta' },
      { id: 'frase', nome: 'So spiegare il problema in una frase' },
    ],
  },
  {
    id: 'indagare', nome: 'Indagare', tipi: GRANDI,
    campi: [
      { id: 'aggancio', nome: 'Dove si aggancia il codice nuovo', aiuto: 'file, componente o funzione da cui parte', tipi: ['aggiunta'] },
      { id: 'riuso', nome: 'Cosa esiste già che puoi riusare', aiuto: 'componenti, funzioni, servizi, stili', tipi: ['aggiunta'] },
      { id: 'posizione', nome: 'Dove sta il comportamento attuale', aiuto: 'file e funzione', tipi: ['modifica'] },
      { id: 'dipendenze', nome: 'Chi altro usa quel codice', tipi: ['modifica'] },
      { id: 'dove', nome: 'Dove pensi che sia', aiuto: 'file e funzione', tipi: ['bug'] },
      { id: 'ipotesi', nome: 'La tua ipotesi sulla causa', aiuto: 'perché secondo te succede', tipi: ['bug'] },
      { id: 'verificato', nome: 'Cosa hai verificato', aiuto: 'log, breakpoint, prove fatte e cosa ti hanno detto', tipi: ['bug'] },
    ],
    spunte: [
      { id: 'letto', nome: 'Ho letto il codice intorno, non solo il punto che mi interessa' },
      { id: 'cercato', nome: 'Ho cercato se nel progetto esiste già qualcosa di simile' },
    ],
  },
  {
    id: 'progettare', nome: 'Progettare', tipi: GRANDI,
    campi: [
      { id: 'modifica', nome: 'La modifica a parole', aiuto: 'cosa cambi, senza scrivere codice' },
      { id: 'file', nome: 'File e funzioni che tocchi' },
      { id: 'dati', nome: 'Cosa entra e cosa esce', aiuto: 'parametri, valori restituiti, stato, chiamate al backend' },
      { id: 'alternative', nome: 'Alternative scartate e perché', aiuto: 'almeno una: se non ne hai, scrivi perché' },
    ],
    spunte: [
      { id: 'minima', nome: 'È la modifica più piccola che fa quello che serve' },
      { id: 'convenzioni', nome: 'Rispetta nomi, cartelle e struttura del progetto' },
    ],
  },
  {
    id: 'rischi', nome: 'Rischi', tipi: GRANDI,
    campi: [
      { id: 'rompe', nome: 'Cosa può rompersi', aiuto: 'gli altri punti che usano il codice che cambi' },
      { id: 'limite', nome: 'Casi limite', aiuto: 'valori vuoti, errori di rete, utente senza permessi, doppio clic…' },
      { id: 'sicurezza', nome: 'Sicurezza e dati', aiuto: 'dati sensibili, permessi, cosa resta salvato' },
    ],
    spunte: [
      { id: 'chiamanti', nome: 'Ho controllato chi altro usa quello che cambio' },
      { id: 'errori', nome: 'Ho pensato a cosa succede quando qualcosa va storto' },
    ],
  },
  {
    id: 'verifica', nome: 'Verifica',
    campi: [
      { id: 'prova', nome: 'Come provi che funziona', aiuto: 'passi manuali o test automatici' },
      { id: 'finito', nome: 'Quando è davvero finito', aiuto: 'criteri concreti, non "quando sembra andare"', tipi: GRANDI },
    ],
    spunte: [
      { id: 'richiesto', nome: 'Fa quello che chiedeva la Richiesta', tipi: ['aggiunta', 'modifica'] },
      { id: 'sparito', nome: 'Il bug non si riproduce più', tipi: ['bug'] },
      { id: 'resto', nome: 'Le parti collegate funzionano ancora', tipi: GRANDI },
      { id: 'pagina', nome: 'Il resto della pagina è rimasto uguale', tipi: ['minore'] },
    ],
  },
  {
    id: 'lezione', nome: 'Lezione', tipi: GRANDI,
    campi: [
      { id: 'imparato', nome: 'Cosa hai imparato' },
      { id: 'prossima', nome: 'Cosa faresti diversamente la prossima volta' },
    ],
    spunte: [],
  },
];

// PIANI
function pianoVuoto() {
  return Object.fromEntries(FASI_PIANO.map((f) => [f.id, {
    campi: Object.fromEntries(f.campi.map((c) => [c.id, ''])),
    spunte: Object.fromEntries(f.spunte.map((s) => [s.id, false])),
  }]));
}

// I piani salvati prima di una fase o di un campo nuovo ricevono le parti mancanti vuote
function completaPiano(piano) {
  const vuoto = pianoVuoto();
  const fasi = Object.fromEntries(FASI_PIANO.map((f) => [f.id, {
    campi: { ...vuoto[f.id].campi, ...piano.fasi?.[f.id]?.campi },
    spunte: { ...vuoto[f.id].spunte, ...piano.fasi?.[f.id]?.spunte },
  }]));
  const { branch, ...resto } = piano;
  return {
    ...resto,
    tipo: TIPI_PIANO.some((t) => t.id === piano.tipo) ? piano.tipo : 'aggiunta',
    mappa: MAPPE_PIANO.includes(piano.mappa) ? piano.mappa : '',
    mappe: Array.isArray(piano.mappe) ? piano.mappe : [],
    fasi,
  };
}

// La pagina vede se il file di ogni mappa collegata esiste ancora
const piani = (prog) => leggiJson(FILE_PIANI).filter((p) => p.progetto === prog.nome).map(completaPiano)
  .map((p) => ({ ...p, mappe: p.mappe.map((m) => ({ ...m, esiste: Boolean(fileMappa(m.file)) })) }));

// MAPPE DEI PIANI
// Solo file .html dentro ~/flussi, anche seguendo i collegamenti: la sala non mostra nient'altro
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

// La skill /piano, dopo aver disegnato la mappa, la aggancia al piano con questo comando
function collegaMappa(id, tipo, file) {
  if (!['dati', 'struttura'].includes(tipo)) throw errore(400, 'tipo di mappa: dati o struttura');
  const reale = fileMappa(file);
  if (!reale) throw errore(400, 'la mappa deve essere un file .html dentro ~/flussi');
  const lista = leggiJson(FILE_PIANI);
  const indice = lista.findIndex((p) => p.id === id);
  if (indice < 0) throw errore(404, 'piano non trovato');
  const piano = completaPiano(lista[indice]);
  piano.mappe = [...piano.mappe.filter((m) => m.tipo !== tipo), { tipo, file: reale }];
  piano.aggiornato = Date.now();
  lista[indice] = piano;
  scriviJson(FILE_PIANI, lista);
  return { id, mappe: piano.mappe };
}

function inviaMappa(res, parametri) {
  const piano = leggiJson(FILE_PIANI).find((p) => p.id === parametri.get('piano'));
  const file = fileMappa(piano?.mappe?.find((m) => m.tipo === parametri.get('tipo'))?.file);
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Mappa non trovata: forse il file è stato eliminato. Rigenerala con /piano.');
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer' });
  res.end(fs.readFileSync(file));
}

// Da un'attività: se ha un problema scritto è un bug fix, altrimenti un'aggiunta; il tipo si cambia dopo
function creaPiano(prog, dati) {
  const attivita = dati.attivita ? leggiJson(FILE_ATTIVITA).find((a) => a.id === dati.attivita && a.progetto === prog.nome) : null;
  if (dati.attivita && !attivita) throw errore(404, 'attività non trovata');
  const adesso = Date.now();
  const piano = {
    id: crypto.randomUUID(), progetto: prog.nome, titolo: testo(dati.titolo || attivita?.titolo, 200),
    tipo: attivita?.problema ? 'bug' : 'aggiunta', mappa: MAPPE_PIANO.includes(attivita?.mappa) ? attivita.mappa : '', mappe: [],
    attivita: attivita?.id || '', fasi: pianoVuoto(), creato: adesso, aggiornato: adesso,
  };
  if (attivita) {
    const richiesta = piano.fasi.richiesta.campi;
    Object.assign(richiesta, { dove: attivita.dove || '', note: attivita.note || '', problema: attivita.problema || '' });
    richiesta[piano.tipo === 'bug' ? 'atteso' : 'obiettivo'] = attivita.obiettivo || '';
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
  if (dati.mappa !== undefined) {
    if (!MAPPE_PIANO.includes(dati.mappa)) throw errore(400, 'mappa non valida');
    piano.mappa = dati.mappa;
  }
  if (dati.tipo !== undefined) {
    if (!TIPI_PIANO.some((t) => t.id === dati.tipo)) throw errore(400, 'tipo di piano non valido');
    piano.tipo = dati.tipo;
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

const senzaFile = (sessioni) => sessioni.map(({ file, ...s }) => s);

const AZIONI = {
  '/api/progetti': () => progetti().map(({ nome, cartella }) => ({ nome, cartella })),
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
  '/api/attivita': (d) => leggiJson(FILE_ATTIVITA).filter((a) => a.progetto === progetto(d).nome),
  '/api/attivita/crea': (d) => creaAttivita(progetto(d), d),
  '/api/attivita/aggiorna': (d) => aggiornaAttivita(d),
  '/api/attivita/elimina': (d) => eliminaAttivita(d),
  '/api/attivita/riordina': (d) => riordinaAttivita(progetto(d), d.ids),
  '/api/piani': (d) => ({ tipi: TIPI_PIANO, fasi: FASI_PIANO, piani: piani(progetto(d)) }),
  '/api/piani/crea': (d) => creaPiano(progetto(d), d),
  '/api/piani/aggiorna': (d) => aggiornaPiano(d),
  '/api/piani/elimina': (d) => eliminaPiano(d),
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
    'Content-Security-Policy': `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self' ${SERVER_CHAT}; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  });
  res.end(fs.readFileSync(FILE_PAGINA, 'utf8').replace('__GETTONE__', gettone).replace('__GETTONE_CHAT__', /^[0-9a-f]+$/.test(gettoneChat) ? gettoneChat : ''));
}

// AVVIO SERVER
// Controllo dell'Host: blocca i siti che si fingono 127.0.0.1 cambiando il proprio DNS (DNS rebinding)
function avvia() {
  preparaDati();
  const gettone = leggiGettone();
  // Se il server della chat è già acceso, --sfondo non fa nulla
  if (fs.existsSync(FILE_SERVER_CHAT)) spawn(process.execPath, [FILE_SERVER_CHAT, '--sfondo'], { stdio: 'ignore', windowsHide: true });

  const server = http.createServer(async (req, res) => {
    if (!HOST_AMMESSI.includes(req.headers.host)) return rispondi(res, 403, { errore: 'host non ammesso' });
    const url = req.url.split('?')[0];
    if (req.method === 'GET' && url === '/') return inviaPagina(res, gettone);
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
  let radice;
  try {
    radice = require('child_process').execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }).toString().trim();
  } catch {
    return null;
  }
  preparaDati();
  const lista = leggiJson(FILE_PROGETTI);
  const stessa = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
  const esistente = lista.find((p) => p && typeof p.cartella === 'string' && stessa(p.cartella, radice));
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
// Il task "Sala di controllo" lancia questa modalità all'apertura del progetto: aspetta Invio e poi avvia la sala
function attendiInvio() {
  const chiedi = () => process.stdout.write('\nPremi Invio per avviare la sala di controllo… ');
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', () => {
    avviaInSfondo(true);
    setTimeout(chiedi, 1500);
  });
  chiedi();
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
if (comando === '--terminale') attendiInvio();
else if (comando === '--piani') pianiDaTerminale(process.argv.slice(3));
else if (comando === '--attivita') attivitaDaTerminale(process.argv.slice(3));
else if (comando === '--sfondo') avviaInSfondo(false);
else if (comando === '--apri') avviaInSfondo(true);
else if (comando === '--aggiungi') aggiungiProgetto();
else if (comando === '--ferma') ferma();
else avvia();
