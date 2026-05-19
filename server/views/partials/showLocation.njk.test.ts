import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../nunjucks/nunjucksSetup'

let $: CheerioAPI

describe('Show Location Macro', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    const view = `
      {% from "partials/showLocation.njk" import showLocation %}

      {{ showLocation(externalActivitiesRolledOut, event) }}
    `

    compiledTemplate = compile(view, njkEnv)
  })

  describe('Single Value', () => {
    it("should display 'In cell'", () => {
      const viewContext = {
        event: {
          inCell: true,
        },
        externalActivitiesRolledOut: false,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('In cell')
    })

    it("should display 'On wing'", () => {
      const viewContext = {
        event: {
          onWing: true,
        },
        externalActivitiesRolledOut: false,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('On wing')
    })

    it("should display 'Off wing'", () => {
      const viewContext = {
        event: {
          offWing: true,
        },
        externalActivitiesRolledOut: false,
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
        externalActivitiesRolledOut: false,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('A Wing')
    })

    it('should display location', () => {
      const viewContext = {
        event: {
          location: 'B Wing',
        },
        externalActivitiesRolledOut: false,
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
        externalActivitiesRolledOut: false,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('C Wing')
    })

    it('should display user description in internal location', () => {
      const viewContext = {
        event: {
          internalLocationUserDescription: 'D Wing',
        },
        externalActivitiesRolledOut: false,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('D Wing')
    })

    it('should display internal location description', () => {
      const viewContext = {
        event: {
          internalLocationUserDescription: 'E Wing',
        },
        externalActivitiesRolledOut: false,
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
        externalActivitiesRolledOut: false,
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
        externalActivitiesRolledOut: false,
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
        externalActivitiesRolledOut: false,
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
        externalActivitiesRolledOut: false,
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
        externalActivitiesRolledOut: false,
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
        externalActivitiesRolledOut: false,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('E Wing')
    })
  })

  describe('External Activities Rolled Out and Outside Work', () => {
    it("should display 'Outside' when externalActivitiesRolledOut and outsideWork", () => {
      const viewContext = {
        event: {
          outsideWork: true,
        },
        externalActivitiesRolledOut: true,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('Outside')
    })

    it("should not display 'Outside' when externalActivitiesRolledOut is false and outsideWork is true", () => {
      const viewContext = {
        event: {
          outsideWork: true,
          inCell: true,
        },
        externalActivitiesRolledOut: false,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('In cell')
      expect($('body').text()).not.toContain('Outside')
    })

    it("should not display 'Outside' when externalActivitiesRolledOut is true and outsideWork is false", () => {
      const viewContext = {
        event: {
          outsideWork: false,
          inCell: true,
        },
        externalActivitiesRolledOut: true,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('In cell')
      expect($('body').text()).not.toContain('Outside')
    })

    it('should prioritize inCell over outsideWork', () => {
      const viewContext = {
        event: {
          inCell: true,
          outsideWork: true,
        },
        externalActivitiesRolledOut: true,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('In cell')
      expect($('body').text()).not.toContain('Outside')
    })

    it('should prioritize onWing over outsideWork', () => {
      const viewContext = {
        event: {
          onWing: true,
          outsideWork: true,
        },
        externalActivitiesRolledOut: true,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('On wing')
      expect($('body').text()).not.toContain('Outside')
    })

    it('should prioritize offWing over outsideWork', () => {
      const viewContext = {
        event: {
          offWing: true,
          outsideWork: true,
        },
        externalActivitiesRolledOut: true,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('Off wing')
      expect($('body').text()).not.toContain('Outside')
    })

    it('should display "Outside" with capitalize option', () => {
      const view = `
        {% from "partials/showLocation.njk" import showLocation %}

        {{ showLocation(externalActivitiesRolledOut, event, makeCapitals = true) }}
      `
      compiledTemplate = compile(view, njkEnv)

      const viewContext = {
        event: {
          outsideWork: true,
        },
        externalActivitiesRolledOut: true,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('Outside')
    })
  })

  describe('Internal Location Provided', () => {
    beforeEach(() => {
      const view = `
        {% from "partials/showLocation.njk" import showLocation %}

        {{ showLocation(externalActivitiesRolledOut, event, 'F Wing') }}
      `
      compiledTemplate = compile(view, njkEnv)
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
        externalActivitiesRolledOut: false,
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
        externalActivitiesRolledOut: false,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('F Wing')
    })
  })

  describe('Capitalize', () => {
    it('should capitalize', () => {
      const view = `
        {% from "partials/showLocation.njk" import showLocation %}

        {{ showLocation(externalActivitiesRolledOut, event, makeCapitals = true) }}
      `
      compiledTemplate = compile(view, njkEnv)

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
        externalActivitiesRolledOut: false,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('B wing')
    })

    it('should succeed if location is empty', () => {
      const view = `
        {% from "partials/showLocation.njk" import showLocation %}

        test {{ showLocation(externalActivitiesRolledOut, event, ' ', true) }}
      `
      compiledTemplate = compile(view, njkEnv)

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
        externalActivitiesRolledOut: false,
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('test')
    })
  })
})
