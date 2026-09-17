import * as cheerio from 'cheerio'
import { Template } from 'nunjucks'

import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

describe('Views - Daily attendance summary', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = njkEnv.getTemplate('pages/activities/daily-attendance-summary/daily-summary.njk')
  })

  it('should render the outside activity category without the activity type filters', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        activityDate: new Date('2026-08-17'),
        now: new Date('2026-08-17T12:00:00'),
        uniqueCategories: [{ value: 'SAA_ROTL', text: 'Outside activity' }],
        csrfToken: 'csrf',
        attendanceSummaryJourney: {
          categoryFilters: ['SAA_ROTL'],
        },
      }),
    )

    expect($('input[name="activityTypeFilters"]')).toHaveLength(0)
    expect($('input[name="categoryFilters"][value="SAA_ROTL"]')).toHaveLength(1)
    expect($('label').text()).toContain('Outside activity')
  })
})
