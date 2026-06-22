import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/manage-activities/view-activity.njk')

describe('Views - Manage activities - View activity', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  const currentWeekTags = ($: CheerioAPI) =>
    $('[data-qa="schedule-summary-list"] .govuk-tag').filter(
      (_, element) => $(element).text().trim() === 'Current week',
    )

  const weekRow = ($: CheerioAPI, weekNumber: number) =>
    $('[data-qa="schedule-summary-list"] .govuk-summary-list__row').filter((_, element) =>
      $(element).find('.govuk-summary-list__key').text().includes(`Week ${weekNumber}`),
    )

  const renderView = (scheduleWeeks: number, currentWeek = 1): CheerioAPI => {
    const viewContext = {
      user: {
        username: 'joebloggs',
        externalActivitiesRolledOut: false,
      },
      feComponents: {
        cssIncludes: [],
        jsIncludes: [],
        header: '',
        footer: '',
      },
      cspNonce: 'test-nonce',
      applicationInsightsConnectionString: '',
      applicationInsightsRoleName: '',
      liveIssueOutageBannerEnabled: false,
      plannedDowntimeOutageBannerEnabled: false,
      now: '2026-06-22',
      activity: {
        id: 1,
        category: { code: 'EDUCATION', name: 'Education' },
        summary: 'Maths Level 1',
        attendanceRequired: false,
        outsideWork: false,
        paid: false,
        riskLevel: 'low',
        minimumEducationLevel: [],
        tier: { code: 'STANDARD' },
      },
      schedule: {
        startDate: '2026-06-01',
        endDate: null,
        scheduleWeeks,
        capacity: 10,
        runsOnBankHoliday: false,
        internalLocation: { description: 'Education - R1' },
        activity: {
          paid: false,
          outsideWork: false,
          inCell: false,
        },
      },
      slots:
        scheduleWeeks === 2
          ? {
              1: [
                {
                  day: 'Monday',
                  slots: [{ timeSlot: 'AM', startTime: '09:00', endTime: '10:00' }],
                },
              ],
              2: [
                {
                  day: 'Tuesday',
                  slots: [{ timeSlot: 'PM', startTime: '13:00', endTime: '14:00' }],
                },
              ],
            }
          : {
              1: [
                {
                  day: 'Monday',
                  slots: [{ timeSlot: 'AM', startTime: '09:00', endTime: '10:00' }],
                },
              ],
            },
      currentWeek,
      hasAtLeastOneValidDay: true,
      displayPays: [],
      payEditable: true,
      tier: 'Standard',
      organiser: 'Education department',
    }

    return cheerio.load(compiledTemplate.render(viewContext))
  }

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('does not show the current week tag for one-week schedules', () => {
    const $ = renderView(1)

    expect(currentWeekTags($).length).toBe(0)
  })

  it('shows the current week tag on Week 1 when currentWeek is 1 for two-week schedules', () => {
    const $ = renderView(2, 1)

    expect(weekRow($, 1).find('.govuk-tag').text().trim()).toBe('Current week')
    expect(weekRow($, 2).find('.govuk-tag').length).toBe(0)
  })

  it('shows the current week tag on Week 2 when currentWeek is 2 for two-week schedules', () => {
    const $ = renderView(2, 2)

    expect(weekRow($, 1).find('.govuk-tag').length).toBe(0)
    expect(weekRow($, 2).find('.govuk-tag').text().trim()).toBe('Current week')
  })
})
