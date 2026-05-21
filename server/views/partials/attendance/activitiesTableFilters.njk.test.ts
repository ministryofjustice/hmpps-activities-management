import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../nunjucks/nunjucksSetup'

let $: CheerioAPI

describe('Activities Table Filters Macro', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    const view = `
      {% from "partials/attendance/activitiesTableFilters.njk" import activitiesTableFilters %}

      {{ activitiesTableFilters(locations, filterItems, externalActivitiesRolledOut) }}
    `

    compiledTemplate = compile(view, njkEnv)
  })

  const baseContext = {
    locations: [],
    filterItems: { locationType: 'ALL', sessionFilters: [], categoryFilters: [] },
  }

  describe('External (OUTSIDE) Activities', () => {
    it('should render the Outside radio when externalActivitiesRolledOut is true', () => {
      $ = cheerio.load(compiledTemplate.render({ ...baseContext, externalActivitiesRolledOut: true }))

      expect($('input[name="locationType"][value="OUTSIDE_WORK"]')).toHaveLength(1)
    })

    it('should NOT render the Outside radio when externalActivitiesRolledOut is false', () => {
      $ = cheerio.load(compiledTemplate.render({ ...baseContext, externalActivitiesRolledOut: false }))

      expect($('input[name="locationType"][value="OUTSIDE_WORK"]')).toHaveLength(0)
    })
  })
})
