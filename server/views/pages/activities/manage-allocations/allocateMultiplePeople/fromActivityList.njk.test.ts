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

  it('should render the activities available to copy allocations from', () => {
    viewContext = {
      allocateJourney: {
        activity: {
          name: 'English level 1',
        },
      },
      activities: [
        {
          id: 1,
          activityName: 'Maths level 1',
        },
        {
          id: 2,
          activityName: 'English level 1',
        },
      ],
      formResponses: {},
      validationErrors: [],
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('h1').text().trim()).toBe('Search for an activity to get the list of people allocated to it')

    const options = $('#activityId option')

    expect(options.map((_, option) => $(option).attr('value')).get()).toEqual(['-', '1', '2'])

    expect(options.map((_, option) => $(option).text().trim()).get()).toEqual(['', 'Maths level 1', 'English level 1'])

    expect($('.govuk-button').text().trim()).toBe('Continue')
  })
})
