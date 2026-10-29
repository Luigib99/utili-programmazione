# COMANDI TERMINALE MAC

> La shell predefinita del Mac è **zsh**. Il file di configurazione è `~/.zshrc`.
> `Tab` completa comandi e percorsi · `↑` richiama i comandi precedenti · trascina un file nel Terminale per incollarne il percorso.
> ⚠️ = comando che cancella in modo non recuperabile (non passa dal Cestino).

**INDICE**
[Base](#base) · [Navigazione](#navigazione) · [Cartelle](#cartelle) · [File](#file) · [Leggere e scrivere file](#leggere-e-scrivere-file) · [Cercare](#cercare) · [Pipe e filtri](#pipe-e-filtri) · [Appunti](#appunti) · [Aprire cose](#aprire-cose) · [Permessi](#permessi) · [Processi](#processi) · [Porte](#porte) · [Rete](#rete) · [Sistema](#sistema) · [Batteria](#batteria) · [Disco e spazio](#disco-e-spazio) · [Variabili di ambiente](#variabili-di-ambiente) · [Profilo e alias](#profilo-e-alias) · [Cronologia](#cronologia) · [Zip e download](#zip-e-download) · [Homebrew](#homebrew) · [Sviluppo mobile](#sviluppo-mobile) · [Utility macOS](#utility-macos) · [Scorciatoie da tastiera](#scorciatoie-da-tastiera) · [Mac vs PowerShell](#mac-vs-powershell) · [Problemi comuni](#problemi-comuni)

## BASE

**PULISCI IL TERMINALE**

```bash
clear
```

oppure `Cmd+K`

**AIUTO SU UN COMANDO**

```bash
man comando
```

`q` per uscire · `/parola` per cercare dentro

**AIUTO RAPIDO**

```bash
comando --help
```

**DOVE SI TROVA UN PROGRAMMA**

```bash
which adb
```

**CHE SHELL STO USANDO**

```bash
echo $SHELL
```

**ESEGUI DUE COMANDI DI FILA**

```bash
comando1; comando2
```

**ESEGUI IL SECONDO SOLO SE IL PRIMO RIESCE**

```bash
comando1 && comando2
```

**ESEGUI IL SECONDO SOLO SE IL PRIMO FALLISCE**

```bash
comando1 || comando2
```

**INTERROMPI UN COMANDO**

`Ctrl+C`

**ESCI DA UN PROGRAMMA A SCHERMO INTERO (man, less, git log)**

`q`

## NAVIGAZIONE

**DOVE MI TROVO**

```bash
pwd
```

**NAVIGA**

```bash
cd percorso
```

**INDIETRO (cartella superiore)**

```bash
cd ..
```

**HOME (/Users/nome)**

```bash
cd ~
```

oppure solo `cd`

**TORNA ALLA CARTELLA PRECEDENTE**

```bash
cd -
```

**PERCORSO CON SPAZI**

```bash
cd ~/"Library/Application Support"
```

oppure `cd ~/Library/Application\ Support`

**SALVA LA POSIZIONE, VAI ALTROVE, TORNA**

```bash
pushd /altra/cartella
popd
```

| Percorsi utili | |
|---|---|
| `~` | cartella utente |
| `~/Desktop` | scrivania |
| `~/Downloads` | download |
| `~/Documents` | documenti |
| `~/Library` | impostazioni e cache delle app (nascosta nel Finder) |
| `/Applications` | applicazioni |
| `/tmp` | file temporanei |
| `.` | cartella attuale |
| `..` | cartella superiore |
| `/Volumes` | dischi esterni e chiavette |

## CARTELLE

**LISTA CONTENUTO**

```bash
ls
```

**LISTA DETTAGLIATA CON FILE NASCOSTI (.git, .env...)**

```bash
ls -la
```

**LISTA CON DIMENSIONI LEGGIBILI**

```bash
ls -lh
```

**ORDINA PER DATA (più recenti prima)**

```bash
ls -lt
```

**CREA CARTELLA (anche annidate)**

```bash
mkdir -p cartella/sottocartella
```

**CREA CARTELLA ED ENTRACI**

```bash
mkdir nuova-cartella && cd nuova-cartella
```

**⚠️ ELIMINA CARTELLA CON TUTTO IL CONTENUTO**

```bash
rm -rf cartella
```

**ELIMINA CARTELLA VUOTA**

```bash
rmdir cartella
```

**COPIA CARTELLA**

```bash
cp -R cartella destinazione
```

**SPOSTA / RINOMINA CARTELLA**

```bash
mv cartella nuova-posizione
mv cartella nuovo-nome
```

**STRUTTURA AD ALBERO (serve `brew install tree`)**

```bash
tree -L 2 -I node_modules
```

`-L 2` = due livelli · `-I` = ignora

## FILE

**CREA FILE VUOTO**

```bash
touch file.txt
```

**COPIA FILE**

```bash
cp file.txt destinazione/
```

**SPOSTA FILE**

```bash
mv file.txt destinazione/
```

**RINOMINA FILE**

```bash
mv file.txt nuovo-nome.txt
```

**⚠️ ELIMINA FILE**

```bash
rm file.txt
```

**⚠️ ELIMINA TUTTI I FILE DI UN TIPO**

```bash
rm *.log
```

**ELIMINA CHIEDENDO CONFERMA**

```bash
rm -i file.txt
```

**IL FILE ESISTE?**

```bash
test -e file.txt && echo "esiste" || echo "non esiste"
```

**INFO SU UN FILE**

```bash
stat file.txt
```

**CHE TIPO DI FILE È (e fine riga CRLF/LF)**

```bash
file nome-file
```

**RINOMINA TANTI FILE (es. cambia estensione)**

```bash
for f in *.jpeg; do mv "$f" "${f%.jpeg}.jpg"; done
```

**HASH DI UN FILE (verificare download)**

```bash
shasum -a 256 file.apk
```

**FIRMA SHA-1 / SHA-256 DI UNA KEYSTORE (Firebase, Google Sign-In)**

```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android
```

**CONVERTI FINE RIGA DA WINDOWS (CRLF) A MAC (LF)**

```bash
sed -i '' 's/\r$//' file.command
```

## LEGGERE E SCRIVERE FILE

**LEGGI UN FILE**

```bash
cat file.txt
```

**LEGGI UN FILE LUNGO (scorrevole)**

```bash
less file.txt
```

`Spazio` pagina giù · `/parola` cerca · `q` esci

**PRIME / ULTIME RIGHE**

```bash
head -n 10 file.txt
tail -n 10 file.txt
```

**SEGUI UN FILE MENTRE CRESCE (log)**

```bash
tail -f log.txt
```

**SCRIVI IN UN FILE (sovrascrive)**

```bash
echo "testo" > file.txt
```

**AGGIUNGI IN FONDO A UN FILE**

```bash
echo "testo" >> file.txt
```

**SALVA L'OUTPUT DI UN COMANDO IN UN FILE**

```bash
comando > output.txt
```

**SALVA ANCHE GLI ERRORI**

```bash
comando > output.txt 2>&1
```

**SALVA OUTPUT E VEDILO A SCHERMO INSIEME**

```bash
comando | tee output.txt
```

**CONTA LE RIGHE DI UN FILE**

```bash
wc -l file.txt
```

**SOSTITUISCI UN TESTO IN UN FILE**

```bash
sed -i '' 's/vecchio/nuovo/g' file.txt
```

Su Mac serve `''` dopo `-i` (su Linux no)

**MODIFICA UN FILE NEL TERMINALE**

```bash
nano file.txt
```

`Ctrl+O` salva · `Ctrl+X` esci

**APRI UN FILE IN VS CODE / TEXTEDIT**

```bash
code file.txt
open -e file.txt
```

**LEGGI UN VALORE DA UN JSON (es. versione in package.json)**

```bash
node -p "require('./package.json').version"
```

oppure con `jq` (`brew install jq`): `jq -r .version package.json`

**CONFRONTA DUE FILE**

```bash
diff file1.txt file2.txt
```

## CERCARE

**TROVA FILE PER NOME (in tutte le sottocartelle)**

```bash
find . -name "*.keystore"
```

**TROVA FILE ESCLUDENDO NODE_MODULES**

```bash
find . -name "*.tsx" -not -path "*/node_modules/*"
```

**TROVA SOLO CARTELLE**

```bash
find . -type d -name "build"
```

**CERCA UN TESTO DENTRO I FILE**

```bash
grep "testo" file.txt
```

**CERCA IN TUTTO IL PROGETTO (con numero di riga)**

```bash
grep -rn "testo" src/
```

**CERCA ESCLUDENDO CARTELLE**

```bash
grep -rn "testo" . --exclude-dir={node_modules,ios/Pods,android/build}
```

**CERCA IGNORANDO MAIUSCOLE**

```bash
grep -rni "testo" src/
```

**SOLO I NOMI DEI FILE CHE CONTENGONO IL TESTO**

```bash
grep -rl "testo" src/
```

**CERCA OVUNQUE CON SPOTLIGHT (velocissimo)**

```bash
mdfind -name "nome-file"
```

**FILE PIÙ GRANDI DI UNA CARTELLA**

```bash
find . -type f -exec du -h {} + | sort -rh | head -10
```

**FILE MODIFICATI NELLE ULTIME 24 ORE**

```bash
find . -type f -mtime -1 -not -path "*/node_modules/*"
```

> Più veloce di grep: `rg` (ripgrep) · `brew install ripgrep` · `rg "testo"` ignora già node_modules e .gitignore

## PIPE E FILTRI

> Il simbolo `|` (pipe) passa il risultato di un comando al successivo.

**FILTRA L'OUTPUT**

```bash
comando | grep "parola"
```

**ESCLUDI RIGHE**

```bash
comando | grep -v "parola"
```

**PRIMI / ULTIMI N RISULTATI**

```bash
comando | head -5
comando | tail -5
```

**ORDINA**

```bash
comando | sort
```

`-r` al contrario · `-n` numerico · `-h` dimensioni (1K, 2M)

**TOGLI I DUPLICATI**

```bash
comando | sort -u
```

**CONTA LE RIGHE**

```bash
comando | wc -l
```

**PRENDI UNA COLONNA**

```bash
comando | awk '{print $2}'
```

**USA OGNI RIGA COME ARGOMENTO DI UN ALTRO COMANDO**

```bash
comando | xargs altro-comando
```

**SCORRI UN OUTPUT LUNGO**

```bash
comando | less
```

## APPUNTI

**COPIA NEGLI APPUNTI**

```bash
comando | pbcopy
```

**COPIA IL CONTENUTO DI UN FILE**

```bash
pbcopy < file.txt
```

**INCOLLA DAGLI APPUNTI**

```bash
pbpaste
```

**SALVA GLI APPUNTI IN UN FILE**

```bash
pbpaste > file.txt
```

**COPIA IL PERCORSO ATTUALE**

```bash
pwd | pbcopy
```

**COPIA LA CHIAVE SSH PUBBLICA**

```bash
pbcopy < ~/.ssh/id_ed25519.pub
```

## APRIRE COSE

**APRI LA CARTELLA ATTUALE NEL FINDER**

```bash
open .
```

**APRI UN FILE CON IL PROGRAMMA PREDEFINITO**

```bash
open file.pdf
```

**APRI CON UN PROGRAMMA PRECISO**

```bash
open -a "Visual Studio Code" .
```

**APRI LA CARTELLA IN VS CODE**

```bash
code .
```

Se non funziona: in VS Code palette → `Shell Command: Install 'code' command in PATH`

**APRI UN SITO**

```bash
open https://github.com
```

**MOSTRA UN FILE SELEZIONATO NEL FINDER**

```bash
open -R file.txt
```

**APRI XCODE CON IL PROGETTO**

```bash
open ios/*.xcworkspace
```

**APRI IMPOSTAZIONI DI SISTEMA**

```bash
open "x-apple.systempreferences:"
```

**MOSTRA I FILE NASCOSTI NEL FINDER**

`Cmd+Shift+.` (punto) nel Finder

## PERMESSI

**VEDI I PERMESSI**

```bash
ls -l file
```

`rwx` = lettura, scrittura, esecuzione · per proprietario, gruppo, altri

**RENDI ESEGUIBILE UNO SCRIPT**

```bash
chmod +x Salva.command
```

**RENDI ESEGUIBILI TUTTI GLI SCRIPT DI UNA CARTELLA**

```bash
chmod +x *.command *.sh
```

**PERMESSI TIPICI**

```bash
chmod 644 file
chmod 755 cartella-o-script
chmod 600 ~/.ssh/id_ed25519
```

644 file normali · 755 script e cartelle · 600 chiavi private

**CAMBIA PROPRIETARIO (es. file creati con sudo)**

```bash
sudo chown -R $(whoami) cartella
```

**ESEGUI COME AMMINISTRATORE**

```bash
sudo comando
```

**RIPETI L'ULTIMO COMANDO CON SUDO**

```bash
sudo !!
```

**SBLOCCA UN FILE SCARICATO ("sviluppatore non identificato")**

```bash
xattr -d com.apple.quarantine nome-file
```

oppure tasto destro sul file → **Apri** → **Apri**

**SBLOCCA UN'APP INTERA**

```bash
xattr -dr com.apple.quarantine /Applications/NomeApp.app
```

## PROCESSI

**PROCESSI ATTIVI (in tempo reale)**

```bash
top -o cpu
```

`q` per uscire · `-o mem` per ordinare per RAM

**PROCESSI CHE USANO PIÙ RAM (una volta sola)**

```bash
top -l 1 -o mem -n 10
```

**CERCA UN PROCESSO**

```bash
pgrep -fl node
```

**LISTA COMPLETA DEI PROCESSI**

```bash
ps aux | grep node
```

**CHIUDI UN PROCESSO PER ID**

```bash
kill 1234
```

**CHIUDI UN PROCESSO FORZATAMENTE**

```bash
kill -9 1234
```

**CHIUDI PER NOME**

```bash
pkill -f node
killall node
```

**CHIUDI TUTTI I PROCESSI JAVA (Gradle bloccato)**

```bash
pkill -f java
```

**RIAVVIA FINDER / DOCK (se bloccati)**

```bash
killall Finder
killall Dock
```

**LANCIA UN COMANDO IN BACKGROUND**

```bash
comando &
```

**LISTA / RIPORTA IN PRIMO PIANO I COMANDI IN BACKGROUND**

```bash
jobs
fg
```

`Ctrl+Z` sospende il comando attuale · `bg` lo fa continuare in background

## PORTE

**CHI STA USANDO UNA PORTA (es. 8081 di Metro)**

```bash
lsof -i :8081
```

**LIBERA UNA PORTA (chiude il processo)**

```bash
lsof -ti :8081 | xargs kill -9
```

**ALTERNATIVA RAPIDA CON NPX**

```bash
npx kill-port 8081
```

**TUTTE LE PORTE IN ASCOLTO**

```bash
lsof -iTCP -sTCP:LISTEN -n -P
```

| Porte tipiche | |
|---|---|
| `8081` | Metro bundler |
| `3000` | server Node / React |
| `5173` | Vite |
| `4000` | interfaccia emulatori Firebase |
| `8080` | emulatore Firestore |
| `9099` | emulatore Firebase Auth |
| `5037` | server adb |
| `5000` / `7000` | AirPlay del Mac (li occupa lui) |

> Se la porta 5000 è occupata: Impostazioni di Sistema → Generali → AirDrop e Handoff → disattiva **Ricevitore AirPlay**

## RETE

**INDIRIZZO IP DEL MAC (Wi-Fi)**

```bash
ipconfig getifaddr en0
```

**TUTTE LE INTERFACCE**

```bash
ifconfig
```

**IP PUBBLICO**

```bash
curl ifconfig.me
```

**PING**

```bash
ping -c 4 google.com
```

**UNA PORTA DI UN SERVER È RAGGIUNGIBILE?**

```bash
nc -zv google.com 443
```

**SVUOTA LA CACHE DNS**

```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

**CHIAMA UN'API**

```bash
curl https://api.github.com/users/octocat
```

**CHIAMATA POST CON JSON**

```bash
curl -X POST https://sito/api -H "Content-Type: application/json" -d '{"chiave":"valore"}'
```

**SOLO GLI HEADER DELLA RISPOSTA**

```bash
curl -I https://google.com
```

**PASSWORD DEL WI-FI SALVATO**

```bash
security find-generic-password -wa "NomeRete"
```

Chiede la password del Mac

**NOME DELLA RETE WI-FI ATTUALE**

```bash
networksetup -getairportnetwork en0
```

**VELOCITÀ DELLA CONNESSIONE**

```bash
networkQuality
```

## SISTEMA

**VERSIONE MACOS**

```bash
sw_vers
```

**PROCESSORE**

```bash
sysctl -n machdep.cpu.brand_string
```

**NUMERO DI CORE**

```bash
sysctl -n hw.ncpu
```

**RAM TOTALE (GB)**

```bash
echo "$(($(sysctl -n hw.memsize) / 1024 / 1024 / 1024)) GB"
```

**PRESSIONE SULLA MEMORIA (la RAM basta?)**

```bash
memory_pressure | tail -1
```

**INFO COMPLETE SULL'HARDWARE**

```bash
system_profiler SPHardwareDataType
```

**NUMERO DI SERIE DEL MAC**

```bash
system_profiler SPHardwareDataType | grep Serial
```

**DA QUANTO È ACCESO**

```bash
uptime
```

**NOME DEL MAC E UTENTE**

```bash
scutil --get ComputerName
whoami
```

**DATA E ORA**

```bash
date "+%Y-%m-%d %H:%M"
```

**AGGIORNAMENTI DI SISTEMA DISPONIBILI**

```bash
softwareupdate -l
```

**RIAVVIA / SPEGNI**

```bash
sudo shutdown -r now
sudo shutdown -h now
```

**BLOCCA IL MAC**

`Ctrl+Cmd+Q`

## BATTERIA

**CARICA ATTUALE E STATO**

```bash
pmset -g batt
```

**SALUTE, CICLI E CAPACITÀ**

```bash
system_profiler SPPowerDataType | grep -E "Cycle Count|Condition|Maximum Capacity"
```

| Voce | Significato |
|---|---|
| `Cycle Count` | cicli di carica (i MacBook recenti sono progettati per 1000) |
| `Condition` | `Normal` = ok · `Service Recommended` = da sostituire |
| `Maximum Capacity` | salute in % rispetto a nuova |

**APP CHE CONSUMANO ENERGIA**

```bash
top -o power -l 2 -n 10 -stats pid,command,power | tail -11
```

**TIENI ACCESO IL MAC (build lunghe, download)**

```bash
caffeinate -d
```

`Ctrl+C` per smettere · `caffeinate -t 3600` per un'ora · `caffeinate -i comando` finché dura il comando

## DISCO E SPAZIO

**SPAZIO LIBERO**

```bash
df -h /
```

**DIMENSIONE DI UNA CARTELLA**

```bash
du -sh cartella
```

**CARTELLE PIÙ PESANTI NELLA CARTELLA ATTUALE**

```bash
du -sh * | sort -rh | head -10
```

**CARTELLE PIÙ PESANTI (anche nascoste)**

```bash
du -sh .[!.]* * 2>/dev/null | sort -rh | head -10
```

**LISTA DISCHI**

```bash
diskutil list
```

**ESPELLI UN DISCO**

```bash
diskutil eject /Volumes/NomeDisco
```

**SVUOTA IL CESTINO**

```bash
rm -rf ~/.Trash/*
```

| Cartelle pesanti da sviluppatore | Si può cancellare? |
|---|---|
| `~/Library/Developer/Xcode/DerivedData` | sì, si rigenera |
| `~/Library/Developer/Xcode/Archives` | sì, ma perdi le build archiviate |
| `~/Library/Developer/Xcode/iOS DeviceSupport` | sì, si riscarica collegando l'iPhone |
| `~/Library/Developer/CoreSimulator` | usa `xcrun simctl delete unavailable` |
| `~/Library/Caches/CocoaPods` | sì (`pod cache clean --all`) |
| `~/.gradle/caches` | sì, si riscarica |
| `~/.npm` | sì (`npm cache clean --force`) |
| `~/Library/Caches/Homebrew` | sì (`brew cleanup`) |
| `node_modules` nei progetti vecchi | sì, si rigenera con `npm install` |

**TROVA TUTTI I NODE_MODULES E QUANTO PESANO**

```bash
find ~ -name node_modules -type d -prune -exec du -sh {} + 2>/dev/null | sort -rh | head -20
```

## VARIABILI DI AMBIENTE

**LEGGI UNA VARIABILE**

```bash
echo $JAVA_HOME
```

**LISTA TUTTE LE VARIABILI**

```bash
env
```

**PATH UNA VOCE PER RIGA**

```bash
echo $PATH | tr ':' '\n'
```

**IMPOSTA UNA VARIABILE SOLO PER QUESTA FINESTRA**

```bash
export NODE_ENV=production
```

**IMPOSTA UNA VARIABILE SOLO PER UN COMANDO**

```bash
NODE_ENV=production npm run build
```

**IMPOSTA UNA VARIABILE PERMANENTE**

Aggiungi la riga `export` in `~/.zshrc`, poi:

```bash
source ~/.zshrc
```

**AGGIUNGI UNA CARTELLA AL PATH IN MODO PERMANENTE (in ~/.zshrc)**

```bash
export PATH="$PATH:$HOME/Library/Android/sdk/platform-tools"
```

**TROVA IL PERCORSO DI JAVA**

```bash
/usr/libexec/java_home -V
```

| Variabili per Android / React Native (in ~/.zshrc) |
|---|
| `export JAVA_HOME=$(/usr/libexec/java_home -v 17)` |
| `export ANDROID_HOME=$HOME/Library/Android/sdk` |
| `export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools` |

## PROFILO E ALIAS

> `~/.zshrc` è uno script che parte a ogni apertura del Terminale: ci metti alias, funzioni e variabili.

**APRI IL PROFILO**

```bash
code ~/.zshrc
```

oppure `nano ~/.zshrc` · se non esiste viene creato

**RICARICA IL PROFILO DOPO LE MODIFICHE**

```bash
source ~/.zshrc
```

**ALIAS**

```bash
alias gs="git status -sb"
```

**FUNZIONE (per comandi con parametri)**

```bash
killport() { lsof -ti :$1 | xargs kill -9; }
```

**LISTA ALIAS**

```bash
alias
```

**ESEMPIO DI PROFILO DA SVILUPPATORE**

```bash
# Homebrew (Mac con chip Apple)
eval "$(/opt/homebrew/bin/brew shellenv)"

# Java e Android
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# Navigazione
alias ..="cd .."
alias ...="cd ../.."
alias ll="ls -lah"
alias dev="cd ~/progetti"

# Git
alias gs="git status -sb"
alias gl="git log --oneline --graph -20"
alias gp="git pull --rebase"

# React Native
alias metro="npx react-native start --reset-cache"
alias rnios="npx react-native run-ios"
alias rnandroid="npx react-native run-android"
alias pods="cd ios && pod install && cd .."
alias rnlog="adb logcat ReactNativeJS:V '*:S'"
alias rnrev="adb reverse tcp:8081 tcp:8081"
alias derived="rm -rf ~/Library/Developer/Xcode/DerivedData"

# Porte
killport() { lsof -ti :$1 | xargs kill -9; }

# Crea cartella ed entra
mkcd() { mkdir -p "$1" && cd "$1"; }
```

Poi scrivi solo `gs`, `metro`, `pods`, `killport 8081`...

## CRONOLOGIA

**COMANDI RECENTI**

```bash
history
```

**CERCA NEI COMANDI PASSATI**

`Ctrl+R` e scrivi una parte del comando · `Ctrl+R` di nuovo per il risultato precedente

**CERCA NELLA CRONOLOGIA**

```bash
history 0 | grep adb
```

**RIESEGUI L'ULTIMO COMANDO**

```bash
!!
```

**RIESEGUI IL COMANDO NUMERO N**

```bash
!42
```

**USA L'ULTIMO ARGOMENTO DEL COMANDO PRECEDENTE**

```bash
mkdir nuova-cartella
cd !$
```

oppure `Option+.` per incollarlo

## ZIP E DOWNLOAD

**CREA UNO ZIP**

```bash
zip -r archivio.zip cartella
```

**CREA UNO ZIP SENZA I FILE NASCOSTI DEL MAC**

```bash
zip -r archivio.zip cartella -x "*.DS_Store" -x "__MACOSX*"
```

**ESTRAI UNO ZIP**

```bash
unzip archivio.zip -d cartella
```

**CREA / ESTRAI UN .TAR.GZ**

```bash
tar -czf archivio.tar.gz cartella
tar -xzf archivio.tar.gz
```

**SCARICA UN FILE**

```bash
curl -LO https://sito/file.zip
```

**SCARICA CON UN NOME DIVERSO**

```bash
curl -L https://sito/file.zip -o nome.zip
```

## HOMEBREW

> Il gestore pacchetti del Mac (come `winget` su Windows).

**INSTALLA HOMEBREW**

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Alla fine segui le istruzioni **Next steps** (aggiungono brew al PATH)

**CERCA UN PROGRAMMA**

```bash
brew search nome
```

**INSTALLA UN PROGRAMMA DA TERMINALE**

```bash
brew install nome
```

**INSTALLA UN'APP CON INTERFACCIA**

```bash
brew install --cask nome
```

**AGGIORNA TUTTO**

```bash
brew update && brew upgrade
```

**PROGRAMMI DA AGGIORNARE**

```bash
brew outdated
```

**LISTA INSTALLATI**

```bash
brew list
```

**DISINSTALLA**

```bash
brew uninstall nome
```

**LIBERA SPAZIO**

```bash
brew cleanup
```

**CONTROLLA PROBLEMI**

```bash
brew doctor
```

**SALVA / REINSTALLA TUTTI I PROGRAMMI (nuovo Mac)**

```bash
brew bundle dump --file=~/Brewfile
brew bundle --file=~/Brewfile
```

| Pacchetti utili | Comando |
|---|---|
| Node (meglio con nvm) | `brew install node` |
| Watchman (React Native) | `brew install watchman` |
| CocoaPods | `brew install cocoapods` |
| JDK 17 (Android) | `brew install --cask zulu@17` |
| Git aggiornato | `brew install git` |
| GitHub CLI / GitLab CLI | `brew install gh` / `brew install glab` |
| scrcpy (schermo Android) | `brew install scrcpy` |
| tree | `brew install tree` |
| jq (leggere JSON) | `brew install jq` |
| ripgrep (ricerca veloce) | `brew install ripgrep` |
| VS Code | `brew install --cask visual-studio-code` |
| Android Studio | `brew install --cask android-studio` |

## SVILUPPO MOBILE

> I comandi completi sono nei manuali **React Native** e **ADB**. Qui quelli specifici del Mac.

**INSTALLA GLI STRUMENTI DI SVILUPPO APPLE (git, make...)**

```bash
xcode-select --install
```

**QUALE XCODE È IN USO**

```bash
xcode-select -p
```

**SCEGLI L'XCODE DA USARE (se ne hai più di uno)**

```bash
sudo xcode-select -s /Applications/Xcode.app
```

**VERSIONE DI XCODE**

```bash
xcodebuild -version
```

**ACCETTA LA LICENZA DI XCODE (dopo un aggiornamento)**

```bash
sudo xcodebuild -license accept
```

**LISTA SIMULATORI**

```bash
xcrun simctl list devices available
```

**APRI IL SIMULATORE**

```bash
open -a Simulator
```

**APRI UN LINK NEL SIMULATORE (test deep link)**

```bash
xcrun simctl openurl booted "schema://percorso"
```

**SCREENSHOT / VIDEO DEL SIMULATORE**

```bash
xcrun simctl io booted screenshot screen.png
xcrun simctl io booted recordVideo video.mp4
```

`Ctrl+C` per fermare il video

**DISINSTALLA L'APP DAL SIMULATORE**

```bash
xcrun simctl uninstall booted nome.pacchetto
```

**⚠️ RESETTA UN SIMULATORE (come nuovo)**

```bash
xcrun simctl erase "iPhone 16"
```

**ELIMINA I SIMULATORI NON PIÙ SUPPORTATI (libera spazio)**

```bash
xcrun simctl delete unavailable
```

**⚠️ CANCELLA LA CACHE DI XCODE**

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```

**LISTA IPHONE COLLEGATI**

```bash
xcrun xctrace list devices
```

**VERSIONE COCOAPODS**

```bash
pod --version
```

## UTILITY MACOS

**SCREENSHOT IN UN FILE**

```bash
screencapture -i screen.png
```

`-i` = selezioni tu l'area

**IMPEDISCI LO STOP (vedi anche Batteria)**

```bash
caffeinate -d
```

**LEGGI UN TESTO AD ALTA VOCE (utile a fine build)**

```bash
npx react-native run-ios; say "build finita"
```

**NOTIFICA A FINE COMANDO**

```bash
comando; osascript -e 'display notification "Finito" with title "Terminale"'
```

**SALVA GLI SCREENSHOT IN UNA CARTELLA DIVERSA**

```bash
mkdir -p ~/Pictures/Screenshots
defaults write com.apple.screencapture location ~/Pictures/Screenshots
killall SystemUIServer
```

**MOSTRA SEMPRE I FILE NASCOSTI NEL FINDER**

```bash
defaults write com.apple.finder AppleShowAllFiles -bool true
killall Finder
```

`false` per tornare come prima

**NON CREARE .DS_STORE SUI DISCHI DI RETE E USB**

```bash
defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool true
defaults write com.apple.desktopservices DSDontWriteUSBStores -bool true
```

**⚠️ ELIMINA TUTTI I .DS_STORE DI UNA CARTELLA**

```bash
find . -name ".DS_Store" -delete
```

## SCORCIATOIE DA TASTIERA

| Tasti | Azione |
|---|---|
| `Tab` | completa comando o percorso |
| `↑` / `↓` | comandi precedenti |
| `Ctrl+R` | cerca nella cronologia |
| `Ctrl+C` | interrompe il comando |
| `Ctrl+Z` | sospende il comando (`fg` per riprenderlo) |
| `Ctrl+D` | chiude la sessione (come `exit`) |
| `Cmd+K` | pulisce lo schermo |
| `Ctrl+L` | pulisce lo schermo (mantiene lo scorrimento) |
| `Ctrl+A` / `Ctrl+E` | inizio / fine riga |
| `Option+←` / `Option+→` | salta di parola |
| `Option+clic` | sposta il cursore nel punto cliccato |
| `Ctrl+U` | cancella tutta la riga |
| `Ctrl+W` | cancella la parola precedente |
| `Ctrl+K` | cancella dal cursore a fine riga |
| `Option+.` | incolla l'ultimo argomento del comando precedente |
| `Cmd+T` | nuova scheda |
| `Cmd+N` | nuova finestra |
| `Cmd+D` | dividi la finestra |
| `Cmd+1…9` | vai alla scheda N |
| `Cmd+Shift+[` / `Cmd+Shift+]` | scheda precedente / successiva |
| `Cmd++` / `Cmd+-` | ingrandisci / rimpicciolisci |
| `Cmd+F` | cerca nel testo del terminale |
| trascina un file | incolla il suo percorso |

> Se `Option+←` scrive simboli strani: Terminale → Impostazioni → Profili → Tastiera → spunta **Usa Opzione come tasto Meta**

## MAC VS POWERSHELL

| PowerShell | Mac |
|---|---|
| `ls -Force` | `ls -la` |
| `ni file` | `touch file` |
| `rm -r -fo cartella` | `rm -rf cartella` |
| `cp a b -Recurse` | `cp -R a b` |
| `cat file -Wait -Tail 20` | `tail -f file` |
| `Select-String testo` | `grep testo` |
| `gcm comando` | `which comando` |
| `$env:VAR = "x"` | `export VAR=x` |
| `$env:VAR` | `echo $VAR` |
| `ii .` / `explorer .` | `open .` |
| `Set-Clipboard` | `pbcopy` |
| `Get-Clipboard` | `pbpaste` |
| `Get-NetTCPConnection -LocalPort 8081` | `lsof -i :8081` |
| `Stop-Process -Id PID -Force` | `kill -9 PID` |
| `Get-Process` | `top` / `ps aux` |
| `.\script.ps1` | `./script.sh` |
| `.\gradlew` | `./gradlew` |
| `$PROFILE` | `~/.zshrc` |
| `winget install` | `brew install` |
| `ipconfig` | `ipconfig getifaddr en0` |
| `Compress-Archive` | `zip -r` |
| `Invoke-WebRequest -OutFile` | `curl -LO` |
| `powercfg /batteryreport` | `system_profiler SPPowerDataType` |
| `Get-ChildItem -Recurse -Filter` | `find . -name` |
| `Measure-Command { comando }` | `time comando` |

## PROBLEMI COMUNI

| Problema | Soluzione |
|---|---|
| `command not found` | programma non installato o non nel PATH: controlla `echo $PATH \| tr ':' '\n'` · `source ~/.zshrc` |
| `permission denied` su uno script | `chmod +x nome-script` |
| `permission denied` su una cartella | `sudo chown -R $(whoami) cartella` |
| `bad interpreter` / `^M` | fine riga di Windows: `sed -i '' 's/\r$//' file` · usa `.gitattributes` |
| "sviluppatore non identificato" | tasto destro → **Apri** · oppure `xattr -d com.apple.quarantine file` |
| `.command` lascia la finestra aperta | Terminale → Impostazioni → Profili → Shell → **Quando la shell esce: chiudi se uscita correttamente** |
| `code` non riconosciuto | VS Code → palette → `Shell Command: Install 'code' command in PATH` |
| `brew` non riconosciuto | `eval "$(/opt/homebrew/bin/brew shellenv)"` in `~/.zprofile` |
| `xcrun: error: invalid active developer path` | `xcode-select --install` (succede dopo gli aggiornamenti di macOS) |
| `Port 8081 already in use` | `lsof -ti :8081 \| xargs kill -9` |
| porta 5000 occupata | è AirPlay: disattiva **Ricevitore AirPlay** nelle impostazioni |
| `sed: invalid command code` | su Mac: `sed -i ''` invece di `sed -i` |
| il terminale "si blocca" su un comando | è in attesa di input: `q` per uscire o `Ctrl+C` |
| sei finito dentro `vim` | `Esc` poi scrivi `:q!` e Invio (esce senza salvare) · `:wq` salva ed esce |
| disco pieno | vedi [Disco e spazio](#disco-e-spazio) · DerivedData e simulatori sono i primi colpevoli |
| variabile impostata ma non vista | `source ~/.zshrc` o riapri il Terminale |
| password richiesta da sudo non si vede | è normale: scrivi e premi Invio |
