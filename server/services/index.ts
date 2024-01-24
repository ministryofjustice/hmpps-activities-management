import dataAccess from '../data'
import UserService from './userService'
import PrisonService from './prisonService'
import ActivitiesService from './activitiesService'
import BankHolidayService from './bankHolidayService'
import UnlockListService from './unlockListService'
import MetricsService from './metricsService'

export default function services() {
  const {
    hmppsAuthClient,
    prisonApiClient,
    prisonRegisterApiClient,
    prisonerSearchApiClient,
    incentivesApiClient,
    activitiesApiClient,
    applicationInsightsClient,
  } = dataAccess()

  return {
    userService: new UserService(hmppsAuthClient, prisonRegisterApiClient, activitiesApiClient),
    prisonService: new PrisonService(prisonApiClient, prisonerSearchApiClient, incentivesApiClient),
    activitiesService: new ActivitiesService(activitiesApiClient),
    ukBankHolidayService: new BankHolidayService(),
    unlockListService: new UnlockListService(prisonerSearchApiClient, activitiesApiClient),
    metricsService: new MetricsService(applicationInsightsClient),
  }
}

export type Services = ReturnType<typeof services>
