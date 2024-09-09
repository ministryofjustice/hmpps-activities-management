/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
import nunjucks, { Environment } from 'nunjucks'
import express, { Router } from 'express'
import path from 'path'
import { addDays, addMonths, addWeeks, addYears, getUnixTime, startOfDay, subDays, subMonths, subWeeks } from 'date-fns'
import { flatMap, flatten, sortBy } from 'lodash'
import setUpDprNunjucksFilters from '@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/setUpNunjucksFilters'
import {
  addDefaultSelectedValue,
  buildErrorSummaryList,
  concatArrays,
  convertToTitleCase,
  dateInList,
  excludeArrayObject,
  existsInStringArray,
  filterNot,
  filterObjects,
  findError,
  firstNameLastName,
  formatDate,
  fullName,
  getSplitTime,
  initialiseName,
  isTodayOrBefore,
  padNumber,
  parseDate,
  parseISODate,
  prisonerName,
  removeUndefined,
  setAttribute,
  setSelected,
  sliceArray,
  startsWithAny,
  toDate,
  toDateString,
  toFixed,
  toMoney,
  toTimeItems,
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
import { EventSource, EventType, PayNoPay, YesNo } from '../@types/activities'
import { AppointmentJourneyMode, AppointmentType } from '../routes/appointments/create-and-edit/appointmentJourney'
import {
  AppointmentApplyTo,
  AppointmentCancellationReason,
  AppointmentFrequency,
  AttendanceStatus,
} from '../@types/appointments'
import TimeSlot from '../enum/timeSlot'
import {
  getAppointmentEditApplyToCta,
  getAppointmentEditMessage,
  getConfirmAppointmentEditCta,
} from '../utils/editAppointmentUtils'
import ServiceName from '../enum/serviceName'
import DateOption from '../enum/dateOption'
import { PrisonerStatus } from '../@types/prisonApiImportCustom'
import { isoDateToDatePickerDate, isoDateToTimePicker, parseIsoDate } from '../utils/datePickerUtils'
import WaitlistRequester from '../enum/waitlistRequester'
import { SERVICE_AS_USERNAME } from '../services/userService'
import EventTier from '../enum/eventTiers'
import EventOrganiser from '../enum/eventOrganisers'
import AttendanceReason from '../enum/attendanceReason'
import { absenceReasonCheckboxMatch, absenceReasonDisplayConverter } from '../utils/helpers/absenceReasonConverter'
import { ScheduleChangeOption } from '../routes/activities/create-an-activity/handlers/customTimesChangeOption'
import { DefaultOrCustomTimes } from '../routes/activities/create-an-activity/handlers/customTimesChangeDefaultOrCustom'

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
      'node_modules/govuk-frontend/dist',
      'node_modules/govuk-frontend/components/',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/@ministryofjustice/frontend/moj/components/',
      'node_modules/@ministryofjustice/hmpps-digital-prison-reporting-frontend/',
      'node_modules/@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/components/',
    ],
    {
      autoescape: true,
      express: app,
      watch: process.env.NODE_ENV === 'live-development',
    },
  )

  setUpDprNunjucksFilters(njkEnv)

  // Only register nunjucks helpers/filters here - they should be implemented and unit tested elsewhere
  njkEnv.addFilter('fullName', fullName)
  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('prisonerName', (str, bold) => {
    const name = prisonerName(str, bold)
    return name ? njkEnv.getFilter('safe')(name) : null
  })
  njkEnv.addFilter('prisonerNameForSorting', str => {
    const name = njkEnv.getFilter('prisonerName')(str, false)
    return name.val || null
  })

  njkEnv.addFilter('getSplitTime', getSplitTime)
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
  njkEnv.addFilter('getUnixTime', getUnixTime)
  njkEnv.addFilter('addWeeks', addWeeks)
  njkEnv.addFilter('isClashing', isClashing)
  njkEnv.addFilter('existsInStringArray', existsInStringArray)
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
  njkEnv.addFilter('find', (l: any[], iteratee: string, eq: unknown) => l.find(o => o[iteratee] === eq))
  njkEnv.addFilter('filter', filterObjects)
  njkEnv.addFilter('filterNot', filterNot)
  njkEnv.addFilter('flatMap', flatMap)
  njkEnv.addFilter('flatten', flatten)
  njkEnv.addFilter('sortBy', sortBy)
  njkEnv.addFilter('excludeArray', excludeArrayObject)
  njkEnv.addFilter('absenceReasonDisplayConverter', absenceReasonDisplayConverter)
  njkEnv.addFilter('absenceReasonCheckboxMatch', absenceReasonCheckboxMatch)

  njkEnv.addGlobal('calendarConfig', getCalendarConfig)
  njkEnv.addGlobal('ukBankHolidays', () => app.locals.ukBankHolidays)

  njkEnv.addGlobal('ServiceAsUsername', SERVICE_AS_USERNAME)
  njkEnv.addGlobal('ServiceName', ServiceName)
  njkEnv.addGlobal('YesNo', YesNo)
  njkEnv.addGlobal('EventType', EventType)
  njkEnv.addGlobal('EventSource', EventSource)
  njkEnv.addGlobal('DateOption', DateOption)
  njkEnv.addGlobal('TimeSlot', TimeSlot)
  njkEnv.addGlobal('WaitlistRequester', WaitlistRequester)
  njkEnv.addGlobal('PrisonerStatus', PrisonerStatus)
  njkEnv.addGlobal('AppointmentFrequency', AppointmentFrequency)
  njkEnv.addGlobal('AppointmentType', AppointmentType)
  njkEnv.addGlobal('AppointmentJourneyMode', AppointmentJourneyMode)
  njkEnv.addGlobal('AppointmentApplyTo', AppointmentApplyTo)
  njkEnv.addGlobal('AppointmentCancellationReason', AppointmentCancellationReason)
  njkEnv.addGlobal('AttendanceStatus', AttendanceStatus)
  njkEnv.addGlobal('AttendanceReason', AttendanceReason)
  njkEnv.addGlobal('EventTier', EventTier)
  njkEnv.addGlobal('PayNoPay', PayNoPay)
  njkEnv.addGlobal('EventOrganiser', EventOrganiser)
  njkEnv.addGlobal('getAppointmentEditMessage', getAppointmentEditMessage)
  njkEnv.addGlobal('getConfirmAppointmentEditCta', getConfirmAppointmentEditCta)
  njkEnv.addGlobal('getAppointmentEditApplyToCta', getAppointmentEditApplyToCta)
  njkEnv.addGlobal('concatArrays', concatArrays)
  njkEnv.addGlobal('dpsUrl', config.dpsUrl)
  njkEnv.addGlobal('exampleDate', () => `29 9 ${formatDate(addYears(new Date(), 1), 'yyyy')}`)
  njkEnv.addGlobal('applicationInsightsConnectionString', process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  njkEnv.addGlobal('applicationInsightsRoleName', applicationVersion.packageData.name)
  njkEnv.addGlobal('isProduction', process.env.NODE_ENV === 'production')
  njkEnv.addGlobal('futurePayRatesFlag', config.futurePayRatesToggleEnabled)
  njkEnv.addGlobal('customStartEndTimesEnabled', config.customStartEndTimesEnabled)
  njkEnv.addGlobal('bookAVideoLinkToggleEnabled', config.bookAVideoLinkToggleEnabled)
  njkEnv.addGlobal('customStartEndTimesEnabled', config.customStartEndTimesEnabled)
  njkEnv.addGlobal('ScheduleChangeOption', ScheduleChangeOption)
  njkEnv.addGlobal('DefaultOrCustomTimes', DefaultOrCustomTimes)

  // Date picker
  njkEnv.addFilter('parseIsoDate', parseIsoDate)
  njkEnv.addFilter('isoDateToDatePickerDate', isoDateToDatePickerDate)
  njkEnv.addFilter('isoDateToTimePicker', isoDateToTimePicker)
  njkEnv.addGlobal('exampleDatePickerDate', () => `29/9/${formatDate(addYears(new Date(), 1), 'yyyy')}`)

  return njkEnv
}
