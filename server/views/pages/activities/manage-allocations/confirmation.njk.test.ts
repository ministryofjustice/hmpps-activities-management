import * as cheerio from 'cheerio'
import { compile } from 'nunjucks'
import fs from 'fs'

import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/manage-allocations/confirmation.njk')

describe('Views - Allocate to an activity - Confirmation', () => {
  it('renders the deallocation link inside a list item with an accessible name', () => {
    const template = compile(view.toString(), registerNunjucks())
    const $ = cheerio.load(
      template.render({
        session: { req: { routeContext: { mode: 'create' } } },
        prisonerName: 'Alfonso Cholak',
        prisonerNumber: 'G4793VF',
        activityName: 'Entry level English 1',
        activityId: 2,
        otherAllocations: [{ id: 1, scheduleId: 1, activitySummary: 'Maths level 1' }],
      }),
    )

    expect($('ul.govuk-list > a')).toHaveLength(0)
    expect($('ul.govuk-list li').first().find('a').text().trim()).toEqual('take Alfonso Cholak off Maths level 1')
  })
})
