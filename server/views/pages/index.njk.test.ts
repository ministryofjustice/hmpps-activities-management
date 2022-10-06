import fs from 'fs'
import cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../nunjucks/nunjucksSetup'

const snippet = fs.readFileSync('server/views/pages/index.njk')

describe('Views - Home', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    compiledTemplate = nunjucks.compile(snippet.toString(), njkEnv)
    viewContext = {}
  })

  it('should display create activity card when flag is true in context', () => {
    viewContext = { shouldShowCreateActivityCard: true }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=create-activity-link]')).toHaveLength(1)
  })

  it('should hide create licence card when flag is false in context', () => {
    viewContext = { shouldShowCreateActivityCard: false }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=create-activity-link]')).toHaveLength(0)
  })

  it('should display create activity card when flag is true in context', () => {
    viewContext = { shouldShowCreateActivityCard: true }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=create-activity-link]')).toHaveLength(1)
  })

  it('should hide create licence card when flag is false in context', () => {
    viewContext = { shouldShowCreateActivityCard: false }

    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('[data-qa=create-activity-link]')).toHaveLength(0)
  })
})
