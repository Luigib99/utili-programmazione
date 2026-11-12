// Controllo di una mappa appena generata contro il codice: righe, nomi, frecce e rami.
// Gratis e locale: trova righe sbagliate, passi mancanti e frecce rotte, non errori di significato.
const fs = require('fs');
const path = require('path');

const MARGINE_RIGHE = 3;
const MAX_AVVISI = 30;
const IDENTIFICATORE_GLOBALE = /[A-Za-z_$][\w$]*/g;
const DIRAMAZIONE = /\b(return|throw|if|else|case|default|catch|break|continue|resolve|reject)\b|\?|&&|\|\|/;

// FILE DEL CODICE
// Ogni file si legge una volta sola per controllo; un file che non si legge vale come mancante
function lettore() {
  const letti = new Map();
  return (percorso) => {
    const chiave = path.resolve(String(percorso));
    if (!letti.has(chiave)) {
      try {
        letti.set(chiave, fs.statSync(chiave).isFile() ? fs.readFileSync(chiave, 'utf8').split(/\r?\n/) : null);
      } catch {
        letti.set(chiave, null);
      }
    }
    return letti.get(chiave);
  };
}

const nomeFile = (percorso) => String(percorso).split(/[\\/]/).pop();

const RISALITA_RIGHE = 400;
const esc = (nome) => nome.replace(/\$/g, '\\$');

// NOMI DA CERCARE
// Da "AsyncStorage.getItem" o "enableBiometric (catch)" i nomi del codice; una descrizione a parole ("eventi di presenza") non si controlla
function nomiDelCodice(testo) {
  const primo = String(testo || '').trim().split(/\s+/)[0] || '';
  const nomi = primo.match(/[A-Za-z_$][\w$]*/g) || [];
  const sembraCodice = !/\s/.test(String(testo).trim()) || /[A-Z_$\d.(]/.test(primo);
  return sembraCodice ? nomi : [];
}

// Il nome compare come parola intera vicino alla riga, oppure la riga sta dentro la sua funzione:
// risalendo si trova la sua dichiarazione o la sua chiamata (es. un catch dentro enableBiometric, il corpo di un useEffect)
function nomeTrovato(righe, riga, nome) {
  const parola = new RegExp(`(^|[^\\w$])${esc(nome)}([^\\w$]|$)`);
  for (let r = Math.max(1, riga - MARGINE_RIGHE); r <= Math.min(righe.length, riga + MARGINE_RIGHE); r++) {
    if (parola.test(righe[r - 1])) return true;
  }
  const inizio = new RegExp(`(function\\s*\\*?\\s*${esc(nome)}\\b|\\b(const|let|var|class)\\s+${esc(nome)}\\b|(^|[^\\w$.])${esc(nome)}\\s*[:=(])`);
  for (let r = riga - MARGINE_RIGHE - 1; r >= Math.max(1, riga - RISALITA_RIGHE); r--) {
    if (inizio.test(righe[r - 1])) return true;
  }
  return false;
}

// RIGA E NOME
// Restituisce il motivo del problema, o null se path, riga e nome tornano (basta uno dei nomi)
function controllaRiga(leggi, percorso, riga, nomi = []) {
  const righe = leggi(percorso);
  if (!righe) return `il file ${nomeFile(percorso)} non esiste`;
  const n = Number(riga);
  if (!Number.isInteger(n) || n < 1 || n > righe.length) return `la riga ${riga} non esiste in ${nomeFile(percorso)} (${righe.length} righe)`;
  if (nomi.length && !nomi.some((nome) => nomeTrovato(righe, n, nome))) {
    return `la riga ${n} di ${nomeFile(percorso)} non è in \`${nomi.join('.')}\` né vicino al suo nome: forse il codice è cambiato o la riga è sbagliata`;
  }
  return null;
}

// MAPPA DATI
// Le frecce si ricostruiscono con le stesse regole del template: uscite esplicite, altrimenti verso il passo dopo
function controllaFlusso(dati, leggi) {
  const avvisi = [];
  const nodi = Array.isArray(dati.nodes) ? dati.nodes : [];
  const etichetta = (i) => `D${i + 1}${nodi[i].element ? ` (\`${nodi[i].element}\`)` : ''}`;
  const indiceDi = (verso) => {
    const perId = nodi.findIndex((n) => n.id && n.id === verso);
    if (perId >= 0) return perId;
    const numero = Number(String(verso).replace(/^D/i, ''));
    return Number.isInteger(numero) && numero >= 1 && numero <= nodi.length ? numero - 1 : -1;
  };
  const isFine = (n) => n.tipo === 'fine';
  const isBivio = (n) => n.tipo === 'bivio';
  const entranti = new Set();

  nodi.forEach((nodo, i) => {
    if (Array.isArray(nodo.uscite)) {
      if (isBivio(nodo) && nodo.uscite.length < 2) avvisi.push(`${etichetta(i)}: è un bivio ma ha ${nodo.uscite.length} uscita`);
      if (!nodo.uscite.length && !isFine(nodo)) avvisi.push(`${etichetta(i)}: non porta da nessuna parte (nessuna uscita e non è una fine)`);
      nodo.uscite.forEach((u) => {
        const nome = u.etichetta ? `l'uscita «${u.etichetta}»` : 'un\'uscita';
        const meta = indiceDi(u.verso);
        if (meta < 0) avvisi.push(`${etichetta(i)}: ${nome} va verso «${u.verso}», che non è un passo della mappa`);
        else if (meta === i) avvisi.push(`${etichetta(i)}: ${nome} torna su sé stessa`);
        else entranti.add(meta);
        if (!isBivio(nodo) || !nodo.path) return;
        if (u.riga === undefined || u.riga === null || u.riga === '') return avvisi.push(`${etichetta(i)}: ${nome} non dice da che riga del codice parte`);
        const problema = controllaRiga(leggi, nodo.path, u.riga);
        if (problema) return avvisi.push(`${etichetta(i)}: ${nome}: ${problema}`);
        const righe = leggi(nodo.path);
        const vicine = righe.slice(Math.max(0, u.riga - 3), Math.min(righe.length, Number(u.riga) + 2)).join('\n');
        if (!DIRAMAZIONE.test(vicine)) avvisi.push(`${etichetta(i)}: ${nome} parte dalla riga ${u.riga}, ma lì il codice non cambia strada (niente if, return, throw…)`);
      });
    } else if (isBivio(nodo)) {
      avvisi.push(`${etichetta(i)}: è un bivio ma non ha uscite`);
    } else {
      const dopo = nodi[i + 1];
      if (!isFine(nodo) && (!dopo || dopo.section)) avvisi.push(`${etichetta(i)}: è l'ultimo passo del suo ramo ma non è una pillola di fine`);
      if (dopo && !dopo.section && !isFine(nodo)) entranti.add(i + 1);
    }

    if (nodo.path && nodo.line !== undefined && !isFine(nodo)) {
      const problema = controllaRiga(leggi, nodo.path, nodo.line, nomiDelCodice(nodo.element));
      if (problema) avvisi.push(`${etichetta(i)}: ${problema}`);
    } else if (nodo.path && !isFine(nodo)) {
      if (!leggi(nodo.path)) avvisi.push(`${etichetta(i)}: il file ${nomeFile(nodo.path)} non esiste`);
    }
  });

  nodi.forEach((nodo, i) => {
    if (i > 0 && !nodo.section && !entranti.has(i)) avvisi.push(`${etichetta(i)}: nessuna freccia arriva a questo passo`);
  });

  for (const [nome, rif] of Object.entries(dati.codice || {})) {
    if (!rif?.path) continue;
    const problema = controllaRiga(leggi, rif.path, rif.line, nome.match(IDENTIFICATORE_GLOBALE) || []);
    if (problema) avvisi.push(`link \`${nome}\`: ${problema}`);
  }
  return avvisi;
}

// MAPPA STRUTTURA
// Numeri S assegnati come nel template: schermata per schermata, prima un elemento poi i suoi figli
function controllaStruttura(dati, leggi) {
  const avvisi = [];
  let numero = 0;
  const visita = (el) => {
    if (!el || typeof el !== 'object') return;
    numero += 1;
    if (el.path && el.line !== undefined) {
      const nomi = /^[A-Za-z_$][\w$]*$/.test(String(el.name || '')) ? [el.name] : [];
      const problema = controllaRiga(leggi, el.path, el.line, nomi);
      if (problema) avvisi.push(`S${numero}${el.name ? ` (\`${el.name}\`)` : ''}: ${problema}`);
    }
    (Array.isArray(el.children) ? el.children : []).forEach(visita);
  };
  (Array.isArray(dati.screens) ? dati.screens : []).forEach((s) => visita(s.root));
  return avvisi;
}

function controllaMappa(tipo, dati) {
  const leggi = lettore();
  const avvisi = tipo === 'dati' ? controllaFlusso(dati, leggi) : controllaStruttura(dati, leggi);
  return avvisi.length > MAX_AVVISI ? [...avvisi.slice(0, MAX_AVVISI), `…e altri ${avvisi.length - MAX_AVVISI} avvisi`] : avvisi;
}

module.exports = { controllaMappa };
