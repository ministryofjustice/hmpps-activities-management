import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../nunjucks/nunjucksSetup'

let $: CheerioAPI

describe('Show Location Macro', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    const view = `
      {% from "partials/showLocation.njk" import showLocation %}
  
      {{ showLocation(event) }}
    `

    compiledTemplate = nunjucks.compile(view, njkEnv)
  })

  describe('Single Value', () => {
    it("should display 'In cell'", () => {
      const viewContext = {
        event: {
          inCell: true,
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('In cell')
    })

    it("should display 'On wing'", () => {
      const viewContext = {
        event: {
          onWing: true,
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('On wing')
    })

    it("should display 'Off wing'", () => {
      const viewContext = {
        event: {
          offWing: true,
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('Off wing')
    })

    it('should display location name', () => {
      const viewContext = {
        event: {
          location: {
            name: 'A Wing',
          },
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('A Wing')
    })

    it('should display location', () => {
      const viewContext = {
        event: {
          location: 'B Wing',
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('B Wing')
    })

    it('should display description in internal location', () => {
      const viewContext = {
        event: {
          internalLocation: {
            description: 'C Wing',
          },
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('C Wing')
    })

    it('should display user description in internal location', () => {
      const viewContext = {
        event: {
          internalLocationUserDescription: 'D Wing',
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('D Wing')
    })

    it('should display internal location description', () => {
      const viewContext = {
        event: {
          internalLocationUserDescription: 'E Wing',
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('E Wing')
    })
  })

  describe('Multiple Values', () => {
    it("should display 'In cell'", () => {
      const viewContext = {
        event: {
          inCell: true,
          onWing: true,
          offWing: true,
          location: {
            name: 'A Wing',
          },
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('In cell')
    })

    it("should display 'On wing'", () => {
      const viewContext = {
        event: {
          inCell: false,
          onWing: true,
          offWing: true,
          location: {
            name: 'A Wing',
          },
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('On wing')
    })

    it("should display 'Off wing'", () => {
      const viewContext = {
        event: {
          inCell: false,
          onWing: false,
          offWing: true,
          location: {
            name: 'A Wing',
          },
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('Off wing')
    })

    it('should display location name', () => {
      const viewContext = {
        event: {
          inCell: false,
          onWing: false,
          offWing: false,
          location: {
            name: 'A Wing',
          },
          internalLocation: {
            description: 'C Wing',
          },
          internalLocationUserDescription: 'D Wing',
          internalLocationDescription: 'E Wing',
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('A Wing')
    })

    it('should display location', () => {
      const viewContext = {
        event: {
          inCell: false,
          onWing: false,
          offWing: false,
          location: 'B Wing',
          internalLocation: {
            description: 'C Wing',
          },
          internalLocationUserDescription: 'D Wing',
          internalLocationDescription: 'E Wing',
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('B Wing')
    })

    it('should display description in internal location', () => {
      const viewContext = {
        event: {
          inCell: false,
          onWing: false,
          offWing: false,
          internalLocationUserDescription: 'D Wing',
          internalLocationDescription: 'E Wing',
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('D Wing')
    })

    it('should display internal location description', () => {
      const viewContext = {
        event: {
          inCell: false,
          onWing: false,
          offWing: false,
          internalLocationDescription: 'E Wing',
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('E Wing')
    })
  })

  describe('Internal Location Provided', () => {
    beforeEach(() => {
      const view = `
        {% from "partials/showLocation.njk" import showLocation %}
    
        {{ showLocation(event, 'F Wing') }}
      `
      compiledTemplate = nunjucks.compile(view, njkEnv)
    })

    it("should display 'In cell'", () => {
      const viewContext = {
        event: {
          inCell: true,
          onWing: false,
          offWing: false,
          location: 'B Wing',
          internalLocation: {
            description: 'C Wing',
          },
          internalLocationUserDescription: 'D Wing',
          internalLocationDescription: 'E Wing',
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('In cell')
    })

    it('should display provided value', () => {
      const viewContext = {
        event: {
          inCell: false,
          onWing: false,
          offWing: false,
          location: 'B Wing',
          internalLocation: {
            description: 'C Wing',
          },
          internalLocationUserDescription: 'D Wing',
          internalLocationDescription: 'E Wing',
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('F Wing')
    })
  })

  describe('Capitalize', () => {
    it('should capitalize', () => {
      const view = `
        {% from "partials/showLocation.njk" import showLocation %}
    
        {{ showLocation(event, makeCapitals = true) }}
      `
      compiledTemplate = nunjucks.compile(view, njkEnv)

      const viewContext = {
        event: {
          inCell: false,
          onWing: false,
          offWing: false,
          location: 'B Wing',
          internalLocation: {
            description: 'C Wing',
          },
          internalLocationUserDescription: 'D Wing',
          internalLocationDescription: 'E Wing',
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('B wing')
    })

    it('should succeed if location is empty', () => {
      const view = `
        {% from "partials/showLocation.njk" import showLocation %}
    
        test {{ showLocation(event, ' ', true) }}
      `
      compiledTemplate = nunjucks.compile(view, njkEnv)

      const viewContext = {
        event: {
          inCell: false,
          onWing: false,
          offWing: false,
          location: 'B Wing',
          internalLocation: {
            description: 'C Wing',
          },
          internalLocationUserDescription: 'D Wing',
          internalLocationDescription: 'E Wing',
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('test')
    })
  })
})
