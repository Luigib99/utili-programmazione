// COMANDI GIT
// execFile senza shell: gli argomenti arrivano a git così come sono, senza poter diventare altri comandi.
// core.fsmonitor spento: un .git/config estraneo non può far eseguire un programma già con git status
const { execFile, execFileSync } = require('child_process');
const { errore } = require('./base');

const GIT_SICURO = ['-c', 'core.fsmonitor=false'];

function git(cartella, args) {
  return new Promise((resolve, reject) => {
    execFile('git', [...GIT_SICURO, '-C', cartella, ...args], { windowsHide: true, timeout: 15000, maxBuffer: 4 * 1024 * 1024 }, (e, out, err) => {
      if (e) reject(errore(500, (err || e.message).trim()));
      else resolve(out);
    });
  });
}

const MAX_COMMIT = 40;

// RADICE REPO
function radiceGit(cartella) {
  try {
    const radice = execFileSync('git', [...GIT_SICURO, 'rev-parse', '--show-toplevel'], { cwd: cartella, stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }).toString().trim();
    return radice || null;
  } catch {
    return null;
  }
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

module.exports = {
  GIT_SICURO, MAX_COMMIT, git, radiceGit, elencoBranch, commitBranch, committaTutto,
  tornaACommit, cambiaBranch, creaBranch, eliminaBranch,
};
