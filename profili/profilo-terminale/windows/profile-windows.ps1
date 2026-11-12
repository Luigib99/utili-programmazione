# IMPOSTA PREFISSO COMANDI
# $onEmpty (opzionale): scriptblock eseguito con Invio a vuoto; deve restituire il comando da lanciare
# (stringa vuota = nessun comando).
function Set-CmdPrefix($p, $onEmpty = $null) {
    $global:cmdPrefix = "$p "
    $global:cmdOnEmpty = $onEmpty
    $global:cmdPrompt = if ($onEmpty) { "$p (premi invio)> " } else { "$p> " }
    function global:prompt { $global:cmdPrompt }
    function global:PSConsoleHostReadLine {
        $l = [Microsoft.PowerShell.PSConsoleReadLine]::ReadLine($Host.Runspace, $ExecutionContext)
        if ([string]::IsNullOrWhiteSpace($l)) {
            if ($global:cmdOnEmpty) { return (& $global:cmdOnEmpty) }
            return $l
        }
        if ($l -eq 'exit') { return $l }
        if ($l.StartsWith('!')) { return $l.Substring(1) }
        return ($global:cmdPrefix + $l)
    }
}

# MENU SCRIPT NPM
# Elenca gli script del package.json della cartella corrente e restituisce "npm run <scelto>".
# Esclude gli hook automatici (postinstall, pre<script>/post<script>, ...) e gli script ios (solo Mac).
# Se nel progetto c'e' un file .npm-menu (uno script per riga, # per i commenti) mostra solo
# quelli, nell'ordine del file.
function Select-NpmScript {
    if (-not (Test-Path package.json)) {
        Write-Host "Nessun package.json in questa cartella." -ForegroundColor Yellow
        return ''
    }

    $scripts = @((Get-Content package.json -Raw | ConvertFrom-Json).scripts.PSObject.Properties.Name)
    $lifecycle = 'preinstall', 'install', 'postinstall', 'prepare', 'prepublishOnly', 'prepack', 'postpack', 'preversion', 'version', 'postversion'
    $names = @($scripts | Where-Object {
        $isHook = ($lifecycle -contains $_) -or ($_ -match '^(pre|post)(.+)$' -and $scripts -contains $Matches[2])
        -not $isHook -and $_ -notmatch '^ios'
    })

    if (Test-Path .npm-menu) {
        $wanted = @(Get-Content .npm-menu | ForEach-Object { ($_ -replace '#.*$', '').Trim() } | Where-Object { $_ })
        $missing = @($wanted | Where-Object { $scripts -notcontains $_ })
        if ($missing.Count -gt 0) {
            Write-Host "In .npm-menu ma non in package.json: $($missing -join ', ')" -ForegroundColor Yellow
        }
        $names = @($wanted | Where-Object { $names -contains $_ })
    }

    for ($i = 0; $i -lt $names.Count; $i++) {
        Write-Host ("{0,3}) {1}" -f ($i + 1), $names[$i])
    }

    $choice = Read-Host "Numero"
    if ($choice -match '^\d+$' -and [int]$choice -ge 1 -and [int]$choice -le $names.Count) {
        return "npm run $($names[[int]$choice - 1])"
    }
    return ''
}

# MENU COMANDI NPX
# Comandi utili non coperti dagli script npm, scelti in base al tipo di progetto (React Native o Vite).
# run-android/run-ios restano negli script npm: lanciati da qui salterebbero ENVFILE.
function Select-NpxCommand {
    if (-not (Test-Path package.json)) {
        Write-Host "Nessun package.json in questa cartella." -ForegroundColor Yellow
        return ''
    }

    $package = Get-Content package.json -Raw | ConvertFrom-Json
    $deps = @($package.dependencies.PSObject.Properties.Name) + @($package.devDependencies.PSObject.Properties.Name)

    $commands = @()
    if ($deps -contains 'react-native') {
        $commands = 'react-native start', 'react-native start --reset-cache', 'react-native log-android',
                    'react-native doctor', 'react-native info', 'eslint . --fix', 'jest --watch', 'kill-port 8081'
    } elseif ($deps -contains 'vite') {
        $commands = 'eslint . --fix', 'kill-port 3000'
    } else {
        Write-Host "Progetto non riconosciuto: serve react-native o vite tra le dipendenze." -ForegroundColor Yellow
        return ''
    }

    for ($i = 0; $i -lt $commands.Count; $i++) {
        Write-Host ("{0,3}) {1}" -f ($i + 1), $commands[$i])
    }

    $choice = Read-Host "Numero"
    if ($choice -match '^\d+$' -and [int]$choice -ge 1 -and [int]$choice -le $commands.Count) {
        return "npx $($commands[[int]$choice - 1])"
    }
    return ''
}

# MODALITA GIT
function gitmode { Set-CmdPrefix 'git' }

# MODALITA NPM
# Invio a vuoto apre il menu degli script del progetto.
function npmmode { Set-CmdPrefix 'npm' { Select-NpmScript } }

# MODALITA NPX
# Invio a vuoto apre il menu dei comandi npx per il tipo di progetto.
function npxmode { Set-CmdPrefix 'npx' { Select-NpxCommand } }

# SCELTA FILE .HTTP
# Apre la finestra "Apri file" di Windows filtrata sui .http e restituisce il percorso
# completo ($null = finestra chiusa con Annulla).
function Select-HttpFile {
    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Title = "Scegli il file .http"
    $dialog.Filter = "File REST Client (*.http)|*.http"
    $dialog.InitialDirectory = "$HOME\api-requests"

    # Finestra proprietaria sempre in primo piano: senza, la finestra puo' aprirsi dietro VS Code.
    $owner = New-Object System.Windows.Forms.Form -Property @{ TopMost = $true }
    $result = $dialog.ShowDialog($owner)
    $owner.Dispose()

    if ($result -eq [System.Windows.Forms.DialogResult]::OK) { return $dialog.FileName }
    return $null
}

# PIN AVVIO API
# Evita di lanciare lo script con un Invio accidentale (non e' una protezione di sicurezza).
# Dopo il PIN chiede il file .http, che resta valido per la sessione del terminale finche'
# lo script non viene annullato (exit code 2 di axios-inspect.js).
function Confirm-ApiStart {
    $pin = [System.Net.NetworkCredential]::new('', (Read-Host "PIN" -AsSecureString)).Password
    if ($pin -ne '3145') {
        if ($pin) { Write-Host "PIN errato." -ForegroundColor Yellow }
        return ''
    }

    if (-not $global:apiHttpFile) { $global:apiHttpFile = Select-HttpFile }
    if (-not $global:apiHttpFile) { return '' }

    return 'node --inspect axios-inspect.js "' + $global:apiHttpFile + '"; if ($LASTEXITCODE -eq 2) { $global:apiHttpFile = $null }'
}

# MODALITA API
# Invio a vuoto chiede PIN e file .http, poi lancia lo script di ispezione axios; --inspect fa
# agganciare il debugger di VS Code (debug.javascript.autoAttachFilter = onlyWithFlag).
# Altri comandi passano invariati.
function apimode {
    Set-Location "$HOME\api-requests"
    $global:apiHttpFile = $null
    function global:prompt {
        if ($global:apiHttpFile) { "api [$(Split-Path $global:apiHttpFile -Leaf)] (premi invio)> " } else { "api (premi invio)> " }
    }
    function global:PSConsoleHostReadLine {
        $l = [Microsoft.PowerShell.PSConsoleReadLine]::ReadLine($Host.Runspace, $ExecutionContext)
        if ([string]::IsNullOrWhiteSpace($l)) { return (Confirm-ApiStart) }
        return $l
    }
}

