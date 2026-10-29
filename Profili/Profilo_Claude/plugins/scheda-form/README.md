# scheda-form

Mod di Claude Code per le skill del Profilo Claude (`modifica-maggiore`, `modifica-minore`, `debug`, `revisione`, `lezione`).

Lanciando una skill **senza testo**, la casella dei messaggi si riempie con lo schema dei campi della sua scheda richiesta e sopra compare l'aiuto di ogni campo. All'invio la mod controlla i campi obbligatori: se ne manca uno la skill non parte e il testo torna nella casella; altrimenti toglie i campi vuoti e lancia la skill. Con testo libero la skill parte come sempre.

## Installazione

Da un terminale (nell'estensione VS Code il comando `/plugin` non esiste):

```
claude plugin install scheda-form --marketplace Luigib99/utili-programmazione
```

Lo scope predefinito è utente: vale in tutti i progetti. Nel Claude Code da terminale funziona anche `/plugin install scheda-form --marketplace Luigib99/utili-programmazione`.

## Manutenzione

I campi stanno nella tabella `SCHEDE` di `hooks/register.ts` e devono restare allineati alla fase SCHEDA RICHIESTA di ogni `SKILL.md`. Dopo una modifica: `claude plugin validate` e `claude plugin test` su questa cartella, poi alza `version` in `.claude-plugin/plugin.json`.

Le API delle mod sono in early access: dopo un aggiornamento di Claude Code la mod può richiedere modifiche. Se smette di funzionare, le skill continuano a funzionare da sole.
