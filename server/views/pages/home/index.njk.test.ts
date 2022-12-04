import fs from 'fs'
import cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../../nunjucks/nunjucksSetup'

const snippet = fs.readFileSync('server/views/pages/home/index.njk')

describe('Views - Home', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(snippet.toString(), njkEnv)
    viewContext = {}
  })

  it('should display whereabouts(prison API) card when flag is true in context', () => {
    viewContext = { shouldShowAlphaPrisonActivityListDps: true }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=alpha-activity-list-dps-link]')).toHaveLength(1)
  })

  it('should hide whereabouts(prison API) card when flag is false in context', () => {
    viewContext = { shouldShowAlphaPrisonActivityListDps: false }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=alpha-activity-list-dps-link]')).toHaveLength(0)
  })

  it('should display whereabouts(activities API) card when flag is true in context', () => {
    viewContext = { shouldShowAlphaPrisonActivityListAm: true }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=alpha-activity-list-am-link]')).toHaveLength(1)
  })

  it('should hide whereabouts(activities API) card when flag is false in context', () => {
    viewContext = { shouldShowAlphaPrisonActivityListAm: false }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=alpha-activity-list-am-link]')).toHaveLength(0)
  })

  it('should always show the unlock list tile', () => {
    viewContext = {}
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('[data-qa=unlock-list-link]')).toHaveLength(1)
  })
})
