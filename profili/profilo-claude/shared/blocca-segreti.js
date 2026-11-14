#!/usr/bin/env node
// HOOK ANTI-SEGRETI: blocca i comandi Bash/PowerShell che toccano file sensibili.
// Registrato in settings.json come PreToolUse. Exit 2 = comando bloccato.

const PATTERN_SENSIBILI = [
  /(^|[\s"'\/\\=])\.env(\.[\w-]+)?(\s|$|["'])/i,
  /\.keystore\b/i,
  /\.jks\b/i,
  /\.p12\b|\.pfx\b|\.pem\b/i,
  /id_(rsa|ed25519|ecdsa)/i,
  /[\/\\]\.ssh([\/\\]|\b)/i,
  /\.credentials\.json/i,
  /[\/\\]\.claude\.json/i,
  /\.git-credentials/i,
  /GitHub CLI[\/\\]hosts\.yml/i,
  /gradle\.properties/i,
  /local\.properties/i,
  /google-services\.json/i,
  /chat-mappa-token/i,
  /sala-controllo[\/\\]dati/i,
  /[\/\\]\.android([\/\\]|\b)/i,
  /\.aws[\/\\]credentials/i,
  /\.npmrc\b/i,
];

const PATTERN_PERICOLOSI = [
  { regex: /git\s+push\s+.*(--force\b|-f\b)/i, motivo: "force push" },
  { regex: /git\s+commit\s+.*--no-verify/i, motivo: "commit senza hook" },
  { regex: /git\s+add\s+.*\.env/i, motivo: "aggiunta di .env a git" },
];

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let comando = "";
  try {
    const dati = JSON.parse(input);
    comando = String(dati?.tool_input?.command ?? "");
  } catch {
    process.exit(0);
  }

  const sensibile = PATTERN_SENSIBILI.find((p) => p.test(comando));
  if (sensibile) {
    console.error(`Bloccato: il comando tocca un file sensibile (${sensibile}).`);
    process.exit(2);
  }

  const pericoloso = PATTERN_PERICOLOSI.find((p) => p.regex.test(comando));
  if (pericoloso) {
    console.error(`Bloccato: ${pericoloso.motivo}.`);
    process.exit(2);
  }

  process.exit(0);
});
