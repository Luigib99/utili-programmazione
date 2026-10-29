#!/bin/zsh

# COLORI
VERDE=$'\e[92m'
ROSSO=$'\e[91m'
GIALLO=$'\e[93m'
RESET=$'\e[0m'

# IN CASO DI ERRORE: messaggio rosso e stop
errore() {
  echo ""
  echo "${ROSSO}==================================="
  echo "  SALVATAGGIO NON RIUSCITO"
  echo "  $1"
  echo "===================================${RESET}"
  read -k 1 "?Premi un tasto per chiudere..."
  exit 1
}

# SINCRO DI UNA REPO
sincro() {
  local nome="${1:t}"
  cd "$1" || errore "$nome: impossibile entrare nella cartella"
  echo ""
  echo "--- $nome ---"

  echo "1. Preparazione dei file (git add)"
  git add -A || errore "$nome: git add non riuscito"
  git add --renormalize . || errore "$nome: sistemazione fine riga non riuscita"

  echo "2. Creazione del commit"
  if git diff --cached --quiet; then
    echo "${GIALLO}   Nessuna modifica nuova da salvare${RESET}"
  else
    git commit -m "salvataggio $(date '+%d/%m/%Y') ore $(date '+%H:%M')" || errore "$nome: commit non riuscito"
  fi

  echo "3. Allineamento con GitHub (git pull)"
  if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
    git pull --rebase || errore "$nome: pull non riuscito: accesso negato, rete assente o conflitto (se è un conflitto: git rebase --abort)"
  else
    echo "${GIALLO}   Primo invio del branch, salto il pull${RESET}"
  fi

  echo "4. Invio su GitHub (git push)"
  git push -u origin HEAD || errore "$nome: push non riuscito: controlla accesso (token) e connessione"
}

# VAI NELLA CARTELLA PRINCIPALE DELLA REPO
REPO="$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null)" || errore "Questa cartella non è una repository git"

echo "==================================="
echo "  AVVIO SINCRO AUTOMATICA GIT"
echo "==================================="

sincro "$REPO"

# REPO PRIVATE ANNIDATE (Privato/<Progetto>, ognuna con il suo git)
for dir in "$REPO"/Privato/*(N/); do
  [[ -d "$dir/.git" ]] && sincro "$dir"
done

echo ""
echo "${VERDE}==================================="
echo "  SINCRO COMPLETATA CON SUCCESSO!"
echo "===================================${RESET}"
read -k 1 "?Premi un tasto per chiudere..."
