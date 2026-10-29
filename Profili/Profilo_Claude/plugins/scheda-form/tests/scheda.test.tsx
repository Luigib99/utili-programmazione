import { expect, test } from 'claude-code/testing'

const SCHEMA = '/modifica-maggiore\nTITOLO: \nOBIETTIVO: \nDOVE: \nMAPPA: \nNOTE: '

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

  const risultato = await $.command.run({ command: 'modifica-maggiore', args: '' })

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

  const args = '\nTITOLO: tutorial\nOBIETTIVO: rifare le pagine\nDOVE: WelcomeTutorial\nMAPPA: '
  const risultato = await $.command.run({ command: 'modifica-maggiore', args })

  expect(risultato.text).toContain('compila MAPPA')
  expect(casella).toEqual(['/modifica-maggiore\nTITOLO: tutorial\nOBIETTIVO: rifare le pagine\nDOVE: WelcomeTutorial\nMAPPA: '])
  expect(eseguiti).toEqual([])
})

test('MAPPA con un valore non previsto non parte', async ($, on) => {
  const eseguiti: string[] = []
  on('prompt.fill', () => ({ isFilled: true }))
  on('command.run', (_, e) => {
    eseguiti.push(e.args)
    return { text: 'skill avviata' }
  })

  const args = 'TITOLO: tutorial\nOBIETTIVO: rifare le pagine\nDOVE: WelcomeTutorial\nMAPPA: grafica'
  const risultato = await $.command.run({ command: 'modifica-maggiore', args })

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
    'DOVE: WelcomeTutorial',
    'TITOLO: tutorial nuovo',
    'OBIETTIVO: pagine più leggibili',
    'e una sola versione per admin e utenti',
    'MAPPA: Struttura',
    'NOTE: ',
  ].join('\n')
  const risultato = await $.command.run({ command: 'modifica-maggiore', args })

  expect(risultato.text).toBe('skill avviata')
  expect(eseguiti).toEqual([
    [
      'TITOLO: tutorial nuovo',
      'OBIETTIVO: pagine più leggibili\ne una sola versione per admin e utenti',
      'DOVE: WelcomeTutorial',
      'MAPPA: Struttura',
    ].join('\n'),
  ])
})

test('testo libero senza campi: la skill parte così com\'è', async ($, on) => {
  const eseguiti: string[] = []
  on('command.run', (_, e) => {
    eseguiti.push(e.args)
    return { text: 'skill avviata' }
  })

  await $.command.run({ command: 'modifica-maggiore', args: 'sposta il pulsante' })

  expect(eseguiti).toEqual(['sposta il pulsante'])
})

test('il TITOLO della scheda diventa il titolo della sessione', async ($, on) => {
  on('classic.UserPromptSubmit', () => ({}))

  const conTitolo = await $.classic.UserPromptSubmit({
    prompt: '/modifica-maggiore\nTITOLO: Tutorial nuovo\nOBIETTIVO: pagine leggibili',
  })
  const senzaTitolo = await $.classic.UserPromptSubmit({ prompt: '/debug\nATTESO: x' })
  const altroTesto = await $.classic.UserPromptSubmit({ prompt: 'ciao' })

  expect(conTitolo.sessionTitle).toBe('Tutorial nuovo')
  expect(senzaTitolo.sessionTitle).toBeUndefined()
  expect(altroTesto.sessionTitle).toBeUndefined()
})
