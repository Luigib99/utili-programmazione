---
name: modifica-minore
description: Modifica minore di codice nel progetto (traduzioni, elementi grafici, formattazione, piccole modifiche generiche)
argument-hint: "<vuoto per lo schema, testo libero o TITOLO: / COSA: / DOVE: / VALORE NUOVO: / VINCOLI: / MAPPA: dati, struttura o entrambi (facoltativa)>"
disable-model-invocation: true
---

# MODIFICA MINORE

La richiesta dell'utente è: $ARGUMENTS

Le modifiche minori non richiedono ragionamento didattico: procedi in automatico senza attendere l'ok dell'utente e al termine spiega in breve cosa hai fatto, così che l'utente possa controllarlo o cambiarlo manualmente.

## Struttura

1. passa a SCHEDA RICHIESTA.
2. individua a quale tipologia appartiene la richiesta: TRADUZIONI, ELEMENTI GRAFICI, FORMATTAZIONE o GENERICI.
3. se hai dubbi tra modifica minore e modifica maggiore, chiedi all'utente prima di procedere.
4. esegui la modifica seguendo le regole della tipologia.
5. al termine fai il RIEPILOGO.

In qualsiasi fase:

- se durante la modifica emerge che serve cambiare la logica o prendere decisioni di design, fermati senza modificare altro, spiega il motivo in breve e suggerisci all'utente di usare `/modifica-maggiore`.
- se la richiesta è ambigua, chiedi chiarimenti prima di andare avanti.

## SCHEDA RICHIESTA

- leggi e applica le regole in `~/.claude/shared/scheda-richiesta.md`.
- campi (\* = obbligatorio):
  - `TITOLO`\*: vedi "Campi comuni".
  - `COSA`\*: cosa cambiare (testo, colore, dimensione, posizione, formattazione…).
  - `DOVE`\*: schermata, componente o file.
  - `VALORE NUOVO`: il valore finale (es. il testo nuovo, il colore, la distanza); se manca e non è deducibile, proponi i valori già usati nel progetto come opzioni.
  - `VINCOLI`: cosa non deve cambiare.
  - `MAPPA`: facoltativa, vedi "Campi comuni". Se c'è, prima di modificare genera il diagramma dello stato attuale e indica il link nel RIEPILOGO; poi procedi come al solito, senza attendere.
- eccezione alla "Conferma": se tutti i campi obbligatori sono `✍️` (scritti dall'utente) e nessuna domanda è stata necessaria, non mostrare la scheda e procedi in automatico; altrimenti mostrala e attendi l'ok.

## TRADUZIONI

- ogni riferimento alle traduzioni è una modifica minore, anche se ci sono tanti file da cambiare.
- se l'utente richiede un controllo delle traduzioni, di allinearle o di aggiungere quelle mancanti, fallo in automatico su tutte le lingue presenti nel progetto.
- usa nomi delle chiavi coerenti con quelli già presenti nel file.

## ELEMENTI GRAFICI

- ogni riferimento di tipo grafico (colori, dimensioni, posizioni, strutture ecc.) è una modifica minore.
- usa colori, font e stili già definiti nel progetto invece di valori scritti a mano, quando esistono.
- non modificare la logica del componente.

## FORMATTAZIONE

- se l'utente richiede di formattare il file o il testo evidenziato, riscrivi il file o la porzione di codice evidenziata seguendo queste regole:
  - metti nell'ordine corretto e coerente gli elementi nel codice, di modo che l'utente possa seguirlo in maniera intuitiva.
  - rimuovi i commenti superflui e aggiungi quelli necessari (vedi REGOLE SEMANTICHE del CLAUDE.md globale).
  - gli elementi dello StyleSheet vanno messi in colonna, non su una riga.
  - le proprietà JSX vanno in colonna, unica eccezione quando ce n'è una sola.
  - non modificare in alcuna maniera la logica.

## GENERICI

- ogni cambiamento minimo generico richiesto dall'utente è una modifica minore.
- se la modifica non richiede ragionamento, procedi in automatico.

## RIEPILOGO

- comunica solo cosa hai modificato: niente convenevoli, cose superflue o cose non presenti nella richiesta.
- fai il "Controllo finale" della scheda in forma breve: una riga per campo.
- per ogni modifica indica nomeFile (cliccabile) e cosa hai cambiato.
- per le TRADUZIONI indica per ogni chiave il nome e il testo scritto in ogni lingua.
- per gli ELEMENTI GRAFICI indica il valore precedente e quello nuovo, così l'utente può ripristinarlo o cambiarlo manualmente.
