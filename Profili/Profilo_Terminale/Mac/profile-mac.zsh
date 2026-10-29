# PREPENDE PREFISSO AL COMANDO
# EMPTY_ENTER_CMD (usata da apimode): comando eseguito quando si preme Invio a vuoto.
prefix_accept_line() {
  if [[ -z "$BUFFER" && -n "$EMPTY_ENTER_CMD" ]]; then
    BUFFER="$EMPTY_ENTER_CMD"
  elif [[ -n "$CMD_PREFIX" && -n "$BUFFER" && "$BUFFER" != "exit" ]]; then
    if [[ "$BUFFER" == '!'* ]]; then
      BUFFER="${BUFFER#!}"
    else
      BUFFER="$CMD_PREFIX $BUFFER"
    fi
  fi
  zle .accept-line
}
zle -N accept-line prefix_accept_line

# MODALITA GIT
gitmode() { unset EMPTY_ENTER_CMD; export CMD_PREFIX="git"; export PROMPT="git> "; clear }

# MENU SCRIPT NPM
# Elenca gli script del package.json della cartella corrente e lancia "npm run <scelto>".
# Esclude gli hook automatici (postinstall, pre<script>/post<script>, ...).
# Se nel progetto c'è un file .npm-menu (uno script per riga, # per i commenti) mostra solo
# quelli, nell'ordine del file.
npm_menu() {
  if [[ ! -f package.json ]]; then
    echo "Nessun package.json in questa cartella."
    return
  fi

  local -a names
  names=("${(@f)$(node -e '
    const fs = require("fs");
    const scripts = require("./package.json").scripts || {};
    const lifecycle = ["preinstall", "install", "postinstall", "prepare", "prepublishOnly", "prepack", "postpack", "preversion", "version", "postversion"];
    let names = Object.keys(scripts).filter((name) => {
      const hook = name.match(/^(pre|post)(.+)$/);
      return !lifecycle.includes(name) && !(hook && hook[2] in scripts);
    });
    if (fs.existsSync(".npm-menu")) {
      const wanted = fs.readFileSync(".npm-menu", "utf8").split(/\r?\n/).map((line) => line.replace(/#.*$/, "").trim()).filter(Boolean);
      const missing = wanted.filter((name) => !(name in scripts));
      if (missing.length) console.error(`In .npm-menu ma non in package.json: ${missing.join(", ")}`);
      names = wanted.filter((name) => names.includes(name));
    }
    console.log(names.join("\n"));
  ')}")

  local i
  for i in {1..${#names}}; do printf "%3d) %s\n" $i "${names[$i]}"; done

  local choice
  read "choice?Numero: "
  if [[ "$choice" == <-> ]] && (( choice >= 1 && choice <= ${#names} )); then
    npm run "${names[$choice]}"
  fi
}

# MODALITA NPM
# Invio a vuoto apre il menu degli script del progetto.
npmmode() { export EMPTY_ENTER_CMD="npm_menu"; export CMD_PREFIX="npm"; export PROMPT="npm (premi invio)> "; clear }

# MENU COMANDI NPX
# Comandi utili non coperti dagli script npm, scelti in base al tipo di progetto (React Native o Vite).
# run-android/run-ios restano negli script npm: lanciati da qui salterebbero ENVFILE.
npx_menu() {
  if [[ ! -f package.json ]]; then
    echo "Nessun package.json in questa cartella."
    return
  fi

  local -a commands
  commands=("${(@f)$(node -e '
    const pkg = require("./package.json");
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    let commands = [];
    if ("react-native" in deps) {
      commands = ["react-native start", "react-native start --reset-cache", "react-native log-android", "react-native log-ios",
                  "react-native doctor", "react-native info", "eslint . --fix", "jest --watch", "pod-install", "kill-port 8081"];
    } else if ("vite" in deps) {
      commands = ["eslint . --fix", "kill-port 3000"];
    }
    console.log(commands.join("\n"));
  ')}")

  if [[ -z "${commands[1]}" ]]; then
    echo "Progetto non riconosciuto (né react-native né vite)."
    return
  fi

  local i
  for i in {1..${#commands}}; do printf "%3d) %s\n" $i "${commands[$i]}"; done

  local choice
  read "choice?Numero: "
  if [[ "$choice" == <-> ]] && (( choice >= 1 && choice <= ${#commands} )); then
    eval "npx ${commands[$choice]}"
  fi
}

# MODALITA NPX
# Invio a vuoto apre il menu dei comandi npx per il tipo di progetto.
npxmode() { export EMPTY_ENTER_CMD="npx_menu"; export CMD_PREFIX="npx"; export PROMPT="npx (premi invio)> "; clear }

# SCELTA FILE .HTTP
# Apre la finestra di selezione file del Finder e salva il percorso in API_HTTP_FILE
# (ritorna 1 se la finestra viene chiusa con Annulla o il file non è un .http).
api_select_http() {
  local file
  file=$(osascript -e "POSIX path of (choose file with prompt \"Scegli il file .http\" default location (POSIX file \"$HOME/api-requests\"))" 2>/dev/null) || return 1
  if [[ "$file" != *.http ]]; then
    echo "Non è un file .http."
    return 1
  fi
  API_HTTP_FILE="$file"
}

# PROMPT API
# Mostra il file .http attivo nella sessione.
api_prompt() {
  if [[ -n "$API_HTTP_FILE" ]]; then
    export PROMPT="api [${API_HTTP_FILE:t}] (premi invio)> "
  else
    export PROMPT="api (premi invio)> "
  fi
}

# PIN AVVIO API
# Evita di lanciare lo script con un Invio accidentale (non è una protezione di sicurezza).
# Dopo il PIN chiede il file .http, che resta valido per la sessione del terminale finché
# lo script non viene annullato (exit code 2 di axios-inspect.js).
api_start() {
  local pin
  read -s "pin?PIN: "
  echo
  if [[ "$pin" != "3145" ]]; then
    [[ -n "$pin" ]] && echo "PIN errato."
    return
  fi

  if [[ -z "$API_HTTP_FILE" ]]; then
    api_select_http || return
  fi

  node --inspect axios-inspect.js "$API_HTTP_FILE"
  (( $? == 2 )) && unset API_HTTP_FILE
  api_prompt
}

# MODALITA API
# Invio a vuoto chiede PIN e file .http, poi lancia lo script di ispezione axios; --inspect fa
# agganciare il debugger di VS Code (debug.javascript.autoAttachFilter = onlyWithFlag).
# Altri comandi passano invariati.
apimode() {
  cd ~/api-requests
  unset CMD_PREFIX
  unset API_HTTP_FILE
  export EMPTY_ENTER_CMD="api_start"
  api_prompt
  clear
}
