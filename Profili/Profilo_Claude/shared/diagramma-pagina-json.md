# JSON della mappa struttura

Regole del JSON da mettere dentro `<script id="page-data">` di `diagramma-pagina-template.html` (o, dalla sala di controllo, nel file .json che la sala inserisce nel template).
Stanno qui e non nel template: chi genera la mappa legge solo queste righe invece di una pagina da oltre 100 KB.

```text
DATI DELLA STRUTTURA (unica parte da modificare). Ogni schermata coinvolta è disegnata come appare sul
telefono: gli elementi sono div flex in colonna come in React Native, con gli stili reali presi dal codice.
I numeri S1, S2… sono assegnati in automatico in ordine (schermata per schermata, prima un elemento poi i suoi figli).
- device: (opzionale) { "width": 390, "height": 844 } misure del telefono simulato
- screens: [{ "name": "cosa mostra", "background": colore di fondo, "root": elemento }]
Elemento:
- name: nome nel codice (componente o chiave di stile, es. "footer", "nextButton") o descrizione breve
- kind: "component" | "view" | "list" | "control" | "text" | "image" | "icon"
- file, path, line: dove si trova; path assoluto con "/" e riga verificata: rendono cliccabile il nome
- style: lo stile React Native REALE, già risolto: colori in esadecimale (non "colors.primary"), numeri in punti,
         percentuali come stringhe ("100%"), fontWeight numerico al posto di fontFamily (Regular 400, SemiBold 600, Bold 700);
         paddingHorizontal/Vertical, marginHorizontal/Vertical e elevation sono convertiti dal template
- styleSource: (opzionale) { "proprietà": "da dove arriva", es. "colors.secondary", "theme.textMuted", "globalStyles.tutorialTitle" }
- text: testo che si vede (traduzione nella lingua principale del progetto)
- glyph: per le icone, un carattere che le rappresenta (es. "←", "✕", "☰")
- image: per le immagini, cosa mostrano (es. "logo dell'app"); le misure vanno in style
- condition: (opzionale) quando compare (es. "solo admin", "dalla 2ª pagina")
- badges: (opzionale) note brevi (es. "×11 pallini", "position: absolute")
- explanation: cosa è, 1-2 frasi semplici
- props, terms: (opzionali) { "nome": "valore o significato" }
- children: (opzionale) elementi contenuti, in ordine di comparsa
- overview: (opzionale) riepilogo nel pannello all'apertura e cliccando fuori:
  { "goal": obiettivo, "problem": problema, "todo": cosa deve fare ora l'utente, "files": [{ "file", "path", "role" }], "notes": [..] }
  senza "files" il pannello elenca da solo i file della mappa
- indizi: (opzionale) [{ "testo": cosa osservare, "punti": ["S12", "S13"] }, { "testo", "punti": ["S13"] }]
  tasto Indizio della chat: il primo illumina la zona, il secondo il punto; mai la soluzione
- chat: { "token": contenuto di ~/.claude/chat-mappa-token, "project": percorso assoluto del progetto con "/" }
  attiva la chat in basso a sinistra (server: ~/.claude/shared/chat-mappa-server.js)
- avvisi: NON scriverlo: lo aggiunge la sala dopo aver confrontato la mappa con il codice
Non inserire la sequenza </script> nel JSON.
```
