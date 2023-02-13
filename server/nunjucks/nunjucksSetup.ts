/* eslint-disable no-param-reassign */
import nunjucks, { Environment } from 'nunjucks'
import express, { Router } from 'express'
import path from 'path'
import { addMonths, addWeeks, subMonths, subWeeks } from 'date-fns'
import {
  addDefaultSelectedValue,
  buildErrorSummaryList,
  convertToTitleCase,
  dateInList,
  existsInStringArray,
  findError,
  formatDate,
  getTimeSlotFromTime,
  initialiseName,
  setSelected,
  startsWithAny,
  toMoney,
  toTimeItems,
  exampleDateOneWeekAhead,
} from '../utils/utils'
import config from '../config'
import {
  filterActivitiesForDay,
  getCalendarConfig,
  isClashing,
  sortActivitiesByStartTime,
} from '../utils/calendarUtilities'
import { Services } from '../services'

const production = process.env.NODE_ENV === 'production'

export default function nunjucksSetup(app: express.Express, { ukBankHolidayService }: Services): Router {
  const router = express.Router()

  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Activities Management'
  app.locals.hmppsAuthUrl = config.apis.hmppsAuth.url
  app.locals.dpsUrl = config.dpsUrl

  router.use(async (req, res, next) => {
    app.locals.ukBankHolidays = await ukBankHolidayService.getUkBankHolidays()
    next()
  })

  router.use((req, res, next) => {
    res.locals.session = req.session
    next()
  })

  // Cachebusting version string
  if (production) {
    // Version only changes on reboot
    app.locals.version = Date.now().toString()
  } else {
    // Version changes every request
    router.use((req, res, next) => {
      res.locals.version = Date.now().toString()
      return next()
    })
  }

  registerNunjucks(app)

  return router
}

export function registerNunjucks(app?: express.Express): Environment {
  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../views'),
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

  // Only register nunjucks helpers/filters here - they should be implemented and unit tested elsewhere
  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('setSelected', setSelected)
  njkEnv.addFilter('addDefaultSelectedValue', addDefaultSelectedValue)
  njkEnv.addFilter('toTimeItems', toTimeItems)
  njkEnv.addFilter('findError', findError)
  njkEnv.addFilter('buildErrorSummaryList', buildErrorSummaryList)
  njkEnv.addFilter('formatDate', formatDate)
  njkEnv.addFilter('filterActivitiesForDay', filterActivitiesForDay)
  njkEnv.addFilter('sortActivitiesByStartTime', sortActivitiesByStartTime)
  njkEnv.addFilter('dateInList', dateInList)
  njkEnv.addFilter('subMonths', subMonths)
  njkEnv.addFilter('addMonths', addMonths)
  njkEnv.addFilter('subWeeks', subWeeks)
  njkEnv.addFilter('addWeeks', addWeeks)
  njkEnv.addFilter('isClashing', isClashing)
  njkEnv.addFilter('existsInStringArray', existsInStringArray)
  njkEnv.addFilter('getTimeSlotFromTime', getTimeSlotFromTime)
  njkEnv.addFilter('startsWithAny', startsWithAny)
  njkEnv.addFilter('toMoney', toMoney)
  njkEnv.addFilter('toTitleCase', convertToTitleCase)
  njkEnv.addFilter('exampleDateOneWeekAhead', exampleDateOneWeekAhead)

  njkEnv.addGlobal('calendarConfig', getCalendarConfig)
  njkEnv.addGlobal('ukBankHolidays', () => app.locals.ukBankHolidays)

  return njkEnv
}
