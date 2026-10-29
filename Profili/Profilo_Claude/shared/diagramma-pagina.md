# Diagramma della pagina

Regole per il diagramma della **struttura** (mappa `struttura` di `/modifica-maggiore`): mostra **com'è fatta** una schermata (struttura e grafica), non come si muovono i dati. Le regole specifiche di una skill restano nel suo SKILL.md e hanno la precedenza su queste.

## Formato

- il diagramma è una pagina HTML interattiva, sfondo scuro, generata dal template `~/.claude/shared/diagramma-pagina-template.html`.
- copia il template e sostituisci **solo** il JSON dentro `<script id="page-data">`: non modificare HTML, CSS o JS del template (le regole del JSON sono nel commento sopra il blocco).

## Contenuto

- la pagina è un **albero di riquadri uno dentro l'altro**, disegnati nell'ordine e nella direzione (`direction`) in cui compaiono sullo schermo, ricavati da JSX e stili: chi sta sopra nel codice sta sopra nel disegno, un contenitore con `flexDirection: 'row'` mette i figli in riga.
- un riquadro per ogni pezzo **visibile o strutturale** che serve alla richiesta: componenti del progetto, contenitori con uno stile proprio, liste e pager, pulsanti, testi e icone principali. Non disegnare i wrapper senza stile né ruolo.
- `kind`: `component` per i componenti del progetto (anche importati da altri file), `view` per i contenitori, `list` per liste, pager e ripetizioni, `control` per ciò che si tocca, `text` per testi, icone e immagini.
- `name`: il nome nel codice (es. `TutorialPage3`, `footerContainer`); per un elemento senza nome, una descrizione breve.
- `file` + `path` + `line`: come nel diagramma del flusso (percorso **assoluto** con `/`, riga verificata leggendo il file).
- `condition`: quando il riquadro compare solo in certi casi (es. "solo admin", "dopo l'ultima pagina"). Se due rami alternativi hanno una struttura diversa, disegnali entrambi, ognuno con la sua `condition`.
- `badges`: fatti strutturali utili a decidere, brevi: ripetizioni (`×10`), duplicati (`copia di S5`), posizionamento fuori dal flusso (`position: absolute`), valori scritti a mano che si ripetono.
- un componente figlio (es. le singole pagine) si **espande** con i suoi riquadri solo se la richiesta lo riguarda; altrimenti resta un riquadro unico con `badges` o `label` che dicono cosa contiene.
- `style`: solo gli stili che contano per la grafica (colori, misure, margini, bordi, posizione), con i valori reali; per i colori del tema indica anche il token (es. `colors.primary`).
- `props`: solo quelle che cambiano aspetto o comportamento del riquadro.
- `explanation`: 1-3 frasi semplici con soggetto esplicito; `terms` come nel diagramma del flusso.
- **dati sensibili**: stesse regole del diagramma del flusso, mai valori reali.
- massimo ~25 riquadri: oltre, raggruppa le parti non interessate dalla richiesta.

## Riferimenti ai riquadri

- i numeri **S1, S2…** sono assegnati dal template dall'alto in basso (prima un riquadro, poi i suoi figli) e sono il riferimento comune per tutta la richiesta.
- nelle fasi successive indica i riquadri come "S4 (`footerContainer`)".
- l'utente può scrivere "sposta S4 sopra S2", "S3 più grande": interpreta ogni numero come il riquadro corrispondente; se non esiste o è ambiguo, chiedi.
- non rigenerare il diagramma con una numerazione diversa durante la stessa richiesta; un disegno nuovo (es. la pagina dopo la modifica) va in un file nuovo, dichiarando che da quel momento i numeri si riferiscono a quel file.

## Salvataggio

- salva in `~/flussi/<nome-cartella-progetto>/<AAAA-MM-GG>-<argomento-in-kebab-case>-struttura.html`; crea la cartella se non esiste.
- in chat indica solo il percorso del file (cliccabile), nel blocco della skill che mostra il diagramma (MAPPA o DIAGRAMMA).
