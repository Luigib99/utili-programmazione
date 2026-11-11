// Catalogo delle funzionalità di un progetto (Login, Cifratura messaggi, Videochiamate…).
// I nomi e i raggruppamenti li decide Claude una volta sola a partire dall'inventario del codice;
// il codice di ogni funzionalità lo ricostruisce sempre il tracciatore locale, quindi è preciso e segue le modifiche.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const Analisi = require('./analisi');

const TIMEOUT_CLAUDE_MS = 20 * 60 * 1000;
const ATTESA_CONTROLLO_MS = 4000;
const MAX_INVENTARIO = 160 * 1024;
const MAX_CONSUMI = 30;
const MAX_COMMENTO = 80;
// Sonnet basta per raggruppare e dare nomi; Haiku per assegnare pochi elementi nuovi a un catalogo già fatto
const MODELLO_CREAZIONE = 'sonnet';
const MODELLO_NUOVI = 'haiku';
const GESTORE = /^(on|handle)[A-Z]/;
const MAX_PEZZI_FUNZIONALITA = 45;
const MAX_CORRELATE = 12;
const CODICE = /\.(m?[jt]sx?|cjs)$/i;
const IGNORATI = /(^|[\\/])(node_modules|\.git|dist|build|coverage|\.expo|android|ios)([\\/]|$)/;
const ID = /^[a-z0-9][a-z0-9-]{0,60}$/;
const METODI_HTTP = ['get', 'post', 'put', 'patch', 'delete'];
const OGGETTI_HTTP = /api|axios|http|client|instance|request/i;
const OGGETTI_SOCKET = /socket|io\b|ws\b|channel|peer/i;
const SIGLE = { componente: 'C', hook: 'H', funzione: 'ƒ', classe: 'K', context: 'X' };

const errore = (status, messaggio) => Object.assign(new Error(messaggio), { status });

module.exports = function creaCatalogo({ lettura, trovaClaude, cartellaDati, registraConsumo }) {
  const cartella = path.join(cartellaDati, 'funzionalita');
  const generazioni = new Map();
  const osservati = new Map();
  const tracce = new Map();

  const fileCatalogo = (prog) => path.join(cartella, `${prog.nome.replace(/[^\w.-]/g, '_')}.json`);

  function leggi(prog) {
    try {
      return JSON.parse(fs.readFileSync(fileCatalogo(prog), 'utf8'));
    } catch {
      return null;
    }
  }

  function scrivi(prog, catalogo) {
    fs.mkdirSync(cartella, { recursive: true, mode: 0o700 });
    const file = fileCatalogo(prog);
    const temporaneo = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(temporaneo, `${JSON.stringify(catalogo, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(temporaneo, file);
    osservato(prog).versione++;
  }

  // INVENTARIO
  // Per ogni file: funzioni, componenti, hook e gestori interni (file#nome), con chiamate al backend ed eventi socket
  function chiamateIn(a, inizio, fine) {
    const trovate = [];
    a.sig.forEach((t, k) => {
      if (t.riga < inizio || t.riga > fine || a.sig[k + 1]?.testo !== '(') return;
      const arg = a.sig[k + 2]?.tipo === 's' ? a.sig[k + 2].testo.slice(1, -1).slice(0, 60) : '…';
      const oggetto = a.sig[k - 2]?.testo || '';
      if (t.proprieta && METODI_HTTP.includes(t.testo) && OGGETTI_HTTP.test(oggetto)) trovate.push(`${t.testo.toUpperCase()} ${arg}`);
      else if (t.testo === 'fetch' && !t.proprieta) trovate.push(`fetch ${arg}`);
      else if (t.proprieta && ['on', 'emit', 'once'].includes(t.testo) && OGGETTI_SOCKET.test(oggetto) && a.sig[k + 2]?.tipo === 's') trovate.push(`socket ${t.testo} ${arg}`);
    });
    return [...new Set(trovate)];
  }

  // COMMENTI
  // Il titolo sopra una funzione (es. // MUTAZIONE LOGIN) dice a Claude cosa fa senza fargli leggere il file
  function commentoSopra(testo, riga) {
    const parti = [];
    for (let r = riga - 2; r >= 0 && parti.length < 2; r--) {
      const t = testo[r].trim();
      if (!/^(\/\/|\/\*|\*)/.test(t)) break;
      const pulito = t.replace(/^\/\/+|^\/\*+|\*+\/$|^\*+/g, '').trim();
      if (pulito) parti.unshift(pulito);
    }
    return parti.join(' — ').slice(0, MAX_COMMENTO);
  }

  // Il commento in testa al file, se c'è. Deve essere staccato dal codice da una riga vuota:
  // un commento attaccato agli import (es. // librerie core) è il titolo di quel gruppo, non la descrizione del file
  function commentoFile(testo) {
    let fine = 0;
    while (fine < testo.length && fine < 4 && /^\s*(\/\/|\/\*|\*)/.test(testo[fine])) fine++;
    return fine && testo[fine]?.trim() === '' ? commentoSopra(testo, fine + 1) : '';
  }

  async function inventario(prog) {
    const sorgente = lettura.sorgente(prog);
    const file = (await sorgente.elenco()).filter((f) => CODICE.test(f));
    const voci = [];
    const righe = [];
    const route = [];
    for (const f of file) {
      const voce = await sorgente.carica(f);
      const a = voce?.analisi;
      if (!a) continue;
      const dichiarate = a.dichiarazioni.filter((d) => Analisi.FUNZIONI.includes(d.tipo) && d.fineRiga && d.livello <= 1);
      voce.testo.forEach((r, i) => {
        const m = r.match(/<Route\b[^>]*\bpath\s*=\s*\{?\s*["'`]([^"'`]+)["'`][^>]*?element\s*=\s*\{[^}]*?<([A-Z][\w$]*)/);
        if (m) route.push(`${m[1]} → ${m[2]} (${f}:${i + 1})`);
      });
      if (!dichiarate.length) continue;
      const intestazione = commentoFile(voce.testo);
      righe.push(`${f}${intestazione ? ` // ${intestazione}` : ''}`);
      const usate = new Set();
      for (const d of dichiarate) {
        const interne = dichiarate.filter((x) => x !== d && x.riga > d.riga && x.fineRiga <= d.fineRiga);
        const fuori = new Set(interne.flatMap((x) => chiamateIn(a, x.riga, x.fineRiga)));
        const chiamate = chiamateIn(a, d.riga, d.fineRiga).filter((c) => !fuori.has(c));
        // Inventario snello: delle funzioni interne restano solo i gestori (onSubmit, handleX) e quelle che parlano col server
        if (d.livello > 0 && !GESTORE.test(d.nome) && !chiamate.length) continue;
        let chiave = `${f}#${d.nome}`;
        if (usate.has(chiave)) chiave = `${chiave}@${d.riga}`;
        usate.add(chiave);
        const commento = commentoSopra(voce.testo, d.riga);
        voci.push({ chiave, file: f, nome: d.nome, riga: d.riga, fine: d.fineRiga });
        // Il rientro dice già in quale componente sta un gestore: niente righe di fine né "dentro X", sono token sprecati
        righe.push(`${d.livello ? '   ' : ' '}${SIGLE[d.tipo] || 'ƒ'} ${chiave.slice(f.length)}${d.predefinito ? ' default' : d.esportato ? ' export' : ''}${chiamate.length ? ` → ${chiamate.join(' · ')}` : ''}${commento ? ` // ${commento}` : ''}`);
      }
    }
    let testo = `${righe.join('\n')}\n\nROUTE\n${route.join('\n') || '(nessuna)'}`;
    if (testo.length > MAX_INVENTARIO) testo = `${testo.slice(0, MAX_INVENTARIO)}\n… (inventario troncato)`;
    return { voci, chiavi: voci.map((v) => v.chiave), testo };
  }

  // CLAUDE
  // Senza chiavi API nell'ambiente claude usa solo il login dell'abbonamento. Senza strumenti: niente lettura dei file,
  // lavora solo sull'inventario, così il consumo di token è piccolo e prevedibile
  function eseguiClaude(prog, prompt, modello) {
    return new Promise((resolve, reject) => {
      const args = [
        '-p', '--output-format', 'json', '--no-session-persistence', '--restricted', '--strict-mcp-config',
        '--tools', '', '--model', modello, '--permission-mode', 'dontAsk',
      ];
      const { ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, ...ambiente } = process.env;
      const figlio = spawn(trovaClaude(), args, { cwd: prog.cartella, windowsHide: true, env: ambiente });
      let out = '';
      let err = '';
      const timer = setTimeout(() => figlio.kill(), TIMEOUT_CLAUDE_MS);
      figlio.stdout.on('data', (d) => { out += d; });
      figlio.stderr.on('data', (d) => { err += d; });
      figlio.on('error', (e) => {
        clearTimeout(timer);
        reject(new Error(`claude non avviato: ${e.message}`));
      });
      figlio.on('close', () => {
        clearTimeout(timer);
        try {
          const risposta = JSON.parse(out);
          registraConsumo?.('catalogo', risposta);
          if (risposta.is_error) throw new Error(risposta.result || 'errore di claude');
          const testo = String(risposta.result || '');
          const u = risposta.usage || {};
          const consumo = {
            modello,
            input: (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0),
            output: u.output_tokens || 0,
            costo: risposta.total_cost_usd || 0,
          };
          resolve({ dati: JSON.parse(testo.slice(testo.indexOf('{'), testo.lastIndexOf('}') + 1)), consumo });
        } catch (e) {
          reject(new Error((e.message || err || out || 'nessuna risposta (tempo scaduto?)').trim().slice(0, 500)));
        }
      });
      figlio.stdin.end(prompt);
    });
  }

  const REGOLE = [
    '- una funzionalità è qualcosa che l\'app fa per l\'utente o per il sistema, con un nome chiaro in italiano per chi studia il codice (es. "Accesso con email e password", "Videochiamata di gruppo", "Cifratura dei messaggi", "Caricamento file", "Scansione antivirus").',
    '- "punti": da 1 a 5 identificativi file#nome PRESI DALL\'INVENTARIO, in ordine di esecuzione: dal punto in cui la funzionalità parte (gestore dell\'interfaccia come onSubmit, evento socket, avvio dell\'app) fino a dove finisce (servizio che chiama il backend). Non elencare i passaggi intermedi: la sala segue da sola le chiamate partendo dai punti.',
    '- "id": breve, minuscolo, con trattini, stabile (es. "login-password").',
    '- "categoria": un raggruppamento ampio (es. Account, Chat, Chiamate, File, Sicurezza, Agenda, Amministrazione, Pagamenti, Impostazioni, Notifiche).',
    '- "descrizione": UNA frase breve.',
    '- non hai accesso ai file: capisci cosa fa ogni elemento da nome, file, chiamate al backend, eventi socket e dai commenti dopo //.',
    '- non fare domande; rispondi SOLO con un oggetto JSON valido e compatto, senza testo prima o dopo e senza blocchi ```.',
  ];

  const promptCompleto = (inv) => [
    'Sei avviato in automatico dalla sala di controllo e nessuno può risponderti.',
    'Crea il CATALOGO DELLE FUNZIONALITÀ dell\'app partendo dall\'inventario del codice qui sotto',
    '(per ogni file: funzioni, componenti C, hook H e gestori interni con righe, chiamate al backend, eventi socket e commenti; poi le route).',
    'Sotto ogni percorso di file gli elementi sono scritti come #nome: il loro identificativo completo è percorso#nome, es. src/components/users/Login.jsx#onSubmit.',
    'Regole:',
    '- copri tutto ciò che l\'app fa: di solito tra 20 e 70 funzionalità.',
    ...REGOLE,
    'Forma della risposta:',
    '{"funzionalita":[{"id":"…","nome":"…","categoria":"…","descrizione":"…","punti":["file#nome"]}]}',
    '',
    'INVENTARIO',
    inv.testo,
  ].join('\n');

  const promptNuovi = (catalogo, inv, nuovi) => {
    const file = new Set(nuovi.map((k) => k.split('#')[0]));
    const righe = inv.testo.split('\n');
    const estratto = [];
    righe.forEach((r, i) => {
      if (file.has(r.split(' // ')[0])) for (let j = i; j < righe.length && (j === i || righe[j].startsWith(' ')); j++) estratto.push(righe[j]);
    });
    return [
      'Sei avviato in automatico dalla sala di controllo e nessuno può risponderti.',
      'Il catalogo delle funzionalità dell\'app esiste già (sotto). Nel codice sono comparsi elementi nuovi.',
      'Assegnali: aggiungili ai punti delle funzionalità esistenti adatte oppure crea funzionalità nuove. Le semplici utilità generiche si possono lasciare fuori.',
      'Regole:',
      ...REGOLE,
      'Forma della risposta:',
      '{"aggiunte":[{"id":"<id esistente>","punti":["file#nome"]}],"nuove":[{"id":"…","nome":"…","categoria":"…","descrizione":"…","punti":["file#nome"]}]}',
      '',
      'CATALOGO ATTUALE',
      ...catalogo.funzionalita.map((f) => `${f.id} — ${f.nome} (${f.categoria})`),
      '',
      'ELEMENTI NUOVI',
      nuovi.join('\n'),
      '',
      'INVENTARIO DEI FILE CON ELEMENTI NUOVI',
      estratto.join('\n'),
    ].join('\n');
  };

  // Tiene solo funzionalità ben formate e punti che esistono davvero nell'inventario
  function ripulisci(lista, chiavi, esistenti = new Set()) {
    const valide = new Set(chiavi);
    return (Array.isArray(lista) ? lista : []).map((f) => ({
      id: String(f?.id || '').toLowerCase(),
      nome: String(f?.nome || '').slice(0, 120),
      categoria: String(f?.categoria || 'Altro').slice(0, 60),
      descrizione: String(f?.descrizione || '').slice(0, 400),
      punti: [...new Set((Array.isArray(f?.punti) ? f.punti : []).map(String).filter((p) => valide.has(p)))].slice(0, 8),
    })).filter((f) => ID.test(f.id) && f.nome && f.punti.length && !esistenti.has(f.id));
  }

  // CONSUMI
  // Ogni chiamata a Claude lascia token e costo equivalente nel catalogo, così la spesa si vede con i numeri veri
  const conConsumo = (catalogo, tipo, consumo) => ({
    ...catalogo,
    consumi: [...(catalogo.consumi || []), { quando: Date.now(), tipo, ...consumo }].slice(-MAX_CONSUMI),
  });

  function avviaGenerazione(prog, lavoro, tipo) {
    if (generazioni.get(prog.cartella)?.stato === 'in-corso') throw errore(409, 'Claude sta già lavorando al catalogo');
    generazioni.set(prog.cartella, { stato: 'in-corso', tipo, inizio: Date.now() });
    lavoro()
      .then(() => generazioni.delete(prog.cartella))
      .catch((e) => generazioni.set(prog.cartella, { stato: 'errore', tipo, errore: String(e.message).slice(0, 500) }));
  }

  // GENERAZIONE COMPLETA
  function crea(prog) {
    osserva(prog);
    avviaGenerazione(prog, async () => {
      const inv = await inventario(prog);
      const { dati, consumo } = await eseguiClaude(prog, promptCompleto(inv), MODELLO_CREAZIONE);
      const funzionalita = ripulisci(dati.funzionalita, inv.chiavi);
      if (!funzionalita.length) throw new Error('Claude non ha restituito funzionalità valide');
      const precedente = leggi(prog) || {};
      scrivi(prog, conConsumo({ consumi: precedente.consumi, generato: Date.now(), aggiornato: Date.now(), noti: inv.chiavi, funzionalita }, 'creazione', consumo));
      osservato(prog).nuovi = [];
    }, 'completo');
    return stato(prog);
  }

  // ELEMENTI NUOVI
  // Contarli è gratis e avviene da solo dopo ogni salvataggio; mandarli a Claude solo quando lo chiedi tu
  async function controllaNuovi(prog) {
    const catalogo = leggi(prog);
    const s = osservato(prog);
    if (!catalogo) return;
    const inv = await inventario(prog);
    const noti = new Set(catalogo.noti);
    s.nuovi = inv.chiavi.filter((k) => !noti.has(k));
  }

  function assegnaNuovi(prog) {
    const catalogo = leggi(prog);
    if (!catalogo) throw errore(400, 'crea prima il catalogo');
    avviaGenerazione(prog, async () => {
      const inv = await inventario(prog);
      const noti = new Set(catalogo.noti);
      const nuovi = inv.chiavi.filter((k) => !noti.has(k));
      if (!nuovi.length) {
        osservato(prog).nuovi = [];
        return;
      }
      const { dati, consumo } = await eseguiClaude(prog, promptNuovi(catalogo, inv, nuovi), MODELLO_NUOVI);
      const attuale = leggi(prog) || catalogo;
      const perId = new Map(attuale.funzionalita.map((f) => [f.id, f]));
      const valide = new Set(inv.chiavi);
      for (const a of Array.isArray(dati.aggiunte) ? dati.aggiunte : []) {
        const f = perId.get(String(a?.id));
        if (f) f.punti = [...new Set([...f.punti, ...(a.punti || []).map(String).filter((p) => valide.has(p))])];
      }
      attuale.funzionalita.push(...ripulisci(dati.nuove, inv.chiavi, new Set(perId.keys())));
      scrivi(prog, conConsumo({ ...attuale, aggiornato: Date.now(), noti: [...new Set([...attuale.noti, ...inv.chiavi])] }, 'nuovi', consumo));
      osservato(prog).nuovi = [];
    }, 'nuovi');
    return stato(prog);
  }

  // OSSERVAZIONE DEI FILE
  // A ogni salvataggio di un file di codice: tracce da rifare e, dopo una pausa, conteggio (gratis) degli elementi nuovi
  function osservato(prog) {
    if (!osservati.has(prog.cartella)) osservati.set(prog.cartella, { versione: 0, nuovi: null, watcher: null });
    return osservati.get(prog.cartella);
  }

  function osserva(prog) {
    const s = osservato(prog);
    if (s.watcher) return;
    try {
      s.watcher = fs.watch(prog.cartella, { recursive: true }, (_, nome) => {
        if (!nome || IGNORATI.test(nome) || !CODICE.test(nome)) return;
        s.versione++;
        lettura.invalida(prog);
        clearTimeout(s.timerControllo);
        s.timerControllo = setTimeout(() => controllaNuovi(prog).catch(() => {}), ATTESA_CONTROLLO_MS);
      });
      s.watcher.on('error', () => {
        s.watcher = null;
      });
    } catch {
      s.watcher = null;
    }
  }

  // TRACCE
  // Il codice di ogni funzionalità: si parte dal primo punto (con chi ci arriva) e si aggiungono i punti non ancora raggiunti
  async function rangeDi(sorgente, chiave) {
    const [file, resto] = chiave.split('#');
    const [nome, riga] = resto.split('@');
    const voce = await sorgente.carica(file);
    const d = voce?.analisi?.dichiarazioni.find((x) => x.nome === nome && x.fineRiga && (!riga || x.riga === Number(riga)) && Analisi.FUNZIONI.includes(x.tipo));
    return d ? { file, nome, inizio: d.riga, fine: d.fineRiga } : null;
  }

  async function traccia(prog, f) {
    const sorgente = lettura.sorgente(prog);
    const tracciatore = Analisi.creaTracciatore(sorgente);
    const ctx = { blocchi: [], visti: new Map(), troncato: false, max: MAX_PEZZI_FUNZIONALITA };
    let primo = true;
    for (const punto of f.punti) {
      const r = await rangeDi(sorgente, punto);
      if (!r || ctx.visti.has(`${r.file}:${r.inizio}`)) continue;
      await tracciatore.segui(r.file, r.inizio, r.fine, { ctx, monte: primo, tipo: primo ? 'partenza' : 'punto', relazione: primo ? '' : `poi: ${r.nome}` });
      primo = false;
    }
    const blocchi = Analisi.serializza(ctx.blocchi);
    const veri = blocchi.filter((b) => b.rimando === undefined);
    return { blocchi, troncato: ctx.troncato, pezzi: veri.length, file: new Set(veri.map((b) => b.file)).size, backend: veri.reduce((n, b) => n + b.backend.length, 0) };
  }

  async function tracceDi(prog, catalogo) {
    const s = osservato(prog);
    const salvate = tracce.get(prog.cartella);
    if (salvate && salvate.versione === s.versione) return salvate.lavoro;
    const lavoro = (async () => {
      const perId = new Map();
      for (const f of catalogo.funzionalita) {
        try {
          perId.set(f.id, await traccia(prog, f));
        } catch {
          perId.set(f.id, { blocchi: [], pezzi: 0, file: 0, backend: 0 });
        }
      }
      return perId;
    })();
    tracce.set(prog.cartella, { versione: s.versione, lavoro });
    return lavoro;
  }

  // API
  function stato(prog) {
    const catalogo = leggi(prog);
    const s = osservato(prog);
    const consumi = catalogo?.consumi || [];
    const totale = consumi.reduce((t, c) => ({ input: t.input + c.input, output: t.output + c.output, costo: t.costo + c.costo }), { input: 0, output: 0, costo: 0 });
    return {
      catalogo: Boolean(catalogo),
      aggiornato: catalogo?.aggiornato || null,
      generazione: generazioni.get(prog.cartella) || null,
      nuovi: s.nuovi?.length || 0,
      osservato: Boolean(s.watcher),
      ultimoConsumo: consumi.at(-1) || null,
      totaleConsumi: consumi.length ? { ...totale, chiamate: consumi.length } : null,
    };
  }

  async function elenco(prog) {
    osserva(prog);
    const catalogo = leggi(prog);
    if (!catalogo) return { stato: stato(prog), funzionalita: [] };
    // Al primo accesso dopo l'avvio della sala si contano gli elementi nuovi anche senza aspettare un salvataggio
    if (osservato(prog).nuovi === null) await controllaNuovi(prog).catch(() => {});
    const perId = await tracceDi(prog, catalogo);
    return {
      stato: stato(prog),
      funzionalita: catalogo.funzionalita.map((f) => {
        const t = perId.get(f.id) || {};
        return { ...f, pezzi: t.pezzi || 0, file: t.file || 0, backend: t.backend || 0 };
      }),
    };
  }

  async function apri(prog, id) {
    const catalogo = leggi(prog);
    const f = catalogo?.funzionalita.find((x) => x.id === id);
    if (!f) throw errore(404, 'funzionalità non trovata');
    const t = (await tracceDi(prog, catalogo)).get(id);
    return { funzionalita: f, blocchi: t?.blocchi || [], troncato: Boolean(t?.troncato) };
  }

  // CORRELATE
  // Le funzionalità che passano dalle righe selezionate: conta di più chi ha accese proprio quelle righe
  async function correlate(prog, percorso, inizio, fine) {
    const catalogo = leggi(prog);
    if (!catalogo) return { catalogo: false, funzionalita: [] };
    const perId = await tracceDi(prog, catalogo);
    const trovate = [];
    for (const f of catalogo.funzionalita) {
      let punteggio = 0;
      for (const b of perId.get(f.id)?.blocchi || []) {
        if (b.rimando !== undefined || b.file !== percorso || b.fine < inizio || b.inizio > fine) continue;
        punteggio += 1 + b.evidenziate.filter((r) => r >= inizio && r <= fine).length;
      }
      if (punteggio) trovate.push({ id: f.id, nome: f.nome, categoria: f.categoria, punteggio });
    }
    return { catalogo: true, funzionalita: trovate.sort((a, b) => b.punteggio - a.punteggio).slice(0, MAX_CORRELATE) };
  }

  return { elenco, apri, crea, assegnaNuovi, correlate, stato, inventario };
};
