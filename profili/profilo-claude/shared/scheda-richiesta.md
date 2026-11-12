# Scheda richiesta

Regole comuni alle skill che, nella fase SCHEDA RICHIESTA, trasformano la richiesta dell'utente in una scheda a campi. I campi e le eccezioni di una skill restano nel suo SKILL.md e hanno la precedenza su queste regole.

L'obiettivo è che l'utente abbia il controllo totale su cosa viene fatto anche senza conoscere bene il codice: decide lui, scegliendo tra opzioni concrete, e niente viene supposto in silenzio.

## Formato dei messaggi

Vale per ogni messaggio delle skill che richiamano questo file, in tutte le fasi. Si aggiunge al "FORMATO RISPOSTE" del CLAUDE.md globale (titoli `##` senza numeri e senza emoji, `---` tra un titolo e il successivo, schemi, codice in riquadri, solo le emoji ammesse), che ha la precedenza su tutto ciò che non è scritto qui.

- il messaggio è fatto **solo** di sezioni con titolo (es. `## DIAGRAMMA`): niente testo fuori dalle sezioni. I titoli sono quelli indicati nello SKILL.md di ogni fase, senza numeri.
- una sezione senza contenuto si omette.
- ogni sezione ha poche voci, una riga ciascuna (di norma al massimo 3); fanno eccezione SCHEDA, MODIFICHE ESEGUITE, GLOSSARIO e i passi in ordine, che hanno una voce per elemento.
- frasi brevi e dirette: niente premesse, riepiloghi di quanto già detto o spiegazioni non richieste.
- per le parti del flusso usa i numeri dei passi del diagramma; per il codice mostra l'estratto reale in un riquadro sotto il punto che spiega, con il nome del file in grassetto una volta in testa alla sezione (niente righe cliccabili al posto del codice). Il percorso cliccabile resta solo per i file dei diagrammi.
- ogni modifica a un file va mostrata nella sezione `## MODIFICHE ESEGUITE` con PRIMA / DOPO del codice (vedi CLAUDE.md globale).
- l'ultima sezione, solo se serve una risposta all'utente, è `## DOMANDA` (una domanda, es. "Come intendi procedere?", "Procedo?", "Confermi la scheda?") oppure `## RICHIESTA` (qualcosa che l'utente deve fare, es. "Ricarica il piano nella sala"): una sola riga, preceduta da `---`. Se non serve nulla, non c'è.
- **mai domande di verifica o da interrogazione** (es. "perché secondo te…?", "cosa succede se…?"), in nessuna fase: confondono l'utente. Se l'utente chiede aiuto o un indizio, dai suggerimenti diretti, non domande.

## Campi comuni

Presenti in tutte le skill; lo SKILL.md dice se sono obbligatori.

- `TITOLO`: nome breve della richiesta. Tu lo usi, in kebab-case, come nome dei file dei diagrammi.
- `MAPPA`: quale diagramma serve: `dati`, `struttura` o `entrambi`. La sceglie **sempre l'utente**: non dedurla. Se è obbligatoria e manca, chiedila con le tre opzioni; se è facoltativa e manca, niente diagramma.
  - `dati`: regole in `~/.claude/shared/diagramma-flusso.md`, riferimenti **D1, D2…**.
  - `struttura`: regole in `~/.claude/shared/diagramma-pagina.md`, riferimenti **S1, S2…**.
  - `entrambi`: i due diagrammi, in due file.
  - nel blocco che mostra il diagramma scrivi una riga per file, con davanti `DATI` o `STRUTTURA`.

## Lettura della richiesta

- l'utente può scrivere i campi (es. `OBIETTIVO: ...`, uno per riga, in qualsiasi ordine) oppure testo libero.
- se scrive testo libero, distribuiscilo nei campi della skill senza aggiungere nulla che non ci sia.
- se un campo scritto dall'utente è contraddittorio con un altro o con il codice, segnalalo: non scegliere tu quale dei due vale.

## Compilazione

- prima di fare domande **leggi il codice** necessario a capire la richiesta: le opzioni che proponi devono venire dal codice reale, non da ipotesi.
- compila i campi che si deducono con certezza dal codice e segnali come *dedotti*; quelli scritti dall'utente sono *tuoi*.
- un campo obbligatorio mancante o ambiguo **non va inventato**: chiedilo con lo strumento delle domande a scelta (AskUserQuestion).
  - massimo 4 domande per volta, una per campo.
  - ogni opzione è concreta e presa dal codice (es. per DOVE: "solo la schermata `ChatScreen`" · "anche la lista `ConversationList`" · "anche le notifiche"), con una riga che dice cosa comporta.
  - se una opzione è chiaramente la più sicura o la più coerente con il progetto, mettila per prima con "(consigliata)".
  - le domande devono essere comprensibili senza conoscere il codice: nomi tecnici tra backtick, ma il significato spiegato a parole.
- i campi facoltativi non scritti restano vuoti: non chiederli, salvo che servano a evitare un errore concreto.
- **COSA NON SO**: ogni dubbio scritto dall'utente va chiarito (risposta breve o domanda a scelta) prima di modificare qualsiasi file.

## Conferma

- mostra la scheda con le sezioni (vedi "Formato dei messaggi"):
  - `## SCHEDA`: un campo per riga, nel formato `**CAMPO**: valore`, con l'origine in corsivo alla fine: *scritto da te*, *dedotto dal codice*, *scelto da te* (niente emoji: sono riservate ai significati fissi del CLAUDE.md).
  - `## RISCHI`: solo se esistono, i rischi concreti emersi leggendo il codice (es. "`DOVE` è usato anche da `X`: la modifica cambia anche quella schermata").
  - `## DOMANDA`: "Confermi la scheda?"
- poi fermati e attendi:
  - "ok" o "procedi": la scheda è confermata e diventa il **contratto** della richiesta.
  - una correzione: aggiorna la scheda e mostrala di nuovo.
- le eccezioni alla conferma (es. skill che procedono in automatico) sono indicate nello SKILL.md.

## Recinto

- dopo la conferma lavora **solo** dentro `DOVE` e nel rispetto di `VINCOLI` e `FUORI SCOPO`.
- se per completare la richiesta serve toccare altro (un file, una funzione o un comportamento non previsti dalla scheda), fermati prima di modificarlo: spiega cosa serve e perché, e attendi l'ok.
- niente modifiche "già che c'ero": miglioramenti o problemi notati fuori dalla scheda si segnalano a fine lavoro, non si applicano.

## Controllo finale

- alla fine del lavoro (nel RIEPILOGO o nella VERIFICA della skill) ripercorri la scheda campo per campo:
  - ✅ rispettato, con una riga su dove/come.
  - 🔴 non rispettato o parziale, con il motivo.
- se la scheda ha un campo `VERIFICA` o `COME RIPRODURLO`, indica i passi concreti che l'utente deve fare per controllare il risultato.
