import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/record-attendance/cancel-single-session/check-answers.njk')

const getCancellationDetail = ($: CheerioAPI, heading: string) =>
  $(`[data-qa=cancellation-details] > .govuk-summary-list__row > .govuk-summary-list__key:contains("${heading}")`)
    .parent()
    .find('.govuk-summary-list__value')

const viewContext = (issuePayment: boolean) => ({
  activityName: 'English level 2',
  reason: 'Location unavailable',
  comment: 'Location in use',
  issuePayment,
  activitiesRedirectUrl: '../../activities',
})

describe('Views - Cancel single session - Check answers', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should show that people will be paid', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext(true)))

    expect(getCancellationDetail($, 'Activity').text().trim()).toBe('English level 2')

    expect(getCancellationDetail($, 'Cancellation reason').text().trim()).toBe('Location unavailable - Location in use')

    expect(getCancellationDetail($, 'Will people be paid?').text().trim()).toBe('Yes')
  })

  it('should show that people will not be paid', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext(false)))

    expect(getCancellationDetail($, 'Will people be paid?').text().trim()).toBe('No')
  })
})
