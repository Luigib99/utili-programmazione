---
name: revisione
description: Rilegge tutto ciò che l'utente ha richiesto e tutto ciò che è stato implementato nella chat, poi spiega nel dettaglio cosa è stato fatto, se rispecchia la richiesta e quali rischi ci sono
argument-hint: "[parte da revisionare, opzionale: un file, un passo o un tema]"
disable-model-invocation: true
model: opus
effort: high
---

# REVISIONE

Parte da revisionare (opzionale): $ARGUMENTS

Segui il FORMATO RISPOSTE del CLAUDE.md globale (titoli `##`, `---` tra le sezioni, un'idea per riga, grassetto, flussi con frecce).

## Obiettivo

L'utente ha perso il filo del codice. La revisione gli restituisce il quadro completo:

1. cosa ha chiesto
2. cosa è stato implementato davvero
3. se le due cose coincidono
4. cosa può andare storto

Sola lettura: non modificare mai file.

## Fonti da rileggere

Rileggi TUTTO prima di rispondere, senza fidarti della memoria della chat:

- le richieste esplicite dell'utente in questa conversazione (anche le correzioni e i cambi di idea: vale l'ultima versione)

- i piani e i passi proposti da `/implementazione` o `/piano`

- il codice **reale** ora presente nei file toccati (Read/Grep, non quello mostrato in chat)

- le modifiche non ancora committate (`git diff`, `git status`) e quelle del branch rispetto a main

- chi usa il codice modificato (chiamanti) e cosa il codice richiama

Se è stato dato un argomento, restringi la revisione a quella parte. Se non c'è nulla da revisionare in chat, usa il diff del branch; se manca anche quello, chiedi all'utente.

## Struttura della risposta

Una sezione `##` per fase, in quest'ordine.

1. `## RICHIESTA ORIGINALE`: elenco puntato di ciò che l'utente ha chiesto, requisito per requisito, nelle sue parole essenziali.

2. `## COSA È STATO FATTO`: la parte principale, nel dettaglio.

   - un `###` per ogni file modificato o creato (nome in grassetto, link al file)
   - sotto ogni file, un punto per ogni funzione, hook, variabile o blocco aggiunto o cambiato: `- elemento = cosa fa`
   - per ogni funzione richiamata indica l'**origine**: NOSTRA (con file:riga), LIBRERIA (con nome pacchetto), FRAMEWORK, NUOVA
   - un flusso con frecce che mostra come i pezzi lavorano insieme, dall'azione dell'utente al risultato

3. `## RISPONDE ALLA RICHIESTA?`: tabella o checklist requisito per requisito.

   - `- [x]` soddisfatto, `- [ ]` mancante o parziale
   - cosa è stato fatto in più rispetto alla richiesta (modifiche non richieste)
   - cosa è stato frainteso rispetto a ciò che l'utente voleva

4. `## RISCHI`: solo rischi concreti, ognuno con uno scenario reale.

   - 🔴 grave (bug, crash, sicurezza, perdita di dati), 🟡 lieve (caso limite, fragilità, incoerenza con le convenzioni del progetto)
   - per ognuno: nomeFile:riga in grassetto, il codice reale in un riquadro, cosa succede, quando, come correggerlo a parole
   - controlla in ordine: correttezza, sicurezza, coerenza con l'architettura e il CLAUDE.md del progetto, REGOLE SEMANTICHE del CLAUDE.md globale
   - se non trovi rischi, dillo senza inventarne

5. `## COSA VERIFICARE`: checklist `- [ ]` di prove manuali concrete che l'utente può fare per confermare che funziona (azione → risultato atteso).

Chiudi con `---`. Se hai trovato rischi da correggere, aggiungi `## RICHIESTA`: "Per correggerli lancia /implementazione indicando i numeri dei rischi." I rischi vanno numerati in modo progressivo. Se non ci sono rischi, nessuna sezione finale.

## Regole

- niente problemi ipotetici né preferenze stilistiche spacciate per errori

- se una cosa non è nel codice, dillo invece di inventarla

- se la richiesta dell'utente era sbagliata o rischiosa, segnalalo chiaramente

- i concetti teorici non si spiegano: accennali e rimanda a `/insegnante`

- se l'utente contesta un rischio, valuta: se ha ragione ritira la segnalazione, altrimenti spiega perché resta

- non modificare mai file, nemmeno se l'utente scrive "procedi": rimanda a `/implementazione`

- non fare quiz all'utente
