# COMANDI IOS

> Solo su Mac. I comandi si lanciano dalla **cartella principale del progetto** (dove c'è `package.json`), salvo dove c'è `cd ios`.
> Apri sempre `ios/NomeApp.xcworkspace`, **non** il `.xcodeproj` (altrimenti i pod non vengono visti).
> ⚠️ = comando che cancella file in modo non recuperabile.

**INDICE**
[Installazione](#installazione) · [Runnare](#runnare) · [Pod](#pod) · [Pulizia](#pulizia) · [Simulatori](#simulatori) · [iPhone fisico](#iphone-fisico) · [Versione e build](#versione-e-build) · [Pubblicare su TestFlight](#pubblicare-su-testflight) · [Pubblicare su App Store](#pubblicare-su-app-store) · [Più ambienti](#più-ambienti) · [Xcode](#xcode) · [Problemi comuni](#problemi-comuni)

## INSTALLAZIONE

**INSTALLARE TUTTO (dopo un clone o un pull con nuove librerie)**

```bash
npm install
cd ios
pod install
cd ..
```

**IN UNA RIGA**

```bash
npm install && cd ios && pod install && cd ..
```

**PRIMA VOLTA SU UN MAC NUOVO**

```bash
xcode-select --install
brew install watchman cocoapods
sudo xcodebuild -license accept
```

Poi apri Xcode una volta per fargli installare i componenti mancanti

## RUNNARE

**AVVIARE SUL SIMULATORE PREDEFINITO**

```bash
npx react-native run-ios
```

**AVVIARE SU UN SIMULATORE SPECIFICO**

```bash
npx react-native run-ios --simulator "iPhone 16"
```

**AVVIARE SU IPHONE COLLEGATO**

```bash
npx react-native run-ios --device
```

**AVVIARE SU UN IPHONE PRECISO (se ne hai più di uno)**

```bash
npx react-native run-ios --device "Nome del tuo iPhone"
```

**AVVIARE IN RELEASE (test prima della pubblicazione)**

```bash
npx react-native run-ios --mode Release
```

**AVVIARE UNO SCHEMA DIVERSO (es. beta)**

```bash
npx react-native run-ios --scheme "NomeApp Beta"
```

**AVVIARE METRO A PARTE (se non parte da solo)**

```bash
npx react-native start --reset-cache
```

> Da Xcode: scegli dispositivo in alto → `Cmd+R` per avviare · `Cmd+.` per fermare

## POD

> I pod sono le librerie native di iOS. Vanno reinstallati ogni volta che aggiungi o aggiorni una libreria con codice nativo.

**INSTALLARE I POD**

```bash
cd ios
pod install
cd ..
```

**INSTALLARE AGGIORNANDO L'ELENCO DELLE LIBRERIE (se `pod install` non trova una versione)**

```bash
cd ios
pod install --repo-update
cd ..
```

**AGGIORNARE UN SOLO POD**

```bash
cd ios
pod update NomePod
cd ..
```

**RESET POD**

```bash
cd ios
pod deintegrate
pod install
cd ..
```

**VERSIONE DI COCOAPODS**

```bash
pod --version
```

**POD INSTALLATI E VERSIONI**

```bash
cat ios/Podfile.lock
```

> `Podfile.lock` va **committato**: garantisce le stesse versioni su tutti i Mac · `Pods/` invece no (va nel `.gitignore`)

## PULIZIA

**PULIZIA LEGGERA (prima prova sempre questa)**

In Xcode: **Product → Clean Build Folder** (`Cmd+Shift+K`)

**⚠️ CANCELLARE LA CACHE DI XCODE (DerivedData)**

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

Chiudi Xcode prima di lanciarlo

**⚠️ PULIZIA TOTALE**

```bash
cd ios
rm -rf ~/Library/Developer/Xcode/DerivedData/*
pod cache clean --all
pod deintegrate
rm -rf Podfile.lock Pods/ build/ NomeApp.xcworkspace
pod install --repo-update
cd ..
```

Cancellare `Podfile.lock` fa scaricare le versioni più recenti permesse: usalo solo se il reset normale non basta

**⚠️ PULIZIA TOTALE + JAVASCRIPT (quando niente funziona)**

```bash
rm -rf node_modules
npm cache clean --force
npm install
cd ios
rm -rf ~/Library/Developer/Xcode/DerivedData/*
pod deintegrate
pod install --repo-update
cd ..
npx react-native start --reset-cache
```

Poi in un altro terminale: `npx react-native run-ios`

**LIBERARE SPAZIO (Xcode occupa decine di GB)**

```bash
xcrun simctl delete unavailable
rm -rf ~/Library/Developer/Xcode/iOS\ DeviceSupport/*
```

Il secondo si riscarica da solo collegando l'iPhone

## SIMULATORI

**LISTA SIMULATORI**

```bash
xcrun simctl list devices available
```

**APRIRE IL SIMULATORE**

```bash
open -a Simulator
```

**TESTARE UN DEEP LINK**

```bash
xcrun simctl openurl booted "schema://percorso"
```

**DISINSTALLARE L'APP**

```bash
xcrun simctl uninstall booted nome.pacchetto
```

**SCREENSHOT / VIDEO**

```bash
xcrun simctl io booted screenshot screen.png
xcrun simctl io booted recordVideo video.mp4
```

`Ctrl+C` per fermare il video

**SIMULARE UNA NOTIFICA PUSH (file .apns con il contenuto)**

```bash
xcrun simctl push booted nome.pacchetto notifica.apns
```

**⚠️ RESETTARE UN SIMULATORE (come nuovo)**

```bash
xcrun simctl erase "iPhone 16"
```

| Scorciatoie del Simulatore | |
|---|---|
| `Cmd+D` | Dev Menu di React Native |
| `Cmd+R` | ricarica l'app |
| `Cmd+Shift+H` | Home |
| `Cmd+←` / `Cmd+→` | ruota |
| `Cmd+S` | screenshot |
| `Cmd+K` | mostra / nascondi tastiera |
| `Cmd+Shift+A` | tema chiaro / scuro |
| `Ctrl+Cmd+Z` | scuoti (Dev Menu) |

## IPHONE FISICO

**PRIMA VOLTA**

1. Collega l'iPhone e sbloccalo → **Autorizza** il computer
2. iPhone: Impostazioni → Privacy e sicurezza → **Modalità sviluppatore** → attiva e riavvia
3. Xcode: target → **Signing & Capabilities** → scegli il **Team**

**LISTA IPHONE COLLEGATI**

```bash
xcrun xctrace list devices
```

**APP NON AVVIABILE ("sviluppatore non attendibile")**

iPhone: Impostazioni → Generali → **VPN e gestione dispositivi** → tocca il profilo → **Autorizza**

**LOG DELL'IPHONE**

Xcode → **Window → Devices and Simulators** → seleziona l'iPhone → **Open Console**

## VERSIONE E BUILD

> iOS ha **due numeri** e vanno gestiti entrambi.

| Campo | Dove in Xcode | Regola |
|---|---|---|
| **Version** (`MARKETING_VERSION`) | target → General → Version | versione visibile, es. `1.2.0` · **solo numeri e punti** |
| **Build** (`CURRENT_PROJECT_VERSION`) | target → General → Build | numero intero, **più alto a ogni caricamento** |

> Con la stessa Version puoi caricare più build (1.2.0 build 1, 2, 3...). Una build già caricata non si può ricaricare.

**AGGIORNARE LA VERSIONE IN PACKAGE.JSON**

| Comando | Da → a | Quando |
|---|---|---|
| `npm version patch` | 1.2.3 → 1.2.4 | bug fix |
| `npm version minor` | 1.2.3 → 1.3.0 | nuove funzioni |
| `npm version major` | 1.2.3 → 2.0.0 | cambiamenti grossi |
| `npm version prerelease --preid=beta` | 1.2.3 → 1.2.4-beta.0 · poi 1.2.4-beta.1 | versioni di test |

> ⚠️ `npm version` cambia **solo** `package.json` e crea da solo un **commit e un tag git** (serve avere tutto già salvato). Per non creare commit: aggiungi `--no-git-tag-version`.
> ⚠️ **Non aggiorna Xcode**: se il progetto non ha uno script che copia la versione, va cambiata a mano in General (o con i comandi sotto).
> ⚠️ App Store e TestFlight **non accettano** versioni come `1.2.4-beta.0`: in Xcode la Version deve essere `1.2.4`. Il "beta" si distingue dal numero di Build o dall'app beta separata.

**IMPOSTARE LA VERSION DA TERMINALE**

```bash
cd ios
agvtool new-marketing-version 1.2.4
cd ..
```

**AUMENTARE LA BUILD DI 1 DA TERMINALE**

```bash
cd ios
agvtool next-version -all
cd ..
```

Funziona se in Build Settings **Versioning System** è `Apple Generic`

**LEGGERE VERSION E BUILD ATTUALI**

```bash
cd ios
agvtool what-marketing-version
agvtool what-version
cd ..
```

**ALLINEARE XCODE E ANDROID A PACKAGE.JSON IN UN COLPO**

```bash
npx react-native-version --never-amend
```

Legge la versione da `package.json` e la scrive in Xcode e in `build.gradle`

## PUBBLICARE SU TESTFLIGHT

**1. PREPARAZIONE**

- Salva tutto su git e fai un pull
- Aggiorna la versione (vedi sopra) e **controlla in Xcode** Version e Build
- Controlla di essere sullo **schema giusto** (in alto a sinistra) se hai più ambienti

**2. ARCHIVIARE**

- In alto seleziona **Any iOS Device (arm64)**
- Menu **Product → Archive**
- Attendi la fine della compilazione

**3. CARICARE**

- Si apre **Organizer**: seleziona l'archivio appena creato → **Distribute App**
- Scegli **App Store Connect** (o **TestFlight Internal Only** se vuoi che non possa andare sullo store)
- Clicca sempre **Next / Upload** lasciando le impostazioni predefinite
- Attendi la mail di Apple **"The following build has completed processing"** (da pochi minuti a mezz'ora)

**4. RENDERLA DISPONIBILE**

- Vai su **appstoreconnect.apple.com** → **App** → seleziona l'app → **TestFlight**
- Se la build ha **"Conformità mancante"** (triangolo giallo): **Gestisci** → rispondi alla domanda sulla crittografia
- A sinistra clicca sul tuo gruppo (es. **Team**) → **Build** → **+** → scegli la nuova build
- Fatto: ai tester arriva la notifica push o la mail per aggiornare

**EVITARE LA DOMANDA SULLA CRITTOGRAFIA A OGNI BUILD**

Aggiungi in `ios/NomeApp/Info.plist`, dentro `<dict>`:

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

Vale se l'app usa solo crittografia standard (HTTPS, funzioni del sistema) · se non sei sicuro chiedi prima al responsabile

| Gruppi TestFlight | |
|---|---|
| **interni** | utenti del team App Store Connect · build disponibile subito, senza revisione |
| **esterni** | chiunque tramite email o link pubblico · la prima build di ogni versione passa una breve revisione Apple |

> Le build TestFlight **scadono dopo 90 giorni**

**ARCHIVIARE E CARICARE DA TERMINALE (alternativa)**

```bash
cd ios
xcodebuild -workspace NomeApp.xcworkspace -scheme NomeApp -configuration Release -destination "generic/platform=iOS" -archivePath build/NomeApp.xcarchive archive
cd ..
```

Poi apri l'archivio con `open ios/build/NomeApp.xcarchive` e prosegui da **Distribute App**

## PUBBLICARE SU APP STORE

- Carica la build come per TestFlight
- App Store Connect → **App** → l'app → **Distribuzione** → **+** accanto a iOS → crea la nuova versione (stesso numero della Version)
- Compila **Novità di questa versione**
- Sezione **Build** → **+** → scegli la build
- **Aggiungi per la revisione** → **Invia**
- Scegli se pubblicare **automaticamente** dopo l'approvazione o **manualmente**

| Stati della revisione | |
|---|---|
| **In attesa di revisione** | in coda |
| **In revisione** | Apple la sta controllando (di solito entro 1–2 giorni) |
| **In attesa di pubblicazione da parte dello sviluppatore** | approvata, va pubblicata a mano |
| **Pronta per la distribuzione** | pubblicata |
| **Rifiutata** | leggi il messaggio nel **Centro risoluzione**, correggi e reinvia |

## PIÙ AMBIENTI

> Se app, beta e demo hanno bundle ID diversi, ognuno ha il suo **schema** (o target) in Xcode.

**LISTA SCHEMI DEL PROGETTO**

```bash
cd ios
xcodebuild -list -workspace NomeApp.xcworkspace
cd ..
```

**PRIMA DI ARCHIVIARE**

- Scegli lo schema in alto a sinistra (es. `NomeApp Beta`)
- Controlla in **Signing & Capabilities** il **Bundle Identifier** (es. `nome.pacchetto.beta`)
- Ogni bundle ID è **un'app separata** su App Store Connect, con il suo TestFlight

| File da controllare per ogni ambiente | |
|---|---|
| `GoogleService-Info.plist` | deve corrispondere al bundle ID nel progetto Firebase |
| `Info.plist` | nome visualizzato, URL scheme per i deep link |
| icona dell'app | utile un'icona diversa per riconoscere beta e demo |

## XCODE

| Azione | Scorciatoia |
|---|---|
| avvia | `Cmd+R` |
| ferma | `Cmd+.` |
| compila senza avviare | `Cmd+B` |
| pulisci build | `Cmd+Shift+K` |
| apri file per nome | `Cmd+Shift+O` |
| cerca nel progetto | `Cmd+Shift+F` |
| mostra / nascondi navigatore a sinistra | `Cmd+0` |
| mostra / nascondi pannello a destra | `Cmd+Option+0` |
| mostra / nascondi console in basso | `Cmd+Shift+Y` |
| organizer (archivi) | **Window → Organizer** |
| dispositivi e simulatori | `Cmd+Shift+2` |
| impostazioni (account Apple) | `Cmd+,` → **Accounts** |

| Dove si trova | |
|---|---|
| bundle ID, team, certificati | target → **Signing & Capabilities** |
| Version e Build | target → **General** → Identity |
| iOS minimo supportato | target → **General** → Minimum Deployments |
| notifiche push, Sign in with Apple, Associated Domains | **Signing & Capabilities** → **+ Capability** |
| permessi (fotocamera, posizione...) | `Info.plist` → chiavi `NS...UsageDescription` |
| icone e splash | `Images.xcassets` |

## PROBLEMI COMUNI

| Problema | Soluzione |
|---|---|
| `No such module` / `'React/RCTBridge.h' file not found` | hai aperto il `.xcodeproj`: apri il `.xcworkspace` · poi [Reset pod](#pod) |
| `pod install` non trova una versione | `pod install --repo-update` |
| `Sandbox: rsync... deny` | Build Settings → **User Script Sandboxing** → `No` |
| build che falliva e ora dovrebbe andare | `Cmd+Shift+K` · poi cancella DerivedData |
| `No signing certificate` / `Provisioning profile` | Signing & Capabilities → spunta **Automatically manage signing** e scegli il Team · Xcode → Accounts → controlla di essere loggato |
| `Failed to register bundle identifier` | il bundle ID è già usato da un altro team o scritto male |
| `The bundle version must be higher` | aumenta il numero di **Build** |
| `Invalid Version` al caricamento | la Version contiene lettere (es. `-beta`): usa solo numeri |
| **Archive** grigio | in alto non è selezionato **Any iOS Device** |
| l'archivio non compare in Organizer | Window → Organizer → controlla l'app nella lista a sinistra |
| build non visibile su TestFlight | aspetta la mail di processing · controlla **Conformità mancante** |
| `No bundle URL present` | Metro non è avviato: `npx react-native start` |
| app bianca o vecchia su iPhone fisico | iPhone e Mac sulla stessa rete Wi-Fi · riavvia Metro con `--reset-cache` |
| `xcrun: error: invalid active developer path` | `xcode-select --install` (dopo un aggiornamento di macOS) |
| `Unable to boot device` | `xcrun simctl shutdown all` · riapri il Simulatore |
| errore Firebase all'avvio | `GoogleService-Info.plist` mancante o con bundle ID diverso |
| `CocoaPods could not find compatible versions` | `pod repo update` poi `pod install` |
| Xcode lentissimo o disco pieno | [Liberare spazio](#pulizia) |
