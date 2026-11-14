---
name: implementazione
description: Implementa una modifica di codice a passi graduali (analisi, piano a passi, un passo alla volta con rischi) e scrive i file solo dopo il "procedi" dell'utente
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

## Prima risposta

Una sezione `##` per fase, in questo ordine, **senza toccare nessun file**.

1. `## ANALISI`: leggi a fondo il codice attuale, non solo le righe interessate.

   - cosa fa oggi il codice coinvolto, passo per passo
   - chi lo chiama e cosa chiama (chiamanti, funzioni usate, dati in ingresso e in uscita)
   - convenzioni del progetto da rispettare (CLAUDE.md del progetto, nomenclatura, collocazione dei file)
   - se è codice che esiste già altrove (duplicati, utility riusabili), segnalalo
   - leggi il codice reale, non inventare: se una cosa non c'è, dillo

2. `## PIANO A PASSI`: l'elenco numerato di **tutti** i passi, una riga ciascuno (cosa fa il passo e perché il progetto funziona comunque dopo). Solo l'elenco, nessun codice. Se basta un passo solo, scrivilo e basta.

3. `## PASSO 1`: i dettagli del solo primo passo.

   - prima un `### DOVE` con l'albero delle cartelle (`├──` `└──`) con ogni file toccato in questo passo e `modificato` o `nuovo`
   - poi un sottotitolo `### 📄 nomefile.ext` per ogni file (nome in grassetto, link al file se sta nel progetto)
   - per ogni file: cosa cambia in una riga, poi i riquadri `PRIMA` e `DOPO` con il codice reale, completo, rispettando le REGOLE SEMANTICHE del CLAUDE.md globale. File nuovo: solo `NUOVO`. Codice eliminato: solo PRIMA
   - sotto ogni riquadro (PRIMA, DOPO, NUOVO): la spiegazione breve dei cambiamenti e il glossario senza titolo, un elenco puntato `- termine = cosa fa` (vedi MODIFICHE ESEGUITE nel CLAUDE.md globale)
   - se sposti o rinomini file, elenca anche gli import da aggiornare
   - niente alternative non richieste: proponi una sola strada

4. `## RISCHI`: cosa può rompersi o peggiorare **con questo passo**, concreto e verificato, niente rischi ipotetici.

   - ogni rischio con 🟡 se lieve o 🔴 se alto, e dove guardare (nomeFile:riga)
   - cosa viene toccato indirettamente (altre schermate, test, import)
   - come verificherai che non si sia rotto nulla

Chiudi con `---` e `## DOMANDA`: "Scrivi **procedi** per applicare il passo 1." Poi fermati e attendi.

## Dopo il "procedi"

Solo il messaggio "procedi" (o equivalente esplicito) è il via. Una risposta a una domanda, un chiarimento o un "ok capito" **non** lo sono.

1. applica ESATTAMENTE le modifiche del passo proposto, niente di più, e niente dei passi successivi. Se durante il lavoro scopri che servono modifiche diverse, fermati e descrivile prima di farle.
2. verifica: esegui lint e test dei file toccati con i comandi del progetto (vedi il CLAUDE.md del progetto) e controlla che non restino import rotti e che il progetto sia ancora funzionante.
3. rispondi con `## ESITO` (verifica fatta e risultato; se un test fallisce, riportalo con l'output, anche se già falliva prima: verificalo) e `## MODIFICHE ESEGUITE` con una voce per file, i riquadri PRIMA / DOPO / NUOVO, la spiegazione breve e il glossario (elenco `- termine = cosa fa`, senza titolo).
4. se restano passi: mostra `## PASSI RIMASTI` (l'elenco con i fatti spuntati `- [x]` e i restanti `- [ ]`), poi `## PASSO N` e `## RISCHI` del passo successivo, e chiudi con "Scrivi **procedi** per applicare il passo N." Ogni passo ha il suo "procedi".
5. a lavoro finito (nessun passo rimasto), in una riga suggerisci `/revisione` per far controllare il lavoro.

## Regole

- se l'utente dà numeri di problemi di `/revisione`, implementa solo quelli, sempre a passi.
- se la richiesta è ambigua o manca un'informazione, chiedi prima di proporre.
- se l'utente cambia richiesta o contesta la proposta, riparti dalla fase interessata e riproponi: serve un nuovo "procedi".
- se l'utente chiede di unire o saltare dei passi, puoi farlo, ma solo su sua richiesta esplicita.
- non fare domande da quiz.
- non modificare nulla prima del "procedi".
