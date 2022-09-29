/* eslint-disable no-param-reassign */
import nunjucks from 'nunjucks'
import express from 'express'
import * as pathModule from 'path'
import { initialiseName } from './utils'

const production = process.env.NODE_ENV === 'production'

export default function nunjucksSetup(app: express.Express, path: pathModule.PlatformPath): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Activities Management'

  // Cachebusting version string
  if (production) {
    // Version only changes on reboot
    app.locals.version = Date.now().toString()
  } else {
    // Version changes every request
    app.use((req, res, next) => {
      res.locals.version = Date.now().toString()
      return next()
    })
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/',
      'node_modules/govuk-frontend/components/',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/@ministryofjustice/frontend/moj/components/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  njkEnv.addFilter('initialiseName', initialiseName)

  njkEnv.addFilter(
    'setSelected',
    (items, selected) =>
      items &&
      items.map((entry: { value: string }) => ({
        ...entry,
        selected: entry && entry.value === selected,
      })),
  )

  njkEnv.addFilter('addDefaultSelectedValue', (items, text, show) => {
    if (!items) return null
    const attributes: { hidden?: string } = {}
    if (!show) attributes.hidden = ''

    return [
      {
        text,
        value: '',
        selected: true,
        attributes,
      },
      ...items,
    ]
  })

  njkEnv.addFilter('findError', (array, formFieldId) => {
    if (!array) return null
    const item = array.find((error: { href: string }) => error.href === `#${formFieldId}`)
    if (item) {
      return {
        text: item.text,
      }
    }
    return null
  })
}
