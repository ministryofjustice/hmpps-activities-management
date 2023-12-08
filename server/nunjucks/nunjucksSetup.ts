/* eslint-disable no-param-reassign */
import nunjucks, { Environment } from 'nunjucks'
import express, { Router } from 'express'
import path from 'path'
import { addDays, addMonths, addWeeks, addYears, startOfDay, subDays, subMonths, subWeeks } from 'date-fns'
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
  toFixed,
  toMoney,
  toTimeItems,
  fullName,
  prisonerName,
  toDate,
  parseDate,
  parseISODate,
  isTodayOrBefore,
  sliceArray,
  toDateString,
  padNumber,
  firstNameLastName,
  setAttribute,
  removeUndefined,
  filterObjects,
  flatMap,
} from '../utils/utils'
import config from '../config'
import applicationVersion from '../applicationVersion'
import {
  filterActivitiesForDay,
  getCalendarConfig,
  isClashing,
  sortActivitiesByStartTime,
} from '../utils/calendarUtilities'
import { Services } from '../services'
import { EventSource, EventType, YesNo } from '../@types/activities'
import { AppointmentType, AppointmentJourneyMode } from '../routes/appointments/create-and-edit/appointmentJourney'
import { AppointmentCancellationReason, AppointmentFrequency, AppointmentApplyTo } from '../@types/appointments'
import TimeSlot from '../enum/timeSlot'
import {
  getAppointmentEditApplyToCta,
  getAppointmentEditMessage,
  getConfirmAppointmentEditCta,
} from '../utils/editAppointmentUtils'
import ServiceName from '../enum/serviceName'
import DateOption from '../enum/dateOption'
import { PrisonerStatus } from '../@types/prisonApiImportCustom'
import { isoDateToDatePickerDate, parseIsoDate } from '../utils/datePickerUtils'

const production = process.env.NODE_ENV === 'production'

export default function nunjucksSetup(app: express.Express, { ukBankHolidayService }: Services): Router {
  const router = express.Router()

  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Activities and Appointments'
  app.locals.hmppsAuthUrl = config.apis.hmppsAuth.url
  app.locals.dpsUrl = config.dpsUrl
  app.locals.reportAFaultUrl = config.reportAFaultUrl
  app.locals.feedbackUrl = config.feedbackUrl

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
      watch: process.env.NODE_ENV === 'live-development',
    },
  )

  // Only register nunjucks helpers/filters here - they should be implemented and unit tested elsewhere
  njkEnv.addFilter('fullName', fullName)
  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('prisonerName', (str, bold) => {
    const name = prisonerName(str, bold)
    return name ? njkEnv.getFilter('safe')(name) : null
  })
  njkEnv.addFilter('setSelected', setSelected)
  njkEnv.addFilter('addDefaultSelectedValue', addDefaultSelectedValue)
  njkEnv.addFilter('toTimeItems', toTimeItems)
  njkEnv.addFilter('findError', findError)
  njkEnv.addFilter('buildErrorSummaryList', buildErrorSummaryList)
  njkEnv.addFilter('formatDate', formatDate)
  njkEnv.addFilter('filterActivitiesForDay', filterActivitiesForDay)
  njkEnv.addFilter('sortActivitiesByStartTime', sortActivitiesByStartTime)
  njkEnv.addFilter('dateInList', dateInList)
  njkEnv.addFilter('subDays', subDays)
  njkEnv.addFilter('subMonths', subMonths)
  njkEnv.addFilter('addMonths', addMonths)
  njkEnv.addFilter('subWeeks', subWeeks)
  njkEnv.addFilter('addWeeks', addWeeks)
  njkEnv.addFilter('isClashing', isClashing)
  njkEnv.addFilter('existsInStringArray', existsInStringArray)
  njkEnv.addFilter('getTimeSlotFromTime', getTimeSlotFromTime)
  njkEnv.addFilter('startsWithAny', startsWithAny)
  njkEnv.addFilter('toFixed', toFixed)
  njkEnv.addFilter('padNumber', padNumber)
  njkEnv.addFilter('toMoney', toMoney)
  njkEnv.addFilter('toTitleCase', convertToTitleCase)
  njkEnv.addFilter('toDate', toDate)
  njkEnv.addFilter('parseDate', parseDate)
  njkEnv.addFilter('parseISODate', parseISODate)
  njkEnv.addFilter('toDateString', toDateString)
  njkEnv.addFilter('todayOrBefore', isTodayOrBefore)
  njkEnv.addFilter('sliceArray', sliceArray)
  njkEnv.addFilter('addDays', addDays)
  njkEnv.addFilter('addWeeks', addWeeks)
  njkEnv.addFilter('addYears', addYears)
  njkEnv.addFilter('firstNameLastName', firstNameLastName)
  njkEnv.addFilter('setAttribute', setAttribute)
  njkEnv.addFilter('removeUndefined', removeUndefined)
  njkEnv.addFilter('startOfDay', startOfDay)
  njkEnv.addFilter('filter', filterObjects)
  njkEnv.addFilter('flatMap', flatMap)

  njkEnv.addGlobal('calendarConfig', getCalendarConfig)
  njkEnv.addGlobal('ukBankHolidays', () => app.locals.ukBankHolidays)

  njkEnv.addGlobal('ServiceName', ServiceName)
  njkEnv.addGlobal('YesNo', YesNo)
  njkEnv.addGlobal('EventType', EventType)
  njkEnv.addGlobal('EventSource', EventSource)
  njkEnv.addGlobal('DateOption', DateOption)
  njkEnv.addGlobal('TimeSlot', TimeSlot)
  njkEnv.addGlobal('PrisonerStatus', PrisonerStatus)
  njkEnv.addGlobal('AppointmentFrequency', AppointmentFrequency)
  njkEnv.addGlobal('AppointmentType', AppointmentType)
  njkEnv.addGlobal('AppointmentJourneyMode', AppointmentJourneyMode)
  njkEnv.addGlobal('AppointmentApplyTo', AppointmentApplyTo)
  njkEnv.addGlobal('AppointmentCancellationReason', AppointmentCancellationReason)
  njkEnv.addGlobal('getAppointmentEditMessage', getAppointmentEditMessage)
  njkEnv.addGlobal('getConfirmAppointmentEditCta', getConfirmAppointmentEditCta)
  njkEnv.addGlobal('getAppointmentEditApplyToCta', getAppointmentEditApplyToCta)
  njkEnv.addGlobal('dpsUrl', config.dpsUrl)
  njkEnv.addGlobal('exampleDate', () => `29 9 ${formatDate(addYears(new Date(), 1), 'yyyy')}`)
  njkEnv.addGlobal('applicationInsightsConnectionString', process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  njkEnv.addGlobal('applicationInsightsRoleName', applicationVersion.packageData.name)

  // Date picker
  njkEnv.addFilter('parseIsoDate', parseIsoDate)
  njkEnv.addFilter('isoDateToDatePickerDate', isoDateToDatePickerDate)
  njkEnv.addGlobal('exampleDatePickerDate', () => `29/9/${formatDate(addYears(new Date(), 1), 'yyyy')}`)

  return njkEnv
}
