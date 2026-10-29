# COMANDI REACT NATIVE

> I comandi si lanciano dalla **cartella principale del progetto** (dove c'è `package.json`).
> `gradlew` su Windows (PowerShell): `.\gradlew` · su Mac: `./gradlew` · nel vecchio cmd: `gradlew`
> ⚠️ = comando che cancella file in modo non recuperabile.

**INDICE**
[Avviare](#avviare) · [Pulizia](#pulizia) · [Porte](#porte) · [Versione](#versione) · [Build debug](#build-debug) · [Build release](#build-release) · [Firma](#firma) · [Varianti](#varianti) · [iOS](#ios) · [Dipendenze](#dipendenze) · [Controlli](#controlli) · [Problemi comuni](#problemi-comuni)

## AVVIARE

**AVVIA METRO (il server che serve il codice JS)**

```bash
npx react-native start
```

**AVVIA METRO SVUOTANDO LA CACHE**

```bash
npx react-native start --reset-cache
```

**INSTALLA E AVVIA L'APP DEBUG SU ANDROID**

```bash
npx react-native run-android
```

**SCEGLI IL DISPOSITIVO**

```bash
npx react-native run-android --list-devices
```

**COLLEGA IL TELEFONO A METRO (se l'app resta bianca)**

```bash
adb reverse tcp:8081 tcp:8081
```

**APRI IL DEV MENU**

```bash
adb shell input keyevent 82
```

**RICARICA L'APP**

In Metro premi `r` · sul telefono doppia `R` o Dev Menu → Reload

| Tasti nel terminale di Metro | |
|---|---|
| `r` | ricarica l'app |
| `d` | apre il Dev Menu |
| `j` | apre i DevTools |
| `Ctrl+C` | ferma Metro |

## PULIZIA

**DISINSTALLARE APP DEBUG**

```bash
adb shell pm list packages | findstr "nomeapp"
adb uninstall nome.pacchetto
```

Su Mac: `grep` al posto di `findstr`

**⚠️ RESETTARE NODE_MODULES**

```bash
npx rimraf node_modules
npm install
```

**⚠️ RESETTARE NODE_MODULES E LOCK (se le dipendenze sono incasinate)**

```bash
npx rimraf node_modules package-lock.json
npm install
```

**PULIRE GRADLE**

```bash
cd android
.\gradlew clean
cd ..
```

**FERMARE GRADLE BLOCCATO**

```bash
cd android
.\gradlew --stop
cd ..
```

**⚠️ PULIRE LE CARTELLE DI BUILD ANDROID (quando `clean` non basta)**

```bash
npx rimraf android/app/build android/build android/.gradle
```

**RESETTARE CACHE DI METRO**

```bash
npx react-native start --reset-cache
```

**PULIRE LA CACHE DI NPM**

```bash
npm cache clean --force
```

**⚠️ PULIZIA TOTALE (quando niente funziona)**

```bash
cd android
.\gradlew --stop
cd ..
npx rimraf node_modules android/app/build android/build android/.gradle
npm cache clean --force
npm install
npx react-native start --reset-cache
```

Poi in un altro terminale: `npx react-native run-android`

## PORTE

**TROVARE CHI USA LA PORTA 8081 (PowerShell)**

```powershell
Get-NetTCPConnection -LocalPort 8081 | Select-Object LocalPort, OwningProcess
```

**FERMARE IL PROCESSO SULLA PORTA (PowerShell)**

```powershell
Get-NetTCPConnection -LocalPort 8081 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

**FERMARE LA PORTA DA CMD**

```bash
netstat -a -n -o | find "8081"
taskkill /F /PID NumeroFinale
```

`NumeroFinale` = l'ultimo numero della riga (PID)

**FERMARE LA PORTA (qualsiasi sistema)**

```bash
npx kill-port 8081
```

**FERMARE LA PORTA SU MAC**

```bash
lsof -ti :8081 | xargs kill -9
```

## VERSIONE

> Va alzata **prima di ogni build da pubblicare**: gli store rifiutano una versione già caricata.

**DOVE SI CAMBIA SU ANDROID** → `android/app/build.gradle`

```gradle
defaultConfig {
    versionCode 12        // numero intero, +1 a ogni build caricata
    versionName "1.2.0"   // versione visibile agli utenti
}
```

**DOVE SI CAMBIA SU IOS** → Xcode → target → General → **Version** e **Build**

| Campo | Android | iOS | Regola |
|---|---|---|---|
| versione visibile | `versionName` | Version | `MAJOR.MINOR.PATCH` |
| numero build | `versionCode` | Build | sempre più alto del precedente |

**VERSIONE INSTALLATA SUL TELEFONO**

```bash
adb shell dumpsys package nome.pacchetto | findstr /C:"versionName" /C:"versionCode"
```

## BUILD DEBUG

**BUILDARE E AVVIARE DEBUG**

```bash
npx react-native run-android
```

**CREARE SOLO L'APK DEBUG (senza avviarlo)**

```bash
cd android
.\gradlew assembleDebug
cd ..
```

Il file si trova in `android/app/build/outputs/apk/debug/app-debug.apk`

**INSTALLARE L'APK DEBUG CREATO**

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## BUILD RELEASE

> Procedura: **1.** alza `versionCode` e `versionName` · **2.** pulisci · **3.** crea APK o AAB

**1. PULIRE PRIMA DI BUILDARE**

```bash
cd android
.\gradlew clean
cd ..
```

**2A. CREARE L'APK (da installare a mano o dare ai clienti, es. demo)**

```bash
cd android
.\gradlew assembleRelease
cd ..
```

Il file si trova in `android/app/build/outputs/apk/release/app-release.apk`

**2B. CREARE L'AAB (da caricare sul Play Store)**

```bash
cd android
.\gradlew bundleRelease
cd ..
```

Il file si trova in `android/app/build/outputs/bundle/release/app-release.aab`

**2C. CREARE L'AAB CON LA CLI DI REACT NATIVE (alternativa a 2B)**

```bash
npx react-native build-android --mode=release
```

**PROVARE LA RELEASE SUL TELEFONO (prima di pubblicare)**

```bash
npx react-native run-android --mode=release
```

**INSTALLARE L'APK RELEASE CREATO**

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Se dà `INSTALL_FAILED_UPDATE_INCOMPATIBLE` c'è la versione debug installata: disinstallala prima

**APRIRE LA CARTELLA DEI FILE CREATI**

```powershell
explorer android\app\build\outputs
```

Su Mac: `open android/app/build/outputs`

| File | Serve per |
|---|---|
| `.apk` | installazione diretta, test, clienti |
| `.aab` | Play Store (obbligatorio per pubblicare) |

## FIRMA

> Le build release devono essere firmate con la keystore dell'app. **Non committarla mai** e tienine un backup: se la perdi non puoi più aggiornare l'app (salvo Play App Signing).

**DOVE VA LA KEYSTORE** → `android/app/nome.keystore`

**DOVE VANNO LE PASSWORD** → `android/gradle.properties` (o `~/.gradle/gradle.properties` per non committarle)

```properties
MYAPP_UPLOAD_STORE_FILE=nome.keystore
MYAPP_UPLOAD_KEY_ALIAS=alias
MYAPP_UPLOAD_STORE_PASSWORD=password
MYAPP_UPLOAD_KEY_PASSWORD=password
```

**CREARE UNA NUOVA KEYSTORE**

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore nome.keystore -alias alias -keyalg RSA -keysize 2048 -validity 10000
```

**LEGGERE SHA-1 E SHA-256 (per Firebase e Google Sign-In)**

```bash
keytool -list -v -keystore android/app/nome.keystore -alias alias
```

**SHA DELLA KEYSTORE DEBUG**

```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android
```

**TUTTE LE FIRME DEL PROGETTO IN UN COLPO**

```bash
cd android
.\gradlew signingReport
cd ..
```

**CONTROLLARE CON CHE CHIAVE È FIRMATO UN APK**

```bash
keytool -printcert -jarfile android/app/build/outputs/apk/release/app-release.apk
```

## VARIANTI

> Solo se nel `build.gradle` ci sono i `productFlavors` (es. app, beta, demo con `applicationId` diversi).
> Il nome del comando è `assemble` / `bundle` + **Flavor** + **BuildType**.

**LISTA DEI COMANDI DISPONIBILI**

```bash
cd android
.\gradlew tasks --group build
cd ..
```

**AVVIARE UNA VARIANTE IN DEBUG**

```bash
npx react-native run-android --mode=betaDebug --appId=nome.pacchetto.beta
```

**CREARE APK / AAB DI UNA VARIANTE**

```bash
cd android
.\gradlew assembleDemoRelease
.\gradlew bundleProdRelease
cd ..
```

I file finiscono in `outputs/apk/nomeVariante/release/` e `outputs/bundle/nomeVarianteRelease/`

## IOS

> Solo su Mac.

**INSTALLARE I POD (dopo ogni `npm install` di librerie native)**

```bash
cd ios
pod install
cd ..
```

**AGGIORNARE I POD SE `pod install` DÀ ERRORE**

```bash
cd ios
pod install --repo-update
cd ..
```

**AVVIARE SU SIMULATORE**

```bash
npx react-native run-ios
```

**AVVIARE SU UN SIMULATORE SPECIFICO**

```bash
npx react-native run-ios --simulator "iPhone 16"
```

**LISTA SIMULATORI**

```bash
xcrun simctl list devices available
```

**AVVIARE SU IPHONE COLLEGATO**

```bash
npx react-native run-ios --device
```

**APRIRE IL PROGETTO IN XCODE (sempre il .xcworkspace, non il .xcodeproj)**

```bash
open ios/*.xcworkspace
```

**⚠️ REINSTALLARE I POD DA ZERO**

```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

**⚠️ CANCELLARE LA CACHE DI XCODE (DerivedData)**

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
```

In Xcode: **Product → Clean Build Folder** (`Cmd+Shift+K`)

**CREARE LA BUILD PER APP STORE / TESTFLIGHT** → Xcode → dispositivo **Any iOS Device** → **Product → Archive** → Distribute App

## DIPENDENZE

**INSTALLARE UNA LIBRERIA**

```bash
npm install nome-libreria
```

Su Mac, se la libreria ha codice nativo: `cd ios && pod install && cd ..` · poi ribuilda l'app (non basta ricaricare)

**VERSIONE DI REACT NATIVE DEL PROGETTO**

```bash
npm ls react-native
```

**LIBRERIE DA AGGIORNARE**

```bash
npm outdated
```

**VERIFICARE LE LIBRERIE NATIVE COLLEGATE**

```bash
npx react-native config
```

**GUIDA PER AGGIORNARE REACT NATIVE** → react-native-community.github.io/upgrade-helper

## CONTROLLI

**VERIFICARE CHE L'AMBIENTE SIA CONFIGURATO (Java, SDK, variabili)**

```bash
npx react-native doctor
```

**VERSIONE JAVA USATA**

```bash
java -version
```

**VERSIONE DI GRADLE**

```bash
cd android
.\gradlew --version
cd ..
```

**CONTROLLO DEL CODICE (lint)**

```bash
npx eslint .
```

**CONTROLLO TYPESCRIPT**

```bash
npx tsc --noEmit
```

**LANCIARE I TEST**

```bash
npm test
```

**BUILD ANDROID CON LOG DETTAGLIATI (per capire un errore)**

```bash
cd android
.\gradlew assembleDebug --stacktrace
cd ..
```

**CONFLITTI TRA LIBRERIE ANDROID**

```bash
cd android
.\gradlew app:dependencies
cd ..
```

**LOG DELL'APP DAL TELEFONO**

```bash
adb logcat ReactNativeJS:V *:S
```

**LOG DEI CRASH**

```bash
adb logcat -b crash
```

## PROBLEMI COMUNI

| Problema | Soluzione |
|---|---|
| app bianca / `Unable to load script` | Metro avviato? · `adb reverse tcp:8081 tcp:8081` |
| `Port 8081 already in use` | `npx kill-port 8081` |
| modifiche che non compaiono | `npx react-native start --reset-cache` |
| `gradlew non riconosciuto` | sei nella cartella `android`? · in PowerShell scrivi `.\gradlew` |
| `SDK location not found` | crea `android/local.properties` con `sdk.dir=C:\\Users\\nome\\AppData\\Local\\Android\\Sdk` |
| `Could not determine java version` / errori JDK | `npx react-native doctor` · controlla `JAVA_HOME` |
| build bloccata o file "in uso" | `.\gradlew --stop` e riprova |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | `adb uninstall nome.pacchetto` (firme diverse tra debug e release) |
| `No matching client found for package name` | `applicationId` diverso da quello in `google-services.json` |
| `Keystore file not found` | percorso della keystore sbagliato in `gradle.properties` |
| Play Store: versione già usata | alza `versionCode` |
| libreria nativa installata ma "null" | ribuilda l'app (`run-android` / `run-ios`) · su iOS `pod install` |
| iOS: `No such module` o errori dei pod | reinstalla i pod da zero e cancella DerivedData |
| `Unable to resolve module` | `npm install` · poi `--reset-cache` |
| niente funziona | [Pulizia totale](#pulizia) |
