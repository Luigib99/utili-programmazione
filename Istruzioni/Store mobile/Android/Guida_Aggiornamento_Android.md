# AGGIORNAMENTO ANDROID

> Guida per pubblicare un aggiornamento di un'app **già presente** sul Play Store.
> Per la prima pubblicazione vedi **Guida Rilascio Android**.
> `gradlew`: su Windows `.\gradlew` · su Mac `./gradlew`

**INDICE**
[Prima di iniziare](#prima-di-iniziare) · [Aggiornare la versione](#aggiornare-la-versione) · [Creare il file](#creare-il-file) · [Caricare su Play Console](#caricare-su-play-console) · [Tipi di rilascio](#tipi-di-rilascio) · [Dopo la pubblicazione](#dopo-la-pubblicazione) · [Problemi comuni](#problemi-comuni)

## PRIMA DI INIZIARE

- Salva e invia tutto su git
- Controlla di essere sul branch giusto
- Prova l'app in release prima di pubblicare:

```bash
npx react-native run-android --mode=release
```

## AGGIORNARE LA VERSIONE

> Android ha **due numeri**, entrambi in `android/app/build.gradle`:

| Campo | Cos'è | Regola |
|---|---|---|
| `versionName` | versione visibile, es. `1.2.0` | libera |
| `versionCode` | numero intero | **sempre più alto** del precedente, altrimenti il Play Store rifiuta il file |

**AGGIORNARE LA VERSIONE IN PACKAGE.JSON**

| Comando | Da → a | Quando |
|---|---|---|
| `npm version prerelease --preid=beta` | 1.2.3 → 1.2.4-beta.0 | versioni di test |
| `npm version patch` | 1.2.3 → 1.2.4 | bug fix rapidi |
| `npm version minor` | 1.2.3 → 1.3.0 | nuove funzioni |
| `npm version major` | 1.2.3 → 2.0.0 | rivoluzione totale |

> ⚠️ `npm version` cambia **solo** `package.json` e crea da solo un commit e un tag git (serve avere tutto già salvato). Con `--no-git-tag-version` non crea il commit.

**COPIARE LA VERSIONE IN ANDROID (E IOS)**

```bash
npx react-native-version --never-amend
```

**AUMENTARE SOLO IL NUMERO DI BUILD**

```bash
npx react-native-version --increment-build --never-amend
```

**OPPURE A MANO** → `android/app/build.gradle`

```gradle
defaultConfig {
    versionCode 12
    versionName "1.2.0"
}
```

**CONTROLLA SEMPRE** che `build.gradle` contenga davvero i numeri nuovi prima di buildare

## CREARE IL FILE

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

**3. TROVA IL FILE**

`android/app/build/outputs/bundle/release/app-release.aab`

Con le varianti il percorso cambia: `outputs/bundle/nomeVarianteRelease/`

**APRI LA CARTELLA**

```powershell
explorer android\app\build\outputs\bundle\release
```

Su Mac: `open android/app/build/outputs/bundle/release`

| File | Serve per |
|---|---|
| `.aab` | Play Store (obbligatorio) |
| `.apk` | installazione diretta, test, clienti (`.\gradlew assembleRelease`) |

## CARICARE SU PLAY CONSOLE

1. Apri **play.google.com/console**
2. Clicca sull'app da aggiornare
3. Menu a sinistra: **Testa e rilascia** → scegli **Test** (e il tipo) o **Produzione**
4. **Crea nuova release**
5. Trascina il file `app-release.aab` in **App bundle** (il nome della release si compila da solo)
6. Scrivi le **note di rilascio** in tutte le lingue necessarie
7. **Avanti** → **Salva** → **Vai alla panoramica della pubblicazione**
8. Attendi i controlli rapidi (di solito 15 minuti)
9. **Invia modifiche per la revisione**
10. Finito

> Gli avvisi **gialli** si possono ignorare, gli errori **rossi** vanno risolti

**NOTE DI RILASCIO: FORMATO**

```text
<it-IT>
- Corretto il caricamento dei wallet
- Migliorata la velocità di avvio
</it-IT>
```

## TIPI DI RILASCIO

| Canale | A chi arriva | Revisione |
|---|---|---|
| **Test interno** | fino a 100 tester via email, in pochi minuti | nessuna o minima |
| **Test chiuso** | lista di tester o gruppi | sì, più rapida |
| **Test aperto** | chiunque abbia il link | sì |
| **Produzione** | tutti sul Play Store | sì, più severa |

**RILASCIO GRADUALE (produzione)**

Nella release puoi impostare la percentuale di utenti (es. 20%) e aumentarla nei giorni successivi. Se emerge un problema puoi **interrompere il rilascio** dalla panoramica.

> Tempi di revisione: da poche ore a qualche giorno · la prima release di un'app è sempre più lenta

## DOPO LA PUBBLICAZIONE

- **Panoramica della release**: stato della revisione
- **Qualità → Android vitals**: crash e ANR degli utenti
- **Statistiche**: quanti hanno aggiornato

**CONTROLLA CHE VERSIONE HA UN TELEFONO**

```bash
adb shell dumpsys package nome.pacchetto | findstr /C:"versionName" /C:"versionCode"
```

Su Mac: `adb shell dumpsys package nome.pacchetto | grep -E "versionName|versionCode"`

**SALVA IL TAG DELLA VERSIONE SU GIT**

```bash
git push --tags
```

## PROBLEMI COMUNI

| Problema | Soluzione |
|---|---|
| `Version code 5 has already been used` | aumenta `versionCode` e ricrea il file |
| il file caricato non è accettato | devi caricare l'`.aab`, non l'`.apk` |
| `You uploaded an APK signed with the wrong key` | keystore sbagliata: controlla `gradle.properties` e `signingConfigs` |
| `You uploaded a debuggable APK` | stai caricando una build debug: usa `--mode=release` |
| build fallita dopo aver cambiato versione | `.\gradlew clean` e riprova |
| la versione nuova non appare nell'app | hai buildato prima di salvare `build.gradle` |
| revisione ferma da giorni | controlla la posta e la sezione **Norme** per eventuali richieste |
| l'app non si aggiorna sui telefoni | il rilascio graduale non li ha ancora raggiunti, oppure è ancora in revisione |
