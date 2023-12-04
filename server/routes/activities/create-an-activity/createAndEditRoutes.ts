import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import CategoryRoutes, { Category } from './handlers/category'
import NameRoutes, { Name } from './handlers/name'
import { Services } from '../../../services'
import RiskLevelRoutes, { RiskLevel } from './handlers/riskLevel'
import PayRoutes, { Pay } from './handlers/pay'
import RemovePayRoutes, { ConfirmRemoveOptions } from './handlers/removePay'
import RemoveFlatRateRoutes from './handlers/removeFlatRate'
import QualificationRoutes, { Qualification } from './handlers/qualifications'
import EducationLevelRoutes, { EducationLevel } from './handlers/educationLevel'
import RemoveEducationLevelRoutes from './handlers/removeEducationLevel'
import CheckEducationLevelRoutes from './handlers/checkEducationLevels'
import StartDateRoutes, { StartDate } from './handlers/startDate'
import EndDateOptionRoutes, { EndDateOption } from './handlers/endDateOption'
import EndDateRoutes, { EndDate } from './handlers/endDate'
import DaysAndTimesRoutes, { DaysAndTimes } from './handlers/daysAndTimes'
import BankHolidayOptionRoutes, { BankHolidayOption } from './handlers/bankHoliday'
import LocationRoutes, { Location } from './handlers/location'
import CapacityRoutes, { Capacity } from './handlers/capacity'
import PayRateTypeRoutes, { PayRateType } from './handlers/payRateType'
import ScheduleFrequencyRoutes, { ScheduleFrequencyForm } from './handlers/scheduleFrequency'
import ConfirmCapacityRoutes from './handlers/confirmCapacity'
import CheckPayRoutes from './handlers/checkPay'
import TierRoutes, { TierForm } from './handlers/tier'
import OrganiserRoutes, { OrganiserForm } from './handlers/organiser'
import PayOption, { PayOptionForm } from './handlers/payOption'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('createJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const categoryHandler = new CategoryRoutes(activitiesService)
  const nameHandler = new NameRoutes(activitiesService)
  const tierHandler = new TierRoutes(activitiesService)
  const organiserHandler = new OrganiserRoutes(activitiesService)
  const riskLevelHandler = new RiskLevelRoutes(activitiesService)
  const payOption = new PayOption(activitiesService, prisonService)
  const payRateTypeHandler = new PayRateTypeRoutes()
  const payHandler = new PayRoutes(prisonService, activitiesService)
  const checkPayHandler = new CheckPayRoutes(activitiesService, prisonService)
  const removePayHandler = new RemovePayRoutes(activitiesService, prisonService)
  const removeFlatRateHandler = new RemoveFlatRateRoutes()
  const qualificationHandler = new QualificationRoutes()
  const educationLevelHandler = new EducationLevelRoutes(prisonService)
  const removeEducationLevelHandler = new RemoveEducationLevelRoutes()
  const checkEducationLevelHandler = new CheckEducationLevelRoutes(activitiesService)
  const startDateHandler = new StartDateRoutes(activitiesService)
  const endDateOptionHandler = new EndDateOptionRoutes()
  const endDateHandler = new EndDateRoutes(activitiesService)
  const scheduleFrequencyHandler = new ScheduleFrequencyRoutes()
  const daysAndTimesHandler = new DaysAndTimesRoutes(activitiesService)
  const bankHolidayHandler = new BankHolidayOptionRoutes(activitiesService)
  const locationHandler = new LocationRoutes(activitiesService, prisonService)
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
  get('/schedule-frequency', scheduleFrequencyHandler.GET, true)
  post('/schedule-frequency', scheduleFrequencyHandler.POST, ScheduleFrequencyForm)
  get('/days-and-times/:weekNumber(\\d+)', daysAndTimesHandler.GET, true)
  post('/days-and-times/:weekNumber(\\d+)', daysAndTimesHandler.POST, DaysAndTimes)
  get('/bank-holiday-option', bankHolidayHandler.GET, true)
  post('/bank-holiday-option', bankHolidayHandler.POST, BankHolidayOption)
  get('/location', locationHandler.GET, true)
  post('/location', locationHandler.POST, Location)
  get('/capacity', capacityHandler.GET, true)
  post('/capacity', capacityHandler.POST, Capacity)
  get('/confirm-capacity', confirmCapacityRouteHandler.GET)
  post('/confirm-capacity', confirmCapacityRouteHandler.POST)

  return router
}
