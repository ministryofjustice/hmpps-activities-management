import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync(
  'server/views/pages/activities/manage-allocations/allocateMultiplePeople/checkAndConfirmMultiple.njk',
)

describe('Views - Manage Allocations - Check And Confirm Multiple', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should not show pay rates for an unpaid activity', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        allocateJourney: {
          activity: {
            name: 'Entry level English 1',
            location: 'Education room 1',
          },
          inmates: [
            {
              prisonerNumber: 'A1234BC',
              firstName: 'TEST01',
              lastName: 'PRISONER01',
              prisonCode: 'MDI',
            },
            {
              prisonerNumber: 'B2345CD',
              firstName: 'TEST02',
              lastName: 'PRISONER02',
              prisonCode: 'MDI',
            },
          ],
          startDate: '2025-01-01',
          endDate: '2026-01-01',
        },
        showPayRates: false,
        user: {
          activeCaseLoadId: 'MDI',
          externalActivitiesRolledOut: false,
        },
      }),
    )

    expect($('[data-qa="prisoner-pay-list"]')).toHaveLength(0)
    expect($('body').text()).not.toContain('Pay rates')
    expect($('button').text()).toContain('Confirm 2 allocations')
  })
})
