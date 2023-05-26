import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/appointments/create-and-edit/apply-to.njk')

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
})
