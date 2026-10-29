# RILASCIO ANDROID

> Guida per pubblicare un'app **la prima volta** sul Play Store, incluso il caso di distribuzione privata a un'azienda cliente.
> Per gli aggiornamenti successivi vedi **Guida Aggiornamento Android**.
> ⚠️ Le regole di Google cambiano spesso: controlla sempre le richieste che la Console mostra al momento.

**INDICE**
[Fase 0 - Account e burocrazia](#fase-0---account-e-burocrazia) · [Fase 1 - Account per la revisione](#fase-1---account-per-la-revisione) · [Fase 2 - Firma e build](#fase-2---firma-e-build) · [Fase 3 - Scheda dello store](#fase-3---scheda-dello-store) · [Fase 3.1 - Distribuzione privata](#fase-31---distribuzione-privata) · [Fase 4 - Pubblicazione e revisione](#fase-4---pubblicazione-e-revisione) · [Fase finale - Consegna](#fase-finale---consegna) · [Problemi comuni](#problemi-comuni)

## FASE 0 - ACCOUNT E BUROCRAZIA

**CREA L'ACCOUNT AZIENDALE**

- Crea una mail con dominio aziendale (`...@nomeAzienda...`)

**DOCUMENTI DA AVERE A PORTATA DI MANO**

- Carta di credito (possibilmente quella aziendale)
- Numero **D-U-N-S** dell'azienda
- Visura camerale o statuto (PDF)
- Un numero di telefono (anche quello dello sviluppatore)
- La mail creata prima

**REGISTRAZIONE**

1. Apri una finestra **in incognito**
2. Vai su **play.google.com/console/signup**
3. Accedi con l'account appena creato
4. Seleziona **Per un'organizzazione o un'azienda**

**COMPILAZIONE DATI**

- Nome dell'organizzazione
- D-U-N-S
- Indirizzo
- Sito web

**PAGAMENTO**

25 $ una tantum (a differenza di Apple, non si rinnova ogni anno)

**VERIFICA DELL'IDENTITÀ**

Google chiede di caricare i documenti e di verificare telefono ed email.

> Tempo di attesa: **da 2 giorni a 2 settimane**

## FASE 1 - ACCOUNT PER LA REVISIONE

> Mentre aspetti Google, prepara l'app perché il revisore non la bocci: se non riesce a entrare, l'app viene rifiutata.

**CREA L'UTENTE PER I REVISORI**

- Email: `review@tuodominio.it`
- Password: una password dedicata, **diversa** da quelle usate altrove
- **Disabilita la 2FA solo per questo utente**

**TESTALO**

Prova a entrare con quelle credenziali su un dispositivo: devi arrivare alla Home senza intoppi.

> ⚠️ Non cancellare l'utente dopo l'approvazione: serve a **ogni** revisione, anche per gli aggiornamenti. Tienilo con permessi minimi e dati finti, e cambia la password se sospetti un problema.

## FASE 2 - FIRMA E BUILD

**VERIFICA LA KEYSTORE**

- Il file `my-upload-key.keystore` (o `.jks`) è in `android/app/`
- In `android/gradle.properties` ci sono password e alias corretti
- In `android/app/build.gradle`, sezione `signingConfigs`, la build release legge quelle variabili

> ⚠️ **Fai un backup della keystore e delle password** in un posto sicuro (password manager aziendale). Senza, non potrai più aggiornare l'app. La keystore **non va mai committata**.

**CREARE UNA KEYSTORE (se non esiste)**

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

**LEGGERE SHA-1 E SHA-256 (servono per Firebase e Google Sign-In)**

```bash
cd android
.\gradlew signingReport
cd ..
```

**IMPOSTA LA VERSIONE** → `android/app/build.gradle`

```gradle
versionCode 1
versionName "1.0.0"
```

`versionCode` va aumentato a **ogni** file caricato, anche se la prova precedente non è stata pubblicata

**PULISCI**

```bash
cd android
.\gradlew clean
cd ..
```

**BUILDA**

```bash
npx react-native build-android --mode=release
```

**IL FILE**

`android/app/build/outputs/bundle/release/app-release.aab`

## FASE 3 - SCHEDA DELLO STORE

> Da fare quando l'account è attivo.

**CREARE L'APP**

1. **Crea app**
2. Nome: `NomeApp` (o nome commerciale)
3. Lingua predefinita: italiano o inglese
4. App o gioco: **App**
5. Gratuita o a pagamento: **Gratuita** (⚠️ non si può passare da gratuita a pagamento in seguito)
6. Accetta le condizioni → **Crea**

**TESTI**

| Campo | Limite |
|---|---|
| Descrizione breve | 80 caratteri (es. "L'app ufficiale di NomeApp per ...") |
| Descrizione completa | 4000 caratteri, spiega le funzionalità principali |

**COMPLETARE LA DASHBOARD** (segui i passaggi che Google propone)

**Accesso alle app (CRUCIALE)**

1. Vai su **Accesso alle app**
2. Seleziona **Tutte o alcune funzionalità sono limitate**
3. Aggiungi istruzioni: inserisci `review@tuodominio.it` e la password
4. Nelle note scrivi: *"This is a test account for Google Reviewers. 2FA is disabled for this specific user to allow inspection."*

**Altre voci**

| Voce | Cosa mettere |
|---|---|
| Annunci | No, non contiene annunci |
| Classificazione contenuti | compila il questionario (di solito PEGI 3 se non c'è violenza) |
| Norme sulla privacy | link alla Privacy Policy del sito (**obbligatorio**) |
| Pubblico di destinazione | 18+ |
| App di notizie | No |
| Sicurezza dei dati | dichiara quali dati raccogli (email, ID utente, ecc.) |

**SCHEDA DELLO STORE: GRAFICA**

| Elemento | Dimensioni |
|---|---|
| Icona | 512 × 512 px |
| Immagine in primo piano | 1024 × 500 px |
| Screenshot telefono | almeno 2 (dal simulatore o reali) |

## FASE 3.1 - DISTRIBUZIONE PRIVATA

> Solo se l'app va distribuita ai dispositivi gestiti di un'azienda cliente e non al pubblico.

1. Menu a sinistra: **Configurazione** → **Impostazioni avanzate**
2. Scheda **Google Play gestito**
3. Spunta **Attiva funzioni di pubblicazione avanzate** (se presente)
4. **Aggiungi organizzazione**
5. Inserisci l'**Organization ID** che ti manda il cliente
   - Nome: `Cliente X`
   - ID: `123456789...`
6. **Salva**

Se hai più clienti, aggiungi qui tutti i loro ID.

> L'Organization ID lo trova il cliente nella sua console Google Workspace / Play gestito

## FASE 4 - PUBBLICAZIONE E REVISIONE

**IMPOSTA LA LOCALIZZAZIONE**

1. Menu a sinistra → **Produzione**
2. Scheda **Paesi/Regioni** (accanto a **Release**)
3. **Aggiungi paesi/regioni**
4. Seleziona Italia (o tutto il mondo) → salva

**CARICARE IL FILE**

1. Menu a sinistra: **Versione** → **Produzione**
2. **Crea nuova release**
3. Carica il file `.aab` della Fase 2
4. Dai un nome alla release (es. `Versione 1.0`)
5. Scrivi le note di rilascio
6. **Avanti** → ignora gli avvisi gialli, correggi solo gli errori rossi
7. **Salva** → **Invia per la revisione**

> Prima della produzione conviene passare da un **test interno**: arriva in pochi minuti e permette di provare l'app vera prima della revisione

## FASE FINALE - CONSEGNA

**ATTESA**

Google impiega di solito 2-3 giorni per controllare l'app (entrerà con l'utente per i revisori). La prima pubblicazione può richiedere più tempo.

**EMAIL DI CONFERMA**

Riceverai "La tua app è pubblicata".

**AVVISA IL CLIENTE**

> "L'app è live. Potete trovarla nella sezione 'App di lavoro' del Google Play Store sui vostri dispositivi aziendali gestiti. Se non la vedete subito, attendete qualche ora per la propagazione."

**SUBITO DOPO**

- Metti al sicuro keystore e password
- Salva su git il tag della versione pubblicata
- Attiva le notifiche email della Play Console per crash e comunicazioni di Google

## PROBLEMI COMUNI

| Problema | Soluzione |
|---|---|
| account bloccato in verifica | controlla che i dati corrispondano **esattamente** alla visura e al D-U-N-S |
| app rifiutata per "Accesso alle app" | il revisore non è riuscito a entrare: verifica utente, password e 2FA disattivata |
| app rifiutata per privacy | Privacy Policy mancante, non raggiungibile o non coerente con i dati dichiarati |
| `Version code has already been used` | aumenta `versionCode` |
| `You uploaded an APK` | serve l'`.aab` |
| firma sbagliata | controlla `gradle.properties` e `signingConfigs` |
| keystore persa | se è attivo **Play App Signing** si può chiedere il reset della chiave di caricamento a Google, altrimenti l'app non è più aggiornabile |
| il cliente non vede l'app | Organization ID sbagliato, oppure propagazione non ancora completata |
