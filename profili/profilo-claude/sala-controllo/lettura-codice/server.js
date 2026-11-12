// Lettura codice: elenco, contenuto e riferimenti dei file di un progetto, sempre in sola lettura.
// Si leggono solo i file che git conosce (tracciati o nuovi non ignorati), mai segreti come .env o chiavi.
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const Analisi = require('./analisi');

const MAX_FILE = 1024 * 1024;
const MAX_ELENCO = 20000;
const MAX_RISULTATI = 300;
const DURATA_CACHE_MS = 10000;
const ESTENSIONI_CODICE = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
const ESTENSIONI_RISOLTE = [...ESTENSIONI_CODICE, '.json', '.css', '.scss'];
const SEGRETI = [
  /(^|\/)\.env(\..*)?$/i,
  /\.(pem|key|p12|pfx|keystore|jks|crt|cer)$/i,
  /(^|\/)id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$/i,
  /(^|\/)\.(npmrc|netrc|pgpass)$/i,
  /(^|\/)(credentials|secrets?|service-account)[^/]*\.(json|ya?ml)$/i,
  /(^|\/)google-services\.json$/i,
  /(^|\/)GoogleService-Info\.plist$/i,
];
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*|@import\s+(?:url\()?\s*)(['"])([^'"\n]+)\1/g;
const IDENTIFICATORE = /^[A-Za-z_$][\w$]{0,99}$/;
const PERCORSO = /^[\w/.:-]{2,100}$/;

const errore = (status, messaggio) => Object.assign(new Error(messaggio), { status });
const segreto = (percorso) => SEGRETI.some((r) => r.test(percorso));

module.exports = function creaLetturaCodice({ gitSicuro }) {
  const elenchi = new Map();
  const importiFile = new Map();

  // GIT
  // Come in server.js: execFile senza shell e fsmonitor spento; il codice 1 di git grep vuol dire "nessun risultato"
  function eseguiGit(cartella, args) {
    return new Promise((resolve, reject) => {
      execFile('git', [...gitSicuro, '-c', 'core.quotepath=off', '-C', cartella, ...args], { windowsHide: true, timeout: 15000, maxBuffer: 8 * 1024 * 1024 }, (e, out, err) => {
        if (e && e.code === 1 && !err) resolve('');
        else if (e) reject(errore(500, (err || e.message).trim()));
        else resolve(out);
      });
    });
  }

  // ELENCO FILE
  async function elenco(prog) {
    const salvato = elenchi.get(prog.cartella);
    if (salvato && Date.now() - salvato.letto < DURATA_CACHE_MS) return salvato.file;
    const [presenti, cancellati] = await Promise.all([
      eseguiGit(prog.cartella, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']),
      eseguiGit(prog.cartella, ['ls-files', '--deleted', '-z']),
    ]);
    const tolti = new Set(cancellati.split('\0'));
    const file = [...new Set(presenti.split('\0'))]
      .filter((f) => f && !tolti.has(f) && !segreto(f))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, MAX_ELENCO);
    const risultato = new Set(file);
    elenchi.set(prog.cartella, { letto: Date.now(), file: risultato });
    return risultato;
  }

  // PERCORSO SICURO
  // Il percorso deve essere nell'elenco di git e, seguendo i collegamenti, restare dentro il progetto
  async function percorsoAmmesso(prog, percorso) {
    const relativo = String(percorso || '');
    if (!(await elenco(prog)).has(relativo)) throw errore(404, 'file non trovato tra quelli del progetto');
    const radice = fs.realpathSync(prog.cartella);
    const reale = fs.realpathSync(path.join(prog.cartella, relativo));
    const dentro = path.relative(radice, reale);
    if (!dentro || dentro.startsWith('..') || path.isAbsolute(dentro)) throw errore(403, 'il file punta fuori dal progetto');
    return reale;
  }

  // ALIAS DEGLI IMPORT
  // Legge i "paths" di jsconfig/tsconfig (es. "@/*": ["src/*"]); i commenti nel JSON si tolgono alla buona
  function aliasProgetto(prog) {
    for (const nome of ['jsconfig.json', 'tsconfig.json']) {
      try {
        const testo = fs.readFileSync(path.join(prog.cartella, nome), 'utf8').replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        const opzioni = JSON.parse(testo).compilerOptions || {};
        const base = path.posix.normalize(opzioni.baseUrl || '.');
        return Object.entries(opzioni.paths || {}).map(([chiave, valori]) => [chiave.replace(/\*$/, ''), path.posix.join(base, String(valori[0] || '').replace(/\*$/, ''))]);
      } catch {}
    }
    return [];
  }

  // RISOLUZIONE IMPORT
  // Da './Bottone' a 'src/components/Bottone.jsx', provando le estensioni e index; i pacchetti npm restano null
  function risolvi(file, specificatore, presenti, alias) {
    let base = null;
    if (specificatore.startsWith('.')) base = path.posix.join(path.posix.dirname(file), specificatore);
    else {
      const trovato = alias.find(([prefisso]) => specificatore.startsWith(prefisso));
      if (trovato) base = path.posix.join(trovato[1], specificatore.slice(trovato[0].length));
      else if (specificatore.startsWith('/')) base = specificatore.slice(1);
    }
    if (base === null) return null;
    const candidati = [base, ...ESTENSIONI_RISOLTE.map((e) => base + e), ...ESTENSIONI_RISOLTE.map((e) => `${base}/index${e}`)];
    return candidati.find((c) => presenti.has(c)) || null;
  }

  function leggiImporti(file, testo, presenti, alias) {
    const importi = [];
    const righe = testo.split('\n');
    righe.forEach((riga, i) => {
      for (const m of riga.matchAll(IMPORT)) importi.push({ specificatore: m[2], risolto: risolvi(file, m[2], presenti, alias), riga: i + 1 });
    });
    return importi;
  }

  const importabile = (f) => [...ESTENSIONI_CODICE, '.css', '.scss'].includes(path.posix.extname(f).toLowerCase());

  // CONTENUTO FILE
  async function file(prog, percorso) {
    const reale = await percorsoAmmesso(prog, percorso);
    const { size } = fs.statSync(reale);
    const assoluto = reale.split(path.sep).join('/');
    if (size > MAX_FILE) return { percorso, assoluto, dimensione: size, troppoGrande: true };
    const dati = fs.readFileSync(reale);
    if (dati.subarray(0, 8000).includes(0)) return { percorso, assoluto, dimensione: size, binario: true };
    const testo = dati.toString('utf8');
    const presenti = await elenco(prog);
    const importi = importabile(percorso) ? leggiImporti(percorso, testo, presenti, aliasProgetto(prog)) : [];
    return { percorso, assoluto, dimensione: size, testo, importi };
  }

  // USATO DA
  // Indice degli import di tutto il progetto: ogni file si rilegge solo se è cambiato dall'ultima volta
  async function importatoDa(prog, percorso) {
    await percorsoAmmesso(prog, percorso);
    const presenti = await elenco(prog);
    const alias = aliasProgetto(prog);
    const risultati = [];
    for (const f of presenti) {
      if (!importabile(f) || f === percorso) continue;
      const assoluto = path.join(prog.cartella, f);
      let stat;
      try {
        stat = fs.statSync(assoluto);
      } catch {
        continue;
      }
      if (stat.size > MAX_FILE) continue;
      let salvato = importiFile.get(assoluto);
      if (!salvato || salvato.modificato !== stat.mtimeMs) {
        salvato = { modificato: stat.mtimeMs, importi: leggiImporti(f, fs.readFileSync(assoluto, 'utf8'), presenti, alias) };
        importiFile.set(assoluto, salvato);
      }
      for (const imp of salvato.importi) if (imp.risolto === percorso) risultati.push({ file: f, riga: imp.riga, specificatore: imp.specificatore });
    }
    return risultati;
  }

  // CERCA NEL PROGETTO
  // Nomi interi (come "Trova tutti i riferimenti" di VS Code) o percorsi come verify-otp; sempre testo fisso (-F), mai espressioni
  async function cerca(prog, testo) {
    const nome = String(testo || '');
    const identificatore = IDENTIFICATORE.test(nome);
    if (!identificatore && !PERCORSO.test(nome)) throw errore(400, 'si può cercare solo un nome (lettere, numeri, _ e $) o un percorso');
    const presenti = await elenco(prog);
    const out = await eseguiGit(prog.cartella, ['grep', '-n', '-I', ...(identificatore ? ['-w'] : []), '-F', '--untracked', '--exclude-standard', '--null', '-e', nome]);
    const risultati = [];
    for (const riga of out.split('\n')) {
      const separatore = riga.indexOf('\0');
      if (separatore < 0) continue;
      const file = riga.slice(0, separatore);
      const m = riga.slice(separatore + 1).match(/^(\d+)[:\0](.*)$/s);
      if (!m || !presenti.has(file)) continue;
      risultati.push({ file, riga: Number(m[1]), testo: m[2].trim().slice(0, 240) });
      if (risultati.length >= MAX_RISULTATI) break;
    }
    return { risultati, troncato: risultati.length >= MAX_RISULTATI };
  }

  // FILE ANALIZZATI
  // Ogni file si rianalizza solo se è cambiato; le ricerche si tengono finché non cambia un file del progetto
  const analizzati = new Map();
  const ricerche = new Map();

  async function carica(prog, percorso) {
    let reale;
    try {
      reale = await percorsoAmmesso(prog, percorso);
    } catch {
      return null;
    }
    const { mtimeMs } = fs.statSync(reale);
    const salvato = analizzati.get(reale);
    if (salvato && salvato.modificato === mtimeMs) return salvato.voce;
    const dati = await file(prog, percorso);
    if (typeof dati.testo !== 'string') return null;
    const token = Analisi.tokenDelFile(percorso, dati.testo);
    const js = Analisi.ESTENSIONI_JS.includes(Analisi.estensione(percorso));
    const voce = { percorso, dati, token, analisi: js ? Analisi.analizzaJs(percorso, token, dati.importi || []) : null, testo: dati.testo.split('\n') };
    analizzati.set(reale, { modificato: mtimeMs, voce });
    return voce;
  }

  function sorgente(prog) {
    if (!ricerche.has(prog.cartella)) ricerche.set(prog.cartella, new Map());
    const cache = ricerche.get(prog.cartella);
    return {
      carica: (percorso) => carica(prog, percorso),
      cerca: (testo) => {
        if (!cache.has(testo)) cache.set(testo, cerca(prog, testo).catch(() => ({ risultati: [] })));
        return cache.get(testo);
      },
      importatoDa: (percorso) => importatoDa(prog, percorso).catch(() => []),
      elenco: async () => [...(await elenco(prog))],
    };
  }

  // Un file del progetto è cambiato: elenco e ricerche vanno rifatti (le analisi si controllano da sole con la data)
  function invalida(prog) {
    elenchi.delete(prog.cartella);
    ricerche.delete(prog.cartella);
  }

  // SEGUI FUNZIONALITÀ
  async function segui(prog, percorso, inizio, fine) {
    if (!Number.isInteger(inizio) || !Number.isInteger(fine) || inizio < 1 || fine < inizio) throw errore(400, 'righe non valide');
    const risultato = await Analisi.creaTracciatore(sorgente(prog)).segui(String(percorso || ''), inizio, fine);
    if (!risultato) throw errore(400, 'si possono seguire solo file JavaScript/TypeScript');
    return { titolo: risultato.titolo, blocchi: Analisi.serializza(risultato.ctx.blocchi), troncato: risultato.ctx.troncato };
  }

  return {
    albero: async (prog) => [...(await elenco(prog))],
    file,
    importatoDa,
    cerca,
    carica,
    sorgente,
    invalida,
    segui,
  };
};
