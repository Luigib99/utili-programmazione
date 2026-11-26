---
name: revisione
description: Rilegge tutto ciò che è stato implementato nella chat e nel codice, poi spiega cosa è cambiato (file e comportamento) ed elenca problemi, rischi e pulizia del codice con i cambiamenti suggeriti e i test ancora da fare
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

1. cosa è stato implementato e come è cambiato il comportamento
2. i problemi presenti, per gravità, con la correzione suggerita
3. i rischi potenziali, con la correzione suggerita
4. la pulizia del codice (residui, architettura)
5. i test ancora da fare

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

1. `## COSA ABBIAMO FATTO`: la parte principale, nel dettaglio.

   - un `### 📄 nomefile` per ogni file modificato o creato (nome in grassetto, link al file)
   - sotto ogni file, un punto per ogni funzione, hook, variabile o blocco aggiunto o cambiato: `- elemento = cosa fa`
   - per ogni funzione richiamata indica l'**origine**: NOSTRA (con file:riga), LIBRERIA (con nome pacchetto), FRAMEWORK, NUOVA
   - poi `### COMPORTAMENTO`: per ogni cambiamento visibile all'utente dell'app o al resto del codice, due righe `PRIMA:` e `DOPO:`
   - infine un flusso con frecce, dall'azione dell'utente al risultato
   - requisiti della richiesta non rispettati: non vanno qui, vanno in PROBLEMI

2. `## PROBLEMI`: tutti i difetti **già presenti** nel codice, ordinati per gravità (prima i 🔴, poi i 🟡).

   - 🔴 grave (bug, crash, sicurezza, perdita di dati, requisito della richiesta non rispettato), 🟡 lieve (caso limite, fragilità, incoerenza con le convenzioni)
   - ogni voce ha un codice: `P1`, `P2`... (il numero riparte da 1 in ogni categoria), scritto nel sottotitolo: `### 🔴 P1. NOME PROBLEMA` (nome max 3 parole)
   - per ognuno: nomeFile:riga in grassetto, il codice reale in un riquadro, cosa succede e quando, poi `Correzione suggerita:` a parole
   - controlla in ordine: correttezza, requisiti della richiesta (mancanti, fraintesi, aggiunti senza richiesta), sicurezza, coerenza con l'architettura e il CLAUDE.md del progetto
   - se non trovi problemi, dillo senza inventarne

3. `## RISCHI`: tutti i **potenziali** rischi, cioè cosa potrebbe rompersi in futuro o in casi particolari anche se oggi funziona.

   - codici `R1`, `R2`...; stesse emoji e stesso formato dei PROBLEMI
   - ogni rischio ha uno scenario concreto e plausibile (quando succede, cosa succede), mai generico
   - ogni rischio ha `Correzione suggerita:` a parole
   - non ripetere ciò che è già nei PROBLEMI
   - se non trovi rischi, dillo senza inventarne

4. `## CLEAN CODE`: pulizia e architettura **solo dei file dell'implementazione appena fatta**.

   - cerca: file o codice residui (file temporanei, `console.log`, codice commentato, codice morto, import inutilizzati, funzioni mai chiamate, duplicati di utility già esistenti)
   - cerca: architettura messa male (logica nel posto sbagliato, file nella cartella sbagliata, nomi incoerenti, componenti troppo grandi, responsabilità mischiate)
   - controlla le REGOLE SEMANTICHE del CLAUDE.md globale (titolo MAIUSCOLO sulle macrofunzioni, niente commenti superflui)
   - codici `CC1`, `CC2`...; stesso formato dei PROBLEMI, con `Correzione suggerita:` a parole
   - se è tutto pulito, dillo senza inventare

5. `## TEST DA FARE`: solo i test manuali **non ancora elencati** da `/implementazione` in questa chat.

   - stesso formato dei test di `/implementazione`: `### N. NOME TEST` (max 3 parole), con **Passaggi** (numerati, uno per riga), **Controlla**, **Atteso** (✅)
   - includi i test per i casi dei PROBLEMI e dei RISCHI trovati, citando il codice della voce (es. "dopo la correzione di P1")
   - se tutti i test sono già stati elencati, scrivi una riga: "Nessun test aggiuntivo."

Chiudi con `---`. Se hai trovato problemi, rischi o voci di clean code da correggere, aggiungi `## RICHIESTA`: "Per correggerli lancia `/implementazione` con i codici: `P1` (una voce), `P1 R2 CC3` (più voci), `tutti P` (una categoria), `tutti` (tutto)." Se non c'è nulla da correggere, nessuna sezione finale.

## Regole

- nei PROBLEMI niente casi ipotetici; i RISCHI sono potenziali ma con scenario concreto; niente preferenze stilistiche spacciate per errori

- se una cosa non è nel codice, dillo invece di inventarla

- se la richiesta dell'utente era sbagliata o rischiosa, segnalalo chiaramente

- i concetti teorici non si spiegano: accennali e rimanda a `/insegnante`

- se l'utente contesta una voce (P, R o CC), valuta: se ha ragione ritira la segnalazione, altrimenti spiega perché resta

- non modificare mai file, nemmeno se l'utente scrive "procedi": rimanda a `/implementazione`

- non fare quiz all'utente
