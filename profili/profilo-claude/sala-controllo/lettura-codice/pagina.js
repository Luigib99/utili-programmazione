// Lettura codice: albero dei file, codice colorato e aiuti calcolati in locale (struttura, riferimenti, suggerimenti).
// Si carica prima dello script di pagina.html e ne usa stato, api, esc, memoria e avvisa solo quando viene chiamato.
// Espone solo LetturaCodice: tutto il resto resta chiuso qui dentro per non scontrarsi con i nomi della pagina.
const LetturaCodice = (() => {
  const MAX_FILTRATI = 200;
  const RIGHE_FILE_LUNGO = 400;
  const RIGHE_FUNZIONE_LUNGA = 150;

  // DIZIONARIO
  // [titolo, spiegazione, esempio]: compare passando il mouse sulla parola
  const PAROLE = {
    import: ['import', 'Porta in questo file qualcosa esportato da un altro file o da un pacchetto npm.', "import { useState } from 'react';"],
    export: ['export', 'Rende disponibile questa funzione/variabile agli altri file, che potranno importarla.', 'export function somma(a, b) { … }'],
    default: ['export default', "L'esportazione principale del file: chi importa può darle il nome che vuole, senza graffe.", "import Login from './Login';"],
    from: ['from', 'Indica il file o il pacchetto da cui arriva ciò che si importa.'],
    as: ['as', "Rinomina ciò che si importa o esporta (o, in TypeScript, forza un tipo)."],
    const: ['const', 'Dichiara una variabile che non può essere riassegnata. Se contiene un oggetto o un array, il contenuto si può comunque modificare.', 'const MAX = 10;'],
    let: ['let', 'Dichiara una variabile che può essere riassegnata, visibile solo nel blocco { } in cui nasce.', 'let tentativi = 0;'],
    var: ['var', 'Vecchio modo di dichiarare variabili: ignora i blocchi { }. Oggi si usa let o const.'],
    function: ['function', 'Dichiara una funzione con un nome. A differenza delle arrow function ha un proprio this.', 'function saluta(nome) { return `Ciao ${nome}`; }'],
    return: ['return', 'Esce dalla funzione e restituisce il valore indicato. In un componente React restituisce il JSX da disegnare.'],
    async: ['async', 'La funzione restituisce sempre una Promise e al suo interno si può usare await.', 'async function carica() { const r = await fetch(url); }'],
    await: ['await', 'Aspetta che la Promise finisca e ne restituisce il risultato; se fallisce lancia un errore da gestire con try/catch.'],
    if: ['if', 'Esegue il blocco solo se la condizione è vera.'],
    else: ['else', 'Blocco eseguito quando la condizione dell\'if è falsa.'],
    for: ['for', 'Ciclo: ripete il blocco. "for (const x of lista)" scorre i valori di un array.'],
    of: ['of', 'Nel for…of scorre i valori di un array, di una stringa, di un Map o di un Set.'],
    in: ['in', 'Nel for…in scorre le chiavi di un oggetto; "chiave in oggetto" controlla se la chiave esiste.'],
    while: ['while', 'Ripete il blocco finché la condizione è vera.'],
    switch: ['switch', 'Sceglie tra più casi in base al valore; ogni case di solito finisce con break o return.'],
    case: ['case', 'Un ramo dello switch.'],
    break: ['break', 'Esce subito dal ciclo o dallo switch.'],
    continue: ['continue', 'Salta al giro successivo del ciclo.'],
    try: ['try', 'Esegue il blocco e, se qualcosa lancia un errore, passa al catch invece di bloccare tutto.'],
    catch: ['catch', 'Riceve l\'errore lanciato nel try. Lasciarlo vuoto nasconde i problemi.'],
    finally: ['finally', 'Blocco eseguito sempre, sia se il try va bene sia se finisce nel catch (es. per togliere un caricamento).'],
    throw: ['throw', 'Lancia un errore: l\'esecuzione si interrompe fino al primo catch.', "throw new Error('password errata');"],
    new: ['new', 'Crea un oggetto a partire da una classe o un costruttore.', 'new Date()'],
    class: ['class', 'Modello per creare oggetti con dati e metodi. In React moderno si usano quasi sempre le funzioni.'],
    extends: ['extends', 'La classe eredita dati e metodi da un\'altra classe.'],
    this: ['this', 'L\'oggetto "proprietario" della funzione in esecuzione. Le arrow function non ne hanno uno proprio: usano quello esterno.'],
    typeof: ['typeof', 'Restituisce il tipo di un valore come stringa: "string", "number", "object", "function", "undefined"…'],
    instanceof: ['instanceof', 'Controlla se un oggetto è stato creato da una certa classe.'],
    null: ['null', 'Valore "vuoto" scelto di proposito.'],
    undefined: ['undefined', 'Valore di una variabile mai assegnata o di una proprietà che non esiste.'],
    delete: ['delete', 'Toglie una proprietà da un oggetto.'],
    yield: ['yield', 'Nei generatori (function*) restituisce un valore e mette in pausa la funzione.'],
    interface: ['interface (TS)', 'Descrive la forma di un oggetto: quali campi ha e di che tipo.'],
    type: ['type (TS)', 'Dà un nome a un tipo, anche composto (unioni, intersezioni…).'],
    enum: ['enum (TS)', 'Insieme di costanti con un nome.'],
    // React
    useState: ['useState (React)', 'Crea uno stato del componente: restituisce [valore, funzioneCheLoCambia]. Cambiarlo fa ridisegnare il componente.', 'const [aperto, setAperto] = useState(false);'],
    useEffect: ['useEffect (React)', 'Esegue codice DOPO il disegno (chiamate al server, timer, listener). Il secondo argomento è l\'array delle dipendenze: [] = solo all\'inizio, [x] = quando cambia x, assente = a ogni render. Se restituisce una funzione, quella pulisce.', 'useEffect(() => { const t = setInterval(f, 1000); return () => clearInterval(t); }, []);'],
    useLayoutEffect: ['useLayoutEffect (React)', 'Come useEffect ma gira prima che il browser mostri il disegno: serve per misurare il DOM. Più lento, usalo solo se serve.'],
    useMemo: ['useMemo (React)', 'Ricorda il risultato di un calcolo pesante e lo rifà solo quando cambiano le dipendenze.', 'const filtrati = useMemo(() => lista.filter(f), [lista]);'],
    useCallback: ['useCallback (React)', 'Ricorda una funzione tra un render e l\'altro, così i figli che la ricevono non si ridisegnano inutilmente.'],
    useRef: ['useRef (React)', 'Una "scatola" che conserva un valore tra i render senza ridisegnare quando cambia; spesso punta a un elemento del DOM (ref.current).'],
    useContext: ['useContext (React)', 'Legge un valore condiviso (Context) senza passarlo come prop da un componente all\'altro.'],
    useReducer: ['useReducer (React)', 'Alternativa a useState per stati complessi: le modifiche passano da una funzione reducer(stato, azione).'],
    useId: ['useId (React)', 'Genera un id unico e stabile, utile per collegare label e input.'],
    useTransition: ['useTransition (React)', 'Segna un aggiornamento come non urgente, così l\'interfaccia resta reattiva.'],
    createContext: ['createContext (React)', 'Crea un Context: un contenitore di dati condivisi da leggere con useContext.'],
    memo: ['memo (React)', 'Evita di ridisegnare il componente se le sue props non cambiano.'],
    forwardRef: ['forwardRef (React)', 'Permette a un componente di ricevere una ref e passarla a un suo elemento interno.'],
    Fragment: ['Fragment (React)', 'Raggruppa più elementi senza aggiungere un div. Forma breve: <> … </>.'],
    Suspense: ['Suspense (React)', 'Mostra un contenuto di attesa (fallback) mentre i figli caricano.'],
    lazy: ['lazy (React)', 'Carica il codice di un componente solo quando serve, per alleggerire il primo caricamento.'],
    createPortal: ['createPortal (React)', 'Disegna i figli in un altro punto del DOM (tipico per modali e popup).'],
    props: ['props', 'I dati che il componente padre passa a questo componente, come gli attributi di un tag HTML.'],
    children: ['children', 'Prop speciale: il contenuto messo tra il tag di apertura e quello di chiusura del componente.'],
    key: ['key', 'Identificatore che React usa per riconoscere gli elementi di una lista tra un render e l\'altro. Deve essere stabile e unico (meglio un id che l\'indice).'],
    className: ['className', 'In JSX sostituisce l\'attributo class dell\'HTML (class è una parola riservata di JavaScript).'],
    htmlFor: ['htmlFor', 'In JSX sostituisce l\'attributo for delle label.'],
    onClick: ['onClick', 'Funzione chiamata al clic. Si passa la funzione, non il suo risultato: onClick={salva}, non onClick={salva()}.'],
    onChange: ['onChange', 'Funzione chiamata a ogni modifica di un campo; il nuovo valore è in e.target.value.'],
    onSubmit: ['onSubmit', 'Funzione chiamata all\'invio del form; di solito si chiama e.preventDefault() per non ricaricare la pagina.'],
    dangerouslySetInnerHTML: ['dangerouslySetInnerHTML', 'Inserisce HTML grezzo senza protezioni: se il testo arriva da utenti o dal server può eseguire script (XSS).'],
    ref: ['ref', 'Collega un elemento del DOM a una useRef, per leggerlo o comandarlo (focus, scroll, misure).'],
    useNavigate: ['useNavigate (React Router)', 'Restituisce una funzione per cambiare pagina dal codice.', "const navigate = useNavigate(); navigate('/home');"],
    useParams: ['useParams (React Router)', 'Legge i parametri dell\'indirizzo, es. :id in /utenti/:id.'],
    useLocation: ['useLocation (React Router)', 'Informazioni sull\'indirizzo attuale (pathname, search, state).'],
    useSearchParams: ['useSearchParams (React Router)', 'Legge e cambia i parametri dopo il ? nell\'indirizzo.'],
    Link: ['Link (React Router)', 'Collegamento a un\'altra pagina dell\'app senza ricaricare il sito.'],
    Navigate: ['Navigate (React Router)', 'Componente che, appena disegnato, porta a un\'altra pagina (es. redirect se non sei loggato).'],
    Routes: ['Routes (React Router)', 'Contiene le Route e disegna quella che corrisponde all\'indirizzo.'],
    Route: ['Route (React Router)', 'Associa un percorso (path) a un componente (element).'],
    Outlet: ['Outlet (React Router)', 'Punto in cui una pagina "contenitore" disegna la sottopagina attiva.'],
    useTranslation: ['useTranslation (i18next)', 'Dà la funzione t() per tradurre: t(\'login.titolo\') restituisce il testo nella lingua attiva.'],
    useForm: ['useForm (react-hook-form)', 'Gestisce un form: register collega i campi, handleSubmit valida e chiama la tua funzione, formState contiene gli errori.'],
    register: ['register (react-hook-form)', 'Collega un input al form: {...register(\'email\')}.'],
    handleSubmit: ['handleSubmit (react-hook-form)', 'Valida il form e, solo se è valido, chiama la funzione che gli passi con i dati.'],
    yupResolver: ['yupResolver', 'Collega uno schema di validazione Yup a react-hook-form.'],
    useQuery: ['useQuery (React Query)', 'Scarica dati dal server, li tiene in cache e dà data, isLoading ed error.'],
    useMutation: ['useMutation (React Query)', 'Esegue una modifica sul server (POST/PUT/DELETE): mutate() la avvia, onSuccess/onError reagiscono.'],
    useQueryClient: ['useQueryClient (React Query)', 'Accesso alla cache di React Query, es. per invalidare una query dopo una modifica.'],
    // Web e JavaScript
    fetch: ['fetch', 'Fa una richiesta HTTP e restituisce una Promise con la risposta. Attenzione: non va in errore per 404/500, bisogna controllare res.ok.'],
    console: ['console', 'Scrive messaggi nella console del browser: utile per il debug, da togliere prima del commit.'],
    localStorage: ['localStorage', 'Memoria del browser che resta anche chiudendo la pagina. Solo stringhe, leggibile da qualsiasi script della pagina: mai segreti o token sensibili.'],
    sessionStorage: ['sessionStorage', 'Come localStorage ma si svuota chiudendo la scheda.'],
    setTimeout: ['setTimeout', 'Esegue una funzione una volta dopo tot millisecondi; restituisce un id per annullarla con clearTimeout.'],
    setInterval: ['setInterval', 'Esegue una funzione ogni tot millisecondi finché non la fermi con clearInterval (in React, nella pulizia di useEffect).'],
    Promise: ['Promise', 'Rappresenta un risultato che arriverà più avanti (successo o errore). Si legge con await o con .then/.catch.'],
    JSON: ['JSON', 'JSON.stringify trasforma un oggetto in testo, JSON.parse fa il contrario.'],
    Object: ['Object', 'Funzioni per gli oggetti: Object.keys, Object.values, Object.entries, Object.assign…'],
    Array: ['Array', 'Funzioni per gli array, es. Array.isArray(x) o Array.from(…).'],
    Date: ['Date', 'Data e ora. Date.now() dà i millisecondi dal 1970.'],
    Map: ['Map', 'Coppie chiave → valore, con chiavi di qualsiasi tipo e ordine di inserimento garantito.'],
    Set: ['Set', 'Insieme di valori senza duplicati.'],
    Error: ['Error', 'Oggetto errore: new Error(\'messaggio\'); il testo è in .message.'],
    window: ['window', 'L\'oggetto globale del browser: la finestra con tutte le sue API.'],
    document: ['document', 'La pagina HTML caricata: da qui si cercano e modificano gli elementi del DOM.'],
    navigator: ['navigator', 'Informazioni e API del browser: lingua, appunti (clipboard), credenziali (passkey), service worker…'],
    crypto: ['crypto', 'API di crittografia del browser: crypto.getRandomValues per numeri casuali sicuri, crypto.subtle per cifrare, firmare e derivare chiavi.'],
    URL: ['URL', 'Legge e costruisce indirizzi web in modo sicuro.'],
    URLSearchParams: ['URLSearchParams', 'Legge e costruisce i parametri dopo il ? di un indirizzo.'],
    FormData: ['FormData', 'Raccoglie campi e file da inviare al server come form (anche upload).'],
    Blob: ['Blob', 'Dati binari (es. un file) tenuti in memoria.'],
    FileReader: ['FileReader', 'Legge il contenuto di un file scelto dall\'utente.'],
    AbortController: ['AbortController', 'Permette di annullare una fetch, es. quando il componente viene smontato.'],
    WebSocket: ['WebSocket', 'Connessione sempre aperta con il server per ricevere messaggi in tempo reale.'],
    Uint8Array: ['Uint8Array', 'Array di byte (numeri 0-255): il formato tipico dei dati binari e crittografici.'],
    TextEncoder: ['TextEncoder', 'Trasforma una stringa in byte UTF-8 (Uint8Array).'],
    TextDecoder: ['TextDecoder', 'Trasforma byte in stringa.'],
    atob: ['atob', 'Decodifica una stringa Base64.'],
    btoa: ['btoa', 'Codifica una stringa in Base64 (solo caratteri latini).'],
    structuredClone: ['structuredClone', 'Copia profonda di un oggetto (anche annidato).'],
    require: ['require', 'Il vecchio modo di importare (CommonJS, usato in Node).'],
    module: ['module', 'In Node: module.exports è ciò che il file esporta (CommonJS).'],
    process: ['process', 'In Node: informazioni sul processo, es. process.env per le variabili d\'ambiente.'],
  };

  // METODI
  // Le parole dopo un punto: es. lista.map(…)
  const METODI = {
    map: ['.map()', 'Crea un nuovo array trasformando ogni elemento. In JSX si usa per disegnare liste (ricorda la key).', 'utenti.map((u) => <li key={u.id}>{u.nome}</li>)'],
    filter: ['.filter()', 'Nuovo array con solo gli elementi per cui la funzione restituisce true.'],
    reduce: ['.reduce()', 'Riduce l\'array a un solo valore (somma, oggetto…) accumulando passo passo.', 'prezzi.reduce((tot, p) => tot + p, 0)'],
    find: ['.find()', 'Il primo elemento che soddisfa la condizione, o undefined.'],
    findIndex: ['.findIndex()', 'La posizione del primo elemento che soddisfa la condizione, o -1.'],
    some: ['.some()', 'true se almeno un elemento soddisfa la condizione.'],
    every: ['.every()', 'true se tutti gli elementi soddisfano la condizione.'],
    forEach: ['.forEach()', 'Esegue una funzione per ogni elemento; non restituisce nulla e non aspetta gli await.'],
    includes: ['.includes()', 'true se l\'array (o la stringa) contiene il valore.'],
    indexOf: ['.indexOf()', 'Posizione del valore, o -1 se non c\'è.'],
    push: ['.push()', 'Aggiunge in fondo all\'array MODIFICANDOLO. Con lo stato di React non usarlo: crea un nuovo array ([...lista, x]).'],
    pop: ['.pop()', 'Toglie e restituisce l\'ultimo elemento (modifica l\'array).'],
    shift: ['.shift()', 'Toglie e restituisce il primo elemento (modifica l\'array).'],
    unshift: ['.unshift()', 'Aggiunge in testa (modifica l\'array).'],
    slice: ['.slice()', 'Copia una parte dell\'array o della stringa senza modificarli.'],
    splice: ['.splice()', 'Toglie/inserisce elementi MODIFICANDO l\'array.'],
    concat: ['.concat()', 'Unisce array in uno nuovo.'],
    join: ['.join()', 'Unisce gli elementi in una stringa con il separatore indicato.'],
    split: ['.split()', 'Divide una stringa in un array usando il separatore.'],
    sort: ['.sort()', 'Ordina MODIFICANDO l\'array; senza funzione confronta come testo (10 prima di 9).'],
    reverse: ['.reverse()', 'Inverte l\'ordine modificando l\'array.'],
    flat: ['.flat()', 'Appiattisce array annidati.'],
    flatMap: ['.flatMap()', 'map + flat in un passo.'],
    at: ['.at()', 'Elemento alla posizione; accetta negativi: .at(-1) è l\'ultimo.'],
    length: ['.length', 'Numero di elementi di un array o di caratteri di una stringa.'],
    keys: ['.keys()', 'Le chiavi (di un oggetto con Object.keys, di un Map…).'],
    values: ['.values()', 'I valori.'],
    entries: ['.entries()', 'Coppie [chiave, valore].'],
    assign: ['Object.assign()', 'Copia le proprietà di uno o più oggetti nel primo.'],
    then: ['.then()', 'Funzione da eseguire quando la Promise riesce. Con async/await di solito non serve.'],
    catch: ['.catch()', 'Funzione da eseguire quando la Promise fallisce.'],
    finally: ['.finally()', 'Eseguita alla fine della Promise in ogni caso.'],
    all: ['Promise.all()', 'Aspetta più Promise in parallelo; fallisce se ne fallisce anche una sola.'],
    allSettled: ['Promise.allSettled()', 'Aspetta più Promise e dice per ognuna se è riuscita o fallita, senza fermarsi al primo errore.'],
    json: ['.json()', 'Legge il corpo della risposta di fetch come JSON (restituisce una Promise).'],
    stringify: ['JSON.stringify()', 'Trasforma un valore in testo JSON.'],
    parse: ['JSON.parse()', 'Trasforma testo JSON in valore; lancia un errore se il testo non è valido.'],
    trim: ['.trim()', 'Toglie gli spazi all\'inizio e alla fine.'],
    toLowerCase: ['.toLowerCase()', 'Testo in minuscolo.'],
    toUpperCase: ['.toUpperCase()', 'Testo in maiuscolo.'],
    startsWith: ['.startsWith()', 'true se la stringa inizia con il testo dato.'],
    endsWith: ['.endsWith()', 'true se la stringa finisce con il testo dato.'],
    replace: ['.replace()', 'Sostituisce la prima occorrenza (o tutte con una regex /g).'],
    replaceAll: ['.replaceAll()', 'Sostituisce tutte le occorrenze.'],
    padStart: ['.padStart()', 'Allunga la stringa a sinistra fino alla lunghezza data (es. "5" → "05").'],
    toFixed: ['.toFixed()', 'Numero come stringa con i decimali indicati.'],
    preventDefault: ['.preventDefault()', 'Blocca il comportamento normale del browser (es. ricaricare la pagina all\'invio di un form).'],
    stopPropagation: ['.stopPropagation()', 'Impedisce all\'evento di arrivare agli elementi contenitori.'],
    addEventListener: ['.addEventListener()', 'Ascolta un evento; va tolto con removeEventListener quando non serve più (in React nella pulizia di useEffect).'],
    removeEventListener: ['.removeEventListener()', 'Smette di ascoltare un evento: va passata la stessa funzione usata per aggiungerlo.'],
    querySelector: ['.querySelector()', 'Il primo elemento che corrisponde al selettore CSS. In React di solito si usa una ref.'],
    getElementById: ['.getElementById()', 'L\'elemento con quell\'id.'],
    current: ['.current', 'Il valore conservato in una useRef (spesso l\'elemento del DOM).'],
    log: ['console.log()', 'Scrive nella console: da togliere prima del commit.'],
    getItem: ['.getItem()', 'Legge una chiave da localStorage/sessionStorage (null se non c\'è).'],
    setItem: ['.setItem()', 'Salva una stringa in localStorage/sessionStorage.'],
    removeItem: ['.removeItem()', 'Cancella una chiave da localStorage/sessionStorage.'],
    has: ['.has()', 'true se il Map/Set contiene la chiave/il valore.'],
    subtle: ['crypto.subtle', 'Le funzioni crittografiche del browser (cifratura, firma, derivazione chiavi). Tutte asincrone.'],
    getRandomValues: ['crypto.getRandomValues()', 'Riempie un array di byte casuali sicuri (per chiavi, IV, sali).'],
    digest: ['crypto.subtle.digest()', 'Calcola un hash (es. SHA-256) di dei byte.'],
    encrypt: ['crypto.subtle.encrypt()', 'Cifra dei dati con una chiave (es. AES-GCM, che richiede un IV mai riusato).'],
    decrypt: ['crypto.subtle.decrypt()', 'Decifra; con AES-GCM fallisce se i dati sono stati alterati.'],
    importKey: ['crypto.subtle.importKey()', 'Trasforma byte o JWK in un oggetto CryptoKey utilizzabile.'],
    exportKey: ['crypto.subtle.exportKey()', 'Estrae i byte di una chiave (solo se creata come "extractable").'],
    generateKey: ['crypto.subtle.generateKey()', 'Crea una chiave nuova (simmetrica o coppia pubblica/privata).'],
    deriveKey: ['crypto.subtle.deriveKey()', 'Ricava una chiave da un\'altra (es. da password con PBKDF2 o da ECDH).'],
    mutate: ['.mutate()', 'Avvia la mutation di React Query.'],
    mutateAsync: ['.mutateAsync()', 'Come mutate ma restituisce una Promise da aspettare con await.'],
    invalidateQueries: ['.invalidateQueries()', 'Segna i dati in cache come vecchi: React Query li riscarica.'],
  };

  // SIMBOLI
  const SIMBOLI = {
    '=>': ['Arrow function', 'Funzione scritta in forma breve: (parametri) => risultato. Non ha un proprio this.', 'const doppio = (n) => n * 2;'],
    '?.': ['Optional chaining', 'Accede alla proprietà solo se ciò che sta a sinistra esiste; altrimenti restituisce undefined invece di andare in errore.', 'utente?.profilo?.nome'],
    '??': ['Nullish coalescing', 'Usa il valore di destra solo se quello di sinistra è null o undefined (a differenza di ||, tiene 0 e "").', 'const pagina = parametro ?? 1;'],
    '...': ['Spread / rest', 'Espande un array o oggetto (copie: [...lista, x], { ...obj, a: 1 }) o raccoglie "il resto" dei parametri.'],
    '===': ['Uguaglianza stretta', 'Confronta valore e tipo: 1 === "1" è false. Da preferire a ==.'],
    '!==': ['Diversità stretta', 'Vero se valore o tipo sono diversi.'],
    '==': ['Uguaglianza larga', 'Converte i tipi prima di confrontare (1 == "1" è true): fonte di bug, meglio ===.'],
    '!=': ['Diversità larga', 'Converte i tipi prima di confrontare: meglio !==.'],
    '&&': ['AND logico', 'Vero se entrambi lo sono. In JSX: {condizione && <Elemento />} disegna solo se la condizione è vera (attenzione a 0, che viene disegnato).'],
    '||': ['OR logico', 'Restituisce il primo valore "vero"; spesso usato per un valore di riserva (ma scarta anche 0 e "").'],
    '??=': ['Assegnazione se nullo', 'Assegna solo se la variabile è null o undefined.'],
    '||=': ['Assegnazione se falso', 'Assegna solo se la variabile è "falsa".'],
    '&&=': ['Assegnazione se vero', 'Assegna solo se la variabile è "vera".'],
  };

  // CARTELLE
  // Il ruolo tipico delle cartelle per convenzione: aiuta a capire dove va messo cosa
  const CARTELLE = {
    src: 'Il codice sorgente dell\'app: tutto ciò che viene compilato.',
    components: 'Componenti React riutilizzabili: pezzi di interfaccia (bottoni, form, card…).',
    pages: 'Le pagine dell\'app: ognuna corrisponde di solito a un percorso (route).',
    views: 'Le schermate/pagine dell\'app.',
    screens: 'Le schermate (tipico di React Native).',
    layouts: 'Strutture comuni a più pagine (menu, header, footer).',
    hooks: 'Hook custom: logica React riutilizzabile (nomi che iniziano con use).',
    mutations: 'Hook che modificano dati sul server (React Query useMutation).',
    queries: 'Hook che leggono dati dal server (React Query useQuery).',
    context: 'Context React: dati condivisi da molti componenti senza passarli come props.',
    contexts: 'Context React: dati condivisi da molti componenti senza passarli come props.',
    store: 'Stato globale dell\'app (Redux, Zustand…).',
    slices: 'Pezzi dello stato globale (Redux Toolkit).',
    services: 'Comunicazione con il server o servizi esterni: niente interfaccia, solo logica.',
    api: 'Chiamate al backend.',
    utils: 'Funzioni di utilità pure e generiche, senza React.',
    helpers: 'Funzioni di supporto generiche.',
    lib: 'Librerie interne o configurazioni di librerie esterne.',
    crypto: 'Funzioni di crittografia.',
    constants: 'Valori fissi usati in più punti.',
    config: 'Configurazioni.',
    routes: 'Definizione dei percorsi (route) dell\'app.',
    router: 'Definizione dei percorsi (route) dell\'app.',
    assets: 'Immagini, font e file statici importati dal codice.',
    styles: 'Fogli di stile.',
    css: 'Fogli di stile.',
    i18n: 'Traduzioni e configurazione delle lingue.',
    locales: 'File di traduzione, uno per lingua.',
    types: 'Definizioni di tipi TypeScript.',
    tests: 'Test automatici.',
    __tests__: 'Test automatici.',
    public: 'File serviti così come sono, senza compilazione (favicon, manifest, service worker…).',
    scripts: 'Script di supporto (build, deploy, generazione file), non parte dell\'app.',
    dist: 'Risultato della build: non si modifica a mano.',
    '.vscode': 'Impostazioni di VS Code per questo progetto.',
    '.claude': 'Impostazioni di Claude Code per questo progetto.',
    '.github': 'Configurazioni di GitHub (workflow, template).',
  };

  const FILE_NOTI = {
    'package.json': 'Elenco delle dipendenze npm e degli script (npm run …) del progetto.',
    'package-lock.json': 'Versioni esatte delle dipendenze installate: generato da npm, non si modifica a mano.',
    'vite.config.js': 'Configurazione di Vite: server di sviluppo, build e plugin.',
    'index.html': 'La pagina HTML di partenza in cui viene montata l\'app.',
    '.gitignore': 'File e cartelle che git deve ignorare.',
    '.eslintrc.cjs': 'Regole di ESLint: controlla lo stile e gli errori comuni del codice.',
    'vercel.json': 'Configurazione del deploy su Vercel.',
    'README.md': 'Descrizione del progetto per chi lo apre la prima volta.',
    'CLAUDE.md': 'Istruzioni di progetto per Claude Code.',
    'App.jsx': 'Il componente radice: di solito contiene le route e i provider globali.',
    'main.jsx': 'Il punto d\'ingresso: monta l\'app React nella pagina.',
    'index.js': 'Il punto d\'ingresso della cartella o dell\'app.',
  };

  // Tokenizzatore e analisi arrivano da analisi.js, lo stesso codice che usa il server per le funzionalità
  const {
    ESTENSIONI_JS, FUNZIONI, estensione, base, cartellaDi,
    tokenDelFile, analizzaJs, strutturaCss, strutturaMd, strutturaJson,
  } = AnalisiCodice;
  const RIGHE_BLOCCO_INTERO = 14;
  const NOMI_BLOCCHI = { partenza: 'partenza', punto: 'punto chiave', monte: 'arriva qui', usa: 'usato', contesto: 'dal context', percorso: 'route', pagina: 'pagina' };

  const lc = {
    progetto: null,
    file: [],
    insieme: new Set(),
    cartelleAperte: new Set(),
    filtro: '',
    corrente: null,
    analisi: null,
    importatoDa: null,
    parola: null,
    ricerca: null,
    scheda: 'panoramica',
    riga: null,
    storico: [],
    posizione: -1,
    scroll: { codice: 0, albero: 0 },
    nodo: null,
    caricamento: 0,
    cache: new Map(),
    voci: new Map(),
    flusso: null,
    vista: 'codice',
    turnoFlusso: 0,
  };

  // hasOwn: nomi come "constructor" o "toString" non devono pescare dal prototipo degli oggetti
  const voce = (dizionario, nome) => (Object.hasOwn(dizionario, nome) ? dizionario[nome] : null);
  const q = (selettore) => lc.nodo?.querySelector(selettore);
  const qa = (selettore) => lc.nodo?.querySelectorAll(selettore) ?? [];

  // RIGHE
  // I token che vanno a capo (commenti /* */, template string) vengono spezzati riga per riga
  // Solo nei file JS le parole hanno spiegazioni, definizioni e riferimenti (classe w)
  function righeHtml(token, js) {
    const righe = [''];
    for (const t of token) {
      t.testo.split('\n').forEach((pezzo, i) => {
        if (i > 0) righe.push('');
        if (!pezzo) return;
        const classe = t.classe || (t.tipo === '_' || t.tipo === 'w' ? '' : t.tipo);
        const parola = js && t.tipo === 'w' ? ` w${t.proprieta ? ' pr' : ''}` : '';
        const simbolo = js && t.tipo === 'o' && voce(SIMBOLI, t.testo) ? ' sy' : '';
        righe[righe.length - 1] += classe || parola || simbolo ? `<span class="${`${classe}${parola}${simbolo}`.trim()}">${esc(pezzo)}</span>` : esc(pezzo);
      });
    }
    return righe;
  }

  // FILE DEI BLOCCHI
  // Il server dice quali righe mostrare; la pagina scarica i file una volta sola per colorarli e spiegarne le parole
  function caricaAnalisi(percorso) {
    if (!lc.cache.has(percorso)) {
      lc.cache.set(percorso, (async () => {
        const dati = await api('/api/codice/file', { percorso });
        if (typeof dati.testo !== 'string') return null;
        const token = tokenDelFile(percorso, dati.testo);
        const js = ESTENSIONI_JS.includes(estensione(percorso));
        const voceFile = { percorso, analisi: js ? analizzaJs(percorso, token, dati.importi || []) : null, righe: righeHtml(token, js), testo: dati.testo.split('\n') };
        lc.voci.set(percorso, voceFile);
        return voceFile;
      })().catch(() => null));
    }
    return lc.cache.get(percorso);
  }

  // RUOLO DEL FILE
  // Una frase su cosa probabilmente è il file, dedotta da nome, cartella e contenuto
  function ruoloFile(percorso, analisi) {
    const nome = base(percorso);
    if (voce(FILE_NOTI, nome)) return voce(FILE_NOTI, nome);
    const ext = estensione(percorso);
    if (/\.(test|spec)\.[jt]sx?$/.test(nome)) return 'Test automatico: verifica che il codice si comporti come previsto.';
    if (['css', 'scss', 'less'].includes(ext)) return /\.module\.(s?css|less)$/.test(nome) ? 'CSS Module: classi valide solo nel componente che le importa.' : 'Foglio di stile.';
    if (ext === 'json') return /locales?|i18n|lang/.test(percorso) ? 'File di traduzioni: chiave → testo nella lingua.' : 'File di dati o configurazione in formato JSON.';
    if (ext === 'md') return 'Documento di testo in Markdown.';
    if (!analisi?.struttura) return '';
    const principale = analisi.struttura.find((d) => d.predefinito) || analisi.struttura.find((d) => d.esportato && ['componente', 'hook'].includes(d.tipo));
    if (principale?.tipo === 'componente') return /pages?|views?|screens?/.test(percorso) ? `Pagina: il componente ${principale.nome} disegna una schermata intera.` : `Componente React: ${principale.nome} disegna un pezzo di interfaccia.`;
    if (principale?.tipo === 'hook') return /mutations/.test(percorso) ? `Hook di mutation: ${principale.nome} invia una modifica al server.` : `Hook custom: ${principale.nome} raccoglie logica React riutilizzabile.`;
    if (analisi.struttura.some((d) => d.tipo === 'context')) return 'Context React: dati condivisi tra molti componenti.';
    if (analisi.struttura.some((d) => d.tipo === 'componente')) return 'File con componenti React.';
    if (analisi.struttura.length) return 'Modulo di funzioni e costanti, senza interfaccia.';
    return '';
  }

  // CARICAMENTO
  async function caricaAlbero() {
    const progetto = stato.progetto;
    lc.file = await api('/api/codice/albero');
    if (progetto !== stato.progetto) return;
    lc.insieme = new Set(lc.file);
    disegnaAlbero();
    const ultimo = memoria.leggi(`lc.file.${progetto}`, '');
    if (!lc.corrente && lc.insieme.has(ultimo)) apri(ultimo, null, false, false);
  }

  async function apri(percorso, riga = null, registra = true, cambiaVista = true) {
    const turno = ++lc.caricamento;
    if (cambiaVista && lc.vista === 'flusso') {
      lc.vista = 'codice';
      disegnaVista();
    }
    try {
      const dati = lc.corrente?.percorso === percorso ? lc.corrente : await api('/api/codice/file', { percorso });
      if (turno !== lc.caricamento) return;
      const cambiato = lc.corrente?.percorso !== percorso;
      if (cambiato) {
        lc.corrente = dati;
        lc.parola = null;
        lc.ricerca = null;
        lc.importatoDa = null;
        lc.analisi = null;
        lc.token = null;
        memoria.scrivi(`lc.file.${stato.progetto}`, percorso);
        prepara();
        disegnaCodice();
        caricaImportatoDa(percorso);
      }
      if (registra) registraStorico(percorso, riga);
      mostraNellAlbero(percorso);
      disegnaTesta();
      disegnaAiuti();
      if (riga) vaiARiga(riga);
      else if (cambiato) q('#lc-codice').scrollTop = 0;
    } catch (err) {
      avvisa(err.message, true);
    }
  }

  async function caricaImportatoDa(percorso) {
    if (!/\.(m?[jt]sx?|cjs|s?css)$/.test(percorso)) return;
    lc.importatoDa = 'caricamento';
    try {
      const lista = await api('/api/codice/importato-da', { percorso });
      if (lc.corrente?.percorso === percorso) lc.importatoDa = lista;
    } catch (err) {
      if (lc.corrente?.percorso === percorso) lc.importatoDa = { errore: err.message };
    }
    if (lc.corrente?.percorso === percorso && lc.scheda === 'panoramica') disegnaAiuti();
  }

  function prepara() {
    const c = lc.corrente;
    if (!c.testo && c.testo !== '') return;
    const token = tokenDelFile(c.percorso, c.testo);
    lc.token = token;
    const ext = estensione(c.percorso);
    if (ESTENSIONI_JS.includes(ext)) lc.analisi = analizzaJs(c.percorso, token, c.importi || []);
    else if (['css', 'scss', 'less'].includes(ext)) lc.analisi = { struttura: strutturaCss(token), suggerimenti: [] };
    else if (ext === 'md') lc.analisi = { struttura: strutturaMd(c.testo), suggerimenti: [] };
    else if (ext === 'json') lc.analisi = { struttura: strutturaJson(c.testo), suggerimenti: [] };
    else lc.analisi = { struttura: [], suggerimenti: [] };
    const righe = c.testo.split('\n').length;
    if (righe > RIGHE_FILE_LUNGO && ESTENSIONI_JS.includes(ext)) lc.analisi.suggerimenti.unshift({ riga: 1, gravita: 'info', titolo: `File lungo (${righe} righe)`, perche: 'Oltre le 300-400 righe un file di solito fa troppe cose: valuta di spostare componenti o funzioni in file separati.' });
  }

  // STORICO
  // Indietro e Avanti come in VS Code (Alt+← / Alt+→)
  function registraStorico(percorso, riga) {
    const attuale = lc.storico[lc.posizione];
    if (attuale && attuale.percorso === percorso && attuale.riga === riga) return;
    lc.storico = lc.storico.slice(0, lc.posizione + 1);
    lc.storico.push({ percorso, riga });
    lc.posizione = lc.storico.length - 1;
  }

  function muoviStorico(passo) {
    const voce = lc.storico[lc.posizione + passo];
    if (!voce) return;
    lc.posizione += passo;
    apri(voce.percorso, voce.riga, false);
  }

  // ALBERO
  function costruisciAlbero() {
    const radice = { cartelle: new Map(), file: [] };
    for (const f of lc.file) {
      const parti = f.split('/');
      let nodo = radice;
      for (const parte of parti.slice(0, -1)) {
        if (!nodo.cartelle.has(parte)) nodo.cartelle.set(parte, { cartelle: new Map(), file: [] });
        nodo = nodo.cartelle.get(parte);
      }
      nodo.file.push(f);
    }
    return radice;
  }

  const etichettaExt = (p) => {
    const ext = estensione(p);
    return `<span class="lc-ext e-${esc(ext || 'nessuna')}">${esc((ext || '·').slice(0, 4))}</span>`;
  };

  function htmlNodo(nodo, percorso, profondita) {
    const cartelle = [...nodo.cartelle.entries()].sort(([a], [b]) => a.localeCompare(b));
    let html = '';
    for (const [nome, figlio] of cartelle) {
      const completo = percorso ? `${percorso}/${nome}` : nome;
      const aperta = lc.cartelleAperte.has(completo);
      html += `<button class="lc-voce lc-cartella${aperta ? ' aperta' : ''}" data-lc-cartella="${esc(completo)}" style="--p:${profondita}" title="${esc(voce(CARTELLE, nome) || completo)}"><span class="lc-freccia"></span>${esc(nome)}</button>`;
      if (aperta) html += htmlNodo(figlio, completo, profondita + 1);
    }
    for (const f of nodo.file.sort((a, b) => base(a).localeCompare(base(b)))) {
      html += `<button class="lc-voce lc-file${lc.corrente?.percorso === f ? ' attivo' : ''}" data-lc-file="${esc(f)}" style="--p:${profondita}" title="${esc(f)}">${etichettaExt(f)}${esc(base(f))}</button>`;
    }
    return html;
  }

  // RICERCA FILE
  // Come Ctrl+P: tutte le lettere in ordine; vince chi le ha nel nome del file e più vicine
  function punteggio(percorso, filtro) {
    const testo = percorso.toLowerCase();
    let pos = -1;
    let salti = 0;
    for (const c of filtro) {
      const trovato = testo.indexOf(c, pos + 1);
      if (trovato < 0) return null;
      salti += trovato - pos - 1;
      pos = trovato;
    }
    const nome = base(testo);
    return salti + (nome.includes(filtro) ? -1000 : 0) + (testo.includes(filtro) ? -500 : 0) + percorso.length * 0.01;
  }

  function disegnaAlbero() {
    const el = q('#lc-albero');
    if (!el) return;
    const filtro = lc.filtro.trim().toLowerCase().replace(/\s+/g, '');
    if (!lc.file.length) {
      el.innerHTML = '<p class="lc-vuoto">Nessun file.</p>';
      return;
    }
    if (!filtro) {
      el.innerHTML = htmlNodo(costruisciAlbero(), '', 0);
      return;
    }
    const trovati = lc.file.map((f) => [f, punteggio(f, filtro)]).filter(([, p]) => p !== null).sort((a, b) => a[1] - b[1]).slice(0, MAX_FILTRATI);
    el.innerHTML = trovati.length
      ? trovati.map(([f], i) => `<button class="lc-voce lc-file piatta${i === 0 ? ' primo' : ''}${lc.corrente?.percorso === f ? ' attivo' : ''}" data-lc-file="${esc(f)}" title="${esc(f)}">${etichettaExt(f)}<span>${esc(base(f))}<small>${esc(cartellaDi(f))}</small></span></button>`).join('')
      : '<p class="lc-vuoto">Nessun file corrisponde.</p>';
  }

  function mostraNellAlbero(percorso) {
    const parti = percorso.split('/');
    for (let i = 1; i < parti.length; i++) lc.cartelleAperte.add(parti.slice(0, i).join('/'));
    disegnaAlbero();
    const voce = [...qa('#lc-albero [data-lc-file]')].find((b) => b.dataset.lcFile === percorso);
    voce?.scrollIntoView({ block: 'nearest' });
  }

  // CODICE
  function disegnaCodice() {
    const el = q('#lc-codice');
    if (!el) return;
    const c = lc.corrente;
    if (!c) {
      el.innerHTML = '<p class="lc-vuoto">Scegli un file a sinistra, oppure cercalo con <kbd>Ctrl</kbd>+<kbd>P</kbd>.</p>';
      return;
    }
    if (c.binario) {
      el.innerHTML = '<p class="lc-vuoto">File binario (immagine, font, archivio…): non si può leggere come testo.</p>';
      return;
    }
    if (c.troppoGrande) {
      el.innerHTML = `<p class="lc-vuoto">File troppo grande da mostrare (${(c.dimensione / 1024 / 1024).toFixed(1)} MB).</p>`;
      return;
    }
    const righe = righeHtml(lc.token, ESTENSIONI_JS.includes(estensione(c.percorso)));
    const cifre = String(righe.length).length;
    el.style.setProperty('--cifre', cifre);
    el.innerHTML = `<div class="lc-righe">${righe.map((r, i) => `<div class="lc-riga" data-riga="${i + 1}"><span class="lc-num">${i + 1}</span><span class="lc-testo">${r || ' '}</span></div>`).join('')}</div>`;
    marcaSuggerimenti();
  }

  function marcaSuggerimenti() {
    for (const s of lc.analisi?.suggerimenti || []) {
      q(`#lc-codice .lc-riga[data-riga="${s.riga}"]`)?.classList.add(`seg-${s.gravita}`);
    }
  }

  function vaiARiga(riga) {
    const el = q(`#lc-codice .lc-riga[data-riga="${riga}"]`);
    if (!el) return;
    qa('#lc-codice .lc-riga.selezionata').forEach((r) => r.classList.remove('selezionata'));
    el.classList.add('selezionata');
    lc.riga = riga;
    const contenitore = q('#lc-codice');
    contenitore.scrollTop = el.offsetTop - contenitore.clientHeight / 3;
    el.classList.remove('lampeggia');
    void el.offsetWidth;
    el.classList.add('lampeggia');
    disegnaTesta();
  }

  function evidenziaParola(nome) {
    qa('#lc-codice .occ').forEach((s) => s.classList.remove('occ'));
    if (!nome) return;
    qa('#lc-codice .w').forEach((s) => {
      if (s.textContent === nome) s.classList.add('occ');
    });
  }

  // INTESTAZIONE
  // Percorso del file, Indietro/Avanti e il collegamento per aprire il file in VS Code alla riga scelta
  function disegnaTesta() {
    const el = q('#lc-testa');
    if (!el) return;
    if (lc.vista === 'flusso' && lc.flusso) {
      el.innerHTML = `
        <span class="lc-badge">funzionalità</span>
        <div class="lc-percorso"><b>${esc(lc.flusso.titolo)}</b></div>
        <button class="btn" data-lc-vista="codice" title="Torna al file aperto (la funzionalità resta nella scheda a destra)">Torna al file</button>`;
      return;
    }
    const c = lc.corrente;
    const parti = c ? c.percorso.split('/') : [];
    const percorso = parti.map((p, i) => (i < parti.length - 1
      ? `<button class="lc-briciola" data-lc-cartella-rivela="${esc(parti.slice(0, i + 1).join('/'))}" title="${esc(voce(CARTELLE, p) || '')}">${esc(p)}</button><span class="lc-sep">/</span>`
      : `<b>${esc(p)}</b>`)).join('');
    const vscode = c ? `vscode://file/${encodeURI(c.assoluto)}${lc.riga ? `:${lc.riga}` : ''}` : '';
    el.innerHTML = `
      <button class="btn icona lc-nav" data-lc-storico="-1" title="Indietro (Alt+←)" ${lc.posizione > 0 ? '' : 'disabled'}>‹</button>
      <button class="btn icona lc-nav" data-lc-storico="1" title="Avanti (Alt+→)" ${lc.posizione < lc.storico.length - 1 ? '' : 'disabled'}>›</button>
      <div class="lc-percorso">${percorso || '<span class="nota">Nessun file aperto</span>'}</div>
      ${c && !c.binario && !c.troppoGrande ? `<span class="lc-info">${c.testo.split('\n').length} righe</span>` : ''}
      ${lc.flusso && !lc.flusso.caricamento ? '<button class="btn" data-lc-vista="flusso" title="Torna al nastro della funzionalità">⇢ Funzionalità</button>' : ''}
      ${c ? `<a class="btn" href="${esc(vscode)}" title="Apri il file in VS Code${lc.riga ? ` alla riga ${lc.riga}` : ''}">Apri in VS Code${lc.riga ? ` :${lc.riga}` : ''}</a>` : ''}`;
  }

  // AIUTI
  const NOMI_TIPI = { componente: 'Componente', hook: 'Hook', funzione: 'Funzione', classe: 'Classe', costante: 'Costante', variabile: 'Variabile', stato: 'Stato', setter: 'Setter dello stato', tipo: 'Tipo', context: 'Context', import: 'Import', parametro: 'Parametro', selettore: 'Selettore', regola: 'Regola', oggetto: 'Oggetto', lista: 'Lista', valore: 'Valore' };
  const SIGLE = { componente: 'C', hook: 'H', funzione: 'ƒ', classe: 'K', costante: 'K', variabile: 'v', stato: 'S', tipo: 'T', context: 'X', selettore: '#', regola: '@', oggetto: '{}', lista: '[]', valore: '·', h1: 'H1', h2: 'H2', h3: 'H3', h4: 'H4', h5: 'H5', h6: 'H6' };

  function disegnaAiuti() {
    const el = q('#lc-aiuti');
    if (!el) return;
    const schede = [['panoramica', 'Panoramica'], ['struttura', 'Struttura'], ['riferimenti', 'Riferimenti'], ...(lc.flusso ? [['funzionalita', 'Funzionalità']] : [])];
    if (!schede.some(([id]) => id === lc.scheda)) lc.scheda = 'panoramica';
    const n = lc.analisi?.suggerimenti?.length || 0;
    el.innerHTML = `<div class="lc-schede">${schede.map(([id, nome]) => `<button class="${lc.scheda === id ? 'attiva' : ''}" data-lc-scheda="${id}">${nome}${id === 'panoramica' && n ? `<span class="lc-conta">${n}</span>` : ''}</button>`).join('')}</div>
      <div class="lc-pannello">${lc.corrente ? { panoramica: htmlPanoramica, struttura: htmlStruttura, riferimenti: htmlRiferimenti, funzionalita: htmlFunzionalita }[lc.scheda]() : htmlGuida()}</div>`;
  }

  const htmlGuida = () => `<div class="lc-sezione">
      <h4>Come si usa</h4>
      <ul class="lc-guida">
        <li><b>Passa il mouse</b> su una parola: spiega le parole di JavaScript/React e dice dove è definito un nome.</li>
        <li><b>Clic</b> su un nome: lo evidenzia nel file e mostra i riferimenti.</li>
        <li><b>Ctrl+clic</b>: vai alla definizione, anche in un altro file.</li>
        <li><b>Clic sul numero</b> di riga: la seleziona per aprirla in VS Code.</li>
        <li><b>Seleziona delle righe</b> (o Maiusc+clic sui numeri) o usa ⇢ in Struttura: <b>Segui funzionalità</b> mostra in un nastro solo i pezzi di codice coinvolti, in tutti i file.</li>
        <li><kbd>Ctrl</kbd>+<kbd>P</kbd> cerca un file, <kbd>Alt</kbd>+<kbd>←</kbd>/<kbd>→</kbd> torna indietro e avanti.</li>
      </ul>
    </div>`;

  const linkRiga = (riga, testo) => `<button class="lc-link" data-lc-riga="${riga}">${testo}</button>`;
  const linkFile = (file, riga, testo) => `<button class="lc-link" data-lc-apri="${esc(file)}"${riga ? ` data-lc-alla-riga="${riga}"` : ''}>${testo}</button>`;

  function htmlPanoramica() {
    const c = lc.corrente;
    const a = lc.analisi;
    const parti = c.percorso.split('/');
    const cartelle = parti.slice(0, -1).map((p, i) => [parti.slice(0, i + 1).join('/'), p]).filter(([, p]) => voce(CARTELLE, p));
    let html = '';
    const ruolo = ruoloFile(c.percorso, a);
    html += `<div class="lc-sezione"><h4>Cos'è</h4><p>${esc(ruolo || 'File del progetto.')}</p>
      ${cartelle.length ? `<dl class="lc-cartelle">${cartelle.map(([completo, p]) => `<dt>${esc(p)}/</dt><dd>${esc(voce(CARTELLE, p))}</dd>`).join('')}</dl>` : ''}
    </div>`;

    if (a?.suggerimenti?.length) {
      html += `<div class="lc-sezione"><h4>Suggerimenti <span class="lc-conta">${a.suggerimenti.length}</span></h4>${a.suggerimenti.map((s) => `<button class="lc-suggerimento ${s.gravita}" data-lc-riga="${s.riga}">
          <span class="lc-sug-titolo">${esc(s.titolo)}<small>riga ${s.riga}</small></span>
          <span class="lc-sug-perche">${esc(s.perche)}</span>
        </button>`).join('')}</div>`;
    } else if (a && !c.binario) {
      html += '<div class="lc-sezione"><h4>Suggerimenti</h4><p class="nota">Niente da segnalare con i controlli automatici.</p></div>';
    }

    if (c.importi?.length) {
      const interni = c.importi.filter((i) => i.risolto);
      const esterni = [...new Set(c.importi.filter((i) => !i.risolto).map((i) => i.specificatore))];
      html += `<div class="lc-sezione"><h4>Importa <span class="lc-conta">${c.importi.length}</span></h4>
        ${interni.length ? `<p class="lc-sotto">File del progetto</p><ul class="lc-elenco">${interni.map((i) => `<li>${linkFile(i.risolto, null, `${etichettaExt(i.risolto)}${esc(i.risolto)}`)}${linkRiga(i.riga, `<small>riga ${i.riga}</small>`)}</li>`).join('')}</ul>` : ''}
        ${esterni.length ? `<p class="lc-sotto">Pacchetti npm o percorsi non trovati</p><ul class="lc-elenco pacchetti">${esterni.map((s) => `<li><code>${esc(s)}</code></li>`).join('')}</ul>` : ''}
      </div>`;
    }

    const usato = lc.importatoDa;
    if (usato) {
      html += `<div class="lc-sezione"><h4>Usato da${Array.isArray(usato) ? ` <span class="lc-conta">${usato.length}</span>` : ''}</h4>${usato === 'caricamento' ? '<p class="nota">Cerco chi importa questo file…</p>'
        : usato.errore ? `<p class="nota">${esc(usato.errore)}</p>`
          : usato.length ? `<ul class="lc-elenco">${usato.map((u) => `<li>${linkFile(u.file, u.riga, `${etichettaExt(u.file)}${esc(u.file)} <small>riga ${u.riga}</small>`)}</li>`).join('')}</ul>`
            : '<p class="nota">Nessun file lo importa: forse è un punto d\'ingresso (es. main.jsx) o non è più usato.</p>'}</div>`;
    }
    return html;
  }

  function htmlVoceStruttura(d) {
    const figli = (d.figli || []).filter((f) => f.tipo !== 'stato');
    const stati = (d.figli || []).filter((f) => f.tipo === 'stato');
    return `<li>
      <div class="lc-riga-str">
      <button class="lc-voce-str" data-lc-riga="${d.riga}" title="${esc(NOMI_TIPI[d.tipo] || d.tipo)}${d.fineRiga ? ` · righe ${d.riga}-${d.fineRiga}` : ''}">
        <span class="lc-sigla s-${esc(d.tipo)}">${esc(SIGLE[d.tipo] || '·')}</span>
        <span class="lc-nome">${esc(d.nome)}</span>
        ${d.predefinito ? '<span class="lc-badge">export default</span>' : d.esportato ? '<span class="lc-badge">export</span>' : ''}
        <small>${d.riga}</small>
      </button>
      ${d.fineRiga && FUNZIONI.includes(d.tipo) ? `<button class="lc-segui-str" data-lc-segui="${d.riga}-${d.fineRiga}" title="Segui la funzionalità di ${esc(d.nome)}">⇢</button>` : ''}
      </div>
      ${stati.length || d.hook?.length ? `<div class="lc-chip">${stati.map((s) => `<button class="chip lc-stato" data-lc-riga="${s.riga}" title="Stato creato con useState">stato: ${esc(s.nome)}</button>`).join('')}${(d.hook || []).filter(([h]) => h !== 'useState').map(([h, n]) => `<span class="chip" title="${esc(voce(PAROLE, h)?.[1] || 'Hook')}">${esc(h)}${n > 1 ? ` ×${n}` : ''}</span>`).join('')}</div>` : ''}
      ${figli.length ? `<ul>${figli.map(htmlVoceStruttura).join('')}</ul>` : ''}
    </li>`;
  }

  function htmlStruttura() {
    const struttura = lc.analisi?.struttura || [];
    if (!struttura.length) return '<p class="nota lc-sezione">Nessuna struttura riconosciuta in questo file.</p>';
    const legenda = ESTENSIONI_JS.includes(estensione(lc.corrente.percorso))
      ? '<p class="nota lc-legenda"><span class="lc-sigla s-componente">C</span> componente <span class="lc-sigla s-hook">H</span> hook <span class="lc-sigla s-funzione">ƒ</span> funzione <span class="lc-sigla s-costante">K</span> costante</p>' : '';
    return `<div class="lc-sezione">${legenda}<ul class="lc-struttura">${struttura.map(htmlVoceStruttura).join('')}</ul></div>`;
  }

  function htmlRiferimenti() {
    const nome = lc.parola;
    if (!nome) return '<p class="nota lc-sezione">Clicca un nome nel codice per vedere dove è definito e dove viene usato.</p>';
    const def = lc.analisi?.definizioni?.get(nome);
    const imp = lc.analisi?.importati?.get(nome);
    const occorrenze = [];
    lc.token?.forEach((t) => {
      if (t.tipo === 'w' && t.testo === nome && occorrenze.at(-1) !== t.riga) occorrenze.push(t.riga);
    });
    const righe = lc.corrente.testo.split('\n');
    let html = `<div class="lc-sezione"><h4><code>${esc(nome)}</code></h4>${htmlSpiegazione(nome, false)}`;
    if (imp) html += `<p>Importato da <code>${esc(imp.specificatore)}</code>${imp.risolto ? ` · ${linkFile(imp.risolto, null, 'apri il file')}` : ' (pacchetto npm)'}.</p>`;
    if (def || imp) html += `<button class="btn" data-lc-definizione="${esc(nome)}">Vai alla definizione</button>`;
    const dichiarata = lc.analisi?.dichiarazioni?.find((x) => x.nome === nome && x.riga === def?.riga && x.fineRiga && FUNZIONI.includes(x.tipo));
    if (dichiarata) html += ` <button class="btn" data-lc-segui="${dichiarata.riga}-${dichiarata.fineRiga}">⇢ Segui funzionalità</button>`;
    html += '</div>';
    html += `<div class="lc-sezione"><h4>In questo file <span class="lc-conta">${occorrenze.length}</span></h4><ul class="lc-elenco righe">${occorrenze.map((r) => `<li>${linkRiga(r, `<small>${r}</small><code>${esc(righe[r - 1].trim().slice(0, 90))}</code>`)}</li>`).join('')}</ul></div>`;
    const r = lc.ricerca;
    html += `<div class="lc-sezione"><h4>Nel progetto${r?.nome === nome && r.risultati ? ` <span class="lc-conta">${r.risultati.length}${r.troncato ? '+' : ''}</span>` : ''}</h4>`;
    if (r?.nome !== nome) html += `<button class="btn" data-lc-cerca="${esc(nome)}">Cerca in tutti i file</button>`;
    else if (r.caricamento) html += '<p class="nota">Cerco…</p>';
    else if (r.errore) html += `<p class="nota">${esc(r.errore)}</p>`;
    else {
      const perFile = new Map();
      for (const x of r.risultati) {
        if (!perFile.has(x.file)) perFile.set(x.file, []);
        perFile.get(x.file).push(x);
      }
      html += [...perFile].map(([file, lista]) => `<details class="lc-gruppo"${file === lc.corrente.percorso || perFile.size <= 6 ? ' open' : ''}><summary>${etichettaExt(file)}${esc(file)} <span class="lc-conta">${lista.length}</span></summary>
        <ul class="lc-elenco righe">${lista.map((x) => `<li>${linkFile(x.file, x.riga, `<small>${x.riga}</small><code>${esc(x.testo.slice(0, 90))}</code>`)}</li>`).join('')}</ul></details>`).join('') || '<p class="nota">Nessun risultato.</p>';
    }
    return `${html}</div>`;
  }

  // SPIEGAZIONE
  // Il testo del tooltip: prima cosa significa la parola, poi dove è definita in questo file
  function htmlSpiegazione(nome, proprieta, file = { analisi: lc.analisi, testo: lc.corrente?.testo.split('\n') || [] }) {
    const spiegata = proprieta ? voce(METODI, nome) : voce(PAROLE, nome) || (file.analisi?.definizioni?.has(nome) ? null : voce(METODI, nome));
    const def = !proprieta && file.analisi?.definizioni?.get(nome);
    const imp = !proprieta && file.analisi?.importati?.get(nome);
    let html = '';
    if (spiegata && !(def && def.tipo !== 'import')) html += `<p class="lc-tip-titolo">${esc(spiegata[0])}</p><p>${esc(spiegata[1])}</p>${spiegata[2] ? `<pre>${esc(spiegata[2])}</pre>` : ''}`;
    if (def && def.tipo !== 'import') {
      const riga = file.testo[def.riga - 1]?.trim().slice(0, 120);
      const extra = def.tipo === 'setter' ? ' (chiamala per cambiare lo stato e ridisegnare il componente)' : def.tipo === 'stato' ? ' (cambia solo tramite il suo setter)' : def.tipo === 'parametro' && def.di ? ` di ${def.di}` : '';
      html += `<p class="lc-tip-titolo">${esc(NOMI_TIPI[def.tipo] || def.tipo)} ${esc(nome)}${esc(extra)}</p><p>Definita alla riga ${def.riga}</p>${riga ? `<pre>${esc(riga)}</pre>` : ''}`;
    }
    if (imp) html += `${spiegata ? '' :`<p class="lc-tip-titolo">${esc(nome)}</p>`}<p>Importata da <code>${esc(imp.specificatore)}</code>${imp.risolto ? '' : ' (pacchetto npm)'}${imp.originale !== 'default' && imp.originale !== nome ? ` come ${esc(imp.originale)}` : ''}.</p>`;
    return html;
  }

  // TOOLTIP
  let timerTooltip;
  function mostraTooltip(span) {
    const tip = q('#lc-tooltip');
    let html = '';
    if (span.classList.contains('sy')) {
      const simbolo = voce(SIMBOLI, span.textContent);
      html = `<p class="lc-tip-titolo"><code>${esc(span.textContent)}</code> ${esc(simbolo[0])}</p><p>${esc(simbolo[1])}</p>${simbolo[2] ? `<pre>${esc(simbolo[2])}</pre>` : ''}`;
    } else {
      // Nel nastro ogni blocco appartiene a un file diverso: la spiegazione usa l'analisi di quel file
      const blocco = span.closest('[data-lc-blocco-file]');
      const altro = blocco && lc.voci.get(blocco.dataset.lcBloccoFile);
      html = htmlSpiegazione(span.textContent, span.classList.contains('pr'), altro ? { analisi: altro.analisi, testo: altro.testo } : undefined);
      const def = lc.analisi?.definizioni?.get(span.textContent);
      const imp = lc.analisi?.importati?.get(span.textContent);
      const raggiungibile = def && (def.tipo !== 'import' || imp?.risolto);
      if (html && !blocco && raggiungibile && !span.classList.contains('pr')) html += '<p class="nota">Ctrl+clic: vai alla definizione</p>';
    }
    if (!html) return nascondiTooltip();
    tip.innerHTML = html;
    tip.hidden = false;
    const r = span.getBoundingClientRect();
    const larghezza = tip.offsetWidth;
    const altezza = tip.offsetHeight;
    tip.style.left = `${Math.max(8, Math.min(r.left, innerWidth - larghezza - 8))}px`;
    tip.style.top = `${r.bottom + altezza + 8 < innerHeight ? r.bottom + 6 : Math.max(8, r.top - altezza - 6)}px`;
  }

  function nascondiTooltip() {
    clearTimeout(timerTooltip);
    const tip = q('#lc-tooltip');
    if (tip) tip.hidden = true;
  }

  // DEFINIZIONE
  // Se il nome è importato da un file del progetto, apre quel file e cerca lì la sua dichiarazione
  async function vaiADefinizione(nome) {
    const imp = lc.analisi?.importati?.get(nome);
    const def = lc.analisi?.definizioni?.get(nome);
    if (imp?.risolto) {
      registraStorico(lc.corrente.percorso, lc.riga);
      await apri(imp.risolto);
      const cercato = imp.originale === 'default' ? lc.analisi?.esportaDefault : imp.originale === '*' ? null : imp.originale;
      const riga = cercato && lc.analisi?.definizioni?.get(cercato)?.riga;
      if (riga) {
        vaiARiga(riga);
        lc.storico[lc.posizione].riga = riga;
      }
      return;
    }
    if (imp) return avvisa(`${nome} arriva dal pacchetto ${imp.specificatore}: non è nel progetto`);
    if (def) {
      registraStorico(lc.corrente.percorso, lc.riga);
      registraStorico(lc.corrente.percorso, def.riga);
      vaiARiga(def.riga);
      disegnaTesta();
    }
  }

  async function cercaNelProgetto(nome) {
    lc.ricerca = { nome, caricamento: true };
    disegnaAiuti();
    try {
      const { risultati, troncato } = await api('/api/codice/cerca', { testo: nome });
      if (lc.ricerca?.nome === nome) lc.ricerca = { nome, risultati, troncato };
    } catch (err) {
      if (lc.ricerca?.nome === nome) lc.ricerca = { nome, errore: err.message };
    }
    if (lc.scheda === 'riferimenti') disegnaAiuti();
  }


  // NASTRO DAL SERVER
  // Il server traccia (stesso codice di analisi.js); qui si aggancia a ogni blocco il suo file colorato
  async function mostraNastro(titolo, carica, extra = {}) {
    nascondiSegui();
    const turno = ++lc.turnoFlusso;
    lc.flusso = { titolo, blocchi: [], caricamento: true, ...extra };
    lc.vista = 'flusso';
    lc.scheda = 'funzionalita';
    disegnaVista();
    disegnaAiuti();
    try {
      const risultato = await carica();
      const file = [...new Set(risultato.blocchi.filter((b) => b.file).map((b) => b.file))];
      await Promise.all(file.map(caricaAnalisi));
      if (turno !== lc.turnoFlusso) return;
      const blocchi = risultato.blocchi.map((b) => (b.rimando !== undefined ? b : {
        ...b, voce: lc.voci.get(b.file), evidenziate: new Set(b.evidenziate), parole: new Set(b.parole), espanse: new Set(),
      })).filter((b) => b.rimando !== undefined || b.voce);
      Object.assign(lc.flusso, { titolo: risultato.titolo || titolo, blocchi, caricamento: false, troncato: risultato.troncato });
    } catch (err) {
      if (turno !== lc.turnoFlusso) return;
      Object.assign(lc.flusso, { caricamento: false, errore: err.message });
    }
    disegnaVista();
    disegnaAiuti();
  }

  const seguiFunzionalita = (percorso, inizio, fine) => mostraNastro(`${base(percorso)} righe ${inizio}-${fine}`, () => api('/api/codice/segui', { percorso, inizio, fine }));

  async function apriFunzionalita(id, nome = 'Funzionalità') {
    if (stato.sezione !== 'codice') {
      stato.sezione = 'codice';
      memoria.scrivi('sala.sezione', 'codice');
      disegna();
    }
    await mostraNastro(nome, async () => {
      const r = await api('/api/funzionalita/apri', { id });
      lc.flusso.funzionalita = r.funzionalita;
      return { ...r, titolo: r.funzionalita.nome };
    }, { id });
  }

  // NASTRO
  // Di ogni blocco si vedono le righe coinvolte con una riga di contesto; il resto si apre cliccando sui puntini
  function righeVisibili(b) {
    const visibili = new Set();
    const aggiungi = (r) => {
      if (r >= b.inizio && r <= b.fine) visibili.add(r);
    };
    if (b.fine - b.inizio < RIGHE_BLOCCO_INTERO || b.tipo === 'partenza') {
      for (let r = b.inizio; r <= b.fine; r++) visibili.add(r);
      return visibili;
    }
    aggiungi(b.inizio);
    aggiungi(b.fine);
    for (const r of b.evidenziate) for (let d = -1; d <= 1; d++) aggiungi(r + d);
    for (const r of b.espanse) aggiungi(r);
    return visibili;
  }

  function htmlBlocco(b, blocchi) {
    const rientro = `style="--liv:${Math.min(b.livello, 6)}"`;
    if (b.rimando !== undefined) {
      const altro = blocchi[b.rimando];
      return `<div class="lc-rimando" ${rientro}>↳ ${esc(b.relazione)} · <button class="lc-link" data-lc-vai-blocco="${altro.id}">già mostrato: ${esc(altro.nome)}</button></div>`;
    }
    const visibili = righeVisibili(b);
    const backend = new Map(b.backend.map((x) => [x.riga, x]));
    let righe = '';
    let salto = null;
    const chiudiSalto = (r) => {
      if (salto === null) return;
      righe += `<button class="lc-salto" data-lc-espandi="${b.id}:${salto}:${r - 1}">⋯ ${r - salto} righe</button>`;
      salto = null;
    };
    for (let r = b.inizio; r <= b.fine; r++) {
      if (!visibili.has(r)) {
        salto ??= r;
        continue;
      }
      chiudiSalto(r);
      const classi = `${b.evidenziate.has(r) ? 'evid' : 'spenta'}${backend.has(r) ? ' backend' : ''}`;
      righe += `<div class="lc-riga ${classi}" data-riga="${r}"><span class="lc-num" data-lc-apri="${esc(b.file)}" data-lc-alla-riga="${r}" title="Apri ${esc(b.file)} alla riga ${r}">${r}</span><span class="lc-testo">${b.voce.righe[r - 1] || ' '}</span></div>`;
    }
    chiudiSalto(b.fine + 1);
    const etichette = [
      ...b.backend.map((x) => `<span class="lc-etichetta backend" title="Chiamata al server alla riga ${x.riga}">${esc(x.metodo)} ${esc(x.url)}</span>`),
      ...b.pagine.map((x) => `<span class="lc-etichetta pagina" title="navigate alla riga ${x.riga}">→ ${esc(x.percorso)}${x.componente ? ` (${esc(x.componente)})` : ''}</span>`),
    ].join('');
    const genere = b.genere || (b.tipo === 'percorso' ? 'route' : b.tipo === 'pagina' ? 'componente' : '');
    return `${b.relazione ? `<div class="lc-rel" ${rientro}>▼ ${esc(b.relazione)}</div>` : ''}
      <article class="lc-blocco t-${b.tipo}" id="lc-blocco-${b.id}" data-lc-blocco-file="${esc(b.file)}" ${rientro}>
        <header>
          ${etichettaExt(b.file)}<span class="lc-blocco-file">${esc(cartellaDi(b.file))}/<b>${esc(base(b.file))}</b></span>
          <span class="lc-badge">${esc(NOMI_BLOCCHI[b.tipo] || b.tipo)}${genere ? ` · ${esc(NOMI_TIPI[genere]?.toLowerCase() || genere)}` : ''}</span>
          <span class="lc-info">righe ${b.inizio}-${b.fine}</span>
        </header>
        ${etichette ? `<div class="lc-etichette">${etichette}</div>` : ''}
        <div class="lc-blocco-codice" style="--cifre:${String(b.fine).length}">${righe}</div>
      </article>`;
  }

  function disegnaFlusso() {
    const el = q('#lc-flusso');
    const f = lc.flusso;
    if (!el || !f) return;
    if (f.caricamento) {
      el.innerHTML = '<p class="lc-vuoto">Seguo la funzionalità…</p>';
      return;
    }
    if (f.errore) {
      el.innerHTML = `<p class="lc-vuoto">${esc(f.errore)}</p>`;
      return;
    }
    const monteB = f.blocchi.filter((b) => b.tipo === 'monte');
    const resto = f.blocchi.filter((b) => b.tipo !== 'monte');
    el.innerHTML = `
      ${monteB.length ? `<h4 class="lc-fase">Chi arriva qui</h4>${monteB.map((b) => htmlBlocco(b, f.blocchi)).join('')}<div class="lc-rel freccia">▼ esegue</div>` : ''}
      <h4 class="lc-fase">Cosa succede</h4>
      ${resto.map((b) => htmlBlocco(b, f.blocchi)).join('')}
      ${f.troncato ? '<p class="nota lc-fase">Mi sono fermato al numero massimo di pezzi: parti da un blocco più piccolo per vedere il resto.</p>' : ''}`;
    for (const b of f.blocchi) {
      if (!b.parole?.size) continue;
      q(`#lc-blocco-${b.id}`)?.querySelectorAll('.w').forEach((s) => {
        if (b.parole.has(s.textContent)) s.classList.add('segue');
      });
    }
  }

  // VISTA
  // Il centro mostra il file aperto oppure il nastro della funzionalità; il file resta aperto sotto
  function disegnaVista() {
    const flusso = lc.vista === 'flusso' && lc.flusso;
    q('#lc-codice').hidden = Boolean(flusso);
    q('#lc-flusso').hidden = !flusso;
    if (flusso) disegnaFlusso();
    disegnaTesta();
  }

  function htmlFunzionalita() {
    const f = lc.flusso;
    if (!f) return '<p class="nota lc-sezione">Seleziona delle righe nel codice o usa ⇢ in Struttura per seguire una funzionalità.</p>';
    if (f.caricamento) return '<p class="nota lc-sezione">Seguo la funzionalità…</p>';
    const veri = f.blocchi.filter((b) => b.rimando === undefined);
    const file = new Set(veri.map((b) => b.file));
    const backend = veri.flatMap((b) => b.backend.map((x) => ({ ...x, blocco: b })));
    const pagine = veri.flatMap((b) => b.pagine.map((x) => ({ ...x, blocco: b })));
    return `<div class="lc-sezione">
        <h4>Funzionalità${f.funzionalita ? ` · ${esc(f.funzionalita.categoria)}` : ''}</h4>
        <p><b>${esc(f.titolo)}</b></p>
        ${f.funzionalita?.descrizione ? `<p>${esc(f.funzionalita.descrizione)}</p>` : ''}
        <p class="nota">${veri.length} pezzi in ${file.size} file.</p>
        <button class="btn" data-lc-vista="${lc.vista === 'flusso' ? 'codice' : 'flusso'}">${lc.vista === 'flusso' ? 'Torna al file' : 'Mostra il nastro'}</button>
      </div>
      <div class="lc-sezione"><h4>Percorso</h4><ul class="lc-elenco lc-mappa">${f.blocchi.map((b) => (b.rimando !== undefined ? '' : `<li style="--liv:${Math.min(b.livello, 6)}"><button class="lc-link" data-lc-vai-blocco="${b.id}">${etichettaExt(b.file)}<span>${esc(b.relazione || 'partenza')}</span><small>${esc(base(b.file))}:${b.inizio}</small></button></li>`)).join('')}</ul></div>
      ${backend.length ? `<div class="lc-sezione"><h4>Backend <span class="lc-conta">${backend.length}</span></h4><ul class="lc-elenco">${backend.map((x) => `<li><button class="lc-link" data-lc-vai-blocco="${x.blocco.id}"><code>${esc(x.metodo)} ${esc(x.url)}</code><small>${esc(base(x.blocco.file))}:${x.riga}</small></button></li>`).join('')}</ul></div>` : ''}
      ${pagine.length ? `<div class="lc-sezione"><h4>Pagine raggiunte <span class="lc-conta">${pagine.length}</span></h4><ul class="lc-elenco">${pagine.map((x) => `<li><button class="lc-link" data-lc-vai-blocco="${x.blocco.id}"><code>${esc(x.percorso)}</code>${x.componente ? `<span>${esc(x.componente)}</span>` : '<small>route non trovata</small>'}</button></li>`).join('')}</ul></div>` : ''}
      <div class="lc-sezione"><p class="nota">Ricostruita leggendo import e nomi: callback passate a librerie esterne, eventi del browser e chiamate costruite a runtime non si possono seguire.</p></div>`;
  }

  // AVVIO DA SELEZIONE
  // Selezionando righe nel codice (o Maiusc+clic sui numeri) compare il tasto per seguire la funzionalità
  // Il menu propone di seguire la selezione e, appena il server risponde, le funzionalità del catalogo che passano di lì
  let turnoMenu = 0;
  async function mostraSegui(inizio, fine, x, y) {
    const menu = q('#lc-segui');
    const turno = ++turnoMenu;
    const righe = `righe ${inizio}${fine !== inizio ? `-${fine}` : ''}`;
    const posiziona = () => {
      menu.style.left = `${Math.max(8, Math.min(x + 8, innerWidth - menu.offsetWidth - 8))}px`;
      menu.style.top = `${Math.max(8, Math.min(y + 12, innerHeight - menu.offsetHeight - 8))}px`;
    };
    const disegnaMenu = (correlate) => {
      menu.innerHTML = `<button class="btn primario" data-lc-segui="${inizio}-${fine}">⇢ Segui la selezione (${righe})</button>
        <p class="lc-menu-titolo">Funzionalità che passano di qui</p>
        ${correlate === null ? '<p class="nota">Cerco nel catalogo…</p>'
          : !correlate.catalogo ? '<p class="nota">Il catalogo non esiste ancora: crealo nella sezione Funzionalità.</p>'
            : correlate.funzionalita.length ? correlate.funzionalita.map((f) => `<button class="lc-link" data-lc-funzionalita="${esc(f.id)}" data-lc-nome="${esc(f.nome)}"><span>${esc(f.nome)}</span><small>${esc(f.categoria)}</small></button>`).join('')
              : '<p class="nota">Nessuna funzionalità del catalogo passa da queste righe.</p>'}`;
      menu.hidden = false;
      posiziona();
    };
    disegnaMenu(null);
    let correlate;
    try {
      correlate = await api('/api/funzionalita/correlate', { percorso: lc.corrente.percorso, inizio, fine });
    } catch {
      correlate = { catalogo: true, funzionalita: [] };
    }
    if (turno === turnoMenu && !menu.hidden) disegnaMenu(correlate);
  }

  function nascondiSegui() {
    turnoMenu++;
    const menu = q('#lc-segui');
    if (menu) menu.hidden = true;
  }

  function selezioneRighe(e) {
    const sel = getSelection();
    if (!sel || sel.isCollapsed) return;
    const riga = (n) => (n?.nodeType === 1 ? n : n?.parentElement)?.closest('#lc-codice .lc-riga');
    const da = riga(sel.anchorNode);
    const a = riga(sel.focusNode);
    if (!da || !a) return;
    const righe = [Number(da.dataset.riga), Number(a.dataset.riga)].sort((x, y) => x - y);
    mostraSegui(righe[0], righe[1], e.clientX, e.clientY);
  }

  // EVENTI
  async function clic(e) {
    const el = e.target.closest('[data-lc-file], [data-lc-cartella], [data-lc-cartella-rivela], [data-lc-riga], [data-lc-apri], [data-lc-scheda], [data-lc-storico], [data-lc-cerca], [data-lc-definizione], [data-lc-aggiorna], [data-lc-segui], [data-lc-vista], [data-lc-vai-blocco], [data-lc-espandi], [data-lc-funzionalita], #lc-codice .lc-num, #lc-codice .w');
    if (!el) return;
    const d = el.dataset;
    if (d.lcFile) return apri(d.lcFile);
    if (d.lcCartella) {
      if (lc.cartelleAperte.has(d.lcCartella)) lc.cartelleAperte.delete(d.lcCartella);
      else lc.cartelleAperte.add(d.lcCartella);
      return disegnaAlbero();
    }
    if (d.lcCartellaRivela) {
      lc.filtro = '';
      q('#lc-filtro').value = '';
      const parti = d.lcCartellaRivela.split('/');
      for (let i = 1; i <= parti.length; i++) lc.cartelleAperte.add(parti.slice(0, i).join('/'));
      disegnaAlbero();
      return [...qa('#lc-albero [data-lc-cartella]')].find((b) => b.dataset.lcCartella === d.lcCartellaRivela)?.scrollIntoView({ block: 'center' });
    }
    if (d.lcFunzionalita) return apriFunzionalita(d.lcFunzionalita, d.lcNome);
    if (d.lcSegui) {
      const [inizio, fine] = d.lcSegui.split('-').map(Number);
      return seguiFunzionalita(lc.corrente.percorso, inizio, fine || inizio);
    }
    if (d.lcVista) {
      lc.vista = d.lcVista;
      disegnaVista();
      return disegnaAiuti();
    }
    if (d.lcVaiBlocco) {
      if (lc.vista !== 'flusso') {
        lc.vista = 'flusso';
        disegnaVista();
      }
      const blocco = q(`#lc-blocco-${d.lcVaiBlocco}`);
      if (!blocco) return;
      blocco.scrollIntoView({ block: 'start', behavior: 'smooth' });
      blocco.classList.remove('lampeggia');
      void blocco.offsetWidth;
      return blocco.classList.add('lampeggia');
    }
    if (d.lcEspandi) {
      const [id, da, a] = d.lcEspandi.split(':').map(Number);
      const blocco = lc.flusso?.blocchi[id];
      for (let r = da; r <= a; r++) blocco?.espanse.add(r);
      const scroll = q('#lc-flusso').scrollTop;
      disegnaFlusso();
      q('#lc-flusso').scrollTop = scroll;
      return;
    }
    if (d.lcApri) {
      if (lc.vista === 'flusso') {
        lc.vista = 'codice';
        disegnaVista();
      }
      return apri(d.lcApri, d.lcAllaRiga ? Number(d.lcAllaRiga) : null);
    }
    if (d.lcRiga) {
      registraStorico(lc.corrente.percorso, Number(d.lcRiga));
      return vaiARiga(Number(d.lcRiga));
    }
    if (d.lcScheda) {
      lc.scheda = d.lcScheda;
      return disegnaAiuti();
    }
    if (d.lcStorico) return muoviStorico(Number(d.lcStorico));
    if (d.lcCerca) return cercaNelProgetto(d.lcCerca);
    if (d.lcDefinizione) return vaiADefinizione(d.lcDefinizione);
    if (d.lcAggiorna !== undefined) {
      const percorso = lc.corrente?.percorso;
      lc.corrente = null;
      lc.cache.clear();
      lc.voci.clear();
      await caricaAlbero();
      if (percorso && lc.insieme.has(percorso)) apri(percorso, lc.riga, false);
      return;
    }
    if (el.classList.contains('lc-num')) {
      const riga = Number(el.parentElement.dataset.riga);
      // Maiusc+clic: seleziona dalla riga scelta prima fino a questa
      if (e.shiftKey && lc.riga) {
        const [da, a] = [lc.riga, riga].sort((x, y) => x - y);
        qa('#lc-codice .lc-riga').forEach((r) => r.classList.toggle('selezionata', Number(r.dataset.riga) >= da && Number(r.dataset.riga) <= a));
        return mostraSegui(da, a, e.clientX, e.clientY);
      }
      qa('#lc-codice .lc-riga.selezionata').forEach((r) => r.classList.remove('selezionata'));
      el.parentElement.classList.add('selezionata');
      lc.riga = riga;
      return disegnaTesta();
    }
    if (el.classList.contains('w')) {
      if (e.ctrlKey || e.metaKey) return vaiADefinizione(el.textContent);
      if (el.classList.contains('k')) return;
      lc.parola = el.textContent;
      lc.riga = Number(el.closest('.lc-riga').dataset.riga);
      evidenziaParola(lc.parola);
      lc.scheda = 'riferimenti';
      disegnaTesta();
      disegnaAiuti();
    }
  }

  function tasti(e) {
    if (stato.sezione !== 'codice' || !lc.nodo?.isConnected) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      q('#lc-filtro').focus();
      q('#lc-filtro').select();
    } else if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      muoviStorico(e.key === 'ArrowLeft' ? -1 : 1);
    } else if (e.key === 'Escape') {
      nascondiTooltip();
      if (document.activeElement?.id === 'lc-filtro') {
        lc.filtro = '';
        q('#lc-filtro').value = '';
        q('#lc-filtro').blur();
        disegnaAlbero();
      }
    }
  }

  function creaNodo() {
    const nodo = document.createElement('div');
    nodo.id = 'lettore-codice';
    nodo.innerHTML = `
      <aside class="lc-colonna lc-sinistra">
        <div class="lc-cerca">
          <input id="lc-filtro" type="search" placeholder="Cerca file…  Ctrl+P" autocomplete="off" spellcheck="false">
          <button class="btn icona" data-lc-aggiorna title="Rileggi l'elenco dei file e il file aperto">↻</button>
        </div>
        <div id="lc-albero"><p class="lc-vuoto">Carico i file…</p></div>
      </aside>
      <section class="lc-colonna lc-centro">
        <div id="lc-testa"></div>
        <div id="lc-codice"></div>
        <div id="lc-flusso" hidden></div>
      </section>
      <aside class="lc-colonna lc-destra" id="lc-aiuti"></aside>
      <div id="lc-tooltip" hidden></div>
      <div id="lc-segui" class="lc-menu-sel" hidden></div>`;
    nodo.addEventListener('click', (e) => clic(e).catch((err) => avvisa(err.message, true)));
    nodo.querySelector('#lc-filtro').addEventListener('input', (e) => {
      lc.filtro = e.target.value;
      disegnaAlbero();
    });
    nodo.querySelector('#lc-filtro').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') q('#lc-albero .primo, #lc-albero [data-lc-file]')?.click();
    });
    for (const area of ['#lc-codice', '#lc-flusso']) {
      nodo.querySelector(area).addEventListener('mouseover', (e) => {
        const span = e.target.closest('.w, .sy');
        clearTimeout(timerTooltip);
        if (!span) return nascondiTooltip();
        timerTooltip = setTimeout(() => mostraTooltip(span), 350);
      });
      nodo.querySelector(area).addEventListener('mouseleave', nascondiTooltip);
    }
    nodo.querySelector('#lc-flusso').addEventListener('scroll', nascondiTooltip, { passive: true });
    nodo.querySelector('#lc-codice').addEventListener('mouseup', (e) => setTimeout(() => selezioneRighe(e)));
    nodo.addEventListener('mousedown', (e) => {
      if (!e.target.closest('#lc-segui')) nascondiSegui();
    });
    nodo.querySelector('#lc-codice').addEventListener('scroll', (e) => {
      lc.scroll.codice = e.target.scrollTop;
      nascondiTooltip();
      nascondiSegui();
    }, { passive: true });
    nodo.querySelector('#lc-albero').addEventListener('scroll', (e) => { lc.scroll.albero = e.target.scrollTop; }, { passive: true });
    return nodo;
  }

  document.addEventListener('keydown', tasti);

  // NODO PERSISTENTE
  // La pagina ridisegna #contenuto spesso: la sezione resta lo stesso elemento, così non perde file aperto, scroll e cartelle
  function nodo() {
    if (lc.progetto !== stato.progetto) {
      Object.assign(lc, { progetto: stato.progetto, file: [], insieme: new Set(), filtro: '', corrente: null, analisi: null, token: null, importatoDa: null, parola: null, ricerca: null, riga: null, storico: [], posizione: -1, scroll: { codice: 0, albero: 0 }, flusso: null, vista: 'codice' });
      lc.cartelleAperte = new Set();
      lc.cache = new Map();
      lc.voci = new Map();
      lc.turnoFlusso++;
      lc.nodo = creaNodo();
      disegnaTesta();
      disegnaCodice();
      disegnaAiuti();
      caricaAlbero().catch((err) => {
        q('#lc-albero').innerHTML = `<p class="lc-vuoto">${esc(err.message)}</p>`;
      });
    }
    return lc.nodo;
  }

  function ripristinaScroll() {
    q('#lc-codice').scrollTop = lc.scroll.codice;
    q('#lc-albero').scrollTop = lc.scroll.albero;
  }

  // CATALOGO DELLE FUNZIONALITÀ
  // Sezione a parte: tutte le funzionalità dell'app per categoria; il server le ricalcola a ogni salvataggio
  const ATTESA_STATO_MS = 4000;
  const ATTESA_ELENCO_MS = 20000;
  const cat = { progetto: null, nodo: null, dati: null, errore: null, filtro: '', ultimo: 0 };
  const qc = (selettore) => cat.nodo?.querySelector(selettore);

  async function caricaCatalogo() {
    const progetto = stato.progetto;
    try {
      const dati = await api('/api/funzionalita');
      if (progetto !== stato.progetto) return;
      Object.assign(cat, { dati, errore: null, ultimo: Date.now() });
    } catch (err) {
      cat.errore = err.message;
    }
    disegnaCatalogo();
  }

  function htmlStatoCatalogo(s) {
    if (!s) return '';
    const g = s.generazione;
    if (g?.stato === 'in-corso') {
      const minuti = Math.floor((Date.now() - g.inizio) / 60000);
      return `<p class="lc-cat-stato in-corso">Claude sta ${g.tipo === 'nuovi' ? 'assegnando le parti nuove del codice' : 'preparando il catalogo'}… ${minuti ? `(${minuti} min)` : ''} Può volerci qualche minuto: intanto puoi usare il resto della sala.</p>`;
    }
    const erroreClaude = g?.stato === 'errore' ? `<p class="lc-cat-stato errore">L'ultima chiamata a Claude non è riuscita: ${esc(g.errore)}</p>` : '';
    if (!s.catalogo) return erroreClaude;
    const k = (n) => `${(n / 1000).toFixed(1)}k`;
    const ultimo = s.ultimoConsumo;
    const totale = s.totaleConsumi;
    return `${erroreClaude}<p class="lc-cat-stato">Catalogo del ${esc(quando(s.aggiornato))} · il codice delle funzionalità si ricalcola gratis a ogni salvataggio${s.osservato ? '' : ' · <b>non riesco a osservare i file</b>'}</p>
      ${s.nuovi ? `<p class="lc-cat-nuovi"><b>${s.nuovi} elementi nuovi</b> nel codice non sono ancora nel catalogo (il loro codice compare già nei nastri che li usano).
        <button class="btn" data-cat-nuovi title="Una chiamata a Claude Haiku: di solito 6-8 mila token">Assegnali con Claude</button></p>` : ''}
      ${ultimo ? `<p class="lc-cat-consumi">Ultima chiamata a Claude (${esc(ultimo.tipo)}, ${esc(ultimo.modello)}): ${k(ultimo.input)} token letti · ${k(ultimo.output)} scritti${totale.chiamate > 1 ? ` · in totale ${totale.chiamate} chiamate, ${k(totale.input + totale.output)} token` : ''}</p>` : ''}`;
  }

  function disegnaCatalogo() {
    if (!cat.nodo) return;
    const d = cat.dati;
    const s = d?.stato;
    const filtro = cat.filtro.trim().toLowerCase();
    const lista = (d?.funzionalita || []).filter((f) => !filtro || `${f.nome} ${f.categoria} ${f.descrizione}`.toLowerCase().includes(filtro));
    const categorie = new Map();
    for (const f of lista) {
      if (!categorie.has(f.categoria)) categorie.set(f.categoria, []);
      categorie.get(f.categoria).push(f);
    }
    const generando = s?.generazione?.stato === 'in-corso';
    let corpo;
    if (cat.errore) corpo = `<p class="lc-vuoto">${esc(cat.errore)}</p>`;
    else if (!d) corpo = '<p class="lc-vuoto">Carico il catalogo…</p>';
    else if (!s.catalogo) {
      corpo = `<div class="lc-cat-vuoto">
        <h3>Nessun catalogo per ${esc(stato.progetto)}</h3>
        <p>Claude legge l'inventario del codice (funzioni, componenti, hook, chiamate al backend, eventi socket, route) e lo raggruppa in funzionalità con un nome chiaro: Accesso, Chat, Videochiamate, Cifratura, File…</p>
        <p class="nota">Una sola chiamata a Claude Sonnet senza lettura dei file (circa 15-25 mila token del tuo abbonamento, qualche minuto). Dopo, il codice di ogni funzionalità lo ricostruisce la sala da sola e gratis; Claude interviene di nuovo solo quando premi "Assegnali con Claude" per le parti nuove.</p>
        <button class="btn primario" data-cat-crea ${generando ? 'disabled' : ''}>Crea il catalogo con Claude</button>
      </div>`;
    } else {
      corpo = [...categorie].sort(([a], [b]) => a.localeCompare(b)).map(([nome, voci]) => `<section class="lc-cat-gruppo">
          <h3>${esc(nome)} <span class="lc-conta">${voci.length}</span></h3>
          <div class="lc-cat-griglia">${voci.map((f) => `<button class="lc-cat-scheda" data-lc-funzionalita="${esc(f.id)}" data-lc-nome="${esc(f.nome)}">
            <b>${esc(f.nome)}</b>
            <span class="lc-cat-desc">${esc(f.descrizione)}</span>
            <span class="lc-cat-numeri">${f.pezzi ? `${f.pezzi} pezzi · ${f.file} file` : 'codice non trovato: forse è stato spostato'}${f.backend ? ` · ${f.backend} chiamate al backend` : ''}</span>
          </button>`).join('')}</div>
        </section>`).join('') || '<p class="lc-vuoto">Nessuna funzionalità corrisponde alla ricerca.</p>';
    }
    qc('#cat-stato').innerHTML = htmlStatoCatalogo(s);
    qc('#cat-corpo').innerHTML = corpo;
    qc('#cat-rigenera').hidden = !s?.catalogo;
    qc('#cat-rigenera').disabled = generando;
    qc('#cat-conta').textContent = d?.funzionalita?.length ? `${d.funzionalita.length} funzionalità` : '';
  }

  function creaNodoCatalogo() {
    const nodo = document.createElement('div');
    nodo.id = 'catalogo-funzionalita';
    nodo.innerHTML = `
      <div class="lc-cat-testa">
        <div>
          <h2>Funzionalità <span class="lc-info" id="cat-conta"></span></h2>
          <div id="cat-stato"></div>
        </div>
        <input id="cat-filtro" type="search" placeholder="Cerca una funzionalità…" autocomplete="off" spellcheck="false">
        <button class="btn" id="cat-rigenera" data-cat-crea hidden title="Fa rifare a Claude tutto il catalogo da zero">Rigenera con Claude</button>
      </div>
      <div id="cat-corpo"></div>`;
    nodo.addEventListener('click', async (e) => {
      const el = e.target.closest('[data-lc-funzionalita], [data-cat-crea], [data-cat-nuovi]');
      if (!el || el.disabled) return;
      try {
        if (el.dataset.lcFunzionalita) return await apriFunzionalita(el.dataset.lcFunzionalita, el.dataset.lcNome);
        if (el.dataset.catNuovi !== undefined) {
          el.disabled = true;
          cat.dati.stato = await api('/api/funzionalita/assegna-nuovi');
          return disegnaCatalogo();
        }
        if (cat.dati?.stato?.catalogo && !confirm('Rifare tutto il catalogo da zero con Claude (Sonnet, circa 15-25 mila token)? Nomi e raggruppamenti attuali verranno sostituiti.')) return;
        const s = await api('/api/funzionalita/crea');
        cat.dati = { ...(cat.dati || { funzionalita: [] }), stato: s };
        disegnaCatalogo();
      } catch (err) {
        avvisa(err.message, true);
      }
    });
    nodo.querySelector('#cat-filtro').addEventListener('input', (e) => {
      cat.filtro = e.target.value;
      disegnaCatalogo();
    });
    return nodo;
  }

  function catalogo() {
    if (cat.progetto !== stato.progetto || !cat.nodo) {
      Object.assign(cat, { progetto: stato.progetto, dati: null, errore: null, filtro: '', nodo: creaNodoCatalogo() });
      disegnaCatalogo();
      caricaCatalogo();
    } else if (Date.now() - cat.ultimo > ATTESA_ELENCO_MS) caricaCatalogo();
    return cat.nodo;
  }

  // Mentre la sezione è aperta: stato ogni pochi secondi se Claude lavora, elenco completo ogni tanto per vedere i salvataggi
  setInterval(async () => {
    if (!cat.nodo?.isConnected || document.hidden || !cat.dati) return;
    const s = cat.dati.stato;
    if (s?.generazione?.stato === 'in-corso') {
      try {
        const nuovo = await api('/api/funzionalita/stato');
        const finito = s.generazione?.stato === 'in-corso' && nuovo.generazione?.stato !== 'in-corso';
        cat.dati.stato = nuovo;
        if (finito || nuovo.aggiornato !== s.aggiornato) return caricaCatalogo();
        disegnaCatalogo();
      } catch {}
    } else if (Date.now() - cat.ultimo > ATTESA_ELENCO_MS) caricaCatalogo();
  }, ATTESA_STATO_MS);

  return { nodo, ripristinaScroll, catalogo };
})();
