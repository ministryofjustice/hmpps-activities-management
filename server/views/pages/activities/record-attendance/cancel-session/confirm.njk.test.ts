import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/record-attendance/cancel-session/confirm.njk')

describe('Views - Cancel session - Confirmation', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should display the cancellation confirmation information', () => {
    const $ = cheerio.load(compiledTemplate.render())

    expect($('h1').text().trim()).toBe('Are you sure you want to cancel the session?')

    expect($('.govuk-caption-m').text().trim()).toBe(
      'Cancelling the session will record an acceptable absence for all prisoners.',
    )

    expect($('input[name="confirm"][value="yes"]')).toHaveLength(1)
    expect($('input[name="confirm"][value="no"]')).toHaveLength(1)
    expect($('button').text().trim()).toBe('Confirm')
  })
})
