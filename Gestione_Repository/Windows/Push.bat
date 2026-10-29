@echo off
setlocal

:: COLORI
for /f %%a in ('echo prompt $E^| cmd') do set "ESC=%%a"
set "VERDE=%ESC%[92m"
set "ROSSO=%ESC%[91m"
set "GIALLO=%ESC%[93m"
set "RESET=%ESC%[0m"

:: VAI NELLA CARTELLA PRINCIPALE DELLA REPO
cd /d "%~dp0"
for /f "delims=" %%i in ('git rev-parse --show-toplevel 2^>nul') do set "REPO=%%i"
if not defined REPO (
  set "MSG=Questa cartella non e' una repository git"
  goto errore
)
set "REPO=%REPO:/=\%"
cd /d "%REPO%"

echo ===================================
echo   AVVIO SINCRO AUTOMATICA GIT
echo ===================================

set "ORA=%TIME:~0,5%"
set "ORA=%ORA: =0%"

call :sincro "%REPO%"
if errorlevel 1 goto errore

:: REPO PRIVATE ANNIDATE (Privato\<Progetto>, ognuna con il suo git)
for /d %%D in ("%REPO%\Privato\*") do (
  if exist "%%D\.git" (
    call :sincro "%%D"
    if errorlevel 1 goto errore
  )
)

echo.
echo %VERDE%===================================
echo   SINCRO COMPLETATA CON SUCCESSO!
echo ===================================%RESET%
pause
exit /b 0

:: SINCRO DI UNA REPO
:sincro
cd /d "%~1"
echo.
echo --- %~nx1 ---

echo 1. Preparazione dei file (git add)
git add -A
if errorlevel 1 (
  set "MSG=%~nx1: git add non riuscito"
  exit /b 1
)
git add --renormalize .
if errorlevel 1 (
  set "MSG=%~nx1: sistemazione fine riga non riuscita"
  exit /b 1
)

echo 2. Creazione del commit
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "salvataggio %DATE% ore %ORA%"
  if errorlevel 1 (
    set "MSG=%~nx1: commit non riuscito"
    exit /b 1
  )
) else (
  echo %GIALLO%   Nessuna modifica nuova da salvare%RESET%
)

echo 3. Allineamento con GitHub (git pull)
git rev-parse --abbrev-ref --symbolic-full-name "@{u}" >nul 2>&1
if errorlevel 1 (
  echo %GIALLO%   Primo invio del branch, salto il pull%RESET%
) else (
  git pull --rebase
  if errorlevel 1 (
    set "MSG=%~nx1: pull non riuscito: accesso negato, rete assente o conflitto - se e' un conflitto: git rebase --abort"
    exit /b 1
  )
)

echo 4. Invio su GitHub (git push)
git push -u origin HEAD
if errorlevel 1 (
  set "MSG=%~nx1: push non riuscito: controlla accesso - token - e connessione"
  exit /b 1
)
exit /b 0

:errore
echo.
echo %ROSSO%===================================
echo   SALVATAGGIO NON RIUSCITO
echo   %MSG%
echo ===================================%RESET%
pause
exit /b 1
