---
name: chat-termina
description: Salva il contesto della chat (cosa si è fatto e da dove ripartire) nella sala di controllo, per riprenderlo in una chat nuova con /chat-riprendi.
argument-hint: "<vuoto, oppure una nota su cosa far risaltare>"
disable-model-invocation: true
---

# CHAT-TERMINA

Nota dell'utente (facoltativa): $ARGUMENTS

## Cosa fare
- non modificare nessun file del progetto: leggi solo la conversazione e, se serve, `git status` / `git diff --stat`.
- scrivi il passaggio di consegne a un'altra chat che non sa nulla di questa: deve poter ripartire senza rileggere la conversazione.
- salvalo con Bash:
  ```sh
  node ~/.claude/sala-controllo/server.js --contesto aggiungi <<'EOF2'
  { "titolo": "<cosa si stava facendo, 3-8 parole>", "progetto": "<nome della cartella del progetto corrente>", "obiettivo": "<...>", "fatto": "<...>", "file": "<...>", "decisioni": "<...>", "prossimo": "<...>" }
  EOF2
  ```

## Campi (brevi: una riga per voce, che inizia con "- ")
- `obiettivo`: cosa vuole ottenere l'utente, in 1-2 righe.
- `fatto`: cosa è stato completato e verificato; separa ciò che è solo tentato o non provato.
- `file`: file creati o modificati, con a fianco cosa è cambiato.
- `decisioni`: scelte fatte e **perché**, comprese le strade scartate e le richieste esplicite dell'utente da rispettare (es. "aspetta il via prima di modificare").
- `prossimo`: il prossimo passo concreto, più eventuali domande aperte o blocchi.

## Regole
- il JSON deve essere valido: a capo dentro le stringhe `\n`, virgolette `\"`.
- mai dati sensibili (token, password, chiavi, dati personali reali).
- niente riassunti vaghi ("ho sistemato varie cose"): nomi di file, funzioni, valori.
- se il comando dà errore, dillo in una riga; non riprovare in altri modi.
- risposta finale: la sola sezione `## RICHIESTA` con una riga, "Contesto salvato: apri una chat nuova e usa /chat-riprendi."
