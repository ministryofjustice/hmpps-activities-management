import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/select-prisoner.njk')

describe('Views - Appointments - Selected prisoners', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(view.toString(), njkEnv)
  })

  it('should not display prisoner list when no prisoners are in context', () => {
    const $ = cheerio.load(compiledTemplate.render({}))

    expect($('#prisoner-search-list').length).toBe(0)
  })

  it('should display prisoner list with radios and "Select prisoner and continue" button when prisoners are in context', () => {
    const viewContext = {
      query: 'somequery',
      prisoners: [
        {
          firstName: 'John',
          lastName: 'Smith',
          prisonerNumber: 'A1234BC',
          cellLocation: '1-1-1',
        },
        {
          firstName: 'Joe',
          lastName: 'Bloggs',
          prisonerNumber: 'Z6789YX',
          cellLocation: '2-2-2',
        },
      ],
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('#prisoner-search-list tbody tr').length).toBe(2)
    expect($('#prisoner-search-list input[name="selectedPrisoner"][type="radio"]').length).toBe(2)
    expect($('#prisoner-search-list input[name="selectedPrisoner"][type="hidden"]').length).toBe(0)
    expect($('#prisoner-results-text').text().trim()).toEqual(
      'Select the correct result from the list (maximum 50 results shown)',
    )
    expect($('#continue-button-above-results').length).toBe(0)
    expect($('#continue-button').text().trim()).toEqual('Select and continue')
  })

  it('should display single prisoner without radios when single prisoner is found', () => {
    const viewContext = {
      query: 'somequery',
      prisoners: [
        {
          firstName: 'John',
          lastName: 'Smith',
          prisonerNumber: 'A1234BC',
          cellLocation: '1-1-1',
        },
      ],
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('#prisoner-search-list tbody tr').length).toBe(1)
    expect($('#prisoner-search-list input[name="selectedPrisoner"][type="radio"]').length).toBe(0)
    expect($('#prisoner-search-list input[name="selectedPrisoner"][type="hidden"]').length).toBe(1)
    expect($('#prisoner-results-text').text().trim()).toEqual('There is 1 matching result')
    expect($('#continue-button').text().trim()).toEqual('Continue')
  })

  it('should display no prisoners and "no matching results" message when there are no results for query', () => {
    const viewContext = {
      query: 'somequery',
      prisoners: [] as object[],
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('#prisoner-search-list').length).toBe(0)
    expect($('.govuk-warning-text').text()).toContain('There are no matching search results.')
    expect($('#prisoner-search-list').length).toBe(0)
    expect($('#continue-button-above-results').length).toBe(0)
    expect($('#continue-button').length).toBe(0)
  })

  it('should display both "select and continue" buttons if more than 10 results are shown', () => {
    const viewContext = {
      query: 'somequery',
      prisoners: new Array(11).fill({
        firstName: 'John',
        lastName: 'Smith',
        prisonerNumber: 'A1234BC',
        cellLocation: '1-1-1',
      }),
    }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('#continue-button-above-results').length).toBe(1)
    expect($('#continue-button').length).toBe(1)
  })
})
