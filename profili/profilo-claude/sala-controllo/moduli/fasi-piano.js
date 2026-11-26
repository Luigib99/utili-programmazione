// FASI DEI PIANI
// Configurazione delle fasi di un piano: campi, guide di scrittura e strumenti di aiuto. Solo dati, nessuna logica di salvataggio

const MAPPE_PIANO = ['dati', 'struttura', 'entrambi'];

// FASI DEI PIANI
// Il ragionamento che un senior fa prima di scrivere codice: la pagina disegna i campi da qui.
// Un unico piano per ogni lavoro. soloBug: la fase serve solo se il lavoro è un bug, altrimenti resta vuota
// I campi facoltativi non bloccano la fase
const FASI_PIANO = [
  {
    id: 'richiesta', nome: 'Richiesta',
    campi: [
      { id: 'obiettivo', nome: 'Obiettivo', aiuto: 'cosa vuoi ottenere, visto da chi usa l\'app; per un bug, cosa dovrebbe succedere', esempio: "Dalle Impostazioni l'utente cambia la lingua dell'app e la vede subito, senza riavviarla." },
      { id: 'cambia', facoltativo: true, nome: 'Cosa deve cambiare rispetto a oggi', aiuto: 'prima succede questo, dopo deve succedere quest\'altro', esempio: "Oggi dopo il login si apre sempre la Dashboard; dopo, deve aprirsi l'ultima sezione usata." },
      { id: 'vincoli', nome: 'Cosa non deve cambiare', facoltativo: true, esempio: "Il flusso di accesso resta com'è: cambia solo cosa si apre dopo il login." },
      { id: 'note', nome: 'Note', aiuto: 'vincoli, dubbi, esempi', facoltativo: true, esempio: "Il backend è già pronto su beta; non so se va gestito anche il caso senza rete." },
    ],
    spunte: [
      { id: 'frase', nome: 'So dire in una frase cosa cambia per chi usa l\'app' },
      { id: 'invariato', nome: 'So cosa NON deve cambiare' },
    ],
  },
  {
    id: 'bug', nome: 'Bug', soloBug: true,
    campi: [
      { id: 'problema', facoltativo: true, nome: 'Problema', aiuto: 'cosa succede invece, su quale piattaforma o dispositivo', esempio: "Su Android 14 il messaggio resta grigio con l'orologio e compare solo riaprendo la chat; su iOS va." },
      { id: 'ambiente', nome: 'Dove lo provi', aiuto: 'dispositivo, sistema, account e dati usati', facoltativo: true, esempio: "Pixel 7, Android 14, account di test." },
      { id: 'passi', nome: 'Passi per riprodurlo', aiuto: 'un passo per riga', facoltativo: true, esempio: "1. apro una chat · 2. spengo il Wi-Fi · 3. invio un messaggio · 4. riaccendo il Wi-Fi." },
      { id: 'quando', nome: 'Quando succede', aiuto: 'sempre, a volte, solo in certi casi', facoltativo: true, esempio: "Sempre al primo invio dopo che la rete torna; dal secondo invio in poi no." },
      { id: 'dove', facoltativo: true, nome: 'Dove pensi che sia', aiuto: 'file e funzione', esempio: "chatService.js, funzione sendMessage, oppure la riconnessione in SocketManager.jsx." },
      { id: 'ipotesi', facoltativo: true, nome: 'La tua ipotesi sulla causa', aiuto: 'perché secondo te succede', esempio: "Quando la rete torna il socket si ricollega, ma il messaggio rimasto in coda non viene rimandato." },
      { id: 'verificato', facoltativo: true, nome: 'Cosa hai verificato', aiuto: 'log, breakpoint, prove fatte e cosa ti hanno detto', esempio: "Con un console.log in sendMessage ho visto che la chiamata parte, ma in quel momento il socket è \"disconnected\"." },
    ],
    spunte: [
      { id: 'nonBug', nome: 'Non è un bug' },
      { id: 'riprodotto', nome: 'L\'ho riprodotto almeno una volta' },
      { id: 'sparito', nome: 'Il bug non si riproduce più' },
    ],
  },
  {
    id: 'indagare', nome: 'Indagare',
    campi: [
      { id: 'come', nome: 'Come funziona adesso', aiuto: 'con parole tue, scritto a testo', esempio: "L'utente preme Accedi, l'app chiama /auth/login e, se va bene, apre sempre la Dashboard." },
      { id: 'zone', nome: 'Zone interessate', aiuto: 'a parole, quali zone dell\'app sono interessate', esempio: "La schermata di accesso, il salvataggio della sessione e la navigazione che si apre subito dopo il login." },
    ],
    spunte: [
      { id: 'provato', nome: 'L\'ho provato di persona com\'è adesso' },
      { id: 'letto', nome: 'Ho letto il codice intorno, non solo il punto che mi interessa' },
      { id: 'cercato', nome: 'Ho cercato se nel progetto esiste già qualcosa di simile' },
    ],
  },
  {
    id: 'progettare', nome: 'Progettare',
    campi: [
      { id: 'modifica', nome: 'La modifica a parole', aiuto: 'cosa cambi, senza scrivere codice', esempio: "Dopo il login leggo l'ultima sezione salvata e, se c'è, apro quella invece della Dashboard." },
      { id: 'alternative', nome: 'Alternative scartate e perché', aiuto: "un'altra strada possibile e perché non la scegli, oppure perché non ce ne sono", esempio: "Salvarla nel backend: scartata, serve solo su questo dispositivo e richiederebbe una API nuova." },
    ],
    spunte: [
      { id: 'minima', nome: 'È la modifica più piccola che fa quello che serve' },
      { id: 'convenzioni', nome: 'Rispetta nomi, cartelle e struttura del progetto' },
    ],
  },
  {
    id: 'codice', nome: 'Codice',
    campi: [
      { id: 'chiamate', nome: 'Chiamate al backend', facoltativo: true, chiamate: true },
      { id: 'file', nome: 'File', facoltativo: true, elencoFile: true },
    ],
    spunte: [],
  },
  {
    id: 'rischi', nome: 'Rischi',
    campi: [
      { id: 'limite', nome: 'Casi limite', facoltativo: true, soloPulsanti: true, aiuto: 'scegli cosa deve succedere in ogni situazione che riguarda la tua modifica', esempio: "Sezione salvata che non esiste più (es. \"Gestione utenti\" per chi non è ADMG); primo accesso senza nulla di salvato." },
      { id: 'sicurezza', nome: 'Sicurezza e dati', facoltativo: true, opzioneVuoto: { nome: 'Non salvo dati', testo: 'Nessun dato salvato' }, aiuto: 'quali dati salvi, dove e chi li legge', esempio: "Salvo solo il nome della sezione, niente token né dati dell'utente; al logout lo cancello." },
    ],
    spunte: [
      { id: 'chiamanti', nome: 'Ho controllato chi altro usa quello che cambio' },
      { id: 'errori', nome: 'Ho pensato a cosa succede quando qualcosa va storto' },
    ],
  },
  {
    id: 'verifica', nome: 'Verifica',
    campi: [
      { id: 'prova', nome: 'Come provi che funziona', aiuto: 'passi manuali o test automatici', esempio: "Login, vado in Agenda, chiudo l'app e rientro: si apre Agenda. Poi lo stesso con un utente non ADMG." },
      { id: 'finito', nome: 'Quando è davvero finito', aiuto: 'criteri concreti, non "quando sembra andare"', esempio: "Va su Android e iOS, il primo accesso apre la Dashboard, il logout cancella la sezione salvata." },
    ],
    spunte: [
      { id: 'richiesto', nome: 'Fa quello che chiedeva la Richiesta' },
      { id: 'resto', nome: 'Le parti collegate funzionano ancora' },
    ],
  },
];

// GUIDA ALLA SCRITTURA
// Per ogni campo dei piani: forma del testo (elenco puntato, passi numerati o traccia da completare),
// come scriverlo e quali controlli fa la pagina mentre scrivi. I controlli sono locali: non costano token.
// forma: "elenco" (•) o "passi" (1. 2. …); traccia: testo di partenza da completare;
// controlli: "vago" (parole come "sistemo", "non va"), "file" (serve un file o una funzione), "breve" (troppo corto)
const GUIDA_CAMPI = {
  'richiesta.obiettivo': { guida: ['Cosa potrà fare chi usa l\'app dopo la modifica, che oggi non può fare. Per un bug: cosa dovrebbe succedere.'], controlli: ['vago', 'breve'] },
  'richiesta.cambia': { traccia: 'Oggi: \nDopo: ', guida: ['Cosa succede oggi e cosa deve succedere dopo, visto da chi usa l\'app.'], controlli: ['vago'] },
  'bug.problema': { traccia: 'Cosa succede: \nDispositivo e piattaforma: \nDa quando (se lo sai): ', guida: ['Cosa vedi succedere e su quale dispositivo, non la causa che immagini.'], controlli: ['vago'] },
  'richiesta.vincoli': { guida: ['Ciò che deve restare com\'è, una cosa per riga.'] },
  'richiesta.note': { guida: ['Vincoli, dubbi o esempi; va bene anche ciò che non sai.'] },
  'indagare.come': { guida: ['Come funziona adesso, scritto a parole, in modo che si capisca anche senza il codice davanti.'], controlli: ['breve'] },
  'indagare.zone': { guida: ['Spiega a parole quali zone dell\'app (schermate, flussi, servizi) sono interessate e perché.'], controlli: ['vago', 'breve'] },
  'bug.ambiente': { guida: ['Dispositivo, sistema, account e dati usati per provarlo.'] },
  'bug.passi': { forma: 'passi', guida: ['Cosa tocchi o digiti, un passo per riga, fino a vedere il problema.'] },
  'bug.quando': { guida: ['Se succede sempre, a volte o solo in certi casi.'], controlli: ['vago'] },
  'bug.dove': { guida: ['File e funzione dove pensi sia il problema, dal più probabile.'], controlli: ['file'] },
  'bug.ipotesi': { guida: ['Perché secondo te succede, in una frase che puoi verificare.'], controlli: ['vago'] },
  'bug.verificato': { guida: ['Le prove fatte e cosa hanno mostrato, una per riga.'] },
  'progettare.modifica': { guida: ['Cosa cambi, a parole, senza scrivere codice.'], controlli: ['vago', 'breve'] },
  'codice.chiamate': { guida: ['Vuoto = il piano non coinvolge il backend. Con + aggiungi una chiamata: NUOVA (il backend deve crearla), MODIFICA (cambia: prima e dopo) o ESISTENTE (c\'è già e la usi così com\'è).'] },
  'codice.file': { guida: ['Vuoto = nessun file coinvolto. Con + aggiungi un file: NUOVO (lo crei tu), MODIFICA (esiste e cambia) o ESISTENTE (esiste e lo usi così com\'è). Dentro ogni file, con + aggiungi le funzioni che ti interessano.'] },
  'progettare.alternative': {
    traccia: 'Alternativa 1: \nPerché la scarto: ',
    tutte: true,
    guida: ['Un\'altra strada possibile e perché non la scegli; se non ce ne sono scrivi "Unica strada:" e il motivo.'],
  },
  'rischi.limite': {
    traccia: 'Valore vuoto o mancante: \nErrore di rete o del server: \nUtente senza permessi o con ruolo diverso: \nDoppio tocco o azione ripetuta: \nApp messa in background o chiusa a metà: ',
    guida: ['Per ogni situazione scegli cosa deve succedere; salta quelle che non c\'entrano con la tua modifica.'],
  },
  'rischi.sicurezza': {
    traccia: 'Cosa salvo e dove: \nChi può leggerlo: \nCosa resta dopo il logout: ',
    guida: ['Se non salvi niente premi «Non salvo dati»; altrimenti scrivi cosa salvi e dove, chi può leggerlo e cosa resta dopo il logout.'],
  },
  'verifica.prova': { forma: 'passi', guida: ['I passi per provare che funziona, con cosa devi vedere alla fine.'] },
  'verifica.finito': { guida: ['I criteri per dire "finito", ciascuno controllabile con un sì o un no.'], controlli: ['vago'] },
};
// RIPRENDI DA
// Un campo si può partire dal testo già scritto in un altro: il tasto compare solo a campo vuoto e con la fonte compilata
const RIPRENDI_DA = {
};

// STRUMENTI DEI CAMPI
// Cosa può fare la pagina per te invece di chiederti di scrivere a memoria:
// codice = VEDI NEL CODICE (cerca il nome nel progetto e apre VS Code), riempi = mette i file trovati nel campo,
// diagramma = VEDI NEL DIAGRAMMA (apre la mappa sul passo D/S citato), domanda = CHIEDI A CHATTINO (domanda già scritta, la invii tu),
// scelte = risposte rapide a pulsante per le righe del campo
const CASI_LIMITE = [
  ['Valore vuoto o mancante', ['non succede nulla', 'mostra un errore', 'usa un valore di default']],
  ['Errore di rete o del server', ['mostra un errore', 'riprova da solo', 'non succede nulla']],
  ['Utente senza permessi o con ruolo diverso', ['non vede la funzione', 'riceve un errore', 'si comporta come prima']],
  ['Doppio tocco o azione ripetuta', ['la seconda viene ignorata', 'si ripete due volte']],
  ['App messa in background o chiusa a metà', ['riprende da dove era', 'riparte da zero']],
].map(([titolo, opzioni]) => ({ titolo, opzioni: [...opzioni, 'non applicabile', 'da provare'] }));

const STRUMENTI_CAMPI = {
  'indagare.zone': { codice: true, diagramma: true, domanda: 'Quali zone dell\'app sono interessate dal comportamento di questo piano? Spiegamelo a parole, senza elenchi. Cerca nel codice.' },
  'indagare.come': { diagramma: true },
  'bug.dove': { codice: true },
  'codice.chiamate': { domanda: 'Per la modifica di questo piano: quali chiamate al backend servono? Una riga per chiamata: NUOVA, MODIFICA (prima e dopo) o ESISTENTE, con metodo, rotta, body o params e cosa fa. Se non ne servono dimmelo.' },
  'codice.file': { codice: true },
  'progettare.alternative': { domanda: 'Che alternative ha la modifica di questo piano? Massimo 3, ognuna con "Perché la scarto". Dimmi quale consiglieresti.' },
  'rischi.limite': { scelte: CASI_LIMITE, domanda: 'Per la modifica di questo piano: cosa succede oggi, nel codice, con valore vuoto, errore di rete, ruolo diverso, doppio tocco, app in background? Una riga per caso.' },
  'rischi.sicurezza': {
    scelte: [
      { titolo: 'Cosa salvo e dove', opzioni: ['solo in memoria', 'AsyncStorage', 'Keychain', 'backend'] },
      { titolo: 'Chi può leggerlo', opzioni: ['solo l\'utente', 'anche il backend', 'altri utenti', 'nessuno'] },
      { titolo: 'Cosa resta dopo il logout', opzioni: ['niente (viene cancellato)', 'resta sul telefono', 'da verificare'] },
    ],
    domanda: 'La modifica di questo piano salva dati? Cosa, dove (memoria, AsyncStorage, Keychain, backend), chi può leggerli e cosa resta dopo il logout?',
  },
};

FASI_PIANO.forEach((f) => f.campi.forEach((c) => Object.assign(c, GUIDA_CAMPI[`${f.id}.${c.id}`], STRUMENTI_CAMPI[`${f.id}.${c.id}`], RIPRENDI_DA[`${f.id}.${c.id}`] ? { riprendi: RIPRENDI_DA[`${f.id}.${c.id}`] } : {})));

module.exports = { FASI_PIANO, MAPPE_PIANO };
