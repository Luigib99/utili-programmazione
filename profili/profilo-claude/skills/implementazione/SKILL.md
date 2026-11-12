---
name: implementazione
description: Implementa una modifica di codice in 3 fasi (analisi, modifiche proposte, rischi) e scrive i file solo dopo il "procedi" dell'utente
argument-hint: "<cosa implementare, oppure i numeri dei problemi di /revisione da correggere>"
disable-model-invocation: true
model: opus
effort: high
---

# IMPLEMENTAZIONE

Cosa implementare: $ARGUMENTS

Questa è, insieme a `/piano`, l'unica skill che può modificare file del progetto. Tutte le altre sono in sola lettura.

Segui il FORMATO RISPOSTE del CLAUDE.md globale (titoli `##`, `---` tra le sezioni, schemi, grassetto, flussi con frecce).

## Prima risposta: 3 fasi

Una sezione `##` per fase, in questo ordine, **senza toccare nessun file**.

1. `## ANALISI`: leggi a fondo il codice attuale, non solo le righe interessate.

   - cosa fa oggi il codice coinvolto, passo per passo
   - chi lo chiama e cosa chiama (chiamanti, funzioni usate, dati in ingresso e in uscita)
   - convenzioni del progetto da rispettare (CLAUDE.md del progetto, nomenclatura, collocazione dei file)
   - se è codice che esiste già altrove (duplicati, utility riusabili), segnalalo
   - leggi il codice reale, non inventare: se una cosa non c'è, dillo

2. `## MODIFICHE PROPOSTE`: proponi in modo completo tutto ciò che cambierai.

   - prima un `### DOVE` con l'albero delle cartelle (`├──` `└──`) che mostra la posizione di ogni file che modifichi o crei, con a fianco `modificato` o `nuovo`
   - poi un sottotitolo `### 📄 nomefile.ext` per ogni file (nome in grassetto, link al file se sta nel progetto)
   - per ogni file: cosa cambia in una riga, poi i riquadri `PRIMA` e `DOPO` con il codice reale, completo, rispettando le REGOLE SEMANTICHE del CLAUDE.md globale. File nuovo: solo DOPO. Codice eliminato: solo PRIMA
   - se sposti o rinomini file, elenca anche gli import da aggiornare
   - niente alternative non richieste: proponi una sola strada

3. `## RISCHI`: cosa può rompersi o peggiorare, concreto e verificato, niente rischi ipotetici.

   - ogni rischio con 🟡 se lieve o 🔴 se alto, e dove guardare (nomeFile:riga)
   - cosa viene toccato indirettamente (altre schermate, test, import)
   - come verificherai che non si sia rotto nulla

Chiudi con `---` e `## DOMANDA`: "Scrivi **procedi** per applicare le modifiche." Poi fermati e attendi.

## Dopo il "procedi"

Solo il messaggio "procedi" (o equivalente esplicito) è il via. Una risposta a una domanda, un chiarimento o un "ok capito" **non** lo sono.

1. applica ESATTAMENTE le modifiche proposte, niente di più. Se durante il lavoro scopri che servono modifiche diverse, fermati e descrivile prima di farle.
2. verifica: esegui lint e test dei file toccati con i comandi del progetto (vedi il CLAUDE.md del progetto) e controlla che non restino import rotti.
3. rispondi con `## ESITO` (verifica fatta e risultato; se un test fallisce, riportalo con l'output, anche se già falliva prima: verificalo) e `## MODIFICHE ESEGUITE` con una voce per file e i riquadri PRIMA / DOPO.
4. in una riga suggerisci `/revisione` per far controllare il lavoro.

## Regole

- se l'utente dà numeri di problemi di `/revisione`, implementa solo quelli.
- se la richiesta è ambigua o manca un'informazione, chiedi prima di proporre.
- se l'utente cambia richiesta o contesta la proposta, riparti dalla fase interessata e riproponi: serve un nuovo "procedi".
- non fare domande da quiz.
- non modificare nulla prima del "procedi".
