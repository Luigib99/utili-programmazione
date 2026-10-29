import { expect, test } from 'claude-code/testing'

const SCHEMA = '/modifica-maggiore\nOBIETTIVO: \nORA: \nDOVE: \nESEMPIO: \nSIMILE A: \nVERIFICA: \nVINCOLI: \nFUORI SCOPO: \nCOSA NON SO: '

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
  expect(risultato.text).toContain('OBIETTIVO *')
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

  const args = '\nOBIETTIVO: pallino verde\nDOVE: \nVERIFICA: secondo telefono'
  const risultato = await $.command.run({ command: 'modifica-maggiore', args })

  expect(risultato.text).toContain('DOVE')
  expect(casella).toEqual(['/modifica-maggiore\nOBIETTIVO: pallino verde\nDOVE: \nVERIFICA: secondo telefono'])
  expect(eseguiti).toEqual([])
})

test('scheda completa: toglie i campi vuoti, tiene i valori su più righe e lancia la skill', async ($, on) => {
  const eseguiti: string[] = []
  on('command.run', (_, e) => {
    eseguiti.push(e.args)
    return { text: 'skill avviata' }
  })

  const args = [
    'ORA: resta verde fino al logout',
    'OBIETTIVO: il pallino verde',
    'segue lo stato online',
    'DOVE: lista conversazioni',
    'VERIFICA: chiudo l\'app sul secondo telefono',
    'VINCOLI: ',
    'COSA NON SO: socket o API?',
  ].join('\n')
  const risultato = await $.command.run({ command: 'modifica-maggiore', args })

  expect(risultato.text).toBe('skill avviata')
  expect(eseguiti).toEqual([
    [
      'OBIETTIVO: il pallino verde\nsegue lo stato online',
      'ORA: resta verde fino al logout',
      'DOVE: lista conversazioni',
      'VERIFICA: chiudo l\'app sul secondo telefono',
      'COSA NON SO: socket o API?',
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
