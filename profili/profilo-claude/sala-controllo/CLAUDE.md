# CLAUDE.md: sala di controllo

Server locale in Node (nessun pacchetto esterno) per sessioni di Claude, branch, attività e piani dei progetti. Avvio: `node ~/.claude/sala-controllo/server.js --apri`. Questo file vale per tutto il codice in questa cartella.

## STRUTTURA

```
sala-controllo/
├── server.js              solo avvio: pagina, file statici, controlli di sicurezza, smistamento comandi
├── moduli/                un file per argomento (vedi livelli sotto)
├── pagina.html            pagina della sala (CSS e JS inline: ancora un file solo, da dividere)
├── lettura-codice/        lettura del codice dei progetti (modulo a parte)
├── quiz-lezione.js        quiz di fine piano
├── controllo-mappa.js     controllo dei dati delle mappe
└── dati/                  dati privati (gettone, progetti, attività, piani): MAI nel repo, MAI letti
```

## LIVELLI DEI MODULI

Un modulo importa **solo da livelli più bassi**. Mai il contrario: niente giri.

| Livello | Moduli |
|---|---|
| 0 | base, rete, fasi-piano |
| 1 | git, claude, messaggi-backend, lezioni, contesti, sessioni |
| 2 | progetti, attivita, modello-piano |
| 3 | mappe, richiesta |
| 4 | piani |
| 5 | comandi-terminale, rotte |
| 6 | server.js |

## DOVE VA IL CODICE NUOVO

| Aggiungo | Va in |
|---|---|
| Una rotta `/api/...` | rotte.js (la logica nel modulo del suo argomento) |
| Un comando da terminale | comandi-terminale.js (e aggiornare `USO`) |
| Logica dei piani | piani.js; campi e fasi in fasi-piano.js; forma del piano in modello-piano.js |
| Comando git | git.js |
| Chiamata a `claude -p` | claude.js (`avviaClaude`) |
| Percorso o costante condivisa | base.js (rete in rete.js) |
| Argomento nuovo | modulo nuovo in `moduli/`, nome in italiano, kebab-case, al livello giusto |

## REGOLE

- `server.js` non riceve logica: solo avvio e controlli di sicurezza (host, origine, gettone restano dentro `avvia()`)

- `require` sempre in cima al file; nessun import inutilizzato

- i file fuori da `moduli/` (controllo-mappa, lettura-codice, quiz-lezione, server.js) si importano con `../`

- `CARTELLA_DATI` sta in `base.js` ed è `../dati`: non ricalcolarla altrove

- ogni blocco di codice ha sopra un titolo breve in MAIUSCOLO (regole semantiche del CLAUDE.md globale); niente commenti superflui

- un modulo oltre circa 250 righe: valutare se dividerlo per argomento

- un comando sconosciuto non avvia la sala: stampa `USO` ed esce

## PRIMA DI CHIUDERE UN LAVORO

1. `node --check` su `server.js` e su ogni file di `moduli/`

2. `node server.js --attivita progetti` (carica tutti i moduli: scopre import rotti)

3. se si tocca `pagina.html`: controllare la sintassi dello script inline (`vm.Script`) e che i nomi tolti non siano più usati

4. copiare gli stessi file nel repo `~/.claude/plugins/marketplaces/utili-programmazione/profili/profilo-claude/sala-controllo/` (esclusa `dati/`) e confrontare con `diff --strip-trailing-cr`

5. commit e push solo se l'utente lo chiede

## DA NON FARE

- lanciare `node server.js` **senza argomenti** per provare: riscrive `~/Lezioni.md` e avvia il server della chat; per provare usare `--attivita progetti`

- leggere o stampare `dati/` (contiene il gettone e i dati di lavoro dell'utente; l'hook anti-segreti lo blocca)

- aggiungere dipendenze npm: il server usa solo moduli di Node

- la sala accesa usa il codice vecchio fino al riavvio (F + Invio nel terminale «sala di controllo»): dirlo all'utente quando si cambia un modulo

## DA FARE IN FUTURO

- dividere `pagina.html` (CSS e JS in file separati, serviti come `FILE_STATICI` in `server.js`, come `lettura-codice/`)
