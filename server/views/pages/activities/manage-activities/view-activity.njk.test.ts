import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/manage-activities/view-activity.njk')

describe('Views - Manage activities - View activity', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  const scheduleSummaryList = ($: CheerioAPI) => $('[data-qa="schedule-summary-list"]')

  const currentWeekTags = ($: CheerioAPI) =>
    scheduleSummaryList($)
      .find('.govuk-tag')
      .filter((_, element) => $(element).text().trim() === 'Current week')

  const weekRow = ($: CheerioAPI, weekNumber: number) =>
    scheduleSummaryList($)
      .find('.govuk-summary-list__row')
      .filter(
        (_, element) =>
          $(element).find('.govuk-summary-list__key > span').first().text().trim() === `Week ${weekNumber}`,
      )

  const renderView = (
    scheduleWeeks: number,
    currentWeek = 1,
    overrides: {
      externalActivitiesRolledOut?: boolean
      outsideWork?: boolean
      paid?: boolean
    } = {},
  ): CheerioAPI => {
    const { externalActivitiesRolledOut = false, outsideWork = false, paid = false } = overrides

    const viewContext = {
      user: {
        username: 'joebloggs',
        externalActivitiesRolledOut,
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
        outsideWork,
        paid,
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
          paid,
          outsideWork,
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

  describe('current week', () => {
    it('does not show the current week tag for a one-week schedule', () => {
      const $ = renderView(1)

      expect(weekRow($, 1)).toHaveLength(1)
      expect(currentWeekTags($)).toHaveLength(0)
    })

    it.each([
      [1, 2],
      [2, 1],
    ])('shows the current week tag only on Week %s', (currentWeek, otherWeek) => {
      const $ = renderView(2, currentWeek)

      expect(weekRow($, 1)).toHaveLength(1)
      expect(weekRow($, 2)).toHaveLength(1)

      expect(currentWeekTags($)).toHaveLength(1)
      expect(weekRow($, currentWeek).find('.govuk-tag').text().trim()).toBe('Current week')
      expect(weekRow($, otherWeek).find('.govuk-tag')).toHaveLength(0)
    })
  })

  describe('outside work activities', () => {
    it('shows outside work activity details when external activities are rolled out', () => {
      const $ = renderView(1, 1, {
        externalActivitiesRolledOut: true,
        outsideWork: true,
      })

      const activityDetails = $('[data-qa="activity-details-summary-list"]')
      const locationAndCapacity = $('[data-qa="location-and-capacity-summary-list"]')

      expect(activityDetails.text()).toContain('Outside activity')
      expect(activityDetails.text()).not.toContain('Tier')

      expect(locationAndCapacity.text()).toContain('Location')
      expect(locationAndCapacity.text()).toContain('Outside')

      expect($('[data-qa="requirements-and-suitability-summary-list"]')).toHaveLength(0)
      expect($('[data-qa="change-category-link"]')).toHaveLength(0)
      expect($('[data-qa="change-location-link"]')).toHaveLength(0)
    })

    it('does not treat the activity as outside work when external activities are not rolled out', () => {
      const $ = renderView(1, 1, {
        externalActivitiesRolledOut: false,
        outsideWork: true,
      })

      const activityDetails = $('[data-qa="activity-details-summary-list"]')
      const locationAndCapacity = $('[data-qa="location-and-capacity-summary-list"]')

      const locationRow = locationAndCapacity
        .find('.govuk-summary-list__row')
        .filter((_, element) => $(element).find('.govuk-summary-list__key').text().trim() === 'Location')

      expect(activityDetails.text()).toContain('Education')
      expect(activityDetails.text()).toContain('Tier')

      expect(locationRow.find('.govuk-summary-list__value').text().trim()).toBe('Education - r1')

      expect($('[data-qa="requirements-and-suitability-summary-list"]')).toHaveLength(1)
      expect($('[data-qa="change-category-link"]')).toHaveLength(1)
      expect($('[data-qa="change-location-link"]')).toHaveLength(1)
    })

    it('shows the prison as paying for a paid outside work activity', () => {
      const $ = renderView(1, 1, {
        externalActivitiesRolledOut: true,
        outsideWork: true,
        paid: true,
      })

      const activityDetails = $('[data-qa="activity-details-summary-list"]')

      expect(activityDetails.text()).toContain('Paid by')
      expect(activityDetails.text()).toContain('The prison')
      expect($('[data-qa="pay-rates-summary-list"]')).toHaveLength(1)
    })

    it('shows an external employer as paying for an unpaid outside work activity', () => {
      const $ = renderView(1, 1, {
        externalActivitiesRolledOut: true,
        outsideWork: true,
        paid: false,
      })

      const activityDetails = $('[data-qa="activity-details-summary-list"]')

      expect(activityDetails.text()).toContain('Paid by')
      expect(activityDetails.text()).toContain('An external employer')
      expect($('[data-qa="pay-rates-summary-list"]')).toHaveLength(0)
    })
  })
})
