import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/prisoner-allocations/pending-application.njk')

describe('Views - Prisoner allocations - Pending application', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should render the pending application details and approval options', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        prisonerName: 'Aeticake Potta',
        prisonerAllocationsJourney: {
          activityName: 'Maths level 1',
          status: 'PENDING',
          scheduleId: '518',
          applicationId: 213,
          applicationDate: '2025-06-24',
          requestedBy: 'PRISONER',
          comments: 'Test',
        },
        validationErrors: [],
      }),
    )

    expect($('.govuk-caption-l').text().trim()).toBe('Maths level 1')
    expect($('h1.govuk-heading-l').text().trim()).toBe('Aeticake Potta’s application')

    const rows = $('[data-qa="Pending-application"] .govuk-summary-list__row')

    const summaryValue = (key: string) =>
      rows
        .filter((_, row) => $(row).find('.govuk-summary-list__key').text().trim() === key)
        .find('.govuk-summary-list__value')
        .text()
        .trim()

    expect(summaryValue('Requester')).toBe('Aeticake Potta')
    expect(summaryValue('Date of request')).toBe('24 June 2025')
    expect(summaryValue('Comments')).toBe('Test')

    expect($('.govuk-fieldset__legend').text().replace(/\s+/g, ' ').trim()).toBe(
      'Do you want to approve Aeticake Potta’s application?',
    )

    const options = $('input[name="options"]')

    expect(options).toHaveLength(2)
    expect(options.eq(0).attr('value')).toBe('YES')
    expect(options.eq(1).attr('value')).toBe('NO')

    const labels = $('.govuk-radios__label')

    expect(labels.eq(0).text().trim()).toBe('Yes, approve the application and continue to allocate them')
    expect(labels.eq(1).text().trim()).toBe('No, go back to Aeticake Potta’s allocations')

    expect($('input[name="prisonerName"]').attr('value')).toBe('Aeticake Potta')
    expect($('.govuk-button').text().trim()).toBe('Continue')
  })
})
