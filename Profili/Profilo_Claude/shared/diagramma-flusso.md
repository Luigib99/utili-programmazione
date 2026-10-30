# Diagramma del flusso

Regole comuni alle skill che, nella fase DIAGRAMMA (o MAPPA `dati`), devono generare un diagramma. Le regole specifiche di una skill (es. neutralità nel debug) restano nel suo SKILL.md e hanno la precedenza su queste.

## Formato

- il diagramma è una pagina HTML interattiva, sfondo scuro, generata dal template `~/.claude/shared/diagramma-flusso-template.html`.
- copia il template e sostituisci **solo** il JSON dentro `<script id="flow-data">`: non modificare HTML, CSS o JS del template (le regole del JSON sono nel commento sopra il blocco).
- se la skill lo prevede, il diagramma sostituisce la spiegazione a passi in chat: tutto il dettaglio (oggetti, spiegazioni) va nei dati del diagramma.

## Contenuto

- il diagramma è un flowchart **dall'alto verso il basso** a due corsie: ogni elemento di `nodes` è un riquadro (un passo) e una freccia lo collega al successivo.
- `side`: "FRONTEND" (corsia blu a sinistra) o "BACKEND" (corsia gialla a destra) in base a chi esegue quel codice.
- `file` + `element`: dove si trova il codice (stessi nomi della spiegazione a passi), `element` massimo ~24 caratteri.
- `path` + `line`: percorso **assoluto** del file (con `/`, es. `C:/Users/.../src/context/UserContext.js`) e riga in cui si trova `element`, verificata leggendo il file. Rendono cliccabili i nomi: in un browser esterno la funzione apre VS Code su quella riga e il file lo apre dall'inizio; in ogni caso il clic copia `percorso:riga`, da incollare in VS Code con Ctrl+P (il browser integrato di VS Code blocca i link `vscode://`).
- `action`: cosa fa il passo, una frase breve (massimo ~70 caratteri) leggibile anche senza aprire il pannello.
- `section`: titolo che apre un nuovo flusso indipendente (es. HTTP e socket), senza freccia dal nodo precedente.
- `incoming: "lost"`: solo se la freccia dal nodo precedente non arriva davvero.
- se il backend del progetto è disponibile in locale (es. la repo del backend nella stessa cartella del progetto), leggilo per descrivere i nodi BACKEND e i loro payload; se non lo è, scrivi nella `explanation` che quella parte è dedotta dal frontend.
- `payloadName`: etichetta della freccia in uscita, cioè cosa passa al nodo successivo (es. "response.data", "props").
- `payload`: l'oggetto **reale** che passa, con la struttura presa dal codice; i valori possono essere di esempio, ma in quel caso dillo nella `explanation`. `null` se non passa nulla.
- **dati sensibili**: nei `payload` (e in tutto il file) mai valori reali di token, refresh token, chiavi, password, PIN, OTP, segreti TOTP, materiale crittografico, contenuti di messaggi/file o dati personali reali, nemmeno se letti da log o variabili d'ambiente: usa solo segnaposto come `"<accessToken>"`, `"<chiave AES base64>"`, `"<email utente>"`. Il file resta in chiaro su disco.
- `fields`: spiegazione dei campi importanti del payload (non di tutti), una riga ciascuno.
- ogni nodo ha sei testi, scritti in linguaggio semplice per chi sta imparando (frasi complete, niente gergo non spiegato, il codice tra backtick).
- **soggetto sempre esplicito**: ogni frase dice *chi* compie l'azione con il nome nel codice (es. "`getAllUsers` prende…", "`UserProvider` mette…", "il backend emette…"), mai frasi con soggetto sottinteso come "prende solo…" o "restituisce…". Se lo stesso codice compare in due passi (es. prima e dopo un `await`), dillo esplicitamente.
  - `physical` (Cosa succede fisicamente, la prima sezione del pannello): **solo** ciò che l'utente vede e fa in quel momento, in 1-2 frasi: cosa tocca o scrive, cosa compare o cambia sullo schermo, suoni e vibrazioni (es. "Mario preme il pulsante verde; sullo schermo compare 'Chiamata in corso'."). Niente di ciò che succede dentro il telefono, in rete o sul server: quello va in `simple`. Se il passo non si vede, scrivi cosa resta sullo schermo nel frattempo (es. "Mario non vede nulla di nuovo: resta la rotella di caricamento.").
  - `simple` (Spiegazione semplice, la seconda sezione del pannello): cosa succede dietro le quinte in quel momento, spiegato come a chi non programma, 1-3 frasi, senza nomi di codice né termini tecnici, anche con un paragone della vita reale.
  - `does` (Cosa fa): cosa esegue concretamente quel codice, passo per passo, in 2-3 frasi.
  - `purpose` (A cosa serve): perché esiste e che ruolo ha nel flusso.
  - `receives` (Riceve): cosa arriva in ingresso e da dove (parametri, props, risposta, evento).
  - `returns` (Restituisce): cosa produce o restituisce, inclusi i casi di errore rilevanti.- `terms`: glossario del passo, 1-4 termini tecnici usati nei testi (librerie, hook, concetti) con una spiegazione di una riga; non ripetere lo stesso termine in più nodi.
- `tracked` + `state`: per ogni oggetto che cambia nel flusso (lista in cache, stato di un componente, body che viene arricchito, mappa nel backend…) aggiungi `{ "id", "name" }` in `tracked`; nei nodi in cui cambia metti in `state["<id>"]` il suo valore **completo** dopo quel passo. La colonna a sinistra mostra un riquadro per oggetto, con solo il nome e i campi evidenziati (aggiunti, cambiati, rimossi): le spiegazioni del cambiamento vanno nei testi del nodo (`does`, `returns`), non nella colonna. Se un cambiamento è solo ipotetico (codice non ancora chiamato), dillo nei testi del nodo.
- massimo ~12 nodi: se il flusso è più lungo, raggruppa le parti non interessate in un solo nodo.

## Riferimenti ai passi

- i numeri **D1, D2…** nel cerchio in alto a sinistra di ogni riquadro sono il **riferimento comune** tra te e l'utente per tutta la richiesta (D = dati, per distinguerli dai riquadri S del diagramma della struttura).
- in tutte le fasi successive al diagramma (correzioni, risultati, segnalazioni, verifica) indica le parti del flusso come "DN", seguito dal nome dell'elemento: es. "D4 (`getAllUsers`)".
- l'utente può rispondere usando i numeri (es. "al passo 4 farei…", "tra D5 e D6 manca…"): interpreta ogni numero, con o senza D, come il riquadro corrispondente del flusso. Se un numero non esiste o il riferimento è ambiguo, chiedi prima di andare avanti.
- quando citi un intervento tra due passi, usa "tra DN e DM".
- non rigenerare il diagramma con una numerazione diversa durante la stessa richiesta. Se serve un diagramma nuovo (es. il flusso dopo la modifica), salvalo in un file nuovo e dichiara che da quel momento i numeri si riferiscono a quel file.

## Salvataggio

- salva in `~/flussi/<nome-cartella-progetto>/<AAAA-MM-GG>-<argomento-in-kebab-case>.html`; crea la cartella se non esiste.
- in chat indica solo il percorso del file (cliccabile), nel blocco della skill che mostra il diagramma (MAPPA o DIAGRAMMA).
