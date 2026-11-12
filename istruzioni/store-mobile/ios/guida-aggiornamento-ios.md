# AGGIORNAMENTO IOS

> Guida per pubblicare un aggiornamento di un'app **già presente** su TestFlight o App Store.
> Per la prima pubblicazione vedi **Guida Rilascio iOS**.
> Apri sempre il file `.xcworkspace`, non il `.xcodeproj`.

**INDICE**
[Prima di iniziare](#prima-di-iniziare) · [Aggiornare la versione](#aggiornare-la-versione) · [Creare e caricare la build](#creare-e-caricare-la-build) · [Test - TestFlight](#test---testflight) · [Distribuzione - App Store](#distribuzione---app-store) · [Problemi comuni](#problemi-comuni)

## PRIMA DI INIZIARE

- Salva e invia tutto su git
- Aggiorna le librerie native se servono:

```bash
npm install
cd ios
pod install
cd ..
```

- Prova l'app in release:

```bash
npx react-native run-ios --mode Release
```

## AGGIORNARE LA VERSIONE

> iOS ha **due numeri**, in Xcode → target → **General** → Identity:

| Campo | Cos'è | Regola |
|---|---|---|
| **Version** | versione visibile, es. `1.2.0` | **solo numeri e punti** |
| **Build** | numero progressivo interno | **sempre più alto**, va cambiato a ogni caricamento |

**AGGIORNARE LA VERSIONE IN PACKAGE.JSON**

| Comando | Da → a | Quando |
|---|---|---|
| `npm version prerelease --preid=beta` | 1.2.3 → 1.2.4-beta.0 | versioni di test |
| `npm version patch` | 1.2.3 → 1.2.4 | bug fix rapidi |
| `npm version minor` | 1.2.3 → 1.3.0 | nuove funzioni |
| `npm version major` | 1.2.3 → 2.0.0 | rivoluzione totale |

> ⚠️ `npm version` cambia **solo** `package.json` e crea da solo un commit e un tag git. Con `--no-git-tag-version` non crea il commit.
> ⚠️ **Non aggiorna Xcode**: la Version va cambiata a mano o con i comandi sotto.
> ⚠️ Apple **rifiuta** versioni con lettere come `1.2.4-beta.0`: in Xcode la Version deve restare `1.2.4`. Le beta si distinguono dal numero di Build.

**COPIARE LA VERSIONE DA PACKAGE.JSON A XCODE (E ANDROID)**

```bash
npx react-native-version --never-amend
```

**DA TERMINALE CON AGVTOOL**

```bash
cd ios
agvtool new-marketing-version 1.2.4
agvtool next-version -all
cd ..
```

**CONTROLLA SEMPRE** Version e Build in Xcode prima di archiviare

## CREARE E CARICARE LA BUILD

1. Apri **Xcode**
2. Pulisci: **Product → Clean Build Folder** (`Cmd+Shift+K`)
3. In alto seleziona **Any iOS Device (arm64)**
4. Se hai più ambienti, controlla lo **schema** selezionato
5. Menu **Product → Archive**
6. Attendi la fine della compilazione
7. Si apre **Organizer**: seleziona l'archivio appena creato → **Distribute App**
8. Scegli **App Store Connect** se vai in produzione, o **TestFlight Internal Only** per il solo test interno
9. Clicca sempre **Next / Upload** lasciando le impostazioni predefinite
10. Attendi la mail di Apple **"Processing Complete"** (da pochi minuti a mezz'ora)
11. Vai su **appstoreconnect.apple.com** → **App** → seleziona l'app
12. Prosegui con la sezione **Test** o **Distribuzione** qui sotto

## TEST - TESTFLIGHT

1. Sezione **TestFlight**
2. Clicca sulla versione appena caricata (l'elaborazione richiede qualche minuto)
3. Se vedi **Conformità mancante** (triangolo giallo): **Gestisci** → rispondi alla domanda sulla crittografia e sul rilascio in Francia
4. I tester **interni** ricevono la build in automatico
5. I tester **esterni** vanno aggiunti manualmente al gruppo
6. Finito

| Tipo di tester | Note |
|---|---|
| **interni** | utenti del team App Store Connect · build subito disponibile |
| **esterni** | via email o link pubblico · la prima build di ogni versione passa una breve revisione |

> Le build TestFlight **scadono dopo 90 giorni**

**EVITARE LA DOMANDA SULLA CRITTOGRAFIA A OGNI BUILD**

Aggiungi in `ios/NomeApp/Info.plist`, dentro `<dict>`:

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

Vale se l'app usa solo crittografia standard (HTTPS, funzioni di sistema): se non sei sicuro, chiedi prima al responsabile

## DISTRIBUZIONE - APP STORE

1. Sezione **Distribuzione**
2. In alto a sinistra clicca sul **+** a destra di **App iOS**
3. Inserisci il numero esatto della versione
4. Compila **Novità in questa versione** e aggiorna le altre info se serve
5. Scendi fino a **Build** → **Aggiungi build**
6. Se vedi **Conformità mancante**: **Gestisci** → rispondi sulla crittografia e sul rilascio in Francia
7. **Salva** → **Aggiungi alla verifica**
8. Si apre una tendina a destra → **Invia per la verifica**
9. Finito

| Stati della revisione | |
|---|---|
| **In attesa di revisione** | in coda |
| **In revisione** | Apple sta controllando (di solito 24-48 ore) |
| **In attesa di pubblicazione** | approvata, va pubblicata a mano se hai scelto il rilascio manuale |
| **Pronta per la distribuzione** | pubblicata |
| **Rifiutata** | leggi il messaggio nel **Centro risoluzione**, correggi e reinvia |

> Se l'app richiede login, controlla che l'**account demo** in **Informazioni per la revisione** sia ancora valido: è la causa più frequente di rifiuto

## PROBLEMI COMUNI

| Problema | Soluzione |
|---|---|
| **Archive** grigio | in alto non è selezionato **Any iOS Device** |
| `The bundle version must be higher` | aumenta il numero di **Build** |
| `Invalid Version` | la Version contiene lettere: usa solo numeri |
| `No such module` dopo un pull | `cd ios && pod install && cd ..` |
| l'archivio non compare in Organizer | Window → Organizer → controlla l'app nella lista a sinistra |
| build non visibile su TestFlight | attendi la mail di processing · controlla **Conformità mancante** |
| mail "ITMS-xxxxx" da Apple | leggi il codice nel messaggio: di solito è un permesso mancante in `Info.plist` |
| build caricata ma versione sbagliata | avevi modificato solo `package.json` e non Xcode |
| rifiutata per login | account demo non valido o 2FA che blocca il revisore |
