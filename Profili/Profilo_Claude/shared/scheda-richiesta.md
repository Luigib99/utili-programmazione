# Scheda richiesta

Regole comuni alle skill che, nella fase SCHEDA RICHIESTA, trasformano la richiesta dell'utente in una scheda a campi. I campi e le eccezioni di una skill restano nel suo SKILL.md e hanno la precedenza su queste regole.

L'obiettivo è che l'utente abbia il controllo totale su cosa viene fatto anche senza conoscere bene il codice: decide lui, scegliendo tra opzioni concrete, e niente viene supposto in silenzio.

## Formato dei messaggi

Vale per ogni messaggio delle skill che richiamano questo file, in tutte le fasi.

- il messaggio è fatto **solo** di blocchi con titolo numerato in maiuscolo e grassetto (es. `**1. DIAGRAMMA**`): niente testo prima, tra o dopo i blocchi.
- i blocchi di ogni fase sono indicati nello SKILL.md; un blocco senza contenuto si omette e la numerazione resta progressiva.
- ogni blocco ha al massimo 3 righe o 3 punti, una riga ciascuno; fanno eccezione solo SCHEDA, MODIFICHE e GLOSSARIO, che hanno una riga per elemento.
- frasi brevi e dirette: niente premesse, riepiloghi di quanto già detto o spiegazioni non richieste.
- per le parti del flusso usa i numeri dei passi del diagramma; per il codice nomeFile:riga cliccabile.
- l'ultimo blocco, quando serve una risposta, è sempre **RICHIESTA**: una sola riga con l'azione attesa dall'utente (es. "Come intendi procedere?", "Procedo?", "Confermi la scheda?").
- **mai domande di verifica o da interrogazione** (es. "perché secondo te…?", "cosa succede se…?"), in nessuna fase: confondono l'utente. Se l'utente chiede aiuto o un indizio, dai suggerimenti diretti, non domande.

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

- mostra la scheda con i blocchi (vedi "Formato dei messaggi"):
  - **1. SCHEDA**: un campo per riga, con il segno di provenienza: `✍️` scritto dall'utente, `🔍` dedotto dal codice, `☑️` scelto dall'utente tra le opzioni.
  - **2. RISCHI**: solo se esistono, i rischi concreti emersi leggendo il codice (es. "`DOVE` è usato anche da `X`: la modifica cambia anche quella schermata").
  - **3. RICHIESTA**: "Confermi la scheda?"
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
  - `✅` rispettato, con una riga su dove/come.
  - `❌` non rispettato o parziale, con il motivo.
- se la scheda ha un campo `VERIFICA` o `COME RIPRODURLO`, indica i passi concreti che l'utente deve fare per controllare il risultato.
