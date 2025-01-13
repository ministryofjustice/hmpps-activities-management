import * as cheerio from 'cheerio'
import { CheerioAPI } from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../nunjucks/nunjucksSetup'

let $: CheerioAPI

describe('show renderPayStatus macro', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    const view = `
      {% from "partials/renderPayStatus.njk" import renderPayStatus %}
      {{ renderPayStatus(options) }}`
    compiledTemplate = nunjucks.compile(view, njkEnv)
  })

  describe('', () => {
    it("should not display any tag if the data isn't present", () => {
      const viewContext = {
        options: {
          dataPresentCheck: null,
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).not.toContain('Pay')
      expect($('body').text()).not.toContain('No pay')
      expect($('body').text()).not.toContain('Unpaid')
    })
    it('should not display any tag if the status is WAITING', () => {
      const viewContext = {
        options: {
          dataPresentCheck: { data: [] },
          status: 'WAITING',
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).not.toContain('Pay')
      expect($('body').text()).not.toContain('No pay')
      expect($('body').text()).not.toContain('Unpaid')
    })
    it('should display Pay if the prisoner is logged with issuePayment', () => {
      const viewContext = {
        options: {
          dataPresentCheck: { data: [] },
          status: 'COMPLETED',
          issuePayment: true,
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('Pay')
    })
    it('should display Paid if the prisoner is logged with issuePayment and this display is different', () => {
      const viewContext = {
        options: {
          dataPresentCheck: { data: [] },
          status: 'COMPLETED',
          issuePayment: true,
          payText: 'Paid',
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('Paid')
    })
    it('should display No pay if the prisoner is issuePayment is false but the activity is payable', () => {
      const viewContext = {
        options: {
          dataPresentCheck: { data: [] },
          status: 'COMPLETED',
          issuePayment: false,
          payable: true,
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('No pay')
    })
    it('should display unpaid if the prisoner is issuePayment is false and the activity is not payable', () => {
      const viewContext = {
        options: {
          dataPresentCheck: { data: [] },
          status: 'COMPLETED',
          issuePayment: false,
          payable: false,
        },
      }

      $ = cheerio.load(compiledTemplate.render(viewContext))

      expect($('body').text()).toContain('Unpaid')
    })
  })
})
