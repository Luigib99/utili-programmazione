---
name: chat-riprendi
description: Riprende il lavoro da dove l'ultima chat si era fermata, leggendo il contesto salvato con /chat-termina.
argument-hint: "<vuoto per l'ultimo contesto del progetto, oppure l'id (anche le prime 8 cifre)>"
disable-model-invocation: true
---

# CHAT-RIPRENDI

Id richiesto (facoltativo): $ARGUMENTS

## Cosa fare
- leggi il contesto con Bash, usando come progetto il nome della cartella corrente:
  ```sh
  node ~/.claude/sala-controllo/server.js --contesto ultimo <progetto> <id, se dato>
  ```
- se il comando dice che non c'è nessun contesto, dillo in una riga e fermati; con `elenco` al posto di `ultimo` vedi i contesti disponibili.
- non modificare nulla e non cominciare a lavorare.
- rispondi con quattro sezioni brevi (FORMATO RISPOSTE del CLAUDE.md globale): `## OBIETTIVO`, `## A CHE PUNTO SIAMO`, `## DECISIONI`, `## PROSSIMO PASSO`.
- il contesto è una fotografia passata: se cita file o funzioni, verifica che esistano ancora prima di fidarti; segnala le differenze.
- chiudi con `## DOMANDA` (preceduta da `---`): "Confermi il prossimo passo?"; attendi il via dell'utente prima di agire.
