---
name: spiegazione
description: Spiega passo per passo il piano o il codice appena proposto, indicando per ogni elemento se è un metodo esistente (libreria/framework) o una funzione del progetto.
argument-hint: "[passo o parte da spiegare, opzionale]"
disable-model-invocation: true
---

# SPIEGAZIONE

Argomento opzionale dell'utente: $ARGUMENTS

## Obiettivo

Spiegare l'ultimo piano o codice della conversazione, passo per passo, così l'utente:

1. sa **riusare** ciò che si implementa

2. capisce **esattamente cosa fa** ciò che si implementa

Se c'è un argomento (es. "passo 3"), spiega solo quello. Se manca, spiega tutto l'ultimo piano.

## Percorso

Una sezione `##` per ogni passo del piano, nello stesso ordine. In ogni passo:

1. **COSA FA**: una riga, la conclusione.

2. **ELEMENTI**: un punto per ogni elemento del codice (funzione, hook, variabile, costante, import), formato `- elemento = cosa fa`.

3. **ORIGINE**: per ogni elemento dichiara di che tipo è, con la tabella sotto.

4. **PERCHÉ QUI**: perché serve in questo punto e cosa si rompe senza.

5. Il codice del passo, in riquadro, con il nome del file in grassetto sopra.

## Origine degli elementi

Per OGNI funzione o metodo richiamato indica una sola di queste origini:

| Origine | Significato |
|---|---|
| NOSTRA | scritta nel progetto |
| LIBRERIA | pacchetto esterno (indica quale) |
| FRAMEWORK | React, browser, Node, ecc. |
| NUOVA | la creiamo in questo passo |

- Per le NOSTRE scrivi **file e riga** dove è definita, verificandola con Grep/Read.

- Per le LIBRERIA scrivi il nome del pacchetto, controllando gli import e `package.json`.

- Non indovinare mai l'origine: se non la trovi nel codice, dillo.

## Regole

- Segui il FORMATO RISPOSTE del CLAUDE.md globale (titoli `##`, `---` tra le sezioni, un'idea per riga, grassetto, flussi con frecce).

- Un punto per elemento: mai paragrafi.

- I concetti teorici non si spiegano: accennali e rimanda a `/insegnante` ("posso approfondire X").

- Se una cosa non è nel codice, dillo invece di inventarla.

- Se il piano contiene un'idea sbagliata, segnalala chiaramente.

- Non fare quiz all'utente.

- Sola lettura: non modificare file e non proporti di farlo.
