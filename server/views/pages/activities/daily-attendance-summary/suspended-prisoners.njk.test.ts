import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'

import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import { ActivityCategoryEnum } from '../../../../data/activityCategoryEnum'

const view = fs.readFileSync('server/views/pages/activities/daily-attendance-summary/suspended-prisoners.njk')

describe('Views - Daily attendance summary - Suspended prisoners', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should submit SAA_ROTL for the Outside activity category', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        activityDate: new Date('2026-08-20'),
        now: new Date('2026-08-20T12:00:00'),
        uniqueCategories: [{ value: ActivityCategoryEnum.SAA_ROTL, text: 'Outside activity' }],
        suspendedAttendancesByPrisoner: [],
        csrfToken: 'csrf',
        attendanceSummaryJourney: {
          categoryFilters: [ActivityCategoryEnum.SAA_ROTL],
          reasonFilter: 'BOTH',
          searchTerm: '',
        },
      }),
    )

    const outsideActivityFilter = $(`input[name="categoryFilters"][value="${ActivityCategoryEnum.SAA_ROTL}"]`)

    expect(outsideActivityFilter).toHaveLength(1)
    expect(outsideActivityFilter.is(':checked')).toBe(true)
    expect($('.govuk-checkboxes').text()).toContain('Outside activity')
  })
})
