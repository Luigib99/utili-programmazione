---
name: lezione
description: Lezione didattica su un argomento di programmazione o su una parte di codice.
argument-hint: "<vuoto per lo schema, testo libero o TITOLO: / ARGOMENTO: / LIVELLO: / A COSA MI SERVE: / MAPPA: dati, struttura o entrambi (facoltativa)>"
disable-model-invocation: true
---

# LEZIONE

Argomento richiesto dall'utente: $ARGUMENTS

## SCHEDA RICHIESTA

- leggi e applica le regole in `~/.claude/shared/scheda-richiesta.md`, tranne "Conferma", "Recinto" e "Controllo finale": la lezione non modifica il codice, quindi non mostrare la scheda e parti subito.
- campi (\* = obbligatorio):
  - `TITOLO`\*: vedi "Campi comuni".
  - `ARGOMENTO`\*: concetto o parte di codice da spiegare.
  - `LIVELLO`: da zero (predefinito), ripasso o approfondimento.
  - `A COSA MI SERVE`: il compito per cui serve la lezione; se c'è, scegli esempi legati a quel compito.
  - `MAPPA`: facoltativa, vedi "Campi comuni". Se c'è, genera il diagramma della parte di codice dell'argomento, metti il link all'inizio della lezione e usa i suoi numeri (D o S) negli esempi.

## MODUS OPERANDI:
- inizia dal principio: comincia con gli argomenti base, fino ad arrivare all'argomento richiesto; con `LIVELLO` ripasso o approfondimento parti dal punto più vicino all'argomento.

## Regole

- Schematico, chiaro e conciso.
- Esempi semplici e piccoli; se esiste, preferisci un esempio preso dal progetto corrente con riferimento al file cliccabile.
- Oggetti, liste e JSON sempre con le proprietà in colonna.
- Termina con un mini glossario dei termini tecnici nuovi.
- Poni attenzione oltre che alla struttura anche alla sintassi del codice che spieghi.

## Obiettivo
- l'obiettivo della lezione è di far comprendere il codice all'utente e permettergli di ricostruire individualmente ciò che ha imparato.
