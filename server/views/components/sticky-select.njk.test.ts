import * as cheerio from 'cheerio'
import { compile } from 'nunjucks'

import { registerNunjucks } from '../../nunjucks/nunjucksSetup'

describe('stickySelect', () => {
  it('gives the selection column an accessible heading', () => {
    const template = compile(
      `
        {% from "components/sticky-select.njk" import stickySelect %}
        {{ stickySelect({
          idPrefix: 'test',
          type: 'radio',
          name: 'selectedItem',
          itemsDescription: 'application',
          itemsDescriptionPlural: 'applications',
          head: [{ text: 'Name' }],
          rows: [{
            selectable: true,
            visuallyHiddenText: 'Select Jane Doe',
            value: '1',
            items: [{ text: 'Jane Doe' }]
          }],
          actions: [],
          pagination: {}
        }) }}
      `,
      registerNunjucks(),
    )

    const $ = cheerio.load(template.render())

    expect($('thead th').first().find('.govuk-visually-hidden').text().trim()).toEqual('Select application')
  })
})
