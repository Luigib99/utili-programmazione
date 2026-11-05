# Chat della mappa

Ogni mappa (dati o struttura) ha in basso a sinistra una chat in cui l'utente fa domande di chiarimento e mini-lezioni sulla mappa. Le domande passano dal server locale `~/.claude/shared/chat-mappa-server.js` a un `claude -p` in sola lettura (`--restricted`, solo `Read`/`Grep`/`Glob`, chiusa nella cartella del progetto, chat non salvata).

## Quando generi una mappa

1. avvia il server, in background, con `node ~/.claude/shared/chat-mappa-server.js --sfondo` (se è già acceso non succede nulla; resta acceso fino al riavvio del PC).
2. nel JSON della mappa aggiungi `"chat": { "token": "<contenuto di ~/.claude/chat-mappa-token>", "project": "<percorso assoluto del progetto con />" }`. Il file del gettone lo crea il server al primo avvio: leggilo dopo il punto 1.
3. non citare la chat in chat: è sempre presente, l'utente la conosce.

## Regole

- il gettone resta solo nel file della mappa (che sta in `~/flussi`, fuori dalle repo): mai in repo, commit o messaggi.
- `project` è la cartella da cui la chat può leggere il codice: la radice della repo del progetto, non una sottocartella.
- `indizi` (tasto 💡 della chat): solo se la skill li prevede (es. `piano`); formato nel commento sopra il JSON del template. La pagina non li manda al Claude della chat.
- in fondo al riepilogo della mappa ci sono **Apri cartella** ed **Elimina mappa**: passano dal server (`/cartella`, `/elimina`), che accetta solo file `.html` dentro `~/flussi`. Dopo una modifica al server va riavviato (`--ferma`, poi `--sfondo`).
- in testa alla chat c'è la modalità (Normale, Insegnante, Traduttore, Senior developer), mandata al server come `modalita`; resta salvata nel browser. Senza `modalita` il server risponde da Insegnante.
- la stessa chat (Chattino) c'è anche nella sala di controllo (`~/.claude/sala-controllo/`): la sala avvia questo server da sola e passa il suo gettone alla pagina, con `tipo: "sala"`.
- per spegnere il server: `node ~/.claude/shared/chat-mappa-server.js --ferma`.
- se la chat dà errori, il messaggio rosso nella pagina dice cosa fare; il server si prova con `GET http://127.0.0.1:4517/stato`.
