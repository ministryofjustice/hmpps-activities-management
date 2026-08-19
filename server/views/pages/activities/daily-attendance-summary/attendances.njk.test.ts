import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'

import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/daily-attendance-summary/attendances.njk')

describe('Views - Daily attendance summary - Attendances', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should render the activity type filters', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        status: 'Absences',
        activityDate: new Date('2026-08-17'),
        now: new Date('2026-08-17T12:00:00'),
        absenceReasons: [],
        uniqueCategories: [],
        attendees: [],
        showRefusalsLink: false,
        csrfToken: 'csrf',
        tier: null,

        attendanceSummaryJourney: {
          absenceReasonFilters: [],
          payFilters: [],
          activityTypeFilters: [],
          categoryFilters: [],
          searchTerm: '',
        },

        user: {
          activeCaseLoadId: 'MDI',
          externalActivitiesRolledOut: true,
        },

        AbsencePayFilter: {
          ANY_PAY: 'ANY_PAY',
          NO_PAY: 'NO_PAY',
        },

        EventTier: {
          TIER_1: 'TIER_1',
          TIER_2: 'TIER_2',
          FOUNDATION: 'FOUNDATION',
        },
      }),
    )

    expect($('input[name="activityTypeFilters"]')).not.toHaveLength(0)
  })
})
