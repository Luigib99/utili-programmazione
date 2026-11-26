// ROTTE DELLA SALA
// Azioni che la pagina può chiamare (/api/...), risposta JSON e lettura del corpo delle richieste
const path = require('path');
const { errore, testo, leggiJson, scriviJson, barre, CARTELLA_CLAUDE, CARTELLA_DATI, FILE_ATTIVITA, FILE_QUIZ, FILE_LEZIONI_MD } = require('./base');
const { GIT_SICURO, elencoBranch, commitBranch, committaTutto, tornaACommit, cambiaBranch, creaBranch, eliminaBranch } = require('./git');
const { progetti, progetto, scegliCartella, aggiungiDaPagina, rimuoviProgetto } = require('./progetti');
const { elencoSessioni, eliminaSessione, archiviaSessione, chiudiSessione } = require('./sessioni');
const { trovaClaude, avviaClaude } = require('./claude');
const { blocchiBackend, conBlocco, senzaBlocco } = require('./messaggi-backend');
const { creaAttivita, riordinaAttivita, aggiornaAttivita, eliminaAttivita, cambiaBackendAttivita } = require('./attivita');
const { FASI_PIANO } = require('./fasi-piano');
const { piani, creaPiano, aggiornaPiano, eliminaPiano, aggiungiBackend, eliminaBackend, materialePiano, terminaPiano } = require('./piani');
const { generaMappa } = require('./mappe');
const { generaSintesi, compilaRichiesta } = require('./richiesta');
const { elencoLezioni, eliminaLezione, aggiungiLezione } = require('./lezioni');
const { contestiDi, eliminaContesto } = require('./contesti');
const consumi = require(path.join(CARTELLA_CLAUDE, 'shared', 'consumi-claude.js'));

const MAX_BODY = 64 * 1024;

const letturaCodice = require('../lettura-codice/server')({ gitSicuro: GIT_SICURO });
const catalogo = require('../lettura-codice/catalogo')({ lettura: letturaCodice, trovaClaude, cartellaDati: CARTELLA_DATI, registraConsumo: consumi.registra });

const quiz = require('../quiz-lezione')({
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

module.exports = { AZIONI, rispondi, leggiCorpo };
