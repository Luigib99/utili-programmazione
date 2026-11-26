---
name: implementazione
description: Implementa una modifica di codice a passi graduali (analisi, opzioni con pro e contro solo se ce n'è più di una, scelta dell'utente, piano a passi, un passo alla volta con rischi) e scrive i file solo dopo il "procedi" dell'utente
argument-hint: "<cosa implementare, oppure i numeri dei problemi di /revisione da correggere>"
disable-model-invocation: true
model: opus
effort: high
---

# IMPLEMENTAZIONE

Cosa implementare: $ARGUMENTS

Questa è, insieme a `/piano`, l'unica skill che può modificare file del progetto. Tutte le altre sono in sola lettura.

Segui il FORMATO RISPOSTE del CLAUDE.md globale (titoli `##`, `---` tra le sezioni, schemi, grassetto, flussi con frecce).

## Principio: un passo alla volta

L'utente non legge molte modifiche pesanti insieme: le implementazioni si fanno **a passi piccoli e graduali**.

- ogni passo è la **più piccola modifica** che lascia il progetto funzionante (compila, si avvia, il resto dell'app non cambia comportamento).
- un passo = un'idea sola, pochi file, poche righe. Se un passo ha più di ~3 file o ~40 righe cambiate, spezzalo.
- ordine tipico: prima le basi che non cambiano nulla di visibile (tipi, service, funzioni nuove non ancora usate), poi il collegamento, poi la parte visibile, poi la pulizia.
- mai mostrare né applicare più di un passo per volta.

## Progettazione qui, esecuzione dopo

Questa skill gira con Opus e fa **tutta la progettazione**: nessun piano o soluzione deve esistere prima di lei (se la sessione normale ne ha proposto uno, ignoralo e riparti dal codice reale).

- il piano e il codice di ogni passo devono essere **completi e definitivi**: dopo il "procedi" l'esecuzione è meccanica (può farla anche un modello più semplice) e non deve prendere decisioni di design.
- ogni scelta (nomi, collocazione dei file, librerie, gestione degli errori) si decide e si mostra **qui**, prima del "procedi".

## Prima risposta

Una sezione `##` per fase, in questo ordine, **senza toccare nessun file**.

Le opzioni servono **solo se ci sono più strade realistiche**. Se la strada sensata è una sola, niente `## OPZIONI` né `## CONFRONTO`: vedi "Se la strada è una sola".

1. `## ANALISI`: leggi a fondo il codice attuale, non solo le righe interessate.

   - cosa fa oggi il codice coinvolto, passo per passo
   - chi lo chiama e cosa chiama (chiamanti, funzioni usate, dati in ingresso e in uscita)
   - convenzioni del progetto da rispettare (CLAUDE.md del progetto, nomenclatura, collocazione dei file)
   - se è codice che esiste già altrove (duplicati, utility riusabili), segnalalo
   - leggi il codice reale, non inventare: se una cosa non c'è, dillo
   - se la strada è una sola, scrivi in una riga perché non ci sono alternative

2. `## OPZIONI` (solo se ci sono più strade): **tutti** i modi realistici di implementare la richiesta in questo progetto.

   - un sottotitolo `### N. NOME OPZIONE` per ciascuna (nome max 3 parole)
   - per ognuna: come funziona in 1-2 righe, quali file tocca e quanti passi circa
   - poi i pro con 🟢 e i contro con 🟡 (lieve) o 🔴 (grave), una voce per riga
   - niente codice: solo l'idea
   - le strade che non funzionerebbero o violano le convenzioni del progetto vanno solo nominate in una riga, con il motivo
   - non inventare opzioni per riempire: ogni opzione deve essere davvero praticabile

3. `## CONFRONTO` (solo se ci sono più strade): tabella `Opzione | Pro principale | Contro principale` (celle 1-4 parole), poi una NOTA in grassetto con l'opzione **consigliata** e il motivo in una riga.

Chiudi con `---` e `## DOMANDA`: "Quale opzione scegli (numero)?" Poi fermati e attendi.

## Se la strada è una sola

La prima risposta contiene ANALISI (con la riga sulla strada unica), `## PIANO A PASSI`, `## PASSO 1` e `## RISCHI`, e chiude con la DOMANDA del "procedi" (come in "Seconda risposta"). Non c'è nessuna scelta da fare.

## Seconda risposta: il piano

La scelta dell'utente **non** è un "procedi": anche qui non si modifica nessun file. Se l'utente chiede un'opzione mista o modificata, progetta quella.

1. `## PIANO A PASSI`: l'elenco numerato di **tutti** i passi dell'opzione scelta, una riga ciascuno (cosa fa il passo e perché il progetto funziona comunque dopo). Solo l'elenco, nessun codice. Se basta un passo solo, scrivilo e basta.

2. `## PASSO 1`: i dettagli del solo primo passo.

   - prima un `### DOVE` con l'albero delle cartelle (`├──` `└──`) con ogni file toccato in questo passo e `modificato` o `nuovo`
   - poi un sottotitolo `### 📄 nomefile.ext` per ogni file (nome in grassetto, link al file se sta nel progetto)
   - per ogni file: cosa cambia in una riga, poi i riquadri `PRIMA` e `DOPO` con il codice reale, completo, rispettando le REGOLE SEMANTICHE del CLAUDE.md globale. File nuovo: solo `NUOVO`. Codice eliminato: solo PRIMA
   - sotto ogni riquadro (PRIMA, DOPO, NUOVO): una riga che dice **cosa fa effettivamente** quel cambiamento (cosa succede in più, in meno o diversamente a runtime, visto dall'app o dall'utente; non la ripetizione del codice) e il glossario senza titolo, un elenco puntato `- termine = cosa fa` (vedi MODIFICHE ESEGUITE nel CLAUDE.md globale)
   - se sposti o rinomini file, elenca anche gli import da aggiornare
   - il passo segue solo l'opzione scelta: niente nuove alternative

3. `## RISCHI`: cosa può rompersi o peggiorare **con questo passo**, concreto e verificato, niente rischi ipotetici.

   - ogni rischio con 🟡 se lieve o 🔴 se alto, e dove guardare (nomeFile:riga)
   - cosa viene toccato indirettamente (altre schermate, test, import)
   - come verificherai che non si sia rotto nulla

Chiudi con `---` e `## DOMANDA`: "Vuoi la spiegazione del passo 1 (`/spiegazione`) o scrivi **procedi** per applicarlo?" Poi fermati e attendi.

Se l'utente lancia `/spiegazione`, dopo la spiegazione serve comunque un nuovo "procedi" per applicare il passo.

## Dopo il "procedi"

Solo il messaggio "procedi" (o equivalente esplicito) è il via. Una risposta a una domanda, un chiarimento o un "ok capito" **non** lo sono.

1. applica ESATTAMENTE le modifiche del passo proposto, niente di più, e niente dei passi successivi. Se durante il lavoro scopri che servono modifiche diverse, fermati e descrivile prima di farle.
2. verifica: esegui lint e test dei file toccati con i comandi del progetto (vedi il CLAUDE.md del progetto) e controlla che non restino import rotti e che il progetto sia ancora funzionante.
3. rispondi con `## ESITO` (verifica fatta e risultato; se un test fallisce, riportalo con l'output, anche se già falliva prima: verificalo) e `## MODIFICHE ESEGUITE` con una voce per file, i riquadri PRIMA / DOPO / NUOVO, la spiegazione breve e il glossario (elenco `- termine = cosa fa`, senza titolo).
4. se restano passi: mostra `## PASSI RIMASTI` (l'elenco con i fatti spuntati `- [x]` e i restanti `- [ ]`), poi `## PASSO N` e `## RISCHI` del passo successivo, e chiudi con "Vuoi la spiegazione del passo N (`/spiegazione`) o scrivi **procedi** per applicarlo?" Ogni passo ha il suo "procedi".
5. a lavoro finito (nessun passo rimasto), dopo `## MODIFICHE ESEGUITE` aggiungi `## TEST DA FARE`: i test **manuali** che l'utente deve fare per verificare **tutta** l'implementazione (tutti i passi, non solo l'ultimo).

   - test numerati, uno per comportamento da verificare, ognuno con un sottotitolo `### N. NOME TEST` (nome max 3 parole)
   - ogni test ha tre voci, in questo ordine:
     - **Passaggi**: elenco numerato delle azioni esatte (quale schermata, quale pulsante, cosa scrivere)
     - **Controlla**: cosa guardare (schermata, messaggio, console, scheda Rete)
     - **Atteso**: ✅ il risultato corretto, in una riga
   - oltre al caso che funziona, includi i casi di errore (dati sbagliati, permessi mancanti, rete assente) se il codice li gestisce
   - includi almeno un test di **non regressione** sulle parti toccate indirettamente (prese dalle sezioni RISCHI)
   - niente test già eseguiti da te (lint, test automatici): solo quelli che richiedono le mani dell'utente

   Esempio di un test:

   ```
   ### 1. CAMBIO PASSWORD

   **Passaggi**
   1. Apri Profilo → Sicurezza
   2. Scrivi la password attuale e una nuova
   3. Premi Salva

   **Controlla**: il messaggio in alto e la scheda Rete (chiamata change-password)

   **Atteso**: ✅ messaggio di conferma, risposta 200, al prossimo login vale la nuova password
   ```

   Dopo i test, in una riga, suggerisci `/revisione` per far controllare il lavoro.

## Regole

- se l'utente dà codici di `/revisione` (`P1`, `R2`, `CC3`, `tutti P`, `tutti R`, `tutti CC`, `tutti`), implementa solo quelle voci, sempre a passi.
  - in ANALISI elenca le voci incluse, ognuna con codice e titolo
  - nel PIANO A PASSI ogni passo indica il codice che risolve (es. "P1")
  - con più voci, ordine: prima i P 🔴, poi gli altri P, poi R, infine CC
  - se un codice non esiste nella revisione presente in chat, chiedi invece di indovinare
- se la richiesta è ambigua o manca un'informazione, chiedi prima di proporre.
- se l'utente cambia richiesta o contesta la proposta, riparti dalla fase interessata e riproponi: serve un nuovo "procedi".
- se l'utente chiede di unire o saltare dei passi, puoi farlo, ma solo su sua richiesta esplicita.
- non fare domande da quiz.
- non modificare nulla prima del "procedi".
