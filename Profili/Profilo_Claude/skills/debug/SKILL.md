---
name: debug
description: Debug guidato in modo didattico di un problema nel progetto
argument-hint: "<vuoto per lo schema, testo libero o TITOLO: / ATTESO: / OSSERVATO: / COME RIPRODURLO: / AMBIENTE: / DA QUANDO: / ERRORI: / COSA NON SO: / MAPPA: dati, struttura o entrambi>"
disable-model-invocation: true
---

# DEBUG

Il problema riscontrato dall'utente è: $ARGUMENTS

L'obiettivo è che l'utente impari a individuare da solo la causa di un bug leggendo il flusso, non che riceva la soluzione. Ogni messaggio segue il "Formato dei messaggi" di `~/.claude/shared/scheda-richiesta.md`, con i blocchi indicati in ogni fase.

## Struttura

1. passa a SCHEDA RICHIESTA.
2. analizza e individua dove potrebbe essere la causa del problema.
3. passa a DIAGRAMMA.
4. passa a RISPOSTA UTENTE.
5. passa a CORREZIONE RISPOSTA UTENTE.
6. passa a IMPLEMENTAZIONE FIX.
7. passa a VERIFICA.
8. quando il problema è ufficialmente risolto (sarà l'utente a dirlo) procedi alla SPIEGAZIONE FINALE.

In qualsiasi fase:

- se l'utente scrive "aiuto" o "indizio", rispondi con il solo blocco **1. SUGGERIMENTI**: al massimo 3 suggerimenti diretti (dove guardare, quale valore confrontare), più espliciti dei precedenti, con i passi del diagramma, senza rivelare la soluzione e senza domande; poi attendi.
- se l'utente scrive "mi arrendo", rispondi con i blocchi **1. CAUSA** (dov'è il problema e perché si verifica), **2. CORREZIONE** (come lo correggeresti, concetto e motivazione, non codice) e **3. RICHIESTA** "Procedo?", poi passa a IMPLEMENTAZIONE FIX al suo "procedi".
- se le informazioni non bastano per individuare la causa (log, passi per riprodurre, dispositivo, ambiente), chiedile prima di andare avanti.

## SCHEDA RICHIESTA

- leggi e applica le regole in `~/.claude/shared/scheda-richiesta.md`.
- campi (\* = obbligatorio):
  - `TITOLO`\*: vedi "Campi comuni".
  - `ATTESO`\*: cosa dovrebbe succedere.
  - `OSSERVATO`\*: cosa succede invece (messaggio, schermata, comportamento).
  - `COME RIPRODURLO`\*: i passi per far comparire il problema, e se succede sempre o solo a volte.
  - `AMBIENTE`\*: piattaforma (Android / iOS / web), ambiente del progetto (es. sviluppo, test, produzione), dispositivo (emulatore o fisico), build debug o release.
  - `DA QUANDO`: da sempre o da un certo momento (aggiornamento, commit, branch).
  - `ERRORI`: log, messaggi d'errore o screenshot.
  - `COSA NON SO`: dubbi dell'utente da chiarire prima di procedere.
  - `MAPPA`\*: vedi "Campi comuni".
- le opzioni per `AMBIENTE` prendile da ciò che il progetto supporta davvero (script di avvio, file di configurazione, piattaforme presenti).
- nella scheda, nei RISCHI e nelle domande non anticipare dove pensi sia la causa: il debug resta neutro.

## DIAGRAMMA

- genera il diagramma scelto in `MAPPA` (vedi "Campi comuni"); deve coprire tutti i punti in cui si trova il problema, senza parti superflue.
- `dati`: ogni oggetto, lista o json nei `payload` deve essere completo; se un oggetto cambia durante il flusso, mostralo nei nodi successivi con i valori aggiornati e spiega nei `fields` cosa è cambiato.
- il diagramma deve essere **neutro**: dai a ogni passo o riquadro lo stesso peso; non usare `incoming: "lost"`; né `action`, né `payloadName`, né i testi (`physical`, `simple`, `does`, `purpose`, `receives`, `returns`, `explanation`), né `fields`, `badges` o `label` devono mettere in risalto il punto del bug; descrivi cosa fa il codice, non cosa manca o cosa è sbagliato.
- quando raggruppi parti per restare nel limite di nodi o riquadri, il raggruppamento non deve escludere o isolare il punto del bug.
- il problema si spiega **solo** con il diagramma; in chat scrivi i blocchi:
  - **1. DIAGRAMMA**: il percorso del file (cliccabile); con `entrambi`, una riga per file con davanti `DATI` o `STRUTTURA`.
  - **2. COSE DA SAPERE**: massimo 3 punti utili a leggere il flusso (es. da dove arriva un dato, in che ordine partono due chiamate), con il passo del diagramma; **neutri**: non devono indicare né far intuire il punto del bug.
  - **3. RICHIESTA**: "Dov'è il problema e come intendi correggerlo?"

## RISPOSTA UTENTE

- quando arrivi in questa fase fermati e attendi la risposta dell'utente.
- l'utente spiegherà a concetto, in poche righe, dov'è il problema, perché si verifica e come lo correggerebbe.
- l'utente può indicare i punti del flusso con i numeri dei passi del diagramma (es. "al passo 4…", "tra il passo 5 e il 6…"): usali come riferimento, e se un numero non esiste o è ambiguo chiedi.
- non deve dettare nomi, sintassi o codice: quei dettagli li decidi tu in IMPLEMENTAZIONE FIX.

## CORREZIONE RISPOSTA UTENTE

- rispondi con i blocchi:
  - **1. VALUTAZIONE**: se la risposta è sbagliata o incompleta, cosa non torna nel ragionamento, con i passi del diagramma: dagli l'input per capire da solo, non la formulazione corretta da copiare; se è corretta, una riga che lo conferma.
  - **2. RICHIESTA**: "Riformula la risposta." se non è corretta, "Procedo con il fix?" se lo è.
- dai priorità alla sostanza, ma bada in piccola parte anche alla forma.
- non toccare punti che l'utente non ha nominato.
- poi fermati e attendi:
  - "procedi": passa a IMPLEMENTAZIONE FIX.
  - l'utente chiede delucidazioni: rispondi con i blocchi **1. RISPOSTA** e **2. RICHIESTA** (la stessa di prima), e attendi.

## IMPLEMENTAZIONE FIX

- prima di modificare qualsiasi file, verifica il fix accettato: se introduce problemi gravi (sicurezza, perdita di dati, regressioni, crash), rispondi con i blocchi **1. PROBLEMI** (senza codice) e **2. RICHIESTA** "Procedo lo stesso o rivedi il fix?", e attendi.
  - se l'utente scrive "procedi lo stesso", implementa il fix così com'è.
  - altrimenti torna a RISPOSTA UTENTE.
- implementa il fix accettato rispettando le scelte dell'utente e il "Recinto" della scheda.
- i dettagli che l'utente non ha specificato (nomi, collocazione, sintassi, gestione errori) decidili tu seguendo le convenzioni del progetto.

## VERIFICA

- rispondi con i blocchi:
  - **1. MODIFICHE**: una riga per file modificato, nomeFile (cliccabile) e cosa è cambiato.
  - **2. DA CONTROLLARE**: i dettagli che hai deciso tu (non presenti nella RISPOSTA UTENTE), con nomeFile, passo del diagramma e una riga di motivazione.
  - **3. SCHEDA**: il "Controllo finale" della scheda, con i passi per riprodurre il problema e il risultato atteso ora.
  - **4. RICHIESTA**: "Prova il fix e dimmi se il problema è risolto."
- se l'utente propone di cambiare un dettaglio, valuta la proposta: se è valida applicala, se non lo è spiega perché.

## SPIEGAZIONE FINALE

- rispondi con i blocchi:
  - **1. COSA HO FATTO**: qual era la causa del problema, cosa e perché hai modificato e il risultato ottenuto, in modo tecnico e schematico.
  - **2. GLOSSARIO**: i termini tecnici nuovi incontrati durante la richiesta, una riga ciascuno.
