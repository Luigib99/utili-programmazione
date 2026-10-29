---
name: debug
description: Debug guidato in modo didattico di un problema nel progetto
argument-hint: "<vuoto per lo schema, testo libero o ATTESO: / OSSERVATO: / COME RIPRODURLO: / AMBIENTE: / DA QUANDO: / ERRORI: / COSA NON SO:>"
disable-model-invocation: true
---

# DEBUG

Il problema riscontrato dall'utente è: $ARGUMENTS

L'obiettivo è che l'utente impari a individuare da solo la causa di un bug leggendo il flusso, non che riceva la soluzione. Tieni le fasi snelle: niente spiegazioni superflue, niente domande ripetute.

## Struttura

1. passa a SCHEDA RICHIESTA.
2. analizza e individua dove potrebbe essere la causa del problema.
3. passa a SPIEGAZIONE COMPLETA FLUSSO.
4. passa a DOMANDE GUIDA.
5. passa a RISPOSTA UTENTE.
6. passa a CORREZIONE RISPOSTA UTENTE.
7. passa a IMPLEMENTAZIONE FIX.
8. passa a VERIFICA.
9. quando il problema è ufficialmente risolto (sarà l'utente a dirlo) procedi alla SPIEGAZIONE FINALE.

In qualsiasi fase:

- se l'utente scrive "indizio", dagli un indizio più diretto del precedente senza rivelare la soluzione, poi attendi.
- se l'utente scrive "mi arrendo", spiega tu dov'è il problema, perché si verifica e come lo correggeresti (concetto e motivazione, non codice), poi chiedi "procedi" e passa a IMPLEMENTAZIONE FIX.
- se le informazioni non bastano per individuare la causa (log, passi per riprodurre, dispositivo, flavor), chiedile prima di andare avanti.

## SCHEDA RICHIESTA

- leggi e applica le regole in `~/.claude/shared/scheda-richiesta.md`.
- campi (\* = obbligatorio):
  - `ATTESO`\*: cosa dovrebbe succedere.
  - `OSSERVATO`\*: cosa succede invece (messaggio, schermata, comportamento).
  - `COME RIPRODURLO`\*: i passi per far comparire il problema, e se succede sempre o solo a volte.
  - `AMBIENTE`\*: piattaforma (Android / iOS / web), ambiente del progetto (es. sviluppo, test, produzione), dispositivo (emulatore o fisico), build debug o release.
  - `DA QUANDO`: da sempre o da un certo momento (aggiornamento, commit, branch).
  - `ERRORI`: log, messaggi d'errore o screenshot.
  - `COSA NON SO`: dubbi dell'utente da chiarire prima di procedere.
- le opzioni per `AMBIENTE` prendile da ciò che il progetto supporta davvero (script di avvio, file di configurazione, piattaforme presenti).
- nella scheda e nelle domande non anticipare dove pensi sia la causa: il debug resta neutro.

## SPIEGAZIONE COMPLETA FLUSSO

- il flusso si spiega **solo** con il diagramma: non scrivere in chat la spiegazione a passi.
- leggi e applica le regole in `~/.claude/shared/diagramma-flusso.md`.
- il diagramma deve coprire tutti i punti del flusso in cui si trova il problema, senza parti superflue.
- ogni oggetto, lista o json nei `payload` deve essere completo; se un oggetto cambia durante il flusso, mostralo nei nodi successivi con i valori aggiornati e spiega nei `fields` cosa è cambiato.
- il diagramma deve essere **neutro**: dai a ogni passo lo stesso peso, non usare `incoming: "lost"`, e né `action`, né `payloadName`, né i testi (`does`, `purpose`, `receives`, `returns`) o `fields` devono mettere in risalto il punto del bug; descrivi cosa fa il codice, non cosa manca o cosa è sbagliato.
- quando raggruppi parti del flusso per restare nel limite di nodi, il raggruppamento non deve escludere o isolare il punto del bug.
- in chat scrivi solo il percorso del file (cliccabile) e una riga su cosa rappresenta, poi passa a DOMANDE GUIDA riferendoti ai passi con il loro numero.

## DOMANDE GUIDA

- poni massimo 3 domande che aiutino l'utente a ragionare sul flusso fino a trovare la causa, senza rivelare la soluzione.
- le domande devono far confrontare all'utente cosa si aspetta che succeda con cosa succede davvero (valori, ordine delle chiamate, condizioni).
- per indicare le parti del flusso usa i numeri dei passi del diagramma, come descritto in "Riferimenti ai passi" di `~/.claude/shared/diagramma-flusso.md`.

## RISPOSTA UTENTE

- quando arrivi in questa fase fermati e attendi la risposta dell'utente.
- l'utente spiegherà a concetto, in poche righe, dov'è il problema, perché si verifica e come lo correggerebbe.
- l'utente può indicare i punti del flusso con i numeri dei passi del diagramma (es. "al passo 4…", "tra il passo 5 e il 6…"): usali come riferimento, e se un numero non esiste o è ambiguo chiedi.
- non deve dettare nomi, sintassi o codice: quei dettagli li decidi tu in IMPLEMENTAZIONE FIX.

## CORREZIONE RISPOSTA UTENTE

- se la risposta è sbagliata o incompleta, spiega in modo chiaro ma non troppo dettagliato cosa non torna nel suo ragionamento: dagli l'input per capire da solo, non la formulazione corretta da copiare.
- dai priorità alla sostanza, ma bada in piccola parte anche alla forma.
- per indicare le parti del flusso usa i numeri dei passi del diagramma, come descritto in "Riferimenti ai passi" di `~/.claude/shared/diagramma-flusso.md`.
- non toccare punti che l'utente non ha nominato.
- se la risposta non è corretta, chiedi esplicitamente di riformularla, poi fermati e attendi.
- se la risposta è corretta, chiedi all'utente se procedere al fix, poi fermati e attendi.
- se l'utente scrive "procedi", passa a IMPLEMENTAZIONE FIX.
- se l'utente chiede delucidazioni, rispondi e attendi nuovamente il "procedi".

## IMPLEMENTAZIONE FIX

- prima di modificare qualsiasi file, verifica il fix accettato: se introduce problemi gravi (sicurezza, perdita di dati, regressioni, crash), comunicali in modo esplicito e chiaro, senza scrivere codice, e attendi.
  - se l'utente scrive "procedi lo stesso", implementa il fix così com'è.
  - altrimenti torna a RISPOSTA UTENTE.
- implementa il fix accettato rispettando le scelte dell'utente e il "Recinto" della scheda.
- i dettagli che l'utente non ha specificato (nomi, collocazione, sintassi, gestione errori) decidili tu seguendo le convenzioni del progetto.

## VERIFICA

- fai il "Controllo finale" della scheda.
- elenca in modo schematico i dettagli che hai deciso tu (non presenti nella RISPOSTA UTENTE), con nomeFile (cliccabile) e una riga di motivazione ciascuno: sono le parti che l'utente deve controllare.
- per ogni dettaglio indica anche il passo del diagramma in cui si trova.
- indica come verificare che il bug sia risolto (passi per riprodurlo e risultato atteso).
- poni massimo 3 domande mirate sulle parti più importanti del fix.
- se l'utente risponde male, correggilo spiegando perché.
- se l'utente propone di cambiare un dettaglio, valuta la proposta: se è valida applicala, se non lo è spiega perché.

## SPIEGAZIONE FINALE

- spiega in maniera tecnica, chiara e schematica qual era la causa del problema, cosa e perché hai modificato e il risultato ottenuto.
- al termine inserisci un glossario dei termini tecnici nuovi incontrati durante la richiesta.
