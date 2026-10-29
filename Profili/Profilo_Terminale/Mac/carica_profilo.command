#!/bin/zsh
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SOURCE="$SCRIPT_DIR/profile-mac.zsh"
cat "$SOURCE" >> ~/.zshrc
source ~/.zshrc
echo "Profilo caricato correttamente."