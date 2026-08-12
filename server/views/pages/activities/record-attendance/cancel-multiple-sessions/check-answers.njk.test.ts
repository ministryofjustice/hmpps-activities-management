import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import fs from 'fs'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync(
  'server/views/pages/activities/record-attendance/cancel-multiple-sessions/check-answers.njk',
)

const getCancellationDetail = ($: CheerioAPI, heading: string) =>
  $(`[data-qa=cancellation-details] > .govuk-summary-list__row > .govuk-summary-list__key:contains("${heading}")`)
    .parent()
    .find('.govuk-summary-list__value')

const getCancellationActions = ($: CheerioAPI, heading: string) =>
  $(`[data-qa=cancellation-details] > .govuk-summary-list__row > .govuk-summary-list__key:contains("${heading}")`)
    .parent()
    .find('.govuk-summary-list__actions')

const viewContext = (issuePayment: boolean, isPayable = true) => ({
  selectedDateAndSlotsText: 'Wednesday, 12 August 2026 - PM',
  instances: [],
  activitiesRedirectUrl: '../activities',
  reason: 'Location unavailable',
  comment: 'Location in use',
  isPayable,
  allPaid: isPayable,
  paidActivities: isPayable ? [{ id: 1, summary: 'English level 1' }] : [],
  recordAttendanceJourney: {
    sessionCancellationMultiple: {
      issuePayment,
    },
  },
})

describe('Views - Cancel multiple sessions - Check answers', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should show that people will be paid for paid cancelled sessions', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext(true)))

    expect(getCancellationDetail($, 'Pay for cancelled sessions').text().trim()).toBe('Yes')
    expect(getCancellationActions($, 'Pay for cancelled sessions').text()).toContain('Change')
  })

  it('should show that people will not be paid for paid cancelled sessions', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext(false)))

    expect(getCancellationDetail($, 'Pay for cancelled sessions').text().trim()).toBe('No')
    expect(getCancellationActions($, 'Pay for cancelled sessions').text()).toContain('Change')
  })

  it('should show no pay and no payment change action for unpaid activities', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext(false, false)))

    expect(getCancellationDetail($, 'Pay for cancelled sessions').text().trim()).toBe('No')
    expect(getCancellationActions($, 'Pay for cancelled sessions')).toHaveLength(0)
  })
})
