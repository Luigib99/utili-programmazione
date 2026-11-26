// ATTIVITÀ
// Attività dei progetti: creazione, modifica, ordine, eliminazione e messaggi del backend
const crypto = require('crypto');
const { errore, testo, leggiJson, scriviJson, FILE_ATTIVITA } = require('./base');
const { blocchiBackend } = require('./messaggi-backend');

const STATI_ATTIVITA = ['da-fare', 'in-corso', 'fatto', 'atteso-backend'];
const CAMPI_ATTIVITA = { titolo: 200, obiettivo: 5000, problema: 5000, dove: 1000, mappa: 20, note: 5000, branch: 100 };
const MAPPE = ['', 'dati', 'struttura', 'entrambi'];

// ATTIVITÀ
// I campi ricalcano la Richiesta dei piani: "Pianifica" li porta lì senza riscriverli
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

function cambiaBackendAttivita(dati, cambia) {
  const lista = leggiJson(FILE_ATTIVITA);
  const attivita = lista.find((a) => a.id === dati.id);
  if (!attivita) throw errore(404, 'attività non trovata');
  attivita.backend = cambia(blocchiBackend(attivita.backend, attivita.aggiornata));
  attivita.aggiornata = Date.now();
  scriviJson(FILE_ATTIVITA, lista);
  return { backend: attivita.backend };
}

module.exports = {
  STATI_ATTIVITA, CAMPI_ATTIVITA, MAPPE, creaAttivita, riordinaAttivita, aggiornaAttivita,
  eliminaAttivita, cambiaBackendAttivita,
};
