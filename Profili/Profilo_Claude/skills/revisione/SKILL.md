---
name: revisione
description: Revisione di codice nel progetto con problemi classificati per gravità
argument-hint: "<file, porzione di codice o branch da revisionare>"
disable-model-invocation: true
---

# REVISIONE DI CODICE

Il codice da revisionare è: $ARGUMENTS

L'obiettivo è che l'utente impari a giudicare criticamente il codice (anche quello prodotto dall'AI): capire cosa è sbagliato, perché e con quali conseguenze. Tieni le segnalazioni concrete: niente problemi ipotetici, niente preferenze stilistiche spacciate per errori.

## Struttura

1. individua il codice da revisionare.
2. passa a DIAGRAMMA DEL FLUSSO.
3. se l'utente ha scritto "prova io", passa a REVISIONE UTENTE, altrimenti passa a REVISIONE.
4. passa a SEGNALAZIONI.
5. passa a CORREZIONE.
6. passa a RIEPILOGO.

In qualsiasi fase:

- se non è chiaro cosa revisionare, usa in ordine: il codice evidenziato nell'IDE, il file aperto, le modifiche del branch corrente rispetto a main. Se nessuno è disponibile, chiedi all'utente.
- se la richiesta è ambigua, chiedi chiarimenti prima di andare avanti.

## DIAGRAMMA DEL FLUSSO

- leggi e applica le regole in `~/.claude/shared/diagramma-flusso.md`: qui non c'è una spiegazione a passi, quindi il diagramma precede direttamente la fase successiva.
- il diagramma rappresenta il flusso in cui si inserisce il codice revisionato (se è un branch, il flusso toccato dalle modifiche), non solo le righe richieste.
- se l'utente ha scritto "prova io", il diagramma deve essere **neutro**: non usare `incoming: "lost"`, e né `action`, né `payloadName`, né i testi (`does`, `purpose`, `receives`, `returns`) o `fields` devono mettere in risalto i punti problematici.

## REVISIONE UTENTE

- fermati e attendi che l'utente elenchi i problemi che ha trovato, con il motivo.
- l'utente può indicare i punti del flusso con i numeri dei passi del diagramma (es. "al passo 4…", "tra il passo 5 e il 6…"): usali come riferimento, e se un numero non esiste o è ambiguo chiedi.
- dopo la sua risposta passa a REVISIONE e, in SEGNALAZIONI, indica per ogni problema se l'utente lo aveva trovato, se lo aveva mancato o se ne aveva segnalato uno che non è un problema (spiegando perché).

## REVISIONE

- leggi il codice e il contesto necessario a capirlo (chiamanti, funzioni usate, dati in ingresso), non solo le righe richieste.
- verifica ogni problema prima di segnalarlo: se non riesci a descrivere uno scenario concreto in cui si manifesta, non segnalarlo.
- controlla in quest'ordine: correttezza (bug, casi limite, errori non gestiti), sicurezza, coerenza con l'architettura e le convenzioni del progetto, leggibilità e REGOLE SEMANTICHE del CLAUDE.md globale.

## SEGNALAZIONI

- raggruppa i problemi per gravità, dal più grave:
  - 🔴 Gravi: bug, crash, problemi di sicurezza, perdita di dati.
  - 🟡 Medi: casi limite non gestiti, incoerenze con l'architettura, codice fragile.
  - 🟢 Minori: leggibilità, nomenclatura, commenti, formattazione.
- numera i problemi in modo progressivo tra tutti i gruppi.
- per ogni problema indica:
  - nomeFile:riga (cliccabile).
  - il passo del diagramma in cui si trova (es. "passo 4 (`getAllUsers`)").
  - cosa è sbagliato.
  - perché è sbagliato e lo scenario concreto in cui si manifesta.
  - come lo correggeresti, a parole e senza codice.
- se non trovi problemi, dillo in modo esplicito senza inventarne.
- chiedi all'utente quali problemi correggere, poi fermati e attendi.

## CORREZIONE

- se l'utente scrive "procedi", correggi tutti i problemi segnalati.
- se l'utente indica dei numeri, correggi solo quelli.
- se l'utente contesta un problema, valuta la sua obiezione: se è valida ritira la segnalazione, se non lo è spiega perché.
- non modificare nulla al di fuori dei problemi da correggere.

## RIEPILOGO

- per ogni problema corretto indica il numero, nomeFile (cliccabile) e cosa hai cambiato.
- indica i problemi non corretti, così l'utente sa cosa resta aperto.
