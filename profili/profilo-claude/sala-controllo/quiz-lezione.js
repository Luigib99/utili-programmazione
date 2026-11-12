// Quiz di fine lezione: la lezione si genera solo dopo aver risposto bene alle domande.
// Due ingressi (Chattino insegnante e piano da terminare), stesso meccanismo:
// genera le domande → verifica le risposte → a quiz superato scrive la lezione e la salva.
// I quiz vivono in memoria: se il server si riavvia, il quiz si rigenera.
const crypto = require('crypto');

const TIMEOUT_MS = 4 * 60 * 1000;
const MODELLO = ['--tools', 'Read,Grep,Glob', '--model', 'sonnet'];
const MAX_MATERIALE = 40000;
const MAX_QUIZ = 20;
const SCADENZA_MS = 6 * 60 * 60 * 1000;
const MIN_RISPOSTA = 15;
const MAX_RISPOSTA = 3000;
const OPZIONI = 4;
const ORIGINI = ['chattino', 'piano'];

const NOMI_ORIGINE = {
  chattino: 'una lezione data a voce dal tutor Chattino (conversazione qui sotto)',
  piano: 'un piano di lavoro che lo sviluppatore ha appena finito (campi del piano e, se c\'è, codice cambiato)',
};

const FORMATO_DOMANDE = [
  'Formato di ogni domanda (JSON):',
  '- a scelta: {"tipo": "scelta", "testo": "...", "opzioni": ["...", "...", "...", "..."], "corretta": 0, "spiegazione": "..."}',
  '  · esattamente 4 opzioni, una sola giusta, le altre sbagliate ma plausibili; "corretta" è l\'indice (0-3) della giusta; "spiegazione" dice perché la giusta è giusta e perché le altre no, in 2-3 frasi.',
  '- aperta: {"tipo": "aperta", "testo": "...", "criterio": "..."}',
  '  · si risponde in 2-4 frasi; "criterio" elenca i punti essenziali che la risposta deve contenere.',
  'Le domande verificano di aver capito (perché, cosa succede se, come si applica), non la memoria dei termini; il testo di una domanda non deve contenere la risposta.',
].join('\n');

const errore = (status, messaggio) => Object.assign(new Error(messaggio), { status });

// LETTURA RISPOSTA
// L'ultima riga che comincia con il prefisso contiene il JSON, su una riga
function leggiRiga(risultato, prefisso) {
  const riga = risultato.trim().split('\n').reverse().find((r) => r.trim().startsWith(prefisso));
  if (!riga) throw errore(502, 'claude non ha restituito il risultato: riprova');
  try {
    return JSON.parse(riga.trim().slice(prefisso.length));
  } catch {
    throw errore(502, 'risposta di claude non leggibile: riprova');
  }
}

const mescola = (lista) => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

// DOMANDA VALIDA
// Claude tende a mettere la risposta giusta sempre per prima: le opzioni si rimescolano qui e "corretta" segue lo spostamento
function leggiDomanda(grezza, id, testo) {
  const base = { id, testo: testo(grezza?.testo, 600), esito: null, risposta: null, feedback: '' };
  if (!base.testo) return null;
  if (grezza.tipo === 'aperta') {
    const criterio = testo(grezza.criterio, 800);
    return criterio ? { ...base, tipo: 'aperta', criterio } : null;
  }
  if (grezza.tipo !== 'scelta' || !Array.isArray(grezza.opzioni) || grezza.opzioni.length !== OPZIONI) return null;
  const opzioni = grezza.opzioni.map((o) => testo(o, 300));
  const spiegazione = testo(grezza.spiegazione, 800);
  if (opzioni.some((o) => !o) || !spiegazione || !Number.isInteger(grezza.corretta) || grezza.corretta < 0 || grezza.corretta >= OPZIONI) return null;
  const ordine = mescola(opzioni.map((_, i) => i));
  return { ...base, tipo: 'scelta', opzioni: ordine.map((i) => opzioni[i]), corretta: ordine.indexOf(grezza.corretta), spiegazione };
}

const inSospeso = (quiz) => quiz.voci.some((v) => !v.esito);

// VISTA PER LA PAGINA
// Prima della risposta niente soluzioni né criteri: la pagina non deve poterli leggere
function pubblica(quiz) {
  return {
    id: quiz.id,
    titolo: quiz.titolo,
    superato: !inSospeso(quiz),
    voci: quiz.voci.map((v) => ({
      id: v.id, tipo: v.tipo, testo: v.testo, opzioni: v.opzioni, esito: v.esito, risposta: v.risposta,
      ...(v.esito ? { feedback: v.tipo === 'scelta' ? v.spiegazione : v.feedback, ...(v.tipo === 'scelta' ? { corretta: v.corretta } : {}) } : {}),
    })),
  };
}

module.exports = function creaQuiz({ avviaClaude, testo, materialePiano, salvaLezione, terminaPiano }) {
  const quizAperti = new Map();
  let contatore = 0;

  // PULIZIA
  function pulisci() {
    const limite = Date.now() - SCADENZA_MS;
    for (const [id, q] of quizAperti) if (q.creato < limite) quizAperti.delete(id);
    while (quizAperti.size >= MAX_QUIZ) quizAperti.delete(quizAperti.keys().next().value);
  }

  const idVoce = (quiz) => `d${++quiz.contatore}`;

  // MATERIALE
  async function materiale(prog, dati) {
    if (dati.origine === 'chattino') {
      const storia = (Array.isArray(dati.storia) ? dati.storia : []).slice(-8)
        .map((m) => `${m?.ruolo === 'utente' ? 'Sviluppatore' : 'Tutor'}: ${testo(m?.testo, 6000)}`).filter((r) => r.length > 12);
      if (!storia.length) throw errore(400, 'la conversazione è vuota: fai prima una domanda a Chattino');
      return { testo: storia.join('\n\n').slice(-MAX_MATERIALE), piano: null };
    }
    const { piano, testo: descrizione } = await materialePiano(prog, dati.piano);
    return { testo: descrizione.slice(0, MAX_MATERIALE), piano };
  }

  // PROMPT DOMANDE
  const promptDomande = (origine, materia) => [
    'Sei avviato in automatico dalla sala di controllo e nessuno può risponderti. Non modificare nessun file.',
    `Uno sviluppatore che sta imparando (React Native, JavaScript) ha appena concluso ${NOMI_ORIGINE[origine]}. Prima di salvargli la lezione devi verificare che abbia capito davvero.`,
    'Scrivi 5 domande: 3 a scelta e 2 aperte, dalla più semplice alla più difficile, tutte sul MATERIALE qui sotto (cosa è stato spiegato o deciso e perché). Se ti serve puoi leggere il codice del progetto citato, ma non fare domande su ciò che il MATERIALE non copre.',
    FORMATO_DOMANDE,
    'Scrivi anche un "titolo" (max 80 caratteri) e un "argomento" (una riga) che descrivono ciò che ha imparato.',
    'L\'ultima riga della risposta deve essere solo questa, con JSON valido su una riga:',
    'QUIZ: {"titolo": "...", "argomento": "...", "domande": [...]}',
    '',
    'MATERIALE:',
    materia,
  ].join('\n');

  // AVVIO
  async function avvia(prog, dati) {
    if (!ORIGINI.includes(dati.origine)) throw errore(400, 'origine del quiz non valida');
    pulisci();
    if (dati.origine === 'piano') {
      const esistente = [...quizAperti.values()].find((q) => q.piano === dati.piano && q.progetto === prog.nome);
      if (esistente) return pubblica(esistente);
    }
    const { testo: materia, piano } = await materiale(prog, dati);
    const risultato = await avviaClaude(prog, MODELLO, promptDomande(dati.origine, materia), TIMEOUT_MS, 'quiz');
    const grezzo = leggiRiga(risultato, 'QUIZ:');
    const quiz = {
      id: crypto.randomUUID(), origine: dati.origine, progetto: prog.nome, piano: piano?.id || '', pianoTitolo: piano?.titolo || '',
      titolo: testo(grezzo?.titolo, 200) || 'Lezione', argomento: testo(grezzo?.argomento, 1000), materia, creato: Date.now(), contatore: 0, occupato: false, voci: [],
    };
    quiz.voci = (Array.isArray(grezzo?.domande) ? grezzo.domande : []).slice(0, 7).map((d) => leggiDomanda(d, idVoce(quiz), testo)).filter(Boolean);
    if (quiz.voci.length < 3 || !quiz.voci.some((v) => v.tipo === 'scelta') || !quiz.voci.some((v) => v.tipo === 'aperta')) {
      throw errore(502, 'claude non ha scritto un quiz valido: riprova');
    }
    quizAperti.set(quiz.id, quiz);
    return pubblica(quiz);
  }

  // PROMPT VALUTAZIONE
  // Le scelte sbagliate le conosce già la sala: a claude servono per scrivere la domanda nuova, le aperte deve giudicarle lui
  const promptValutazione = (quiz, aperte, scelteSbagliate) => [
    'Sei avviato in automatico dalla sala di controllo e nessuno può risponderti. Non modificare nessun file.',
    `Stai verificando se uno sviluppatore ha capito ${NOMI_ORIGINE[quiz.origine]}. Qui sotto trovi il MATERIALE e le sue risposte.`,
    'Hai due compiti.',
    '1) VALUTA ogni risposta aperta. È giusta ("ok": true) se mostra di aver capito il concetto del criterio, anche con parole diverse e senza i termini esatti; è sbagliata se manca un punto essenziale o dice una cosa falsa. "spiegazione": se giusta, una frase che conferma o integra; se sbagliata, cosa manca o è errato e la risposta corretta, in 2-3 frasi.',
    '2) SOSTITUISCI ogni domanda sbagliata (le scelte sbagliate sono elencate sotto, le aperte sbagliate le decidi tu) con una domanda nuova sullo STESSO concetto e dello stesso tipo, formulata in modo diverso (non basta cambiare l\'ordine delle opzioni). Se non ci sono domande sbagliate, "nuove" è [].',
    FORMATO_DOMANDE,
    'Ogni domanda nuova ha in più il campo "sostituisce" con l\'id della domanda che rimpiazza.',
    'L\'ultima riga della risposta deve essere solo questa, con JSON valido su una riga:',
    'VALUTAZIONE: {"aperte": {"<id>": {"ok": true, "spiegazione": "..."}}, "nuove": [{"sostituisce": "<id>", "tipo": "...", ...}]}',
    '',
    'MATERIALE:',
    quiz.materia.slice(0, 20000),
    ...(aperte.length ? ['', 'RISPOSTE APERTE DA VALUTARE:', ...aperte.map((v) => `--- ${v.id} ---\nDomanda: ${v.testo}\nCriterio: ${v.criterio}\nRisposta: ${v.risposta}`)] : []),
    ...(scelteSbagliate.length ? ['', 'SCELTE SBAGLIATE DA SOSTITUIRE:', ...scelteSbagliate.map((v) => `--- ${v.id} ---\nDomanda: ${v.testo}\nOpzioni: ${v.opzioni.join(' | ')}\nGiusta: ${v.opzioni[v.corretta]}\nSpiegazione: ${v.spiegazione}`)] : []),
  ].join('\n');

  // RISPOSTE LETTE
  function leggiRisposte(quiz, risposte) {
    const lette = new Map();
    for (const v of quiz.voci.filter((x) => !x.esito)) {
      const r = risposte?.[v.id];
      if (v.tipo === 'scelta') {
        if (!Number.isInteger(r) || r < 0 || r >= OPZIONI) throw errore(400, 'rispondi a tutte le domande');
        lette.set(v.id, r);
      } else {
        const t = testo(r, MAX_RISPOSTA);
        if (t.length < MIN_RISPOSTA) throw errore(400, `la risposta aperta è troppo corta (almeno ${MIN_RISPOSTA} caratteri)`);
        lette.set(v.id, t);
      }
    }
    return lette;
  }

  // RISPOSTE
  // Con tutte le domande già giuste (es. la lezione non si era generata) basta richiamarla senza risposte
  async function rispondi(prog, dati) {
    const quiz = quizAperti.get(String(dati.id));
    if (!quiz || quiz.progetto !== prog.nome) throw errore(404, 'quiz scaduto: riavvialo');
    if (quiz.occupato) throw errore(409, 'sto già elaborando questo quiz');
    quiz.occupato = true;
    try {
      if (inSospeso(quiz)) await valuta(prog, quiz, leggiRisposte(quiz, dati.risposte));
      if (inSospeso(quiz)) return pubblica(quiz);
      const lezione = await scriviLezione(prog, quiz);
      quizAperti.delete(quiz.id);
      return { ...pubblica(quiz), lezione };
    } finally {
      quiz.occupato = false;
    }
  }

  // VALUTAZIONE
  // Nulla cambia nel quiz finché claude non ha risposto bene: se la chiamata fallisce si può reinviare le stesse risposte
  async function valuta(prog, quiz, risposte) {
    const inAttesa = quiz.voci.filter((v) => !v.esito);
    const giudizio = new Map();
    for (const v of inAttesa.filter((x) => x.tipo === 'scelta')) giudizio.set(v.id, { ok: risposte.get(v.id) === v.corretta, feedback: '' });
    const aperte = inAttesa.filter((v) => v.tipo === 'aperta').map((v) => ({ ...v, risposta: risposte.get(v.id) }));
    const scelteSbagliate = inAttesa.filter((v) => v.tipo === 'scelta' && !giudizio.get(v.id).ok);
    const nuove = new Map();

    if (aperte.length || scelteSbagliate.length) {
      const risultato = await avviaClaude(prog, MODELLO, promptValutazione(quiz, aperte, scelteSbagliate), TIMEOUT_MS, 'quiz');
      const letto = leggiRiga(risultato, 'VALUTAZIONE:');
      for (const v of aperte) {
        const g = letto?.aperte?.[v.id];
        if (typeof g?.ok !== 'boolean') throw errore(502, 'claude non ha valutato tutte le risposte: riprova');
        giudizio.set(v.id, { ok: g.ok, feedback: testo(g.spiegazione, 800) });
      }
      for (const d of Array.isArray(letto?.nuove) ? letto.nuove : []) {
        const sbagliata = inAttesa.find((v) => v.id === d?.sostituisce && !giudizio.get(v.id)?.ok);
        const domanda = sbagliata && !nuove.has(sbagliata.id) ? leggiDomanda(d, 'provvisoria', testo) : null;
        if (domanda && domanda.tipo === sbagliata.tipo) nuove.set(sbagliata.id, domanda);
      }
      if ([...giudizio].some(([id, g]) => !g.ok && !nuove.has(id))) throw errore(502, 'claude non ha scritto le domande nuove: riprova');
    }

    for (const v of inAttesa) {
      const g = giudizio.get(v.id);
      Object.assign(v, { esito: g.ok ? 'ok' : 'no', risposta: risposte.get(v.id), feedback: g.feedback });
    }
    for (const nuova of nuove.values()) quiz.voci.push({ ...nuova, id: idVoce(quiz) });
  }

  // PROMPT LEZIONE
  const promptLezione = (quiz) => [
    'Sei avviato in automatico dalla sala di controllo e nessuno può risponderti. Non modificare nessun file.',
    `Uno sviluppatore ha concluso ${NOMI_ORIGINE[quiz.origine]} e ha superato il quiz di verifica. Scrivi il riassunto da ripassare che finirà nelle sue Lezioni.`,
    'Il testo ha questa forma, in italiano semplice:',
    '- 3-6 punti chiave, uno per riga, ognuno che inizia con "- "',
    '- se nel quiz ha sbagliato qualcosa: una riga vuota, "Da ricordare:" e una riga "- " per ogni errore con la correzione (se non ha sbagliato nulla, niente questa parte)',
    '- una riga vuota e il mini glossario dei termini tecnici nuovi: "termine: significato", uno per riga',
    'Regole: basati solo sul MATERIALE e sulle spiegazioni del quiz, non inventare; mai dati sensibili (token, password, chiavi, dati personali reali); niente titoli né premesse.',
    'L\'ultima riga della risposta deve essere solo questa, con JSON valido su una riga (gli a capo del testo scritti \\n):',
    'LEZIONE: {"testo": "..."}',
    '',
    'MATERIALE:',
    quiz.materia.slice(0, 20000),
    '',
    'QUIZ SVOLTO:',
    ...quiz.voci.map((v) => `--- ${v.tipo === 'scelta' ? 'scelta' : 'aperta'} (${v.esito === 'ok' ? 'giusta' : 'sbagliata'}) ---\nDomanda: ${v.testo}\n${v.tipo === 'scelta'
      ? `Risposta data: ${v.opzioni[v.risposta]}\nGiusta: ${v.opzioni[v.corretta]}\nSpiegazione: ${v.spiegazione}`
      : `Risposta data: ${v.risposta}\nCommento: ${v.feedback}`}`),
  ].join('\n');

  // LEZIONE
  // Il piano si chiude solo dopo che la lezione è salvata: se la generazione fallisce resta aperto e si riprova
  async function scriviLezione(prog, quiz) {
    const risultato = await avviaClaude(prog, MODELLO, promptLezione(quiz), TIMEOUT_MS, 'quiz');
    const corpo = testo(leggiRiga(risultato, 'LEZIONE:')?.testo, 20000);
    if (!corpo) throw errore(502, 'claude ha scritto una lezione vuota: riprova');
    const lezione = salvaLezione({
      titolo: quiz.piano ? quiz.pianoTitolo || quiz.titolo : quiz.titolo, argomento: quiz.argomento, progetto: prog.nome,
      testo: corpo, origine: quiz.origine, piano: quiz.piano,
    });
    if (quiz.piano) terminaPiano(quiz.piano);
    return { id: lezione.id, titolo: lezione.titolo };
  }

  return { avvia, rispondi };
};
