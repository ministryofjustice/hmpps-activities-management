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

  describe('Location filter', () => {
    it('should render the empty location option with an empty string value', () => {
      $ = cheerio.load(
        compiledTemplate.render({
          ...baseContext,
          locations: [
            {
              id: 26152,
              description: 'Chapel',
            },
            {
              id: 26149,
              description: 'Gym',
            },
          ],
          filterItems: {
            ...baseContext.filterItems,
            locationType: 'OUT_OF_CELL',
            locationId: '',
          },
          externalActivitiesRolledOut: false,
        }),
      )

      const emptyOption = $('select[name="locationId"] option').first()

      expect(emptyOption.attr('value')).toEqual('')
      expect(emptyOption.text()).toEqual('')
    })

    it('should not render the empty location option with a hyphen value', () => {
      $ = cheerio.load(
        compiledTemplate.render({
          ...baseContext,
          locations: [
            {
              id: 26152,
              description: 'Chapel',
            },
          ],
          filterItems: {
            ...baseContext.filterItems,
            locationType: 'OUT_OF_CELL',
            locationId: '',
          },
          externalActivitiesRolledOut: false,
        }),
      )

      expect($('select[name="locationId"] option[value="-"]')).toHaveLength(0)
    })

    it('should render location options', () => {
      $ = cheerio.load(
        compiledTemplate.render({
          ...baseContext,
          locations: [
            {
              id: 26152,
              description: 'Chapel',
            },
            {
              id: 26149,
              description: 'Gym',
            },
          ],
          filterItems: {
            ...baseContext.filterItems,
            locationType: 'OUT_OF_CELL',
            locationId: '26152',
          },
          externalActivitiesRolledOut: false,
        }),
      )

      expect($('select[name="locationId"] option[value="26152"]').text()).toEqual('Chapel')
      expect($('select[name="locationId"] option[value="26149"]').text()).toEqual('Gym')
    })
  })

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
