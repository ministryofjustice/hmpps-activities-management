import { RequestHandler, Router } from 'express'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import CategoryRoutes, { Category } from './handlers/category'
import NameRoutes, { Name } from './handlers/name'
import { Services } from '../../../services'
import RiskLevelRoutes, { RiskLevel } from './handlers/riskLevel'
import PayRoutes, { Pay } from './handlers/pay'
import PayAmountRoutes, { PayAmount } from './handlers/pay-amount'
import RemovePayRoutes, { ConfirmRemoveOptions } from './handlers/removePay'
import RemoveFlatRateRoutes from './handlers/removeFlatRate'
import QualificationRoutes, { Qualification } from './handlers/qualifications'
import EducationLevelRoutes, { EducationLevel } from './handlers/educationLevel'
import RemoveEducationLevelRoutes from './handlers/removeEducationLevel'
import CheckEducationLevelRoutes from './handlers/checkEducationLevels'
import StartDateRoutes, { StartDate } from './handlers/startDate'
import EndDateOptionRoutes, { EndDateOption } from './handlers/endDateOption'
import EndDateRoutes, { EndDate } from './handlers/endDate'
import DaysAndSessionsRoutes, { DaysAndSessions } from './handlers/daysAndSessions'
import BankHolidayOptionRoutes, { BankHolidayOption } from './handlers/bankHoliday'
import SessionTimesOptionRoutes, { SessionTimesOption } from './handlers/sessionTimesOption'
import LocationRoutes, { Location } from './handlers/location'
import CapacityRoutes, { Capacity } from './handlers/capacity'
import PayRateTypeRoutes, { PayRateType } from './handlers/payRateType'
import ScheduleFrequencyRoutes, { ScheduleFrequencyForm } from './handlers/scheduleFrequency'
import ConfirmCapacityRoutes from './handlers/confirmCapacity'
import CheckPayRoutes from './handlers/checkPay'
import TierRoutes, { TierForm } from './handlers/tier'
import OrganiserRoutes, { OrganiserForm } from './handlers/organiser'
import PayOption, { PayOptionForm } from './handlers/payOption'
import AttendanceRequired, { AttendanceRequiredForm } from './handlers/attendanceRequired'
import PayDateOptionRoutes, { PayDateOption } from './handlers/pay-date-option'
import PayCancelRoutes, { PayCancel } from './handlers/pay-cancel'
import RemoveEndDateRoutes, { RemoveEndDateOptions } from './handlers/removeEndDate'
import SessionTimesRoutes, { SessionTimes } from './handlers/sessionTimes'
import CustomTimesChangeOptionRoutes, { ScheduleOption } from './handlers/customTimesChangeOption'
import CustomTimesChangeDefaultOrCustomRoutes, {
  DefaultOrCustomOption,
} from './handlers/customTimesChangeDefaultOrCustom'

export default function Index({
  activitiesService,
  prisonService,
  locationsService,
  ukBankHolidayService,
}: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('createJourney', stepRequiresSession), handler)
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), handler)

  const categoryHandler = new CategoryRoutes(activitiesService)
  const nameHandler = new NameRoutes(activitiesService)
  const tierHandler = new TierRoutes(activitiesService)
  const organiserHandler = new OrganiserRoutes(activitiesService)
  const riskLevelHandler = new RiskLevelRoutes(activitiesService)
  const attendanceRequired = new AttendanceRequired(activitiesService)
  const payOption = new PayOption(activitiesService)
  const payRateTypeHandler = new PayRateTypeRoutes(prisonService)
  const payHandler = new PayRoutes(prisonService, activitiesService)
  const payAmountHandler = new PayAmountRoutes(prisonService, activitiesService)
  const payDateOptionHandler = new PayDateOptionRoutes(prisonService, activitiesService)
  const payCancelHandler = new PayCancelRoutes(activitiesService)
  const checkPayHandler = new CheckPayRoutes(prisonService, activitiesService)
  const removePayHandler = new RemovePayRoutes(activitiesService)
  const removeFlatRateHandler = new RemoveFlatRateRoutes()
  const qualificationHandler = new QualificationRoutes()
  const educationLevelHandler = new EducationLevelRoutes(prisonService)
  const removeEducationLevelHandler = new RemoveEducationLevelRoutes()
  const checkEducationLevelHandler = new CheckEducationLevelRoutes(activitiesService)
  const startDateHandler = new StartDateRoutes(activitiesService)
  const endDateOptionHandler = new EndDateOptionRoutes()
  const removeEndDateHandler = new RemoveEndDateRoutes(activitiesService)
  const endDateHandler = new EndDateRoutes(activitiesService, ukBankHolidayService)
  const scheduleFrequencyHandler = new ScheduleFrequencyRoutes()
  const daysAndSessionsHandler = new DaysAndSessionsRoutes(activitiesService)
  const bankHolidayHandler = new BankHolidayOptionRoutes(activitiesService)
  const sessionTimesOptionHandler = new SessionTimesOptionRoutes(activitiesService, ukBankHolidayService)
  const sessionTimesHandler = new SessionTimesRoutes(activitiesService)
  const customTimesChangeOptionHandler = new CustomTimesChangeOptionRoutes(activitiesService)
  const CustomTimesChangeDefaultOrCustomHandler = new CustomTimesChangeDefaultOrCustomRoutes(activitiesService)
  const locationHandler = new LocationRoutes(activitiesService, locationsService)
  const capacityHandler = new CapacityRoutes(activitiesService)
  const confirmCapacityRouteHandler = new ConfirmCapacityRoutes(activitiesService)

  get('/category', categoryHandler.GET, true)
  post('/category', categoryHandler.POST, Category)
  get('/name', nameHandler.GET, true)
  post('/name', nameHandler.POST, Name)
  get('/tier', tierHandler.GET, true)
  post('/tier', tierHandler.POST, TierForm)
  get('/organiser', organiserHandler.GET, true)
  post('/organiser', organiserHandler.POST, OrganiserForm)
  get('/risk-level', riskLevelHandler.GET, true)
  post('/risk-level', riskLevelHandler.POST, RiskLevel)
  get('/pay-option', payOption.GET, true)
  post('/pay-option', payOption.POST, PayOptionForm)
  get('/pay-rate-type', payRateTypeHandler.GET, true)
  post('/pay-rate-type', payRateTypeHandler.POST, PayRateType)
  get('/pay/:payRateType', payHandler.GET, true)
  post('/pay/:payRateType', payHandler.POST, Pay)
  get('/pay-amount/:payRateType', payAmountHandler.GET, true)
  post('/pay-amount/:payRateType', payAmountHandler.POST, PayAmount)
  get('/pay-date-option/:payRateType', payDateOptionHandler.GET, true)
  post('/pay-date-option/:payRateType', payDateOptionHandler.POST, PayDateOption)
  get('/pay-cancel/:payRateType', payCancelHandler.GET, true)
  post('/pay-cancel/:payRateType', payCancelHandler.POST, PayCancel)
  get('/check-pay', checkPayHandler.GET, true)
  post('/check-pay', checkPayHandler.POST)
  get('/remove-pay', removePayHandler.GET, true)
  post('/remove-pay', removePayHandler.POST, ConfirmRemoveOptions)
  get('/remove-flat-rate', removeFlatRateHandler.GET, true)
  post('/remove-flat-rate', removeFlatRateHandler.POST, ConfirmRemoveOptions)
  get('/qualification', qualificationHandler.GET, true)
  post('/qualification', qualificationHandler.POST, Qualification)
  get('/education-level', educationLevelHandler.GET, true)
  post('/education-level', educationLevelHandler.POST, EducationLevel)
  get('/remove-education-level', removeEducationLevelHandler.GET, true)
  get('/check-education-level', checkEducationLevelHandler.GET, true)
  post('/check-education-level', checkEducationLevelHandler.POST)
  get('/start-date', startDateHandler.GET, true)
  post('/start-date', startDateHandler.POST, StartDate)
  get('/end-date-option', endDateOptionHandler.GET, true)
  post('/end-date-option', endDateOptionHandler.POST, EndDateOption)
  get('/end-date', endDateHandler.GET, true)
  post('/end-date', endDateHandler.POST, EndDate)
  get('/remove-end-date', removeEndDateHandler.GET, true)
  post('/remove-end-date', removeEndDateHandler.POST, RemoveEndDateOptions)
  get('/schedule-frequency', scheduleFrequencyHandler.GET, true)
  post('/schedule-frequency', scheduleFrequencyHandler.POST, ScheduleFrequencyForm)
  get('/days-and-times/:weekNumber', daysAndSessionsHandler.GET, true)
  post('/days-and-times/:weekNumber', daysAndSessionsHandler.POST, DaysAndSessions)
  get('/bank-holiday-option', bankHolidayHandler.GET, true)
  post('/bank-holiday-option', bankHolidayHandler.POST, BankHolidayOption)
  get('/session-times-option/:weekNumber', sessionTimesOptionHandler.GET, true)
  post('/session-times-option/:weekNumber', sessionTimesOptionHandler.POST, SessionTimesOption)
  get('/session-times', sessionTimesHandler.GET, true)
  post('/session-times', sessionTimesHandler.POST, SessionTimes)
  get('/custom-times-change-option/:weekNumber', customTimesChangeOptionHandler.GET)
  post('/custom-times-change-option/:weekNumber', customTimesChangeOptionHandler.POST, ScheduleOption)
  get('/custom-times-change-default-or-custom/:weekNumber', CustomTimesChangeDefaultOrCustomHandler.GET)
  post(
    '/custom-times-change-default-or-custom/:weekNumber',
    CustomTimesChangeDefaultOrCustomHandler.POST,
    DefaultOrCustomOption,
  )
  get('/location', locationHandler.GET, true)
  post('/location', locationHandler.POST, Location)
  get('/capacity', capacityHandler.GET, true)
  post('/capacity', capacityHandler.POST, Capacity)
  get('/confirm-capacity', confirmCapacityRouteHandler.GET)
  post('/confirm-capacity', confirmCapacityRouteHandler.POST)
  get('/attendance-required', attendanceRequired.GET, true)
  post('/attendance-required', attendanceRequired.POST, AttendanceRequiredForm)

  return router
}
