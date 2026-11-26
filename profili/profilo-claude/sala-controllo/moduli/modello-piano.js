// MODELLO DEL PIANO
// Forma di un piano: piano vuoto e adattamento dei piani salvati con versioni precedenti delle fasi
const { FASI_PIANO, MAPPE_PIANO } = require('./fasi-piano');
const { blocchiBackend } = require('./messaggi-backend');

function pianoVuoto() {
  return Object.fromEntries(FASI_PIANO.map((f) => [f.id, {
    campi: Object.fromEntries(f.campi.map((c) => [c.id, ''])),
    spunte: Object.fromEntries(f.spunte.map((s) => [s.id, false])),
  }]));
}

// I piani salvati prima di una fase o di un campo nuovo ricevono le parti mancanti vuote
function completaPiano(piano) {
  const vuoto = pianoVuoto();
  const fasi = Object.fromEntries(FASI_PIANO.map((f) => [f.id, {
    campi: { ...vuoto[f.id].campi, ...piano.fasi?.[f.id]?.campi },
    spunte: { ...vuoto[f.id].spunte, ...piano.fasi?.[f.id]?.spunte },
  }]));
  // I piani nati con i tipi: il comportamento atteso o "cosa cambiare" diventano l'Obiettivo
  const vecchi = piano.fasi || {};
  const vecchiRichiesta = vecchi.richiesta?.campi || {};
  if (!String(fasi.richiesta.campi.obiettivo || '').trim()) fasi.richiesta.campi.obiettivo = vecchiRichiesta.atteso || vecchiRichiesta.cosa || '';
  // I campi solo bug stavano in Richiesta, Com'è oggi, Indagare e Riprodurre: ora sono tutti nella fase Bug
  const doveStavano = { problema: ['richiesta'], ambiente: ['oggi', 'riprodurre'], passi: ['oggi', 'riprodurre'], quando: ['oggi', 'riprodurre'], dove: ['indagare'], ipotesi: ['indagare'], verificato: ['indagare'] };
  for (const [id, fasiVecchie] of Object.entries(doveStavano)) {
    if (String(fasi.bug.campi[id] || '').trim()) continue;
    const fase = fasiVecchie.find((f) => String(vecchi[f]?.campi?.[id] || '').trim());
    fasi.bug.campi[id] = fase ? vecchi[fase].campi[id] : '';
  }
  // Com'è oggi e Indagare sono confluite in Indagare: Come funziona adesso e Zone interessate
  const oggi = vecchi.oggi?.campi || {};
  const indagare = vecchi.indagare?.campi || {};
  if (!String(fasi.indagare.campi.come || '').trim()) fasi.indagare.campi.come = oggi.come || '';
  if (!String(fasi.indagare.campi.zone || '').trim()) fasi.indagare.campi.zone = [indagare.file, oggi.chi, indagare.posizione, indagare.dipendenze].filter((x) => String(x || '').trim()).join('\n');
  const { branch, tipo, ...resto } = piano;
  return {
    ...resto,
    mappa: MAPPE_PIANO.includes(piano.mappa) ? piano.mappa : '',
    mappe: Array.isArray(piano.mappe) ? piano.mappe : [],
    backend: blocchiBackend(piano.backend, piano.aggiornato),
    terminato: piano.terminato === true,
    terminatoIl: piano.terminato === true && Number.isFinite(piano.terminatoIl) ? piano.terminatoIl : null,
    // Come le attività: da fare, in corso, fatto. "Fatto" coincide con terminato
    stato: piano.terminato === true ? 'fatto' : ['da-fare', 'in-corso'].includes(piano.stato) ? piano.stato : 'da-fare',
    fasi,
  };
}

module.exports = { pianoVuoto, completaPiano };
