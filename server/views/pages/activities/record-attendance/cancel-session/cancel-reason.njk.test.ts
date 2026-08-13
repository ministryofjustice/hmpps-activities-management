import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/activities/record-attendance/cancel-session/cancel-reason.njk')

describe('Views - Cancel session - Cancellation reason', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should explain that prisoners will be paid when cancelling a payable session', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        cancellationReasons: {},
        isPayable: true,
        editMode: false,
      }),
    )

    expect($('h1').text().trim()).toBe('Why are you cancelling the session?')

    expect($('.govuk-caption-m').text().trim()).toBe(
      'Prisoners will be paid and recorded as having an acceptable absence.',
    )
  })

  it('should not mention payment when cancelling an unpaid session', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        cancellationReasons: {},
        isPayable: false,
        editMode: false,
      }),
    )

    expect($('.govuk-caption-m').text().trim()).toBe('Prisoners will be recorded as having an acceptable absence.')
  })
})
