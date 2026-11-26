// MESSAGGI BACKEND
// Blocchi di messaggio del backend, condivisi da attività e piani
const crypto = require('crypto');
const { errore, testo } = require('./base');

// Una lista di blocchi { id, testo, data }: ognuno si aggiunge e si elimina da solo.
// Il vecchio testo unico diventa il blocco "primo": un id fisso, perché questa conversione si ripete a ogni lettura finché non si salva
const blocchiBackend = (valore, data) => {
  if (Array.isArray(valore)) return valore.filter((b) => b && typeof b.testo === 'string' && b.testo.trim() && typeof b.id === 'string');
  return typeof valore === 'string' && valore.trim() ? [{ id: 'primo', testo: valore.trim(), data: data || Date.now() }] : [];
};

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

module.exports = { blocchiBackend, conBlocco, senzaBlocco };
