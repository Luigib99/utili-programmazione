# COMANDI ADB

> Tutti i comandi si lanciano dal terminale del PC (non da dentro `adb shell`).
> Su Windows usare `findstr` al posto di `grep`.
> Dove c'è `nome.pacchetto` metti l'id dell'app (es. `com.azienda.nomeapp`).

**INDICE**
[Setup](#setup) · [Connessione](#connessione) · [Shell](#shell) · [Info telefono](#info-telefono) · [Batteria](#batteria) · [Batteria OnePlus Oppo Realme](#batteria-oneplus-oppo-realme) · [Consumi e prestazioni](#consumi-e-prestazioni) · [Installare app](#installare-app) · [Gestire app](#gestire-app) · [Permessi](#permessi) · [Activity e intent](#activity-e-intent) · [Dati dell'app](#dati-dellapp) · [React Native](#react-native) · [Firebase](#firebase) · [Log](#log) · [Crash e bug report](#crash-e-bug-report) · [Rete](#rete) · [Test di sistema](#test-di-sistema) · [Schermo e registrazione](#schermo-e-registrazione) · [File](#file) · [Input](#input) · [Impostazioni rapide](#impostazioni-rapide) · [Debug grafico](#debug-grafico) · [Bloatware](#bloatware) · [Riavvio e recovery](#riavvio-e-recovery) · [Emulatore](#emulatore) · [Problemi comuni](#problemi-comuni) · [Modalita sviluppatore](#modalita-sviluppatore)

## SETUP

**VERIFICA CHE ADB SIA INSTALLATO**

```bash
adb version
```

**PERCORSO ADB**

WINDOWS: `%LOCALAPPDATA%\Android\Sdk\platform-tools`
MAC: `~/Library/Android/sdk/platform-tools`

**AGGIUNGI ADB AL PATH (MAC, in ~/.zshrc)**

```bash
export PATH="$PATH:$HOME/Library/Android/sdk/platform-tools"
```

## CONNESSIONE

**LISTA DISPOSITIVI CONNESSI (con modello)**

```bash
adb devices -l
```

| Stato | Significato |
|---|---|
| `device` | connesso e pronto |
| `unauthorized` | accetta il popup "Consenti debug USB" sul telefono |
| `offline` | ricollega il cavo o riavvia adb |

**RIAVVIA ADB (se il telefono non viene visto)**

```bash
adb kill-server
adb start-server
```

**USA UN DISPOSITIVO SPECIFICO (se ne hai più di uno)**

```bash
adb -s seriale-dispositivo comando
```

**ASPETTA CHE IL TELEFONO SIA CONNESSO (utile dopo un riavvio)**

```bash
adb wait-for-device
```

**CONNETTI IN WIRELESS CON CAVO (tutti gli Android)**

```bash
adb tcpip 5555
adb connect ip-del-telefono:5555
```

IP del telefono → Impostazioni → Wi-Fi → rete connessa

**CONNETTI IN WIRELESS SENZA CAVO (Android 11+)**

Opzioni sviluppatore → Debug wireless → Accoppia con codice

```bash
adb pair ip:porta-accoppiamento
adb connect ip:porta-connessione
```

Le due porte sono diverse: quella di accoppiamento è nel popup, quella di connessione nella schermata Debug wireless

**DISCONNETTI WIRELESS**

```bash
adb disconnect
```

**TORNA ALLA MODALITÀ USB**

```bash
adb usb
```

## SHELL

**ENTRA NELLA SHELL DEL TELEFONO**

```bash
adb shell
```

**ESCI DALLA SHELL (torna al PC)**

```bash
exit
```

oppure `Ctrl+D` (`Ctrl+C` interrompe solo il comando, non esce · `130|` nel prompt = comando interrotto)

**ESEGUI UN SOLO COMANDO SENZA ENTRARE**

```bash
adb shell comando
```

**ESEGUI PIÙ COMANDI INSIEME**

```bash
adb shell "comando1 && comando2"
```

## INFO TELEFONO

**MARCA E MODELLO**

```bash
adb shell getprop ro.product.brand
adb shell getprop ro.product.model
```

**VERSIONE ANDROID ATTUALE**

```bash
adb shell getprop ro.build.version.release
```

**LIVELLO API ATTUALE (34 = A14, 35 = A15, 36 = A16)**

```bash
adb shell getprop ro.build.version.sdk
```

**VERSIONE ANDROID CON CUI È USCITO**

```bash
adb shell getprop ro.product.first_api_level
```

Se vuoto prova `ro.vendor.api_level`

**DATA ULTIMA PATCH DI SICUREZZA**

```bash
adb shell getprop ro.build.version.security_patch
```

**DATA DEL FIRMWARE INSTALLATO**

```bash
adb shell getprop ro.build.date
```

**ARCHITETTURA CPU (arm64-v8a, x86_64...)**

```bash
adb shell getprop ro.product.cpu.abi
```

**NUMERO DI SERIE**

```bash
adb shell getprop ro.serialno
```

**TUTTE LE PROPRIETÀ DEL SISTEMA**

```bash
adb shell getprop
```

**DA QUANTO TEMPO È ACCESO**

```bash
adb shell uptime
```

**DATA PRIMO AVVIO (si azzera con il ripristino di fabbrica)**

```bash
adb shell dumpsys package android | findstr firstInstallTime
```

* **IMEI** → digitare `*#06#` sul telefono, poi verificare la garanzia sul sito del produttore

## BATTERIA

**STATO BATTERIA COMPLETO**

```bash
adb shell dumpsys battery
```

| Voce | Significato |
|---|---|
| `level` | carica in % |
| `health` | 2 buona · 3 surriscaldata · 4 esaurita · 5 sovratensione · 6 guasto · 7 fredda |
| `status` | 2 in carica · 3 in scarica · 4 non in carica · 5 piena |
| `temperature` | decimi di grado (`341` = 34,1 °C) · ok sotto 40 °C |
| `voltage` | mV (3400 scarica → 4200/4400 piena) |
| `Charge counter` | µAh rimasti (`1242000` = 1242 mAh) |
| `Max charging current` | µA erogati (`500000` = 0,5 A porta PC · `3000000` = 3 A) |
| `Charging state` | 1 normale · 2 freddo · 3 caldo · 4 limitata · 5 adattiva |
| `Charging policy` | 1 predefinita · altri valori = ricarica adattiva o limitata |
| `Capacity level` | 1 critico · 2 basso · 3 normale · 4 alto · 5 piena |
| `PlugType` (OPLUS) | 1 caricatore · 2 USB · 4 wireless |
| `*HwStatus` (OPLUS) | 0 = nessun errore hardware |
| `+4d17h...` | tempo da quando è acceso |

**RIEPILOGO BATTERIA IN UN SOLO FILE**

```bash
adb shell cat /sys/class/power_supply/battery/uevent
```

**CICLI DI CARICA (Pixel e Android standard)**

```bash
adb shell cat /sys/class/power_supply/battery/cycle_count
```

**CAPACITÀ ATTUALE (µAh)**

```bash
adb shell cat /sys/class/power_supply/battery/charge_full
```

**CAPACITÀ DI FABBRICA (µAh)**

```bash
adb shell cat /sys/class/power_supply/battery/charge_full_design
```

**CORRENTE ISTANTANEA (quanto sta caricando/consumando)**

```bash
adb shell cat /sys/class/power_supply/battery/current_now
```

> **Salute batteria** = `charge_full` ÷ `charge_full_design` × 100
> 100–90% ottima · 90–80% usata · sotto 80% da sostituire

> **Stima capacità senza file** = `Charge counter` ÷ `level` (farla vicino al 100%)

> **Cicli normali** = circa 0,5–1 al giorno · un ciclo = 100% consumato, anche in più ricariche
> Molti cicli su telefono "nuovo" + garanzia scaduta = probabilmente usato e resettato

**LISTA FILE BATTERIA DISPONIBILI (se un comando non funziona)**

```bash
adb shell ls /sys/class/power_supply/battery/
```

**CERCA FILE CON I CICLI OVUNQUE**

```bash
adb shell "find /sys/class -iname '*cycle*' 2>/dev/null"
```

## BATTERIA ONEPLUS OPPO REALME

> Su questi telefoni i valori veri sono qui, non nella cartella standard.
> Nella cartella standard `charge_full` e `charge_full_design` possono essere uguali (entrambi = capacità attuale).

**LISTA FILE DISPONIBILI**

```bash
adb shell ls /sys/class/oplus_chg/battery/
```

**CICLI DI CARICA**

```bash
adb shell cat /sys/class/oplus_chg/battery/battery_cc
```

**SALUTE IN %**

```bash
adb shell cat /sys/class/oplus_chg/battery/battery_soh
```

**CAPACITÀ ATTUALE (mAh)**

```bash
adb shell cat /sys/class/oplus_chg/battery/battery_fcc
```

**CAPACITÀ DI FABBRICA (mAh)**

```bash
adb shell cat /sys/class/oplus_chg/battery/design_capacity
```

**CARICA RIMANENTE (mAh)**

```bash
adb shell cat /sys/class/oplus_chg/battery/battery_rm
```

**DATA FABBRICAZIONE E PRIMO USO BATTERIA (non si azzerano col reset, se compilati)**

```bash
adb shell cat /sys/class/oplus_chg/battery/battery_manu_date
adb shell cat /sys/class/oplus_chg/battery/battery_first_usage_date
```

> File vuoto = il firmware non lo compila · `Permission denied` = serve root

## CONSUMI E PRESTAZIONI

**APP CHE CONSUMANO PIÙ BATTERIA**

```bash
adb shell dumpsys batterystats | findstr /C:"Estimated power use" /C:"Uid"
```

**AZZERA STATISTICHE BATTERIA (per misurare da zero)**

```bash
adb shell dumpsys batterystats --reset
```

**TEMPERATURE E THROTTLING (0 = nessuna limitazione)**

```bash
adb shell dumpsys thermalservice
```

**SPAZIO DI ARCHIVIAZIONE LIBERO/USATO**

```bash
adb shell df -h /data
```

**SPAZIO OCCUPATO DA APP, FOTO, CACHE**

```bash
adb shell dumpsys diskstats
```

**RAM TOTALE E DISPONIBILE**

```bash
adb shell cat /proc/meminfo | findstr /C:"MemTotal" /C:"MemAvailable"
```

**RAM USATA DA UNA APP**

```bash
adb shell dumpsys meminfo nome.pacchetto
```

**PROCESSI CHE USANO PIÙ CPU**

```bash
adb shell top -n 1 -m 10
```

**CPU PER APP**

```bash
adb shell dumpsys cpuinfo
```

**FLUIDITÀ DELL'APP (frame lenti, jank)**

```bash
adb shell dumpsys gfxinfo nome.pacchetto
```

Guarda `Janky frames`: sotto il 5% va bene

**AZZERA STATISTICHE FRAME**

```bash
adb shell dumpsys gfxinfo nome.pacchetto reset
```

**TEMPO DI AVVIO DELL'APP (cold start)**

```bash
adb shell am force-stop nome.pacchetto
adb shell am start -W -n nome.pacchetto/.MainActivity
```

`TotalTime` = millisecondi per aprire l'app

## INSTALLARE APP

**INSTALLA APK**

```bash
adb install app.apk
```

**REINSTALLA MANTENENDO I DATI**

```bash
adb install -r app.apk
```

**INSTALLA VERSIONE PIÙ VECCHIA (downgrade)**

```bash
adb install -r -d app.apk
```

**INSTALLA CONCEDENDO TUTTI I PERMESSI**

```bash
adb install -g app.apk
```

**INSTALLA APK DI TEST**

```bash
adb install -t app.apk
```

**INSTALLA APK DIVISI (split apk)**

```bash
adb install-multiple base.apk split1.apk split2.apk
```

**INSTALLA UN AAB (serve bundletool)**

```bash
bundletool build-apks --bundle=app.aab --output=app.apks --connected-device
bundletool install-apks --apks=app.apks
```

**INSTALLA SU TUTTI I DISPOSITIVI CONNESSI (build React Native)**

```bash
npx react-native run-android
```

## GESTIRE APP

**DISINSTALLA APP**

```bash
adb uninstall nome.pacchetto
```

**DISINSTALLA MANTENENDO I DATI**

```bash
adb shell pm uninstall -k nome.pacchetto
```

**LISTA TUTTE LE APP**

```bash
adb shell pm list packages
```

**LISTA APP INSTALLATE DA TE (non di sistema)**

```bash
adb shell pm list packages -3
```

**LISTA APP DI SISTEMA / DISATTIVATE**

```bash
adb shell pm list packages -s
adb shell pm list packages -d
```

**CERCA PACCHETTO INSTALLATO**

```bash
adb shell pm list packages | findstr parola
```

**VERSIONE INSTALLATA DI UN'APP**

```bash
adb shell dumpsys package nome.pacchetto | findstr /C:"versionName" /C:"versionCode"
```

**DATA INSTALLAZIONE E AGGIORNAMENTO APP**

```bash
adb shell dumpsys package nome.pacchetto | findstr /C:"firstInstallTime" /C:"lastUpdateTime"
```

**ESTRAI L'APK DI UN'APP INSTALLATA**

```bash
adb shell pm path nome.pacchetto
adb pull percorso-restituito/base.apk
```

**CANCELLA DATI E CACHE DELL'APP (come appena installata)**

```bash
adb shell pm clear nome.pacchetto
```

**CHIUDI APP FORZATAMENTE**

```bash
adb shell am force-stop nome.pacchetto
```

**SIMULA CHIUSURA DA PARTE DEL SISTEMA (test ripristino stato)**

```bash
adb shell am kill nome.pacchetto
```

L'app deve essere in background

**AVVIA APP (senza sapere l'activity)**

```bash
adb shell monkey -p nome.pacchetto 1
```

**DISATTIVA / RIATTIVA APP**

```bash
adb shell pm disable-user nome.pacchetto
adb shell pm enable nome.pacchetto
```

## PERMESSI

**LISTA PERMESSI DI UN'APP (granted=true = concesso)**

```bash
adb shell dumpsys package nome.pacchetto | findstr permission
```

**CONCEDI PERMESSO**

```bash
adb shell pm grant nome.pacchetto android.permission.NOME
```

**REVOCA PERMESSO (l'app viene chiusa)**

```bash
adb shell pm revoke nome.pacchetto android.permission.NOME
```

**AZZERA TUTTI I PERMESSI (tornano a "chiedi")**

```bash
adb shell pm reset-permissions nome.pacchetto
```

| Permessi più usati | |
|---|---|
| Fotocamera | `android.permission.CAMERA` |
| Notifiche (Android 13+) | `android.permission.POST_NOTIFICATIONS` |
| Posizione | `android.permission.ACCESS_FINE_LOCATION` |
| Microfono | `android.permission.RECORD_AUDIO` |
| Foto (Android 13+) | `android.permission.READ_MEDIA_IMAGES` |
| Contatti | `android.permission.READ_CONTACTS` |

## ACTIVITY E INTENT

**QUALE APP/SCHERMATA È APERTA ORA**

```bash
adb shell dumpsys activity activities | findstr mResumedActivity
```

**AVVIA UNA ACTIVITY SPECIFICA**

```bash
adb shell am start -n nome.pacchetto/.MainActivity
```

**TESTA UN DEEP LINK**

```bash
adb shell am start -a android.intent.action.VIEW -d "schema://percorso"
```

**TESTA UN DEEP LINK SU UN'APP PRECISA**

```bash
adb shell am start -a android.intent.action.VIEW -d "https://sito.it/percorso" nome.pacchetto
```

**STATO VERIFICA APP LINKS (Android 12+)**

```bash
adb shell pm get-app-links nome.pacchetto
```

`verified` = ok · `none` o `1024` = file assetlinks.json non valido

**RIVERIFICA APP LINKS**

```bash
adb shell pm verify-app-links --re-verify nome.pacchetto
```

**APRI UN URL NEL BROWSER**

```bash
adb shell am start -a android.intent.action.VIEW -d "https://google.com"
```

**CONDIVIDI UN TESTO (apre il menu condividi)**

```bash
adb shell am start -a android.intent.action.SEND -t text/plain --es android.intent.extra.TEXT "ciao"
```

**INVIA UN BROADCAST**

```bash
adb shell am broadcast -a nome.azione
```

## DATI DELL'APP

> Funziona solo con app in modalità **debug** (non release).

**ENTRA NELLA CARTELLA DATI DELL'APP**

```bash
adb shell run-as nome.pacchetto
```

**LISTA FILE DELL'APP**

```bash
adb shell run-as nome.pacchetto ls -R
```

**LEGGI SHAREDPREFERENCES**

```bash
adb shell run-as nome.pacchetto ls shared_prefs
adb shell run-as nome.pacchetto cat shared_prefs/nome-file.xml
```

**SCARICA UN DATABASE SUL PC**

```bash
adb exec-out run-as nome.pacchetto cat databases/nome-db > nome-db.db
```

AsyncStorage di React Native = `databases/RKStorage` (apribile con DB Browser for SQLite)

**SVUOTA SOLO LA CACHE**

```bash
adb shell run-as nome.pacchetto rm -rf cache/*
```

## REACT NATIVE

**COLLEGA IL TELEFONO AL METRO DEL PC**

```bash
adb reverse tcp:8081 tcp:8081
```

**COLLEGA A UN SERVER LOCALE (es. backend su porta 3000)**

```bash
adb reverse tcp:3000 tcp:3000
```

**LISTA PORTE COLLEGATE**

```bash
adb reverse --list
```

**RIMUOVI TUTTI I COLLEGAMENTI**

```bash
adb reverse --remove-all
```

**APRI DEV MENU**

```bash
adb shell input keyevent 82
```

**RICARICA L'APP (doppia R)**

```bash
adb shell input text "RR"
```

**AVVIA IN MODALITÀ RELEASE (test prima della pubblicazione)**

```bash
npx react-native run-android --mode=release
```

## FIREBASE

**COLLEGA AGLI EMULATORI FIREBASE**

```bash
adb reverse tcp:9099 tcp:9099
adb reverse tcp:8080 tcp:8080
adb reverse tcp:9199 tcp:9199
```

9099 Auth · 8080 Firestore · 9199 Storage · 4000 interfaccia web

**ATTIVA DEBUG ANALYTICS (eventi visibili in DebugView)**

```bash
adb shell setprop debug.firebase.analytics.app nome.pacchetto
```

**DISATTIVA DEBUG ANALYTICS**

```bash
adb shell setprop debug.firebase.analytics.app .none.
```

**LOG DETTAGLIATI ANALYTICS**

```bash
adb shell setprop log.tag.FA VERBOSE
adb logcat -s FA FA-SVC
```

**LOG CRASHLYTICS**

```bash
adb shell setprop log.tag.FirebaseCrashlytics DEBUG
adb logcat -s FirebaseCrashlytics
```

**LOG NOTIFICHE PUSH (FCM)**

```bash
adb logcat -s FirebaseMessaging
```

## LOG

**TUTTI I LOG**

```bash
adb logcat
```

**PULISCI I LOG (prima di riprodurre un bug)**

```bash
adb logcat -c
```

**SOLO ERRORI**

```bash
adb logcat *:E
```

| Livelli | |
|---|---|
| `V` | verbose (tutto) |
| `D` | debug |
| `I` | info |
| `W` | warning |
| `E` | errori |
| `F` | fatali |
| `S` | silenzio (nasconde) |

**SOLO CONSOLE.LOG DI REACT NATIVE**

```bash
adb logcat ReactNativeJS:V *:S
```

**SOLO LOG DELLA TUA APP**

WINDOWS (PowerShell):

```powershell
adb logcat --pid=(adb shell pidof nome.pacchetto)
```

MAC:

```bash
adb logcat --pid=$(adb shell pidof nome.pacchetto)
```

**FILTRA PER PAROLA**

```bash
adb logcat | findstr parola
```

**LOG CON DATA E ORA**

```bash
adb logcat -v time
```

**SALVA I LOG IN UN FILE (e termina)**

```bash
adb logcat -d > log.txt
```

**SALVA I LOG IN UN FILE MENTRE SUCCEDONO**

```bash
adb logcat > log.txt
```

`Ctrl+C` per fermare

## CRASH E BUG REPORT

**SOLO I CRASH**

```bash
adb logcat -b crash
```

**ULTIMO CRASH (in un colpo solo)**

```bash
adb logcat -b crash -d
```

**CRASH NATIVI E ANR RECENTI**

```bash
adb shell dumpsys dropbox --print | more
```

**BUG REPORT COMPLETO (zip con tutto, da allegare ai ticket)**

```bash
adb bugreport bugreport.zip
```

Ci mette qualche minuto

## RETE

**SEGNALE WI-FI (-50/-60 ottimo · sotto -80 debole)**

```bash
adb shell dumpsys wifi | findstr "RSSI"
```

**INDIRIZZO IP DEL TELEFONO**

```bash
adb shell ip addr show wlan0
```

**ATTIVA / DISATTIVA WI-FI**

```bash
adb shell svc wifi enable
adb shell svc wifi disable
```

**ATTIVA / DISATTIVA DATI MOBILI**

```bash
adb shell svc data enable
adb shell svc data disable
```

**TEST CONNESSIONE**

```bash
adb shell ping -c 4 google.com
```

**IMPOSTA PROXY (es. Charles, Proxyman, mitmproxy)**

```bash
adb shell settings put global http_proxy ip-del-pc:8888
```

**RIMUOVI PROXY**

```bash
adb shell settings put global http_proxy :0
```

Se resti senza internet dopo i test, il proxy è ancora attivo

**INOLTRA UNA PORTA DAL PC AL TELEFONO (contrario di reverse)**

```bash
adb forward tcp:porta-pc tcp:porta-telefono
```

## TEST DI SISTEMA

**SIMULA BATTERIA A UN LIVELLO**

```bash
adb shell dumpsys battery set level 5
```

**SIMULA CAVO STACCATO**

```bash
adb shell dumpsys battery unplug
```

**TORNA AI VALORI REALI DELLA BATTERIA**

```bash
adb shell dumpsys battery reset
```

**FORZA MODALITÀ DOZE (test notifiche e lavori in background)**

```bash
adb shell dumpsys battery unplug
adb shell dumpsys deviceidle force-idle
```

**ESCI DA DOZE**

```bash
adb shell dumpsys deviceidle unforce
adb shell dumpsys battery reset
```

**METTI UN'APP IN STANDBY (app inutilizzata)**

```bash
adb shell am set-inactive nome.pacchetto true
```

**CONTROLLA SE L'APP È IN STANDBY**

```bash
adb shell am get-inactive nome.pacchetto
```

**MODALITÀ AEREO (Android 11+)**

```bash
adb shell cmd connectivity airplane-mode enable
adb shell cmd connectivity airplane-mode disable
```

## SCHERMO E REGISTRAZIONE

**SCREENSHOT**

```bash
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png
```

**SCREENSHOT DIRETTO (solo Mac o cmd, in PowerShell si corrompe)**

```bash
adb exec-out screencap -p > screen.png
```

**REGISTRA SCHERMO (Ctrl+C per fermare · max 3 min)**

```bash
adb shell screenrecord /sdcard/video.mp4
adb pull /sdcard/video.mp4
```

**REGISTRA CON DURATA E QUALITÀ**

```bash
adb shell screenrecord --time-limit 30 --bit-rate 8000000 /sdcard/video.mp4
```

`--time-limit` secondi · `--bit-rate` qualità (8000000 = 8 Mbps)

**CANCELLA IL FILE DAL TELEFONO DOPO**

```bash
adb shell rm /sdcard/video.mp4
```

**RISOLUZIONE E DENSITÀ SCHERMO**

```bash
adb shell wm size
adb shell wm density
```

**SIMULA UNO SCHERMO DIVERSO (test layout)**

```bash
adb shell wm size 1080x1920
adb shell wm density 420
```

**RIPRISTINA SCHERMO ORIGINALE**

```bash
adb shell wm size reset
adb shell wm density reset
```

> Per vedere lo schermo del telefono sul PC e controllarlo col mouse: **scrcpy** (github.com/Genymobile/scrcpy)

## FILE

**COPIA FILE DAL PC AL TELEFONO**

```bash
adb push file.txt /sdcard/Download/
```

**COPIA FILE DAL TELEFONO AL PC**

```bash
adb pull /sdcard/Download/file.txt .
```

**COPIA UNA CARTELLA INTERA (es. tutte le foto)**

```bash
adb pull /sdcard/DCIM/Camera ./foto
```

**LISTA FILE IN UNA CARTELLA**

```bash
adb shell ls -la /sdcard/Download
```

**CANCELLA UN FILE**

```bash
adb shell rm /sdcard/Download/file.txt
```

**FAI VEDERE UN FILE NELLA GALLERIA (dopo un push)**

```bash
adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Download/foto.jpg
```

| Cartelle utili | |
|---|---|
| `/sdcard/` | memoria interna |
| `/sdcard/Download/` | download |
| `/sdcard/DCIM/Camera/` | foto e video |
| `/sdcard/Pictures/Screenshots/` | screenshot |
| `/data/local/tmp/` | cartella temporanea (sempre scrivibile) |

## INPUT

**SCRIVI TESTO NEL CAMPO ATTIVO (spazi = %s)**

```bash
adb shell input text "ciao%smondo"
```

**TOCCA UN PUNTO DELLO SCHERMO**

```bash
adb shell input tap 500 1200
```

**SCORRI (x1 y1 x2 y2 durata-ms)**

```bash
adb shell input swipe 500 1500 500 500 300
```

**PRESSIONE PROLUNGATA (swipe fermo)**

```bash
adb shell input swipe 500 1200 500 1200 1000
```

**PREMI UN TASTO**

```bash
adb shell input keyevent numero
```

| Tasti | |
|---|---|
| `3` | Home |
| `4` | Indietro |
| `24` / `25` | Volume su / giù |
| `26` | Power |
| `66` | Invio |
| `67` | Cancella |
| `82` | Menu (Dev Menu RN) |
| `187` | App recenti |
| `223` / `224` | Spegni / accendi schermo |

* **TROVA LE COORDINATE** → Opzioni sviluppatore → attiva **Posizione puntatore**

## IMPOSTAZIONI RAPIDE

**APRI IMPOSTAZIONI**

```bash
adb shell am start -a android.settings.SETTINGS
```

**APRI OPZIONI SVILUPPATORE**

```bash
adb shell am start -a android.settings.APPLICATION_DEVELOPMENT_SETTINGS
```

**APRI INFO DI UN'APP**

```bash
adb shell am start -a android.settings.APPLICATION_DETAILS_SETTINGS -d package:nome.pacchetto
```

**TEMA SCURO / CHIARO**

```bash
adb shell cmd uimode night yes
adb shell cmd uimode night no
```

**DIMENSIONE CARATTERI (1.0 normale · 1.3 grande · test accessibilità)**

```bash
adb shell settings put system font_scale 1.3
```

**CAMBIA LINGUA DELL'APP (Android 13+)**

```bash
adb shell cmd locale set-app-locales nome.pacchetto --locales en-US
```

**SCHERMO SEMPRE ACCESO MENTRE È IN CARICA**

```bash
adb shell svc power stayon usb
```

`true` sempre · `false` disattiva

**TIMEOUT SCHERMO (millisecondi · 600000 = 10 min)**

```bash
adb shell settings put system screen_off_timeout 600000
```

**LUMINOSITÀ (0–255)**

```bash
adb shell settings put system screen_brightness 200
```

**DISATTIVA ANIMAZIONI (test più veloci · rimetti 1 per riattivare)**

```bash
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
```

**LEGGI UN'IMPOSTAZIONE**

```bash
adb shell settings get system nome-impostazione
```

## DEBUG GRAFICO

**MOSTRA I TOCCHI SULLO SCHERMO (utile nelle registrazioni)**

```bash
adb shell settings put system show_touches 1
```

`0` per disattivare

**MOSTRA I BORDI DEI LAYOUT**

```bash
adb shell setprop debug.layout true
adb shell service call activity 1599295570
```

`false` per disattivare

**MOSTRA OVERDRAW (zone disegnate più volte)**

```bash
adb shell setprop debug.hwui.overdraw show
```

`false` per disattivare · riapri l'app

**BARRE DI RENDERING GPU**

```bash
adb shell setprop debug.hwui.profile visual_bars
```

`false` per disattivare · riapri l'app

## BLOATWARE

> ⚠️ Rimuovere app di sistema può rompere il telefono. Rimuovi solo app che conosci.
> Non serve root e si può sempre annullare. Un ripristino di fabbrica le riporta tutte.

**RIMUOVI APP DI SISTEMA (per l'utente attuale)**

```bash
adb shell pm uninstall --user 0 nome.pacchetto
```

**RIPRISTINA APP RIMOSSA**

```bash
adb shell cmd package install-existing nome.pacchetto
```

**ALTERNATIVA PIÙ SICURA: SOLO DISATTIVARLA**

```bash
adb shell pm disable-user --user 0 nome.pacchetto
```

## RIAVVIO E RECOVERY

**RIAVVIA TELEFONO**

```bash
adb reboot
```

**RIAVVIA IN RECOVERY**

```bash
adb reboot recovery
```

**RIAVVIA IN BOOTLOADER (fastboot)**

```bash
adb reboot bootloader
```

**INSTALLA UN AGGIORNAMENTO OTA (dalla recovery → "Apply update from ADB")**

```bash
adb sideload aggiornamento.zip
```

**SPEGNI**

```bash
adb shell reboot -p
```

## EMULATORE

**LISTA EMULATORI**

```bash
emulator -list-avds
```

**AVVIA EMULATORE**

```bash
emulator -avd nome-emulatore
```

**AVVIA EMULATORE PULITO (cancella i dati)**

```bash
emulator -avd nome-emulatore -wipe-data
```

**SPEGNI EMULATORE**

```bash
adb -s emulator-5554 emu kill
```

**SIMULA POSIZIONE GPS (longitudine latitudine)**

```bash
adb emu geo fix 11.2558 43.7696
```

**SIMULA SMS IN ARRIVO**

```bash
adb emu sms send 3331234567 "codice 123456"
```

**PERMESSI DI ROOT (solo emulatori senza Play Store)**

```bash
adb root
adb unroot
```

> `emulator` si trova in `Sdk/emulator` · dall'emulatore il PC si raggiunge con l'IP `10.0.2.2`

## PROBLEMI COMUNI

| Problema | Soluzione |
|---|---|
| `no devices/emulators found` | ricollega il cavo · usa un cavo dati (non solo ricarica) · `adb kill-server` |
| `unauthorized` | sblocca il telefono e accetta il popup · se non compare: Opzioni sviluppatore → Revoca autorizzazioni debug USB |
| `more than one device` | usa `adb -s seriale` |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | firma diversa: `adb uninstall nome.pacchetto` e reinstalla |
| `INSTALL_FAILED_VERSION_DOWNGRADE` | usa `adb install -r -d` |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` | libera spazio |
| `INSTALL_FAILED_USER_RESTRICTED` (Xiaomi/OPPO) | Opzioni sviluppatore → attiva **Installa tramite USB** |
| `Permission denied` | il file richiede root: non si può leggere |
| `run-as: package not debuggable` | l'app è in release: usa la build debug |
| App RN bianca o "Unable to load script" | `adb reverse tcp:8081 tcp:8081` e Metro avviato |
| Niente internet dopo i test | `adb shell settings put global http_proxy :0` |
| Wireless si disconnette | il telefono e il PC devono essere sulla stessa rete · riaccoppia |

## MODALITA SVILUPPATORE

* **ATTIVARLA** → Impostazioni → Info sul telefono → tocca 7 volte **Numero build**
  * OnePlus/OPPO/Realme: Info sul dispositivo → Versione → **Numero build**
  * Samsung: Info sul telefono → Informazioni software → **Numero build**
  * Xiaomi: tocca 7 volte **Versione MIUI/HyperOS**

* **TROVARLA** → cerca "sviluppatore" nelle Impostazioni
  * OnePlus/OPPO: Impostazioni aggiuntive → Opzioni sviluppatore
  * Pixel: Sistema → Opzioni sviluppatore

**VOCI UTILI DENTRO**
  * **Debug USB** → necessario per adb
  * **Debug wireless** → adb senza cavo
  * **Installa tramite USB** → necessario su Xiaomi/OPPO per `adb install`
  * **Rimani attivo** → schermo acceso durante la carica
  * **Posizione puntatore** → coordinate per `input tap`
  * **Revoca autorizzazioni debug USB** → se il PC non viene più riconosciuto
