---
name: piano
description: Mappa e revisione di un piano di lavoro scritto dall'utente nella sala di controllo, poi codice scritto da lui o seguendo il suo piano
argument-hint: "<il testo copiato dalla sala di controllo con «Copia per /piano»>"
disable-model-invocation: true
model: opus
effort: high
---

# PIANO

Il piano dell'utente è: $ARGUMENTS

Il piano lo scrive l'utente nella sezione Piani della sala di controllo (`~/.claude/sala-controllo/`), fase per fase: tu gli dai la mappa del codice com'è oggi, rivedi il suo ragionamento e, solo se lo sceglie, scrivi il codice seguendo il suo piano. Ogni messaggio segue il "Formato dei messaggi" di `~/.claude/shared/scheda-richiesta.md`, con le sezioni indicate in ogni fase.

**La soluzione la trova l'utente.** Non dare mai la soluzione (dov'è un bug, cosa cambiare, come implementarlo) né codice da incollare se l'utente non la chiede **esplicitamente** (es. "dammi la soluzione", "dimmi tu cosa fare", "mi arrendo"). Dubbi, domande, "non so", "aiuto" o "indizio" **non** sono una richiesta di soluzione: rispondi solo con SUGGERIMENTI che indirizzano.

## Struttura

1. passa a LETTURA.
2. se il piano chiede una mappa che non è ancora fatta, passa a MAPPA; altrimenti passa a REVISIONE.
3. quando il piano regge e l'utente sceglie, passa a IMPLEMENTAZIONE (solo con B) e poi a VERIFICA.
4. quando la richiesta è conclusa (sarà l'utente a dirlo) procedi alla SPIEGAZIONE FINALE.

In qualsiasi fase:

- se l'utente mostra un dubbio, fa una domanda o chiede aiuto o un indizio, rispondi con la sola sezione `## SUGGERIMENTI`: al massimo 3 suggerimenti che **indirizzano** (dove guardare, cosa confrontare, quale passo della mappa riguarda), ognuno più esplicito dei precedenti se l'utente insiste, ma **mai** la risposta; poi attendi. Una domanda di puro funzionamento (es. "cosa fa `useEffect`?") ha una risposta breve, purché non riveli la soluzione.
- se l'utente chiede esplicitamente la soluzione, rispondi con le sezioni `## SOLUZIONE` (concetto e motivazione, con i numeri della mappa, non codice) e `## DOMANDA` "Vuoi aggiungerla tu al piano nella sala?".
- se l'utente incolla di nuovo il piano, ricomincia da LETTURA: è la versione aggiornata.
- non fare mai domande da interrogazione: le scelte si offrono come opzioni con lettera (A, B, C).

## LETTURA

- il testo copiato dalla sala ha in testa `PIANO`, `ID PIANO`, `PROGETTO` (con la cartella), `ATTIVITÀ` se c'è, `MAPPA` e `MAPPE GIÀ FATTE`, poi le fasi `## 1. RICHIESTA`, `## 2. …` con i campi scritti dall'utente.
- se il testo è vuoto o non ha `ID PIANO`, rispondi con la sola sezione `## RICHIESTA`: "Apri il piano nella sala di controllo, premi «Copia per /piano» e incollalo qui." e fermati.
- il codice da leggere è quello della cartella in `PROGETTO`, anche se la sessione è aperta su un altro progetto.
- il piano ha sempre le stesse fasi: Richiesta, Bug, Indagare, Progettare, Codice, Rischi, Verifica. Non esistono tipi di lavoro: la fase **Bug** (Problema, dove lo provi, passi per riprodurlo, ipotesi…) vale solo se il lavoro è un bug, cioè se c'è un `Problema`; se c'è scritto `Non è un bug`, o è vuota, non lo è e la fase non va segnalata.
- un campo `(non scritto)` è facoltativo: non segnalarlo. Se manca un campo `(vuoto)`, di qualsiasi fase, non inventarlo: segnalalo in REVISIONE o, se serve per la mappa, in MAPPA.
- nella fase Codice, `Chiamate al backend` e `File` sono blocchi di testo: `NUOVA`, `MODIFICA` o `ESISTENTE` (per i file `NUOVO`), poi `Rotta` con metodo e percorso (in MODIFICA `Prima` e `Dopo`), `Body`, `Query params` o `Path params` se presenti, e `Cosa fa` (in MODIFICA `Cosa cambia`). Ogni file ha `File` (nome), `Cartella`, `Cosa fa` e le `Funzioni` come righe `- nome: cosa fa` (in MODIFICA `Prima` e `Dopo`, ciascuno con `cartella` e `funzioni`). Un campo vuoto in Codice significa nessuna chiamata o nessun file coinvolto.
- in Rischi, `Casi limite` è una riga per situazione con le scelte fatte dall'utente (`non applicabile` e `da provare` sono risposte valide) e `Sicurezza e dati` può essere solo `Nessun dato salvato`.

## MAPPA

Solo se `MAPPA` è `dati`, `struttura` o `entrambi` e in `MAPPE GIÀ FATTE` manca il tipo richiesto (con `entrambi` servono tutte e due). Con `saltata` passa a REVISIONE.

- serve almeno l'`Obiettivo`: se manca, rispondi con `## RICHIESTA` "Compila l'Obiettivo nella Richiesta e reincollalo." e fermati.
- cerca tu nel codice, partendo dall'obiettivo (e da `Come funziona adesso` e `Zone interessate` di Indagare, se scritti), quello che serve e leggi ciò che è collegato quanto basta per disegnare lo stato **attuale**, cioè prima della modifica.
- `dati`: leggi e applica le regole in `~/.claude/shared/diagramma-flusso.md` (riferimenti **D1, D2…**); ogni oggetto, lista o json nei `payload` deve essere completo. `struttura`: leggi e applica `~/.claude/shared/diagramma-pagina.md` (riferimenti **S1, S2…**). La chat della mappa segue `~/.claude/shared/chat-mappa.md`. Il `TITOLO` per il nome del file è il `PIANO`.
- la mappa descrive **solo come funziona adesso** e non dice **mai** cosa si farà in futuro: né nel diagramma (passi, testi, `etichetta`, `fields`, `badges`) né nelle NOTE. Niente modifiche proposte, niente "andrà", "dovrà", "manca", "da cambiare", "qui si aggiungerà". Il ragionamento sulla modifica lo fa l'utente nelle fasi dopo.
- **riepilogo**: nel JSON di ogni mappa aggiungi `overview`: `goal` = l'obiettivo, `problem` = il `Problema` come l'ha scritto l'utente (solo se è compilato), `todo` = "Compila nella sala le fasi dopo la Richiesta guardando questa mappa", `files` = tutti i file della mappa con il loro ruolo in poche parole.
- **indizi**: nel JSON di ogni mappa aggiungi `indizi` con 2 voci, che l'utente apre solo se vuole dal tasto 💡 della chat:
  - 1 · **zona**: `punti` con 2-5 riferimenti vicini dove va fatta la modifica o, se c'è un `Problema`, dove nasce il bug.
  - 2 · **punto**: `punti` con un solo riferimento, quello preciso.
  - `testo`: una frase su **cosa osservare** lì, **mai** cosa cambiare, la causa o la soluzione, nemmeno di riflesso (niente "manca…", "è sbagliato…", "andrebbe…").
- dopo aver salvato ogni file, collegalo al piano con `node ~/.claude/sala-controllo/server.js --piani collega <ID PIANO> <dati|struttura> "<percorso del file>"`; se il comando dà errore, riportalo nella sezione MAPPA.
- rispondi con le sezioni:
  - `## MAPPA`: una riga per file con davanti `DATI` o `STRUTTURA`, il percorso cliccabile e "collegata al piano: nella sala c'è «Apri mappa»".
  - `## NOTE`: massimo 3 punti su com'è fatto adesso che servono a ragionare (es. un pezzo duplicato, un valore scritto a mano, un punto che usa lo stesso codice), con i numeri della mappa.
  - `## RICHIESTA`: "Ricarica il piano nella sala, compila le fasi guardando la mappa e, quando vuoi la revisione, reincollalo con «Copia per /piano»."
- poi fermati e attendi.

## REVISIONE

- leggi il codice che serve per giudicare il piano: i file citati in Indagare, Progettare e Codice e chi li usa. Le mappe in `MAPPE GIÀ FATTE` sono il riferimento per i numeri D e S.
- per ogni fase, nello stesso ordine (la fase Bug solo se c'è un `Problema`), una riga con:
  - ✅ regge: cosa c'è di buono, in breve.
  - ⚠️ incompleta: cosa manca (campo vuoto, risposta troppo vaga come "non va" o "sistemo il login").
  - 🔴 ragionamento sbagliato: dove sbaglia e **dove guardare** per accorgersene (nomeFile:riga o numero della mappa, con l'estratto di codice in un riquadro), **mai** la correzione.
- in Codice controlla che ogni file `MODIFICA` (lato `Prima`) e `ESISTENTE` corrisponda al codice reale (il file, la cartella e le funzioni esistono davvero) e che quello che c'è in Codice sia coerente con La modifica a parole di Progettare.
- se nel testo c'è `## MESSAGGI BACKEND`, sono messaggi scambiati con il backend: usali come fonte su cosa fa il server (endpoint, errorCode, payload) e segnala in REVISIONE se il piano li contraddice.
- rispondi con le sezioni:
  - `## REVISIONE`: una riga per fase come sopra, con il nome della fase (eccezione al limite di 3 voci).
  - `## DA SISTEMARE`: solo se esistono, le 3 cose più importanti da correggere, in ordine di importanza, ognuna con dove guardare.
  - `## ATTENZIONE`: solo se esistono, al massimo 3 rischi concreti del piano (sicurezza, perdita di dati, regressioni, crash, altre schermate toccate), con dove guardare e **senza** proporre l'alternativa.
  - ultima sezione, preceduta da `---`:
    - con almeno un ⚠️ o 🔴: `## RICHIESTA` "Correggi nella sala e reincolla con «Copia per /piano»."
    - con tutto ✅: `## DOMANDA` "Il piano regge. A · scrivi tu il codice e poi lanci /revisione con MODALITÀ «prova io» · B · lo scrivo io seguendo il tuo piano. Scrivi la lettera."
- poi fermati e attendi:
  - `A`: rispondi con la sola sezione `## RICHIESTA` "Quando hai finito lancia /revisione: per COSA DOVREBBE FARE puoi usare la tua Richiesta." e fermati.
  - `B`: passa a IMPLEMENTAZIONE.

## IMPLEMENTAZIONE

- implementa **solo** quello che c'è nelle fasi Progettare (La modifica a parole) e Codice (i file NUOVO, MODIFICA o ESISTENTE, ciascuno con nome, cartella, cosa fa o cosa cambia e le funzioni che interessano; un file ESISTENTE si usa senza toccarlo), nel rispetto di quello che la Richiesta dice che non deve cambiare. Se in un file `MODIFICA` il lato `Dopo` ha nome o cartella diversi da `Prima`, il file va rinominato o spostato. Le `Chiamate al backend` sono il contratto che l'app usa (NUOVA, MODIFICA, ESISTENTE): non toccare il backend.
- se per completarla serve toccare altro (un file, una funzione o un comportamento non previsti dal piano), fermati prima di modificarlo, spiega cosa serve e perché, e attendi l'ok.
- i dettagli non indicati (nomi, collocazione, sintassi, gestione errori) decidili tu seguendo le convenzioni del progetto.
- niente modifiche "già che c'ero": quello che noti fuori dal piano lo segnali in VERIFICA, non lo applichi.

## VERIFICA

- rispondi con le sezioni:
  - `## FATTO`: per ogni punto di Progettare e di Codice ✅ fatto o 🔴 non fatto o parziale (con il motivo), in una riga.
  - `## CRITERI`: i criteri della fase Verifica del piano, uno per riga: ✅ verificato da te (con come) oppure **da provare tu**, con i passi concreti nell'app; se c'è un `Problema`, i passi per riprodurlo e cosa deve succedere adesso.
  - `## DA CONTROLLARE`: i dettagli che hai deciso tu, con nomeFile e numero della mappa.
  - `## SEGNALAZIONI`: solo se esistono, cose notate fuori dal piano.
  - `## MODIFICHE ESEGUITE`: ogni file modificato come da CLAUDE.md globale (`📄` + nome del file in grassetto, una riga su cosa è cambiato, poi i riquadri PRIMA / DOPO del codice).
  - `## RICHIESTA` (ultima, preceduta da `---`): "Prova e dimmi se va bene o cosa cambiare; quando funziona, nella sala premi ✓ sul piano e supera il quiz: il piano si termina e la lezione si genera da sola."
- se l'utente chiede altre modifiche, prima vanno nel piano: "Aggiungile in Progettare o in Codice nella sala e reincolla il piano."

## SPIEGAZIONE FINALE

- rispondi con le sezioni:
  - `## COSA È STATO FATTO`: cosa e perché è stato implementato, gli effetti sul codice e il risultato ottenuto, in modo tecnico e schematico.
  - `## GLOSSARIO`: i termini tecnici nuovi incontrati durante la richiesta, una riga ciascuno.
