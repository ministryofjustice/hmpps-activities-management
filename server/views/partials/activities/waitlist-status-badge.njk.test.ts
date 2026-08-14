import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../nunjucks/nunjucksSetup'

describe('Waitlist status badge', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    const view = `
      {% from "partials/activities/waitlist-status-badge.njk" import waitlistStatusBadge %}
      {{ waitlistStatusBadge(status) }}
    `

    compiledTemplate = compile(view, njkEnv)
  })

  it.each([
    ['PENDING', 'Pending', 'govuk-tag--yellow'],
    ['APPROVED', 'Approved and on the waitlist', 'govuk-tag--green'],
    ['DECLINED', 'Rejected', 'govuk-tag--red'],
    ['WITHDRAWN', 'Withdrawn', 'govuk-tag--grey'],
  ])('should display the correct badge for %s', (status, expectedText, expectedClass) => {
    const $ = cheerio.load(
      compiledTemplate.render({
        status,
      }),
    )

    const tag = $('.govuk-tag')

    expect(tag.text().replace(/\s+/g, ' ').trim()).toBe(expectedText)
    expect(tag.hasClass(expectedClass)).toBe(true)
  })
})
