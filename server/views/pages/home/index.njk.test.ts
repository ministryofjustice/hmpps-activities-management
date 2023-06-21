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
    viewContext = { user: { roles: ['ROLE_ACTIVITY_HUB'] } }
  })

  it('should always show the unlock list tile', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext))
    expect($('[data-qa=manage-unlock-lists]')).toHaveLength(1)
  })
})
