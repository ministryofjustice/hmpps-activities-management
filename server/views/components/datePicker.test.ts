import cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import { registerNunjucks } from '../../nunjucks/nunjucksSetup'

describe('View Partials - Date Picker', () => {
  let compiledTemplate: Template
  let viewContext: Record<string, unknown>

  const njkEnv = registerNunjucks()

  it('should have a legend if a label is provided', () => {
    viewContext = {
      options: {
        id: 'datePicker',
        label: {
          text: 'Label',
        },
      },
    }

    const nunjucksString = '{% from "components/datePicker.njk" import datePicker %}{{ datePicker(options)}}'
    compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('fieldset').get()).toHaveLength(1)
    expect($('fieldset > legend').text().trim()).toBe('Label')
  })

  it('should not have a legend if a label is not provided', () => {
    viewContext = {
      options: {
        id: 'datePicker',
      },
    }

    const nunjucksString = '{% from "components/datePicker.njk" import datePicker %}{{ datePicker(options)}}'
    compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('fieldset').get()).toHaveLength(0)
  })

  it('should add error class to inputs when renderedErrorMessage param is present', () => {
    viewContext = {
      options: {
        id: 'datePicker',
        renderedErrorMessage: {
          text: 'error',
        },
      },
    }
    const nunjucksString = '{% from "components/datePicker.njk" import datePicker %}{{ datePicker(options)}}'
    compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('#datePicker-day').hasClass('govuk-input--error')).toBe(true)
    expect($('#datePicker-month').hasClass('govuk-input--error')).toBe(true)
    expect($('#datePicker-year').hasClass('govuk-input--error')).toBe(true)
  })

  it('should not add error class to inputs when renderedErrorMessage param is not present', () => {
    viewContext = {
      options: {
        id: 'datePicker',
      },
    }
    const nunjucksString = '{% from "components/datePicker.njk" import datePicker %}{{ datePicker(options)}}'
    compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('#datePicker-day').hasClass('govuk-input--error')).toBe(false)
    expect($('#datePicker-month').hasClass('govuk-input--error')).toBe(false)
    expect($('#datePicker-year').hasClass('govuk-input--error')).toBe(false)
  })

  it('should not error class to day input when a validationError for the field exists', () => {
    viewContext = {
      options: {
        id: 'datePicker',
        validationErrors: [{ field: 'datePicker-day', message: 'error' }],
      },
    }
    const nunjucksString = '{% from "components/datePicker.njk" import datePicker %}{{ datePicker(options)}}'
    compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('#datePicker-day').hasClass('govuk-input--error')).toBe(true)
    expect($('#datePicker-month').hasClass('govuk-input--error')).toBe(false)
    expect($('#datePicker-year').hasClass('govuk-input--error')).toBe(false)
  })

  it('should not error class to month input when a validationError for the field exists', () => {
    viewContext = {
      options: {
        id: 'datePicker',
        validationErrors: [{ field: 'datePicker-month', message: 'error' }],
      },
    }
    const nunjucksString = '{% from "components/datePicker.njk" import datePicker %}{{ datePicker(options)}}'
    compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('#datePicker-day').hasClass('govuk-input--error')).toBe(false)
    expect($('#datePicker-month').hasClass('govuk-input--error')).toBe(true)
    expect($('#datePicker-year').hasClass('govuk-input--error')).toBe(false)
  })

  it('should not error class to year input when a validationError for the field exists', () => {
    viewContext = {
      options: {
        id: 'datePicker',
        validationErrors: [{ field: 'datePicker-year', message: 'error' }],
      },
    }
    const nunjucksString = '{% from "components/datePicker.njk" import datePicker %}{{ datePicker(options)}}'
    compiledTemplate = nunjucks.compile(nunjucksString, njkEnv)
    const $ = cheerio.load(compiledTemplate.render(viewContext))

    expect($('#datePicker-day').hasClass('govuk-input--error')).toBe(false)
    expect($('#datePicker-month').hasClass('govuk-input--error')).toBe(false)
    expect($('#datePicker-year').hasClass('govuk-input--error')).toBe(true)
  })
})
