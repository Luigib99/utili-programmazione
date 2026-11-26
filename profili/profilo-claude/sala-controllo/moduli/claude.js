// AVVIO DI CLAUDE
// Lancia claude -p in background per le funzioni della sala (mappe, sintesi, compila, quiz) e registra i token usati
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { CARTELLA_CLAUDE } = require('./base');
const consumi = require(path.join(CARTELLA_CLAUDE, 'shared', 'consumi-claude.js'));

// Il percorso dell'eseguibile dell'estensione VS Code cambia a ogni aggiornamento (stessa ricerca del server della chat)
function trovaClaude() {
  const binario = process.platform === 'win32' ? 'claude.exe' : 'claude';
  const cartella = path.join(os.homedir(), '.vscode', 'extensions');
  try {
    const candidati = fs.readdirSync(cartella)
      .filter((nome) => nome.startsWith('anthropic.claude-code-'))
      .map((nome) => path.join(cartella, nome, 'resources', 'native-binary', binario))
      .filter((file) => fs.existsSync(file))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    if (candidati.length) return candidati[0];
  } catch {}
  return 'claude';
}

// AVVIO CLAUDE
// claude -p nella cartella del progetto, senza sessione salvata né server MCP; risolve con il testo della risposta
// e registra i token usati sotto il nome della funzione
function avviaClaude(prog, strumenti, prompt, timeout, funzione) {
  return new Promise((resolve, reject) => {
    const args = [
      '-p', '--output-format', 'json', '--no-session-persistence', '--restricted', '--strict-mcp-config',
      ...strumenti,
      '--permission-mode', 'dontAsk',
    ];
    // Senza chiavi API nell'ambiente claude può usare solo il login dell'abbonamento, mai la fatturazione a consumo
    const { ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, ...ambiente } = process.env;
    const figlio = spawn(trovaClaude(), args, { cwd: prog.cartella, windowsHide: true, env: ambiente });
    let out = '';
    let err = '';
    const timer = setTimeout(() => figlio.kill(), timeout);
    figlio.stdout.on('data', (d) => { out += d; });
    figlio.stderr.on('data', (d) => { err += d; });
    figlio.on('error', (e) => {
      clearTimeout(timer);
      reject(new Error(`claude non avviato: ${e.message}`));
    });
    figlio.on('close', () => {
      clearTimeout(timer);
      try {
        resolve(risultatoClaude(out, err, funzione));
      } catch (e) {
        reject(e);
      }
    });
    figlio.stdin.end(prompt);
  });
}

// Anche una risposta in errore ha consumato token: si registra prima di controllare l'esito
function risultatoClaude(out, err, funzione) {
  let risultato;
  try {
    risultato = JSON.parse(out);
  } catch {
    throw new Error((err || out || 'nessuna risposta (tempo scaduto?)').trim().slice(0, 500));
  }
  consumi.registra(funzione, risultato);
  if (risultato.is_error) throw new Error(risultato.result || 'errore di claude');
  return String(risultato.result || '');
}

module.exports = { trovaClaude, avviaClaude };
