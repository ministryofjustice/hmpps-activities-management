import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/manage-allocations/exclusions.njk')

describe('Views - Manage Allocations - Exclusions', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should show the correct heading in the create allocation flow', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        allocateJourney: {
          activity: {
            name: 'English level 1',
          },
        },
        prisonerName: 'Alfonso Cholak',
        weeks: [],
        disabledSlotsExist: false,
        allocationHasStarted: false,
        session: {
          req: {
            routeContext: {
              mode: 'create',
            },
            query: {},
          },
        },
      }),
    )

    expect($('h1.govuk-heading-l').text().trim()).toBe("Change Alfonso Cholak's scheduled sessions for this activity")
  })
})
