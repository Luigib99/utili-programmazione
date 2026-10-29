# COMANDI VS CODE

> Le scorciatoie sono scritte **Windows / Mac**. Su Mac `Ctrl` diventa quasi sempre `Cmd` e `Alt` diventa `Option`.
> Scorciatoie come `Ctrl+K Ctrl+S` si fanno in due tempi: prima `Ctrl+K`, poi `Ctrl+S`.
> Se non ricordi una scorciatoia: `Ctrl+Shift+P` e scrivi cosa vuoi fare.

**INDICE**
[Le essenziali](#le-essenziali) · [Pannelli](#pannelli) · [File e schede](#file-e-schede) · [Modificare righe](#modificare-righe) · [Selezione e cursori multipli](#selezione-e-cursori-multipli) · [Muoversi nel codice](#muoversi-nel-codice) · [Cercare e sostituire](#cercare-e-sostituire) · [Codice e suggerimenti](#codice-e-suggerimenti) · [Terminale](#terminale) · [Git](#git) · [Debug](#debug) · [Markdown](#markdown) · [Claude Code](#claude-code) · [Comandi utili della palette](#comandi-utili-della-palette) · [Comando code da terminale](#comando-code-da-terminale) · [Impostazioni consigliate](#impostazioni-consigliate) · [Estensioni utili](#estensioni-utili) · [Nuovo PC](#nuovo-pc) · [Problemi comuni](#problemi-comuni)

## LE ESSENZIALI

| Azione | Windows | Mac |
|---|---|---|
| palette dei comandi (fa tutto) | `Ctrl+Shift+P` | `Cmd+Shift+P` |
| apri un file per nome | `Ctrl+P` | `Cmd+P` |
| terminale | ``Ctrl+` `` | ``Ctrl+` `` |
| cerca in tutto il progetto | `Ctrl+Shift+F` | `Cmd+Shift+F` |
| commenta la riga | `Ctrl+/` | `Cmd+/` |
| formatta il documento | `Shift+Alt+F` | `Shift+Option+F` |
| seleziona la prossima uguale | `Ctrl+D` | `Cmd+D` |
| sposta la riga | `Alt+↑` / `Alt+↓` | `Option+↑` / `Option+↓` |
| vai alla definizione | `F12` | `F12` |
| rinomina ovunque | `F2` | `F2` |
| correzione rapida (lampadina) | `Ctrl+.` | `Cmd+.` |
| impostazioni | `Ctrl+,` | `Cmd+,` |

## PANNELLI

| Azione | Windows | Mac |
|---|---|---|
| mostra / nascondi barra laterale | `Ctrl+B` | `Cmd+B` |
| esplora file | `Ctrl+Shift+E` | `Cmd+Shift+E` |
| ricerca | `Ctrl+Shift+F` | `Cmd+Shift+F` |
| controllo sorgente (Git) | `Ctrl+Shift+G` | `Ctrl+Shift+G` |
| debug | `Ctrl+Shift+D` | `Cmd+Shift+D` |
| estensioni | `Ctrl+Shift+X` | `Cmd+Shift+X` |
| mostra / nascondi pannello in basso | `Ctrl+J` | `Cmd+J` |
| problemi (errori e warning) | `Ctrl+Shift+M` | `Cmd+Shift+M` |
| output | `Ctrl+Shift+U` | `Cmd+Shift+U` |
| modalità zen (solo codice) | `Ctrl+K Z` | `Cmd+K Z` |
| schermo intero | `F11` | `Ctrl+Cmd+F` |
| ingrandisci / rimpicciolisci | `Ctrl+=` / `Ctrl+-` | `Cmd+=` / `Cmd+-` |
| nuova finestra | `Ctrl+Shift+N` | `Cmd+Shift+N` |
| chiudi finestra | `Ctrl+Shift+W` | `Cmd+Shift+W` |
| lista scorciatoie | `Ctrl+K Ctrl+S` | `Cmd+K Cmd+S` |

## FILE E SCHEDE

| Azione | Windows | Mac |
|---|---|---|
| nuovo file | `Ctrl+N` | `Cmd+N` |
| apri file per nome | `Ctrl+P` | `Cmd+P` |
| salva | `Ctrl+S` | `Cmd+S` |
| salva con nome | `Ctrl+Shift+S` | `Cmd+Shift+S` |
| salva tutto | `Ctrl+K S` | `Cmd+Option+S` |
| chiudi scheda | `Ctrl+W` | `Cmd+W` |
| chiudi tutte le schede | `Ctrl+K Ctrl+W` | `Cmd+K Cmd+W` |
| riapri scheda chiusa | `Ctrl+Shift+T` | `Cmd+Shift+T` |
| scheda successiva / precedente | `Ctrl+PagGiù` / `Ctrl+PagSu` | `Cmd+Option+→` / `Cmd+Option+←` |
| ultime schede usate | `Ctrl+Tab` | `Ctrl+Tab` |
| apri la scheda numero N | `Alt+1…9` | `Ctrl+1…9` |
| dividi l'editor | `Ctrl+\` | `Cmd+\` |
| vai al gruppo 1 / 2 / 3 | `Ctrl+1` / `Ctrl+2` / `Ctrl+3` | `Cmd+1` / `Cmd+2` / `Cmd+3` |
| fissa la scheda | `Ctrl+K Shift+Invio` | `Cmd+K Shift+Invio` |
| mostra il file in Esplora risorse / Finder | `Shift+Alt+R` | `Cmd+Option+R` |
| copia il percorso del file | `Shift+Alt+C` | `Cmd+Option+C` |

> Clic singolo su un file = scheda "anteprima" (in corsivo, viene sostituita) · doppio clic = scheda fissa

## MODIFICARE RIGHE

| Azione | Windows | Mac |
|---|---|---|
| taglia la riga intera (senza selezionare) | `Ctrl+X` | `Cmd+X` |
| copia la riga intera (senza selezionare) | `Ctrl+C` | `Cmd+C` |
| sposta la riga su / giù | `Alt+↑` / `Alt+↓` | `Option+↑` / `Option+↓` |
| duplica la riga su / giù | `Shift+Alt+↑` / `Shift+Alt+↓` | `Shift+Option+↑` / `Shift+Option+↓` |
| elimina la riga | `Ctrl+Shift+K` | `Cmd+Shift+K` |
| nuova riga sotto (da metà riga) | `Ctrl+Invio` | `Cmd+Invio` |
| nuova riga sopra | `Ctrl+Shift+Invio` | `Cmd+Shift+Invio` |
| aumenta / riduci rientro | `Ctrl+]` / `Ctrl+[` | `Cmd+]` / `Cmd+[` |
| commenta la riga | `Ctrl+/` | `Cmd+/` |
| commento a blocco | `Shift+Alt+A` | `Shift+Option+A` |
| annulla / ripeti | `Ctrl+Z` / `Ctrl+Y` | `Cmd+Z` / `Cmd+Shift+Z` |
| unisci con la riga sotto | palette → `Join Lines` | `Ctrl+J` |
| a capo automatico on/off | `Alt+Z` | `Option+Z` |
| elimina la parola precedente | `Ctrl+Backspace` | `Option+Backspace` |

## SELEZIONE E CURSORI MULTIPLI

| Azione | Windows | Mac |
|---|---|---|
| seleziona la riga | `Ctrl+L` | `Cmd+L` |
| seleziona la prossima occorrenza | `Ctrl+D` | `Cmd+D` |
| salta questa occorrenza | `Ctrl+K Ctrl+D` | `Cmd+K Cmd+D` |
| seleziona tutte le occorrenze | `Ctrl+Shift+L` | `Cmd+Shift+L` |
| cursore aggiuntivo col mouse | `Alt+clic` | `Option+clic` |
| cursore sopra / sotto | `Ctrl+Alt+↑` / `Ctrl+Alt+↓` | `Cmd+Option+↑` / `Cmd+Option+↓` |
| cursore a fine di ogni riga selezionata | `Shift+Alt+I` | `Shift+Option+I` |
| selezione a colonna | `Shift+Alt+trascina` | `Shift+Option+trascina` |
| allarga / restringi selezione | `Shift+Alt+→` / `Shift+Alt+←` | `Ctrl+Shift+Cmd+→` / `Ctrl+Shift+Cmd+←` |
| annulla l'ultimo cursore | `Ctrl+U` | `Cmd+U` |
| torna a un solo cursore | `Esc` | `Esc` |

> Esempio: rinominare `nome` in 5 punti → metti il cursore su `nome` · `Ctrl+D` 5 volte · scrivi il nuovo nome

## MUOVERSI NEL CODICE

| Azione | Windows | Mac |
|---|---|---|
| vai alla riga | `Ctrl+G` | `Ctrl+G` |
| vai a una funzione del file | `Ctrl+Shift+O` | `Cmd+Shift+O` |
| vai a una funzione del progetto | `Ctrl+T` | `Cmd+T` |
| vai alla definizione | `F12` | `F12` |
| vai alla definizione (clic) | `Ctrl+clic` | `Cmd+clic` |
| guarda la definizione senza aprirla | `Alt+F12` | `Option+F12` |
| dove viene usato | `Shift+F12` | `Shift+F12` |
| torna indietro / avanti | `Alt+←` / `Alt+→` | `Ctrl+-` / `Ctrl+Shift+-` |
| inizio / fine del file | `Ctrl+Home` / `Ctrl+Fine` | `Cmd+↑` / `Cmd+↓` |
| parentesi corrispondente | `Ctrl+Shift+\` | `Cmd+Shift+\` |
| errore successivo | `F8` | `F8` |
| comprimi / espandi blocco | `Ctrl+Shift+[` / `Ctrl+Shift+]` | `Cmd+Option+[` / `Cmd+Option+]` |
| comprimi / espandi tutto | `Ctrl+K Ctrl+0` / `Ctrl+K Ctrl+J` | `Cmd+K Cmd+0` / `Cmd+K Cmd+J` |

> Scrivendo in `Ctrl+P`: `:45` va alla riga 45 · `@` cerca funzioni nel file · `#` nel progetto · `>` apre la palette

## CERCARE E SOSTITUIRE

| Azione | Windows | Mac |
|---|---|---|
| cerca nel file | `Ctrl+F` | `Cmd+F` |
| sostituisci nel file | `Ctrl+H` | `Cmd+Option+F` |
| risultato successivo / precedente | `F3` / `Shift+F3` | `Cmd+G` / `Cmd+Shift+G` |
| seleziona tutti i risultati | `Alt+Invio` | `Option+Invio` |
| cerca nel progetto | `Ctrl+Shift+F` | `Cmd+Shift+F` |
| sostituisci nel progetto | `Ctrl+Shift+H` | `Cmd+Shift+H` |

| Opzioni della ricerca | Windows | Mac |
|---|---|---|
| maiuscole / minuscole | `Alt+C` | `Cmd+Option+C` |
| parola intera | `Alt+W` | `Cmd+Option+W` |
| espressione regolare | `Alt+R` | `Cmd+Option+R` |

> Nella ricerca nel progetto, clicca `...` per filtrare i file: es. **file da includere** `src/**/*.tsx` · **da escludere** `node_modules, android/build`

## CODICE E SUGGERIMENTI

| Azione | Windows | Mac |
|---|---|---|
| mostra suggerimenti | `Ctrl+Spazio` | `Ctrl+Spazio` |
| mostra i parametri della funzione | `Ctrl+Shift+Spazio` | `Cmd+Shift+Spazio` |
| mostra info al passaggio del mouse | `Ctrl+K Ctrl+I` | `Cmd+K Cmd+I` |
| correzione rapida / importa automaticamente | `Ctrl+.` | `Cmd+.` |
| rinomina in tutto il progetto | `F2` | `F2` |
| formatta il documento | `Shift+Alt+F` | `Shift+Option+F` |
| formatta la selezione | `Ctrl+K Ctrl+F` | `Cmd+K Cmd+F` |
| sistema gli import | `Shift+Alt+O` | `Shift+Option+O` |
| accetta suggerimento | `Tab` / `Invio` | `Tab` / `Invio` |

## TERMINALE

| Azione | Windows | Mac |
|---|---|---|
| apri / chiudi terminale | ``Ctrl+` `` | ``Ctrl+` `` |
| nuovo terminale | ``Ctrl+Shift+` `` | ``Ctrl+Shift+` `` |
| dividi il terminale | `Ctrl+Shift+5` | `Cmd+\` |
| pulisci il terminale | `cls` | `Cmd+K` |
| cursore dal terminale all'editor | `Ctrl+1` | `Cmd+1` |
| ingrandisci il pannello | palette → `Toggle Maximized Panel` | uguale |

> Con più terminali (npx, npm, git...) rinominali: tasto destro sul nome → **Rename** · cambiane il colore con **Change Color**

**SCEGLIERE IL TERMINALE PREDEFINITO (PowerShell, cmd, Git Bash)**

`Ctrl+Shift+P` → `Terminal: Select Default Profile`

## GIT

| Azione | Windows | Mac |
|---|---|---|
| apri controllo sorgente | `Ctrl+Shift+G` | `Ctrl+Shift+G` |
| conferma il commit (nel box del messaggio) | `Ctrl+Invio` | `Cmd+Invio` |
| cambia branch | palette → `Git: Checkout to` | uguale |

> Nella barra in basso a sinistra: clic sul **nome del branch** per cambiarlo · clic sulle **frecce** per sincronizzare (pull + push)

**COMANDI GIT DALLA PALETTE** (`Ctrl+Shift+P` e scrivi `Git:`)

| Comando | Cosa fa |
|---|---|
| `Git: Pull` / `Git: Push` | scarica / invia |
| `Git: Create Branch` | nuovo branch |
| `Git: Stash` / `Git: Pop Stash` | metti da parte / recupera |
| `Git: Undo Last Commit` | annulla l'ultimo commit tenendo le modifiche |
| `Git: Discard All Changes` | ⚠️ butta tutte le modifiche |
| `Git: Open Changes` | confronta il file con l'ultimo commit |
| `Git: View History` | storico (serve GitLens o Git Graph) |

**RISOLVERE UN CONFLITTO**

Nel file compaiono i pulsanti **Accept Current** (tua versione) · **Accept Incoming** (l'altra) · **Accept Both** · oppure **Resolve in Merge Editor** per vederle affiancate

## DEBUG

| Azione | Windows | Mac |
|---|---|---|
| avvia / continua | `F5` | `F5` |
| ferma | `Shift+F5` | `Shift+F5` |
| riavvia | `Ctrl+Shift+F5` | `Cmd+Shift+F5` |
| breakpoint on/off | `F9` | `F9` |
| passo successivo | `F10` | `F10` |
| entra nella funzione | `F11` | `F11` |
| esci dalla funzione | `Shift+F11` | `Shift+F11` |

## MARKDOWN

| Azione | Windows | Mac |
|---|---|---|
| anteprima in una scheda | `Ctrl+Shift+V` | `Cmd+Shift+V` |
| anteprima affiancata | `Ctrl+K V` | `Cmd+K V` |

> La vista normale mostra il codice (`**`, ` ``` `, `|`): per leggerlo formattato usa sempre l'anteprima

## CLAUDE CODE

| Azione | Windows | Mac |
|---|---|---|
| passa tra editor e Claude | `Ctrl+Esc` | `Cmd+Esc` |
| inserisci nel prompt il riferimento al codice selezionato | `Alt+K` | `Option+K` |
| tutti i comandi di Claude Code | palette → scrivi `Claude Code` | uguale |

> Nel prompt: `@nome-file` per indicare un file · il file di istruzioni del progetto è `CLAUDE.md` nella radice della repo
> Si può usare anche da terminale: apri il terminale e scrivi `claude`

## COMANDI UTILI DELLA PALETTE

> `Ctrl+Shift+P` / `Cmd+Shift+P` e scrivi il nome

| Comando | Cosa fa |
|---|---|
| `Developer: Reload Window` | riavvia VS Code senza chiuderlo (risolve molti blocchi) |
| `TypeScript: Restart TS Server` | errori TypeScript sbagliati o import non trovati |
| `ESLint: Restart ESLint Server` | ESLint che non segnala o segnala a vuoto |
| `Format Document With...` | scegli il formattatore (es. Prettier) |
| `Change Language Mode` | cambia linguaggio del file (anche `Ctrl+K M`) |
| `Change End of Line Sequence` | CRLF ↔ LF (anche clic su `CRLF` in basso a destra) |
| `Change File Encoding` | problemi con lettere accentate |
| `Sort Lines Ascending` | ordina le righe selezionate |
| `Transform to Uppercase` / `Lowercase` | maiuscolo / minuscolo |
| `Trim Trailing Whitespace` | togli spazi a fine riga |
| `Preferences: Open User Settings (JSON)` | apri `settings.json` |
| `Preferences: Color Theme` | cambia tema (anche `Ctrl+K Ctrl+T`) |
| `Shell Command: Install 'code' command in PATH` | (Mac) abilita `code` nel terminale |
| `Terminal: Select Default Profile` | scegli il terminale predefinito |
| `Settings Sync: Turn On` | sincronizza impostazioni ed estensioni tra PC |

## COMANDO CODE DA TERMINALE

> Su Mac va abilitato una volta: palette → `Shell Command: Install 'code' command in PATH`

**APRI LA CARTELLA ATTUALE**

```bash
code .
```

**APRI NELLA FINESTRA GIÀ APERTA**

```bash
code -r .
```

**APRI UN FILE A UNA RIGA PRECISA**

```bash
code -g src/App.tsx:45
```

**CONFRONTA DUE FILE**

```bash
code --diff file1.txt file2.txt
```

**LISTA ESTENSIONI INSTALLATE**

```bash
code --list-extensions
```

**INSTALLA / DISINSTALLA UN'ESTENSIONE**

```bash
code --install-extension id.estensione
code --uninstall-extension id.estensione
```

**APRI SENZA ESTENSIONI (per capire se un problema dipende da loro)**

```bash
code --disable-extensions .
```

## IMPOSTAZIONI CONSIGLIATE

> Palette → `Preferences: Open User Settings (JSON)` e aggiungi dentro le graffe

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "files.autoSave": "onFocusChange",
  "files.eol": "\n",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "editor.tabSize": 2,
  "editor.wordWrap": "on",
  "editor.fontLigatures": false,
  "editor.minimap.enabled": false,
  "editor.stickyScroll.enabled": true,
  "editor.bracketPairColorization.enabled": true,
  "editor.linkedEditing": true,
  "explorer.confirmDelete": true,
  "git.autofetch": true,
  "git.confirmSync": false,
  "files.exclude": {
    "**/.DS_Store": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/android/build": true,
    "**/android/app/build": true,
    "**/ios/Pods": true
  }
}
```

| Impostazione | Cosa fa |
|---|---|
| `formatOnSave` | formatta a ogni salvataggio |
| `codeActionsOnSave` | ESLint corregge da solo quello che può |
| `autoSave` | salva quando cambi file o finestra |
| `files.eol` | nuovi file con fine riga LF (coerente con `.gitattributes`) |
| `trimTrailingWhitespace` | toglie spazi inutili a fine riga |
| `fontLigatures: false` | niente simboli uniti (`\|---\|` resta com'è) |
| `stickyScroll` | tiene visibile in alto la funzione in cui sei |
| `linkedEditing` | cambiando un tag apertura cambia anche la chiusura |
| `git.autofetch` | controlla da solo se ci sono aggiornamenti |
| `search.exclude` | ricerca più veloce, senza cartelle generate |

## ESTENSIONI UTILI

| Estensione | ID | A cosa serve |
|---|---|---|
| ESLint | `dbaeumer.vscode-eslint` | errori di stile e bug nel codice |
| Prettier | `esbenp.prettier-vscode` | formattazione automatica |
| React Native Tools | `msjsdiag.vscode-react-native` | debug e comandi React Native |
| Error Lens | `usernamehw.errorlens` | errori scritti direttamente sulla riga |
| GitLens | `eamodio.gitlens` | chi ha scritto ogni riga, storico |
| Git Graph | `mhutchie.git-graph` | grafico dei branch |
| Markdown All in One | `yzhang.markdown-all-in-one` | scorciatoie e indice per i manuali `.md` |
| Path Intellisense | `christian-kohler.path-intellisense` | completa i percorsi degli import |
| Auto Rename Tag | `formulahendry.auto-rename-tag` | rinomina tag di apertura e chiusura |
| Claude Code | `anthropic.claude-code` | Claude dentro VS Code |

**INSTALLARLE TUTTE IN UN COLPO**

WINDOWS (PowerShell):

```powershell
"dbaeumer.vscode-eslint","esbenp.prettier-vscode","msjsdiag.vscode-react-native","usernamehw.errorlens","eamodio.gitlens","yzhang.markdown-all-in-one" | ForEach-Object { code --install-extension $_ }
```

MAC:

```bash
for e in dbaeumer.vscode-eslint esbenp.prettier-vscode msjsdiag.vscode-react-native usernamehw.errorlens eamodio.gitlens yzhang.markdown-all-in-one; do code --install-extension $e; done
```

## NUOVO PC

**METODO 1: SINCRONIZZAZIONE AUTOMATICA (consigliato)**

Icona account in basso a sinistra → **Backup and Sync Settings** → accedi con GitHub o Microsoft. Impostazioni, scorciatoie ed estensioni si copiano da sole su ogni PC con lo stesso account.

**METODO 2: A MANO — SALVA LA LISTA DELLE ESTENSIONI (sul vecchio PC)**

```bash
code --list-extensions > estensioni-vscode.txt
```

**METODO 2: A MANO — INSTALLA LA LISTA (sul nuovo PC)**

WINDOWS (PowerShell):

```powershell
Get-Content estensioni-vscode.txt | ForEach-Object { code --install-extension $_ }
```

MAC:

```bash
xargs -L 1 code --install-extension < estensioni-vscode.txt
```

| Dove sta settings.json | |
|---|---|
| Windows | `%APPDATA%\Code\User\settings.json` |
| Mac | `~/Library/Application Support/Code/User/settings.json` |

> Tieni `estensioni-vscode.txt` e una copia di `settings.json` in questa repo: così li hai sempre a portata di mano

## PROBLEMI COMUNI

| Problema | Soluzione |
|---|---|
| VS Code lento o bloccato | palette → `Developer: Reload Window` |
| errori TypeScript che non esistono | palette → `TypeScript: Restart TS Server` |
| il salvataggio non formatta | controlla `formatOnSave` e `defaultFormatter` · palette → `Format Document With...` |
| ESLint non segnala niente | `npm install` nel progetto · palette → `ESLint: Restart ESLint Server` |
| `code` non riconosciuto (Mac) | palette → `Shell Command: Install 'code' command in PATH` |
| `code` non riconosciuto (Windows) | reinstalla VS Code spuntando **Aggiungi a PATH** · riapri il terminale |
| file tutto "modificato" senza motivo | fine riga diversi: clic su `CRLF`/`LF` in basso a destra · vedi `.gitattributes` |
| lettere accentate strane | clic sulla codifica in basso a destra → **Reopen with Encoding** → UTF-8 |
| markdown pieno di simboli | è la vista codice: `Ctrl+Shift+V` per l'anteprima |
| `\|---\|` diventa una linea grafica | legature del font: `"editor.fontLigatures": false` |
| una scorciatoia non funziona | `Ctrl+K Ctrl+S` e cerca la scorciatoia: vedi se è usata da un'altra estensione |
| ricerca lentissima | aggiungi `node_modules` e cartelle di build a `search.exclude` |
| un'estensione dà problemi | `code --disable-extensions .` per verificarlo |
