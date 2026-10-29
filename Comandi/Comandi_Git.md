# COMANDI GIT

> Dove c'è `nome-branch`, `hash-del-commit` o `file` metti il valore reale.
> L'hash si trova con `git log --oneline` (bastano i primi 7 caratteri).
> ⚠️ = comando che cancella modifiche in modo non recuperabile (o quasi, vedi [Reflog](#reflog-salvavita)).

**INDICE**
[Configurazione](#configurazione) · [Creare e clonare](#creare-e-clonare) · [Stato e differenze](#stato-e-differenze) · [Stage](#stage) · [Commit](#commit) · [Push](#push) · [Pull e fetch](#pull-e-fetch) · [Branch](#branch) · [Merge](#merge) · [Conflitti](#conflitti) · [Rebase](#rebase) · [Stash](#stash) · [Storico](#storico) · [Annullare](#annullare) · [Reflog salvavita](#reflog-salvavita) · [Cherry pick](#cherry-pick) · [Tag e versioni](#tag-e-versioni) · [Remote](#remote) · [File e gitignore](#file-e-gitignore) · [Pulizia](#pulizia) · [Cercare](#cercare) · [Alias](#alias) · [SSH e GitHub](#ssh-e-github) · [GitHub CLI](#github-cli) · [Messaggi di commit](#messaggi-di-commit) · [Problemi comuni](#problemi-comuni)

#### 

#### **CONFIGURAZIONE:**

#### 

* **IMPOSTA NOME E EMAIL (una volta sola per PC)**
```bash
git config --global user.name "Nome Cognome"
git config --global user.email "email@esempio.it"
```

* **IMPOSTA NOME E EMAIL SOLO PER QUESTO PROGETTO**
```bash
git config user.email "email@lavoro.it"
```

* **VEDI TUTTA LA CONFIGURAZIONE (e da dove arriva)**
```bash
git config --list --show-origin
```

* **BRANCH PRINCIPALE CHIAMATO MAIN DI DEFAULT**
```bash
git config --global init.defaultBranch main
```

* **FINE RIGA (evita file "modificati" senza motivo tra Windows e Mac)**

WINDOWS:
```bash
git config --global core.autocrlf true
```
MAC:
```bash
git config --global core.autocrlf input
```

* **PULL SENZA COMMIT DI MERGE INUTILI**
```bash
git config --global pull.rebase true
```

* **PUSH CREA DA SOLO IL BRANCH REMOTE**
```bash
git config --global push.autoSetupRemote true
```

* **EDITOR PREDEFINITO (VS Code)**
```bash
git config --global core.editor "code --wait"
```

* **RICORDA LA RISOLUZIONE DEI CONFLITTI GIÀ FATTI**
```bash
git config --global rerere.enabled true
```

#### 

#### **CREARE E CLONARE:**

#### 

* **CLONA UN REPO**
```bash
git clone https://github.com/utente/nome-progetto.git
```

* **CLONA IN UNA CARTELLA CON UN ALTRO NOME**
```bash
git clone https://github.com/utente/nome-progetto.git nome-cartella
```

* **CLONA UN SOLO BRANCH**
```bash
git clone -b nome-branch --single-branch https://github.com/utente/nome-progetto.git
```

* **CLONA SOLO L'ULTIMO COMMIT (veloce, repo pesanti)**
```bash
git clone --depth 1 https://github.com/utente/nome-progetto.git
```

* **TRASFORMA UNA CARTELLA IN REPO GIT**
```bash
git init
```

* **COLLEGA UN REPO LOCALE A GITHUB (primo push)**
```bash
git remote add origin https://github.com/utente/nome-progetto.git
git branch -M main
git push -u origin main
```

#### 

#### **STATO E DIFFERENZE:**

#### 

* **GUARDA STATO (file modificati, in stage, branch attuale)**
```bash
git status
```

* **STATO COMPATTO**
```bash
git status -s
```

| Sigla | Significato |
|---|---|
| `M` | modificato |
| `A` | aggiunto (nuovo in stage) |
| `D` | cancellato |
| `R` | rinominato |
| `??` | nuovo, non tracciato |
| `UU` | in conflitto |
| colonna sinistra | in stage |
| colonna destra | non in stage |

* **MODIFICHE NON ANCORA IN STAGE**
```bash
git diff
```

* **MODIFICHE GIÀ IN STAGE (quelle che finiranno nel commit)**
```bash
git diff --staged
```

* **MODIFICHE DI UN SOLO FILE**
```bash
git diff file
```

* **SOLO I NOMI DEI FILE MODIFICATI**
```bash
git diff --name-only
```

* **DIFFERENZE TRA DUE BRANCH**
```bash
git diff main..nome-branch
```

* **FILE DIVERSI TRA DUE BRANCH**
```bash
git diff --name-status main..nome-branch
```

* **DIFFERENZE TRA LOCALE E REMOTE**
```bash
git fetch
git diff nome-branch origin/nome-branch
```

* **QUANTI COMMIT SONO AVANTI / INDIETRO RISPETTO AL REMOTE**
```bash
git fetch
git status -sb
```
`[ahead 2]` = 2 commit da pushare · `[behind 3]` = 3 commit da scaricare

#### 

#### **STAGE:**

#### 

* **STAGE TUTTE LE MODIFICHE**
```bash
git add .
```

* **STAGE UN SOLO FILE**
```bash
git add file
```

* **STAGE SOLO I FILE GIÀ TRACCIATI (esclude i nuovi)**
```bash
git add -u
```

* **STAGE SOLO ALCUNE PARTI DI UN FILE (scegli pezzo per pezzo)**
```bash
git add -p file
```
`y` sì · `n` no · `s` dividi · `q` esci

* **TOGLI UN FILE DALLO STAGE (le modifiche restano)**
```bash
git restore --staged file
```

* **TOGLI TUTTO DALLO STAGE**
```bash
git restore --staged .
```

* **⚠️ SCARTA LE MODIFICHE DI UN FILE (torna all'ultimo commit)**
```bash
git restore file
```

* **⚠️ SCARTA TUTTE LE MODIFICHE NON COMMITTATE**
```bash
git restore .
```

#### 

#### **COMMIT:**

#### 

* **SALVA COMMIT (SALVA LOCALMENTE)**
```bash
git commit -m "TitoloCommit"
```

* **COMMIT CON TITOLO E DESCRIZIONE**
```bash
git commit -m "Titolo" -m "Descrizione più lunga"
```

* **STAGE + COMMIT DEI FILE GIÀ TRACCIATI IN UN COLPO**
```bash
git commit -am "TitoloCommit"
```
Non include i file nuovi

* **CAMBIA IL MESSAGGIO DELL'ULTIMO COMMIT (se non ancora pushato)**
```bash
git commit --amend -m "Nuovo messaggio"
```

* **AGGIUNGI FILE DIMENTICATI ALL'ULTIMO COMMIT (se non ancora pushato)**
```bash
git add file-dimenticato
git commit --amend --no-edit
```

* **COMMIT VUOTO (per far ripartire una pipeline CI)**
```bash
git commit --allow-empty -m "Trigger build"
```

#### 

#### **PUSH:**

#### 

* **PUSHA BRANCH (PUSHA GLOBALMENTE)**
```bash
git push origin nome-branch
```

* **PRIMO PUSH DI UN BRANCH NUOVO (collega locale e remote)**
```bash
git push -u origin nome-branch
```
Dopo basta `git push`

* **PUSHA IL BRANCH ATTUALE SENZA SCRIVERNE IL NOME**
```bash
git push origin HEAD
```

* **⚠️ PUSH FORZATO SICURO (dopo amend o rebase)**
```bash
git push --force-with-lease
```
Fallisce se qualcun altro ha pushato nel frattempo · mai usare `--force` su main

* **PUSHA I TAG**
```bash
git push --tags
```

#### 

#### **PULL E FETCH:**

#### 

* **PRENDI E MERGIA AGGIORNAMENTI DEL BRANCH REMOTE SUL BRANCH LOCALE**
```bash
git pull origin nome-branch
```

* **PULL DEL BRANCH ATTUALE (se già collegato)**
```bash
git pull
```

* **PULL CON REBASE (storico lineare, senza commit di merge)**
```bash
git pull --rebase
```

* **PULL SOLO SE NON SERVE UN MERGE (altrimenti si ferma)**
```bash
git pull --ff-only
```

* **SCARICA AGGIORNAMENTI SENZA TOCCARE I TUOI FILE**
```bash
git fetch
```

* **SCARICA E TOGLI I BRANCH REMOTE CANCELLATI**
```bash
git fetch --prune
```

* **AGGIORNA MAIN SENZA SPOSTARTI DAL BRANCH ATTUALE**
```bash
git fetch origin main:main
```

> **fetch** = scarica e basta · **pull** = fetch + merge nel branch attuale

#### 

#### **BRANCH:**

#### 

* **LISTA BRANCH LOCALI**
```bash
git branch
```

* **LISTA BRANCH REMOTE**
```bash
git branch -r
```

* **LISTA TUTTI I BRANCH (locali e remote)**
```bash
git branch -a
```

* **LISTA BRANCH CON ULTIMO COMMIT E COLLEGAMENTO AL REMOTE**
```bash
git branch -vv
```

* **BRANCH GIÀ UNITI A MAIN (si possono cancellare)**
```bash
git branch --merged main
```

* **BRANCH NON ANCORA UNITI A MAIN**
```bash
git branch --no-merged main
```

* **NOME DEL BRANCH ATTUALE**
```bash
git branch --show-current
```

* **SPOSTATI AL BRANCH**
```bash
git switch nome-branch
```
oppure `git checkout nome-branch`

* **TORNA AL BRANCH PRECEDENTE**
```bash
git switch -
```

* **CREA E SPOSTATI AL BRANCH**
```bash
git switch -c nome-branch
```
oppure `git checkout -b nome-branch`

* **CREA BRANCH PARTENDO DA UN ALTRO BRANCH**
```bash
git switch -c nome-branch origin/main
```

* **SCARICA UN BRANCH CHE ESISTE SOLO SUL REMOTE**
```bash
git fetch
git switch nome-branch
```

* **RINOMINA BRANCH ATTUALE**
```bash
git branch -m nuovo-nome
```

* **RINOMINA ANCHE SUL REMOTE**
```bash
git push origin -u nuovo-nome
git push origin --delete vecchio-nome
```

* **ELIMINA BRANCH (LOCALMENTE SICURO)**
```bash
git branch -d nome-branch
```
Si rifiuta se il branch non è stato unito

* **⚠️ ELIMINA BRANCH (LOCALMENTE FORZATO)**
```bash
git branch -D nome-branch
```

* **ELIMINA BRANCH (GLOBALMENTE)**
```bash
git push origin --delete nome-branch
```

* **ELIMINA TUTTI BRANCH (LOCALMENTE) TRANNE MAIN**

WINDOWS:
```powershell
git branch | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "main" -and $_ -notmatch "^\*" } | ForEach-Object { git branch -d $_ }
```
MAC:
```bash
git branch | grep -vE "^\*|main" | xargs git branch -d
```
Con `-d` salta quelli non uniti · usa `-D` per forzare

* **ELIMINA I BRANCH LOCALI GIÀ CANCELLATI SU GITHUB**

WINDOWS:
```powershell
git fetch --prune
git branch -vv | Select-String ": gone]" | ForEach-Object { ($_.Line.Trim() -split '\s+')[0] } | ForEach-Object { git branch -D $_ }
```
MAC:
```bash
git fetch --prune
git branch -vv | grep ': gone]' | awk '{print $1}' | xargs git branch -D
```

#### 

#### **MERGE:**

#### 

* **FONDI BRANCH NEL BRANCH ATTUALE**
```bash
git merge nome-branch
```

* **PORTA MAIN AGGIORNATO NEL TUO BRANCH**
```bash
git fetch
git merge origin/main
```

* **MERGE CREANDO SEMPRE UN COMMIT DI MERGE**
```bash
git merge --no-ff nome-branch
```

* **MERGE UNENDO TUTTI I COMMIT IN UNO (squash)**
```bash
git merge --squash nome-branch
git commit -m "Titolo"
```

* **ANNULLA UN MERGE IN CORSO (con conflitti, non ancora concluso)**
```bash
git merge --abort
```

* **⚠️ ANNULLA UN MERGE APPENA CONCLUSO (non ancora pushato)**
```bash
git reset --hard ORIG_HEAD
```

* **ANNULLA UN MERGE GIÀ PUSHATO**
```bash
git revert -m 1 hash-del-merge
```

* **VERIFICA ULTIMI MERGE E PUSH**
```bash
git log --format="%h %an %ad %s" -10 --date=format:"%Y-%m-%d %H:%M"
```

* **SOLO I COMMIT DI MERGE**
```bash
git log --merges --oneline -10
```

#### 

#### **CONFLITTI:**

#### 

* **FILE IN CONFLITTO**
```bash
git diff --name-only --diff-filter=U
```

* **COME SI LEGGE UN CONFLITTO**
```text
<<<<<<< HEAD
codice del tuo branch
=======
codice del branch che stai unendo
>>>>>>> nome-branch
```
Tieni la parte giusta, cancella i segni `<<<<<<<` `=======` `>>>>>>>`

* **TIENI LA TUA VERSIONE DI UN FILE**
```bash
git checkout --ours file
```

* **TIENI LA VERSIONE DELL'ALTRO BRANCH**
```bash
git checkout --theirs file
```
Durante un rebase `ours` e `theirs` sono invertiti

* **DOPO AVER RISOLTO**
```bash
git add file
git commit
```
durante un rebase: `git rebase --continue`

* **CONFLITTO SU PACKAGE-LOCK / YARN.LOCK (conviene rigenerarlo)**
```bash
git checkout --theirs package-lock.json
npm install
git add package-lock.json
```

#### 

#### **REBASE:**

#### 

> Rebase riscrive lo storico: usalo sui tuoi branch, **mai su main o branch condivisi**.

* **SPOSTA I TUOI COMMIT SOPRA MAIN AGGIORNATO**
```bash
git fetch
git rebase origin/main
```

* **CONTINUA DOPO AVER RISOLTO UN CONFLITTO**
```bash
git add file
git rebase --continue
```

* **SALTA IL COMMIT IN CONFLITTO**
```bash
git rebase --skip
```

* **ANNULLA IL REBASE (torna com'era prima)**
```bash
git rebase --abort
```

* **SISTEMA GLI ULTIMI 3 COMMIT (unire, rinominare, riordinare)**
```bash
git rebase -i HEAD~3
```

| Parola | Effetto |
|---|---|
| `pick` | tieni il commit |
| `reword` | cambia il messaggio |
| `squash` | unisci al precedente (tiene i messaggi) |
| `fixup` | unisci al precedente (scarta il messaggio) |
| `drop` | elimina il commit |
| spostare le righe | cambia l'ordine |

Dopo, se già pushato: `git push --force-with-lease`

#### 

#### **STASH:**

#### 

* **METTI DA PARTE LE MODIFICHE**
```bash
git stash
```

* **METTI DA PARTE CON UN NOME**
```bash
git stash push -m "descrizione"
```

* **METTI DA PARTE ANCHE I FILE NUOVI**
```bash
git stash -u
```

* **METTI DA PARTE UN SOLO FILE**
```bash
git stash push file
```

* **RECUPERA LE MODIFICHE MESSE DA PARTE (e cancella lo stash)**
```bash
git stash pop
```

* **RECUPERA MA TIENI LO STASH (per applicarlo su più branch)**
```bash
git stash apply
```

* **RECUPERA UNO STASH SPECIFICO**
```bash
git stash pop stash@{2}
```

* **GUARDA LE MODIFICHE MESSE DA PARTE**
```bash
git stash list
```

* **GUARDA COSA CONTIENE UNO STASH**
```bash
git stash show -p stash@{0}
```

* **CREA UN BRANCH DA UNO STASH**
```bash
git stash branch nome-branch
```

* **CANCELLA ULTIMO STASH**
```bash
git stash drop
```

* **⚠️ CANCELLA TUTTI GLI STASH**
```bash
git stash clear
```

> Scenario tipico: sei a metà lavoro e devi cambiare branch → `git stash` · `git switch altro` · ... · `git switch torna` · `git stash pop`

#### 

#### **STORICO:**

#### 

* **GUARDA STORICO COMMIT (il codice all'inizio è l'hash)**
```bash
git log --oneline
```

* **STORICO A GRAFO (vedi branch e merge)**
```bash
git log --oneline --graph --all
```

* **ULTIMI N COMMIT**
```bash
git log --oneline -10
```

* **COMMIT DI UNA PERSONA**
```bash
git log --author="Nome" --oneline
```

* **COMMIT IN UN PERIODO**
```bash
git log --since="2 weeks ago" --oneline
git log --since="2026-09-01" --until="2026-09-15" --oneline
```

* **STORICO DI UN FILE (anche se rinominato)**
```bash
git log --follow --oneline file
```

* **STORICO DI UN FILE CON LE MODIFICHE**
```bash
git log -p file
```

* **COMMIT PRESENTI IN UN BRANCH MA NON IN MAIN**
```bash
git log main..nome-branch --oneline
```

* **COMMIT DA PUSHARE**
```bash
git log origin/nome-branch..HEAD --oneline
```

* **GUARDA COSA HA CAMBIATO UN COMMIT**
```bash
git show hash-del-commit
```

* **SOLO I FILE TOCCATI DA UN COMMIT**
```bash
git show --stat hash-del-commit
```

* **GUARDA UN FILE COM'ERA IN UN COMMIT**
```bash
git show hash-del-commit:percorso/file
```

* **CHI HA SCRITTO OGNI RIGA DI UN FILE**
```bash
git blame file
```

* **CHI HA SCRITTO CERTE RIGHE**
```bash
git blame -L 10,30 file
```

* **QUANTI COMMIT PER PERSONA**
```bash
git shortlog -sn
```

* **GUARDA CODICE DEL COMMIT (modalità sola lettura)**
```bash
git checkout hash-del-commit
```
Sei in "detached HEAD": per tornare `git switch nome-branch`

#### 

#### **ANNULLARE:**

#### 

| Situazione | Comando |
|---|---|
| modifiche non in stage da buttare | `git restore file` ⚠️ |
| file in stage da togliere | `git restore --staged file` |
| ultimo commit, tenere le modifiche in stage | `git reset --soft HEAD~1` |
| ultimo commit, tenere le modifiche fuori stage | `git reset HEAD~1` |
| ultimo commit, buttare tutto | `git reset --hard HEAD~1` ⚠️ |
| commit già pushato | `git revert hash-del-commit` |
| merge in corso | `git merge --abort` |
| merge appena fatto | `git reset --hard ORIG_HEAD` ⚠️ |
| rebase in corso | `git rebase --abort` |
| ho sbagliato tutto | vedi [Reflog](#reflog-salvavita) |

> **reset** riscrive lo storico (solo commit non pushati) · **revert** crea un nuovo commit che annulla (sicuro anche dopo il push)

* **CANCELLA ULTIMO COMMIT MA TIENI LE MODIFICHE**
```bash
git reset --soft HEAD~1
```

* **⚠️ CANCELLA ULTIMO COMMIT E LE MODIFICHE**
```bash
git reset --hard HEAD~1
```

* **⚠️ RIPORTA IL CODICE A QUEL COMMIT E CANCELLA I SUCCESSIVI**
```bash
git reset --hard hash-del-commit
```

* **⚠️ RIPRISTINA BRANCH ATTUALE A BRANCH LOCALE**
```bash
git reset --hard nome-branch
```

* **⚠️ RIPRISTINA BRANCH ATTUALE A BRANCH REMOTE (butta tutto il locale)**
```bash
git fetch
git reset --hard origin/nome-branch
```

* **ANNULLA IL COMMIT INDICATO (crea un commit inverso)**
```bash
git revert hash-del-commit
```

* **ANNULLA SENZA COMMITTARE SUBITO**
```bash
git revert --no-commit hash-del-commit
```

* **RIPORTA UN SOLO FILE A COM'ERA IN UN COMMIT**
```bash
git restore --source hash-del-commit file
```

* **RECUPERA UN FILE CANCELLATO**
```bash
git restore file
```
se già committato: `git restore --source hash-prima-della-cancellazione file`

#### 

#### **REFLOG SALVAVITA:**

#### 

> Git registra ogni spostamento per circa 90 giorni: quasi tutto è recuperabile, anche dopo un `reset --hard`.

* **GUARDA TUTTO QUELLO CHE HAI FATTO**
```bash
git reflog
```

* **TORNA A UNO STATO PRECEDENTE**
```bash
git reset --hard HEAD@{3}
```
il numero lo prendi dal reflog

* **RECUPERA UN BRANCH CANCELLATO**
```bash
git reflog
git switch -c nome-branch hash-del-commit
```

* **RECUPERA UN COMMIT PERSO SENZA TOCCARE IL BRANCH ATTUALE**
```bash
git branch recupero hash-del-commit
```

#### 

#### **CHERRY PICK:**

#### 

* **COPIA UN COMMIT DA UN ALTRO BRANCH NEL BRANCH ATTUALE**
```bash
git cherry-pick hash-del-commit
```

* **COPIA PIÙ COMMIT**
```bash
git cherry-pick hash1 hash2
```

* **COPIA UN INTERVALLO DI COMMIT (da hash1 escluso a hash2)**
```bash
git cherry-pick hash1..hash2
```

* **COPIA SENZA COMMITTARE**
```bash
git cherry-pick -n hash-del-commit
```

* **CONTINUA / ANNULLA DOPO UN CONFLITTO**
```bash
git cherry-pick --continue
git cherry-pick --abort
```

> Tipico: un fix fatto su `develop` che serve subito anche su `main`

#### 

#### **TAG E VERSIONI:**

#### 

* **LISTA TAG**
```bash
git tag
```

* **CREA UN TAG CON DESCRIZIONE**
```bash
git tag -a v1.2.0 -m "Versione 1.2.0"
```

* **TAG SU UN COMMIT PASSATO**
```bash
git tag -a v1.1.0 hash-del-commit -m "Versione 1.1.0"
```

* **PUSHA UN TAG**
```bash
git push origin v1.2.0
```

* **PUSHA TUTTI I TAG**
```bash
git push --tags
```

* **ELIMINA TAG LOCALE E REMOTE**
```bash
git tag -d v1.2.0
git push origin --delete v1.2.0
```

* **GUARDA IL CODICE DI UNA VERSIONE**
```bash
git switch -c prova-v1.2.0 v1.2.0
```

* **ULTIMO TAG RAGGIUNGIBILE**
```bash
git describe --tags --abbrev=0
```

* **COMMIT DALL'ULTIMA VERSIONE (per il changelog)**
```bash
git log v1.1.0..HEAD --oneline
```

> **Versioni** `MAJOR.MINOR.PATCH` · MAJOR = cambi incompatibili · MINOR = nuove funzioni · PATCH = fix

#### 

#### **REMOTE:**

#### 

* **LISTA REMOTE**
```bash
git remote -v
```

* **AGGIUNGI REMOTE**
```bash
git remote add origin https://github.com/utente/nome-progetto.git
```

* **CAMBIA URL DEL REMOTE (es. da HTTPS a SSH)**
```bash
git remote set-url origin git@github.com:utente/nome-progetto.git
```

* **RINOMINA / RIMUOVI REMOTE**
```bash
git remote rename origin vecchio
git remote remove vecchio
```

* **INFO DETTAGLIATE SUL REMOTE**
```bash
git remote show origin
```

* **COLLEGA IL BRANCH LOCALE A UN BRANCH REMOTE**
```bash
git branch --set-upstream-to=origin/nome-branch
```

* **AGGIORNA UN FORK DAL REPO ORIGINALE**
```bash
git remote add upstream https://github.com/originale/nome-progetto.git
git fetch upstream
git merge upstream/main
```

#### 

#### **FILE E GITIGNORE:**

#### 

* **RINOMINA / SPOSTA UN FILE**
```bash
git mv vecchio-nome nuovo-nome
```

* **CAMBIA SOLO MAIUSCOLE DEL NOME (Windows e Mac non se ne accorgono)**
```bash
git mv file.js temp.js
git mv temp.js File.js
```

* **ELIMINA UN FILE**
```bash
git rm file
```

* **SMETTI DI TRACCIARE UN FILE MA TIENILO SUL PC (es. .env committato per errore)**
```bash
git rm --cached file
```
poi aggiungilo al `.gitignore` · se conteneva chiavi, **cambiale**: restano nello storico

* **SMETTI DI TRACCIARE UNA CARTELLA**
```bash
git rm -r --cached cartella
```

* **APPLICA UN .GITIGNORE MODIFICATO A FILE GIÀ TRACCIATI**
```bash
git rm -r --cached .
git add .
git commit -m "Applica gitignore"
```

* **PERCHÉ UN FILE È IGNORATO**
```bash
git check-ignore -v file
```

* **LISTA FILE IGNORATI**
```bash
git status --ignored
```

* **TIENI UNA CARTELLA VUOTA NEL REPO** → crea dentro un file vuoto `.gitkeep`

| Regole .gitignore | |
|---|---|
| `node_modules/` | cartella ovunque |
| `/build` | solo nella radice |
| `*.log` | tutti i file con estensione |
| `.env*` | tutti i file che iniziano così |
| `!.env.example` | eccezione (non ignorare) |
| `# testo` | commento |

* **.GITIGNORE BASE REACT NATIVE**
```text
node_modules/
.env
.env.*
!.env.example

# Android
android/app/build/
android/build/
android/.gradle/
android/local.properties
*.keystore
!debug.keystore

# iOS
ios/Pods/
ios/build/
*.xcuserstate
xcuserdata/

# Firebase (valuta se condividerli col team)
# google-services.json
# GoogleService-Info.plist

# Varie
.DS_Store
*.log
.vscode/
.idea/
```

#### 

#### **PULIZIA:**

#### 

* **VEDI COSA VERREBBE CANCELLATO (prova)**
```bash
git clean -n -d
```

* **⚠️ CANCELLA FILE E CARTELLE NON TRACCIATI**
```bash
git clean -fd
```

* **⚠️ CANCELLA ANCHE I FILE IGNORATI (node_modules, build...)**
```bash
git clean -fdx
```

* **⚠️ RIPARTI DA ZERO COME APPENA CLONATO**
```bash
git fetch
git reset --hard origin/main
git clean -fdx
```

* **OTTIMIZZA IL REPO (più leggero e veloce)**
```bash
git gc
```

* **DIMENSIONE DEL REPO**
```bash
git count-objects -vH
```

#### 

#### **CERCARE:**

#### 

* **CERCA UN TESTO NEI FILE TRACCIATI**
```bash
git grep "testo"
```

* **CERCA CON NUMERO DI RIGA**
```bash
git grep -n "testo"
```

* **CERCA IN UN ALTRO BRANCH**
```bash
git grep "testo" nome-branch
```

* **TROVA IL COMMIT CHE HA AGGIUNTO/TOLTO UN TESTO**
```bash
git log -S "testo" --oneline
```

* **CERCA NEI MESSAGGI DI COMMIT**
```bash
git log --grep="parola" --oneline
```

* **IN QUALI BRANCH C'È UN COMMIT**
```bash
git branch -a --contains hash-del-commit
```

* **TROVA IL COMMIT CHE HA INTRODOTTO UN BUG**
```bash
git bisect start
git bisect bad
git bisect good hash-di-un-commit-funzionante
```
Git ti sposta tra i commit: prova l'app e scrivi `git bisect good` o `git bisect bad` finché trova il colpevole · alla fine `git bisect reset`

#### 

#### **ALIAS:**

#### 

* **CREA SCORCIATOIE**
```bash
git config --global alias.st "status -sb"
git config --global alias.co switch
git config --global alias.br branch
git config --global alias.cm "commit -m"
git config --global alias.lg "log --oneline --graph --all -20"
git config --global alias.last "log -1 --stat"
git config --global alias.undo "reset --soft HEAD~1"
```
Poi usi `git st`, `git lg`, `git undo`...

* **LISTA ALIAS**
```bash
git config --get-regexp alias
```

#### 

#### **SSH E GITHUB:**

#### 

* **CREA UNA CHIAVE SSH**
```bash
ssh-keygen -t ed25519 -C "email@esempio.it"
```
Invio per accettare il percorso predefinito

* **COPIA LA CHIAVE PUBBLICA**

WINDOWS:
```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
```
MAC:
```bash
pbcopy < ~/.ssh/id_ed25519.pub
```
Incollala in GitHub → Settings → SSH and GPG keys → New SSH key

* **VERIFICA LA CONNESSIONE**
```bash
ssh -T git@github.com
```

* **TOKEN AL POSTO DELLA PASSWORD (HTTPS)** → GitHub → Settings → Developer settings → Personal access tokens

* **CAMBIA ACCOUNT GITHUB SALVATO (Windows)** → Gestione credenziali → Credenziali di Windows → rimuovi `git:https://github.com`

#### 

#### **GITHUB CLI:**

#### 

> Da installare: `winget install GitHub.cli` (Windows) · `brew install gh` (Mac)

* **LOGIN**
```bash
gh auth login
```

* **CREA REPO SU GITHUB DALLA CARTELLA ATTUALE**
```bash
gh repo create nome-progetto --private --source=. --push
```

* **CREA UNA PULL REQUEST**
```bash
gh pr create --base main --title "Titolo" --body "Descrizione"
```

* **LISTA PULL REQUEST**
```bash
gh pr list
```

* **SCARICA UNA PULL REQUEST IN LOCALE**
```bash
gh pr checkout numero-pr
```

* **APRI IL REPO NEL BROWSER**
```bash
gh repo view --web
```

* **STATO DELLE PIPELINE (Actions)**
```bash
gh run list
```

#### 

#### **MESSAGGI DI COMMIT:**

#### 

> Formato consigliato: `tipo(ambito): descrizione breve` · es. `fix(auth): corregge login con Google`

| Tipo | Quando |
|---|---|
| `feat` | nuova funzionalità |
| `fix` | correzione bug |
| `refactor` | riorganizzazione senza cambiare comportamento |
| `style` | formattazione, spazi, lint |
| `docs` | documentazione |
| `test` | test |
| `chore` | dipendenze, configurazione, build |
| `perf` | prestazioni |

#### 

#### **PROBLEMI COMUNI:**

#### 

| Problema | Soluzione |
|---|---|
| `rejected ... fetch first` | qualcuno ha pushato prima: `git pull --rebase` poi `git push` |
| `non-fast-forward` dopo amend/rebase | `git push --force-with-lease` (solo sui tuoi branch) |
| `Your local changes would be overwritten` | `git stash` → comando → `git stash pop` |
| `refusing to merge unrelated histories` | `git pull origin main --allow-unrelated-histories` |
| `detached HEAD` | `git switch nome-branch` · se hai fatto commit: `git switch -c nuovo-branch` |
| `has no upstream branch` | `git push -u origin nome-branch` |
| commit sul branch sbagliato | `git reset --soft HEAD~1` → `git stash` → `git switch giusto` → `git stash pop` → commit |
| file modificati solo per fine riga | `git config --global core.autocrlf true` (Windows) |
| `index.lock: File exists` | un altro git è rimasto aperto: chiudi VS Code/terminali e cancella `.git/index.lock` |
| `Permission denied (publickey)` | chiave SSH mancante: vedi [SSH e GitHub](#ssh-e-github) |
| `Authentication failed` | usa un token, non la password |
| `file too large` (oltre 100 MB) | aggiungilo a `.gitignore` e `git rm --cached file` · se già committato serve riscrivere lo storico |
| `.env` pushato per errore | `git rm --cached .env` · gitignore · **cambia subito le chiavi** |
