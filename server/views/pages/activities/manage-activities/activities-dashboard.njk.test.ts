import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const snippet = fs.readFileSync('server/views/pages/activities/manage-activities/activities-dashboard.njk')

describe('Views - Manage activities - View activities', () => {
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
      ).toEqual(['Activity name', 'Date created', 'Activity category', 'State'])

      expect($('.govuk-table').text()).toContain('Activity category')
      expect($('.govuk-table').text()).toContain('Education')
    })

    it('hides activity category column for outside activities', () => {
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
      ).toEqual(['Activity name', 'Date created', '', 'State'])

      expect($('.govuk-table').text()).not.toContain('Activity category')
      expect($('.govuk-table').text()).not.toContain('Outside Work')
    })
  })

  describe('state filter', () => {
    it('checks live state filter', () => {
      viewContext = {
        activities: [],
        filters: { stateFilter: 'live' },
      }

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('input[name="stateFilter"][value="live"]').is(':checked')).toBe(true)
    })

    it('checks archived state filter', () => {
      viewContext = {
        activities: [],
        filters: { stateFilter: 'archived' },
      }

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('input[name="stateFilter"][value="archived"]').is(':checked')).toBe(true)
    })

    it('checks all state filter', () => {
      viewContext = {
        activities: [],
        filters: { stateFilter: 'all' },
      }

      const $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('input[name="stateFilter"][value="all"]').is(':checked')).toBe(true)
    })
  })
})
