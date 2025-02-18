/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
import nunjucks, { Environment } from 'nunjucks'
import express, { Router } from 'express'
import path from 'path'
import { addDays, addMonths, addWeeks, addYears, getUnixTime, startOfDay, subDays, subMonths, subWeeks } from 'date-fns'
import { flatMap, flatten, sortBy } from 'lodash'
import setUpDprNunjucksFilters from '@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/setUpNunjucksFilters'
import fs from 'fs'
import {
  buildErrorSummaryList,
  concatArrays,
  convertToTitleCase,
  dateInList,
  excludeArrayObject,
  filterNot,
  filterObjects,
  findError,
  firstNameLastName,
  formatDate,
  formatName,
  fullName,
  getSplitTime,
  initialiseName,
  padNumber,
  parseDate,
  parseISODate,
  removeUndefined,
  setAttribute,
  sliceArray,
  toDate,
  toDateString,
  toFixed,
  toMoney,
  toTimeItems,
} from '../utils/utils'
import config from '../config'
import { ApplicationInfo } from '../applicationInfo'
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
import { NameFormatStyle } from '../utils/helpers/nameFormatStyle'
import {
  DeallocateAfterAllocationDateOption,
  PrisonerSuspensionStatus,
} from '../routes/activities/manage-allocations/journey'
import { PaidType } from '../routes/activities/suspensions/handlers/viewSuspensions'
import { WaitingListStatus } from '../enum/waitingListStatus'
import logger from '../../logger'
import LocationType from '../enum/locationType'

export default function nunjucksSetup(
  app: express.Express,
  { ukBankHolidayService, applicationInfo }: Services,
): Router {
  const router = express.Router()

  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Activities and Appointments'
  app.locals.hmppsAuthUrl = config.apis.hmppsAuth.url
  app.locals.dpsUrl = config.dpsUrl
  app.locals.videoConferenceScheduleUrl = config.videoConferenceScheduleUrl
  app.locals.nonAssociationsUrl = config.nonAssociationsUrl
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

  registerNunjucks(applicationInfo, app)

  return router
}

export function registerNunjucks(applicationInfo?: ApplicationInfo, app?: express.Express): Environment {
  let assetManifest: Record<string, string> = {}

  try {
    const assetMetadataPath = path.resolve(__dirname, '../../assets/manifest.json')
    assetManifest = JSON.parse(fs.readFileSync(assetMetadataPath, 'utf8'))
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e, 'Could not read asset manifest file')
    }
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../views'),
      'node_modules/govuk-frontend/dist',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/@ministryofjustice/hmpps-digital-prison-reporting-frontend/',
      'node_modules/@ministryofjustice/hmpps-digital-prison-reporting-frontend/dpr/components/',
      'node_modules/@ministryofjustice/hmpps-connect-dps-components/dist/assets/',
    ],
    {
      autoescape: true,
      express: app,
      watch: process.env.NODE_ENV === 'live-development',
    },
  )

  setUpDprNunjucksFilters(njkEnv)

  // Only register nunjucks helpers/filters here - they should be implemented and unit tested elsewhere
  njkEnv.addFilter('formatName', (name, nameStyle, bold) => {
    const inputName = formatName(name.firstName, name.middleNames, name.lastName, nameStyle, bold)
    return inputName ? njkEnv.getFilter('safe')(inputName) : null
  })
  njkEnv.addFilter('fullName', fullName)
  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('assetMap', (url: string) => assetManifest[url] || url)
  njkEnv.addFilter('possessive', str => {
    if (!str) return ''
    return `${str}${str.toLowerCase().endsWith('s') ? '’' : '’s'}`
  })

  const {
    analytics: { tagManagerContainerId, tagManagerEnvironment },
  } = config

  njkEnv.addGlobal('tagManagerContainerId', tagManagerContainerId)
  njkEnv.addGlobal('tagManagerEnvironment', tagManagerEnvironment)

  njkEnv.addFilter('getSplitTime', getSplitTime)
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
  njkEnv.addFilter('toFixed', toFixed)
  njkEnv.addFilter('padNumber', padNumber)
  njkEnv.addFilter('toMoney', toMoney)
  njkEnv.addFilter('toTitleCase', convertToTitleCase)
  njkEnv.addFilter('toDate', toDate)
  njkEnv.addFilter('parseDate', parseDate)
  njkEnv.addFilter('parseISODate', parseISODate)
  njkEnv.addFilter('toDateString', toDateString)
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
  njkEnv.addGlobal('nonAssociationsUrl', config.nonAssociationsUrl)
  njkEnv.addGlobal('exampleDate', () => `29 9 ${formatDate(addYears(new Date(), 1), 'yyyy')}`)
  njkEnv.addGlobal('applicationInsightsConnectionString', process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  njkEnv.addGlobal('applicationInsightsRoleName', applicationInfo?.applicationName)
  njkEnv.addGlobal('isProduction', process.env.NODE_ENV === 'production')
  njkEnv.addGlobal('videoConferenceScheduleFeatureToggleEnabled', config.videoConferenceScheduleFeatureToggleEnabled)
  njkEnv.addGlobal('appointmentMultipleAttendanceToggleEnabled', config.appointmentMultipleAttendanceToggleEnabled)
  njkEnv.addGlobal('ScheduleChangeOption', ScheduleChangeOption)
  njkEnv.addGlobal('DefaultOrCustomTimes', DefaultOrCustomTimes)
  njkEnv.addGlobal('NameFormatStyle', NameFormatStyle)
  njkEnv.addGlobal('PrisonerSuspensionStatus', PrisonerSuspensionStatus)
  njkEnv.addGlobal('PaidType', PaidType)
  njkEnv.addGlobal('WaitingListStatus', WaitingListStatus)
  njkEnv.addGlobal('LocationType', LocationType)
  njkEnv.addGlobal('DeallocateAfterAllocationDateOption', DeallocateAfterAllocationDateOption)

  // Date picker
  njkEnv.addFilter('parseIsoDate', parseIsoDate)
  njkEnv.addFilter('isoDateToDatePickerDate', isoDateToDatePickerDate)
  njkEnv.addFilter('isoDateToTimePicker', isoDateToTimePicker)
  njkEnv.addGlobal('exampleDatePickerDate', () => `29/9/${formatDate(addYears(new Date(), 1), 'yyyy')}`)

  return njkEnv
}
