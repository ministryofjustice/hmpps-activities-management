import { defaultClient } from 'applicationinsights'
import dataAccess from '../data'
import UserService from './userService'
import PrisonService from './prisonService'
import ActivitiesService from './activitiesService'
import BankHolidayService from './bankHolidayService'
import UnlockListService from './unlockListService'
import MetricsService from './metricsService'

export default function services() {
  const { hmppsAuthClient, prisonApiClient, prisonerSearchApiClient, incentivesApiClient, activitiesApiClient } =
    dataAccess()

  return {
    userService: new UserService(hmppsAuthClient, prisonApiClient, activitiesApiClient),
    prisonService: new PrisonService(prisonApiClient, prisonerSearchApiClient, incentivesApiClient),
    activitiesService: new ActivitiesService(activitiesApiClient),
    ukBankHolidayService: new BankHolidayService(),
    unlockListService: new UnlockListService(prisonerSearchApiClient, activitiesApiClient),
    metricsService: new MetricsService(defaultClient),
  }
}

export type Services = ReturnType<typeof services>
