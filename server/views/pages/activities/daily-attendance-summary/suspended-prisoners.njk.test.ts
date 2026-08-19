import * as cheerio from 'cheerio'
import { Template } from 'nunjucks'

import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

describe('Views - Daily attendance summary - Suspended prisoners', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = njkEnv.getTemplate('pages/activities/daily-attendance-summary/suspended-prisoners.njk')
  })

  it('should submit SAA_ROTL for the outside activity category', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        activityDate: new Date('2026-08-17'),
        now: new Date('2026-08-17T12:00:00'),
        uniqueCategories: [{ value: 'SAA_ROTL', text: 'Outside activity' }],
        suspendedAttendancesByPrisoner: [],
        csrfToken: 'csrf',
        attendanceSummaryJourney: {
          categoryFilters: ['SAA_ROTL'],
          reasonFilter: 'BOTH',
          searchTerm: '',
        },
      }),
    )

    expect($('input[name="categoryFilters"][value="SAA_ROTL"]')).toHaveLength(1)
    expect($('label').text()).toContain('Outside activity')
  })
})
