# COMANDI CONSOLE WEB

> Riferimento: **Chrome DevTools** (uguale su Edge, Brave, Arc e simile su Firefox).
> Le scorciatoie sono scritte **Windows / Mac**.
> I comandi JavaScript si scrivono nella scheda **Console** e si lanciano con `Invio` (`Shift+Invio` per andare a capo).
> ⚠️ Non incollare mai in console codice ricevuto da sconosciuti: può rubare account e dati.

**INDICE**
[Aprire i DevTools](#aprire-i-devtools) · [Pannelli](#pannelli) · [Scorciatoie DevTools](#scorciatoie-devtools) · [Console log](#console-log) · [Misurare](#misurare) · [Utility della console](#utility-della-console) · [Elementi e DOM](#elementi-e-dom) · [Eventi](#eventi) · [Storage](#storage) · [Cookie](#cookie) · [Cache e service worker](#cache-e-service-worker) · [Chiamate di rete](#chiamate-di-rete) · [Pannello Network](#pannello-network) · [Info su pagina e browser](#info-su-pagina-e-browser) · [Simulare dispositivi](#simulare-dispositivi) · [Debug CSS](#debug-css) · [Debug JavaScript](#debug-javascript) · [Prestazioni](#prestazioni) · [React](#react) · [React Native DevTools](#react-native-devtools) · [Altri browser](#altri-browser) · [Problemi comuni](#problemi-comuni)

## APRIRE I DEVTOOLS

| Azione | Windows | Mac |
|---|---|---|
| apri / chiudi DevTools | `F12` o `Ctrl+Shift+I` | `Cmd+Option+I` |
| apri direttamente la Console | `Ctrl+Shift+J` | `Cmd+Option+J` |
| ispeziona un elemento | `Ctrl+Shift+C` | `Cmd+Shift+C` |
| ispeziona col mouse | tasto destro → **Ispeziona** | uguale |
| cambia posizione (lato, sotto, finestra) | `Ctrl+Shift+D` | `Cmd+Shift+D` |

## PANNELLI

| Pannello | A cosa serve |
|---|---|
| **Elements** | HTML e CSS della pagina, modificabili dal vivo |
| **Console** | log, errori, comandi JavaScript |
| **Sources** | file JS, breakpoint, debug passo passo |
| **Network** | tutte le chiamate (API, immagini, file) con tempi e risposte |
| **Application** | localStorage, sessionStorage, cookie, IndexedDB, cache, service worker |
| **Performance** | registra cosa rallenta la pagina |
| **Memory** | consumo di memoria, memory leak |
| **Lighthouse** | voto su prestazioni, accessibilità, SEO |
| **Recorder** | registra e riproduce azioni sulla pagina |

> Pannelli nascosti (Rendering, Sensors, Coverage, Animations...): menu `⋮` → **More tools**, oppure `Ctrl+Shift+P` e scrivi il nome

## SCORCIATOIE DEVTOOLS

| Azione | Windows | Mac |
|---|---|---|
| menu comandi dei DevTools (fa tutto) | `Ctrl+Shift+P` | `Cmd+Shift+P` |
| apri un file del sito | `Ctrl+P` | `Cmd+P` |
| cerca in tutti i file | `Ctrl+Shift+F` | `Cmd+Option+F` |
| modalità dispositivo (mobile) | `Ctrl+Shift+M` | `Cmd+Shift+M` |
| pulisci la console | `Ctrl+L` | `Cmd+K` |
| mostra / nascondi console sotto gli altri pannelli | `Esc` | `Esc` |
| pannello successivo / precedente | `Ctrl+]` / `Ctrl+[` | `Cmd+]` / `Cmd+[` |
| ricarica la pagina | `F5` o `Ctrl+R` | `Cmd+R` |
| ricarica ignorando la cache | `Ctrl+Shift+R` | `Cmd+Shift+R` |
| svuota cache e ricarica | DevTools aperti → tasto destro su ↻ → **Svuota la cache e ricarica** | uguale |
| nascondi elemento selezionato (Elements) | `H` | `H` |
| modifica elemento come HTML (Elements) | `F2` | `F2` |
| comando precedente (Console) | `↑` | `↑` |
| accetta suggerimento (Console) | `Tab` o `→` | `Tab` o `→` |

**COMANDI UTILI DEL MENU (`Ctrl+Shift+P`)**

| Comando | Cosa fa |
|---|---|
| `Capture full size screenshot` | screenshot di tutta la pagina, anche la parte da scorrere |
| `Capture node screenshot` | screenshot solo dell'elemento selezionato |
| `Disable JavaScript` | vedi la pagina senza JS |
| `Show Rendering` | emula tema scuro, stampa, problemi di vista |
| `Show Sensors` | cambia posizione GPS, orientamento, touch |
| `Show Coverage` | CSS e JS caricati ma non usati |
| `Emulate a focused page` | tiene aperti menu e tendine mentre li ispezioni |
| `Dock to bottom` / `Dock to right` | posizione dei DevTools |
| `Switch to dark theme` | DevTools scuri |

## CONSOLE LOG

**MESSAGGIO NORMALE**

```js
console.log("testo", variabile)
```

**MOSTRA NOME E VALORE INSIEME (trucco)**

```js
console.log({ utente, token })
```

**AVVISO (giallo) / ERRORE (rosso) / INFO**

```js
console.warn("attenzione")
console.error("errore")
console.info("info")
```

**MOSTRA UN ARRAY O OGGETTO COME TABELLA**

```js
console.table(utenti)
console.table(utenti, ["nome", "email"])
```

**MOSTRA UN OGGETTO ESPANDIBILE**

```js
console.dir(oggetto)
```

**RAGGRUPPA I LOG**

```js
console.group("Login")
console.log("passo 1")
console.log("passo 2")
console.groupEnd()
```

`console.groupCollapsed()` per partire chiuso

**LOG SOLO SE UNA CONDIZIONE È FALSA**

```js
console.assert(utente !== null, "utente mancante")
```

**CHI HA CHIAMATO QUESTA FUNZIONE**

```js
console.trace()
```

**CONTA QUANTE VOLTE PASSA DI QUI (es. render)**

```js
console.count("render")
console.countReset("render")
```

**LOG COLORATO**

```js
console.log("%cOK", "color: white; background: green; padding: 2px 6px")
```

**STAMPA UN JSON LEGGIBILE**

```js
console.log(JSON.stringify(oggetto, null, 2))
```

**PULISCI LA CONSOLE**

```js
console.clear()
```

| Filtri della console | |
|---|---|
| livelli (in alto) | mostra solo Errors, Warnings, Info, Verbose |
| casella **Filter** | mostra solo i log che contengono un testo · `-testo` per escluderlo |
| `⚙` → **Preserve log** | non cancella i log quando la pagina si ricarica |
| barra laterale | log divisi per file |

## MISURARE

**QUANTO CI METTE UN PEZZO DI CODICE**

```js
console.time("caricamento")
// codice
console.timeEnd("caricamento")
```

**TEMPO PARZIALE SENZA FERMARE IL TIMER**

```js
console.timeLog("caricamento")
```

**TEMPO PRECISO IN MILLISECONDI**

```js
const inizio = performance.now()
// codice
console.log(performance.now() - inizio, "ms")
```

**QUANTO CI HA MESSO LA PAGINA A CARICARSI**

```js
performance.getEntriesByType("navigation")[0].duration
```

## UTILITY DELLA CONSOLE

> Funzionano **solo scrivendole nella console**, non nel codice dell'app.

| Comando | Cosa fa |
|---|---|
| `$0` | elemento selezionato ora in Elements (`$1` quello prima...) |
| `$_` | risultato dell'ultimo comando |
| `$("selettore")` | primo elemento (come `document.querySelector`) |
| `$$("selettore")` | tutti gli elementi, come array vero |
| `$x("//xpath")` | elementi tramite XPath |
| `copy(valore)` | copia negli appunti (oggetti già in JSON) |
| `inspect(elemento)` | apre l'elemento in Elements |
| `keys(oggetto)` / `values(oggetto)` | chiavi / valori |
| `getEventListeners(elemento)` | eventi collegati all'elemento |
| `monitorEvents(elemento, "click")` | stampa ogni evento che riceve |
| `unmonitorEvents(elemento)` | smette di stamparli |
| `debug(funzione)` | si ferma ogni volta che la funzione viene chiamata |
| `undebug(funzione)` | toglie il blocco |
| `monitor(funzione)` | stampa ogni chiamata con gli argomenti |
| `queryObjects(Classe)` | tutti gli oggetti creati da quella classe |
| `clear()` | pulisce la console |

**COPIA UN OGGETTO DELLA CONSOLE**

Tasto destro sull'oggetto → **Copy object** · oppure → **Store as global variable** (diventa `temp1`)

**COPIA IL RISULTATO DI UNA CHIAMATA**

```js
copy(await fetch("/api/utenti").then(r => r.json()))
```

**LIVE EXPRESSION (valore aggiornato in tempo reale)**

Icona 👁 in alto nella console → scrivi es. `document.activeElement` o `window.scrollY`

## ELEMENTI E DOM

**QUANTI ELEMENTI CI SONO**

```js
$$("button").length
```

**TESTO DI TUTTI GLI ELEMENTI**

```js
$$("h2").map(e => e.textContent)
```

**TUTTI I LINK DELLA PAGINA**

```js
$$("a").map(a => a.href)
```

**TUTTE LE IMMAGINI SENZA TESTO ALTERNATIVO (accessibilità)**

```js
$$("img:not([alt])")
```

**QUALE ELEMENTO HA IL FOCUS**

```js
document.activeElement
```

**RENDI TUTTA LA PAGINA MODIFICABILE (test testi lunghi)**

```js
document.designMode = "on"
```

`"off"` per tornare normale

**NASCONDI / RIMUOVI UN ELEMENTO**

```js
$0.style.display = "none"
$0.remove()
```

**SCORRI FINO A UN ELEMENTO**

```js
$("#id").scrollIntoView({ behavior: "smooth" })
```

**POSIZIONE E DIMENSIONI DI UN ELEMENTO**

```js
$0.getBoundingClientRect()
```

**STILE CALCOLATO DI UN ELEMENTO**

```js
getComputedStyle($0).fontSize
```

**CLICCA UN ELEMENTO DA CONSOLE**

```js
$("button[type=submit]").click()
```

**RIEMPI UN CAMPO**

```js
$("input[name=email]").value = "test@esempio.it"
```

## EVENTI

**VEDI GLI EVENTI DI UN ELEMENTO**

```js
getEventListeners($0)
```

oppure Elements → scheda **Event Listeners** a destra

**STAMPA I CLICK DI TUTTA LA PAGINA**

```js
monitorEvents(document.body, "click")
```

**STAMPA TUTTI I TASTI PREMUTI**

```js
monitorEvents(window, "key")
```

**FERMATI QUANDO SUCCEDE UN EVENTO**

Sources → a destra **Event Listener Breakpoints** → spunta es. **Mouse → click**

**LANCIA UN EVENTO A MANO**

```js
window.dispatchEvent(new Event("resize"))
```

## STORAGE

> Si vedono e modificano anche da **Application** → **Storage**.

**LOCALSTORAGE: LEGGI TUTTO**

```js
console.table(Object.entries(localStorage))
```

**LEGGI UNA CHIAVE**

```js
localStorage.getItem("chiave")
```

**LEGGI UN VALORE SALVATO COME JSON**

```js
JSON.parse(localStorage.getItem("chiave"))
```

**SCRIVI UNA CHIAVE**

```js
localStorage.setItem("chiave", "valore")
localStorage.setItem("utente", JSON.stringify({ nome: "Luigi" }))
```

**CANCELLA UNA CHIAVE / TUTTO**

```js
localStorage.removeItem("chiave")
localStorage.clear()
```

**SESSIONSTORAGE (si cancella chiudendo la scheda)**

```js
sessionStorage.getItem("chiave")
sessionStorage.clear()
```

**QUANTO SPAZIO STA USANDO IL SITO**

```js
await navigator.storage.estimate()
```

**LISTA DATABASE INDEXEDDB (usati anche da Firebase)**

```js
await indexedDB.databases()
```

**⚠️ CANCELLA TUTTI I DATI DEL SITO (come un utente nuovo)**

Application → **Storage** → **Clear site data**

| Dove salvare | Dura | Limite |
|---|---|---|
| `localStorage` | per sempre | circa 5 MB, solo testo |
| `sessionStorage` | finché la scheda è aperta | circa 5 MB, solo testo |
| cookie | fino alla scadenza | circa 4 KB, inviati al server |
| IndexedDB | per sempre | molto spazio, oggetti e file |

## COOKIE

**LEGGI I COOKIE (quelli non HttpOnly)**

```js
document.cookie
```

**COOKIE COME TABELLA**

```js
console.table(document.cookie.split("; ").map(c => c.split("=")))
```

**CREA UN COOKIE**

```js
document.cookie = "nome=valore; path=/; max-age=3600"
```

**CANCELLA UN COOKIE**

```js
document.cookie = "nome=; path=/; max-age=0"
```

> I cookie `HttpOnly` (spesso quelli di login) non si vedono da JS: sono solo in Application → **Cookies**

## CACHE E SERVICE WORKER

**LISTA SERVICE WORKER ATTIVI**

```js
await navigator.serviceWorker.getRegistrations()
```

**⚠️ DISATTIVA TUTTI I SERVICE WORKER (sito che mostra una versione vecchia)**

```js
(await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister())
```

**LISTA CACHE**

```js
await caches.keys()
```

**⚠️ CANCELLA TUTTE LE CACHE**

```js
(await caches.keys()).forEach(k => caches.delete(k))
```

**DA PANNELLO**

Application → **Service workers** → spunta **Update on reload** durante lo sviluppo

## CHIAMATE DI RETE

**CHIAMATA GET**

```js
await fetch("/api/utenti").then(r => r.json())
```

**CHIAMATA POST CON JSON**

```js
await fetch("/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "test@esempio.it", password: "..." })
}).then(r => r.json())
```

**CHIAMATA CON TOKEN**

```js
await fetch("/api/profilo", {
  headers: { Authorization: "Bearer " + localStorage.getItem("token") }
}).then(r => r.json())
```

**VEDI STATO E HEADER DELLA RISPOSTA**

```js
const r = await fetch("/api/utenti")
r.status
Object.fromEntries(r.headers)
```

**LEGGI IL CONTENUTO DI UN TOKEN JWT**

```js
JSON.parse(atob(token.split(".")[1]))
```

> `exp` è la scadenza in secondi: `new Date(exp * 1000)` per leggerla

## PANNELLO NETWORK

| Opzione | Cosa fa |
|---|---|
| **Preserve log** | non cancella le chiamate quando la pagina cambia |
| **Disable cache** | ricarica sempre tutto (solo con DevTools aperti) |
| **No throttling → Slow 4G / 3G** | simula una connessione lenta |
| **Offline** | simula assenza di rete |
| filtro **Fetch/XHR** | mostra solo le chiamate alle API |
| casella **Filter** | cerca per nome · `status-code:500` · `-url:analytics` |
| icona 🔍 | cerca un testo dentro tutte le risposte |

**DETTAGLI DI UNA CHIAMATA** → clic sulla riga

| Scheda | |
|---|---|
| **Headers** | URL, metodo, stato, header inviati e ricevuti |
| **Payload** | dati inviati |
| **Preview** | risposta formattata |
| **Response** | risposta grezza |
| **Timing** | quanto ha aspettato e perché |
| **Initiator** | quale codice ha fatto partire la chiamata |

**RIPETI O COPIA UNA CHIAMATA** → tasto destro sulla riga

| Voce | |
|---|---|
| **Replay XHR** | rilancia la chiamata |
| **Copy → Copy as fetch** | codice da incollare in console o nell'app |
| **Copy → Copy as cURL** | comando da incollare nel terminale |
| **Copy → Copy response** | copia la risposta |
| **Override content** | sostituisci la risposta con una tua (test senza backend) |
| **Block request URL** | simula una chiamata che fallisce |

| Codici di stato | |
|---|---|
| `200` / `201` / `204` | ok / creato / ok senza contenuto |
| `301` / `302` / `304` | reindirizzato / reindirizzato / preso dalla cache |
| `400` | richiesta sbagliata (dati errati) |
| `401` | non autenticato (token mancante o scaduto) |
| `403` | autenticato ma senza permesso |
| `404` | non trovato |
| `409` | conflitto (es. dato già esistente) |
| `422` | dati non validi |
| `429` | troppe richieste |
| `500` / `502` / `503` | errore del server / gateway / server non disponibile |
| `(failed)` / `CORS error` | bloccata dal browser o server irraggiungibile |

## INFO SU PAGINA E BROWSER

| Comando | Cosa restituisce |
|---|---|
| `location.href` | URL completo |
| `location.pathname` | percorso (es. `/profilo`) |
| `new URLSearchParams(location.search).get("id")` | parametro dell'URL |
| `document.title` | titolo della pagina |
| `document.referrer` | pagina di provenienza |
| `navigator.userAgent` | browser e sistema |
| `navigator.language` | lingua del browser |
| `navigator.onLine` | connesso a internet |
| `window.innerWidth` / `innerHeight` | dimensioni della finestra |
| `screen.width` / `screen.height` | dimensioni dello schermo |
| `devicePixelRatio` | densità (2 = schermo Retina) |
| `matchMedia("(prefers-color-scheme: dark)").matches` | tema scuro attivo |
| `matchMedia("(max-width: 768px)").matches` | una media query è attiva |
| `Intl.DateTimeFormat().resolvedOptions().timeZone` | fuso orario |
| `document.readyState` | stato di caricamento |
| `document.querySelector("meta[name=viewport]")` | meta viewport |

**NAVIGA DA CONSOLE**

```js
location.href = "/login"
history.back()
location.reload()
```

## SIMULARE DISPOSITIVI

**MODALITÀ DISPOSITIVO** → `Ctrl+Shift+M` / `Cmd+Shift+M`

| Opzione (barra in alto) | |
|---|---|
| menu dispositivi | iPhone, Pixel, iPad... · **Edit** per aggiungerne altri |
| **Responsive** | trascina i bordi per provare ogni larghezza |
| ↻ ruota | orizzontale / verticale |
| `⋮` → **Show media queries** | barre colorate con i breakpoint del CSS |
| `⋮` → **Show rulers** | righelli in pixel |
| `⋮` → **Capture screenshot** | screenshot con le dimensioni del dispositivo |
| throttling | rete lenta / CPU lenta |

**SIMULA TEMA SCURO / STAMPA** → `Ctrl+Shift+P` → `Show Rendering` → **Emulate CSS media feature**

**SIMULA POSIZIONE GPS** → `Ctrl+Shift+P` → `Show Sensors` → **Location**

**SIMULA LINGUA O FUSO ORARIO** → `Show Sensors` → **Location** → Timezone / Locale

**PROVA IL SITO SUL TELEFONO VERO (Android)**

Collega il telefono con debug USB → su Chrome del PC apri `chrome://inspect` → **inspect** sulla pagina

**PROVA IL SITO SULL'IPHONE VERO**

iPhone: Impostazioni → Safari → Avanzate → **Web Inspector** · Mac: Safari → menu **Sviluppo** → nome dell'iPhone

## DEBUG CSS

**FORZA LO STATO :hover / :focus / :active**

Elements → seleziona l'elemento → `:hov` a destra → spunta lo stato

**CONTORNA TUTTI GLI ELEMENTI (vedi margini e sovrapposizioni)**

```js
$$("*").forEach(e => e.style.outline = "1px solid red")
```

**TROVA L'ELEMENTO CHE CREA LO SCROLL ORIZZONTALE**

```js
$$("*").filter(e => e.getBoundingClientRect().right > document.documentElement.clientWidth)
```

**PROVA UN CSS AL VOLO**

Elements → **Styles** → `+` (nuova regola) · oppure clicca su un valore e usa `↑` / `↓` per cambiarlo

**MODIFICHE CSS FATTE NEI DEVTOOLS** → `Ctrl+Shift+P` → `Show Changes` (per copiarle nel codice)

**GRIGLIA E FLEX** → Elements → clic sul badge `grid` / `flex` accanto all'elemento

**CONTRASTO DEI COLORI (accessibilità)** → clic sul quadratino del colore in **Styles** → **Contrast ratio**

**PALETTE DI COLORI USATI NELLA PAGINA** → Elements → **Styles** → clic su un colore → in basso **Page colors**

**CSS NON USATO** → `Ctrl+Shift+P` → `Show Coverage` → ↻

## DEBUG JAVASCRIPT

**FERMA IL CODICE IN UN PUNTO (nel codice dell'app)**

```js
debugger
```

Si ferma solo con i DevTools aperti · **ricordati di toglierlo**

**BREAKPOINT DAL PANNELLO**

Sources → `Ctrl+P` → apri il file → clic sul numero di riga

| Tipo di breakpoint (tasto destro sul numero di riga) | |
|---|---|
| **Add conditional breakpoint** | si ferma solo se una condizione è vera (es. `id === 5`) |
| **Add logpoint** | stampa un log senza fermarsi e senza toccare il codice |
| **Never pause here** | ignora questo punto |

| Altri breakpoint (Sources, colonna destra) | |
|---|---|
| **XHR/fetch Breakpoints** | si ferma quando parte una chiamata a un URL |
| **DOM Breakpoints** | si ferma quando un elemento cambia (Elements → tasto destro → **Break on**) |
| **Event Listener Breakpoints** | si ferma a un evento (click, keydown...) |
| **Pause on exceptions** | si ferma sugli errori |

| Azione quando è fermo | Windows | Mac |
|---|---|---|
| continua | `F8` | `F8` |
| passo successivo | `F10` | `F10` |
| entra nella funzione | `F11` | `F11` |
| esci dalla funzione | `Shift+F11` | `Shift+F11` |
| attiva / disattiva tutti i breakpoint | `Ctrl+F8` | `Cmd+F8` |

> Quando è fermo, la console usa le variabili di quel punto: scrivile per leggerne il valore

**IGNORA I FILE DELLE LIBRERIE NEL DEBUG**

Tasto destro su un file di `node_modules` → **Add script to ignore list**

**CATTURA TUTTI GLI ERRORI NON GESTITI**

```js
window.addEventListener("error", e => console.log("ERRORE", e.message))
window.addEventListener("unhandledrejection", e => console.log("PROMISE", e.reason))
```

## PRESTAZIONI

**VOTO COMPLETO DEL SITO**

Lighthouse → scegli **Mobile** → **Analyze page load** (meglio in finestra in incognito)

**REGISTRA COSA RALLENTA**

Performance → ⏺ → fai l'azione → ⏹ · i blocchi rossi sono le operazioni lente

**MOSTRA GLI FPS E LE ZONE RIDISEGNATE**

`Ctrl+Shift+P` → `Show Rendering` → spunta **Frame Rendering Stats** e **Paint flashing**

**MEMORIA USATA DALLA PAGINA (solo Chrome)**

```js
(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1) + " MB"
```

**QUANTI ELEMENTI HA LA PAGINA (sopra 1500 inizia a essere pesante)**

```js
document.querySelectorAll("*").length
```

**FILE PIÙ PESANTI CARICATI**

```js
console.table(performance.getEntriesByType("resource").map(r => ({ file: r.name.split("/").pop(), kb: Math.round(r.transferSize / 1024) })).sort((a, b) => b.kb - a.kb).slice(0, 10))
```

| Metriche Web Vitals | Buono |
|---|---|
| **LCP** (tempo per il contenuto principale) | sotto 2,5 s |
| **INP** (reattività ai click) | sotto 200 ms |
| **CLS** (spostamenti improvvisi della pagina) | sotto 0,1 |

## REACT

> Serve l'estensione **React Developer Tools** (Chrome Web Store). Aggiunge i pannelli **Components** e **Profiler**.

| Pannello | A cosa serve |
|---|---|
| **Components** | albero dei componenti con props, state e hook, modificabili dal vivo |
| **Profiler** | registra i render e mostra quali componenti sono lenti |

**COMPONENTE SELEZIONATO IN CONSOLE**

```js
$r
```

`$r.props` · `$r.state` (solo componenti a classe)

**TROVA IL COMPONENTE DI UN ELEMENTO**

Components → icona 🎯 → clicca sulla pagina

**VEDI PERCHÉ UN COMPONENTE SI RIDISEGNA**

Components → `⚙` → **Profiler** → spunta **Record why each component rendered**

**EVIDENZIA I COMPONENTI CHE SI RIDISEGNANO**

Components → `⚙` → **General** → spunta **Highlight updates when components render**

**VAI AL CODICE DEL COMPONENTE**

Components → seleziona → icona `</>` in alto a destra

**CONTA I RENDER NEL CODICE**

```js
console.count("render NomeComponente")
```

> In sviluppo con `StrictMode` i componenti vengono renderizzati due volte: è normale

## REACT NATIVE DEVTOOLS

> Si apre premendo `j` nel terminale di Metro (oppure Dev Menu → **Open DevTools**). Usa lo stesso motore di Chrome DevTools.

| Pannello | A cosa serve |
|---|---|
| **Console** | `console.log` dell'app, stesse funzioni `console.*` del web |
| **Sources** | breakpoint e `debugger` |
| **Components** | albero dei componenti (come React DevTools) |
| **Profiler** | render lenti |
| **Memory** | memory leak |

> Non ci sono DOM, `localStorage`, `$`, `$$`, `document`: l'app non è una pagina web
> Le chiamate di rete si vedono meglio con un proxy (Proxyman, Charles) o con il pannello **Network** se la versione di React Native lo include

## ALTRI BROWSER

| Browser | Come aprire gli strumenti |
|---|---|
| Edge / Brave / Arc | come Chrome |
| Firefox | `F12` / `Cmd+Option+I` · stessi pannelli con nomi simili (Inspector = Elements) |
| Safari (Mac) | Safari → Impostazioni → Avanzate → spunta **Mostra funzioni per sviluppatori web** · poi `Cmd+Option+I` |

> Prova sempre anche **Safari**: su iPhone tutti i browser usano il suo motore

## PROBLEMI COMUNI

| Problema | Soluzione |
|---|---|
| la console non permette di incollare | scrivi `allow pasting` e premi Invio (protezione di Chrome) |
| le modifiche non si vedono | `Ctrl+Shift+R` · Network → **Disable cache** · controlla i service worker |
| il sito mostra sempre una versione vecchia | disattiva i service worker e cancella le cache (vedi sopra) |
| `CORS error` | è il server che deve permettere la chiamata: non si risolve dal frontend (in sviluppo usa un proxy) |
| `401 Unauthorized` | token mancante o scaduto: leggilo con il trucco JWT |
| `$` non funziona nel codice | `$` e `$$` esistono solo in console |
| `await` dà errore in console | in Chrome funziona direttamente · in altri browser usa `.then()` |
| i log spariscono al cambio pagina | Console → `⚙` → **Preserve log** |
| `Uncaught (in promise)` | una `fetch` o funzione `async` è fallita senza `try/catch` |
| il codice si ferma da solo | c'è un `debugger` dimenticato o **Pause on exceptions** attivo |
| i file sono illeggibili (tutto su una riga) | clicca `{}` in basso in Sources per formattarli |
| il breakpoint non si attiva | il file è in **ignore list** o i breakpoint sono disattivati (`Ctrl+F8`) |
| React DevTools non compare | la pagina non usa React in sviluppo · riapri i DevTools dopo aver ricaricato |
| layout diverso su iPhone | prova con Safari e `Web Inspector` sull'iPhone vero |
