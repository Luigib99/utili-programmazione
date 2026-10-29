---
name: modifica-maggiore
description: Modifica o aggiunta maggiore di codice nel progetto, guidata in modo didattico
argument-hint: "<vuoto per lo schema, testo libero o OBIETTIVO: / ORA: / DOVE: / ESEMPIO: / SIMILE A: / VERIFICA: / VINCOLI: / FUORI SCOPO: / COSA NON SO:>"
disable-model-invocation: true
---

# MODIFICA MAGGIORE

La richiesta dell'utente è: $ARGUMENTS

L'obiettivo è che l'utente impari a prendere le decisioni di design (dove intervenire, cosa cambia nel flusso, quali casi limite esistono), non a dettare la sintassi. Tieni le fasi snelle: niente spiegazioni superflue, niente domande ripetute.

## Struttura

1. passa a SCHEDA RICHIESTA.
2. analizza e individua dove e come inserire il codice.
3. passa a SPIEGAZIONE COMPLETA FLUSSO.
4. passa a RISPOSTA UTENTE.
5. passa a RISULTATO RISPOSTA UTENTE.
6. passa a IMPLEMENTAZIONE CODICE.
7. passa a VERIFICA.
8. quando la richiesta è conclusa (sarà l'utente a dirlo) procedi alla SPIEGAZIONE FINALE.

In qualsiasi fase:

- se l'utente scrive "mi arrendo", spiega tu come implementeresti la modifica (concetto e motivazione, non codice), poi chiedi "procedi" e passa a IMPLEMENTAZIONE CODICE.
- se la richiesta è ambigua, chiedi chiarimenti prima di andare avanti.

## SCHEDA RICHIESTA

- leggi e applica le regole in `~/.claude/shared/scheda-richiesta.md`.
- campi (\* = obbligatorio):
  - `OBIETTIVO`\*: cosa deve succedere a modifica finita, descritto come lo vede chi usa l'app.
  - `ORA`: cosa succede adesso, prima della modifica; con `OBIETTIVO` definisce la differenza esatta da realizzare.
  - `DOVE`\*: schermate, flussi o file interessati.
  - `ESEMPIO`: un caso concreto con dati reali (es. "Mario chiude l'app alle 10:00 → alle 10:05 il pallino diventa grigio").
  - `SIMILE A`: una parte dell'app che funziona già come si vuole; il codice nuovo segue lo stesso approccio e le stesse convenzioni.
  - `VERIFICA`\*: come l'utente controlla che la modifica funziona (azioni da fare e risultato atteso).
  - `VINCOLI`: cosa non deve cambiare (comportamenti, file, API, aspetto).
  - `FUORI SCOPO`: cosa non fa parte di questa richiesta, anche se collegato.
  - `COSA NON SO`: dubbi dell'utente da chiarire prima di procedere.
- l'`OBIETTIVO` confermato è il "comportamento finale atteso" della SPIEGAZIONE COMPLETA FLUSSO.

## SPIEGAZIONE COMPLETA FLUSSO

- il flusso si spiega **solo** con il diagramma: non scrivere in chat la spiegazione a passi.
- leggi e applica le regole in `~/.claude/shared/diagramma-flusso.md`.
- il diagramma rappresenta il flusso **attuale**, cioè prima della modifica, e copre tutti i punti interessati dalla richiesta, senza parti superflue.
- ogni oggetto, lista o json nei `payload` deve essere completo; se un oggetto cambia durante il flusso, mostralo nei nodi successivi con i valori aggiornati e spiega nei `fields` cosa è cambiato.
- in chat scrivi solo il percorso del file (cliccabile), una riga su cosa rappresenta e, in 2-4 righe, cosa deve ottenere la modifica (il comportamento finale atteso), senza suggerire come implementarla.

## RISPOSTA UTENTE

- quando arrivi in questa fase fermati e attendi la risposta dell'utente.
- l'utente spiegherà a concetto, in poche righe, cosa implementerebbe: dove interverrebbe, cosa cambierebbe nel flusso e perché.
- l'utente può indicare i punti del flusso con i numeri dei passi del diagramma (es. "al passo 4…", "tra il passo 5 e il 6…"): usali come riferimento, e se un numero non esiste o è ambiguo chiedi.
- non deve dettare nomi, sintassi o codice: quei dettagli li decidi tu in IMPLEMENTAZIONE CODICE.

## RISULTATO RISPOSTA UTENTE

- spiega all'utente cosa accadrebbe se implementasse ciò che ha descritto in RISPOSTA UTENTE: effetti sul flusso, risultati e casi limite toccati, in maniera chiara.
- per indicare le parti del flusso usa i numeri dei passi del diagramma, come descritto in "Riferimenti ai passi" di `~/.claude/shared/diagramma-flusso.md`.
- non dirgli se la soluzione è giusta o sbagliata: deve capirlo lui dalle conseguenze.
- chiedi sempre all'utente se procedere all'implementazione, poi fermati e attendi.
- se l'utente scrive "procedi", passa a IMPLEMENTAZIONE CODICE.
- se l'utente non è d'accordo, torna a RISPOSTA UTENTE e attendi la nuova risposta.
- se l'utente chiede delucidazioni, rispondi e attendi nuovamente il "procedi".

## IMPLEMENTAZIONE CODICE

- prima di modificare qualsiasi file, verifica la soluzione accettata: se contiene problemi gravi (sicurezza, perdita di dati, regressioni, crash), comunicali in modo esplicito e chiaro, senza scrivere codice, e attendi.
  - se l'utente scrive "procedi lo stesso", implementa la soluzione così com'è.
  - altrimenti torna a RISPOSTA UTENTE.
- implementa la soluzione accettata rispettando le scelte dell'utente e il "Recinto" della scheda.
- i dettagli che l'utente non ha specificato (nomi, collocazione, sintassi, gestione errori) decidili tu seguendo le convenzioni del progetto.

## VERIFICA

- fai il "Controllo finale" della scheda.
- elenca in modo schematico i dettagli che hai deciso tu (non presenti nella RISPOSTA UTENTE), con nomeFile (cliccabile) e una riga di motivazione ciascuno: sono le parti che l'utente deve controllare.
- per ogni dettaglio indica anche il passo del diagramma in cui si trova.
- poni massimo 3 domande mirate sulle decisioni più importanti della modifica.
- se l'utente risponde male, correggilo spiegando perché.
- se l'utente propone di cambiare un dettaglio, valuta la proposta: se è valida applicala, se non lo è spiega perché.

## SPIEGAZIONE FINALE

- spiega in maniera tecnica, chiara e schematica cosa e perché hai implementato, gli effetti che avrà sul codice e il risultato ottenuto.
- al termine inserisci un glossario dei termini tecnici nuovi incontrati durante la richiesta.
