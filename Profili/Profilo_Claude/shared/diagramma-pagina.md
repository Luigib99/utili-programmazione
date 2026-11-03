# Diagramma della struttura

Regole per il diagramma della **struttura** (`MAPPA` `struttura` delle skill): ogni schermata coinvolta è **disegnata come appare sul telefono**, così l'utente riconosce ogni elemento a colpo d'occhio, ne vede la posizione e, cliccandolo, le proprietà. Le regole specifiche di una skill restano nel suo SKILL.md e hanno la precedenza su queste.

## Formato

- il diagramma è una pagina HTML interattiva, sfondo scuro, generata dal template `~/.claude/shared/diagramma-pagina-template.html`.
- copia il template e sostituisci **solo** il JSON dentro `<script id="page-data">`: non modificare HTML, CSS o JS del template (le regole del JSON sono nel commento sopra il blocco).
- **chat**: segui `~/.claude/shared/chat-mappa.md` (server avviato e campo `chat` nel JSON).
- `overview`: il riepilogo del pannello di destra all'apertura e cliccando fuori dai telefoni, con le stesse regole del diagramma dei dati (`goal`, `problem`, `todo`, `files`, `notes`).

## Schermate

- una voce in `screens` per ogni schermata (o stato della stessa schermata) interessata dalla richiesta: più schermate coinvolte, più telefoni affiancati (es. "Pagina 1", "Ultima pagina" se cambiano pulsanti o contenuto).
- `name` dice cosa mostra la schermata; nel `subtitle` indica piattaforma, tema e ruolo simulati (es. "Android, tema chiaro, admin").
- `background`: il colore di fondo reale della schermata.

## Elementi

- l'albero degli elementi segue il JSX reale, dal componente più esterno (es. il modale) fino a testi, icone e immagini: ogni elemento visibile o con uno stile proprio è un nodo. Non disegnare i wrapper senza stile né ruolo.
- `style`: lo stile **reale e completo** di quell'elemento, unendo tutti gli stili applicati (StyleSheet, `globalStyles`, stili inline, tema), con i valori **risolti**: colori in esadecimale, misure in numeri, percentuali come stringhe. `fontFamily` diventa `fontWeight` numerico (Regular 400, SemiBold 600, Bold 700). Per le misure calcolate a runtime usa una stima realistica e dillo in `explanation`.
- `styleSource`: da dove arriva ogni valore che non è scritto nel componente stesso (es. `theme.textMuted`, `colors.secondary`, `globalStyles.tutorialTitle`).
- `text`: il testo che si vede davvero, con la traduzione nella lingua principale del progetto; `glyph` per le icone; `image` per descrivere un'immagine, con le misure in `style`.
- `kind`: `component` (componente del progetto), `view` (contenitore), `list` (liste, pager, ripetizioni), `control` (ciò che si tocca), `text`, `image`, `icon`.
- liste e ripetizioni: disegna gli elementi ripetuti come appaiono (es. tutti i pallini), ma per liste lunghe di contenuti (es. 50 messaggi) disegnane 3-4 e indica il totale in `badges`.
- `condition` per ciò che compare solo in certi casi; `badges` per i fatti utili a decidere (ripetizioni, duplicati, `position: absolute`, valori scritti a mano).
- `name`, `file`, `path`, `line`, `explanation`, `props`, `terms`: come nel diagramma dei dati (percorso **assoluto** con `/`, riga verificata leggendo il file).
- **dati sensibili**: stesse regole del diagramma dei dati; testi di esempio al posto di dati personali reali.

## Riferimenti agli elementi

- i numeri **S1, S2…** sono assegnati dal template in ordine (schermata per schermata, prima un elemento poi i suoi figli) e sono il riferimento comune per tutta la richiesta.
- nelle fasi successive indica gli elementi come "S4 (`nextButton`)".
- l'utente può scrivere "sposta S4 sopra S2", "S3 più grande": interpreta ogni numero come l'elemento corrispondente; se non esiste o è ambiguo, chiedi.
- non rigenerare il diagramma con una numerazione diversa durante la stessa richiesta; un disegno nuovo (es. la schermata dopo la modifica) va in un file nuovo, dichiarando che da quel momento i numeri si riferiscono a quel file.

## Salvataggio

- salva in `~/flussi/<nome-cartella-progetto>/<AAAA-MM-GG>-<titolo-in-kebab-case>-struttura.html` (il `TITOLO` della scheda); crea la cartella se non esiste.
- in chat indica solo il percorso del file (cliccabile), nel blocco della skill che mostra il diagramma.
