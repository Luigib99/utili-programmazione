# JSON della mappa dati

Regole del JSON da mettere dentro `<script id="flow-data">` di `diagramma-flusso-template.html` (o, dalla sala di controllo, nel file .json che la sala inserisce nel template).
Stanno qui e non nel template: chi genera la mappa legge solo queste righe invece di una pagina da oltre 100 KB.

```text
DATI DEL FLUSSO (unica parte da modificare). Il diagramma va dall'alto verso il basso:
ogni elemento di "nodes" è un riquadro e una freccia lo collega al successivo.
- side: "FRONTEND" (corsia blu a sinistra) | "BACKEND" (corsia gialla a destra)
- file, element: dove si trova il codice; action: cosa fa, in una frase breve
- path, line: percorso assoluto del file e riga dell'element; rendono cliccabili i nomi (aprono VS Code)
- physical: sezione "Cosa succede fisicamente", la prima del pannello: solo ciò che l'utente vede e fa
- simple: sezione "Spiegazione semplice", la seconda del pannello
- short: frase brevissima e semplice (max ~60 caratteri, niente termini tecnici) scritta in grigio nel riquadro chiuso;
  cliccando il riquadro si apre e mostra la versione tecnica a punti
- steps: (opzionale) 2-5 punti tecnici brevi del riquadro aperto, uno per azione; senza, il template divide does in frasi
- does / purpose / receives / returns: sezioni "Cosa fa", "A cosa serve", "Riceve", "Restituisce" del pannello
- terms: { "termine": "significato semplice" } mostrati come glossario del passo
- nei testi, il codice va tra backtick (`esempio`) e viene mostrato come codice
- tracked: (opzionale, a livello di FLOW) [{ "id", "name" }] oggetti seguiti passo per passo nella colonna
  a sinistra, un riquadro ciascuno; nei nodi in cui un oggetto cambia, "state": { "<id>": valore completo dopo
  quel passo } (gli oggetti non presenti in "state" restano invariati)
- section: (opzionale) inizia un nuovo flusso con un titolo, senza freccia dal nodo precedente
- incoming: (opzionale) "lost" se la freccia dal nodo precedente non arriva (rossa tratteggiata)
- payloadName / payload / fields: cosa passa al nodo successivo (payload null se nulla)
- call: (opzionale) cosa succede sulla freccia in uscita, mostrato cliccandola:
  { "kind": "http" | "socket" | "navigation" | "function" | "event" | "storage" | "process", "label": "POST /auth/login", "note": "frase semplice" }
- fields: { "percorso.del.campo": "spiegazione" }, gli array usano "lista[]", "" è il valore intero
- per mostrare un valore undefined scrivi "__undefined__"
- overview: (opzionale) riepilogo nel pannello all'apertura e cliccando fuori:
  { "goal": obiettivo, "problem": problema, "todo": cosa deve fare ora l'utente, "files": [{ "file", "path", "role" }], "notes": [..] }
  senza "files" il pannello elenca da solo i file della mappa
- codice: (a livello di FLOW) { "nomeNelCodice": { "path": percorso assoluto, "line": riga } } per ogni funzione,
  componente, hook o costante citati tra backtick: ogni `nome` (anche `nome()` o `oggetto.nome`) diventa un link alla sua riga
- id: (opzionale) nome breve del passo, da usare in "uscite" al posto di "D5"
- accanto: (opzionale) true = sta sulla stessa riga del passo precedente: di fianco nella stessa corsia (passi in parallelo)
  o di fronte nell'altra (chiamata e risposta tra app e server); la freccia tra i due diventa orizzontale
- tipo: (opzionale) "bivio" = rombo con una domanda ("domanda": "La risposta è 200?") e niente riquadro da aprire;
  le risposte sono le sue "uscite"
  "fine" = pillola verde che chiude una parte del flusso, con l'esito in "action" ("Accesso effettuato"); nessuna freccia esce
- uscite: (opzionale) sostituisce la freccia verso il passo successivo: [{ "verso": "D6" o un id, "tipo": "normale" | "ok" |
  "errore" | "alternativa", "etichetta": "sì" / "400 CODICE_ERRORE" / "riprova", "riga": 105, "call", "payloadName", "payload", "fields" }];
  ok = verde (strada giusta), errore = rosso con ✕, alternativa = grigio tratteggiato (ritorni, casi secondari)
  riga = riga del file del passo da cui parte la strada (return, throw, if), obbligatoria nei bivi; nel pannello diventa un link
  un'uscita per ogni esito reale: casi che finiscono in posti diversi o trattati in modo diverso non stanno nella stessa uscita
- avvisi: NON scriverlo: lo aggiunge la sala dopo aver confrontato la mappa con il codice
- indizi: (opzionale) [{ "testo": cosa osservare, "punti": ["D4", "D5"] }, { "testo", "punti": ["D5"] }]
  tasto Indizio della chat: il primo illumina la zona, il secondo il punto; mai la soluzione
- chat: { "token": contenuto di ~/.claude/chat-mappa-token, "project": percorso assoluto del progetto con "/" }
  attiva la chat in basso a sinistra (server: ~/.claude/shared/chat-mappa-server.js)
Non inserire la sequenza </script> nel JSON.
```
