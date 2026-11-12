# COMANDI POWERSHELL

> Molti comandi hanno un alias corto (tra parentesi): funzionano entrambi.
> `Tab` completa nomi di comandi e percorsi · `↑` richiama i comandi precedenti.
> ⚠️ = comando che cancella in modo non recuperabile (non passa dal Cestino).

**INDICE**
[Base](#base) · [Navigazione](#navigazione) · [Cartelle](#cartelle) · [File](#file) · [Leggere e scrivere file](#leggere-e-scrivere-file) · [Cercare](#cercare) · [Filtrare e ordinare](#filtrare-e-ordinare) · [Appunti](#appunti) · [Aprire cose](#aprire-cose) · [Processi](#processi) · [Porte](#porte) · [Rete](#rete) · [Sistema](#sistema) · [Disco e spazio](#disco-e-spazio) · [Variabili di ambiente](#variabili-di-ambiente) · [Profilo e alias](#profilo-e-alias) · [Cronologia](#cronologia) · [Zip e download](#zip-e-download) · [Installare programmi](#installare-programmi) · [Node e npm](#node-e-npm) · [React Native Android](#react-native-android) · [Script](#script) · [Servizi](#servizi) · [Scorciatoie da tastiera](#scorciatoie-da-tastiera) · [PowerShell vs Mac](#powershell-vs-mac) · [Problemi comuni](#problemi-comuni)

#### 

#### **BASE:**

#### 

* **PULISCI IL TERMINALE**
```powershell
Clear-Host
```
alias `cls` o `clear`

* **VERSIONE DI POWERSHELL**
```powershell
$PSVersionTable.PSVersion
```

* **AIUTO SU UN COMANDO (con esempi)**
```powershell
Get-Help Nome-Comando -Examples
```

* **CERCA UN COMANDO PER PAROLA**
```powershell
Get-Command *parola*
```

* **A COSA CORRISPONDE UN ALIAS**
```powershell
Get-Alias ls
```

* **DOVE SI TROVA UN PROGRAMMA (tipo which)**
```powershell
Get-Command adb
```
alias `gcm adb`

* **ESEGUI DUE COMANDI DI FILA**
```powershell
comando1; comando2
```

* **ESEGUI IL SECONDO SOLO SE IL PRIMO RIESCE (PowerShell 7+)**
```powershell
comando1 && comando2
```

* **INTERROMPI UN COMANDO**

`Ctrl+C`

#### 

#### **NAVIGAZIONE:**

#### 

* **DOVE MI TROVO**
```powershell
Get-Location
```
alias `pwd`

* **NAVIGA**
```powershell
cd percorso
```

* **INDIETRO (cartella superiore)**
```powershell
cd ..
```

* **HOME (C:\Users\nome)**
```powershell
cd ~
```

* **TORNA ALLA CARTELLA PRECEDENTE (PowerShell 7+)**
```powershell
cd -
```

* **CAMBIA DISCO**
```powershell
D:
```

* **PERCORSO CON SPAZI**
```powershell
cd "C:\Program Files"
```

* **SALVA LA POSIZIONE, VAI ALTROVE, TORNA**
```powershell
Push-Location C:\altro
Pop-Location
```

| Percorsi utili | |
|---|---|
| `~` o `$HOME` | cartella utente |
| `~\Desktop` | desktop |
| `~\Downloads` | download |
| `$env:APPDATA` | AppData\Roaming |
| `$env:LOCALAPPDATA` | AppData\Local (qui c'è l'Android SDK) |
| `$env:TEMP` | file temporanei |
| `.` | cartella attuale |
| `..` | cartella superiore |

#### 

#### **CARTELLE:**

#### 

* **LISTA CONTENUTO**
```powershell
Get-ChildItem
```
alias `ls` o `dir`

* **LISTA ANCHE FILE NASCOSTI (.git, .env...)**
```powershell
ls -Force
```

* **SOLO CARTELLE / SOLO FILE**
```powershell
ls -Directory
ls -File
```

* **LISTA DI TUTTE LE SOTTOCARTELLE**
```powershell
ls -Recurse
```

* **SOLO I NOMI**
```powershell
ls -Name
```

* **CREA CARTELLA (anche annidate)**
```powershell
New-Item -ItemType Directory -Path cartella\sottocartella
```
alias `mkdir cartella`

* **CREA CARTELLA ED ENTRACI**
```powershell
mkdir nuova-cartella; cd nuova-cartella
```

* **⚠️ ELIMINA CARTELLA CON TUTTO IL CONTENUTO**
```powershell
Remove-Item cartella -Recurse -Force
```
alias `rm -r -fo cartella`

* **COPIA CARTELLA**
```powershell
Copy-Item cartella destinazione -Recurse
```

* **SPOSTA / RINOMINA CARTELLA**
```powershell
Move-Item cartella nuova-posizione
Rename-Item cartella nuovo-nome
```

* **STRUTTURA AD ALBERO**
```powershell
tree /F
```
senza `/F` mostra solo le cartelle

#### 

#### **FILE:**

#### 

* **CREA FILE VUOTO**
```powershell
New-Item file.txt
```
alias `ni file.txt`

* **COPIA FILE**
```powershell
Copy-Item file.txt destinazione\
```
alias `cp`

* **SPOSTA FILE**
```powershell
Move-Item file.txt destinazione\
```
alias `mv`

* **RINOMINA FILE**
```powershell
Rename-Item file.txt nuovo-nome.txt
```

* **⚠️ ELIMINA FILE**
```powershell
Remove-Item file.txt
```
alias `rm` o `del`

* **⚠️ ELIMINA TUTTI I FILE DI UN TIPO**
```powershell
Remove-Item *.log
```

* **PROVA PRIMA COSA VERREBBE ELIMINATO**
```powershell
Remove-Item *.log -WhatIf
```
`-WhatIf` funziona su quasi tutti i comandi che modificano

* **IL FILE ESISTE?**
```powershell
Test-Path file.txt
```

* **INFO SU UN FILE (dimensione, date)**
```powershell
Get-Item file.txt | Format-List
```

* **RINOMINA TANTI FILE (es. cambia estensione)**
```powershell
Get-ChildItem *.jpeg | Rename-Item -NewName { $_.Name -replace '\.jpeg$', '.jpg' }
```

* **HASH DI UN FILE (verificare download)**
```powershell
Get-FileHash file.apk
```
per SHA-1: `-Algorithm SHA1`

* **FIRMA SHA-1 / SHA-256 DI UNA KEYSTORE (Firebase, Google Sign-In)**
```powershell
keytool -list -v -keystore android\app\debug.keystore -alias androiddebugkey -storepass android
```

#### 

#### **LEGGERE E SCRIVERE FILE:**

#### 

* **LEGGI UN FILE**
```powershell
Get-Content file.txt
```
alias `cat` o `type`

* **PRIME / ULTIME RIGHE**
```powershell
Get-Content file.txt -Head 10
Get-Content file.txt -Tail 10
```

* **SEGUI UN FILE MENTRE CRESCE (log)**
```powershell
Get-Content log.txt -Wait -Tail 20
```

* **SCRIVI IN UN FILE (sovrascrive)**
```powershell
"testo" | Set-Content file.txt
```
oppure `"testo" > file.txt`

* **AGGIUNGI IN FONDO A UN FILE**
```powershell
"testo" | Add-Content file.txt
```
oppure `"testo" >> file.txt`

* **SALVA L'OUTPUT DI UN COMANDO IN UN FILE**
```powershell
comando | Out-File output.txt -Encoding utf8
```

* **SALVA OUTPUT E VEDILO A SCHERMO INSIEME**
```powershell
comando | Tee-Object output.txt
```

* **CONTA LE RIGHE DI UN FILE**
```powershell
(Get-Content file.txt).Count
```

* **SOSTITUISCI UN TESTO IN UN FILE**
```powershell
(Get-Content file.txt) -replace 'vecchio', 'nuovo' | Set-Content file.txt
```

* **APRI UN FILE IN VS CODE / BLOCCO NOTE**
```powershell
code file.txt
notepad file.txt
```

* **LEGGI UN JSON (es. versione in package.json)**
```powershell
(Get-Content package.json | ConvertFrom-Json).version
```

#### 

#### **CERCARE:**

#### 

* **TROVA FILE PER NOME (in tutte le sottocartelle)**
```powershell
Get-ChildItem -Recurse -Filter "*.keystore"
```

* **TROVA FILE ESCLUDENDO NODE_MODULES**
```powershell
Get-ChildItem -Recurse -Filter "*.tsx" | Where-Object { $_.FullName -notmatch 'node_modules' }
```

* **CERCA UN TESTO DENTRO I FILE (tipo grep)**
```powershell
Select-String -Path *.js -Pattern "testo"
```
alias `sls`

* **CERCA UN TESTO IN TUTTO IL PROGETTO**
```powershell
Get-ChildItem -Recurse -Include *.ts,*.tsx -Exclude node_modules | Select-String "testo"
```

* **CERCA IGNORANDO MAIUSCOLE (default) / RISPETTANDOLE**
```powershell
Select-String "Testo" file.txt -CaseSensitive
```

* **FILTRA L'OUTPUT DI UN COMANDO**
```powershell
comando | Select-String "parola"
```
funziona anche `findstr "parola"`

* **FILE PIÙ GRANDI DI UNA CARTELLA**
```powershell
Get-ChildItem -Recurse -File | Sort-Object Length -Descending | Select-Object -First 10 Name, @{n='MB';e={[math]::Round($_.Length/1MB,1)}}
```

* **FILE MODIFICATI NELLE ULTIME 24 ORE**
```powershell
Get-ChildItem -Recurse -File | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-1) }
```

#### 

#### **FILTRARE E ORDINARE:**

#### 

> Il simbolo `|` (pipe) passa il risultato di un comando al successivo. `$_` è l'elemento attuale.

* **FILTRA**
```powershell
Get-Process | Where-Object { $_.CPU -gt 100 }
```
alias `?`

* **SCEGLI LE COLONNE**
```powershell
Get-Process | Select-Object Name, Id, CPU
```
alias `select`

* **PRIMI N RISULTATI**
```powershell
Get-Process | Select-Object -First 5
```

* **ORDINA**
```powershell
Get-Process | Sort-Object CPU -Descending
```
alias `sort`

* **CONTA**
```powershell
(Get-ChildItem).Count
```

* **RIPETI UN'AZIONE PER OGNI ELEMENTO**
```powershell
Get-ChildItem *.txt | ForEach-Object { $_.Name }
```
alias `%`

* **TABELLA / LISTA / FINESTRA INTERATTIVA**
```powershell
comando | Format-Table
comando | Format-List
comando | Out-GridView
```

* **TOGLI I DUPLICATI**
```powershell
comando | Sort-Object -Unique
```

| Operatori | |
|---|---|
| `-eq` / `-ne` | uguale / diverso |
| `-gt` / `-lt` | maggiore / minore |
| `-ge` / `-le` | maggiore o uguale / minore o uguale |
| `-like "*x*"` | contiene (con asterischi) |
| `-match "regex"` | espressione regolare |
| `-and` / `-or` / `-not` | e / o / non |

#### 

#### **APPUNTI:**

#### 

* **COPIA NEGLI APPUNTI**
```powershell
comando | Set-Clipboard
```
oppure `comando | clip`

* **COPIA UN TESTO**
```powershell
"testo" | Set-Clipboard
```

* **INCOLLA DAGLI APPUNTI**
```powershell
Get-Clipboard
```

* **COPIA IL PERCORSO ATTUALE**
```powershell
(Get-Location).Path | Set-Clipboard
```

#### 

#### **APRIRE COSE:**

#### 

* **APRI LA CARTELLA ATTUALE IN ESPLORA FILE**
```powershell
explorer .
```
alias `ii .`

* **APRI UN FILE CON IL PROGRAMMA PREDEFINITO**
```powershell
Invoke-Item file.pdf
```

* **APRI LA CARTELLA IN VS CODE**
```powershell
code .
```

* **APRI UN SITO**
```powershell
Start-Process "https://github.com"
```

* **APRI UN PROGRAMMA**
```powershell
Start-Process notepad
```

* **APRI UN NUOVO POWERSHELL COME AMMINISTRATORE**
```powershell
Start-Process powershell -Verb RunAs
```

* **APRI LE IMPOSTAZIONI DI WINDOWS**
```powershell
start ms-settings:
```

* **APRI VARIABILI DI AMBIENTE**
```powershell
rundll32 sysdm.cpl,EditEnvironmentVariables
```

#### 

#### **PROCESSI:**

#### 

* **LISTA PROCESSI**
```powershell
Get-Process
```
alias `ps`

* **CERCA UN PROCESSO**
```powershell
Get-Process -Name *node*
```

* **PROCESSI CHE USANO PIÙ RAM**
```powershell
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10 Name, Id, @{n='MB';e={[math]::Round($_.WorkingSet/1MB)}}
```

* **PROCESSI CHE USANO PIÙ CPU**
```powershell
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name, Id, CPU
```

* **CHIUDI UN PROCESSO PER NOME**
```powershell
Stop-Process -Name node -Force
```
alias `kill`

* **CHIUDI UN PROCESSO PER ID**
```powershell
Stop-Process -Id 1234 -Force
```

* **CHIUDI TUTTI I PROCESSI JAVA (Gradle bloccato)**
```powershell
Stop-Process -Name java -Force
```

* **CHIUDI UN PROCESSO (alternativa classica, anche con figli)**
```powershell
taskkill /F /IM node.exe /T
```

#### 

#### **PORTE:**

#### 

* **CHI STA USANDO UNA PORTA (es. 8081 di Metro)**
```powershell
Get-NetTCPConnection -LocalPort 8081 | Select-Object LocalPort, State, OwningProcess, @{n='Nome';e={(Get-Process -Id $_.OwningProcess).Name}}
```

* **LIBERA UNA PORTA (chiude il processo)**
```powershell
Get-NetTCPConnection -LocalPort 8081 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

* **ALTERNATIVA RAPIDA CON NPX**
```powershell
npx kill-port 8081
```

* **TUTTE LE PORTE IN ASCOLTO**
```powershell
Get-NetTCPConnection -State Listen | Sort-Object LocalPort | Select-Object LocalPort, OwningProcess
```

* **ALTERNATIVA CLASSICA**
```powershell
netstat -ano | findstr :8081
```
l'ultimo numero è il PID

| Porte tipiche | |
|---|---|
| `8081` | Metro bundler |
| `3000` | server Node / React |
| `4000` | interfaccia emulatori Firebase |
| `8080` | emulatore Firestore |
| `9099` | emulatore Firebase Auth |
| `5037` | server adb |

#### 

#### **RETE:**

#### 

* **INDIRIZZO IP DEL PC**
```powershell
ipconfig
```
cerca `Indirizzo IPv4` della scheda Wi-Fi/Ethernet

* **SOLO GLI IP IPv4**
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Select-Object InterfaceAlias, IPAddress
```

* **IP PUBBLICO**
```powershell
(Invoke-RestMethod https://api.ipify.org)
```

* **PING**
```powershell
ping google.com
```

* **UNA PORTA DI UN SERVER È RAGGIUNGIBILE?**
```powershell
Test-NetConnection google.com -Port 443
```

* **SVUOTA LA CACHE DNS**
```powershell
ipconfig /flushdns
```

* **CHIAMA UN'API (tipo curl)**
```powershell
Invoke-RestMethod https://api.github.com/users/octocat
```
alias `irm`

* **CHIAMATA POST CON JSON**
```powershell
Invoke-RestMethod -Uri https://sito/api -Method Post -ContentType "application/json" -Body '{"chiave":"valore"}'
```

* **USA IL VERO CURL (in PowerShell 5 `curl` è un alias)**
```powershell
curl.exe -I https://google.com
```

* **PASSWORD DEL WI-FI SALVATO**
```powershell
netsh wlan show profile name="NomeRete" key=clear
```
cerca `Contenuto chiave`

#### 

#### **SISTEMA:**

#### 

* **INFO COMPLETE DEL PC**
```powershell
Get-ComputerInfo | Select-Object OsName, OsVersion, CsModel, CsTotalPhysicalMemory
```

* **VERSIONE WINDOWS**
```powershell
winver
```

* **NOME DEL PC E UTENTE**
```powershell
$env:COMPUTERNAME
$env:USERNAME
```

* **RAM TOTALE E LIBERA (GB)**
```powershell
Get-CimInstance Win32_OperatingSystem | Select-Object @{n='TotaleGB';e={[math]::Round($_.TotalVisibleMemorySize/1MB,1)}}, @{n='LiberaGB';e={[math]::Round($_.FreePhysicalMemory/1MB,1)}}
```

* **PROCESSORE**
```powershell
Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores
```

* **DA QUANTO È ACCESO IL PC**
```powershell
(Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime
```

* **SALUTE BATTERIA DEL PORTATILE (report HTML)**
```powershell
powercfg /batteryreport
```
crea `battery-report.html` nella cartella attuale · confronta `DESIGN CAPACITY` e `FULL CHARGE CAPACITY`

* **DATA E ORA**
```powershell
Get-Date -Format "yyyy-MM-dd HH:mm"
```

* **SEI AMMINISTRATORE?**
```powershell
([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
```

* **RIAVVIA / SPEGNI**
```powershell
Restart-Computer
Stop-Computer
```

* **BLOCCA IL PC**

`Win+L`

#### 

#### **DISCO E SPAZIO:**

#### 

* **SPAZIO LIBERO DEI DISCHI**
```powershell
Get-PSDrive -PSProvider FileSystem
```

* **DIMENSIONE DI UNA CARTELLA (GB)**
```powershell
"{0:N2} GB" -f ((Get-ChildItem cartella -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum / 1GB)
```

* **CARTELLE PIÙ PESANTI NELLA CARTELLA ATTUALE**
```powershell
Get-ChildItem -Directory | ForEach-Object { [PSCustomObject]@{ Cartella = $_.Name; GB = [math]::Round(((Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum / 1GB), 2) } } | Sort-Object GB -Descending
```

* **⚠️ SVUOTA LA CARTELLA TEMP**
```powershell
Remove-Item "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
```

* **SVUOTA IL CESTINO**
```powershell
Clear-RecycleBin -Force
```

| Cartelle pesanti da sviluppatore | |
|---|---|
| `~\.gradle\caches` | cache Gradle (si può cancellare) |
| `$env:LOCALAPPDATA\Android\Sdk\system-images` | immagini emulatori non usati |
| `~\.android\avd` | emulatori creati |
| `$env:LOCALAPPDATA\npm-cache` | cache npm (`npm cache clean --force`) |
| `node_modules` nei progetti vecchi | si rigenera con `npm install` |

#### 

#### **VARIABILI DI AMBIENTE:**

#### 

* **LEGGI UNA VARIABILE**
```powershell
$env:JAVA_HOME
```

* **LISTA TUTTE LE VARIABILI**
```powershell
Get-ChildItem env:
```

* **PATH UNA VOCE PER RIGA**
```powershell
$env:Path -split ';'
```

* **IMPOSTA UNA VARIABILE SOLO PER QUESTA FINESTRA**
```powershell
$env:NODE_ENV = "production"
```

* **IMPOSTA UNA VARIABILE PERMANENTE (per l'utente)**
```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
```
riapri il terminale per vederla

* **AGGIUNGI UNA CARTELLA AL PATH IN MODO PERMANENTE**
```powershell
$p = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$p;$env:LOCALAPPDATA\Android\Sdk\platform-tools", "User")
```

* **RICARICA IL PATH SENZA RIAPRIRE IL TERMINALE**
```powershell
$env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
```

| Variabili per Android / React Native | Valore tipico |
|---|---|
| `ANDROID_HOME` | `%LOCALAPPDATA%\Android\Sdk` |
| `JAVA_HOME` | `C:\Program Files\Android\Android Studio\jbr` |
| `Path` | + `%ANDROID_HOME%\platform-tools` · + `%ANDROID_HOME%\emulator` |

#### 

#### **PROFILO E ALIAS:**

#### 

> Il profilo è uno script che parte a ogni apertura di PowerShell: ci metti alias e funzioni.

* **DOVE SI TROVA IL PROFILO**
```powershell
$PROFILE
```

* **CREA IL PROFILO (se non esiste) E APRILO**
```powershell
if (!(Test-Path $PROFILE)) { New-Item $PROFILE -Force }
code $PROFILE
```

* **RICARICA IL PROFILO DOPO LE MODIFICHE**
```powershell
. $PROFILE
```

* **ALIAS SEMPLICE (solo per comandi senza parametri)**
```powershell
Set-Alias g git
```

* **FUNZIONE (per comandi con parametri)**
```powershell
function gs { git status -sb }
```

* **ESEMPIO DI PROFILO DA SVILUPPATORE**
```powershell
# Git
function gs { git status -sb }
function gl { git log --oneline --graph -20 }
function gp { git pull --rebase }

# Navigazione
function dev { Set-Location "$HOME\progetti" }

# React Native
function metro { npx react-native start --reset-cache }
function rnandroid { npx react-native run-android }
function rnclean { Push-Location android; .\gradlew clean; Pop-Location }
function rnlog { adb logcat ReactNativeJS:V *:S }
function rnrev { adb reverse tcp:8081 tcp:8081 }

# Porte
function killport($porta) { Get-NetTCPConnection -LocalPort $porta -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force } }

# ADB
function batt { adb shell dumpsys battery }
```
Poi scrivi solo `gs`, `metro`, `killport 8081`...

#### 

#### **CRONOLOGIA:**

#### 

* **COMANDI DI QUESTA SESSIONE**
```powershell
Get-History
```
alias `h`

* **RIESEGUI UN COMANDO DELLA CRONOLOGIA**
```powershell
Invoke-History 5
```
alias `r 5`

* **CERCA NEI COMANDI PASSATI (anche delle sessioni chiuse)**

`Ctrl+R` e scrivi una parte del comando

* **FILE CON TUTTA LA CRONOLOGIA**
```powershell
code (Get-PSReadLineOption).HistorySavePath
```

* **CERCA NELLA CRONOLOGIA COMPLETA**
```powershell
Get-Content (Get-PSReadLineOption).HistorySavePath | Select-String "adb"
```

#### 

#### **ZIP E DOWNLOAD:**

#### 

* **CREA UNO ZIP**
```powershell
Compress-Archive -Path cartella -DestinationPath archivio.zip
```

* **AGGIUNGI FILE A UNO ZIP ESISTENTE**
```powershell
Compress-Archive -Path file.txt -DestinationPath archivio.zip -Update
```

* **ESTRAI UNO ZIP**
```powershell
Expand-Archive archivio.zip -DestinationPath cartella
```

* **SCARICA UN FILE**
```powershell
Invoke-WebRequest https://sito/file.zip -OutFile file.zip
```
alias `iwr`

#### 

#### **INSTALLARE PROGRAMMI:**

#### 

> **winget** è il gestore pacchetti di Windows, già incluso.

* **CERCA UN PROGRAMMA**
```powershell
winget search nome
```

* **INSTALLA**
```powershell
winget install --id Git.Git
```

* **AGGIORNA TUTTO**
```powershell
winget upgrade --all
```

* **PROGRAMMI DA AGGIORNARE**
```powershell
winget upgrade
```

* **DISINSTALLA**
```powershell
winget uninstall nome
```

* **LISTA PROGRAMMI INSTALLATI**
```powershell
winget list
```

| Pacchetti utili | ID |
|---|---|
| PowerShell 7 | `Microsoft.PowerShell` |
| Git | `Git.Git` |
| GitHub CLI | `GitHub.cli` |
| Node LTS | `OpenJS.NodeJS.LTS` |
| VS Code | `Microsoft.VisualStudioCode` |
| Android Studio | `Google.AndroidStudio` |
| scrcpy | `Genymobile.scrcpy` |
| JDK 17 | `Microsoft.OpenJDK.17` |
| Windows Terminal | `Microsoft.WindowsTerminal` |

#### 

#### **NODE E NPM:**

#### 

* **VERSIONI INSTALLATE**
```powershell
node -v; npm -v
```

* **INSTALLA LE DIPENDENZE**
```powershell
npm install
```

* **INSTALLA ESATTAMENTE LE VERSIONI DEL LOCK (CI, installazione pulita)**
```powershell
npm ci
```

* **AGGIUNGI UN PACCHETTO / SOLO PER SVILUPPO**
```powershell
npm install nome-pacchetto
npm install -D nome-pacchetto
```

* **RIMUOVI UN PACCHETTO**
```powershell
npm uninstall nome-pacchetto
```

* **PACCHETTI DA AGGIORNARE**
```powershell
npm outdated
```

* **VERSIONE INSTALLATA DI UN PACCHETTO**
```powershell
npm ls nome-pacchetto
```

* **PERCHÉ È INSTALLATO UN PACCHETTO**
```powershell
npm explain nome-pacchetto
```

* **LISTA SCRIPT DEL PROGETTO**
```powershell
npm run
```

* **VULNERABILITÀ**
```powershell
npm audit
```

* **⚠️ REINSTALLAZIONE PULITA**
```powershell
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm cache clean --force
npm install
```

* **PACCHETTI INSTALLATI GLOBALMENTE**
```powershell
npm ls -g --depth=0
```

#### 

#### **REACT NATIVE ANDROID:**

#### 

* **AVVIA METRO**
```powershell
npx react-native start
```

* **AVVIA METRO SVUOTANDO LA CACHE**
```powershell
npx react-native start --reset-cache
```

* **INSTALLA E AVVIA SUL TELEFONO**
```powershell
npx react-native run-android
```

* **SCEGLI IL DISPOSITIVO**
```powershell
npx react-native run-android --list-devices
```

* **CONTROLLA CHE L'AMBIENTE SIA CONFIGURATO**
```powershell
npx react-native doctor
```

* **PULISCI LA BUILD ANDROID**
```powershell
cd android; .\gradlew clean; cd ..
```

* **FERMA I PROCESSI GRADLE BLOCCATI**
```powershell
cd android; .\gradlew --stop; cd ..
```

* **⚠️ PULIZIA PROFONDA (build che non partono)**
```powershell
cd android; .\gradlew --stop; cd ..
Remove-Item android\app\build, android\build, android\.gradle -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item node_modules -Recurse -Force
npm install
```

* **CREA APK DI RELEASE**
```powershell
cd android; .\gradlew assembleRelease; cd ..
```
si trova in `android\app\build\outputs\apk\release\`

* **CREA AAB PER IL PLAY STORE**
```powershell
cd android; .\gradlew bundleRelease; cd ..
```
si trova in `android\app\build\outputs\bundle\release\`

* **APRI LA CARTELLA DEGLI APK**
```powershell
explorer android\app\build\outputs\apk
```

* **LISTA TASK GRADLE DISPONIBILI**
```powershell
cd android; .\gradlew tasks; cd ..
```

* **DIPENDENZE ANDROID (conflitti di librerie)**
```powershell
cd android; .\gradlew app:dependencies; cd ..
```

* **BUILD CON LOG DETTAGLIATI (per capire un errore)**
```powershell
cd android; .\gradlew assembleDebug --stacktrace --info; cd ..
```

> In PowerShell si scrive `.\gradlew`, non `./gradlew` o `gradlew`

#### 

#### **SCRIPT:**

#### 

* **ESEGUI UNO SCRIPT**
```powershell
.\script.ps1
```

* **CONSENTI L'ESECUZIONE DEGLI SCRIPT (una volta sola)**
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

* **VARIABILE**
```powershell
$nome = "valore"
```

* **CONDIZIONE**
```powershell
if (Test-Path file.txt) { "esiste" } else { "non esiste" }
```

* **CICLO**
```powershell
foreach ($f in Get-ChildItem *.txt) { $f.Name }
```

* **RIPETI N VOLTE**
```powershell
1..5 | ForEach-Object { "Giro $_" }
```

* **ASPETTA**
```powershell
Start-Sleep -Seconds 5
```

* **CHIEDI UN VALORE ALL'UTENTE**
```powershell
$risposta = Read-Host "Nome branch"
```

* **GESTISCI UN ERRORE**
```powershell
try { comando -ErrorAction Stop } catch { "Errore: $_" }
```

* **ESITO DELL'ULTIMO COMANDO ESTERNO (0 = ok)**
```powershell
$LASTEXITCODE
```

* **MISURA QUANTO CI METTE UN COMANDO**
```powershell
Measure-Command { comando }
```

#### 

#### **SERVIZI:**

#### 

* **LISTA SERVIZI**
```powershell
Get-Service
```

* **SERVIZI ATTIVI CHE CONTENGONO UNA PAROLA**
```powershell
Get-Service *parola* | Where-Object Status -eq Running
```

* **AVVIA / FERMA / RIAVVIA (da amministratore)**
```powershell
Start-Service nome
Stop-Service nome
Restart-Service nome
```

#### 

#### **SCORCIATOIE DA TASTIERA:**

#### 

| Tasti | Azione |
|---|---|
| `Tab` | completa comando o percorso |
| `Ctrl+Spazio` | mostra tutti i completamenti |
| `↑` / `↓` | comandi precedenti |
| `F7` | lista comandi (PowerShell 5) |
| `Ctrl+R` | cerca nella cronologia |
| `Ctrl+C` | interrompe il comando |
| `Ctrl+L` | pulisce lo schermo |
| `Ctrl+←` / `Ctrl+→` | salta di parola |
| `Ctrl+Backspace` | cancella la parola |
| `Esc` | cancella la riga |
| `Shift+Invio` | vai a capo senza eseguire |
| tasto destro | incolla (vecchio terminale) |
| `Ctrl+Shift+T` | nuova scheda (Windows Terminal) |
| `Alt+Shift+D` | dividi il pannello (Windows Terminal) |

#### 

#### **POWERSHELL VS MAC:**

#### 

| Mac / Linux | PowerShell |
|---|---|
| `ls -la` | `ls -Force` |
| `touch file` | `ni file` |
| `rm -rf cartella` | `rm -r -fo cartella` |
| `cp -r a b` | `cp a b -Recurse` |
| `cat file` | `cat file` |
| `tail -f file` | `cat file -Wait -Tail 20` |
| `grep testo` | `Select-String testo` / `findstr testo` |
| `which comando` | `gcm comando` |
| `export VAR=x` | `$env:VAR = "x"` |
| `echo $VAR` | `$env:VAR` |
| `open .` | `ii .` |
| `pbcopy` | `Set-Clipboard` / `clip` |
| `pbpaste` | `Get-Clipboard` |
| `lsof -i :8081` | `Get-NetTCPConnection -LocalPort 8081` |
| `kill -9 PID` | `Stop-Process -Id PID -Force` |
| `./script.sh` | `.\script.ps1` |
| `./gradlew` | `.\gradlew` |
| `$(comando)` | `$(comando)` o `(comando)` |
| `~/.zshrc` | `$PROFILE` |
| `brew install` | `winget install` |

#### 

#### **PROBLEMI COMUNI:**

#### 

| Problema | Soluzione |
|---|---|
| `l'esecuzione di script è disabilitata` | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `termine non riconosciuto` | programma non installato o non nel PATH: riapri il terminale o controlla `$env:Path -split ';'` |
| `Accesso negato` | apri PowerShell come amministratore · o chiudi il programma che usa il file |
| `Impossibile rimuovere... in uso` | chiudi VS Code / Metro / Gradle (`.\gradlew --stop`) e riprova |
| `gradlew non riconosciuto` | scrivi `.\gradlew` e assicurati di essere nella cartella `android` |
| `Port 8081 already in use` | `npx kill-port 8081` |
| percorso troppo lungo su node_modules | `git config --system core.longpaths true` (da amministratore) |
| screenshot adb corrotto con `>` | usa `adb shell screencap -p /sdcard/s.png` + `adb pull` |
| caratteri accentati sbagliati nei file | aggiungi `-Encoding utf8` |
| `curl` si comporta in modo strano | in PowerShell 5 è un alias: usa `curl.exe` |
| variabile impostata ma non vista | riapri il terminale o ricarica il PATH |
| `&&` non funziona | sei su PowerShell 5: usa `;` oppure installa PowerShell 7 |
