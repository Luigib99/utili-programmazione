// Analisi del codice condivisa tra il server della sala e la pagina: tokenizzatore, dichiarazioni, suggerimenti
// e il tracciamento delle funzionalità. Non usa né DOM né file: i file li fornisce chi la usa (vedi creaTracciatore).
(function (radice, fabbrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabbrica();
  else radice.AnalisiCodice = fabbrica();
}(typeof self !== 'undefined' ? self : this, () => {
  const PAROLE_CHIAVE = new Set('import export default from as const let var function return async await if else for of in while do switch case break continue try catch finally throw new class extends super typeof instanceof delete void yield static get set interface type enum implements declare readonly public private protected abstract keyof satisfies'.split(' '));
  const LETTERALI = new Set(['true', 'false', 'null', 'undefined', 'this', 'NaN', 'Infinity']);
  const DICHIARAZIONI = new Set(['const', 'let', 'var']);
  const APERTE = Object.assign(Object.create(null), { '(': ')', '[': ']', '{': '}' });
  const ESTENSIONI_JS = ['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs'];
  const RIGHE_FUNZIONE_LUNGA = 150;
  const estensione = (p) => (p.match(/\.([^./]+)$/)?.[1] || '').toLowerCase();
  const base = (p) => p.slice(p.lastIndexOf('/') + 1);
  const cartellaDi = (p) => p.slice(0, Math.max(0, p.lastIndexOf('/')));

  // TOKENIZZATORE
  // Regole provate in ordine nella posizione corrente; la / è una regex solo se prima non c'è un valore
  const REGOLE_JS = [
    ['c', /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y],
    ['s', /'(?:\\.|[^'\\\n])*'?|"(?:\\.|[^"\\\n])*"?/y],
    ['s', /`(?:\\[\s\S]|[^`\\])*`?/y],
    ['n', /(?:0[xXbBoO][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?n?|\.\d+)(?![\w$])/y],
    ['w', /[A-Za-z_$][\w$]*/y],
    ['_', /\s+/y],
    ['o', /=>|\?\.(?!\d)|\?\?=?|\.\.\.|[=!]==?|&&=?|\|\|=?|[-+*/%<>&|^!~?:;,.(){}[\]=@#]/y],
  ];
  const REGEX_JS = /\/(?![*/])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n[])+\/[dgimsuyv]*/y;

  const REGOLE_CSS = [
    ['c', /\/\*[\s\S]*?(?:\*\/|$)/y],
    ['s', /'(?:\\.|[^'\\\n])*'?|"(?:\\.|[^"\\\n])*"?/y],
    ['k', /@[\w-]+/y],
    ['n', /#[\da-fA-F]{3,8}\b|-?\d*\.?\d+(?:%|[a-zA-Z]+)?/y],
    ['w', /-?[A-Za-z_][\w-]*/y],
    ['_', /\s+/y],
    ['o', /[{}();:,.>+~*[\]=!]/y],
  ];

  const REGOLE_JSON = [
    ['s', /"(?:\\.|[^"\\\n])*"?/y],
    ['n', /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y],
    ['w', /[A-Za-z_]+/y],
    ['_', /\s+/y],
    ['o', /[{}[\]:,]/y],
  ];

  const REGOLE_HTML = [
    ['c', /<!--[\s\S]*?(?:-->|$)/y],
    ['t', /<\/?[A-Za-z][\w-]*|\/?>/y],
    ['s', /"[^"]*"?|'[^']*'?/y],
    ['w', /[A-Za-z_:][\w:.-]*/y],
    ['_', /\s+/y],
    ['o', /./y],
  ];

  function tokenizza(testo, regole, conRegex) {
    const token = [];
    let i = 0;
    let precedente = null;
    while (i < testo.length) {
      let preso = null;
      // Dopo < è la chiusura di un tag JSX (</div>), non una regex
      if (conRegex && testo[i] === '/' && !(precedente && (precedente.tipo === 'w' && !PAROLE_CHIAVE.has(precedente.testo) || precedente.tipo === 'n' || precedente.tipo === 's' || [')', ']', '}', '<'].includes(precedente.testo)))) {
        REGEX_JS.lastIndex = i;
        const m = REGEX_JS.exec(testo);
        if (m) preso = ['r', m[0]];
      }
      if (!preso) {
        for (const [tipo, regola] of regole) {
          regola.lastIndex = i;
          const m = regola.exec(testo);
          if (m && m[0]) {
            preso = [tipo, m[0]];
            break;
          }
        }
      }
      if (!preso) preso = ['o', testo[i]];
      const t = { tipo: preso[0], testo: preso[1] };
      token.push(t);
      if (t.tipo !== '_' && t.tipo !== 'c') precedente = t;
      i += preso[1].length;
    }
    return token;
  }

  // CLASSI DEI TOKEN
  // Dà a ogni parola il suo colore: parola chiave, funzione chiamata, componente/tag, proprietà dopo il punto
  function classificaJs(token) {
    const significativi = token.filter((t) => t.tipo !== '_' && t.tipo !== 'c');
    significativi.forEach((t, i) => {
      if (t.tipo !== 'w') return;
      const prima = significativi[i - 1]?.testo;
      const dopo = significativi[i + 1]?.testo;
      if (prima === '.' || prima === '?.') {
        t.proprieta = true;
        t.classe = dopo === '(' ? 'f' : 'p';
      } else if (PAROLE_CHIAVE.has(t.testo)) t.classe = 'k';
      else if (LETTERALI.has(t.testo)) t.classe = 'l';
      else if ((prima === '<' || (prima === '/' && significativi[i - 2]?.testo === '<'))) t.classe = 't';
      else if (dopo === '(') t.classe = 'f';
      else if (/^[A-Z]/.test(t.testo)) t.classe = 'y';
    });
  }

  function classificaCss(token) {
    let profondita = 0;
    token.forEach((t, i) => {
      if (t.testo === '{') profondita++;
      if (t.testo === '}') profondita = Math.max(0, profondita - 1);
      if (t.tipo !== 'w') return;
      let j = i + 1;
      while (token[j]?.tipo === '_') j++;
      t.classe = profondita > 0 && token[j]?.testo === ':' ? 'p' : profondita === 0 ? 'y' : 'v';
    });
  }

  function classificaJson(token) {
    token.forEach((t, i) => {
      let j = i + 1;
      while (token[j]?.tipo === '_') j++;
      if (t.tipo === 's' && token[j]?.testo === ':') t.classe = 'p';
      if (t.tipo === 'w') t.classe = 'l';
    });
  }

  function tokenDelFile(percorso, testo) {
    const ext = estensione(percorso);
    if (ESTENSIONI_JS.includes(ext)) {
      const token = tokenizza(testo, REGOLE_JS, true);
      classificaJs(token);
      return token;
    }
    if (['css', 'scss', 'less'].includes(ext)) {
      const token = tokenizza(testo, REGOLE_CSS, false);
      classificaCss(token);
      return token;
    }
    if (['json', 'jsonc'].includes(ext) || base(percorso) === '.eslintrc') {
      const token = tokenizza(testo, REGOLE_JSON, false);
      classificaJson(token);
      return token;
    }
    if (['html', 'htm', 'xml', 'svg'].includes(ext)) return tokenizza(testo, REGOLE_HTML, false);
    if (ext === 'md') return testo.split(/(\n)/).map((r) => ({ tipo: /^#{1,6}\s/.test(r) ? 'k' : /^\s*[-*]\s/.test(r) ? 'p' : '_', testo: r }));
    return [{ tipo: '_', testo }];
  }

  function numeraToken(token) {
    let riga = 1;
    for (const t of token) {
      t.riga = riga;
      for (const c of t.testo) if (c === '\n') riga++;
    }
  }

  // ANALISI
  // Riconosce dichiarazioni, componenti, hook e import leggendo i token (commenti e stringhe esclusi)
  function analizzaJs(percorso, token, importiServer) {
    numeraToken(token);
    const sig = token.filter((t) => t.tipo !== '_' && t.tipo !== 'c');
    const chiusura = new Array(sig.length);
    const livello = new Array(sig.length);
    const pila = [];
    sig.forEach((t, i) => {
      livello[i] = pila.length;
      if (APERTE[t.testo] && t.tipo === 'o') pila.push(i);
      else if (t.tipo === 'o' && [')', ']', '}'].includes(t.testo) && pila.length) {
        chiusura[pila.pop()] = i;
        livello[i] = pila.length;
      }
    });
    const fine = (i) => (chiusura[i] !== undefined ? chiusura[i] : sig.length - 1);
    // Fine di un'istruzione: il ; allo stesso livello, la chiusura del blocco che la contiene
    // o, senza punto e virgola, una nuova riga che inizia con un'altra dichiarazione
    const INIZI_ISTRUZIONE = new Set([...DICHIARAZIONI, 'function', 'return', 'export', 'if', 'for', 'while', 'class', 'import']);
    const fineIstruzione = (da, base) => {
      let ultimo = da;
      for (let m = da; m < sig.length;) {
        const s = sig[m];
        if (livello[m] < base) return ultimo;
        if (s.tipo === 'o' && s.testo === ';' && livello[m] === base) return m;
        if (m > da && livello[m] === base && s.riga > sig[ultimo].riga && INIZI_ISTRUZIONE.has(s.testo)) return ultimo;
        ultimo = s.tipo === 'o' && APERTE[s.testo] ? fine(m) : m;
        m = ultimo + 1;
      }
      return ultimo;
    };
    // Il nome della funzione chiamata per ottenere un valore: useAuth() → useAuth, await api.get() → api
    const chiamataIn = (k) => {
      if (sig[k]?.testo === 'await') k++;
      return sig[k]?.tipo === 'w' && ['(', '.'].includes(sig[k + 1]?.testo) ? sig[k].testo : null;
    };
    const haJsx = /\.(jsx|tsx)$/.test(percorso) || sig.some((t, i) => t.classe === 't' && sig[i - 1]?.testo === '<');

    const definizioni = new Map();
    const importati = new Map();
    const dichiarazioni = [];
    const esportati = new Set();
    let esportaDefault = null;

    const definisci = (nome, info) => {
      if (!definizioni.has(nome)) definizioni.set(nome, info);
    };

    // Import: nomi locali e da dove arrivano
    sig.forEach((t, i) => {
      if (t.testo !== 'import' || livello[i] !== 0 || sig[i + 1]?.testo === '(') return;
      let j = i + 1;
      const nomi = [];
      let inGraffe = false;
      while (j < sig.length && sig[j].testo !== 'from' && sig[j].tipo !== 's' && sig[j].testo !== ';') {
        const s = sig[j];
        if (s.testo === '{') inGraffe = true;
        else if (s.testo === '}') inGraffe = false;
        else if (s.tipo === 'w' && s.testo !== 'type' && s.testo !== 'as') {
          const rinominato = sig[j + 1]?.testo === 'as' ? sig[j + 2] : null;
          if (sig[j - 1]?.testo === 'as' && sig[j - 2]?.testo === '*') nomi.push({ locale: s.testo, originale: '*' });
          else if (sig[j - 1]?.testo !== 'as') nomi.push({ locale: rinominato?.testo || s.testo, originale: inGraffe ? s.testo : 'default' });
        }
        j++;
      }
      const sorgente = sig[j]?.testo === 'from' ? sig[j + 1] : sig[j];
      if (!sorgente || sorgente.tipo !== 's') return;
      const specificatore = sorgente.testo.slice(1, -1);
      const risolto = importiServer.find((imp) => imp.specificatore === specificatore)?.risolto || null;
      for (const n of nomi) {
        importati.set(n.locale, { ...n, specificatore, risolto, riga: t.riga });
        definisci(n.locale, { tipo: 'import', riga: t.riga });
      }
    });

    // Parametri: le parole tra le parentesi, saltando valori di default e tipi
    const parametri = (aperta, contenitore) => {
      if (aperta === undefined || sig[aperta]?.testo !== '(') return;
      for (let k = aperta + 1; k < fine(aperta); k++) {
        const s = sig[k];
        if (s.tipo !== 'w' || PAROLE_CHIAVE.has(s.testo) || LETTERALI.has(s.testo)) continue;
        const prima = sig[k - 1]?.testo;
        if (prima === '=' || prima === '.' || (prima === ':' && livello[k] === livello[aperta] + 1)) continue;
        if (sig[k + 1]?.testo === ':' && livello[k] > livello[aperta] + 1) continue;
        definisci(s.testo, { tipo: 'parametro', riga: s.riga, di: contenitore });
      }
    };

    const tipoFunzione = (nome) => (/^use[A-Z0-9]/.test(nome) ? 'hook' : /^[A-Z]/.test(nome) && haJsx ? 'componente' : 'funzione');

    for (let i = 0; i < sig.length; i++) {
      const t = sig[i];
      const esportato = sig[i - 1]?.testo === 'export' || (sig[i - 1]?.testo === 'default' && sig[i - 2]?.testo === 'export')
        || (sig[i - 1]?.testo === 'async' && sig[i - 2]?.testo === 'export');
      const predefinito = sig[i - 1]?.testo === 'default' || (sig[i - 1]?.testo === 'async' && sig[i - 2]?.testo === 'default');

      if (t.testo === 'function' && t.classe === 'k') {
        let j = i + 1;
        if (sig[j]?.testo === '*') j++;
        const nome = sig[j]?.tipo === 'w' ? sig[j].testo : null;
        const aperta = nome ? j + 1 : j;
        if (sig[aperta]?.testo !== '(') continue;
        const corpo = sig[fine(aperta) + 1]?.testo === '{' ? fine(aperta) + 1 : null;
        if (nome) {
          const d = { nome, tipo: tipoFunzione(nome), riga: sig[j].riga, fineRiga: sig[corpo !== null ? fine(corpo) : fine(aperta)].riga, livello: livello[i], inizio: corpo ?? aperta, termine: corpo !== null ? fine(corpo) : fine(aperta), esportato, predefinito };
          dichiarazioni.push(d);
          definisci(nome, { tipo: d.tipo, riga: d.riga });
          if (predefinito) esportaDefault = nome;
        }
        parametri(aperta, nome);
        continue;
      }

      if (t.testo === 'class' && t.classe === 'k' && sig[i + 1]?.tipo === 'w') {
        const nome = sig[i + 1].testo;
        let corpo = i + 2;
        while (corpo < sig.length && sig[corpo].testo !== '{') corpo++;
        dichiarazioni.push({ nome, tipo: 'classe', riga: sig[i + 1].riga, fineRiga: sig[fine(corpo)]?.riga, livello: livello[i], inizio: corpo, termine: fine(corpo), esportato, predefinito });
        definisci(nome, { tipo: 'classe', riga: sig[i + 1].riga });
        continue;
      }

      if ((t.testo === 'interface' || t.testo === 'type' || t.testo === 'enum') && sig[i + 1]?.tipo === 'w' && livello[i] === 0 && ['{', '=', '<'].includes(sig[i + 2]?.testo)) {
        dichiarazioni.push({ nome: sig[i + 1].testo, tipo: 'tipo', riga: sig[i + 1].riga, livello: 0, esportato });
        definisci(sig[i + 1].testo, { tipo: 'tipo', riga: sig[i + 1].riga });
        continue;
      }

      if (!DICHIARAZIONI.has(t.testo)) continue;
      const nomeTok = sig[i + 1];
      if (!nomeTok) continue;

      // Destrutturazione: const [a, setA] = useState(…) oppure const { x, y } = oggetto
      if (nomeTok.testo === '[' || nomeTok.testo === '{') {
        const nomi = [];
        for (let k = i + 2; k < fine(i + 1); k++) {
          const s = sig[k];
          // { mutate: login }: il nome locale è login, la chiave originale mutate
          if (s.tipo === 'w' && sig[k + 1]?.testo !== ':' && sig[k - 1]?.testo !== '=') nomi.push({ s, chiave: sig[k - 1]?.testo === ':' ? sig[k - 2]?.testo : s.testo });
        }
        const valore = sig[fine(i + 1) + 2];
        const daHook = valore?.tipo === 'w' && /^use[A-Z]/.test(valore.testo) ? valore.testo : null;
        const chiamata = chiamataIn(fine(i + 1) + 2);
        const fineRiga = sig[fineIstruzione(fine(i + 1) + 2, livello[i])]?.riga;
        nomi.forEach(({ s, chiave }, n) => definisci(s.testo, { tipo: daHook === 'useState' ? (n === 0 ? 'stato' : 'setter') : 'variabile', riga: s.riga, da: daHook, chiamata, chiave, inizioRiga: t.riga, fineRiga }));
        const primo = nomi[0]?.s;
        if (daHook === 'useState' && primo) dichiarazioni.push({ nome: primo.testo, tipo: 'stato', riga: primo.riga, livello: livello[i] });
        continue;
      }
      if (nomeTok.tipo !== 'w' || sig[i + 2]?.testo !== '=' && sig[i + 2]?.testo !== ':') {
        if (nomeTok.tipo === 'w') definisci(nomeTok.testo, { tipo: 'variabile', riga: nomeTok.riga });
        continue;
      }
      const nome = nomeTok.testo;
      let j = i + 2;
      while (j < sig.length && sig[j].testo !== '=' && livello[j] >= livello[i]) j++;
      j++;
      if (sig[j]?.testo === 'async') j++;
      let tipo = /^[A-Z][A-Z0-9_]+$/.test(nome) ? 'costante' : 'variabile';
      let inizio = null;
      let termine = null;
      const avvolge = sig[j]?.tipo === 'w' && ['memo', 'forwardRef', 'useCallback', 'useMemo', 'lazy', 'createContext', 'styled'].includes(sig[j].testo)
        ? sig[j].testo : (sig[j]?.testo === 'React' && sig[j + 2]?.tipo === 'w' ? sig[j + 2].testo : null);
      if (sig[j]?.testo === 'function') {
        tipo = tipoFunzione(nome);
        const aperta = sig[j + 1]?.testo === '(' ? j + 1 : j + 2;
        parametri(aperta, nome);
        inizio = fine(aperta) + 1;
        termine = sig[inizio]?.testo === '{' ? fine(inizio) : fine(aperta);
      } else if (sig[j]?.testo === '(' && sig[fine(j) + 1]?.testo === '=>' || sig[j]?.tipo === 'w' && sig[j + 1]?.testo === '=>' || sig[j]?.testo === '<') {
        tipo = tipoFunzione(nome);
        let freccia = j;
        while (freccia < sig.length && sig[freccia].testo !== '=>') freccia = sig[freccia].testo === '(' ? fine(freccia) + 1 : freccia + 1;
        if (sig[j].testo === '(') parametri(j, nome);
        else if (sig[j].tipo === 'w') definisci(sig[j].testo, { tipo: 'parametro', riga: sig[j].riga, di: nome });
        inizio = freccia + 1;
        termine = sig[inizio] && APERTE[sig[inizio].testo] ? fine(inizio) : inizio;
      } else if (avvolge) {
        const aperta = sig.findIndex((s, k) => k > j && s.testo === '(');
        tipo = avvolge === 'useCallback' ? 'funzione' : avvolge === 'useMemo' ? 'variabile' : avvolge === 'createContext' ? 'context' : avvolge === 'lazy' ? 'componente' : tipoFunzione(nome);
        inizio = aperta;
        termine = fine(aperta);
        const freccia = sig.findIndex((s, k) => k > aperta && k < termine && s.testo === '=>');
        if (freccia > 0 && sig[aperta + 1]?.testo === '(') parametri(aperta + 1, nome);
      }
      const fineRiga = termine !== null ? sig[termine]?.riga : sig[fineIstruzione(j, livello[i])]?.riga;
      const d = { nome, tipo, riga: nomeTok.riga, livello: livello[i], esportato, predefinito: false, inizio, termine, fineRiga, avvolge };
      dichiarazioni.push(d);
      definisci(nome, { tipo, riga: nomeTok.riga, inizioRiga: t.riga, fineRiga, chiamata: inizio === null ? chiamataIn(j) : null, oggetto: sig[j]?.testo === '{' });
    }

    // Export a fine file: export default Nome; export { a, b }
    // Riesportazioni dei file index: export * from './x' e export { a as b } from './x'
    const riesportaTutto = [];
    const risoltoDa = (k) => (sig[k]?.tipo === 's' ? importiServer.find((imp) => imp.specificatore === sig[k].testo.slice(1, -1))?.risolto || null : null);
    sig.forEach((t, i) => {
      if (t.testo !== 'export' || livello[i] !== 0) return;
      if (sig[i + 1]?.testo === '*' && sig[i + 2]?.testo === 'from') {
        const risolto = risoltoDa(i + 3);
        if (risolto) riesportaTutto.push(risolto);
        return;
      }
      if (sig[i + 1]?.testo === '{' && sig[fine(i + 1) + 1]?.testo === 'from') {
        const k0 = fine(i + 1) + 2;
        const specificatore = sig[k0]?.tipo === 's' ? sig[k0].testo.slice(1, -1) : null;
        for (let k = i + 2; k < fine(i + 1); k++) {
          if (sig[k].tipo !== 'w' || sig[k - 1]?.testo === 'as' || sig[k].testo === 'as') continue;
          const locale = sig[k + 1]?.testo === 'as' ? sig[k + 2].testo : sig[k].testo;
          importati.set(locale, { locale, originale: sig[k].testo, specificatore, risolto: risoltoDa(k0), riga: t.riga });
          definisci(locale, { tipo: 'import', riga: t.riga });
        }
        return;
      }
      if (sig[i + 1]?.testo === 'default' && sig[i + 2]?.tipo === 'w' && !PAROLE_CHIAVE.has(sig[i + 2].testo)) {
        esportaDefault = sig[i + 2].testo === 'memo' || sig[i + 2].testo === 'React' ? sig.slice(i + 3, i + 8).find((s) => s.tipo === 'w' && s.testo !== 'memo')?.testo : sig[i + 2].testo;
      }
      if (sig[i + 1]?.testo === '{') for (let k = i + 2; k < fine(i + 1); k++) if (sig[k].tipo === 'w' && sig[k - 1]?.testo !== 'as') esportati.add(sig[k].testo);
    });
    for (const d of dichiarazioni) {
      if (esportati.has(d.nome)) d.esportato = true;
      if (d.nome === esportaDefault) Object.assign(d, { esportato: true, predefinito: true });
    }

    // Struttura: dichiarazioni di primo livello con dentro le funzioni interne, gli hook e gli stati
    const radice = dichiarazioni.filter((d) => d.livello === 0);
    for (const d of radice) {
      if (d.inizio === null || d.inizio === undefined) continue;
      const dentro = (x) => x.riga >= d.riga && x.riga <= (d.fineRiga ?? d.riga) && x !== d;
      d.figli = dichiarazioni.filter((x) => x.livello > 0 && dentro(x) && ['funzione', 'stato', 'hook', 'componente'].includes(x.tipo) && x.livello <= (livello[d.inizio] ?? 0) + 2);
      const hook = new Map();
      for (let k = d.inizio; k <= d.termine; k++) {
        const s = sig[k];
        if (s.tipo === 'w' && !s.proprieta && /^use[A-Z]/.test(s.testo) && sig[k + 1]?.testo === '(') hook.set(s.testo, (hook.get(s.testo) || 0) + 1);
      }
      d.hook = [...hook];
    }

    return { sig, livello, chiusura, definizioni, importati, dichiarazioni, riesportaTutto, struttura: radice, esportaDefault, suggerimenti: suggerimentiJs(token, sig, chiusura, dichiarazioni) };
  }

  // SUGGERIMENTI
  // Controlli semplici, come un linter alla buona: ognuno spiega il perché
  function suggerimentiJs(token, sig, chiusura, dichiarazioni) {
    const lista = [];
    const aggiungi = (riga, gravita, titolo, perche) => lista.push({ riga, gravita, titolo, perche });
    for (const t of token) {
      if (t.tipo === 'c' && /\b(TODO|FIXME|HACK|XXX)\b/.test(t.testo)) aggiungi(t.riga, 'info', `Nota lasciata: ${t.testo.match(/\b(TODO|FIXME|HACK|XXX)\b/)[1]}`, t.testo.replace(/^\/[/*]\s*|\*\/$/g, '').trim().slice(0, 140));
    }
    sig.forEach((t, i) => {
      const dopo = sig[i + 1]?.testo;
      if (t.testo === 'console' && dopo === '.' && ['log', 'debug', 'info'].includes(sig[i + 2]?.testo)) aggiungi(t.riga, 'avviso', `console.${sig[i + 2].testo} rimasto`, 'I log di debug vanno tolti prima del commit: sporcano la console e possono mostrare dati sensibili.');
      if (t.testo === 'debugger' && t.tipo === 'w') aggiungi(t.riga, 'avviso', 'debugger rimasto', 'Ferma il codice quando gli strumenti per sviluppatori sono aperti: va tolto.');
      if (t.testo === 'var' && t.classe === 'k') aggiungi(t.riga, 'info', 'var al posto di let/const', 'var ignora i blocchi { } e può causare bug: usa const (o let se la variabile cambia).');
      if ((t.testo === '==' || t.testo === '!=') && t.tipo === 'o' && sig[i + 1]?.testo !== 'null') aggiungi(t.riga, 'info', `${t.testo} invece di ${t.testo}=`, 'Il confronto largo converte i tipi (0 == "" è true): usa il confronto stretto.');
      if (t.testo === 'useEffect' && dopo === '(') {
        const chiusa = chiusura[i + 1];
        const virgole = sig.slice(i + 2, chiusa).filter((s, k) => s.testo === ',' && sig.slice(i + 2, i + 2 + k).reduce((p, x) => p + (APERTE[x.testo] ? 1 : [')', ']', '}'].includes(x.testo) ? -1 : 0), 0) === 0).length;
        if (sig[i + 2]?.testo === 'async') aggiungi(t.riga, 'errore', 'useEffect con funzione async', 'useEffect non può ricevere una funzione async (restituirebbe una Promise invece della pulizia): crea una funzione async dentro e chiamala.');
        else if (virgole === 0) aggiungi(t.riga, 'avviso', 'useEffect senza dipendenze', 'Senza il secondo argomento l\'effetto gira dopo OGNI render. Se deve girare solo all\'inizio passa [], altrimenti elenca le variabili che usa.');
      }
      if (t.testo === 'catch' && t.classe === 'k') {
        let k = i + 1;
        if (sig[k]?.testo === '(') k = chiusura[k] + 1;
        if (sig[k]?.testo === '{' && sig[k + 1]?.testo === '}') aggiungi(t.riga, 'avviso', 'catch vuoto', 'L\'errore viene ignorato in silenzio: almeno mostralo all\'utente o scrivi perché si può ignorare.');
      }
      if (t.testo === 'dangerouslySetInnerHTML') aggiungi(t.riga, 'errore', 'HTML inserito senza protezioni', 'Se il contenuto arriva da utenti o dal server può eseguire script (XSS): meglio evitarlo o ripulirlo con una libreria come DOMPurify.');
      if (t.testo === 'key' && dopo === '=' && sig[i + 2]?.testo === '{' && ['index', 'i', 'idx', 'indice'].includes(sig[i + 3]?.testo) && sig[i + 4]?.testo === '}') aggiungi(t.riga, 'info', 'key con l\'indice', 'Se la lista si riordina o si filtra React confonde gli elementi: usa un id stabile.');
      if (t.testo === 'localStorage' && sig[i + 2]?.testo === 'setItem' && sig[i + 3]?.testo === '(' && sig.slice(i + 4, chiusura[i + 3]).some((s) => /token|password|secret|private/i.test(s.testo))) aggiungi(t.riga, 'avviso', 'Dato sensibile in localStorage', 'localStorage è leggibile da qualsiasi script della pagina: un attacco XSS lo ruberebbe.');
    });
    for (const d of dichiarazioni) {
      if (d.fineRiga && ['funzione', 'componente', 'hook'].includes(d.tipo) && d.fineRiga - d.riga > RIGHE_FUNZIONE_LUNGA) {
        aggiungi(d.riga, 'info', `${d.nome} è lunga ${d.fineRiga - d.riga + 1} righe`, 'Una funzione o un componente molto lungo è difficile da leggere e testare: valuta di dividerlo in pezzi più piccoli con un nome chiaro.');
      }
    }
    return lista.sort((a, b) => a.riga - b.riga);
  }

  // ANALISI ALTRI FILE
  function strutturaCss(token) {
    numeraToken(token);
    const voci = [];
    let profondita = 0;
    let selettore = '';
    let riga = null;
    for (const t of token) {
      if (t.testo === '{') {
        if (profondita === 0 || selettore.trim().startsWith('@') === false) {
          const testo = selettore.trim().replace(/\s+/g, ' ');
          if (testo && profondita <= 1) voci.push({ nome: testo.slice(0, 80), tipo: testo.startsWith('@') ? 'regola' : 'selettore', riga, livello: profondita });
        }
        profondita++;
        selettore = '';
        riga = null;
      } else if (t.testo === '}' || t.testo === ';') {
        if (t.testo === '}') profondita = Math.max(0, profondita - 1);
        selettore = '';
        riga = null;
      } else if (t.tipo !== 'c') {
        if (riga === null && t.tipo !== '_') riga = t.riga;
        selettore += t.testo;
      }
    }
    return voci;
  }

  function strutturaMd(testo) {
    return testo.split('\n').map((r, i) => ({ r, i })).filter(({ r }) => /^#{1,6}\s/.test(r))
      .map(({ r, i }) => ({ nome: r.replace(/^#+\s*/, ''), tipo: `h${r.match(/^#+/)[0].length}`, riga: i + 1, livello: r.match(/^#+/)[0].length - 1 }));
  }

  function strutturaJson(testo) {
    try {
      const valore = JSON.parse(testo);
      if (!valore || typeof valore !== 'object' || Array.isArray(valore)) return [];
      const righe = testo.split('\n');
      return Object.keys(valore).map((chiave) => ({ nome: chiave, tipo: Array.isArray(valore[chiave]) ? 'lista' : typeof valore[chiave] === 'object' && valore[chiave] ? 'oggetto' : 'valore', riga: righe.findIndex((r) => r.includes(`"${chiave}"`)) + 1, livello: 0 }));
    } catch {
      return [];
    }
  }

  // LIMITI DEL TRACCIAMENTO
  const MAX_BLOCCHI = 30;
  const MAX_PROFONDITA = 6;
  const MAX_CHIAMANTI = 6;
  const FUNZIONI = ['funzione', 'hook', 'componente', 'classe', 'context'];
  const METODI_HTTP = ['get', 'post', 'put', 'patch', 'delete', 'request'];
  const OGGETTI_HTTP = /api|axios|http|client|instance|request/i;
  const NON_SEGUITI = ['parametro', 'stato', 'setter', 'tipo'];
  const VERBI = { funzione: 'chiama', hook: "usa l'hook", componente: 'disegna', classe: 'usa la classe', context: 'usa il context', variabile: 'usa', costante: 'usa' };

  // TRACCIAMENTO
  // Da un blocco di codice ricostruisce i pezzi coinvolti in tutto il progetto: chi ci arriva, cosa usa a cascata,
  // le pagine raggiunte con navigate e le chiamate al backend. Legge solo import e nomi: non esegue niente.
  // sorgente: { carica(percorso) → voce | null, cerca(testo) → { risultati }, importatoDa(percorso), elenco() }
  function creaTracciatore(sorgente) {
    const caricaAnalisi = sorgente.carica;

    const righeCon = (voce, inizio, fine, regola) => {
      const trovate = [];
      for (let r = inizio; r <= fine; r++) if (regola.test(voce.testo[r - 1] || '')) trovate.push(r);
      return trovate;
    };

    // RISOLUZIONE NOMI
    // Da un nome usato in un file al pezzo di codice che lo definisce, seguendo gli import del progetto (mai i pacchetti npm)
    async function risolviNome(nome, voce, giri = 0, rigaUso = null) {
      const a = voce?.analisi;
      const def = a?.definizioni.get(nome);
      if (!def && giri <= 4) {
        for (const risolto of a?.riesportaTutto || []) {
          const altro = await caricaAnalisi(risolto);
          if (altro?.analisi?.definizioni.has(nome)) return risolviNome(nome, altro, giri + 1);
        }
      }
      if (!def || NON_SEGUITI.includes(def.tipo) || giri > 4) return null;
      // Un nome dichiarato dentro una funzione vale solo lì: se è usato fuori, è un altro nome con lo stesso testo
      if (def.tipo !== 'import' && rigaUso !== null) {
        const ambito = a.dichiarazioni.filter((x) => FUNZIONI.includes(x.tipo) && x.fineRiga && x.riga < def.riga && x.fineRiga >= def.riga).sort((x, y) => y.riga - x.riga)[0];
        if (ambito && (rigaUso < ambito.riga || rigaUso > ambito.fineRiga)) return null;
      }
      if (def.tipo === 'import') {
        const imp = a.importati.get(nome);
        if (!imp?.risolto || imp.originale === '*') return null;
        const altro = await caricaAnalisi(imp.risolto);
        const nomeLa = imp.originale === 'default' ? altro?.analisi?.esportaDefault : imp.originale;
        return nomeLa ? risolviNome(nomeLa, altro, giri + 1) : null;
      }
      const d = a.dichiarazioni.find((x) => x.nome === nome && x.riga === def.riga);
      // lazy(() => import('./Pagina')): il componente vero è l'export default di quel file
      if (d?.avvolge === 'lazy') {
        const imp = (voce.dati.importi || []).find((i) => i.risolto && i.riga >= d.riga && i.riga <= (d.fineRiga ?? d.riga));
        const altro = imp && await caricaAnalisi(imp.risolto);
        if (altro?.analisi?.esportaDefault) return risolviNome(altro.analisi.esportaDefault, altro, giri + 1);
      }
      if (d && FUNZIONI.includes(d.tipo) && d.fineRiga) {
        return { voce, nome, tipo: d.tipo, inizio: d.riga, fine: d.fineRiga, evidenzia: [d.riga], foglia: d.tipo === 'componente' || d.tipo === 'context' };
      }
      const intervallo = { inizio: def.inizioRiga ?? def.riga, fine: Math.max(def.fineRiga ?? def.riga, def.riga) };
      // Variabile ottenuta chiamando una funzione del progetto: const { Login } = useAuth()
      if (def.chiamata) {
        const chiamata = a.definizioni.get(def.chiamata);
        const daNpm = !chiamata || (chiamata.tipo === 'import' && !a.importati.get(def.chiamata)?.risolto);
        if (daNpm) return null;
        return { voce, nome, tipo: 'variabile', ...intervallo, evidenzia: [def.riga], soloChiamata: def.chiamata, chiave: def.chiave };
      }
      if (def.oggetto || def.tipo === 'costante') return { voce, nome, tipo: 'costante', ...intervallo, evidenzia: [def.riga], foglia: true };
      return null;
    }

    // CONTEXT
    // const { Login } = useAuth(): se useAuth legge un context, Login è definito nel Provider di quel context
    async function daContesto(hook, chiave) {
      const a = hook.voce.analisi;
      const k = a.sig.findIndex((s, i) => s.testo === 'useContext' && s.riga >= hook.inizio && s.riga <= hook.fine && a.sig[i + 1]?.testo === '(');
      const contesto = k >= 0 && a.sig[k + 2]?.tipo === 'w' ? a.sig[k + 2].testo : null;
      if (!contesto) return null;
      const { risultati } = await sorgente.cerca(contesto);
      const provider = risultati.find((r) => r.testo.includes(`${contesto}.Provider`) || new RegExp(`<${contesto}\\b`).test(r.testo));
      const voce = provider && await caricaAnalisi(provider.file);
      const d = voce?.analisi?.dichiarazioni.filter((x) => x.nome === chiave && x.fineRiga).sort((x, y) => (FUNZIONI.includes(y.tipo) ? 1 : 0) - (FUNZIONI.includes(x.tipo) ? 1 : 0))[0];
      if (!d) return null;
      // Login dentro AuthProvider ha la maiuscola ma è una funzione del provider, non un componente
      return { voce, nome: chiave, contesto, tipo: d.tipo === 'componente' && d.livello > 0 ? 'funzione' : d.tipo, inizio: d.riga, fine: d.fineRiga, evidenzia: [d.riga] };
    }

    function aggiungiBlocco(ctx, dati) {
      const chiave = `${dati.voce.percorso}:${dati.inizio}`;
      const esistente = ctx.visti.get(chiave);
      if (esistente) {
        ctx.blocchi.push({ id: ctx.blocchi.length, rimando: esistente.id, relazione: dati.relazione, livello: dati.livello, tipo: dati.tipo });
        return null;
      }
      if (ctx.blocchi.filter((b) => b.rimando === undefined).length >= (ctx.max || MAX_BLOCCHI)) {
        ctx.troncato = true;
        return null;
      }
      const blocco = { ...dati, id: ctx.blocchi.length, file: dati.voce.percorso, evidenziate: new Set(dati.evidenzia || [dati.inizio]), parole: new Set(), backend: [], pagine: [], espanse: new Set() };
      ctx.blocchi.push(blocco);
      ctx.visti.set(chiave, blocco);
      return blocco;
    }

    // CHIAMATE AL BACKEND
    // api.post('auth/login') o fetch(url): metodo e indirizzo, se l'indirizzo è scritto nel codice
    function chiamateBackend(blocco, a, indici) {
      const testoArg = (k) => (a.sig[k]?.tipo === 's' ? a.sig[k].testo.slice(1, -1) : a.sig[k]?.testo || '?');
      for (const k of indici) {
        const t = a.sig[k];
        if (a.sig[k + 1]?.testo !== '(') continue;
        if (t.proprieta && METODI_HTTP.includes(t.testo) && OGGETTI_HTTP.test(a.sig[k - 2]?.testo || '')) {
          blocco.backend.push({ riga: t.riga, metodo: t.testo.toUpperCase(), url: testoArg(k + 2) });
        } else if (t.testo === 'fetch' && !t.proprieta) {
          const metodo = a.sig.slice(k + 2, a.chiusura[k + 1]).find((s, i, arr) => arr[i - 2]?.testo === 'method' && s.tipo === 's');
          blocco.backend.push({ riga: t.riga, metodo: metodo ? metodo.testo.slice(1, -1).toUpperCase() : 'GET', url: testoArg(k + 2) });
        } else continue;
        blocco.evidenziate.add(t.riga);
      }
    }

    // NAVIGAZIONE
    // navigate(`/${ROUTE.VERIFY_TOTP}`) → valore della costante → <Route path="/verify-totp" element={<VerifyOTP />}> → componente
    async function valoreMembro(oggetto, proprieta, voce) {
      const bersaglio = await risolviNome(oggetto, voce);
      if (!bersaglio) return null;
      const regola = new RegExp(`\\b${proprieta}\\s*:\\s*(['"\`])([^'"\`]*)\\1`);
      for (let r = bersaglio.inizio; r <= bersaglio.fine; r++) {
        const m = bersaglio.voce.testo[r - 1]?.match(regola);
        if (m) return { valore: m[2], bersaglio, riga: r, nome: `${oggetto}.${proprieta}` };
      }
      return null;
    }

    async function destinazioni(a, voce, da, a2, costanti) {
      const trovate = new Set();
      const membri = [];
      for (let k = da; k < a2; k++) {
        const s = a.sig[k];
        if (s.tipo === 'w' && !s.proprieta && a.sig[k + 1]?.testo === '.' && a.sig[k + 2]?.tipo === 'w') membri.push([s.testo, a.sig[k + 2].testo, null]);
        if (s.tipo === 's') {
          const testo = s.testo.slice(1, -1);
          const dentro = [...testo.matchAll(/\$\{\s*([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\s*\}/g)];
          if (!dentro.length && !testo.includes('${')) trovate.add(testo);
          else membri.push(...dentro.map((m) => [m[1], m[2], testo, m[0]]));
        }
      }
      for (const [oggetto, proprieta, modello, segnaposto] of membri) {
        const membro = await valoreMembro(oggetto, proprieta, voce);
        if (!membro) continue;
        costanti.push(membro);
        trovate.add(modello ? modello.replace(segnaposto, membro.valore) : membro.valore);
      }
      return [...trovate].filter((p) => p && !p.includes('${'));
    }

    async function routePer(percorso) {
      const ultimo = percorso.split('?')[0].replace(/^\/+|\/+$/g, '').split('/').pop();
      if (!ultimo || !/^[\w.:-]{2,100}$/.test(ultimo)) return null;
      const { risultati } = await sorgente.cerca(ultimo);
      const regola = new RegExp(`path\\s*=\\s*\\{?\\s*["'\`]/?([\\w/:.-]*/)?${ultimo.replace(/[.]/g, '\\.')}["'\`]`);
      const riga = risultati.find((r) => regola.test(r.testo));
      if (!riga) return null;
      const componente = riga.testo.match(/element=\{[^}]*?<([A-Z][\w$]*)/)?.[1] || riga.testo.match(/[Cc]omponent=\{([A-Z][\w$]*)/)?.[1];
      return { ...riga, componente };
    }

    // Se la route usa un caricatore del progetto (es. lazyComponent("VerifyOTP")) il nome non porta al file:
    // si cerca allora il file che si chiama come il componente, per convenzione VerifyOTP.jsx
    async function componentePagina(nome, voceRoute) {
      const trovato = await risolviNome(nome, voceRoute);
      if (trovato && FUNZIONI.includes(trovato.tipo)) return trovato;
      const file = (await sorgente.elenco()).find((f) => new RegExp(`(^|/)${nome}\\.(jsx|tsx|js|ts)$`).test(f));
      const voce = file && await caricaAnalisi(file);
      if (!voce?.analisi) return trovato;
      return await risolviNome(voce.analisi.definizioni.has(nome) ? nome : voce.analisi.esportaDefault, voce) || trovato;
    }

    async function navigazioni(ctx, blocco, a, indici) {
      for (const k of indici) {
        const t = a.sig[k];
        let intervallo = null;
        if (t.testo === 'navigate' && !t.proprieta && a.sig[k + 1]?.testo === '(') intervallo = [k + 2, a.chiusura[k + 1] ?? k + 2];
        else if (t.classe === 't' && ['Navigate', 'Link', 'NavLink'].includes(t.testo)) {
          const to = a.sig.slice(k, k + 40).findIndex((s, i, arr) => s.testo === 'to' && arr[i + 1]?.testo === '=');
          if (to < 0) continue;
          const valore = k + to + 2;
          intervallo = a.sig[valore]?.testo === '{' ? [valore + 1, a.chiusura[valore] ?? valore + 1] : [valore, valore + 1];
        }
        if (!intervallo) continue;
        blocco.evidenziate.add(t.riga);
        const costanti = [];
        const elenco = await destinazioni(a, blocco.voce, ...intervallo, costanti);
        // ROUTE.VERIFY_TOTP: la costante compare una volta sola, con accese le righe delle proprietà usate
        for (const c of costanti) {
          const chiave = `${c.bersaglio.voce.percorso}:${c.bersaglio.inizio}`;
          const blocchoCostante = ctx.visti.get(chiave) || aggiungiBlocco(ctx, { ...c.bersaglio, tipo: 'usa', genere: c.bersaglio.tipo, livello: blocco.livello + 1, relazione: `usa ${c.nome.split('.')[0]}` });
          blocchoCostante?.evidenziate.add(c.riga);
        }
        for (const destinazione of elenco) {
          const route = await routePer(destinazione);
          blocco.pagine.push({ riga: t.riga, percorso: destinazione, componente: route?.componente || null });
          if (!route) continue;
          const voceRoute = await caricaAnalisi(route.file);
          if (!voceRoute) continue;
          const bloccoRoute = aggiungiBlocco(ctx, { voce: voceRoute, nome: destinazione, tipo: 'percorso', inizio: route.riga, fine: route.riga, livello: blocco.livello + 1, relazione: `naviga a ${destinazione}` });
          const pagina = route.componente && await componentePagina(route.componente, voceRoute);
          if (pagina) aggiungiBlocco(ctx, { ...pagina, tipo: 'pagina', foglia: true, livello: blocco.livello + 2, relazione: `la route disegna ${route.componente}` });
          if (bloccoRoute && route.componente) bloccoRoute.parole.add(route.componente);
        }
      }
    }

    // A VALLE
    // Tutto ciò che il blocco usa, a cascata; i componenti disegnati e le costanti sono foglie, per non esplodere su tutta l'interfaccia
    async function valle(ctx, blocco, profondita) {
      const a = blocco.voce.analisi;
      if (!a || profondita > MAX_PROFONDITA) return;
      const indici = [];
      a.sig.forEach((s, k) => {
        if (s.riga >= blocco.inizio && s.riga <= blocco.fine) indici.push(k);
      });
      chiamateBackend(blocco, a, indici);
      await navigazioni(ctx, blocco, a, indici);

      const proprieta = new Map();
      for (const k of indici) {
        const s = a.sig[k];
        if (s.tipo === 'w' && !s.proprieta && a.sig[k + 1]?.testo === '.' && a.sig[k + 2]?.tipo === 'w') {
          if (!proprieta.has(s.testo)) proprieta.set(s.testo, new Set());
          proprieta.get(s.testo).add(a.sig[k + 2].testo);
        }
      }

      const seguiti = new Set();
      for (const k of indici) {
        const t = a.sig[k];
        if (t.tipo !== 'w' || t.proprieta || ['k', 'l'].includes(t.classe) || seguiti.has(t.testo)) continue;
        if (blocco.soloChiamata && t.testo !== blocco.soloChiamata) continue;
        if (t.classe === 't' && profondita > 1) continue;
        const def = a.definizioni.get(t.testo);
        if (!def) continue;
        seguiti.add(t.testo);
        // Definito dentro il blocco: non serve un altro blocco, ma se arriva da un context si va a cercarlo nel Provider
        if (def.tipo !== 'import' && def.riga >= blocco.inizio && def.riga <= blocco.fine) {
          if (def.chiamata && def.chiave) await dalProvider(ctx, blocco, { voce: blocco.voce, soloChiamata: def.chiamata, chiave: def.chiave }, profondita);
          continue;
        }
        const bersaglio = await risolviNome(t.testo, blocco.voce, 0, t.riga);
        if (!bersaglio) continue;
        for (const j of indici) if (a.sig[j].testo === t.testo && !a.sig[j].proprieta) blocco.evidenziate.add(a.sig[j].riga);
        blocco.parole.add(t.testo);
        const figlio = aggiungiBlocco(ctx, { ...bersaglio, tipo: 'usa', genere: bersaglio.tipo, livello: blocco.livello + 1, relazione: `${VERBI[bersaglio.tipo] || 'usa'} ${t.testo}` });
        if (!figlio) continue;
        for (const p of proprieta.get(t.testo) || []) righeCon(figlio.voce, figlio.inizio, figlio.fine, new RegExp(`\\b${p}\\b\\s*:`)).forEach((r) => figlio.evidenziate.add(r));
        if (['mutate', 'mutateAsync'].includes(bersaglio.chiave)) figlio.parole.add('mutationFn');
        if (!bersaglio.foglia) await valle(ctx, figlio, profondita + 1);
        if (bersaglio.soloChiamata && bersaglio.chiave) await dalProvider(ctx, figlio, bersaglio, profondita + 1);
      }
    }

    // Il nome arriva da un context: aggiungo anche dove il Provider lo definisce
    async function dalProvider(ctx, blocco, variabile, profondita) {
      const hook = await risolviNome(variabile.soloChiamata, variabile.voce);
      const fornito = hook && FUNZIONI.includes(hook.tipo) && await daContesto(hook, variabile.chiave);
      if (!fornito) return;
      blocco.parole.add(variabile.chiave);
      const nodo = aggiungiBlocco(ctx, { ...fornito, tipo: 'contesto', genere: fornito.tipo, livello: blocco.livello + 1, relazione: `${variabile.chiave} arriva dal context ${fornito.contesto}` });
      if (nodo) await valle(ctx, nodo, profondita + 1);
    }

    // Le righe che contengono le parole seguite (es. mutationFn) restano accese anche nei blocchi foglia
    function evidenziaParole(blocco) {
      for (const p of blocco.parole) righeCon(blocco.voce, blocco.inizio, blocco.fine, new RegExp(`(^|[^\\w$])${p.replace(/\$/g, '\\$')}(?![\\w$])`)).forEach((r) => blocco.evidenziate.add(r));
    }

    // A MONTE
    // Chi porta l'esecuzione nel blocco: la funzione del progetto a cui è passato come callback, poi chi chiama la funzione che lo contiene
    async function monte(ctx, voce, inizio, fine) {
      const a = voce.analisi;
      const primo = a.sig.findIndex((s) => s.riga >= inizio);
      let ultimo = -1;
      a.sig.forEach((s, k) => { if (s.riga <= fine) ultimo = k; });
      if (primo < 0 || ultimo < primo) return;
      const corpi = new Set(a.dichiarazioni.filter((d) => FUNZIONI.includes(d.tipo)).map((d) => d.inizio));

      for (let o = primo - 1; o >= 0; o--) {
        const s = a.sig[o];
        if (s.tipo !== 'o' || !APERTE[s.testo] || (a.chiusura[o] ?? -1) < ultimo) continue;
        if (corpi.has(o)) break;
        const chiamata = a.sig[o - 1];
        if (s.testo !== '(' || chiamata?.tipo !== 'w' || chiamata.classe === 'k') continue;
        let chiave = null;
        for (let k = primo; k > o; k--) {
          if (a.sig[k].tipo === 'w' && a.sig[k + 1]?.testo === ':' && a.livello[k] === a.livello[o] + 2) {
            chiave = a.sig[k].testo;
            break;
          }
        }
        const bersaglio = await risolviNome(chiamata.testo, voce);
        if (!bersaglio) continue;
        const blocco = aggiungiBlocco(ctx, { ...bersaglio, tipo: 'monte', genere: bersaglio.tipo, livello: 0, relazione: chiave ? `${chiamata.testo} esegue il ${chiave} passato da qui` : `${chiamata.testo} riceve ed esegue questo codice` });
        if (blocco && chiave) {
          blocco.parole.add(chiave);
          righeCon(blocco.voce, blocco.inizio, blocco.fine, new RegExp(`\\b${chiave}\\b`)).forEach((r) => blocco.evidenziate.add(r));
        }
        break;
      }

      const contenitore = a.dichiarazioni.filter((d) => FUNZIONI.includes(d.tipo) && d.fineRiga && d.riga <= inizio && d.fineRiga >= fine).sort((x, y) => y.riga - x.riga)[0];
      if (!contenitore) return;
      const verbo = contenitore.tipo === 'componente' ? 'disegna' : 'chiama';
      let trovati = 0;
      const usoIn = (v, nome, escludi) => {
        const viste = new Set();
        v.analisi.sig.forEach((s, k) => {
          if (trovati >= MAX_CHIAMANTI) return;
          if (s.tipo !== 'w' || s.testo !== nome || s.proprieta || escludi(s.riga) || viste.has(s.riga)) return;
          // export default Login, attributi JSX (onSubmit=) e chiavi di oggetti non sono usi
          const prima = v.analisi.sig[k - 1]?.testo;
          const dopo = v.analisi.sig[k + 1]?.testo;
          if (['export', 'default', 'import'].includes(prima) || dopo === '=' || dopo === ':' || v.analisi.definizioni.get(nome)?.riga === s.riga) return;
          viste.add(s.riga);
          const fuori = v.analisi.dichiarazioni.filter((d) => FUNZIONI.includes(d.tipo) && d.fineRiga && d.riga <= s.riga && d.fineRiga >= s.riga).sort((x, y) => y.riga - x.riga)[0];
          const blocco = aggiungiBlocco(ctx, { voce: v, nome: fuori?.nome || base(v.percorso), tipo: 'monte', inizio: Math.max(1, s.riga - 1), fine: Math.min(v.testo.length, s.riga + 1), evidenzia: [s.riga], livello: 0, relazione: `${fuori ? fuori.nome : base(v.percorso)} ${verbo} ${contenitore.nome}` });
          if (blocco) {
            blocco.parole.add(nome);
            trovati++;
          }
        });
      };
      usoIn(voce, contenitore.nome, (r) => r >= contenitore.riga && r <= contenitore.fineRiga);
      if (!contenitore.esportato) return;
      const importatori = await sorgente.importatoDa(voce.percorso);
      for (const u of importatori) {
        const v = await caricaAnalisi(u.file);
        if (!v?.analisi) continue;
        const locale = [...v.analisi.importati].find(([, i]) => i.risolto === voce.percorso && (i.originale === contenitore.nome || (i.originale === 'default' && contenitore.predefinito)))?.[0]
          || v.analisi.dichiarazioni.find((d) => d.avvolge === 'lazy' && d.riga <= u.riga && (d.fineRiga ?? d.riga) >= u.riga)?.nome;
        if (locale) usoIn(v, locale, (r) => r === u.riga);
      }
    }


    async function segui(percorso, inizio, fine, opzioni = {}) {
      const voce = await caricaAnalisi(percorso);
      if (!voce?.analisi) return null;
      const a = voce.analisi;
      const intorno = a.dichiarazioni.filter((d) => d.fineRiga && d.riga <= inizio && d.fineRiga >= fine && FUNZIONI.includes(d.tipo)).sort((x, y) => y.riga - x.riga)[0];
      const esatta = intorno && intorno.riga === inizio && intorno.fineRiga === fine;
      const titolo = esatta ? intorno.nome : `${base(percorso)} righe ${inizio}-${fine}${intorno ? ` (in ${intorno.nome})` : ''}`;
      const ctx = opzioni.ctx || { blocchi: [], visti: new Map(), troncato: false };
      const livello = opzioni.livello || 0;
      if (opzioni.monte !== false) await monte(ctx, voce, inizio, fine);
      const partenza = aggiungiBlocco(ctx, { voce, nome: titolo, tipo: opzioni.tipo || 'partenza', inizio, fine, livello, relazione: opzioni.relazione || '' })
        || ctx.visti.get(`${percorso}:${inizio}`);
      if (!partenza) return { titolo, ctx };
      Object.assign(partenza, { tipo: opzioni.tipo || 'partenza', inizio, fine, relazione: opzioni.relazione || '' });
      for (let r = inizio; r <= fine; r++) partenza.evidenziate.add(r);
      await valle(ctx, partenza, 1);
      ctx.blocchi.forEach((b) => b.parole && evidenziaParole(b));
      return { titolo, ctx };
    }

    return { segui, risolviNome };
  }

  // Blocchi pronti per il JSON: senza il file analizzato e con array al posto dei Set
  const serializza = (blocchi) => blocchi.map(({ voce, evidenziate, parole, espanse, ...b }) => (b.rimando !== undefined ? b : {
    ...b, evidenziate: [...evidenziate], parole: [...parole],
  }));

  return {
    PAROLE_CHIAVE, ESTENSIONI_JS, FUNZIONI, estensione, base, cartellaDi,
    tokenDelFile, numeraToken, analizzaJs, strutturaCss, strutturaMd, strutturaJson,
    creaTracciatore, serializza,
  };
}));
