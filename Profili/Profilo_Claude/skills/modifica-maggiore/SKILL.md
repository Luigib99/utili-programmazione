---
name: modifica-maggiore
description: Modifica o aggiunta maggiore di codice nel progetto, guidata dalle indicazioni dell'utente
argument-hint: "<vuoto per lo schema, oppure TITOLO: / OBIETTIVO: / DOVE: / MAPPA: dati, struttura o entrambi / NOTE:>"
disable-model-invocation: true
---

# MODIFICA MAGGIORE

La richiesta dell'utente è: $ARGUMENTS

L'utente decide **cosa** cambiare e dà le indicazioni su **come**, anche imprecise; tu completi i dettagli, mostri come hai interpretato ogni indicazione prima di toccare il codice e segnali i problemi. Ogni messaggio segue il "Formato dei messaggi" di `~/.claude/shared/scheda-richiesta.md`, con i blocchi indicati in ogni fase.

## Struttura

1. passa a SCHEDA.
2. passa a MAPPA.
3. passa a MODIFICHE UTENTE.
4. passa a PIANO.
5. passa a IMPLEMENTAZIONE.
6. passa a VERIFICA.
7. quando la richiesta è conclusa (sarà l'utente a dirlo) procedi alla SPIEGAZIONE FINALE.

In qualsiasi fase:

- se l'utente scrive "aiuto" o "indizio", rispondi con il solo blocco **1. SUGGERIMENTI**: al massimo 3 suggerimenti diretti (cosa si può cambiare, dove), con i numeri del diagramma, senza domande; poi attendi.
- non fare mai domande da interrogazione: le scelte si offrono come opzioni con lettera (A, B, C).

## SCHEDA

- campi, tutti obbligatori tranne `NOTE`:
  - `TITOLO`: nome breve della richiesta; è anche il titolo della sessione e il nome del file del diagramma.
  - `OBIETTIVO`: cosa vuole ottenere l'utente.
  - `DOVE`: pagina, flusso o file interessati.
  - `MAPPA`: quale diagramma serve: `dati`, `struttura` o `entrambi`. La sceglie **sempre l'utente**: non dedurla.
  - `NOTE`: tutto il resto (vincoli, dubbi, esempi).
- se l'utente scrive testo libero o manca un campo obbligatorio, chiedi solo i campi mancanti con le domande a scelta (AskUserQuestion); per `MAPPA` le opzioni sono `dati`, `struttura`, `entrambi`.
- non mostrare la scheda per conferma: con i campi completi passa subito a MAPPA.

## MAPPA

- leggi il codice di `DOVE` e di ciò che è collegato quanto basta per disegnare lo stato **attuale**, cioè prima della modifica.
- `MAPPA` `dati` o `entrambi`: leggi e applica le regole in `~/.claude/shared/diagramma-flusso.md` (riferimenti **D1, D2…**); ogni oggetto, lista o json nei `payload` deve essere completo.
- `MAPPA` `struttura` o `entrambi`: leggi e applica le regole in `~/.claude/shared/diagramma-pagina.md` (riferimenti **S1, S2…**).
- in questa fase sai di che argomento si tratta ma **non** cosa e come l'utente vuole cambiarlo: il diagramma e le note descrivono com'è adesso, senza proporre modifiche.
- rispondi con i blocchi:
  - **1. MAPPA**: il percorso del file (cliccabile); con `entrambi`, una riga per file con davanti `DATI` o `STRUTTURA`.
  - **2. NOTE**: massimo 3 punti su com'è fatto adesso che servono a decidere (es. un pezzo duplicato, un valore scritto a mano, un punto che usa lo stesso codice), con i numeri del diagramma.
  - **3. RICHIESTA**: "Scrivimi per punti tutte le modifiche che vuoi apportare, con le indicazioni che hai (anche imprecise)."
- poi fermati e attendi.

## MODIFICHE UTENTE

- l'utente scrive un elenco di punti: cosa cambiare e, se vuole, come; può usare i numeri del diagramma (es. "S7: frecce più grandi", "unire S6 e S11").
- ogni punto dell'utente è vincolante: non aggiungere, togliere o unire punti senza dirlo nel PIANO.

## PIANO

- per ogni punto dell'utente, nello stesso ordine e con lo stesso numero, scrivi come l'hai interpretato e cosa farai, in una riga, con i numeri del diagramma e i file:
  - `✅` indicazione chiara: la segui così com'è.
  - `⚠️` indicazione vaga o con più strade possibili: 2-3 opzioni concrete con lettera, la più sicura o coerente col progetto per prima con "(consigliata)".
- rispondi con i blocchi:
  - **1. PIANO**: un punto per riga come sopra.
  - **2. ATTENZIONE**: solo se esistono, al massimo 3 problemi concreti di un'indicazione (sicurezza, perdita di dati, regressioni, crash, altre schermate toccate), ognuno con l'alternativa; decide sempre l'utente.
  - **3. RICHIESTA**: "Procedo? Per i ⚠️ scrivi la lettera."
- poi fermati e attendi:
  - "procedi" con le lettere dei `⚠️` (o senza `⚠️`): passa a IMPLEMENTAZIONE; un `⚠️` senza lettera usa l'opzione consigliata e lo dichiari in VERIFICA.
  - l'utente cambia o aggiunge punti: aggiorna il PIANO e mostralo di nuovo.

## IMPLEMENTAZIONE

- implementa **solo** i punti del piano accettato: se per completarne uno serve toccare altro (un file, una funzione o un comportamento non previsti), fermati prima di modificarlo, spiega cosa serve e perché, e attendi l'ok.
- i dettagli non indicati (nomi, collocazione, sintassi, gestione errori) decidili tu seguendo le convenzioni del progetto.
- niente modifiche "già che c'ero": quello che noti fuori dal piano lo segnali in VERIFICA, non lo applichi.

## VERIFICA

- rispondi con i blocchi:
  - **1. FATTO**: per ogni punto del piano `✅` fatto o `❌` non fatto o parziale (con il motivo), nomeFile (cliccabile) e cosa è cambiato.
  - **2. DA CONTROLLARE**: i dettagli che hai deciso tu, con nomeFile e numero del diagramma, e le opzioni consigliate usate al posto di una lettera mancante.
  - **3. COME PROVARE**: i passi concreti per vedere il risultato nell'app.
  - **4. SEGNALAZIONI**: solo se esistono, cose notate fuori dal piano.
  - **5. RICHIESTA**: "Prova e dimmi se va bene o cosa cambiare."
- se l'utente chiede altre modifiche, trattale come nuovi punti: PIANO, IMPLEMENTAZIONE, VERIFICA.

## SPIEGAZIONE FINALE

- rispondi con i blocchi:
  - **1. COSA HO FATTO**: cosa e perché hai implementato, gli effetti sul codice e il risultato ottenuto, in modo tecnico e schematico.
  - **2. GLOSSARIO**: i termini tecnici nuovi incontrati durante la richiesta, una riga ciascuno.
