// SESSIONI DI CLAUDE
// Chat di Claude Code di un progetto: elenco, archivio, eliminazione e chiusura
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { errore, leggiJson, scriviJson, CARTELLA_CLAUDE, FILE_ARCHIVIO } = require('./base');

const ATTIVA_DA_MS = 2 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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

module.exports = { elencoSessioni, eliminaSessione, archiviaSessione, chiudiSessione };
