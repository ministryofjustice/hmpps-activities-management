import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/unlock-list/planned-events.njk')

describe('Views - Unlock list', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
    viewContext = {
      location: {
        name: 'Wing A',
      },
      timeSlot: 'AM',
      movementCounts: {
        leavingWing: 2,
        stayingOnWing: 1,
      },
      unlockListItems: [
        {
          prisonerNumber: 'A1111AA',
          isLeavingWing: true,
        },
        {
          prisonerNumber: 'B2222BB',
          isLeavingWing: true,
        },
        {
          prisonerNumber: 'C3333CC',
          isLeavingWing: false,
        },
      ],
    }
  })

  it('search unlock list', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text().trim()).toEqual('Wing A - Unlock list')
    expect($('.govuk-caption-l').text().trim()).toEqual('AM session')
    expect(
      $('.govuk-body')
        .map((i, e) => $(e).text().trim())
        .get(),
    ).toEqual(['3 people to unlock', '2 leaving wing', '1 staying on wing'])
    expect($('.govuk-form-group > .govuk-label').text().trim()).toEqual(
      'Search by name or prison number, or event name',
    )
    expect($('.search-input__form-inputs > .govuk-button').text().trim()).toEqual('Search')
  })
})
