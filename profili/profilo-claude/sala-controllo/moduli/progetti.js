// PROGETTI DELLA SALA
// Elenco dei progetti registrati, scelta della cartella con la finestra di Windows e registrazione del progetto corrente
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { errore, leggiJson, scriviJson, preparaDati, FILE_PROGETTI } = require('./base');
const { radiceGit } = require('./git');

// PROGETTI
function progetti() {
  return leggiJson(FILE_PROGETTI).filter((p) =>
    p && typeof p.nome === 'string' && typeof p.cartella === 'string'
    && path.isAbsolute(p.cartella) && fs.existsSync(p.cartella));
}

function progetto(dati) {
  const trovato = progetti().find((p) => p.nome === dati.progetto);
  if (!trovato) throw errore(400, `progetto sconosciuto: ${dati.progetto}`);
  return trovato;
}

// SCELTA CARTELLA
// Il browser non può dare il percorso di una cartella: la finestra di Windows la apre il server.
// Lo script è fisso e non contiene nulla che arrivi dalla pagina; il percorso scelto viene solo controllato, non eseguito.
// windowsHide nasconde la prima finestra che il processo apre: la consuma una finestra invisibile (trasparente, 1×1),
// così la finestra di scelta compare davvero, in primo piano
const SCRIPT_CARTELLA = [
  '[Console]::OutputEncoding = [Text.Encoding]::UTF8',
  'Add-Type -AssemblyName System.Windows.Forms',
  '$finestra = New-Object System.Windows.Forms.FolderBrowserDialog',
  "$finestra.Description = 'Scegli la cartella del progetto da aggiungere alla sala di controllo'",
  '$finestra.ShowNewFolderButton = $false',
  '$sopra = New-Object System.Windows.Forms.Form -Property @{ TopMost = $true; ShowInTaskbar = $false; Opacity = 0; FormBorderStyle = 0; Width = 1; Height = 1; StartPosition = 1 }',
  '$sopra.Show()',
  '$sopra.Activate()',
  "if ($finestra.ShowDialog($sopra) -eq 'OK') { $finestra.SelectedPath }",
  '$sopra.Close()',
].join('; ');
let sceltaAperta = false;

function scegliCartella() {
  if (process.platform !== 'win32') throw errore(501, 'la scelta della cartella c\'è solo su Windows');
  if (sceltaAperta) throw errore(409, 'la finestra per scegliere la cartella è già aperta');
  sceltaAperta = true;
  return new Promise((resolve, reject) => {
    execFile('powershell.exe', ['-NoProfile', '-STA', '-Command', SCRIPT_CARTELLA], { windowsHide: true, timeout: 4 * 60 * 1000 }, (e, out) => {
      sceltaAperta = false;
      if (e) return reject(errore(500, 'finestra di scelta chiusa o non avviata'));
      const scelta = out.trim();
      if (!scelta) return resolve({ annullato: true });
      const radice = radiceGit(scelta);
      if (!radice) return reject(errore(400, `${scelta} non è dentro un repo git: la sala lavora solo sui repo`));
      const esistente = progetti().find((p) => stessaCartella(p.cartella, radice));
      resolve({ cartella: radice, nome: esistente?.nome || path.basename(radice), esiste: Boolean(esistente) });
    });
  });
}

const stessaCartella = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();

// Si riconferma che sia la radice di un repo: la pagina potrebbe mandare un percorso qualsiasi
function aggiungiDaPagina(cartella) {
  if (typeof cartella !== 'string' || !path.isAbsolute(cartella) || !fs.existsSync(cartella)) throw errore(400, 'cartella non valida');
  const radice = radiceGit(cartella);
  if (!radice || !stessaCartella(radice, cartella)) throw errore(400, 'la cartella deve essere la radice di un repo git');
  return registraProgetto(radice);
}

// Toglie solo la voce dalla lista: cartella, attività e piani restano dove sono
function rimuoviProgetto(nome) {
  const lista = leggiJson(FILE_PROGETTI);
  if (!lista.some((p) => p?.nome === nome)) throw errore(404, 'progetto non trovato');
  scriviJson(FILE_PROGETTI, lista.filter((p) => p?.nome !== nome));
  return { rimosso: nome };
}

// PROGETTO CORRENTE
// La radice della repo git della cartella da cui si lancia: se non è tra i progetti, si aggiunge con il nome della cartella
function progettoCorrente() {
  const radice = radiceGit(process.cwd());
  if (!radice) return null;
  preparaDati();
  return registraProgetto(radice);
}

function registraProgetto(radice) {
  const lista = leggiJson(FILE_PROGETTI);
  const esistente = lista.find((p) => p && typeof p.cartella === 'string' && stessaCartella(p.cartella, radice));
  if (esistente) return esistente;
  const base = path.basename(radice);
  let nome = base;
  for (let n = 2; lista.some((p) => p?.nome === nome); n++) nome = `${base}-${n}`;
  const nuovo = { nome, cartella: radice };
  scriviJson(FILE_PROGETTI, [...lista, nuovo]);
  console.log(`Progetto aggiunto alla sala: ${nome} (${radice})`);
  return nuovo;
}

module.exports = { progetti, progetto, scegliCartella, aggiungiDaPagina, rimuoviProgetto, progettoCorrente };
