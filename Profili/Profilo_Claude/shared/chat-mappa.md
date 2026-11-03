# Chat della mappa

Ogni mappa (dati o struttura) ha in basso a sinistra una chat in cui l'utente fa domande di chiarimento e mini-lezioni sulla mappa. Le domande passano dal server locale `~/.claude/shared/chat-mappa-server.js` a un `claude -p` in sola lettura (`--restricted`, solo `Read`/`Grep`/`Glob`, chiusa nella cartella del progetto, chat non salvata).

## Quando generi una mappa

1. avvia il server, in background, con `node ~/.claude/shared/chat-mappa-server.js --sfondo` (se è già acceso non succede nulla; resta acceso fino al riavvio del PC).
2. nel JSON della mappa aggiungi `"chat": { "token": "<contenuto di ~/.claude/chat-mappa-token>", "project": "<percorso assoluto del progetto con />" }`. Il file del gettone lo crea il server al primo avvio: leggilo dopo il punto 1.
3. non citare la chat in chat: è sempre presente, l'utente la conosce.

## Regole

- il gettone resta solo nel file della mappa (che sta in `~/flussi`, fuori dalle repo): mai in repo, commit o messaggi.
- `project` è la cartella da cui la chat può leggere il codice: la radice della repo del progetto, non una sottocartella.
- per spegnere il server: `node ~/.claude/shared/chat-mappa-server.js --ferma`.
- se la chat dà errori, il messaggio rosso nella pagina dice cosa fare; il server si prova con `GET http://127.0.0.1:4517/stato`.
