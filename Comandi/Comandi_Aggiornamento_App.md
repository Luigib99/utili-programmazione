# COMANDI AGGIORNAMENTO APP

> Solo i comandi per cambiare versione e creare i file da caricare sugli store.
> I passaggi su Play Console e App Store Connect sono in **Istruzioni/Store mobile**.
> I comandi si lanciano dalla **cartella principale del progetto** (dove c'è `package.json`).
> `gradlew`: su Windows `.\gradlew` · su Mac `./gradlew`

**INDICE**
[Prima di iniziare](#prima-di-iniziare) · [Versione](#versione) · [Android - AAB](#android---aab) · [Android - APK](#android---apk) · [Android - Firma](#android---firma) · [iOS - Build](#ios---build) · [Dopo la pubblicazione](#dopo-la-pubblicazione)

## PRIMA DI INIZIARE

**PROVA L'APP IN RELEASE SU ANDROID**

```bash
npx react-native run-android --mode=release
```

**PROVA L'APP IN RELEASE SU IOS**

```bash
npx react-native run-ios --mode Release
```

**AGGIORNA LE LIBRERIE NATIVE IOS**

```bash
npm install
cd ios
pod install
cd ..
```

## VERSIONE

**AGGIORNARE LA VERSIONE IN PACKAGE.JSON**

| Comando | Da → a | Quando |
|---|---|---|
| `npm version prerelease --preid=beta` | 1.2.3 → 1.2.4-beta.0 | versioni di test |
| `npm version patch` | 1.2.3 → 1.2.4 | bug fix rapidi |
| `npm version minor` | 1.2.3 → 1.3.0 | nuove funzioni |
| `npm version major` | 1.2.3 → 2.0.0 | rivoluzione totale |

> ⚠️ `npm version` crea da solo un commit e un tag git (serve avere tutto già salvato). Con `--no-git-tag-version` non crea il commit.
> ⚠️ Apple **rifiuta** versioni con lettere come `1.2.4-beta.0`: su iOS la Version deve essere solo numeri.

**COPIARE LA VERSIONE DA PACKAGE.JSON AD ANDROID E IOS**

```bash
npx react-native-version --never-amend
```

**AUMENTARE SOLO IL NUMERO DI BUILD (ANDROID E IOS)**

```bash
npx react-native-version --increment-build --never-amend
```

**IOS: VERSIONE E BUILD CON AGVTOOL (solo Mac)**

```bash
cd ios
agvtool new-marketing-version 1.2.4
agvtool next-version -all
cd ..
```

**IOS: CONTROLLA VERSIONE E BUILD ATTUALI**

```bash
cd ios
agvtool what-marketing-version
agvtool what-version
cd ..
```

| Dove si trovano | Versione visibile | Numero di build |
|---|---|---|
| Android → `android/app/build.gradle` | `versionName` | `versionCode` (**sempre più alto**) |
| iOS → Xcode → target → General | **Version** | **Build** (**sempre più alto**) |

## ANDROID - AAB

> L'`.aab` è il file da caricare sul **Play Store**.

**1. PULISCI**

```bash
cd android
.\gradlew clean
cd ..
```

**2. CREA L'AAB**

```bash
npx react-native build-android --mode=release
```

**VARIANTI (se ci sono più ambienti)**

```bash
npm run android:release:ambiente:tipologia
```

oppure direttamente con Gradle:

```bash
cd android
.\gradlew bundleProdRelease
cd ..
```

**3. APRI LA CARTELLA DEL FILE**

```powershell
explorer android\app\build\outputs\bundle\release
```

Su Mac: `open android/app/build/outputs/bundle/release`

File: `app-release.aab` · con le varianti: `outputs/bundle/nomeVarianteRelease/`

## ANDROID - APK

> L'`.apk` serve per installazione diretta, test e clienti. **Non** va caricato sul Play Store.

**CREA L'APK**

```bash
cd android
.\gradlew assembleRelease
cd ..
```

**APRI LA CARTELLA DEL FILE**

```powershell
explorer android\app\build\outputs\apk\release
```

Su Mac: `open android/app/build/outputs/apk/release`

**INSTALLA L'APK SUL TELEFONO COLLEGATO**

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

`-r` = sostituisce l'app già installata mantenendo i dati

## ANDROID - FIRMA

**CREARE UNA KEYSTORE (solo la prima volta)**

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

> ⚠️ Fai un backup di keystore e password: senza, non potrai più aggiornare l'app. Non va mai committata.

**LEGGERE SHA-1 E SHA-256 (Firebase, Google Sign-In)**

```bash
cd android
.\gradlew signingReport
cd ..
```

## IOS - BUILD

> L'archivio si crea da **Xcode** (apri sempre il `.xcworkspace`):

| Azione | Dove |
|---|---|
| pulisci | **Product → Clean Build Folder** (`Cmd+Shift+K`) |
| dispositivo | in alto **Any iOS Device (arm64)** |
| archivia | **Product → Archive** |
| carica | Organizer → **Distribute App** |

**APRI IL PROGETTO IN XCODE**

```bash
xed ios
```

**SCREENSHOT DAL SIMULATORE (per la scheda dello store)**

```bash
xcrun simctl io booted screenshot screen.png
```

## DOPO LA PUBBLICAZIONE

**CONTROLLA CHE VERSIONE HA UN TELEFONO ANDROID**

```bash
adb shell dumpsys package nome.pacchetto | findstr /C:"versionName" /C:"versionCode"
```

Su Mac: `adb shell dumpsys package nome.pacchetto | grep -E "versionName|versionCode"`

**SALVA IL TAG DELLA VERSIONE SU GIT**

```bash
git push --tags
```
