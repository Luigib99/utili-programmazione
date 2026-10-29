@echo off
setlocal

:: COLORI
for /f %%a in ('echo prompt $E^| cmd') do set "ESC=%%a"
set "VERDE=%ESC%[92m"
set "ROSSO=%ESC%[91m"
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
echo   AGGIORNAMENTO DA GITHUB
echo ===================================

call :aggiorna "%REPO%"
if errorlevel 1 goto errore

:: REPO PRIVATE ANNIDATE (Privato\<Progetto>, ognuna con il suo git)
for /d %%D in ("%REPO%\Privato\*") do (
  if exist "%%D\.git" (
    call :aggiorna "%%D"
    if errorlevel 1 goto errore
  )
)

echo.
echo %VERDE%===================================
echo   AGGIORNAMENTO COMPLETATO!
echo ===================================%RESET%
pause
exit /b 0

:: AGGIORNAMENTO DI UNA REPO
:aggiorna
cd /d "%~1"
echo.
echo --- %~nx1 ---
echo 1. Scarico aggiornamenti (git pull)
git rev-parse --abbrev-ref --symbolic-full-name "@{u}" >nul 2>&1
if errorlevel 1 (
  echo    Branch mai inviato su GitHub, niente da scaricare
  exit /b 0
)
git pull --rebase
if errorlevel 1 (
  set "MSG=%~nx1: pull non riuscito: accesso negato, rete assente o modifiche locali non salvate - usa prima Salva"
  exit /b 1
)
exit /b 0

:errore
echo.
echo %ROSSO%===================================
echo   AGGIORNAMENTO NON RIUSCITO
echo   %MSG%
echo ===================================%RESET%
pause
exit /b 1
