import { expect, test } from 'claude-code/testing'

const SCHEMA = '/revisione\nTITOLO: \nCOSA REVISIONARE: \nCOSA DOVREBBE FARE: \nFOCUS: \nMODALITÀ: \nMAPPA: '

test('senza testo riempie la casella con lo schema e non lancia la skill', async ($, on) => {
  const eseguiti: string[] = []
  const casella: string[] = []
  on('prompt.fill', (_, e) => {
    casella.push(e.text)
    return { isFilled: true }
  })
  on('command.run', (_, e) => {
    eseguiti.push(e.args)
    return { text: 'skill avviata' }
  })

  const risultato = await $.command.run({ command: 'revisione', args: '' })

  expect(casella).toEqual([SCHEMA])
  expect(risultato.text).toContain('MAPPA *')
  expect(eseguiti).toEqual([])
})

test('con un obbligatorio vuoto non parte e rimette il testo nella casella', async ($, on) => {
  const eseguiti: string[] = []
  const casella: string[] = []
  on('prompt.fill', (_, e) => {
    casella.push(e.text)
    return { isFilled: true }
  })
  on('command.run', (_, e) => {
    eseguiti.push(e.args)
    return { text: 'skill avviata' }
  })

  const args = '\nTITOLO: login\nCOSA REVISIONARE: LoginScreen.jsx\nMAPPA: '
  const risultato = await $.command.run({ command: 'revisione', args })

  expect(risultato.text).toContain('compila MAPPA')
  expect(casella).toEqual(['/revisione\nTITOLO: login\nCOSA REVISIONARE: LoginScreen.jsx\nMAPPA: '])
  expect(eseguiti).toEqual([])
})

test('MAPPA con un valore non previsto non parte', async ($, on) => {
  const eseguiti: string[] = []
  on('prompt.fill', () => ({ isFilled: true }))
  on('command.run', (_, e) => {
    eseguiti.push(e.args)
    return { text: 'skill avviata' }
  })

  const args = 'TITOLO: login\nCOSA REVISIONARE: LoginScreen.jsx\nMAPPA: grafica'
  const risultato = await $.command.run({ command: 'revisione', args })

  expect(risultato.text).toContain('valore non valido in MAPPA (dati, struttura, entrambi)')
  expect(eseguiti).toEqual([])
})

test('scheda completa: toglie i campi vuoti, tiene i valori su più righe e lancia la skill', async ($, on) => {
  const eseguiti: string[] = []
  on('command.run', (_, e) => {
    eseguiti.push(e.args)
    return { text: 'skill avviata' }
  })

  const args = [
    'COSA REVISIONARE: LoginScreen.jsx',
    'TITOLO: login nuovo',
    'COSA DOVREBBE FARE: entrare con email e password',
    'e mostrare l\'errore se sono sbagliate',
    'MAPPA: Dati',
    'FOCUS: ',
  ].join('\n')
  const risultato = await $.command.run({ command: 'revisione', args })

  expect(risultato.text).toBe('skill avviata')
  expect(eseguiti).toEqual([
    [
      'TITOLO: login nuovo',
      'COSA REVISIONARE: LoginScreen.jsx',
      'COSA DOVREBBE FARE: entrare con email e password\ne mostrare l\'errore se sono sbagliate',
      'MAPPA: Dati',
    ].join('\n'),
  ])
})

test('testo libero senza campi: la skill parte così com\'è', async ($, on) => {
  const eseguiti: string[] = []
  on('command.run', (_, e) => {
    eseguiti.push(e.args)
    return { text: 'skill avviata' }
  })

  await $.command.run({ command: 'revisione', args: 'guarda il login' })

  expect(eseguiti).toEqual(['guarda il login'])
})

test('il TITOLO della scheda e la riga PIANO di /piano diventano il titolo della sessione', async ($, on) => {
  on('classic.UserPromptSubmit', () => ({}))

  const conTitolo = await $.classic.UserPromptSubmit({ prompt: '/revisione\nTITOLO: Login nuovo\nMAPPA: dati' })
  const piano = await $.classic.UserPromptSubmit({ prompt: '/piano\nPIANO: Errore al login\nID PIANO: 123\nTIPO: Bug fix' })
  const senzaTitolo = await $.classic.UserPromptSubmit({ prompt: '/revisione\nFOCUS: logica' })
  const altroTesto = await $.classic.UserPromptSubmit({ prompt: 'ciao' })

  expect(conTitolo.sessionTitle).toBe('Login nuovo')
  expect(piano.sessionTitle).toBe('Errore al login')
  expect(senzaTitolo.sessionTitle).toBeUndefined()
  expect(altroTesto.sessionTitle).toBeUndefined()
})

test('/piano non ha una scheda: parte con il testo incollato, lezione accetta la MAPPA vuota', async ($, on) => {
  const eseguiti: string[] = []
  on('prompt.fill', () => ({ isFilled: true }))
  on('command.run', (_, e) => {
    eseguiti.push(`${e.command}: ${e.args}`)
    return { text: 'skill avviata' }
  })

  await $.command.run({ command: 'piano', args: 'PIANO: Errore al login\nID PIANO: 123' })
  await $.command.run({ command: 'lezione', args: 'TITOLO: useEffect\nARGOMENTO: useEffect\nMAPPA: ' })

  expect(eseguiti).toEqual([
    'piano: PIANO: Errore al login\nID PIANO: 123',
    'lezione: TITOLO: useEffect\nARGOMENTO: useEffect',
  ])
})
