---
name: modifica-maggiore
description: Modifica o aggiunta maggiore di codice nel progetto, guidata in modo didattico
argument-hint: "<vuoto per lo schema, testo libero o OBIETTIVO: / ORA: / DOVE: / ESEMPIO: / SIMILE A: / VERIFICA: / VINCOLI: / FUORI SCOPO: / COSA NON SO:>"
disable-model-invocation: true
---

# MODIFICA MAGGIORE

La richiesta dell'utente è: $ARGUMENTS

L'obiettivo è che l'utente impari a prendere le decisioni di design (dove intervenire, cosa cambia nel flusso, quali casi limite esistono), non a dettare la sintassi. Ogni messaggio segue il "Formato dei messaggi" di `~/.claude/shared/scheda-richiesta.md`, con i blocchi indicati in ogni fase.

## Struttura

1. passa a SCHEDA RICHIESTA.
2. analizza e individua dove e come inserire il codice.
3. passa a DIAGRAMMA.
4. passa a RISPOSTA UTENTE.
5. passa a RISULTATO RISPOSTA UTENTE.
6. passa a IMPLEMENTAZIONE CODICE.
7. passa a VERIFICA.
8. quando la richiesta è conclusa (sarà l'utente a dirlo) procedi alla SPIEGAZIONE FINALE.

In qualsiasi fase:

- se l'utente scrive "aiuto" o "indizio", rispondi con il solo blocco **1. SUGGERIMENTI**: al massimo 3 suggerimenti diretti (dove guardare, cosa considerare), con i passi del diagramma, senza dare la soluzione completa e senza domande; poi attendi.
- se l'utente scrive "mi arrendo", rispondi con i blocchi **1. COME LO FAREI** (concetto e motivazione, non codice, con i passi del diagramma) e **2. RICHIESTA** "Procedo?", poi passa a IMPLEMENTAZIONE CODICE al suo "procedi".
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

## DIAGRAMMA

- leggi e applica le regole in `~/.claude/shared/diagramma-flusso.md`.
- il diagramma rappresenta il flusso **attuale**, cioè prima della modifica, e copre tutti i punti interessati dalla richiesta, senza parti superflue.
- ogni oggetto, lista o json nei `payload` deve essere completo; se un oggetto cambia durante il flusso, mostralo nei nodi successivi con i valori aggiornati e spiega nei `fields` cosa è cambiato.
- il flusso si spiega **solo** con il diagramma; in chat scrivi i blocchi:
  - **1. DIAGRAMMA**: il percorso del file (cliccabile).
  - **2. COSE DA SAPERE**: massimo 3 punti utili a decidere (es. da dove arriva un dato, un vincolo tecnico, un altro punto che usa lo stesso codice), con il passo del diagramma; niente suggerimenti su come implementare.
  - **3. RICHIESTA**: "Come intendi procedere?"

## RISPOSTA UTENTE

- quando arrivi in questa fase fermati e attendi la risposta dell'utente.
- l'utente spiegherà a concetto, in poche righe, cosa implementerebbe: dove interverrebbe, cosa cambierebbe nel flusso e perché.
- l'utente può indicare i punti del flusso con i numeri dei passi del diagramma (es. "al passo 4…", "tra il passo 5 e il 6…"): usali come riferimento, e se un numero non esiste o è ambiguo chiedi.
- non deve dettare nomi, sintassi o codice: quei dettagli li decidi tu in IMPLEMENTAZIONE CODICE.

## RISULTATO RISPOSTA UTENTE

- rispondi con i blocchi:
  - **1. COSA SUCCEDEREBBE**: effetti sul flusso, risultati e casi limite toccati da ciò che l'utente ha descritto, con i passi del diagramma.
  - **2. RICHIESTA**: "Procedo?"
- non dirgli se la soluzione è giusta o sbagliata: deve capirlo lui dalle conseguenze.
- poi fermati e attendi:
  - "procedi": passa a IMPLEMENTAZIONE CODICE.
  - l'utente non è d'accordo: torna a RISPOSTA UTENTE e attendi la nuova risposta.
  - l'utente chiede delucidazioni: rispondi con i blocchi **1. RISPOSTA** e **2. RICHIESTA** "Procedo?", e attendi.

## IMPLEMENTAZIONE CODICE

- prima di modificare qualsiasi file, verifica la soluzione accettata: se contiene problemi gravi (sicurezza, perdita di dati, regressioni, crash), rispondi con i blocchi **1. PROBLEMI** (senza codice) e **2. RICHIESTA** "Procedo lo stesso o rivedi la soluzione?", e attendi.
  - se l'utente scrive "procedi lo stesso", implementa la soluzione così com'è.
  - altrimenti torna a RISPOSTA UTENTE.
- implementa la soluzione accettata rispettando le scelte dell'utente e il "Recinto" della scheda.
- i dettagli che l'utente non ha specificato (nomi, collocazione, sintassi, gestione errori) decidili tu seguendo le convenzioni del progetto.

## VERIFICA

- rispondi con i blocchi:
  - **1. MODIFICHE**: una riga per file modificato, nomeFile (cliccabile) e cosa è cambiato.
  - **2. DA CONTROLLARE**: i dettagli che hai deciso tu (non presenti nella RISPOSTA UTENTE), con nomeFile, passo del diagramma e una riga di motivazione.
  - **3. SCHEDA**: il "Controllo finale" della scheda, con i passi per la `VERIFICA`.
  - **4. RICHIESTA**: "Prova la modifica e dimmi se va bene o cosa cambiare."
- se l'utente propone di cambiare un dettaglio, valuta la proposta: se è valida applicala, se non lo è spiega perché.

## SPIEGAZIONE FINALE

- rispondi con i blocchi:
  - **1. COSA HO FATTO**: cosa e perché hai implementato, gli effetti sul codice e il risultato ottenuto, in modo tecnico e schematico.
  - **2. GLOSSARIO**: i termini tecnici nuovi incontrati durante la richiesta, una riga ciascuno.
