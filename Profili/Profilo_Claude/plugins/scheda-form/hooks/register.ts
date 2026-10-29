import type { Register } from 'claude-code'

type Campo = { nome: string; obbligatorio: boolean; aiuto: string; valori?: readonly string[] }

// I campi devono restare allineati alla fase SCHEDA dello SKILL.md della skill.
const SCHEDE: Record<string, readonly Campo[]> = {
  'modifica-maggiore': [
    { nome: 'TITOLO', obbligatorio: true, aiuto: 'nome breve: diventa il titolo della sessione' },
    { nome: 'OBIETTIVO', obbligatorio: true, aiuto: 'cosa vuoi ottenere' },
    { nome: 'DOVE', obbligatorio: true, aiuto: 'pagina, flusso o file' },
    { nome: 'MAPPA', obbligatorio: true, aiuto: 'dati, struttura o entrambi', valori: ['dati', 'struttura', 'entrambi'] },
    { nome: 'NOTE', obbligatorio: false, aiuto: 'tutto il resto: vincoli, dubbi, esempi' },
  ],
  'modifica-minore': [
    { nome: 'COSA', obbligatorio: true, aiuto: 'cosa cambiare: testo, colore, dimensione, posizione, formattazione' },
    { nome: 'DOVE', obbligatorio: false, aiuto: 'schermata, componente o file (vuoto: il file aperto)' },
    { nome: 'VALORE NUOVO', obbligatorio: false, aiuto: 'il valore finale (vuoto: ti propongo quelli del progetto)' },
    { nome: 'VINCOLI', obbligatorio: false, aiuto: 'cosa non deve cambiare' },
  ],
  debug: [
    { nome: 'ATTESO', obbligatorio: true, aiuto: 'cosa dovrebbe succedere' },
    { nome: 'OSSERVATO', obbligatorio: true, aiuto: 'cosa succede invece: messaggio, schermata, comportamento' },
    { nome: 'COME RIPRODURLO', obbligatorio: true, aiuto: 'i passi, e se succede sempre o solo a volte' },
    { nome: 'AMBIENTE', obbligatorio: false, aiuto: 'piattaforma, ambiente, emulatore o fisico, debug o release (vuoto: te lo chiedo)' },
    { nome: 'DA QUANDO', obbligatorio: false, aiuto: 'da sempre o da un aggiornamento, commit, branch' },
    { nome: 'ERRORI', obbligatorio: false, aiuto: 'log o messaggi di errore' },
    { nome: 'COSA NON SO', obbligatorio: false, aiuto: 'dubbi da chiarire prima di procedere' },
  ],
  revisione: [
    { nome: 'COSA REVISIONARE', obbligatorio: false, aiuto: 'file, porzione di codice o branch (vuoto: selezione, file aperto o branch)' },
    { nome: 'COSA DOVREBBE FARE', obbligatorio: false, aiuto: 'il comportamento atteso del codice (vuoto: te lo chiedo se non è evidente)' },
    { nome: 'FOCUS', obbligatorio: false, aiuto: 'tutto, oppure logica, sicurezza, prestazioni, convenzioni' },
    { nome: 'MODALITÀ', obbligatorio: false, aiuto: 'normale, oppure "prova io"' },
  ],
  lezione: [
    { nome: 'ARGOMENTO', obbligatorio: true, aiuto: 'concetto o parte di codice da spiegare' },
    { nome: 'LIVELLO', obbligatorio: false, aiuto: 'da zero, ripasso o approfondimento' },
    { nome: 'A COSA MI SERVE', obbligatorio: false, aiuto: 'il compito per cui ti serve' },
  ],
}

const schema = (skill: string, campi: readonly Campo[]) =>
  [`/${skill}`, ...campi.map(campo => `${campo.nome}: `)].join('\n')

const guida = (skill: string, campi: readonly Campo[]) =>
  [
    `Schema di /${skill} nella casella: scrivi dopo i due punti (Shift+Invio per andare a capo), poi Invio.`,
    ...campi.map(campo => `  ${campo.nome}${campo.obbligatorio ? ' *' : ''}: ${campo.aiuto}`),
    '  * = obbligatorio · i campi lasciati vuoti non vengono inviati',
  ].join('\n')

// LETTURA SCHEDA
// Una riga che inizia con il nome di un campo apre quel campo; le righe successive ne fanno parte.
const leggiScheda = (testo: string, campi: readonly Campo[]) => {
  const nomi = campi.map(campo => campo.nome)
  const valori = new Map<string, string[]>()
  let corrente: string | undefined

  for (const riga of testo.split('\n')) {
    const nome = nomi.find(possibile => riga.trimStart().startsWith(`${possibile}:`))
    if (nome) {
      corrente = nome
      valori.set(nome, [riga.trimStart().slice(nome.length + 1).trim()])
    } else if (corrente) {
      valori.get(corrente)?.push(riga)
    }
  }

  return new Map([...valori].map(([nome, righe]) => [nome, righe.join('\n').trim()]))
}

export const register: Register = on => {
  for (const [skill, campi] of Object.entries(SCHEDE)) {
    on('command.run', { command: skill }, async ($, e, next) => {
      // APERTURA SCHEMA
      if (e.args.trim() === '') {
        const riempita = await $.prompt.fill({ text: schema(skill, campi) })
        if (!riempita.isFilled) return next(e)

        return { text: guida(skill, campi) }
      }

      const scheda = leggiScheda(e.args, campi)
      // Testo libero senza campi: la skill compila la scheda da sola.
      if (scheda.size === 0) return next(e)

      // CONTROLLO OBBLIGATORI
      const vuoti = campi
        .filter(campo => campo.obbligatorio && !scheda.get(campo.nome))
        .map(campo => campo.nome)

      const sbagliati = campi
        .filter(campo => campo.valori && scheda.get(campo.nome) && !campo.valori.includes((scheda.get(campo.nome) ?? '').toLowerCase()))
        .map(campo => `${campo.nome} (${campo.valori?.join(', ')})`)

      if (vuoti.length > 0 || sbagliati.length > 0) {
        await $.prompt.fill({ text: `/${skill}\n${e.args.replace(/^\s*\n/, '')}` })
        const problemi = [
          vuoti.length > 0 ? `compila ${vuoti.join(', ')}` : '',
          sbagliati.length > 0 ? `valore non valido in ${sbagliati.join(', ')}` : '',
        ].filter(Boolean)

        return { text: `Scheda non inviata: ${problemi.join(' · ')}. Il testo è di nuovo nella casella.` }
      }

      const args = campi
        .filter(campo => scheda.get(campo.nome))
        .map(campo => `${campo.nome}: ${scheda.get(campo.nome)}`)
        .join('\n')

      return next({ ...e, args })
    })
  }

  // TITOLO SESSIONE
  on('classic.UserPromptSubmit', async ($, e, next) => {
    const risultato = await next(e)
    const comando = e.prompt.trimStart().match(/^\/(?:[\w-]+:)?([\w-]+)/)?.[1]
    const campi = comando ? SCHEDE[comando] : undefined
    if (!campi?.some(campo => campo.nome === 'TITOLO')) return risultato

    const titolo = leggiScheda(e.prompt.replace(/^\s*\/\S+\s*/, ''), campi).get('TITOLO')

    return titolo ? { ...risultato, sessionTitle: titolo.split('\n')[0] } : risultato
  })
}
