#!/bin/zsh

# COLORI
VERDE=$'\e[92m'
ROSSO=$'\e[91m'
RESET=$'\e[0m'

# IN CASO DI ERRORE: messaggio rosso e stop
errore() {
  echo ""
  echo "${ROSSO}==================================="
  echo "  AGGIORNAMENTO NON RIUSCITO"
  echo "  $1"
  echo "===================================${RESET}"
  read -k 1 "?Premi un tasto per chiudere..."
  exit 1
}

# AGGIORNAMENTO DI UNA REPO
aggiorna() {
  local nome="${1:t}"
  cd "$1" || errore "$nome: impossibile entrare nella cartella"
  echo ""
  echo "--- $nome ---"
  echo "1. Scarico aggiornamenti (git pull)"
  if ! git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
    echo "   Branch mai inviato su GitHub, niente da scaricare"
    return
  fi
  git pull --rebase || errore "$nome: pull non riuscito: accesso negato, rete assente o modifiche locali non salvate (usa prima Salva)"
}

# VAI NELLA CARTELLA PRINCIPALE DELLA REPO
REPO="$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null)" || errore "Questa cartella non è una repository git"

echo "==================================="
echo "  AGGIORNAMENTO DA GITHUB"
echo "==================================="

aggiorna "$REPO"

# REPO PRIVATE ANNIDATE (Privato/<Progetto>, ognuna con il suo git)
for dir in "$REPO"/Privato/*(N/); do
  [[ -d "$dir/.git" ]] && aggiorna "$dir"
done

echo ""
echo "${VERDE}==================================="
echo "  AGGIORNAMENTO COMPLETATO!"
echo "===================================${RESET}"
read -k 1 "?Premi un tasto per chiudere..."
