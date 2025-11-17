import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/non-associations/nonAssociations.njk')

describe('Views - Non Associations for an activity', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    viewContext = {
      prisoner: {
        name: 'Aeticake Potta',
        firstName: 'Aeticake',
        lastName: 'Potta',
        cellLocation: '1-1-1',
        status: 'ACTIVE IN',
        prisonCode: 'MDI',
        prisonerNumber: 'G4977UO',
        prisonName: 'HMP Risley',
      },
      prisonerName: 'Alishole Egurztofy',
      activity: {
        description: 'Kitchen Cleaning',
      },
    }
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('look for non associations', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text().trim()).toEqual('Aeticake Potta’s non-associations')
    expect($('[data-qa=para1]').text().trim()).toEqual(
      'Check if attending this activity could mean Aeticake Potta coming into contact with someone they must be kept apart from.',
    )
    expect($('h2').text().trim()).toContain('People allocated to Kitchen Cleaning')
    expect($('[data-qa=noNA-activity]').text().trim()).toEqual(
      'Aeticake Potta has no open non-associations with anyone who is allocated to Kitchen Cleaning.',
    )
    expect($('h2').text().trim()).toContain('Other people in HMP Risley')
    expect($('[data-qa=noNA-prison]').text().trim()).toEqual(
      'Aeticake Potta has no open non-associations with anyone else in HMP Risley.',
    )
  })
})
