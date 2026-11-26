// CONTESTI
// Passaggio tra una chat e la successiva: /chat-termina lo salva, /chat-riprendi lo rilegge
const crypto = require('crypto');
const { errore, testo, leggiJson, scriviJson, giorno, FILE_CONTESTI } = require('./base');

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

module.exports = { aggiungiContesto, eliminaContesto, contestiDi, testoContesto };
