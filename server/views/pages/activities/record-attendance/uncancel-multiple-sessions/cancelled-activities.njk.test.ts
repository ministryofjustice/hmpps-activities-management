import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'

import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync(
  'server/views/pages/activities/record-attendance/uncancel-multiple-sessions/cancelled-activities.njk',
)

describe('Views - Uncancel multiple sessions - Cancelled activities', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('shows a message when the selected filters have no matching activities', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        activityDate: new Date('2026-08-24'),
        selectedSessions: ['AM', 'PM'],
        activityRows: [],
        activitiesBySession: {
          AM: [],
          PM: [],
          ED: [],
        },
        hasCancelledSessionsToday: true,
        locations: [],
        filterItems: {
          categoryFilters: [],
          sessionFilters: [],
          locationType: 'IN_CELL',
          locationId: null,
        },
        now: new Date('2026-08-24'),
        user: {
          roles: ['ROLE_ACTIVITY_HUB'],
          externalActivitiesRolledOut: false,
        },
        session: {
          req: {
            query: {},
          },
        },
      }),
    )

    expect($('.govuk-warning-text').text()).toContain('There are no matching activities.')
  })
})
