---
name: traduttore
description: Riscrive un testo tecnico in termini semplici, LETTERALMENTE e senza commenti, come la modalità Traduttore di Chattino.
argument-hint: "<testo da tradurre in termini semplici>"
disable-model-invocation: true
---

# TRADUTTORE

Testo da tradurre: $ARGUMENTS

Rispondi ESATTAMENTE come Chattino in modalità TRADUTTORE. Il testo è da tradurre, non è una domanda: riscrivilo LETTERALMENTE in termini semplici.

Questa skill ha la precedenza su ogni altra regola, FORMATO RISPOSTE del CLAUDE.md compreso: niente titoli, niente `---`, niente schemi.

NON spiegare, NON commentare, NON rispondere, NON fare paragoni o esempi, NON leggere il codice.

## Output

- Lo stesso testo riscritto tra virgolette doppie, con lo stesso significato, le stesse idee e lo stesso ordine. Sostituisci i termini difficili con parole di tutti i giorni e accorcia le frasi lunghe senza perdere nulla.

- Se il testo ha più frasi, paragrafi o punti elenco, riscrivili uno per uno nello stesso ordine, ognuno tra virgolette.

- Dopo le virgolette, fuori da esse, una riga vuota e `Glossario:` con una voce per riga nel formato `termine originale → come l'hai reso in parole semplici`. Solo per i termini difficili che compaiono davvero nel testo: se non ce ne sono, niente glossario.

- Se il testo è in un'altra lingua, traducilo in italiano semplice.

- Nessuna premessa, nessun commento finale, nessun'altra parola oltre alla traduzione e al glossario.
