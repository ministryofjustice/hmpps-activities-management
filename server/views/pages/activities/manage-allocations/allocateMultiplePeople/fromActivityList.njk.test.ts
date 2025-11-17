import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync(
  'server/views/pages/activities/manage-allocations/allocateMultiplePeople/fromActivityList.njk',
)

describe('Views - Search for an activity', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('search for an activity', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text().trim()).toEqual('Search for an activity to get the list of people allocated to it')
    const button = $('.govuk-button')
    expect(button.text().trim()).toBe('Continue')
  })
})
