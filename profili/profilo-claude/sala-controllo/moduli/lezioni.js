// LEZIONI
// Lezioni generate a quiz superato: salvataggio in dati/lezioni.json e riscrittura di ~/Lezioni.md
const fs = require('fs');
const crypto = require('crypto');
const { errore, testo, leggiJson, scriviJson, giorno, FILE_LEZIONI, FILE_LEZIONI_MD } = require('./base');

// Si generano solo a quiz superato (quiz-lezione.js), da Chattino insegnante o dal piano da terminare, e stanno in dati/lezioni.json.
// ~/Lezioni.md si riscrive da solo a ogni cambiamento, le più recenti in alto: è generato, non va modificato a mano
const ORIGINI_LEZIONE = ['chattino', 'piano'];
const NOMI_ORIGINE_LEZIONE = { chattino: 'Chattino', piano: 'Piano', lezione: 'Lezione' };

function elencoLezioni() {
  return leggiJson(FILE_LEZIONI).filter((l) => l && l.titolo).map((l) => ({
    id: l.id, origine: ORIGINI_LEZIONE.includes(l.origine) ? l.origine : 'lezione', data: l.data, progetto: l.progetto || '', titolo: l.titolo,
    parti: [['Argomento', l.argomento], ['', l.testo]].filter(([, v]) => String(v || '').trim()),
  })).sort((a, b) => b.data - a.data);
}

function scriviLezioni() {
  const blocchi = elencoLezioni().map((l) => [
    `## ${giorno(l.data)} · ${NOMI_ORIGINE_LEZIONE[l.origine]}: ${l.titolo}${l.progetto ? ` (${l.progetto})` : ''}`,
    '',
    ...l.parti.map(([nome, valore]) => (nome ? `**${nome}**\n\n${String(valore).trim()}\n` : `${String(valore).trim()}\n`)),
  ].join('\n'));
  const md = [
    '# Lezioni',
    '',
    '> Generato dalla sala di controllo (sezione Lezioni), le più recenti in alto. Non modificarlo a mano: si riscrive da solo.',
    '',
    blocchi.length ? blocchi.join('\n---\n\n') : '_Ancora nessuna lezione._\n',
  ].join('\n');
  const temporaneo = `${FILE_LEZIONI_MD}.tmp`;
  fs.writeFileSync(temporaneo, md);
  fs.renameSync(temporaneo, FILE_LEZIONI_MD);
}

// Una lezione di piano sostituisce la precedente dello stesso piano: succede se lo riapri e lo termini di nuovo
function aggiungiLezione(dati) {
  const titolo = testo(dati?.titolo, 200);
  if (!titolo) throw errore(400, 'il titolo della lezione è obbligatorio');
  if (!ORIGINI_LEZIONE.includes(dati.origine)) throw errore(400, 'origine della lezione non valida');
  const lezione = {
    id: crypto.randomUUID(), data: Date.now(), origine: dati.origine, titolo, argomento: testo(dati.argomento, 1000),
    progetto: testo(dati.progetto, 200), testo: testo(dati.testo, 20000), ...(dati.piano ? { piano: dati.piano } : {}),
  };
  const altre = leggiJson(FILE_LEZIONI).filter((l) => !lezione.piano || l.piano !== lezione.piano);
  scriviJson(FILE_LEZIONI, [...altre, lezione]);
  scriviLezioni();
  return lezione;
}

function eliminaLezione(id) {
  const lista = leggiJson(FILE_LEZIONI);
  if (!lista.some((l) => l.id === id)) throw errore(404, 'lezione non trovata');
  scriviJson(FILE_LEZIONI, lista.filter((l) => l.id !== id));
  scriviLezioni();
  return { eliminata: id };
}

module.exports = { elencoLezioni, scriviLezioni, aggiungiLezione, eliminaLezione };
