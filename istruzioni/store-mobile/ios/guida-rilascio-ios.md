# RILASCIO IOS

> Guida per pubblicare un'app **la prima volta** su TestFlight e App Store.
> Per gli aggiornamenti successivi vedi **Guida Aggiornamento iOS**.
> ⚠️ Le regole di Apple cambiano spesso: controlla sempre le richieste che App Store Connect mostra al momento.

**INDICE**
[Fase 0 - Preparazione tecnica](#fase-0---preparazione-tecnica) · [Fase 1 - Iscrizione e burocrazia](#fase-1---iscrizione-e-burocrazia) · [Fase 2 - Sviluppo locale](#fase-2---sviluppo-locale) · [Fase 3 - Test interni](#fase-3---test-interni) · [Fase 4 - Pubblicazione sullo store](#fase-4---pubblicazione-sullo-store) · [Problemi comuni](#problemi-comuni)

## FASE 0 - PREPARAZIONE TECNICA

> Prima di buildare.

**1. ICONE APP**

Genera tutte le icone nelle dimensioni corrette dentro **Images.xcassets → AppIcon**. Su iOS non basta un'icona sola, servono tutte le varianti.

**2. PERMESSI PRIVACY (INFO.PLIST)**

Apri `Info.plist` in Xcode. Se l'app usa fotocamera, posizione o galleria servono le stringhe di descrizione, altrimenti l'app **crasha o viene rifiutata**.

| Chiave | Esempio di testo |
|---|---|
| `NSCameraUsageDescription` | "Usiamo la camera per scansionare i documenti" |
| `NSPhotoLibraryUsageDescription` | "Per allegare immagini dalla galleria" |
| `NSLocationWhenInUseUsageDescription` | "Per mostrarti i punti vicini" |
| `NSFaceIDUsageDescription` | "Per accedere in modo sicuro" |

**3. VERSIONE E BUILD**

Xcode → target → **General** → Identity

- **Version**: es. `1.0.0` (quello che vede il pubblico)
- **Build**: es. `1` (numero progressivo interno), da aumentare a **ogni** caricamento

## FASE 1 - ISCRIZIONE E BUROCRAZIA

**1. CREA LA MAIL AZIENDALE**

Chiedi una mail con dominio aziendale (es. `mobile@tuodominio.it`). **Non usare Gmail.**

**2. CREA L'APPLE ID AZIENDALE**

1. Vai su **account.apple.com**
2. Crea un account con la mail aziendale
3. Attiva l'autenticazione a due fattori (numero aziendale o del responsabile)

> Usa un numero a cui avrà accesso anche chi resterà in azienda: senza il codice 2FA l'account è irrecuperabile

**3. RECUPERA IL NUMERO D-U-N-S**

1. Apri il **D-U-N-S Lookup Tool** di Apple (developer.apple.com → Enroll)
2. Cerca la tua azienda
3. ⚠️ Segnati **esattamente** l'indirizzo che risulta lì

**4. ISCRIVITI COME ORGANIZZAZIONE**

1. Vai su **developer.apple.com/enroll** e fai login
2. Seleziona **Company / Organization**
3. Inserisci il D-U-N-S
4. ⚠️ **CRUCIALE**: nel campo indirizzo inserisci lo **stesso identico indirizzo** trovato nel database D-U-N-S (es. Milano invece di Roma), altrimenti la pratica si blocca
5. Inserisci i dati del CEO o amministratore come contatto di verifica

**5. PAGA**

- Attendi l'email di approvazione (24-48 ore)
- Clicca il link ed effettua il pagamento: **99 € + IVA**

> ⚠️ A differenza di Google, l'iscrizione Apple **si rinnova ogni anno**: se scade, le app spariscono dallo store

## FASE 2 - SVILUPPO LOCALE

> Mentre aspetti l'attivazione, o per i test veloci.

**SVILUPPO QUOTIDIANO**

```bash
npx react-native run-ios
```

Simulatore o iPhone personale collegato col cavo

**TEST SENZA CAVO (provvisorio, 7 giorni)**

1. Collega l'iPhone del collega
2. Xcode: **Product → Scheme → Edit Scheme → Run** → cambia **Build Configuration** in **Release**
3. Premi **Play ▶️**
4. Una volta installata, stacca il cavo
5. ⚠️ Ricordati di rimettere **Debug** dopo aver finito

> Con un account gratuito l'app installata così **smette di funzionare dopo 7 giorni**. È solo una soluzione temporanea in attesa di TestFlight.

## FASE 3 - TEST INTERNI

> Appena l'account è attivo, per testare l'app vera senza scadenze brevi.

**1. CONFIGURA XCODE**

1. Xcode → tab **Signing & Capabilities**
2. **Team** → **Add an Account** → inserisci l'Apple ID aziendale pagato
3. Seleziona il team dell'azienda
4. Assicurati che **Automatically manage signing** sia spuntato

**2. SISTEMA I PERMESSI**

Inserisci in `Info.plist` tutti i permessi con le descrizioni d'uso. Se in futuro aggiungi una libreria che usa per esempio il GPS, dovrai aggiungere la chiave corrispondente, altrimenti Apple blocca il caricamento.

**3. CREA L'ARCHIVIO**

1. In alto scegli **Any iOS Device (arm64)**
2. Menu **Product → Archive**
3. Attendi la compilazione

**4. CARICA SU APPLE**

1. Si apre **Organizer** → **Distribute App**
2. **App Store Connect** → **Upload** → **Avanti** → **Avanti** → **Upload**

**5. INVITA I COLLEGHI**

1. Vai su **appstoreconnect.apple.com**
2. **App** → seleziona l'app → tab **TestFlight**
3. Sotto **Internal Testing** clicca **+** e aggiungi le mail dei colleghi
4. Loro scaricano l'app **TestFlight** dallo store e installano la tua app

> I tester interni devono essere utenti del team su App Store Connect

**AGGIORNAMENTI SUCCESSIVI** → vedi **Guida Aggiornamento iOS**

## FASE 4 - PUBBLICAZIONE SULLO STORE

**1. PREPARA LA SCHEDA DELLO STORE**

App Store Connect → **General** → **App Information**

- Nome app, categoria, **Privacy Policy URL** (obbligatorio)
- **Prezzi**: 0 € (Free), trattandosi di un'app B2B
- **Privacy dell'app**: dichiara quali dati raccogli (email, ID utente, ecc.)

**2. SCREENSHOT E GRAFICA**

Carica gli screenshot fatti col simulatore nelle dimensioni che App Store Connect richiede in quel momento (oggi si parte dall'iPhone più grande, es. 6,9"). Sono **obbligatori** per inviare l'app.

**CREARE UNO SCREENSHOT DAL SIMULATORE**

```bash
xcrun simctl io booted screenshot screen.png
```

**3. ACCOUNT DEMO PER LA REVISIONE (FONDAMENTALE)**

Nella sezione **App Review Information** fornisci un login per il revisore Apple:

- **Sign-in required**: spunta la casella
- **Username**: es. `review@tuodominio.it`
- **Password**: una password dedicata
- **Notes**: le istruzioni per la 2FA, per esempio:

```text
This user allows access to the app features. IMPORTANT: for this specific user the 2FA/OTP code is static/disabled to allow your review. Please use code '123456' if requested, or proceed without OTP.
```

> ⚠️ Tieni l'account attivo anche dopo l'approvazione: serve a ogni revisione futura

**4. INVIA PER LA REVISIONE**

1. In alto a destra → **Add for Review**
2. **Submit to App Review**

**5. ATTESA E LANCIO**

- Attendi 24-48 ore
- Se approvata ricevi una mail: torna sul portale e pubblica (o attendi la pubblicazione automatica, in base a come hai impostato il rilascio)
- L'app è pubblica su App Store

**SUBITO DOPO**

- Salva su git il tag della versione pubblicata
- Segnati in calendario la **scadenza annuale** dell'account sviluppatore
- Controlla ogni tanto **Crash** e **Analytics** su App Store Connect

## PROBLEMI COMUNI

| Problema | Soluzione |
|---|---|
| iscrizione bloccata | l'indirizzo non coincide con quello del database D-U-N-S |
| `No signing certificate` | Signing & Capabilities → spunta **Automatically manage signing** e scegli il Team |
| `Failed to register bundle identifier` | il bundle ID è già usato o scritto male |
| app rifiutata per login | account demo non valido, o 2FA che blocca il revisore |
| app rifiutata per privacy | Privacy Policy mancante o non coerente con i dati dichiarati |
| app rifiutata: "Guideline 4.2 - Minimum Functionality" | l'app sembra un sito impacchettato: mostra funzioni native (notifiche, biometria, offline) |
| mail `ITMS-90xxx` | permesso o icona mancante: il codice nel messaggio dice cosa |
| crash all'avvio solo in release | permesso mancante in `Info.plist` o chiave Firebase sbagliata |
| app sparita dallo store | iscrizione annuale scaduta |
