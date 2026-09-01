import * as cheerio from 'cheerio'
import fs from 'fs'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/create-an-activity/activity-type.njk')

describe('Views - Activity create - inside or outside', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should ask whether the activity takes place inside or outside', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        createJourney: {},
        formResponses: {},
        validationErrors: [],
      }),
    )

    expect($('title').text().trim()).toBe(
      'Does the activity take place inside or outside the prison grounds? - Activities - DPS',
    )
    expect($('h1').text().trim()).toBe('Does the activity take place inside or outside the prison grounds?')

    const radioItems = $('.govuk-radios__item')
    expect(radioItems).toHaveLength(2)
    expect(radioItems.eq(0).find('.govuk-label').text().trim()).toBe('Inside')
    expect(radioItems.eq(1).find('.govuk-label').text().trim()).toBe('Outside')
    expect(radioItems.eq(1).find('.govuk-hint').text().trim()).toBe(
      'The activity category will be set as ‘Outside activity’.',
    )
  })

  it('should show the validation error', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        createJourney: {},
        formResponses: {},
        validationErrors: [
          {
            field: 'type',
            message: 'Select if the activity takes place inside or outside',
          },
        ],
      }),
    )

    expect($('#type-error').text().replace('Error:', '').trim()).toBe(
      'Select if the activity takes place inside or outside',
    )
    expect($('.govuk-error-summary__list a[href="#type"]').text().trim()).toBe(
      'Select if the activity takes place inside or outside',
    )
  })
})
