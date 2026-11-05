---
name: piano
description: Mappa e revisione di un piano di lavoro scritto dall'utente nella sala di controllo, poi codice scritto da lui o seguendo il suo piano
argument-hint: "<il testo copiato dalla sala di controllo con «Copia per /piano»>"
disable-model-invocation: true
---

# PIANO

Il piano dell'utente è: $ARGUMENTS

Il piano lo scrive l'utente nella sezione Piani della sala di controllo (`~/.claude/sala-controllo/`), fase per fase: tu gli dai la mappa del codice com'è oggi, rivedi il suo ragionamento e, solo se lo sceglie, scrivi il codice seguendo il suo piano. Ogni messaggio segue il "Formato dei messaggi" di `~/.claude/shared/scheda-richiesta.md`, con i blocchi indicati in ogni fase.

**La soluzione la trova l'utente.** Non dare mai la soluzione (dov'è un bug, cosa cambiare, come implementarlo) né codice da incollare se l'utente non la chiede **esplicitamente** (es. "dammi la soluzione", "dimmi tu cosa fare", "mi arrendo"). Dubbi, domande, "non so", "aiuto" o "indizio" **non** sono una richiesta di soluzione: rispondi solo con SUGGERIMENTI che indirizzano.

## Struttura

1. passa a LETTURA.
2. se il piano chiede una mappa che non è ancora fatta, passa a MAPPA; altrimenti passa a REVISIONE.
3. quando il piano regge e l'utente sceglie, passa a IMPLEMENTAZIONE (solo con B) e poi a VERIFICA.
4. quando la richiesta è conclusa (sarà l'utente a dirlo) procedi alla SPIEGAZIONE FINALE.

In qualsiasi fase:

- se l'utente mostra un dubbio, fa una domanda o chiede aiuto o un indizio, rispondi con il solo blocco **1. SUGGERIMENTI**: al massimo 3 suggerimenti che **indirizzano** (dove guardare, cosa confrontare, quale passo della mappa riguarda), ognuno più esplicito dei precedenti se l'utente insiste, ma **mai** la risposta; poi attendi. Una domanda di puro funzionamento (es. "cosa fa `useEffect`?") ha una risposta breve, purché non riveli la soluzione.
- se l'utente chiede esplicitamente la soluzione, rispondi con i blocchi **1. SOLUZIONE** (concetto e motivazione, con i numeri della mappa, non codice) e **2. RICHIESTA** "Vuoi aggiungerla tu al piano nella sala?".
- se l'utente incolla di nuovo il piano, ricomincia da LETTURA: è la versione aggiornata.
- non fare mai domande da interrogazione: le scelte si offrono come opzioni con lettera (A, B, C).

## LETTURA

- il testo copiato dalla sala ha in testa `PIANO`, `ID PIANO`, `TIPO`, `PROGETTO` (con la cartella), `ATTIVITÀ` se c'è, `MAPPA` e `MAPPE GIÀ FATTE`, poi le fasi `## 1. RICHIESTA`, `## 2. …` con i campi e le spunte `[x]` / `[ ]`.
- se il testo è vuoto o non ha `ID PIANO`, rispondi con il solo blocco **1. RICHIESTA**: "Apri il piano nella sala di controllo, premi «Copia per /piano» e incollalo qui." e fermati.
- il codice da leggere è quello della cartella in `PROGETTO`, anche se la sessione è aperta su un altro progetto.
- `TIPO` decide quali fasi esistono: Aggiunta, Modifica, Bug fix o Modifica minore. Rivedi solo le fasi presenti nel testo.
- se nella Richiesta manca un campo che non è segnato `(non scritto)` ma `(vuoto)`, non inventarlo: segnalalo in REVISIONE o, se serve per la mappa, in MAPPA.

## MAPPA

Solo se `MAPPA` è `dati`, `struttura` o `entrambi` e in `MAPPE GIÀ FATTE` manca il tipo richiesto (con `entrambi` servono tutte e due). Con `nessuna` o `non scelta` passa a REVISIONE.

- servono almeno l'obiettivo (o il comportamento atteso, o cosa cambiare) e il `Dove` della Richiesta: se mancano, rispondi con **1. RICHIESTA** "Compila Obiettivo e Dove nella Richiesta e reincollalo." e fermati.
- leggi il codice di `Dove` e di ciò che è collegato quanto basta per disegnare lo stato **attuale**, cioè prima della modifica.
- `dati`: leggi e applica le regole in `~/.claude/shared/diagramma-flusso.md` (riferimenti **D1, D2…**); ogni oggetto, lista o json nei `payload` deve essere completo. `struttura`: leggi e applica `~/.claude/shared/diagramma-pagina.md` (riferimenti **S1, S2…**). La chat della mappa segue `~/.claude/shared/chat-mappa.md`. Il `TITOLO` per il nome del file è il `PIANO`.
- la mappa descrive com'è adesso, senza proporre modifiche: il ragionamento sulla modifica lo fa l'utente nelle fasi dopo.
- **riepilogo**: nel JSON di ogni mappa aggiungi `overview`: `goal` = l'obiettivo (o comportamento atteso, o cosa cambiare), `problem` = il problema come l'ha scritto l'utente (solo per Bug fix), `todo` = "Compila nella sala le fasi dopo la Richiesta guardando questa mappa", `files` = tutti i file della mappa con il loro ruolo in poche parole.
- **indizi**: nel JSON di ogni mappa aggiungi `indizi` con 2 voci, che l'utente apre solo se vuole dal tasto 💡 della chat:
  - 1 · **zona**: `punti` con 2-5 riferimenti vicini dove va fatta la modifica o, per un Bug fix, dove nasce il bug.
  - 2 · **punto**: `punti` con un solo riferimento, quello preciso.
  - `testo`: una frase su **cosa osservare** lì, **mai** cosa cambiare, la causa o la soluzione, nemmeno di riflesso (niente "manca…", "è sbagliato…", "andrebbe…").
- **Bug fix**: il diagramma copre tutti i punti in cui può trovarsi il bug ed è **neutro**: ogni passo o elemento con lo stesso peso; niente `incoming: "lost"`; né `action`, né `short`, né `payloadName`, né `call`, né i testi (`physical`, `simple`, `does`, `purpose`, `receives`, `returns`, `explanation`), né `fields`, `badges` o `label` mettono in risalto il punto del bug. Gli `indizi` sono l'unica parte che porta verso il bug. Anche le NOTE sono neutre.
- dopo aver salvato ogni file, collegalo al piano con `node ~/.claude/sala-controllo/server.js --piani collega <ID PIANO> <dati|struttura> "<percorso del file>"`; se il comando dà errore, riportalo nel blocco MAPPA.
- rispondi con i blocchi:
  - **1. MAPPA**: una riga per file con davanti `DATI` o `STRUTTURA`, il percorso cliccabile e "collegata al piano: nella sala c'è «Apri mappa»".
  - **2. NOTE**: massimo 3 punti su com'è fatto adesso che servono a ragionare (es. un pezzo duplicato, un valore scritto a mano, un punto che usa lo stesso codice), con i numeri della mappa.
  - **3. RICHIESTA**: "Ricarica il piano nella sala, compila le fasi guardando la mappa e, quando vuoi la revisione, reincollalo con «Copia per /piano»."
- poi fermati e attendi.

## REVISIONE

- leggi il codice che serve per giudicare il piano: i file di `Dove`, quelli citati in Indagare e Progettare e chi li usa. Le mappe in `MAPPE GIÀ FATTE` sono il riferimento per i numeri D e S.
- per ogni fase presente, nello stesso ordine, una riga con:
  - `✅` regge: cosa c'è di buono, in breve.
  - `⚠️` incompleta: cosa manca (campo vuoto, spunta non data, risposta troppo vaga come "non va" o "sistemo il login").
  - `❌` ragionamento sbagliato: dove sbaglia e **dove guardare** per accorgersene (nomeFile:riga o numero della mappa), **mai** la correzione.
- controlla che le spunte siano credibili: una spunta data che il testo smentisce (es. "ho controllato chi altro usa quello che cambio" ma in Rischi manca un punto che lo usa) è `⚠️`, con dove guardare.
- la fase Lezione si rivede solo se è compilata; finché il codice non è fatto è "da scrivere alla fine" e non blocca il piano.
- rispondi con i blocchi:
  - **1. REVISIONE**: una riga per fase come sopra, con il nome della fase (eccezione al limite di 3 righe).
  - **2. DA SISTEMARE**: solo se esistono, le 3 cose più importanti da correggere, in ordine di importanza, ognuna con dove guardare.
  - **3. ATTENZIONE**: solo se esistono, al massimo 3 rischi concreti del piano (sicurezza, perdita di dati, regressioni, crash, altre schermate toccate), con dove guardare e **senza** proporre l'alternativa.
  - **4. RICHIESTA**:
    - con almeno un `⚠️` o `❌`: "Correggi nella sala e reincolla con «Copia per /piano»."
    - con tutto `✅`: "Il piano regge. A · scrivi tu il codice e poi lanci /revisione con MODALITÀ «prova io» · B · lo scrivo io seguendo il tuo piano. Scrivi la lettera."
- poi fermati e attendi:
  - `A`: rispondi con il solo blocco **1. RICHIESTA** "Quando hai finito lancia /revisione: per COSA DOVREBBE FARE puoi usare la tua Richiesta." e fermati.
  - `B`: passa a IMPLEMENTAZIONE.

## IMPLEMENTAZIONE

- implementa **solo** quello che c'è nella fase Progettare (La modifica a parole, nei File e funzioni che tocchi), nel rispetto di quello che la Richiesta dice che non deve cambiare. Per una Modifica minore, solo `Cosa cambiare` in `Dove`, con `Valore nuovo` se c'è.
- se per completarla serve toccare altro (un file, una funzione o un comportamento non previsti dal piano), fermati prima di modificarlo, spiega cosa serve e perché, e attendi l'ok.
- i dettagli non indicati (nomi, collocazione, sintassi, gestione errori) decidili tu seguendo le convenzioni del progetto.
- niente modifiche "già che c'ero": quello che noti fuori dal piano lo segnali in VERIFICA, non lo applichi.

## VERIFICA

- rispondi con i blocchi:
  - **1. FATTO**: per ogni punto di Progettare `✅` fatto o `❌` non fatto o parziale (con il motivo), nomeFile (cliccabile) e cosa è cambiato.
  - **2. CRITERI**: i criteri della fase Verifica del piano, uno per riga: `✅` verificato da te (con come) oppure `🧪` da provare tu, con i passi concreti nell'app; per un Bug fix, i passi per riprodurlo e cosa deve succedere adesso.
  - **3. DA CONTROLLARE**: i dettagli che hai deciso tu, con nomeFile e numero della mappa.
  - **4. SEGNALAZIONI**: solo se esistono, cose notate fuori dal piano.
  - **5. RICHIESTA**: "Prova e dimmi se va bene o cosa cambiare; quando funziona, compila la fase Lezione nella sala."
- se l'utente chiede altre modifiche, prima vanno nel piano: "Aggiungile in Progettare nella sala e reincolla il piano."

## SPIEGAZIONE FINALE

- rispondi con i blocchi:
  - **1. COSA È STATO FATTO**: cosa e perché è stato implementato, gli effetti sul codice e il risultato ottenuto, in modo tecnico e schematico.
  - **2. GLOSSARIO**: i termini tecnici nuovi incontrati durante la richiesta, una riga ciascuno.
