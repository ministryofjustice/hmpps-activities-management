import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import fs from 'fs'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'
import { UserDetails } from '../../../../../@types/manageUsersApiImport/types'

const view = fs.readFileSync(
  'server/views/pages/activities/record-attendance/cancel-multiple-sessions/view-cancellation-details.njk',
)

const getCancellationDetail = ($: CheerioAPI, heading: string) =>
  $(`[data-qa=cancellation-details] > .govuk-summary-list__row > .govuk-summary-list__key:contains("${heading}")`)
    .parent()
    .find('.govuk-summary-list__value')

const getCancellationActions = ($: CheerioAPI, heading: string) =>
  $(`[data-qa=cancellation-details] > .govuk-summary-list__row > .govuk-summary-list__key:contains("${heading}")`)
    .parent()
    .find('.govuk-summary-list__actions')

const instance = {
  id: 93,
  cancelledReason: 'Location unavailable',
  cancelledIssuePayment: false,
  cancelledBy: 'USER1',
  isAmendable: true,
  activitySchedule: {
    activity: {
      summary: 'English level 1',
    },
  },
}

const userMap = new Map([
  [
    'USER1',
    {
      username: 'USER1',
      name: 'John Smith',
    } as UserDetails,
  ],
])

describe('Views - Cancelled sessions - View or edit cancellation details', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should show payment and allow it to be changed for an amendable paid activity', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        instance,
        userMap,
        isPayable: true,
      }),
    )

    expect(getCancellationDetail($, 'Reason').text().trim()).toBe('Location unavailable')
    expect(getCancellationDetail($, 'Pay').text().trim()).toBe('No')
    expect(getCancellationActions($, 'Pay').text()).toContain('Change')
    expect(getCancellationDetail($, 'Cancelled by').text().trim()).toBe('USER1 - J. Smith')
  })

  it('should show payment but not allow it to be changed for a non-amendable paid activity', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        instance: {
          ...instance,
          cancelledIssuePayment: true,
          isAmendable: false,
        },
        userMap,
        isPayable: true,
      }),
    )

    expect(getCancellationDetail($, 'Pay').text().trim()).toBe('Yes')
    expect(getCancellationActions($, 'Pay')).toHaveLength(0)
  })

  it('should not show payment for an unpaid activity', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        instance,
        userMap,
        isPayable: false,
      }),
    )

    expect(getCancellationDetail($, 'Pay')).toHaveLength(0)
  })
})
