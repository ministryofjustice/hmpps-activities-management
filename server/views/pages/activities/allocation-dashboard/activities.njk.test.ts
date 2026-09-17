import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const snippet = fs.readFileSync('server/views/pages/activities/allocation-dashboard/activities.njk')

describe('Views - Manage allocations - Activity allocation dashboard', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = compile(snippet.toString(), njkEnv)
  })

  describe('Activity column view', () => {
    it('shows activity category column for In-prison activities', () => {
      viewContext = {
        user: {
          username: 'joebloggs',
        },
        activities: [
          {
            id: 1261,
            activityName: 'Maths',
            category: {
              name: 'Education',
            },
          },
        ],
        filters: {
          isOutsideWorkFilter: 'false',
        },
      }

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect(
        $('.govuk-table__header')
          .map((i, e) => $(e).text())
          .get(),
      ).toEqual(['Activity', 'Category', 'Capacity', 'Allocated', 'Vacancies', 'Waitlist', 'Percentage allocated'])

      expect($('.govuk-table').text()).toContain('Category')
      expect($('.govuk-table').text()).toContain('Education')
    })

    it('hides activity category and waitlist columns for outside activities', () => {
      viewContext = {
        user: {
          username: 'joebloggs',
        },
        activities: [
          {
            id: 1261,
            activityName: 'Farm Shop',
            category: {
              name: 'Outside Work',
            },
          },
        ],
        filters: {
          isOutsideWorkFilter: 'true',
        },
      }

      const $ = cheerio.load(compiledTemplate.render(viewContext))
      expect(
        $('.govuk-table__header')
          .map((i, e) => $(e).text().trim())
          .get(),
      ).toEqual(['Activity', '', 'Capacity', 'Allocated', 'Vacancies', '', 'Percentage allocated'])

      expect($('.govuk-table').text()).not.toContain('Category')
      expect($('.govuk-table').text()).not.toContain('Outside Work')
    })
  })
})
